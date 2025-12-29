import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { sql } from 'drizzle-orm';
import { auth } from '@clerk/nextjs/server';
import { typeCeremonie, babs } from '@/db/schema';
import { eq } from 'drizzle-orm';

/**
 * GET /api/ceremonie/beschikbare-slots
 * Find available time slots where both BABS and location are available
 * 
 * Query parameters:
 * - locatieId: UUID of the location
 * - babsId: UUID of the BABS (optional if typeCeremonieId is provided)
 * - typeCeremonieId: UUID of the ceremony type (optional, for language matching)
 * - duurMinuten: Duration in minutes (default: 60)
 * - startDate: Start date (YYYY-MM-DD, default: today)
 * - endDate: End date (YYYY-MM-DD, default: 3 months from today)
 */
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const locatieId = searchParams.get('locatieId');
    const babsId = searchParams.get('babsId');
    const typeCeremonieId = searchParams.get('typeCeremonieId');
    const duurMinuten = parseInt(searchParams.get('duurMinuten') || '60');
    const startDate = searchParams.get('startDate') || new Date().toISOString().split('T')[0];
    const endDate = searchParams.get('endDate') || new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    // Validation
    if (!locatieId || !babsId) {
      return NextResponse.json(
        { success: false, error: 'locatieId en babsId zijn verplicht' },
        { status: 400 }
      );
    }

    if (duurMinuten < 15 || duurMinuten > 480) {
      return NextResponse.json(
        { success: false, error: 'duurMinuten moet tussen 15 en 480 liggen' },
        { status: 400 }
      );
    }

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(locatieId) || !uuidRegex.test(babsId)) {
      return NextResponse.json(
        { success: false, error: 'Ongeldig UUID formaat' },
        { status: 400 }
      );
    }

    // If typeCeremonieId is provided, check language matching
    if (typeCeremonieId) {
      if (!uuidRegex.test(typeCeremonieId)) {
        return NextResponse.json(
          { success: false, error: 'Ongeldig typeCeremonieId UUID formaat' },
          { status: 400 }
        );
      }

      // Fetch type ceremonie to get required languages
      const [typeCeremonieData] = await db
        .select({ talen: typeCeremonie.talen })
        .from(typeCeremonie)
        .where(eq(typeCeremonie.id, typeCeremonieId))
        .limit(1);

      if (!typeCeremonieData) {
        return NextResponse.json(
          { success: false, error: 'Type ceremonie niet gevonden' },
          { status: 404 }
        );
      }

      // Fetch BABS to get spoken languages
      const [babsData] = await db
        .select({ talen: babs.talen })
        .from(babs)
        .where(eq(babs.id, babsId))
        .limit(1);

      if (!babsData) {
        return NextResponse.json(
          { success: false, error: 'BABS niet gevonden' },
          { status: 404 }
        );
      }

      // Check if BABS speaks at least one required language
      const requiredTalen = Array.isArray(typeCeremonieData.talen) ? typeCeremonieData.talen : ['nl'];
      const babsTalen = Array.isArray(babsData.talen) ? babsData.talen : ['nl'];
      
      const hasMatchingLanguage = requiredTalen.some((taal: string) => babsTalen.includes(taal));
      
      if (!hasMatchingLanguage) {
        return NextResponse.json({
          success: true,
          data: [],
          count: 0,
          warning: `Deze BABS spreekt geen van de vereiste talen voor dit ceremonie type. Vereist: ${requiredTalen.join(', ')}, BABS spreekt: ${babsTalen.join(', ')}`,
        });
      }
    }

    // Call the database function
    const slots = await db.execute(
      sql`
        SELECT 
          datum,
          start_tijd,
          eind_tijd,
          locatie_naam,
          babs_naam
        FROM ihw.find_available_ceremony_slots(
          ${locatieId}::uuid,
          ${babsId}::uuid,
          ${duurMinuten}::integer,
          ${startDate}::date,
          ${endDate}::date
        )
      `
    );

    return NextResponse.json({
      success: true,
      data: slots.rows,
      count: slots.rows.length,
    });
  } catch (error) {
    console.error('Error fetching available slots:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Er ging iets mis bij het ophalen van beschikbare slots',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

