import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { babsRecurringRule } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { getGemeenteContext, isAdmin } from '@/lib/gemeente';

/**
 * GET /api/gemeente/babs/[babsId]/recurring-rules
 * Get all recurring rules for a BABS
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ babsId: string }> }
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
    const { babsId } = resolvedParams;

    const rules = await db
      .select()
      .from(babsRecurringRule)
      .where(eq(babsRecurringRule.babsId, babsId))
      .orderBy(babsRecurringRule.validFrom);

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
 * POST /api/gemeente/babs/[babsId]/recurring-rules
 * Create a new recurring rule
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ babsId: string }> }
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
    const { babsId } = resolvedParams;

    // Check authorization:
    // - Admins can manage any BABS
    // - BABS admins can only manage their own availability
    const isAdminUser = isAdmin(context.data.rol);
    const isBabsOwner = context.data.rol === 'babs_admin' && context.data.babsId === babsId;
    const canManage = isAdminUser || isBabsOwner;
    
    // Debug logging (use string interpolation to avoid serialization issues)
    if (!canManage) {
      console.log(
        `[BABS Recurring Rules POST] Access denied - ` +
        `userId: ${context.data.userId}, ` +
        `rol: ${context.data.rol}, ` +
        `userBabsId: ${context.data.babsId || 'none'}, ` +
        `requestBabsId: ${babsId}`
      );
    }
    
    if (!canManage) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Geen toegang - u kunt alleen uw eigen beschikbaarheid beheren',
          debug: {
            rol: context.data.rol,
            hasAccess: false,
            reason: isAdminUser 
              ? 'Admin heeft toegang tot alle BABS' 
              : `BABS admin kan alleen eigen beschikbaarheid (${context.data.babsId || 'niet ingesteld'}) beheren, niet ${babsId}`
          }
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
      .insert(babsRecurringRule)
      .values({
        babsId,
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

