import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { babsAuditLog } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import { getGemeenteContext } from '@/lib/gemeente';

/**
 * GET /api/gemeente/babs/[babsId]/audit-log
 * Get audit log for a BABS
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

    const logs = await db
      .select()
      .from(babsAuditLog)
      .where(eq(babsAuditLog.babsId, babsId))
      .orderBy(desc(babsAuditLog.changedAt))
      .limit(100); // Last 100 changes

    return NextResponse.json({
      success: true,
      data: logs,
    });
  } catch (error) {
    console.error('Error fetching audit log:', error);
    return NextResponse.json(
      { success: false, error: 'Er ging iets mis bij het ophalen van de audit log' },
      { status: 500 }
    );
  }
}

