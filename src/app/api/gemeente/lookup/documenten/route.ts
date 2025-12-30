import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { documentOptie } from '@/db/schema';
import { eq, and, asc } from 'drizzle-orm';
import { getGemeenteContext, isAdmin } from '@/lib/gemeente';

/**
 * GET /api/gemeente/lookup/documenten
 * Returns all document options for the current gemeente
 */
export async function GET(request: NextRequest) {
  try {
    console.log('[API /documenten] GET request received');
    const context = await getGemeenteContext();
    console.log('[API /documenten] Context:', context);
    
    if (!context.success) {
      console.error('[API /documenten] Context failed:', context.error);
      return NextResponse.json(
        { success: false, error: context.error },
        { status: 401 }
      );
    }

    const gemeenteOin = context.data.gemeenteOin;
    console.log('[API /documenten] Fetching for gemeente:', gemeenteOin);
    
    const documenten = await db
      .select()
      .from(documentOptie)
      .where(eq(documentOptie.gemeenteOin, gemeenteOin))
      .orderBy(asc(documentOptie.volgorde), asc(documentOptie.naam));

    console.log('[API /documenten] Found documents:', documenten.length);
    if (documenten.length > 0) {
      console.log('[API /documenten] First document:', JSON.stringify(documenten[0], null, 2));
    }

    return NextResponse.json({
      success: true,
      data: documenten,
    });
  } catch (error) {
    console.error('[API /documenten] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Er ging iets mis bij het ophalen van documentopties' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/gemeente/lookup/documenten
 * Creates a new document option
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
    const { code, naam, omschrijving, papierType, prijsCents, gratis, verplicht, actief, volgorde } = body;

    if (!code || !naam || !papierType) {
      return NextResponse.json(
        { success: false, error: 'Code, naam en papierType zijn verplicht' },
        { status: 400 }
      );
    }

    // Validate gratis/prijs logic
    if (gratis && prijsCents > 0) {
      return NextResponse.json(
        { success: false, error: 'Gratis documenten kunnen geen prijs hebben' },
        { status: 400 }
      );
    }

    const [newDocument] = await db
      .insert(documentOptie)
      .values({
        gemeenteOin: context.data.gemeenteOin,
        code,
        naam,
        omschrijving: omschrijving || null,
        papierType,
        prijsCents: prijsCents || 0,
        gratis: gratis || false,
        verplicht: verplicht || false,
        actief: actief !== undefined ? actief : true,
        volgorde: volgorde || 1,
      })
      .returning();

    return NextResponse.json({
      success: true,
      data: newDocument,
    });
  } catch (error) {
    console.error('Error creating document option:', error);
    return NextResponse.json(
      { success: false, error: 'Er ging iets mis bij het aanmaken van documentoptie' },
      { status: 500 }
    );
  }
}

