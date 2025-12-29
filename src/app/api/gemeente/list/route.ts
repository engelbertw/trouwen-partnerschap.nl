import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { gemeente } from '@/db/schema';
import { getGemeenteContext } from '@/lib/gemeente';

/**
 * GET /api/gemeente/list
 * 
 * Returns list of all gemeenten (for admin dropdowns)
 */
export async function GET(request: NextRequest) {
  try {
    const context = await getGemeenteContext();
    if (!context.success) {
      return NextResponse.json(
        { success: false, error: context.error },
        { status: 401 }
      );
    }

    const gemeentenList = await db
      .select({
        oin: gemeente.oin,
        naam: gemeente.naam,
      })
      .from(gemeente)
      .orderBy(gemeente.naam);

    return NextResponse.json({
      success: true,
      data: gemeentenList,
    });
  } catch (error) {
    console.error('Error fetching gemeenten:', error);
    return NextResponse.json(
      { success: false, error: 'Er ging iets mis bij het ophalen van gemeenten' },
      { status: 500 }
    );
  }
}

