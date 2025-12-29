import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { babs, ceremonie, locatie } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { notifyBabsNewCeremony } from '@/lib/email-notifications';

/**
 * POST /api/babs/notify
 * Webhook endpoint to send email notification when BABS is assigned to ceremony
 * 
 * This endpoint can be called:
 * 1. Directly from application code after ceremony assignment
 * 2. Via database trigger using pg_notify (requires background worker)
 * 3. Via scheduled job that checks for new assignments
 * 
 * Request body:
 * {
 *   "babs_id": "uuid",
 *   "ceremony_id": "uuid"
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { babs_id, ceremony_id } = body;

    if (!babs_id || !ceremony_id) {
      return NextResponse.json(
        { success: false, error: 'babs_id and ceremony_id are required' },
        { status: 400 }
      );
    }

    // Get BABS email
    const [babsData] = await db
      .select({
        id: babs.id,
        email: babs.email,
        naam: babs.naam,
      })
      .from(babs)
      .where(eq(babs.id, babs_id))
      .limit(1);

    if (!babsData) {
      return NextResponse.json(
        { success: false, error: 'BABS not found' },
        { status: 404 }
      );
    }

    // Skip if no email configured
    if (!babsData.email) {
      return NextResponse.json({
        success: true,
        message: 'Notification skipped: BABS has no email configured',
      });
    }

    // Get ceremony details
    const [ceremonyData] = await db
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
      .where(eq(ceremonie.id, ceremony_id))
      .limit(1);

    if (!ceremonyData) {
      return NextResponse.json(
        { success: false, error: 'Ceremony not found' },
        { status: 404 }
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

    // Format time
    const timeStr = `${ceremonyData.startTijd} - ${ceremonyData.eindTijd}`;

    // Send email notification
    const result = await notifyBabsNewCeremony(
      babsData.email,
      ceremonyData.datum,
      timeStr,
      location
    );

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Notification sent successfully',
    });
  } catch (error) {
    console.error('Error in notification endpoint:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

