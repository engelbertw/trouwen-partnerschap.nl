import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/db';
import { dossier, ceremonie, gemeente, locatie } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { getGemeenteContext } from '@/lib/gemeente';

/**
 * PUT /api/dossier/[id]/ceremonie/datum-tijd
 * Save ceremony date and time (temporary, before ceremony is fully created)
 * This allows availability checks on subsequent pages
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
    const body = await request.json();
    const { datum, startTijd, duurMinuten = 60 } = body;

    // Validation
    if (!datum || !startTijd) {
      return NextResponse.json(
        { success: false, error: 'Datum en starttijd zijn verplicht' },
        { status: 400 }
      );
    }

    // Verify dossier exists and user owns it
    const [dossierData] = await db
      .select({
        id: dossier.id,
        gemeenteOin: dossier.gemeenteOin,
      })
      .from(dossier)
      .where(eq(dossier.id, dossierId))
      .limit(1);

    if (!dossierData) {
      return NextResponse.json(
        { success: false, error: 'Dossier niet gevonden' },
        { status: 404 }
      );
    }

    // Check if user owns this dossier
    const [dossierCheck] = await db
      .select()
      .from(dossier)
      .where(eq(dossier.id, dossierId))
      .limit(1);

    if (dossierCheck?.createdBy !== userId) {
      return NextResponse.json(
        { success: false, error: 'Geen toegang tot dit dossier' },
        { status: 403 }
      );
    }

    // Calculate end time
    const [hours, minutes] = startTijd.split(':').map(Number);
    const startTimeObj = new Date(`${datum}T${startTijd}:00`);
    const endTimeObj = new Date(startTimeObj.getTime() + duurMinuten * 60 * 1000);
    const eindTijd = `${String(endTimeObj.getHours()).padStart(2, '0')}:${String(endTimeObj.getMinutes()).padStart(2, '0')}`;

    // Check if ceremony already exists
    const [existingCeremonie] = await db
      .select()
      .from(ceremonie)
      .where(eq(ceremonie.dossierId, dossierId))
      .limit(1);

    if (existingCeremonie) {
      // Update existing ceremony date/time
      const [updated] = await db
        .update(ceremonie)
        .set({
          datum,
          startTijd,
          eindTijd,
          updatedAt: new Date(),
        })
        .where(eq(ceremonie.id, existingCeremonie.id))
        .returning();

      return NextResponse.json({
        success: true,
        data: {
          datum: updated.datum,
          startTijd: updated.startTijd,
          eindTijd: updated.eindTijd,
        },
      });
    }

    // No ceremony exists yet - create one with a placeholder location
    // Get the first active location as placeholder (locaties are shared across gemeenten)
    // This will be overwritten when user selects a location
    const [placeholderLocatie] = await db
      .select({ id: locatie.id })
      .from(locatie)
      .where(eq(locatie.actief, true))
      .limit(1);

    if (!placeholderLocatie) {
      return NextResponse.json(
        {
          success: false,
          error: 'Geen beschikbare locatie gevonden voor deze gemeente',
        },
        { status: 400 }
      );
    }

    // Calculate wijzigbaarTot (default: 7 days before ceremony date)
    const ceremonyDate = new Date(datum);
    const wijzigbaarTot = new Date(ceremonyDate);
    wijzigbaarTot.setDate(wijzigbaarTot.getDate() - 7);

    // Create ceremony record with date/time and placeholder location
    const [newCeremonie] = await db
      .insert(ceremonie)
      .values({
        dossierId,
        gemeenteOin: dossierData.gemeenteOin,
        locatieId: placeholderLocatie.id, // Placeholder - will be updated when user selects location
        datum,
        startTijd,
        eindTijd,
        wijzigbaarTot,
        // babsId will be set later when user selects BABS
        // wensen will be set later
      })
      .returning();

    return NextResponse.json({
      success: true,
      data: {
        datum: newCeremonie.datum,
        startTijd: newCeremonie.startTijd,
        eindTijd: newCeremonie.eindTijd,
      },
      message: 'Datum en tijd opgeslagen in database',
    });
  } catch (error) {
    console.error('Error saving ceremony date/time:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Er ging iets mis bij het opslaan van datum en tijd',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/dossier/[id]/ceremonie/datum-tijd
 * Get saved ceremony date and time
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

    // Verify dossier exists and user owns it
    const [dossierCheck] = await db
      .select()
      .from(dossier)
      .where(eq(dossier.id, dossierId))
      .limit(1);

    if (!dossierCheck || dossierCheck.createdBy !== userId) {
      return NextResponse.json(
        { success: false, error: 'Geen toegang tot dit dossier' },
        { status: 403 }
      );
    }

    // Get ceremony if it exists
    const [ceremonieData] = await db
      .select({
        datum: ceremonie.datum,
        startTijd: ceremonie.startTijd,
        eindTijd: ceremonie.eindTijd,
      })
      .from(ceremonie)
      .where(eq(ceremonie.dossierId, dossierId))
      .limit(1);

    if (ceremonieData) {
      return NextResponse.json({
        success: true,
        data: ceremonieData,
      });
    }

    // No ceremony data yet
    return NextResponse.json({
      success: true,
      data: null,
    });
  } catch (error) {
    console.error('Error fetching ceremony date/time:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Er ging iets mis bij het ophalen van datum en tijd',
      },
      { status: 500 }
    );
  }
}

