import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { ceremonie, locatie } from '@/db/schema';
import { eq, and, gte, lte, desc, inArray } from 'drizzle-orm';
import { getGemeenteContext, isBabsAdmin } from '@/lib/gemeente';

/**
 * GET /api/babs/ceremonies
 * Get list of ceremonies assigned to the logged-in BABS
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

    // Only BABS can access their own ceremonies
    if (!isBabsAdmin(context.data.rol) || !context.data.babsId) {
      return NextResponse.json(
        { success: false, error: 'Geen toegang. Alleen BABS kunnen hun eigen ceremonies bekijken.' },
        { status: 403 }
      );
    }

    // Get query parameters for filtering
    const { searchParams } = new URL(request.url);
    const fromDate = searchParams.get('from'); // YYYY-MM-DD
    const toDate = searchParams.get('to'); // YYYY-MM-DD

    // SECURITY: BABS can only see ceremonies from gemeenten they are linked to
    const babsGemeenten = context.data.babsGemeenten || [];
    if (babsGemeenten.length === 0) {
      return NextResponse.json({
        success: true,
        data: [],
        count: 0,
        message: 'Geen gemeenten gekoppeld aan deze BABS',
      });
    }

    // Build query conditions
    const conditions = [
      eq(ceremonie.babsId, context.data.babsId),
      inArray(ceremonie.gemeenteOin, babsGemeenten), // SECURITY: Filter by gemeente
    ];

    // Add date filters if provided
    if (fromDate) {
      conditions.push(gte(ceremonie.datum, fromDate));
    }
    if (toDate) {
      conditions.push(lte(ceremonie.datum, toDate));
    }

    // Query ceremonies with location details
    const ceremonies = await db
      .select({
        id: ceremonie.id,
        dossierId: ceremonie.dossierId,
        datum: ceremonie.datum,
        startTijd: ceremonie.startTijd,
        eindTijd: ceremonie.eindTijd,
        locatieId: ceremonie.locatieId,
        locatieNaam: locatie.naam,
        locatieAdres: locatie.adres,
        taal: ceremonie.taal,
        trouwboekje: ceremonie.trouwboekje,
        speech: ceremonie.speech,
        geboektOp: ceremonie.geboektOp,
      })
      .from(ceremonie)
      .innerJoin(locatie, eq(ceremonie.locatieId, locatie.id))
      .where(and(...conditions))
      .orderBy(desc(ceremonie.datum), desc(ceremonie.startTijd));

    // Format response
    const formatted = ceremonies.map(c => ({
      id: c.id,
      dossierId: c.dossierId,
      datum: c.datum,
      startTijd: c.startTijd,
      eindTijd: c.eindTijd,
      locatieNaam: c.locatieNaam,
      locatieAdres: c.locatieAdres,
      taal: c.taal,
      trouwboekje: c.trouwboekje,
      speech: c.speech,
      geboektOp: c.geboektOp?.toISOString(),
      // Determine status based on date
      status: new Date(c.datum) < new Date() ? 'voltooid' : 'gepland',
    }));

    return NextResponse.json({
      success: true,
      data: formatted,
      count: formatted.length,
    });
  } catch (error) {
    console.error('Error fetching BABS ceremonies:', error);
    return NextResponse.json(
      { success: false, error: 'Er ging iets mis bij het ophalen van ceremonies' },
      { status: 500 }
    );
  }
}

