import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/db';
import { aankondiging } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { getGemeenteContext } from '@/lib/gemeente';

/**
 * POST /api/gemeente/aankondigingen/[id]/afkeuren
 * 
 * Rejects an aankondiging (only for gemeente users)
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

    // 2. Get request body (required reason)
    const body = await request.json();
    const { reden } = body;

    if (!reden || !reden.trim()) {
      return NextResponse.json(
        { success: false, error: 'Reden voor afkeuring is verplicht' },
        { status: 400 }
      );
    }

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

    // 4. Update aankondiging: reject it
    await db
      .update(aankondiging)
      .set({
        valid: false,
        invalidReason: reden.trim(),
        gevalideerdOp: new Date(),
        gevalideerdDoor: userId,
        updatedAt: new Date(),
      })
      .where(eq(aankondiging.dossierId, id));

    return NextResponse.json({
      success: true,
      message: 'Aankondiging afgekeurd',
    });

  } catch (error) {
    console.error('Error rejecting aankondiging:', error);
    return NextResponse.json(
      { success: false, error: 'Er ging iets mis bij het afkeuren' },
      { status: 500 }
    );
  }
}

