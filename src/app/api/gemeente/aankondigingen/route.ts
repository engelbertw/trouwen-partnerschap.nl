import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/db';
import { dossier, aankondiging, partner, dossierBlock } from '@/db/schema';
import { eq, and, desc, sql } from 'drizzle-orm';
import { getGemeenteContext } from '@/lib/gemeente';

/**
 * GET /api/gemeente/aankondigingen
 * 
 * Returns list of aankondigingen that need approval (only for gemeente users)
 * Filters by gemeente_oin for multi-tenancy
 */
export async function GET(request: NextRequest) {
  try {
    // 1. Check authentication and get gemeente context
    const context = await getGemeenteContext();
    if (!context.success) {
      return NextResponse.json(
        { success: false, error: context.error },
        { status: 401 }
      );
    }

    const { gemeenteOin } = context.data;

    // 2. Get query parameters for filtering
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status'); // 'pending', 'approved', 'rejected', 'all'
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // 3. Build query for aankondigingen that need approval
    // Filter by gemeente_oin for multi-tenancy
    let whereConditions = [eq(aankondiging.gemeenteOin, gemeenteOin)];

    // Add status filter
    if (status === 'pending') {
      whereConditions.push(sql`${aankondiging.gevalideerdOp} IS NULL`);
    } else if (status === 'approved') {
      whereConditions.push(sql`${aankondiging.valid} = true AND ${aankondiging.gevalideerdOp} IS NOT NULL`);
    } else if (status === 'rejected') {
      whereConditions.push(sql`${aankondiging.valid} = false AND ${aankondiging.gevalideerdOp} IS NOT NULL`);
    }
    // 'all' shows everything, no additional filter

    // 4. Fetch aankondigingen with dossier info
    const aankondigingenData = await db
      .select({
        aankondiging: aankondiging,
        dossier: {
          id: dossier.id,
          identificatie: dossier.identificatie,
          status: dossier.status,
          createdAt: dossier.createdAt,
        },
      })
      .from(aankondiging)
      .innerJoin(dossier, eq(aankondiging.dossierId, dossier.id))
      .where(and(...whereConditions))
      .orderBy(desc(aankondiging.aangemaaktOp))
      .limit(limit)
      .offset(offset);

    // 5. Fetch partners for each dossier
    const aankondigingen = await Promise.all(
      aankondigingenData.map(async (item) => {
        const partners = await db
          .select()
          .from(partner)
          .where(eq(partner.dossierId, item.dossier.id))
          .orderBy(partner.sequence);

        const partner1 = partners.find(p => p.sequence === 1);
        const partner2 = partners.find(p => p.sequence === 2);

        return {
          ...item,
          partner1: partner1
            ? { voornamen: partner1.voornamen, geslachtsnaam: partner1.geslachtsnaam }
            : { voornamen: '', geslachtsnaam: '' },
          partner2: partner2
            ? { voornamen: partner2.voornamen, geslachtsnaam: partner2.geslachtsnaam }
            : { voornamen: '', geslachtsnaam: '' },
        };
      })
    );

    // 6. Get total count for pagination
    const totalCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(aankondiging)
      .where(and(...whereConditions));

    return NextResponse.json({
      success: true,
      data: aankondigingen,
      pagination: {
        total: totalCount[0]?.count || 0,
        limit,
        offset,
      },
    });

  } catch (error) {
    console.error('Error fetching aankondigingen:', error);
    return NextResponse.json(
      { success: false, error: 'Er ging iets mis bij het ophalen van aankondigingen' },
      { status: 500 }
    );
  }
}

