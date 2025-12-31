import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/db';
import { dossier, partner, aankondiging, ceremonie, locatie, babs, typeCeremonie, dossierBlock, getuige, papier, documentOptie } from '@/db/schema';
import { eq, and, count } from 'drizzle-orm';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 1. Await params (Next.js 15 requirement)
    const { id } = await params;

    // 2. Check authentication
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 3. Fetch dossier with related data
    const dossierData = await db
      .select()
      .from(dossier)
      .where(eq(dossier.id, id))
      .limit(1);

    if (!dossierData.length) {
      return NextResponse.json({ error: 'Dossier niet gevonden' }, { status: 404 });
    }

    const currentDossier = dossierData[0];

    // 3. Check if user owns this dossier
    if (currentDossier.createdBy !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // 4. Fetch partners
    const partners = await db
      .select()
      .from(partner)
      .where(eq(partner.dossierId, id))
      .orderBy(partner.sequence);

    // 5. Fetch aankondiging
    const aankondigingData = await db
      .select()
      .from(aankondiging)
      .where(eq(aankondiging.dossierId, id))
      .limit(1);

    if (!aankondigingData.length || partners.length < 2) {
      return NextResponse.json({ error: 'Onvolledige dossiergegevens' }, { status: 404 });
    }

    // 6. Fetch type ceremonie from dossier (include prijsCents)
    const typeCeremonieData = currentDossier.typeCeremonieId ? await db
      .select({
        id: typeCeremonie.id,
        code: typeCeremonie.code,
        naam: typeCeremonie.naam,
        omschrijving: typeCeremonie.omschrijving,
        uitgebreideOmschrijving: typeCeremonie.uitgebreideOmschrijving,
        eigenBabsToegestaan: typeCeremonie.eigenBabsToegestaan,
        gratis: typeCeremonie.gratis,
        budget: typeCeremonie.budget,
        prijsCents: typeCeremonie.prijsCents,
        duurMinuten: typeCeremonie.duurMinuten,
        talen: typeCeremonie.talen,
      })
      .from(typeCeremonie)
      .where(eq(typeCeremonie.id, currentDossier.typeCeremonieId))
      .limit(1) : [];

    // 7. Fetch ceremonie data (if exists)
    const ceremonieData = await db
      .select({
        ceremonie: ceremonie,
        locatie: locatie,
        babs: babs,
      })
      .from(ceremonie)
      .leftJoin(locatie, eq(ceremonie.locatieId, locatie.id))
      .leftJoin(babs, eq(ceremonie.babsId, babs.id))
      .where(eq(ceremonie.dossierId, id))
      .limit(1);

    // 7. Fetch dossier blocks to check completion status
    const blocks = await db
      .select()
      .from(dossierBlock)
      .where(eq(dossierBlock.dossierId, id));

    // 8. Fetch getuigen data
    const getuigenData = await db
      .select()
      .from(getuige)
      .where(eq(getuige.dossierId, id))
      .orderBy(getuige.volgorde);

    const aantalGetuigen = getuigenData.length;
    const getuigenVoltooid = aantalGetuigen >= 2 && aantalGetuigen <= 4;

    // Format getuigen for display
    const formattedGetuigen = getuigenData.map(g => ({
      voornamen: g.voornamen,
      voorvoegsel: g.voorvoegsel,
      achternaam: g.achternaam,
      volledigeNaam: [g.voornamen, g.voorvoegsel, g.achternaam].filter(Boolean).join(' '),
    }));

    // 10. Fetch documents data with their details from documentOptie
    const papierenData = await db
      .select({
        papier: papier,
        documentOptie: documentOptie,
      })
      .from(papier)
      .leftJoin(documentOptie, and(
        eq(papier.gemeenteOin, documentOptie.gemeenteOin),
        eq(papier.omschrijving, documentOptie.code)
      ))
      .where(eq(papier.dossierId, id));

    const papierenGeselecteerd = papierenData.length > 0;

    // Format documents for display
    const formattedDocumenten = papierenData.map(d => ({
      naam: d.documentOptie?.naam || d.papier.omschrijving || 'Onbekend document',
      prijsCents: d.documentOptie?.prijsCents || 0,
      gratis: d.documentOptie?.gratis || false,
      verplicht: d.documentOptie?.verplicht || false,
    }));

    // Calculate document costs
    const documentenKostenCents = formattedDocumenten.reduce((total, doc) => {
      return total + (doc.gratis ? 0 : doc.prijsCents);
    }, 0);

    // 11. Check naamgebruik (both partners need naamgebruikKeuze)
    const naamgebruikVoltooid = partners.length === 2 && 
      partners[0].naamgebruikKeuze !== null && 
      partners[1].naamgebruikKeuze !== null;

    // 12. Format date for display (YYYY-MM-DD to DD-MM-YYYY)
    const formatDateForDisplay = (dateStr: string): string => {
      const date = new Date(dateStr);
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      return `${day}-${month}-${year}`;
    };

    // 13. Format time for display (HH:MM:SS to HH:MM)
    const formatTimeForDisplay = (timeStr: string | null): string => {
      if (!timeStr) return '';
      return timeStr.substring(0, 5); // Extract HH:MM from HH:MM:SS
    };

    // 12. Calculate validity date (aankondiging + 1 year)
    const createdDate = new Date(currentDossier.createdAt!);
    const validityDate = new Date(createdDate);
    validityDate.setFullYear(validityDate.getFullYear() + 1);
    const geldigTot = formatDateForDisplay(validityDate.toISOString().split('T')[0]);

    // 13. Format ceremonie data if exists
    // Calculate costs: type ceremonie price + locatie price
    let ceremonieKostenCents = 0;
    if (ceremonieData.length > 0 && ceremonieData[0].ceremonie) {
      // Add type ceremonie price
      if (typeCeremonieData.length > 0 && typeCeremonieData[0].prijsCents) {
        ceremonieKostenCents += typeCeremonieData[0].prijsCents;
      }
      // Add locatie price (if any)
      if (ceremonieData[0].locatie?.prijsCents) {
        ceremonieKostenCents += ceremonieData[0].locatie.prijsCents;
      }
    }

    const formattedCeremonie = ceremonieData.length > 0 && ceremonieData[0].ceremonie ? {
      datum: formatDateForDisplay(ceremonieData[0].ceremonie.datum),
      startTijd: formatTimeForDisplay(ceremonieData[0].ceremonie.startTijd),
      eindTijd: formatTimeForDisplay(ceremonieData[0].ceremonie.eindTijd),
      locatie: ceremonieData[0].locatie ? {
        naam: ceremonieData[0].locatie.naam,
        type: ceremonieData[0].locatie.type,
        prijsCents: ceremonieData[0].locatie.prijsCents || 0,
      } : null,
      babs: ceremonieData[0].babs ? {
        naam: ceremonieData[0].babs.naam,
      } : null,
      type: typeCeremonieData.length > 0 ? {
        naam: typeCeremonieData[0].naam,
        code: typeCeremonieData[0].code,
        duurMinuten: typeCeremonieData[0].duurMinuten,
        eigenBabsToegestaan: typeCeremonieData[0].eigenBabsToegestaan,
        prijsCents: typeCeremonieData[0].prijsCents || 0,
      } : null,
      wijzigbaarTot: ceremonieData[0].ceremonie.wijzigbaarTot ? formatDateForDisplay(ceremonieData[0].ceremonie.wijzigbaarTot.toISOString().split('T')[0]) : null,
    } : null;

    // 14. Determine which actions are still pending
    const aankondigingBlock = blocks.find(b => b.code === 'aankondiging');
    const getuigenBlock = blocks.find(b => b.code === 'getuigen');
    const papierenBlock = blocks.find(b => b.code === 'papieren');
    
    // Aankondiging is afgerond als:
    // - Het aankondiging block is voltooid
    // - EN de aankondiging is geldig (valid = true)
    // - EN de dossier status is niet meer 'draft' (bijv. 'in_review' of verder)
    const aankondigingAfgerond = 
      aankondigingBlock?.complete === true &&
      aankondigingData[0]?.valid === true &&
      currentDossier.status !== 'draft';
    
    const acties = {
      // Ceremonie: alleen tonen als aankondiging is afgerond EN ceremonie nog niet gepland
      ceremonie: aankondigingAfgerond && !formattedCeremonie,
      getuigen: !getuigenVoltooid && (!getuigenBlock || !getuigenBlock.complete), // Not complete
      documenten: !papierenGeselecteerd, // Show if no documents selected yet
      naamgebruik: !naamgebruikVoltooid, // Not complete
    };

    // 15. Return formatted dossier data
    return NextResponse.json({
      success: true,
      dossier: {
        id: currentDossier.id,
        identificatie: currentDossier.identificatie, // GEMMA zaaknummer (HUW-2025-000001)
        partner1: {
          voornamen: partners[0].voornamen,
          geslachtsnaam: partners[0].geslachtsnaam,
          naamgebruikKeuze: partners[0].naamgebruikKeuze,
        },
        partner2: {
          voornamen: partners[1].voornamen,
          geslachtsnaam: partners[1].geslachtsnaam,
          naamgebruikKeuze: partners[1].naamgebruikKeuze,
        },
        type: aankondigingData[0].partnerschap ? 'partnerschap' : 'huwelijk',
        status: currentDossier.status,
        geldigTot,
        createdAt: currentDossier.createdAt,
        ceremonie: formattedCeremonie, // Include ceremonie data if exists, null otherwise
        getuigen: formattedGetuigen, // Include getuigen data
        documenten: formattedDocumenten, // Include documenten data
        kosten: {
          ceremonieKostenCents,
          documentenKostenCents,
          totaalKostenCents: ceremonieKostenCents + documentenKostenCents,
        },
        acties, // Include pending actions status
      },
    });
  } catch (error) {
    console.error('Error fetching dossier:', error);
    return NextResponse.json(
      { error: 'Er ging iets mis bij het ophalen van het dossier' },
      { status: 500 }
    );
  }
}

