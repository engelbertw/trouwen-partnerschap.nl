import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { babs } from '@/db/schema';
import { eq, sql } from 'drizzle-orm';
import { getGemeenteContext, isBabsAdmin } from '@/lib/gemeente';
import { randomBytes } from 'crypto';

/**
 * GET /api/babs/calendar-token
 * Get or generate calendar feed token for BABS
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

    // Only BABS can access their own calendar token
    if (!isBabsAdmin(context.data.rol) || !context.data.babsId) {
      return NextResponse.json(
        { success: false, error: 'Geen toegang. Alleen BABS kunnen hun eigen calendar feed beheren.' },
        { status: 403 }
      );
    }

    const [babsData] = await db
      .select({
        id: babs.id,
        calendarFeedToken: babs.calendarFeedToken,
        calendarFeedEnabled: babs.calendarFeedEnabled,
        email: babs.email,
      })
      .from(babs)
      .where(eq(babs.id, context.data.babsId))
      .limit(1);

    if (!babsData) {
      return NextResponse.json(
        { success: false, error: 'BABS gegevens niet gevonden' },
        { status: 404 }
      );
    }

    // Generate token if it doesn't exist
    let token = babsData.calendarFeedToken;
    if (!token) {
      // Generate 256-bit token (64 hex characters)
      token = randomBytes(32).toString('hex');
      
      await db
        .update(babs)
        .set({
          calendarFeedToken: token,
          updatedAt: new Date(),
        })
        .where(eq(babs.id, context.data.babsId));
    }

    // Build calendar feed URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin;
    const calendarFeedUrl = `${baseUrl}/api/babs/ical/${token}`;

    return NextResponse.json({
      success: true,
      data: {
        token,
        calendarFeedUrl,
        enabled: babsData.calendarFeedEnabled ?? true,
        email: babsData.email,
      },
    });
  } catch (error) {
    console.error('Error fetching calendar token:', error);
    return NextResponse.json(
      { success: false, error: 'Er ging iets mis bij het ophalen van calendar token' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/babs/calendar-token
 * Regenerate calendar feed token
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

    // Only BABS can regenerate their own token
    if (!isBabsAdmin(context.data.rol) || !context.data.babsId) {
      return NextResponse.json(
        { success: false, error: 'Geen toegang. Alleen BABS kunnen hun eigen calendar token regenereren.' },
        { status: 403 }
      );
    }

    // Generate new 256-bit token
    const newToken = randomBytes(32).toString('hex');

    const [updated] = await db
      .update(babs)
      .set({
        calendarFeedToken: newToken,
        updatedAt: new Date(),
      })
      .where(eq(babs.id, context.data.babsId))
      .returning({
        id: babs.id,
        calendarFeedToken: babs.calendarFeedToken,
        calendarFeedEnabled: babs.calendarFeedEnabled,
      });

    if (!updated) {
      return NextResponse.json(
        { success: false, error: 'BABS niet gevonden' },
        { status: 404 }
      );
    }

    // Build new calendar feed URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin;
    const calendarFeedUrl = `${baseUrl}/api/babs/ical/${newToken}`;

    return NextResponse.json({
      success: true,
      data: {
        token: newToken,
        calendarFeedUrl,
        enabled: updated.calendarFeedEnabled ?? true,
      },
      message: 'Calendar token succesvol geregenereerd',
    });
  } catch (error) {
    console.error('Error regenerating calendar token:', error);
    return NextResponse.json(
      { success: false, error: 'Er ging iets mis bij het regenereren van calendar token' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/babs/calendar-token
 * Disable calendar feed (sets enabled to false)
 */
export async function DELETE(request: NextRequest) {
  try {
    const context = await getGemeenteContext();
    if (!context.success) {
      return NextResponse.json(
        { success: false, error: context.error },
        { status: 401 }
      );
    }

    // Only BABS can disable their own feed
    if (!isBabsAdmin(context.data.rol) || !context.data.babsId) {
      return NextResponse.json(
        { success: false, error: 'Geen toegang. Alleen BABS kunnen hun eigen calendar feed uitschakelen.' },
        { status: 403 }
      );
    }

    const [updated] = await db
      .update(babs)
      .set({
        calendarFeedEnabled: false,
        updatedAt: new Date(),
      })
      .where(eq(babs.id, context.data.babsId))
      .returning({
        id: babs.id,
        calendarFeedEnabled: babs.calendarFeedEnabled,
      });

    if (!updated) {
      return NextResponse.json(
        { success: false, error: 'BABS niet gevonden' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Calendar feed uitgeschakeld',
    });
  } catch (error) {
    console.error('Error disabling calendar feed:', error);
    return NextResponse.json(
      { success: false, error: 'Er ging iets mis bij het uitschakelen van calendar feed' },
      { status: 500 }
    );
  }
}

