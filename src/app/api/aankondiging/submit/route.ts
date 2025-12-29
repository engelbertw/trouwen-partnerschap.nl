import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/db';
import { dossier, partner, aankondiging, dossierBlock, kind } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import type { AankondigingData } from '@/lib/aankondiging-storage';

/**
 * POST /api/aankondiging/submit
 * 
 * Saves the completed announcement form to the database
 * Creates dossier, partners, aankondiging, and dossier blocks
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Check authentication
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Niet geautoriseerd' },
        { status: 401 }
      );
    }

    // 2. Get form data from request body
    const body = await request.json();
    const formData: AankondigingData = body.data;

    // 3. Validate required data
    if (!formData.type) {
      return NextResponse.json(
        { success: false, error: 'Type aankondiging ontbreekt' },
        { status: 400 }
      );
    }

    if (!formData.partner1 || !formData.partner2) {
      return NextResponse.json(
        { success: false, error: 'Partner gegevens ontbreken' },
        { status: 400 }
      );
    }

    // TypeScript: After the check above, we know partner1 and partner2 are defined
    const partner1 = formData.partner1;
    const partner2 = formData.partner2;

    // 4. Get gemeente OIN (hardcoded voor nu, later uit Clerk metadata of user settings)
    const gemeenteOin = '00000001002564440000'; // Voorbeeld OIN voor Amsterdam

    // Helper function to convert DD-MM-YYYY to YYYY-MM-DD (ISO format for PostgreSQL)
    const convertDateFormat = (dateStr: string): string => {
      if (!dateStr) return '';
      
      // If already in ISO format (YYYY-MM-DD), return as-is
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
        return dateStr;
      }
      
      // If in Dutch format (DD-MM-YYYY), convert to ISO
      if (/^\d{2}-\d{2}-\d{4}$/.test(dateStr)) {
        const parts = dateStr.split('-');
        const [day, month, year] = parts;
        
        // Validate year is reasonable (not 0001)
        const yearNum = parseInt(year, 10);
        if (yearNum < 1900 || yearNum > new Date().getFullYear()) {
          throw new Error(`Invalid year in date: ${dateStr}`);
        }
        
        return `${year}-${month}-${day}`;
      }
      
      // Unknown format
      throw new Error(`Invalid date format: ${dateStr}`);
    };

    // 5. Create dossier and related records in transaction
    const result = await db.transaction(async (tx) => {
      // Create main dossier
      const [newDossier] = await tx.insert(dossier).values({
        gemeenteOin,
        status: 'draft',
        createdBy: userId,
        municipalityCode: 'NL.IMBAG.Gemeente.0363',
        isTest: process.env.NODE_ENV !== 'production',
      }).returning();

      // Create aankondiging record
      await tx.insert(aankondiging).values({
        dossierId: newDossier.id,
        gemeenteOin,
        partnerschap: formData.type === 'partnerschap',
        reedsGehuwd: false,
        omzetting: false,
        beidenNietWoonachtig: false,
        valid: true,
      });

      // Check if partners already exist (upsert logic)
      const existingPartner1 = await tx
        .select()
        .from(partner)
        .where(
          and(
            eq(partner.dossierId, newDossier.id),
            eq(partner.sequence, 1)
          )
        )
        .limit(1);

      const existingPartner2 = await tx
        .select()
        .from(partner)
        .where(
          and(
            eq(partner.dossierId, newDossier.id),
            eq(partner.sequence, 2)
          )
        )
        .limit(1);

      let newPartner1, newPartner2;

      if (existingPartner1.length > 0) {
        // Update existing partner 1
        await tx
          .update(partner)
          .set({
            voornamen: partner1.voornamen,
            geslachtsnaam: partner1.achternaam,
            geboortedatum: convertDateFormat(partner1.geboortedatum),
            geboorteplaats: partner1.plaats || 'Onbekend',
            // Email not in AankondigingData interface, so we don't update it
            updatedAt: new Date(),
          })
          .where(eq(partner.id, existingPartner1[0].id));
        newPartner1 = existingPartner1[0];
      } else {
        // Create partner 1
        [newPartner1] = await tx.insert(partner).values({
          dossierId: newDossier.id,
          gemeenteOin,
          sequence: 1,
          voornamen: partner1.voornamen,
          geslachtsnaam: partner1.achternaam,
          geboortedatum: convertDateFormat(partner1.geboortedatum),
          geboorteplaats: partner1.plaats || 'Onbekend',
          geboorteland: 'Nederland',
          // Email not in AankondigingData interface, so we don't set it
          oudersOnbekend: false,
        }).returning();
      }

      if (existingPartner2.length > 0) {
        // Update existing partner 2
        await tx
          .update(partner)
          .set({
            voornamen: partner2.voornamen,
            geslachtsnaam: partner2.achternaam,
            geboortedatum: convertDateFormat(partner2.geboortedatum),
            geboorteplaats: partner2.plaats || 'Onbekend',
            // Email not in AankondigingData interface, so we don't update it
            updatedAt: new Date(),
          })
          .where(eq(partner.id, existingPartner2[0].id));
        newPartner2 = existingPartner2[0];
      } else {
        // Create partner 2
        [newPartner2] = await tx.insert(partner).values({
          dossierId: newDossier.id,
          gemeenteOin,
          sequence: 2,
          voornamen: partner2.voornamen,
          geslachtsnaam: partner2.achternaam,
          geboortedatum: convertDateFormat(partner2.geboortedatum),
          geboorteplaats: partner2.plaats || 'Onbekend',
          geboorteland: 'Nederland',
          // Email not in AankondigingData interface, so we don't set it
          oudersOnbekend: false,
        }).returning();
      }

      // Create children for partner 1 (if any)
      if (formData.kinderen?.partner1Children && formData.kinderen.partner1Children.length > 0) {
        for (const child of formData.kinderen.partner1Children) {
          await tx.insert(kind).values({
            dossierId: newDossier.id,
            gemeenteOin,
            partnerId: newPartner1.id,
            voornamen: child.voornamen,
            achternaam: child.achternaam,
            geboortedatum: convertDateFormat(child.geboortedatum),
          });
        }
      }

      // Create children for partner 2 (if any)
      if (formData.kinderen?.partner2Children && formData.kinderen.partner2Children.length > 0) {
        for (const child of formData.kinderen.partner2Children) {
          await tx.insert(kind).values({
            dossierId: newDossier.id,
            gemeenteOin,
            partnerId: newPartner2.id,
            voornamen: child.voornamen,
            achternaam: child.achternaam,
            geboortedatum: convertDateFormat(child.geboortedatum),
          });
        }
      }

      // Create dossier blocks
      const blocks: Array<'aankondiging' | 'ceremonie' | 'getuigen' | 'papieren' | 'betaling'> = [
        'aankondiging',
        'ceremonie',
        'getuigen',
        'papieren',
        'betaling',
      ];

      for (const blockCode of blocks) {
        await tx.insert(dossierBlock).values({
          dossierId: newDossier.id,
          gemeenteOin,
          code: blockCode,
          complete: blockCode === 'aankondiging', // Only aankondiging is complete
          required: true,
          completedAt: blockCode === 'aankondiging' ? new Date() : null,
          completedBy: blockCode === 'aankondiging' ? userId : null,
        });
      }

      return newDossier;
    });

    // 6. Return success response
    return NextResponse.json({
      success: true,
      dossierId: result.id,
      message: 'Aankondiging succesvol opgeslagen in database',
    });

  } catch (error) {
    console.error('Error saving aankondiging to database:', error);
    
    // Return appropriate error message
    const errorMessage = error instanceof Error 
      ? error.message 
      : 'Er ging iets mis bij het opslaan van uw aankondiging';

    return NextResponse.json(
      { 
        success: false, 
        error: errorMessage,
        details: process.env.NODE_ENV === 'development' ? String(error) : undefined,
      },
      { status: 500 }
    );
  }
}

