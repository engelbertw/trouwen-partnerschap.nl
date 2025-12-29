import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { babs } from '@/db/schema';
import { eq } from 'drizzle-orm';

/**
 * GET /api/babs/[id]
 * Get BABS details by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const [babsData] = await db
      .select({
        id: babs.id,
        naam: babs.naam,
        talen: babs.talen,
        status: babs.status,
        actief: babs.actief,
      })
      .from(babs)
      .where(eq(babs.id, id))
      .limit(1);

    if (!babsData) {
      return NextResponse.json(
        { success: false, error: 'BABS niet gevonden' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: babsData,
    });
  } catch (error) {
    console.error('Error fetching BABS:', error);
    return NextResponse.json(
      { success: false, error: 'Er ging iets mis bij het ophalen van BABS gegevens' },
      { status: 500 }
    );
  }
}

