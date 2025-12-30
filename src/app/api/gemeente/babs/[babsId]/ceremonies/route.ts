import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { ceremonie, locatie, dossier, partner } from '@/db/schema';
import { eq, and, inArray } from 'drizzle-orm';
import { getGemeenteContext, isAdmin } from '@/lib/gemeente';

/**
 * GET /api/gemeente/babs/[babsId]/ceremonies
 * Get ceremonies for a specific BABS (gemeente admin access)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ babsId: string }> }
) {
  try {
    const { babsId } = await params;
    
    const context = await getGemeenteContext();
    if (!context.success) {
      return NextResponse.json(
        { success: false, error: context.error },
        { status: 401 }
      );
    }

    // Check authorization:
    // - Admins can view all ceremonies
    // - BABS admins can only view their own ceremonies
    const canView = 
      isAdmin(context.data.rol) || 
      (context.data.rol === 'babs_admin' && context.data.babsId === babsId);
    
    if (!canView) {
      return NextResponse.json(
        { success: false, error: 'Geen toegang. U kunt alleen uw eigen ceremonies bekijken.' },
        { status: 403 }
      );
    }

    const gemeenteOin = context.data.gemeenteOin;

    // Query ceremonies for this BABS within the gemeente
    const ceremonies = await db
      .select({
        id: ceremonie.id,
        dossierId: ceremonie.dossierId,
        datum: ceremonie.datum,
        startTijd: ceremonie.startTijd,
        eindTijd: ceremonie.eindTijd,
        locatieId: ceremonie.locatieId,
        locatieNaam: locatie.naam,
        locatieType: locatie.type,
        taal: ceremonie.taal,
        trouwboekje: ceremonie.trouwboekje,
        speech: ceremonie.speech,
        geboektOp: ceremonie.geboektOp,
        partner1Voornamen: partner.voornamen,
        partner1Achternaam: partner.geslachtsnaam,
      })
      .from(ceremonie)
      .innerJoin(locatie, eq(ceremonie.locatieId, locatie.id))
      .innerJoin(dossier, eq(ceremonie.dossierId, dossier.id))
      .leftJoin(partner, and(
        eq(partner.dossierId, dossier.id),
        eq(partner.sequence, 1)
      ))
      .where(
        and(
          eq(ceremonie.babsId, babsId),
          eq(ceremonie.gemeenteOin, gemeenteOin)
        )
      )
      .orderBy(ceremonie.datum, ceremonie.startTijd);

    // Format response
    const formatted = ceremonies.map(c => ({
      id: c.id,
      dossierId: c.dossierId,
      datum: c.datum,
      startTijd: c.startTijd,
      eindTijd: c.eindTijd,
      locatieNaam: c.locatieNaam,
      locatieType: c.locatieType,
      taal: c.taal,
      trouwboekje: c.trouwboekje,
      speech: c.speech,
      geboektOp: c.geboektOp?.toISOString(),
      partner1: c.partner1Voornamen && c.partner1Achternaam 
        ? `${c.partner1Voornamen} ${c.partner1Achternaam}`
        : null,
    }));

    return NextResponse.json({
      success: true,
      data: formatted,
      count: formatted.length,
    });
  } catch (error) {
    console.error('Error fetching BABS ceremonies:', error);
    return NextResponse.json(
      { success: false, error: 'Er ging iets mis bij het ophalen van ceremonies' },
      { status: 500 }
    );
  }
}

