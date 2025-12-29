import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { babsRecurringRule } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { getGemeenteContext, isAdmin } from '@/lib/gemeente';

/**
 * PUT /api/gemeente/babs/[babsId]/recurring-rules/[ruleId]
 * Update a recurring rule
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ babsId: string; ruleId: string }> }
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
    const { babsId, ruleId } = resolvedParams;

    // Check authorization
    const canManage = 
      isAdmin(context.data.rol) || 
      (context.data.rol === 'babs_admin' && context.data.babsId === babsId);
    
    if (!canManage) {
      return NextResponse.json(
        { success: false, error: 'Geen toegang - u kunt alleen uw eigen beschikbaarheid beheren' },
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
      description,
    } = body;

    // Validation
    if (!ruleType || !startTime || !endTime || !validFrom) {
      return NextResponse.json(
        { success: false, error: 'Verplichte velden ontbreken' },
        { status: 400 }
      );
    }

    // Update the rule
    const [updatedRule] = await db
      .update(babsRecurringRule)
      .set({
        ruleType,
        dayOfWeek: dayOfWeek ?? null,
        dayOfMonth: dayOfMonth ?? null,
        weekOfMonth: weekOfMonth ?? null,
        intervalWeeks: intervalWeeks ?? null,
        startTime,
        endTime,
        validFrom,
        validUntil: validUntil ?? null,
        description: description ?? null,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(babsRecurringRule.id, ruleId),
          eq(babsRecurringRule.babsId, babsId)
        )
      )
      .returning();

    if (!updatedRule) {
      return NextResponse.json(
        { success: false, error: 'Regel niet gevonden' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: updatedRule,
      message: 'Regel succesvol bijgewerkt',
    });
  } catch (error) {
    console.error('Error updating recurring rule:', error);
    return NextResponse.json(
      { success: false, error: 'Er ging iets mis bij het bijwerken van de regel' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/gemeente/babs/[babsId]/recurring-rules/[ruleId]
 * Delete a recurring rule
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ babsId: string; ruleId: string }> }
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
    const { babsId, ruleId } = resolvedParams;

    // Check authorization:
    // - Admins can manage any BABS
    // - BABS admins can only manage their own availability
    const canManage = 
      isAdmin(context.data.rol) || 
      (context.data.rol === 'babs_admin' && context.data.babsId === babsId);
    
    if (!canManage) {
      return NextResponse.json(
        { success: false, error: 'Geen toegang - u kunt alleen uw eigen beschikbaarheid beheren' },
        { status: 403 }
      );
    }

    // Delete the rule
    await db
      .delete(babsRecurringRule)
      .where(
        and(
          eq(babsRecurringRule.id, ruleId),
          eq(babsRecurringRule.babsId, babsId)
        )
      );

    return NextResponse.json({
      success: true,
      message: 'Regel verwijderd',
    });
  } catch (error) {
    console.error('Error deleting recurring rule:', error);
    return NextResponse.json(
      { success: false, error: 'Er ging iets mis bij het verwijderen van de regel' },
      { status: 500 }
    );
  }
}
