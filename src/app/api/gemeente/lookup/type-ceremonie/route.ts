import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { typeCeremonie } from '@/db/schema';
import { asc, eq } from 'drizzle-orm';
import { getGemeenteContext, isSystemAdmin } from '@/lib/gemeente';

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
    const types = await db
      .select()
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
 * Creates a new ceremony type (system admin only)
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

    if (!isSystemAdmin(context.data.rol)) {
      return NextResponse.json(
        { success: false, error: 'Alleen systeembeheerders hebben toegang' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { code, naam, omschrijving, uitgebreideOmschrijving, eigenBabsToegestaan, gratis, budget, openstellingWeken, leadTimeDays, wijzigbaarTotDays, maxGetuigen, duurMinuten, talen, actief, volgorde } = body;

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
