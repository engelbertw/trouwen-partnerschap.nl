import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { locatieBlockedDate } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { getGemeenteContext, isAdmin, isLocatieAdmin } from '@/lib/gemeente';

/**
 * DELETE /api/gemeente/locaties/[locatieId]/blocked-dates/[blockId]
 * Delete a blocked date
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ locatieId: string; blockId: string }> }
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
    const { locatieId, blockId } = resolvedParams;

    // Check authorization
    const isAdminUser = isAdmin(context.data.rol);
    const isLocatieOwner = isLocatieAdmin(context.data.rol) && context.data.locatieId === locatieId;
    const canManage = isAdminUser || isLocatieOwner;
    
    if (!canManage) {
      return NextResponse.json(
        { success: false, error: 'Geen toegang - u kunt alleen uw eigen beschikbaarheid beheren' },
        { status: 403 }
      );
    }

    const [deleted] = await db
      .delete(locatieBlockedDate)
      .where(
        and(
          eq(locatieBlockedDate.id, blockId),
          eq(locatieBlockedDate.locatieId, locatieId)
        )
      )
      .returning();

    if (!deleted) {
      return NextResponse.json(
        { success: false, error: 'Blokkering niet gevonden' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Blokkering succesvol verwijderd',
    });
  } catch (error) {
    console.error('Error deleting blocked date:', error);
    return NextResponse.json(
      { success: false, error: 'Er ging iets mis bij het verwijderen van de blokkering' },
      { status: 500 }
    );
  }
}

