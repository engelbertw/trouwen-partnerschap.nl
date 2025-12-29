import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/db';
import { aankondiging, dossier, dossierBlock, partner } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { getGemeenteContext } from '@/lib/gemeente';

/**
 * POST /api/gemeente/aankondigingen/[id]/goedkeuren
 * 
 * Approves an aankondiging (only for gemeente users)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 1. Check authentication and get gemeente context
    const context = await getGemeenteContext();
    if (!context.success) {
      return NextResponse.json(
        { success: false, error: context.error },
        { status: 401 }
      );
    }

    const { gemeenteOin, userId } = context.data;
    const { id } = await params;

    // 2. Get request body (optional force flag)
    const body = await request.json().catch(() => ({}));
    const { opmerkingen, force } = body;

    // 3. Verify aankondiging exists and belongs to this gemeente
    const [existingAankondiging] = await db
      .select()
      .from(aankondiging)
      .where(
        and(
          eq(aankondiging.dossierId, id),
          eq(aankondiging.gemeenteOin, gemeenteOin)
        )
      )
      .limit(1);

    if (!existingAankondiging) {
      return NextResponse.json(
        { success: false, error: 'Aankondiging niet gevonden' },
        { status: 404 }
      );
    }

    // 4. Update aankondiging: approve it (clear rejection reason)
    // If force=true, also clear all showstopper flags to bypass automatic validation
    const updateData: any = {
      valid: true,
      gevalideerdOp: new Date(),
      gevalideerdDoor: userId,
      invalidReason: null, // Clear any rejection reason
      updatedAt: new Date(),
    };

    // When forcing approval, clear all showstopper flags so the trigger won't reject it
    if (force === true) {
      updateData.reedsGehuwd = false;
      updateData.beidenNietWoonachtig = false;
      
      // ALSO clear puntouders flag on partner records
      // This ensures the trigger won't find ANY showstoppers
      await db
        .update(partner)
        .set({
          oudersOnbekend: false,
          updatedAt: new Date(),
        })
        .where(eq(partner.dossierId, id));
    }

    await db
      .update(aankondiging)
      .set(updateData)
      .where(eq(aankondiging.dossierId, id));

    // 5. Update dossier status to 'in_review' 
    // If dossier is 'draft' or 'rejected', move to 'in_review'
    // This allows forcing approval of rejected announcements
    await db
      .update(dossier)
      .set({
        status: 'in_review',
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(dossier.id, id),
          eq(dossier.gemeenteOin, gemeenteOin)
        )
      );

    // 6. Mark aankondiging block as complete
    await db
      .update(dossierBlock)
      .set({
        complete: true,
        completedAt: new Date(),
        completedBy: userId,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(dossierBlock.dossierId, id),
          eq(dossierBlock.code, 'aankondiging'),
          eq(dossierBlock.gemeenteOin, gemeenteOin)
        )
      );

    return NextResponse.json({
      success: true,
      message: 'Aankondiging goedgekeurd',
    });

  } catch (error) {
    console.error('Error approving aankondiging:', error);
    return NextResponse.json(
      { success: false, error: 'Er ging iets mis bij het goedkeuren' },
      { status: 500 }
    );
  }
}

