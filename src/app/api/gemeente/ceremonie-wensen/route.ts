import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { ceremonieWens } from '@/db/schema';
import { asc, eq } from 'drizzle-orm';
import { getGemeenteContext, isAdmin } from '@/lib/gemeente';

/**
 * GET /api/gemeente/ceremonie-wensen
 * Get all ceremony wishes (for gemeente admin)
 */
export async function GET(request: NextRequest) {
  try {
    const context = await getGemeenteContext();
    if (!context.success || !isAdmin(context.data.rol)) {
      return NextResponse.json(
        { success: false, error: 'Geen toegang' },
        { status: 403 }
      );
    }

    const wensen = await db
      .select()
      .from(ceremonieWens)
      .orderBy(asc(ceremonieWens.volgorde), asc(ceremonieWens.naam));

    return NextResponse.json({
      success: true,
      data: wensen,
    });
  } catch (error) {
    console.error('Error fetching ceremony wishes:', error);
    return NextResponse.json(
      { success: false, error: 'Er ging iets mis' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/gemeente/ceremonie-wensen
 * Create a new ceremony wish
 */
export async function POST(request: NextRequest) {
  try {
    const context = await getGemeenteContext();
    if (!context.success || !isAdmin(context.data.rol)) {
      return NextResponse.json(
        { success: false, error: 'Geen toegang' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      code,
      naam,
      omschrijving,
      prijsEuro = '0.00',
      gratis = false,
      actief = true,
      volgorde = 0,
      beschikbaarVoorTypes = [],
    } = body;

    if (!code || !naam || !omschrijving) {
      return NextResponse.json(
        { success: false, error: 'Code, naam en omschrijving zijn verplicht' },
        { status: 400 }
      );
    }

    const [newWens] = await db
      .insert(ceremonieWens)
      .values({
        code: code.toUpperCase(),
        naam,
        omschrijving,
        prijsEuro,
        gratis,
        actief,
        volgorde,
        beschikbaarVoorTypes,
      })
      .returning();

    return NextResponse.json({
      success: true,
      data: newWens,
      message: 'Ceremoniewens aangemaakt',
    });
  } catch (error) {
    console.error('Error creating ceremony wish:', error);
    return NextResponse.json(
      { success: false, error: 'Er ging iets mis bij het aanmaken' },
      { status: 500 }
    );
  }
}

