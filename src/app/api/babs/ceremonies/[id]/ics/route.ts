import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { ceremonie, locatie } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { getGemeenteContext, isBabsAdmin } from '@/lib/gemeente';
import { generateSingleCeremonyICal } from '@/lib/ical-generator';

/**
 * GET /api/babs/ceremonies/[id]/ics
 * Download iCal file for a single ceremony
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const context = await getGemeenteContext();
    if (!context.success) {
      return NextResponse.json(
        { success: false, error: context.error },
        { status: 401 }
      );
    }

    // Only BABS can download their own ceremonies
    if (!isBabsAdmin(context.data.rol) || !context.data.babsId) {
      return NextResponse.json(
        { success: false, error: 'Geen toegang' },
        { status: 403 }
      );
    }

    const { id } = await params;

    // Get ceremony details
    const [ceremonyData] = await db
      .select({
        id: ceremonie.id,
        babsId: ceremonie.babsId,
        datum: ceremonie.datum,
        startTijd: ceremonie.startTijd,
        eindTijd: ceremonie.eindTijd,
        locatieNaam: locatie.naam,
        locatieAdres: locatie.adres,
      })
      .from(ceremonie)
      .innerJoin(locatie, eq(ceremonie.locatieId, locatie.id))
      .where(eq(ceremonie.id, id))
      .limit(1);

    if (!ceremonyData) {
      return NextResponse.json(
        { success: false, error: 'Ceremonie niet gevonden' },
        { status: 404 }
      );
    }

    // Verify this ceremony belongs to the logged-in BABS
    if (ceremonyData.babsId !== context.data.babsId) {
      return NextResponse.json(
        { success: false, error: 'Geen toegang tot deze ceremonie' },
        { status: 403 }
      );
    }

    // Format location
    let location = ceremonyData.locatieNaam;
    if (ceremonyData.locatieAdres && typeof ceremonyData.locatieAdres === 'object') {
      const adres = ceremonyData.locatieAdres as any;
      const adresParts = [
        adres.straat,
        adres.huisnummer,
        adres.postcode,
        adres.plaats,
      ].filter(Boolean);
      if (adresParts.length > 0) {
        location = `${ceremonyData.locatieNaam}, ${adresParts.join(' ')}`;
      }
    }

    // Generate iCal
    const icsContent = generateSingleCeremonyICal({
      id: ceremonyData.id,
      datum: ceremonyData.datum,
      startTijd: ceremonyData.startTijd,
      eindTijd: ceremonyData.eindTijd,
      locatieNaam: ceremonyData.locatieNaam,
      locatieAdres: location,
    });

    if (!icsContent) {
      return NextResponse.json(
        { success: false, error: 'Kon iCal bestand niet genereren' },
        { status: 500 }
      );
    }

    // Return iCal file
    return new NextResponse(icsContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/calendar; charset=utf-8',
        'Content-Disposition': `attachment; filename="ceremonie-${ceremonyData.datum}-${ceremonyData.startTijd.replace(':', '')}.ics"`,
      },
    });
  } catch (error) {
    console.error('Error generating ceremony iCal:', error);
    return NextResponse.json(
      { success: false, error: 'Er ging iets mis' },
      { status: 500 }
    );
  }
}

