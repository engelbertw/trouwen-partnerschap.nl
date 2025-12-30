import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { ceremonie, locatie, dossier } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { auth } from '@clerk/nextjs/server';

/**
 * PUT /api/dossier/[id]/ceremonie/locatie
 * Save the selected location
 */
export async function PUT(
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
    const { locatieId } = await request.json();

    if (!locatieId || typeof locatieId !== 'string') {
      return NextResponse.json(
        { success: false, error: 'locatieId is verplicht' },
        { status: 400 }
      );
    }

    const [dossierRecord] = await db
      .select({
        id: dossier.id,
        createdBy: dossier.createdBy,
        gemeenteOin: dossier.gemeenteOin,
      })
      .from(dossier)
      .where(eq(dossier.id, dossierId))
      .limit(1);

    if (!dossierRecord) {
      return NextResponse.json(
        { success: false, error: 'Dossier niet gevonden' },
        { status: 404 }
      );
    }

    if (dossierRecord.createdBy !== userId) {
      return NextResponse.json(
        { success: false, error: 'Geen toegang tot dit dossier' },
        { status: 403 }
      );
    }

    // Verify location exists
    const [locationExists] = await db
      .select()
      .from(locatie)
      .where(eq(locatie.id, locatieId))
      .limit(1);

    if (!locationExists) {
      return NextResponse.json(
        { success: false, error: 'Locatie niet gevonden' },
        { status: 404 }
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
          locatieId,
          updatedAt: new Date(),
        })
        .where(eq(ceremonie.id, existingCeremonie.id))
        .returning();

      return NextResponse.json({
        success: true,
        data: updated,
        message: 'Locatie opgeslagen',
      });
    } else {
      // Calculate placeholder dates (1 year from now)
      const now = new Date();
      const placeholderDate = new Date(now);
      placeholderDate.setFullYear(placeholderDate.getFullYear() + 1);
      const wijzigbaarTot = new Date(placeholderDate);
      wijzigbaarTot.setDate(wijzigbaarTot.getDate() + 7); // 7 days before ceremony

      // Create new ceremony record
      const [created] = await db
        .insert(ceremonie)
        .values({
          dossierId,
          gemeenteOin: dossierRecord.gemeenteOin,
          locatieId,
          datum: placeholderDate.toISOString().split('T')[0], // YYYY-MM-DD format
          startTijd: '14:00:00', // Placeholder time
          eindTijd: '15:00:00', // Placeholder time
          wijzigbaarTot: wijzigbaarTot,
        })
        .returning();

      return NextResponse.json({
        success: true,
        data: created,
        message: 'Locatie opgeslagen',
      });
    }
  } catch (error) {
    console.error('Error saving location:', error);
    return NextResponse.json(
      { success: false, error: 'Er ging iets mis bij het opslaan' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/dossier/[id]/ceremonie/locatie
 * Get the saved location
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

    const [dossierRecord] = await db
      .select({ createdBy: dossier.createdBy })
      .from(dossier)
      .where(eq(dossier.id, dossierId))
      .limit(1);

    if (!dossierRecord) {
      return NextResponse.json(
        { success: false, error: 'Dossier niet gevonden' },
        { status: 404 }
      );
    }

    if (dossierRecord.createdBy !== userId) {
      return NextResponse.json(
        { success: false, error: 'Geen toegang tot dit dossier' },
        { status: 403 }
      );
    }

    const [existingCeremonie] = await db
      .select({
        locatieId: ceremonie.locatieId,
      })
      .from(ceremonie)
      .where(eq(ceremonie.dossierId, dossierId))
      .limit(1);

    if (!existingCeremonie) {
      return NextResponse.json({
        success: true,
        data: { locatieId: null },
      });
    }

    return NextResponse.json({
      success: true,
      data: { locatieId: existingCeremonie.locatieId },
    });
  } catch (error) {
    console.error('Error fetching location:', error);
    return NextResponse.json(
      { success: false, error: 'Er ging iets mis bij het ophalen' },
      { status: 500 }
    );
  }
}

