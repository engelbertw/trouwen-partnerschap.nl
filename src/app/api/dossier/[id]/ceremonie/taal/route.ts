import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { ceremonie, dossier, locatie } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: dossierId } = await params;
    const body = await request.json();
    const { taal } = body;

    if (!taal) {
      return NextResponse.json(
        { success: false, error: 'Taal is verplicht' },
        { status: 400 }
      );
    }

    // Check if ceremonie exists
    const existingCeremonie = await db.query.ceremonie.findFirst({
      where: eq(ceremonie.dossierId, dossierId),
    });

    if (existingCeremonie) {
      // Update existing ceremonie
      const [updated] = await db
        .update(ceremonie)
        .set({
          taal,
          updatedAt: new Date(),
        })
        .where(eq(ceremonie.dossierId, dossierId))
        .returning();

      return NextResponse.json({ success: true, data: updated });
    } else {
      // Create ceremonie with taal (need locatie as it's required)
      const firstLocatie = await db.query.locatie.findFirst({
        where: eq(locatie.actief, true),
      });

      if (!firstLocatie) {
        return NextResponse.json(
          { success: false, error: 'Geen actieve locatie gevonden' },
          { status: 400 }
        );
      }

      // Get gemeente from dossier
      const dossierData = await db.query.dossier.findFirst({
        where: eq(dossier.id, dossierId),
      });

      if (!dossierData) {
        return NextResponse.json(
          { success: false, error: 'Dossier niet gevonden' },
          { status: 404 }
        );
      }

      // Calculate placeholder dates (1 year from now)
      const now = new Date();
      const placeholderDate = new Date(now);
      placeholderDate.setFullYear(placeholderDate.getFullYear() + 1);
      const wijzigbaarTot = new Date(placeholderDate);
      wijzigbaarTot.setDate(wijzigbaarTot.getDate() + 7); // 7 days before ceremony

      const [newCeremonie] = await db
        .insert(ceremonie)
        .values({
          dossierId,
          gemeenteOin: dossierData.gemeenteOin,
          locatieId: firstLocatie.id,
          taal,
          datum: placeholderDate.toISOString().split('T')[0], // YYYY-MM-DD format
          startTijd: '14:00:00', // Placeholder time
          eindTijd: '15:00:00', // Placeholder time
          wijzigbaarTot: wijzigbaarTot,
        })
        .returning();

      return NextResponse.json({ success: true, data: newCeremonie });
    }
  } catch (error) {
    console.error('Error saving taal:', error);
    return NextResponse.json(
      { success: false, error: 'Er ging iets mis bij het opslaan van de taal' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: dossierId } = await params;

    const existingCeremonie = await db.query.ceremonie.findFirst({
      where: eq(ceremonie.dossierId, dossierId),
    });

    if (existingCeremonie) {
      return NextResponse.json({
        success: true,
        data: { taal: existingCeremonie.taal },
      });
    } else {
      return NextResponse.json({
        success: true,
        data: { taal: null },
      });
    }
  } catch (error) {
    console.error('Error loading taal:', error);
    return NextResponse.json(
      { success: false, error: 'Er ging iets mis bij het ophalen van de taal' },
      { status: 500 }
    );
  }
}

