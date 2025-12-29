import { NextRequest, NextResponse } from 'next/server';
import { clerkClient } from '@clerk/nextjs/server';
import { db } from '@/db';
import { babs, babsGemeente, babsGemeenteTarget, ceremonie, dossier } from '@/db/schema';
import { eq, and, or, sql } from 'drizzle-orm';
import { getGemeenteContext } from '@/lib/gemeente';

/**
 * GET /api/gemeente/lookup/babs
 * Returns all BABS linked to the current gemeente (lookup table)
 * Filters by babs_gemeente junction table
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

    // Get BABS linked to this gemeente via babs_gemeente table
    // Include ceremony statistics
    const currentYear = new Date().getFullYear();
    
    const babsList = await db
      .select({
        id: babs.id,
        code: babs.code,
        naam: babs.naam,
        voornaam: babs.voornaam,
        tussenvoegsel: babs.tussenvoegsel,
        achternaam: babs.achternaam,
        status: babs.status,
        beedigdVanaf: babs.beeddigdVanaf,  // Rename voor consistentie met formulier
        beedigdTot: babs.beeddigdTot,      // Rename voor consistentie met formulier
        aanvraagDatum: babs.aanvraagDatum,
        opmerkingen: babs.opmerkingen,
        beschikbaarheid: babs.beschikbaarheid,
        beschikbaarVanaf: babs.beschikbaarVanaf,
        beschikbaarTot: babs.beschikbaarTot,
        opmerkingBeschikbaarheid: babs.opmerkingBeschikbaarheid,
        calendarFeedToken: babs.calendarFeedToken,
        calendarFeedEnabled: babs.calendarFeedEnabled,
        email: babs.email,
        actief: babs.actief,
        createdAt: babs.createdAt,
        updatedAt: babs.updatedAt,
        // Include link info from junction table
        babsGemeenteActief: babsGemeente.actief,
        babsGemeenteVanaf: babsGemeente.actiefVanaf,
        babsGemeenteTot: babsGemeente.actiefTot,
        // Ceremony statistics for current year
        // Include all ceremonies except those with cancelled dossiers
        ceremoniesTotNu: sql<number>`(
          SELECT COALESCE(COUNT(*), 0)::int
          FROM ${ceremonie} c
          INNER JOIN ${dossier} d ON d.id = c.dossier_id
          WHERE c.babs_id = ${babs.id}
            AND EXTRACT(YEAR FROM c.datum) = ${currentYear}
            AND d.status != 'cancelled'
        )`,
        targetCeremonies: sql<number>`(
          SELECT COALESCE(${babsGemeenteTarget.targetCeremonies}, 0)::int
          FROM ${babsGemeenteTarget}
          WHERE ${babsGemeenteTarget.babsId} = ${babs.id}
            AND ${babsGemeenteTarget.gemeenteOin} = ${context.data.gemeenteOin}
            AND ${babsGemeenteTarget.jaar} = ${currentYear}
          LIMIT 1
        )`,
      })
      .from(babs)
      .innerJoin(babsGemeente, eq(babs.id, babsGemeente.babsId))
      .where(
        and(
          eq(babsGemeente.gemeenteOin, context.data.gemeenteOin),
          eq(babsGemeente.actief, true)
        )
      )
      .orderBy(babs.achternaam, babs.voornaam);

    // Calculate percentage for each BABS
    const enrichedBabsList = babsList.map((b) => ({
      ...b,
      percentageBehaald: b.targetCeremonies > 0 
        ? Math.round((b.ceremoniesTotNu / b.targetCeremonies) * 100) 
        : 0,
    }));

    return NextResponse.json({
      success: true,
      data: enrichedBabsList,
    });
  } catch (error) {
    console.error('Error fetching BABS:', error);
    return NextResponse.json(
      { success: false, error: 'Er ging iets mis bij het ophalen van BABS' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/gemeente/lookup/babs
 * Creates a new BABS and optionally creates a Clerk user account
 * Also creates a link in babs_gemeente for the current gemeente
 */
export async function POST(request: NextRequest) {
  try {
    const context = await getGemeenteContext();
    if (!context.success) {
      return NextResponse.json(
        { success: false, error: context.error },
        { status: 401 }
      );
    }

    const body = await request.json();
    
    // Debug: log wat we ontvangen
    console.log('📥 POST /api/gemeente/lookup/babs - Received body:', {
      status: body.status,
      beedigdVanaf: body.beedigdVanaf,
      beedigdTot: body.beedigdTot,
      naam: body.naam,
      achternaam: body.achternaam,
    });
    
    const { 
      code, naam, voornaam, tussenvoegsel, achternaam, status, 
      beedigdVanaf: beeddigdVanafValue,   // Formulier gebruikt beedigdVanaf
      beedigdTot: beeddigdTotValue,       // Formulier gebruikt beedigdTot
      aanvraagDatum, opmerkingen, 
      beschikbaarVanaf, beschikbaarTot, opmerkingBeschikbaarheid,
      email, // Email is required for Clerk account creation
      talen, // Talen die deze BABS spreekt
      actief,
      createClerkAccount = true, // Default: create Clerk account
      targetCeremonies, // Target ceremonies per year
      targetJaar, // Year for target (default: current year)
    } = body;
    
    console.log('🔍 Extracted values:', {
      status,
      beeddigdVanafValue,
      beeddigdTotValue,
    });

    if (!naam || !achternaam) {
      return NextResponse.json(
        { success: false, error: 'Naam en achternaam zijn verplicht' },
        { status: 400 }
      );
    }

    // Validate email if Clerk account should be created
    if (createClerkAccount && (!email || !email.includes('@'))) {
      return NextResponse.json(
        { success: false, error: 'Geldig email adres is verplicht voor het aanmaken van een account' },
        { status: 400 }
      );
    }

    // Validate beediging datums when status is 'beedigd'
    if (status === 'beedigd') {
      if (!beeddigdVanafValue || !beeddigdTotValue) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Bij status "Beedigd" zijn beide beëdiging datums (vanaf en tot) verplicht' 
          },
          { status: 400 }
        );
      }

      // Validate that beedigdVanaf is before beedigdTot
      if (new Date(beeddigdVanafValue) >= new Date(beeddigdTotValue)) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Datum "Beedigd vanaf" moet voor "Beedigd tot" liggen' 
          },
          { status: 400 }
        );
      }
    }

    // Validate gemeenteOin is available
    if (!context.data.gemeenteOin) {
      return NextResponse.json(
        { success: false, error: 'Gemeente OIN is niet beschikbaar. Zorg ervoor dat u bent ingelogd als gemeente medewerker.' },
        { status: 400 }
      );
    }

    // Use transaction for atomic creation
    const result = await db.transaction(async (tx) => {
      // Validate talen
      const talenArray = Array.isArray(talen) ? talen : (talen ? JSON.parse(talen) : ['nl']);
      if (!Array.isArray(talenArray) || talenArray.length === 0) {
        throw new Error('Minimaal 1 taal is vereist');
      }

      // 1. Check if BABS already exists with this email
      let existingBabs = null;
      if (email) {
        const existingBabsList = await tx
          .select()
          .from(babs)
          .where(eq(babs.email, email))
          .limit(1);
        
        if (existingBabsList.length > 0) {
          existingBabs = existingBabsList[0];
          console.log('✅ Found existing BABS with email:', {
            babsId: existingBabs.id,
            email,
            naam: existingBabs.naam,
          });
        }
      }

      // 2. Use existing BABS or create new one
      let babsRecord;
      if (existingBabs) {
        // Use existing BABS - don't update it, just use it
        babsRecord = existingBabs;
        console.log('ℹ️  Using existing BABS record, will only create/update gemeente link');
      } else {
        // Create new BABS record
        const [newBabs] = await tx
          .insert(babs)
          .values({
            code: code || null,
            naam,
            voornaam: voornaam || null,
            tussenvoegsel: tussenvoegsel || null,
            achternaam,
            status: status || 'in_aanvraag',
            beeddigdVanaf: beeddigdVanafValue || null,
            beeddigdTot: beeddigdTotValue || null,
            aanvraagDatum: aanvraagDatum || null,
            opmerkingen: opmerkingen || null,
            beschikbaarVanaf: beschikbaarVanaf || null,
            beschikbaarTot: beschikbaarTot || null,
            opmerkingBeschikbaarheid: opmerkingBeschikbaarheid || null,
            email: email || null,
            talen: talenArray,
            actief: actief !== undefined ? actief : true,
          })
          .returning();
        babsRecord = newBabs;
        console.log('✅ Created new BABS record:', {
          babsId: babsRecord.id,
          email,
        });
      }

      // 3. Create link in babs_gemeente for current gemeente
      try {
        await tx.insert(babsGemeente).values({
          babsId: babsRecord.id,
          gemeenteOin: context.data.gemeenteOin,
          actief: true,
          actiefVanaf: new Date().toISOString().split('T')[0], // Today
          toegevoegdDoor: context.data.userId,
        });
        console.log('✅ Created babs_gemeente link:', {
          babsId: babsRecord.id,
          gemeenteOin: context.data.gemeenteOin,
        });
      } catch (linkError) {
        console.error('❌ Failed to create babs_gemeente link:', linkError);
        // If link already exists, that's okay (BABS might be added to multiple gemeenten)
        const errorMessage = linkError instanceof Error ? linkError.message : String(linkError);
        if (!errorMessage.includes('uq_babs_gemeente') && !errorMessage.includes('unique')) {
          throw linkError; // Re-throw if it's not a duplicate key error
        }
        console.log('⚠️  babs_gemeente link already exists, continuing...');
      }

      // 4. Create ceremony target if specified
      if (targetCeremonies && targetCeremonies > 0) {
        const jaar = targetJaar || new Date().getFullYear();
        // Check if target already exists for this gemeente/year
        const existingTarget = await tx
          .select()
          .from(babsGemeenteTarget)
          .where(
            and(
              eq(babsGemeenteTarget.babsId, babsRecord.id),
              eq(babsGemeenteTarget.gemeenteOin, context.data.gemeenteOin),
              eq(babsGemeenteTarget.jaar, jaar)
            )
          )
          .limit(1);
        
        if (existingTarget.length === 0) {
          await tx.insert(babsGemeenteTarget).values({
            babsId: babsRecord.id,
            gemeenteOin: context.data.gemeenteOin,
            jaar,
            targetCeremonies,
          });
        }
      }

      return { babsRecord, wasExisting: existingBabs !== null };
    });

    const wasExisting = result.wasExisting;
    const babsRecord = result.babsRecord;

    // 4. Create Clerk user account if requested and email is provided
    let clerkUserId: string | null = null;
    let clerkError: string | null = null;

    if (createClerkAccount && email) {
      try {
        const client = await clerkClient();
        
        // Check if user already exists with this email
        const existingUsers = await client.users.getUserList({ 
          emailAddress: [email],
          limit: 1,
        });
        
        if (existingUsers.data.length > 0) {
          // User already exists, update metadata but keep existing babs_id if set
          const existingUser = existingUsers.data[0];
          const currentMetadata = (existingUser.publicMetadata || {}) as Record<string, any>;
          
          // IMPORTANT: Keep the original babs_id if it exists (first BABS record)
          // Only update if babs_id is not set or if we're sure this is the first gemeente
          const babsIdToUse = currentMetadata.babs_id || babsRecord.id;
          
          await client.users.updateUser(existingUser.id, {
            publicMetadata: {
              ...currentMetadata,
              rol: 'babs_admin',
              babs_id: babsIdToUse, // Keep original babs_id if it exists
              gemeente_oin: context.data.gemeenteOin, // Primary gemeente from creation context
              gemeente_naam: context.data.gemeenteNaam,
            },
          });
          clerkUserId = existingUser.id;
          console.log('✅ Updated existing Clerk user for BABS:', {
            babsId: babsIdToUse,
            originalBabsId: currentMetadata.babs_id,
            currentBabsId: babsRecord.id,
            clerkUserId,
            email,
            note: currentMetadata.babs_id ? 'Kept original babs_id (first gemeente)' : 'Set new babs_id',
          });
        } else {
          // Create new user
          const clerkUser = await client.users.createUser({
            emailAddress: [email],
            firstName: voornaam || naam,
            lastName: achternaam,
            publicMetadata: {
              rol: 'babs_admin',
              babs_id: babsRecord.id, // Link to BABS record (first/original BABS)
              gemeente_oin: context.data.gemeenteOin, // Primary gemeente where BABS was created
              gemeente_naam: context.data.gemeenteNaam,
              // Note: BABS can work for multiple gemeenten via babs_gemeente junction table
              // This gemeente_oin is the primary gemeente for context/authorization
            },
            skipPasswordRequirement: true, // User will set password via email
            skipPasswordChecks: true,
          });

          clerkUserId = clerkUser.id;
          console.log('✅ Created new Clerk user for BABS:', {
            babsId: babsRecord.id,
            clerkUserId,
            email,
            note: 'BABS can work for multiple gemeenten',
          });
        }
      } catch (error) {
        console.error('❌ Failed to create/update Clerk user for BABS:', error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        
        // Check if email already exists
        if (errorMessage.includes('email_address') || errorMessage.includes('already exists')) {
          clerkError = 'Email adres is al in gebruik. BABS is aangemaakt maar zonder Clerk account.';
        } else {
          clerkError = `Kon geen Clerk account aanmaken: ${errorMessage}. BABS is wel aangemaakt.`;
        }
      }
    } else if (createClerkAccount && !email) {
      clerkError = 'Email adres is verplicht voor het aanmaken van een Clerk account.';
    }

    return NextResponse.json({
      success: true,
      data: babsRecord,
      clerkUserId,
      warning: clerkError,
      wasExisting,
      message: wasExisting
        ? 'BABS was al bekend. Link naar gemeente is toegevoegd.'
        : clerkUserId 
          ? 'BABS en Clerk account succesvol aangemaakt. De gebruiker ontvangt een email om een wachtwoord in te stellen.'
          : clerkError || 'BABS succesvol aangemaakt.',
    });
  } catch (error) {
    console.error('Error creating BABS:', error);
    return NextResponse.json(
      { success: false, error: 'Er ging iets mis bij het aanmaken van BABS' },
      { status: 500 }
    );
  }
}

