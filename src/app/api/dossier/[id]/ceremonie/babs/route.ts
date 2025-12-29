import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { ceremonie, locatie } from '@/db/schema';
import { eq } from 'drizzle-orm';

/**
 * PUT /api/dossier/[id]/ceremonie/babs
 * Save the selected BABS (or null to skip)
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: dossierId } = await params;
    const { babsId } = await request.json();

    // babsId can be null (user skipped) or a UUID string
    if (babsId !== null && typeof babsId !== 'string') {
      return NextResponse.json(
        { success: false, error: 'babsId moet een string of null zijn' },
        { status: 400 }
      );
    }

    // Check if ceremony record exists
    const [existingCeremonie] = await db
      .select()
      .from(ceremonie)
      .where(eq(ceremonie.dossierId, dossierId))
      .limit(1);

    if (existingCeremonie) {
      // Update existing ceremony
      const [updated] = await db
        .update(ceremonie)
        .set({ 
          babsId: babsId || null,
          updatedAt: new Date(),
        })
        .where(eq(ceremonie.id, existingCeremonie.id))
        .returning();

      return NextResponse.json({
        success: true,
        data: updated,
        message: babsId ? 'BABS opgeslagen' : 'BABS selectie overgeslagen',
      });
    } else {
      // Create new ceremony record with placeholder location
      const [firstLocation] = await db
        .select()
        .from(locatie)
        .where(eq(locatie.actief, true))
        .limit(1);

      if (!firstLocation) {
        return NextResponse.json(
          { success: false, error: 'Geen actieve locatie gevonden' },
          { status: 500 }
        );
      }

      const [created] = await db
        .insert(ceremonie)
        .values({
          dossierId,
          babsId: babsId || null,
          locatieId: firstLocation.id, // Placeholder
          status: 'concept',
        })
        .returning();

      return NextResponse.json({
        success: true,
        data: created,
        message: babsId ? 'BABS opgeslagen' : 'BABS selectie overgeslagen',
      });
    }
  } catch (error) {
    console.error('Error saving BABS:', error);
    return NextResponse.json(
      { success: false, error: 'Er ging iets mis bij het opslaan' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/dossier/[id]/ceremonie/babs
 * Get the saved BABS selection
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: dossierId } = await params;

    const [existingCeremonie] = await db
      .select({
        babsId: ceremonie.babsId,
      })
      .from(ceremonie)
      .where(eq(ceremonie.dossierId, dossierId))
      .limit(1);

    if (!existingCeremonie) {
      return NextResponse.json({
        success: true,
        data: { babsId: null },
      });
    }

    return NextResponse.json({
      success: true,
      data: { babsId: existingCeremonie.babsId },
    });
  } catch (error) {
    console.error('Error fetching BABS:', error);
    return NextResponse.json(
      { success: false, error: 'Er ging iets mis bij het ophalen' },
      { status: 500 }
    );
  }
}

