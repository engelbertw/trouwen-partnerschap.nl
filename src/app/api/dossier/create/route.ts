import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/db';
import { dossier, dossierBlock } from '@/db/schema';

/**
 * POST /api/dossier/create
 * 
 * Creates a new dossier when user starts the aankondiging flow
 * Returns dossier ID to use for all subsequent updates
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

    // 2. Get request data (optional initial data)
    const body = await request.json();
    const { type } = body; // 'huwelijk' or 'partnerschap'

    // 3. Get gemeente OIN (from user settings or hardcoded)
    const gemeenteOin = '00000001002564440000'; // Example OIN

    // 4. Create dossier in transaction
    const result = await db.transaction(async (tx) => {
      // Create main dossier
      const [newDossier] = await tx.insert(dossier).values({
        gemeenteOin,
        status: 'draft',
        createdBy: userId,
        municipalityCode: 'NL.IMBAG.Gemeente.0363',
        isTest: process.env.NODE_ENV !== 'production',
      }).returning();

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
          complete: false,
          required: true,
        });
      }

      return newDossier;
    });

    // 5. Return dossier ID
    return NextResponse.json({
      success: true,
      dossierId: result.id,
    });

  } catch (error) {
    console.error('Error creating dossier:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Er ging iets mis bij het aanmaken van het dossier',
        details: process.env.NODE_ENV === 'development' ? String(error) : undefined,
      },
      { status: 500 }
    );
  }
}

