import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { locatie } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { getGemeenteContext, isAdmin } from '@/lib/gemeente';

/**
 * GET /api/gemeente/lookup/locaties
 * Returns all locaties (lookup table - gemeente-wide, not filtered by OIN)
 */
export async function GET(request: NextRequest) {
  try {
    const context = await getGemeenteContext();
    if (!context.success) {
      return NextResponse.json(
        { success: false, error: context.error },
        { status: 401 }
      );
    }

    const locaties = await db
      .select({
        id: locatie.id,
        code: locatie.code,
        naam: locatie.naam,
        type: locatie.type,
        adres: locatie.adres,
        afbeeldingUrl: locatie.afbeeldingUrl,
        capaciteit: locatie.capaciteit,
        actief: locatie.actief,
        prijsCents: locatie.prijsCents,
        toelichting: locatie.toelichting,
        volgorde: locatie.volgorde,
        beschikbaarheid: locatie.beschikbaarheid,
        beschikbaarVanaf: locatie.beschikbaarVanaf,
        beschikbaarTot: locatie.beschikbaarTot,
        opmerkingBeschikbaarheid: locatie.opmerkingBeschikbaarheid,
        email: locatie.email,
        calendarFeedEnabled: locatie.calendarFeedEnabled,
        createdAt: locatie.createdAt,
        updatedAt: locatie.updatedAt,
      })
      .from(locatie)
      .orderBy(locatie.volgorde, locatie.naam);

    return NextResponse.json({
      success: true,
      data: locaties,
    });
  } catch (error) {
    console.error('Error fetching locaties:', error);
    // Log more details for debugging
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    return NextResponse.json(
      { 
        success: false, 
        error: 'Er ging iets mis bij het ophalen van locaties',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/gemeente/lookup/locaties
 * Creates a new locatie
 */
export async function POST(request: NextRequest) {
  try {
    const context = await getGemeenteContext();
    if (!context.success) {
      return NextResponse.json(
        { success: false, error: context.error },
        { status: 401 }
      );
    }

    if (!isAdmin(context.data.rol)) {
      return NextResponse.json(
        { success: false, error: 'Geen toegang' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { code, naam, type, adres, afbeeldingUrl, capaciteit, prijsCents, toelichting, actief, volgorde } = body;

    if (!code || !naam || !type) {
      return NextResponse.json(
        { success: false, error: 'Code, naam en type zijn verplicht' },
        { status: 400 }
      );
    }

    const [newLocatie] = await db
      .insert(locatie)
      .values({
        code,
        naam,
        type,
        adres: adres || null,
        afbeeldingUrl: afbeeldingUrl || null,
        capaciteit: capaciteit || 50,
        prijsCents: prijsCents || 0,
        toelichting: toelichting || null,
        actief: actief !== undefined ? actief : true,
        volgorde: volgorde || 0,
      })
      .returning();

    return NextResponse.json({
      success: true,
      data: newLocatie,
    });
  } catch (error) {
    console.error('Error creating locatie:', error);
    return NextResponse.json(
      { success: false, error: 'Er ging iets mis bij het aanmaken van locatie' },
      { status: 500 }
    );
  }
}

