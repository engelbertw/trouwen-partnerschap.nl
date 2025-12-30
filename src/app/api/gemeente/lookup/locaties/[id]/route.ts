import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { locatie } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { getGemeenteContext, isAdmin } from '@/lib/gemeente';

/**
 * PUT /api/gemeente/lookup/locaties/[id]
 * Updates a locatie
 */
export async function PUT(
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

    if (!isAdmin(context.data.rol)) {
      return NextResponse.json(
        { success: false, error: 'Geen toegang' },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await request.json();

    // Remove fields that shouldn't be updated
    const { id: _id, createdAt, updatedAt, ...updateData } = body;

    const [updated] = await db
      .update(locatie)
      .set({
        ...updateData,
        updatedAt: new Date(),
      })
      .where(eq(locatie.id, id))
      .returning();

    if (!updated) {
      return NextResponse.json(
        { success: false, error: 'Locatie niet gevonden' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: updated,
    });
  } catch (error) {
    console.error('Error updating locatie:', error);
    return NextResponse.json(
      { success: false, error: 'Er ging iets mis bij het bijwerken van locatie' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/gemeente/lookup/locaties/[id]
 * Deletes a locatie (soft delete by setting actief = false)
 */
export async function DELETE(
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

    if (!isAdmin(context.data.rol)) {
      return NextResponse.json(
        { success: false, error: 'Geen toegang' },
        { status: 403 }
      );
    }

    const { id } = await params;

    const [updated] = await db
      .update(locatie)
      .set({
        actief: false,
        updatedAt: new Date(),
      })
      .where(eq(locatie.id, id))
      .returning();

    if (!updated) {
      return NextResponse.json(
        { success: false, error: 'Locatie niet gevonden' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Locatie gedeactiveerd',
    });
  } catch (error) {
    console.error('Error deleting locatie:', error);
    return NextResponse.json(
      { success: false, error: 'Er ging iets mis bij het verwijderen van locatie' },
      { status: 500 }
    );
  }
}

