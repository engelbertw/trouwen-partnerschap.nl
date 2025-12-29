import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/db';
import { aankondiging, dossier, dossierBlock } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

/**
 * PUT /api/dossier/[id]/aankondiging
 * 
 * Updates aankondiging type (huwelijk vs partnerschap)
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 1. Check authentication
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Niet geautoriseerd' },
        { status: 401 }
      );
    }

    const { id: dossierId } = await params;

    // 2. Get request data
    const body = await request.json();
    const { type } = body; // 'huwelijk' or 'partnerschap'

    if (!type || (type !== 'huwelijk' && type !== 'partnerschap')) {
      return NextResponse.json(
        { success: false, error: 'Ongeldig type' },
        { status: 400 }
      );
    }

    // 3. Verify dossier exists and belongs to user
    const [existingDossier] = await db
      .select()
      .from(dossier)
      .where(eq(dossier.id, dossierId))
      .limit(1);

    if (!existingDossier) {
      return NextResponse.json(
        { success: false, error: 'Dossier niet gevonden' },
        { status: 404 }
      );
    }

    if (existingDossier.createdBy !== userId) {
      return NextResponse.json(
        { success: false, error: 'Geen toegang tot dit dossier' },
        { status: 403 }
      );
    }

    // 4. Update or insert aankondiging
    const gemeenteOin = existingDossier.gemeenteOin;
    
    const [existingAankondiging] = await db
      .select()
      .from(aankondiging)
      .where(eq(aankondiging.dossierId, dossierId))
      .limit(1);

    if (existingAankondiging) {
      // Update existing
      await db
        .update(aankondiging)
        .set({
          partnerschap: type === 'partnerschap',
          updatedAt: new Date(),
        })
        .where(eq(aankondiging.dossierId, dossierId));
    } else {
      // Insert new
      await db.insert(aankondiging).values({
        dossierId,
        gemeenteOin,
        partnerschap: type === 'partnerschap',
        reedsGehuwd: false,
        omzetting: false,
        beidenNietWoonachtig: false,
        valid: true,
      });
    }

    // 5. Update dossier block status
    await db
      .update(dossierBlock)
      .set({
        complete: true,
        completedAt: new Date(),
        completedBy: userId,
      })
      .where(
        and(
          eq(dossierBlock.dossierId, dossierId),
          eq(dossierBlock.code, 'aankondiging')
        )
      );

    return NextResponse.json({
      success: true,
      message: 'Aankondiging type opgeslagen',
    });

  } catch (error) {
    console.error('Error updating aankondiging:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Er ging iets mis bij het opslaan',
        details: process.env.NODE_ENV === 'development' ? String(error) : undefined,
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/dossier/[id]/aankondiging
 * 
 * Gets aankondiging data for a dossier
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Niet geautoriseerd' },
        { status: 401 }
      );
    }

    const { id: dossierId } = await params;

    // Verify access
    const [existingDossier] = await db
      .select()
      .from(dossier)
      .where(eq(dossier.id, dossierId))
      .limit(1);

    if (!existingDossier || existingDossier.createdBy !== userId) {
      return NextResponse.json(
        { success: false, error: 'Geen toegang' },
        { status: 403 }
      );
    }

    // Get aankondiging
    const [result] = await db
      .select()
      .from(aankondiging)
      .where(eq(aankondiging.dossierId, dossierId))
      .limit(1);

    return NextResponse.json({
      success: true,
      data: result || null,
    });

  } catch (error) {
    console.error('Error fetching aankondiging:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Er ging iets mis',
      },
      { status: 500 }
    );
  }
}

