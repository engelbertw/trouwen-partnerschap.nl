import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { typeCeremonie } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { getGemeenteContext } from '@/lib/gemeente';

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

    const { id } = await params;
    const body = await request.json();

    // Remove fields that shouldn't be updated
    const { id: _id, createdAt, updatedAt, ...updateData } = body;

    const [updated] = await db
      .update(typeCeremonie)
      .set({
        ...updateData,
        updatedAt: new Date(),
      })
      .where(eq(typeCeremonie.id, id))
      .returning();

    return NextResponse.json({
      success: true,
      data: updated,
    });
  } catch (error) {
    console.error('Error updating ceremony type:', error);
    return NextResponse.json(
      { success: false, error: 'Er ging iets mis bij het bijwerken' },
      { status: 500 }
    );
  }
}

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

    const { id } = await params;

    // Soft delete by setting actief to false
    await db
      .update(typeCeremonie)
      .set({
        actief: false,
        updatedAt: new Date(),
      })
      .where(eq(typeCeremonie.id, id));

    return NextResponse.json({
      success: true,
      message: 'Type ceremonie gedeactiveerd',
    });
  } catch (error) {
    console.error('Error deleting ceremony type:', error);
    return NextResponse.json(
      { success: false, error: 'Er ging iets mis bij het verwijderen' },
      { status: 500 }
    );
  }
}
