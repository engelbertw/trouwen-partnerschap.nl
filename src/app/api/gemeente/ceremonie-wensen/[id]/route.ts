import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { ceremonieWens } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { getGemeenteContext, isAdmin } from '@/lib/gemeente';

/**
 * PATCH /api/gemeente/ceremonie-wensen/[id]
 * Update a ceremony wish
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const context = await getGemeenteContext();
    if (!context.success || !isAdmin(context.data.rol)) {
      return NextResponse.json(
        { success: false, error: 'Geen toegang' },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await request.json();

    const [updated] = await db
      .update(ceremonieWens)
      .set({
        ...body,
        updatedAt: new Date(),
      })
      .where(eq(ceremonieWens.id, id))
      .returning();

    if (!updated) {
      return NextResponse.json(
        { success: false, error: 'Ceremoniewens niet gevonden' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: updated,
      message: 'Ceremoniewens bijgewerkt',
    });
  } catch (error) {
    console.error('Error updating ceremony wish:', error);
    return NextResponse.json(
      { success: false, error: 'Er ging iets mis bij het bijwerken' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/gemeente/ceremonie-wensen/[id]
 * Delete a ceremony wish
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const context = await getGemeenteContext();
    if (!context.success || !isAdmin(context.data.rol)) {
      return NextResponse.json(
        { success: false, error: 'Geen toegang' },
        { status: 403 }
      );
    }

    const { id } = await params;

    const [deleted] = await db
      .delete(ceremonieWens)
      .where(eq(ceremonieWens.id, id))
      .returning();

    if (!deleted) {
      return NextResponse.json(
        { success: false, error: 'Ceremoniewens niet gevonden' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Ceremoniewens verwijderd',
    });
  } catch (error) {
    console.error('Error deleting ceremony wish:', error);
    return NextResponse.json(
      { success: false, error: 'Er ging iets mis bij het verwijderen' },
      { status: 500 }
    );
  }
}
