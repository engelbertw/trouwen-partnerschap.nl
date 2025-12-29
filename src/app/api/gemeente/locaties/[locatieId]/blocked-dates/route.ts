import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { locatieBlockedDate } from '@/db/schema';
import { eq, and, gte, lte } from 'drizzle-orm';
import { getGemeenteContext, isAdmin, isLocatieAdmin } from '@/lib/gemeente';

/**
 * GET /api/gemeente/locaties/[locatieId]/blocked-dates
 * Get all blocked dates for a locatie (optionally filtered by date range)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ locatieId: string }> }
) {
  try {
    const context = await getGemeenteContext();
    if (!context.success) {
      return NextResponse.json(
        { success: false, error: context.error },
        { status: 401 }
      );
    }

    const resolvedParams = await params;
    const { locatieId } = resolvedParams;
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Build where conditions
    const whereConditions = [eq(locatieBlockedDate.locatieId, locatieId)];
    
    // Filter by date range if provided
    if (startDate && endDate) {
      whereConditions.push(
        gte(locatieBlockedDate.blockedDate, startDate),
        lte(locatieBlockedDate.blockedDate, endDate)
      );
    }

    const blockedDates = await db
      .select()
      .from(locatieBlockedDate)
      .where(and(...whereConditions))
      .orderBy(locatieBlockedDate.blockedDate);

    return NextResponse.json({
      success: true,
      data: blockedDates,
    });
  } catch (error) {
    console.error('Error fetching blocked dates:', error);
    return NextResponse.json(
      { success: false, error: 'Er ging iets mis bij het ophalen van geblokkeerde datums' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/gemeente/locaties/[locatieId]/blocked-dates
 * Block a date (or time slot)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ locatieId: string }> }
) {
  try {
    const context = await getGemeenteContext();
    if (!context.success) {
      return NextResponse.json(
        { success: false, error: context.error },
        { status: 401 }
      );
    }

    const resolvedParams = await params;
    const { locatieId } = resolvedParams;

    // Check authorization:
    // - Admins can manage any locatie
    // - Locatie admins can only manage their own availability
    const canManage = 
      isAdmin(context.data.rol) || 
      (isLocatieAdmin(context.data.rol) && context.data.locatieId === locatieId);
    
    if (!canManage) {
      return NextResponse.json(
        { success: false, error: 'Geen toegang - u kunt alleen uw eigen beschikbaarheid beheren' },
        { status: 403 }
      );
    }

    const body = await request.json();

    const { blockedDate, allDay, startTime, endTime, reason } = body;

    // Validation
    if (!blockedDate) {
      return NextResponse.json(
        { success: false, error: 'Datum is verplicht' },
        { status: 400 }
      );
    }

    if (!allDay && (!startTime || !endTime)) {
      return NextResponse.json(
        { success: false, error: 'Start- en eindtijd zijn verplicht voor tijdslots' },
        { status: 400 }
      );
    }

    const [newBlock] = await db
      .insert(locatieBlockedDate)
      .values({
        locatieId,
        blockedDate,
        allDay: allDay ?? true,
        startTime: startTime ?? null,
        endTime: endTime ?? null,
        reason: reason ?? null,
        createdBy: context.data.userId,
      })
      .returning();

    return NextResponse.json({
      success: true,
      data: newBlock,
      message: allDay ? 'Datum geblokkeerd' : 'Tijdslot geblokkeerd',
    });
  } catch (error) {
    console.error('Error blocking date:', error);
    return NextResponse.json(
      { success: false, error: 'Er ging iets mis bij het blokkeren van de datum' },
      { status: 500 }
    );
  }
}

