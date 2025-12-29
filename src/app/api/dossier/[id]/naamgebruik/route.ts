import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/db';
import { dossier, partner } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

/**
 * GET /api/dossier/[id]/naamgebruik
 * Fetch partner data for naamgebruik selection
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id: dossierId } = await context.params;

    // Verify dossier belongs to user
    const [dossierRecord] = await db
      .select()
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
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Fetch both partners
    const partners = await db
      .select()
      .from(partner)
      .where(eq(partner.dossierId, dossierId))
      .orderBy(partner.sequence);

    if (partners.length !== 2) {
      return NextResponse.json(
        { success: false, error: 'Beide partners moeten ingevuld zijn' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      partner1: {
        voornamen: partners[0].voornamen,
        voorvoegsel: partners[0].voorvoegsel,
        geslachtsnaam: partners[0].geslachtsnaam,
        naamgebruikKeuze: partners[0].naamgebruikKeuze,
      },
      partner2: {
        voornamen: partners[1].voornamen,
        voorvoegsel: partners[1].voorvoegsel,
        geslachtsnaam: partners[1].geslachtsnaam,
        naamgebruikKeuze: partners[1].naamgebruikKeuze,
      },
    });
  } catch (error) {
    console.error('Error fetching naamgebruik data:', error);
    return NextResponse.json(
      { success: false, error: 'Er ging iets mis bij het ophalen van de gegevens' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/dossier/[id]/naamgebruik
 * Save naamgebruik keuze for a partner
 */
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id: dossierId } = await context.params;
    const body = await request.json();
    const { partnerId, naamgebruikKeuze } = body;

    if (!partnerId || !naamgebruikKeuze) {
      return NextResponse.json(
        { success: false, error: 'PartnerId en naamgebruikKeuze zijn verplicht' },
        { status: 400 }
      );
    }

    if (![1, 2].includes(partnerId)) {
      return NextResponse.json(
        { success: false, error: 'PartnerId moet 1 of 2 zijn' },
        { status: 400 }
      );
    }

    if (!['eigen', 'partner', 'eigen_partner', 'partner_eigen'].includes(naamgebruikKeuze)) {
      return NextResponse.json(
        { success: false, error: 'Ongeldige naamgebruik keuze' },
        { status: 400 }
      );
    }

    // Verify dossier belongs to user
    const [dossierRecord] = await db
      .select()
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
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Update partner naamgebruik keuze
    await db
      .update(partner)
      .set({
        naamgebruikKeuze: naamgebruikKeuze,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(partner.dossierId, dossierId),
          eq(partner.sequence, partnerId)
        )
      );

    return NextResponse.json({
      success: true,
      message: 'Naamgebruik keuze opgeslagen',
    });
  } catch (error) {
    console.error('Error saving naamgebruik:', error);
    return NextResponse.json(
      { success: false, error: 'Er ging iets mis bij het opslaan' },
      { status: 500 }
    );
  }
}

