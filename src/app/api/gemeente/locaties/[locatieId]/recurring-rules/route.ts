import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { locatieRecurringRule } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { getGemeenteContext, isAdmin, isLocatieAdmin } from '@/lib/gemeente';

/**
 * GET /api/gemeente/locaties/[locatieId]/recurring-rules
 * Get all recurring rules for a locatie
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

    const rules = await db
      .select()
      .from(locatieRecurringRule)
      .where(eq(locatieRecurringRule.locatieId, locatieId))
      .orderBy(locatieRecurringRule.validFrom);

    return NextResponse.json({
      success: true,
      data: rules,
    });
  } catch (error) {
    console.error('Error fetching recurring rules:', error);
    return NextResponse.json(
      { success: false, error: 'Er ging iets mis bij het ophalen van regels' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/gemeente/locaties/[locatieId]/recurring-rules
 * Create a new recurring rule
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
    const isAdminUser = isAdmin(context.data.rol);
    const isLocatieOwner = isLocatieAdmin(context.data.rol) && context.data.locatieId === locatieId;
    const canManage = isAdminUser || isLocatieOwner;
    
    if (!canManage) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Geen toegang - u kunt alleen uw eigen beschikbaarheid beheren',
        },
        { status: 403 }
      );
    }

    const body = await request.json();

    const {
      ruleType,
      dayOfWeek,
      dayOfMonth,
      weekOfMonth,
      intervalWeeks,
      startTime,
      endTime,
      validFrom,
      validUntil,
      rruleString,
      description,
    } = body;

    // Validation
    if (!ruleType || !startTime || !endTime || !validFrom) {
      return NextResponse.json(
        { success: false, error: 'Verplichte velden ontbreken' },
        { status: 400 }
      );
    }

    const [newRule] = await db
      .insert(locatieRecurringRule)
      .values({
        locatieId,
        ruleType,
        dayOfWeek: dayOfWeek ?? null,
        dayOfMonth: dayOfMonth ?? null,
        weekOfMonth: weekOfMonth ?? null,
        intervalWeeks: intervalWeeks ?? null,
        startTime,
        endTime,
        validFrom,
        validUntil: validUntil ?? null,
        rruleString: rruleString ?? null,
        description: description ?? null,
      })
      .returning();

    return NextResponse.json({
      success: true,
      data: newRule,
      message: 'Regel succesvol aangemaakt',
    });
  } catch (error) {
    console.error('Error creating recurring rule:', error);
    return NextResponse.json(
      { success: false, error: 'Er ging iets mis bij het aanmaken van de regel' },
      { status: 500 }
    );
  }
}

