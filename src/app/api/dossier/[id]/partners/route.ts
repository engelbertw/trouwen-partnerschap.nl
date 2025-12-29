import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/db';
import { dossier, partner } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

/**
 * PUT /api/dossier/[id]/partners
 * 
 * Updates partner gegevens (sequence 1 or 2)
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Declare variables outside try block so they're available in catch
  let dossierId: string;
  let sequence: number;
  let voornamen: string | undefined;
  let geslachtsnaam: string | undefined;
  let geboortedatum: string | undefined;
  let geboorteplaats: string | undefined;
  let geboorteland: string | undefined;
  let email: string | undefined;
  let telefoon: string | undefined;
  let adres: string | undefined;
  let postcode: string | undefined;
  let plaats: string | undefined;
  let burgerlijkeStaat: string | undefined;
  let ouders: any;

  try {
    // 1. Check authentication
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Niet geautoriseerd' },
        { status: 401 }
      );
    }

    const { id } = await params;
    dossierId = id;

    // 2. Get request data
    const body = await request.json();
    ({
      sequence,
      voornamen,
      geslachtsnaam,
      geboortedatum,
      geboorteplaats,
      geboorteland,
      email,
      telefoon,
      adres,
      postcode,
      plaats,
      burgerlijkeStaat,
      ouders,
    } = body);

    if (!sequence || (sequence !== 1 && sequence !== 2)) {
      return NextResponse.json(
        { success: false, error: 'Ongeldige sequence (moet 1 of 2 zijn)' },
        { status: 400 }
      );
    }

    // 3. Verify dossier access
    const [existingDossier] = await db
      .select()
      .from(dossier)
      .where(eq(dossier.id, dossierId))
      .limit(1);

    if (!existingDossier) {
      return NextResponse.json(
        { success: false, error: 'Dossier niet gevonden' },
        { status: 404 }
      );
    }

    if (existingDossier.createdBy !== userId) {
      return NextResponse.json(
        { success: false, error: 'Geen toegang tot dit dossier' },
        { status: 403 }
      );
    }

    // Store gemeenteOin for use in insert/update
    const gemeenteOin = existingDossier.gemeenteOin;

    // 4. Helper function to convert DD-MM-YYYY to YYYY-MM-DD
    const convertDateFormat = (dateStr: string): string => {
      if (!dateStr) return '';
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
      if (/^\d{2}-\d{2}-\d{4}$/.test(dateStr)) {
        const [day, month, year] = dateStr.split('-');
        return `${year}-${month}-${day}`;
      }
      throw new Error(`Invalid date format: ${dateStr}`);
    };

    // 5. Upsert pattern: Try insert first, if duplicate key then update
    // This is the most robust approach for concurrent requests
    try {
      await db.insert(partner).values({
        dossierId,
        gemeenteOin,
        sequence,
        voornamen: voornamen || '',
        geslachtsnaam: geslachtsnaam || '',
        geboortedatum: convertDateFormat(geboortedatum || ''),
        geboorteplaats: geboorteplaats || 'Onbekend',
        geboorteland: geboorteland || 'Nederland',
        email: email || null,
        telefoon: telefoon || null,
        adres: adres || null,
        postcode: postcode || null,
        plaats: plaats || null,
        oudersOnbekend: !ouders || ouders.length === 0,
      });
    } catch (insertError: any) {
      // Check for duplicate key error in multiple ways (error structure can vary)
      const isDuplicateKey = 
        insertError?.code === '23505' ||
        insertError?.cause?.code === '23505' ||
        insertError?.message?.includes('duplicate key') ||
        insertError?.message?.includes('uq_partner_sequence') ||
        (insertError?.cause && (
          insertError.cause.code === '23505' ||
          insertError.cause.message?.includes('duplicate key') ||
          insertError.cause.message?.includes('uq_partner_sequence')
        ));

      if (isDuplicateKey) {
        // Partner already exists - update it
        await db
          .update(partner)
          .set({
            voornamen: voornamen !== undefined ? voornamen : undefined,
            geslachtsnaam: geslachtsnaam !== undefined ? geslachtsnaam : undefined,
            geboortedatum: geboortedatum ? convertDateFormat(geboortedatum) : undefined,
            geboorteplaats: geboorteplaats !== undefined ? geboorteplaats : undefined,
            geboorteland: geboorteland !== undefined ? geboorteland : undefined,
            email: email !== undefined ? email : undefined,
            telefoon: telefoon !== undefined ? telefoon : undefined,
            adres: adres !== undefined ? adres : undefined,
            postcode: postcode !== undefined ? postcode : undefined,
            plaats: plaats !== undefined ? plaats : undefined,
            oudersOnbekend: ouders !== undefined ? (!ouders || ouders.length === 0) : undefined,
            updatedAt: new Date(),
          })
          .where(
            and(
              eq(partner.dossierId, dossierId),
              eq(partner.sequence, sequence)
            )
          );
      } else {
        // Re-throw if it's a different error
        throw insertError;
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Partner gegevens opgeslagen',
    });

  } catch (error: any) {
    console.error('Error updating partner:', error);
    
    // Log error details for debugging
    if (process.env.NODE_ENV === 'development') {
      console.error('Error details:', {
        code: error?.code,
        causeCode: error?.cause?.code,
        message: error?.message,
        causeMessage: error?.cause?.message,
      });
    }
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Er ging iets mis bij het opslaan',
        details: process.env.NODE_ENV === 'development' ? String(error) : undefined,
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/dossier/[id]/partners
 * 
 * Gets both partners for a dossier
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

    // Get partners
    const partners = await db
      .select()
      .from(partner)
      .where(eq(partner.dossierId, dossierId))
      .orderBy(partner.sequence);

    // Helper to convert date back to DD-MM-YYYY
    const formatDate = (date: string | null): string => {
      if (!date) return '';
      const [year, month, day] = date.split('-');
      return `${day}-${month}-${year}`;
    };

    const partner1 = partners.find((p) => p.sequence === 1);
    const partner2 = partners.find((p) => p.sequence === 2);

    return NextResponse.json({
      success: true,
      data: {
        partner1: partner1
          ? {
              voornamen: partner1.voornamen || '',
              achternaam: partner1.geslachtsnaam || '',
              geboortedatum: formatDate(partner1.geboortedatum),
              geboorteplaats: partner1.geboorteplaats || '',
              email: partner1.email || '',
              telefoon: partner1.telefoon || '',
              adres: partner1.adres || '',
              postcode: partner1.postcode || '',
              plaats: partner1.plaats || '',
            }
          : null,
        partner2: partner2
          ? {
              voornamen: partner2.voornamen || '',
              achternaam: partner2.geslachtsnaam || '',
              geboortedatum: formatDate(partner2.geboortedatum),
              geboorteplaats: partner2.geboorteplaats || '',
              email: partner2.email || '',
              telefoon: partner2.telefoon || '',
              adres: partner2.adres || '',
              postcode: partner2.postcode || '',
              plaats: partner2.plaats || '',
            }
          : null,
      },
    });

  } catch (error) {
    console.error('Error fetching partners:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Er ging iets mis',
      },
      { status: 500 }
    );
  }
}

