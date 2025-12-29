import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/db';
import { dossier, aankondiging, partner, kind } from '@/db/schema';
import { eq } from 'drizzle-orm';

/**
 * GET /api/dossier/[id]/samenvatting
 * 
 * Gets complete dossier data for summary page
 * Returns all sections: aankondiging, partners, kinderen, curatele, bloedverwantschap
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Niet geautoriseerd' },
        { status: 401 }
      );
    }

    const { id: dossierId } = await params;

    // Verify access
    const [existingDossier] = await db
      .select()
      .from(dossier)
      .where(eq(dossier.id, dossierId))
      .limit(1);

    if (!existingDossier || existingDossier.createdBy !== userId) {
      return NextResponse.json(
        { success: false, error: 'Geen toegang' },
        { status: 403 }
      );
    }

    // Helper to convert date from YYYY-MM-DD to DD-MM-YYYY
    const formatDate = (date: string | null): string => {
      if (!date) return '';
      const [year, month, day] = date.split('-');
      return `${day}-${month}-${year}`;
    };

    // Helper to format timestamp to DD-MM-YYYY
    const formatTimestamp = (timestamp: Date | null): string => {
      if (!timestamp) return '';
      const date = new Date(timestamp);
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      return `${day}-${month}-${year}`;
    };

    // Get aankondiging
    const aankondigingResult = await db
      .select()
      .from(aankondiging)
      .where(eq(aankondiging.dossierId, dossierId))
      .limit(1);
    
    const aankondigingData = aankondigingResult[0] || null;

    // Get partners
    const partners = await db
      .select()
      .from(partner)
      .where(eq(partner.dossierId, dossierId))
      .orderBy(partner.sequence);

    const partner1 = partners.find((p) => p.sequence === 1);
    const partner2 = partners.find((p) => p.sequence === 2);
    
    // If no aankondiging or partners, return error
    if (!aankondigingData) {
      return NextResponse.json(
        { success: false, error: 'Aankondiging niet gevonden voor dit dossier' },
        { status: 404 }
      );
    }

    // Get children
    const children = await db
      .select()
      .from(kind)
      .where(eq(kind.dossierId, dossierId));

    // Group children by partner
    const partner1Children = children.filter(
      (child) => child.partnerId === partner1?.id
    );
    const partner2Children = children.filter(
      (child) => child.partnerId === partner2?.id
    );

    // Get curatele data (TODO: when curatele table exists)
    // For now, return default values
    const curateleData = {
      partner1UnderGuardianship: false,
      partner2UnderGuardianship: false,
    };

    // Get bloedverwantschap data (stored in aankondiging or separate table)
    // For now, return default value
    const bloedverwantschapData = {
      areBloodRelatives: false,
    };

    // Calculate geldigTot (aankondiging created date + 1 year)
    const createdDate = existingDossier.createdAt ? new Date(existingDossier.createdAt) : new Date();
    const validityDate = new Date(createdDate);
    validityDate.setFullYear(validityDate.getFullYear() + 1);
    const geldigTot = formatTimestamp(validityDate);

    // Format createdAt
    const createdAt = formatTimestamp(existingDossier.createdAt);

    // Build response
    const response = {
      id: existingDossier.id,
      type: aankondigingData?.partnerschap ? 'partnerschap' : 'huwelijk',
      partner1: partner1
        ? {
            voornamen: partner1.voornamen || '',
            geslachtsnaam: partner1.geslachtsnaam || '',
            geboortedatum: formatDate(partner1.geboortedatum),
            geboorteplaats: partner1.geboorteplaats || '',
            geboorteland: partner1.geboorteland || 'Nederland',
            email: partner1.email || '',
            telefoon: partner1.telefoon || '',
            adres: partner1.adres || '',
            postcode: partner1.postcode || '',
            plaats: partner1.plaats || '',
            burgerlijkeStaat: 'Ongehuwd', // TODO: Add to partner schema
            ouders: [], // TODO: Add ouders table
          }
        : null,
      partner2: partner2
        ? {
            voornamen: partner2.voornamen || '',
            geslachtsnaam: partner2.geslachtsnaam || '',
            geboortedatum: formatDate(partner2.geboortedatum),
            geboorteplaats: partner2.geboorteplaats || '',
            geboorteland: partner2.geboorteland || 'Nederland',
            email: partner2.email || '',
            telefoon: partner2.telefoon || '',
            adres: partner2.adres || '',
            postcode: partner2.postcode || '',
            plaats: partner2.plaats || '',
            burgerlijkeStaat: 'Ongehuwd', // TODO: Add to partner schema
            ouders: [], // TODO: Add ouders table
          }
        : null,
      curatele: {
        partner1: curateleData.partner1UnderGuardianship ? 'Ja' : 'Nee',
        partner1Document: undefined, // TODO: Add document storage
        partner2: curateleData.partner2UnderGuardianship ? 'Ja' : 'Nee',
      },
      kinderen: {
        partner1: partner1Children.length > 0 ? 'Ja' : 'Nee',
        partner1Children: partner1Children.map((child) => ({
          id: child.id,
          voornamen: child.voornamen,
          achternaam: child.achternaam,
          geboortedatum: formatDate(child.geboortedatum),
        })),
        partner2: partner2Children.length > 0 ? 'Ja' : 'Nee',
        partner2Children: partner2Children.map((child) => ({
          id: child.id,
          voornamen: child.voornamen,
          achternaam: child.achternaam,
          geboortedatum: formatDate(child.geboortedatum),
        })),
      },
      bloedverwantschap: bloedverwantschapData.areBloodRelatives ? 'Ja' : 'Nee',
      createdAt, // Datum aankondiging (aangemaakt op)
      geldigTot, // Geldig tot (createdAt + 1 year)
    };

    return NextResponse.json({
      success: true,
      data: response,
    });

  } catch (error) {
    console.error('Error fetching samenvatting:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Er ging iets mis bij het ophalen van de gegevens',
        details: process.env.NODE_ENV === 'development' ? String(error) : undefined,
      },
      { status: 500 }
    );
  }
}
