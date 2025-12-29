import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { babsBlockedDate } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { getGemeenteContext, isAdmin } from '@/lib/gemeente';

/**
 * DELETE /api/gemeente/babs/[babsId]/blocked-dates/[blockId]
 * Delete a blocked date
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ babsId: string; blockId: string }> }
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
    const { babsId, blockId } = resolvedParams;

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

    // Delete the blocked date
    await db
      .delete(babsBlockedDate)
      .where(
        and(
          eq(babsBlockedDate.id, blockId),
          eq(babsBlockedDate.babsId, babsId)
        )
      );

    return NextResponse.json({
      success: true,
      message: 'Blokkering verwijderd',
    });
  } catch (error) {
    console.error('Error deleting blocked date:', error);
    return NextResponse.json(
      { success: false, error: 'Er ging iets mis bij het verwijderen van de blokkering' },
      { status: 500 }
    );
  }
}
