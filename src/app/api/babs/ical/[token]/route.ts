import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { babs, ceremonie, locatie, babsGemeente } from '@/db/schema';
import { eq, and, gte, lte, inArray } from 'drizzle-orm';
import { generateICalFeed } from '@/lib/ical-generator';

// Simple in-memory rate limiting (in production, use Redis or similar)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_MAX = 60; // 60 requests per hour
const RATE_LIMIT_WINDOW = 60 * 60 * 1000; // 1 hour in milliseconds

function checkRateLimit(token: string): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(token);

  if (!record || now > record.resetAt) {
    // Reset or create new record
    rateLimitMap.set(token, { count: 1, resetAt: now + RATE_LIMIT_WINDOW });
    return true;
  }

  if (record.count >= RATE_LIMIT_MAX) {
    return false; // Rate limit exceeded
  }

  record.count++;
  return true;
}

/**
 * GET /api/babs/ical/[token]
 * Generate iCal feed for BABS ceremonies
 * 
 * This endpoint is publicly accessible via token (no authentication required)
 * but the token must be valid and the feed must be enabled.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    // Rate limiting
    if (!checkRateLimit(token)) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again later.' },
        { status: 429 }
      );
    }

    // Validate token and get BABS data
    const [babsData] = await db
      .select({
        id: babs.id,
        naam: babs.naam,
        calendarFeedEnabled: babs.calendarFeedEnabled,
      })
      .from(babs)
      .where(eq(babs.calendarFeedToken, token))
      .limit(1);

    if (!babsData) {
      return NextResponse.json(
        { error: 'Invalid calendar feed token' },
        { status: 404 }
      );
    }

    // Check if feed is enabled
    if (babsData.calendarFeedEnabled === false) {
      return NextResponse.json(
        { error: 'Calendar feed is disabled' },
        { status: 403 }
      );
    }

    // Get date range (default: last 3 months to 1 year ahead)
    const now = new Date();
    const threeMonthsAgo = new Date(now);
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
    const oneYearAhead = new Date(now);
    oneYearAhead.setFullYear(oneYearAhead.getFullYear() + 1);

    // SECURITY: Get gemeenten for this BABS from babs_gemeente junction table
    const babsGemeentenData = await db
      .select({ gemeenteOin: babsGemeente.gemeenteOin })
      .from(babsGemeente)
      .where(
        and(
          eq(babsGemeente.babsId, babsData.id),
          eq(babsGemeente.actief, true)
        )
      );

    const gemeenteOins = babsGemeentenData.map(g => g.gemeenteOin);

    if (gemeenteOins.length === 0) {
      // BABS has no gemeenten linked, return empty calendar
      const icalContent = generateICalFeed([], babsData.naam);
      return new NextResponse(icalContent || 'BEGIN:VCALENDAR\nVERSION:2.0\nEND:VCALENDAR', {
        status: 200,
        headers: {
          'Content-Type': 'text/calendar; charset=utf-8',
          'Content-Disposition': `attachment; filename="babs-calendar-${babsData.id}.ics"`,
        },
      });
    }

    // Query ceremonies for this BABS, filtered by gemeente
    const ceremonies = await db
      .select({
        id: ceremonie.id,
        datum: ceremonie.datum,
        startTijd: ceremonie.startTijd,
        eindTijd: ceremonie.eindTijd,
        locatieNaam: locatie.naam,
        locatieAdres: locatie.adres,
      })
      .from(ceremonie)
      .innerJoin(locatie, eq(ceremonie.locatieId, locatie.id))
      .where(
        and(
          eq(ceremonie.babsId, babsData.id),
          inArray(ceremonie.gemeenteOin, gemeenteOins), // SECURITY: Filter by gemeente
          gte(ceremonie.datum, threeMonthsAgo.toISOString().split('T')[0]),
          lte(ceremonie.datum, oneYearAhead.toISOString().split('T')[0])
        )
      )
      .orderBy(ceremonie.datum, ceremonie.startTijd);

    // Format ceremonies for iCal generator
    const ceremonyEvents = ceremonies.map(c => ({
      id: c.id,
      datum: c.datum,
      startTijd: c.startTijd,
      eindTijd: c.eindTijd,
      locatieNaam: c.locatieNaam,
      locatieAdres: typeof c.locatieAdres === 'object' && c.locatieAdres !== null
        ? `${(c.locatieAdres as any).straat || ''} ${(c.locatieAdres as any).huisnummer || ''}, ${(c.locatieAdres as any).postcode || ''} ${(c.locatieAdres as any).plaats || ''}`.trim()
        : undefined,
    }));

    // Generate iCal feed
    const icalContent = generateICalFeed(ceremonyEvents, babsData.naam);

    if (!icalContent) {
      return NextResponse.json(
        { error: 'Failed to generate calendar feed' },
        { status: 500 }
      );
    }

    // Return iCal content with proper headers
    return new NextResponse(icalContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/calendar; charset=utf-8',
        'Content-Disposition': `attachment; filename="babs-calendar-${babsData.id}.ics"`,
        'Cache-Control': 'public, max-age=3600, s-maxage=3600', // Cache for 1 hour
      },
    });
  } catch (error) {
    console.error('Error generating iCal feed:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

