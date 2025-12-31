import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { typeCeremonie } from '@/db/schema';
import { asc, eq } from 'drizzle-orm';
import { getGemeenteContext, isAdmin } from '@/lib/gemeente';

/**
 * GET /api/gemeente/lookup/type-ceremonie
 * Returns all active ceremony types (shared across all gemeenten)
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

    // Type ceremonie is shared across all gemeenten, not per-gemeente
    // Only return active types
    // Explicitly select all fields including prijsCents
    const types = await db
      .select({
        id: typeCeremonie.id,
        code: typeCeremonie.code,
        naam: typeCeremonie.naam,
        omschrijving: typeCeremonie.omschrijving,
        uitgebreideOmschrijving: typeCeremonie.uitgebreideOmschrijving,
        eigenBabsToegestaan: typeCeremonie.eigenBabsToegestaan,
        gratis: typeCeremonie.gratis,
        budget: typeCeremonie.budget,
        prijsCents: typeCeremonie.prijsCents,
        openstellingWeken: typeCeremonie.openstellingWeken,
        leadTimeDays: typeCeremonie.leadTimeDays,
        wijzigbaarTotDays: typeCeremonie.wijzigbaarTotDays,
        maxGetuigen: typeCeremonie.maxGetuigen,
        duurMinuten: typeCeremonie.duurMinuten,
        talen: typeCeremonie.talen,
        actief: typeCeremonie.actief,
        volgorde: typeCeremonie.volgorde,
        createdAt: typeCeremonie.createdAt,
        updatedAt: typeCeremonie.updatedAt,
      })
      .from(typeCeremonie)
      .where(eq(typeCeremonie.actief, true))
      .orderBy(asc(typeCeremonie.volgorde), asc(typeCeremonie.naam));

    return NextResponse.json({
      success: true,
      data: types,
    });
  } catch (error) {
    console.error('Error fetching ceremony types:', error);
    return NextResponse.json(
      { success: false, error: 'Er ging iets mis bij het ophalen van ceremonie types' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/gemeente/lookup/type-ceremonie
 * Creates a new ceremony type (admin only)
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

    // Only admins can create ceremony types
    if (!isAdmin(context.data.rol)) {
      return NextResponse.json(
        { success: false, error: 'Alleen beheerders kunnen ceremonie types aanmaken' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { code, naam, omschrijving, uitgebreideOmschrijving, eigenBabsToegestaan, gratis, budget, prijsCents, openstellingWeken, leadTimeDays, wijzigbaarTotDays, maxGetuigen, duurMinuten, talen, actief, volgorde } = body;
    
    // Validatie: gratis ceremonies moeten prijs 0 hebben
    if (gratis && prijsCents !== undefined && prijsCents !== 0) {
      return NextResponse.json(
        { success: false, error: 'Gratis ceremonies moeten prijs 0 hebben' },
        { status: 400 }
      );
    }
    
    // Validatie: niet-gratis ceremonies moeten een prijs hebben
    if (!gratis && (!prijsCents || prijsCents < 0)) {
      return NextResponse.json(
        { success: false, error: 'Niet-gratis ceremonies moeten een prijs hebben (>= 0)' },
        { status: 400 }
      );
    }

    if (!code || !naam) {
      return NextResponse.json(
        { success: false, error: 'Code en naam zijn verplicht' },
        { status: 400 }
      );
    }

    // Validate talen
    const talenArray = Array.isArray(talen) ? talen : (talen ? JSON.parse(talen) : ['nl']);
    if (!Array.isArray(talenArray) || talenArray.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Minimaal 1 taal is vereist' },
        { status: 400 }
      );
    }

    const [newType] = await db
      .insert(typeCeremonie)
      .values({
        code,
        naam,
        omschrijving: omschrijving || null,
        uitgebreideOmschrijving: uitgebreideOmschrijving || null,
        eigenBabsToegestaan: eigenBabsToegestaan || false,
        gratis: gratis || false,
        budget: budget || false,
        prijsCents: gratis ? 0 : (prijsCents || 0),
        openstellingWeken: openstellingWeken || 6,
        leadTimeDays: leadTimeDays || 14,
        wijzigbaarTotDays: wijzigbaarTotDays || 7,
        maxGetuigen: maxGetuigen || 4,
        duurMinuten: duurMinuten || 60,
        talen: talenArray,
        actief: actief !== undefined ? actief : true,
        volgorde: volgorde || 1,
      })
      .returning();

    return NextResponse.json({
      success: true,
      data: newType,
    });
  } catch (error) {
    console.error('Error creating ceremony type:', error);
    return NextResponse.json(
      { success: false, error: 'Er ging iets mis bij het aanmaken van ceremonie type' },
      { status: 500 }
    );
  }
}
