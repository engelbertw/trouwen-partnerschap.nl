import { NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { dossier, dossierBlock, gemeente } from '@/db/schema';
import { getGemeenteContext } from '@/lib/gemeente';

/**
 * POST /api/dossier/create
 * 
 * Creates a new dossier when user starts the aankondiging flow
 * Returns dossier ID to use for all subsequent updates
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Check authentication
    const context = await getGemeenteContext();
    if (!context.success) {
      return NextResponse.json(
        { success: false, error: context.error },
        { status: 401 }
      );
    }

    const { userId, gemeenteOin } = context.data;

    // 2. Get request data (optional initial data)
    const body = await request.json();
    const { type } = body; // 'huwelijk' or 'partnerschap'

    // 3. Resolve municipality code for this gemeente
    const [gemeenteRecord] = await db
      .select({ gemeenteCode: gemeente.gemeenteCode })
      .from(gemeente)
      .where(eq(gemeente.oin, gemeenteOin))
      .limit(1);

    if (!gemeenteRecord) {
      return NextResponse.json(
        { success: false, error: 'Gemeente niet gevonden. Controleer de configuratie.' },
        { status: 400 }
      );
    }

    const municipalityCode = gemeenteRecord.gemeenteCode.startsWith('NL.IMBAG.Gemeente.')
      ? gemeenteRecord.gemeenteCode
      : `NL.IMBAG.Gemeente.${gemeenteRecord.gemeenteCode}`;

    // 4. Create dossier in transaction
    const result = await db.transaction(async (tx) => {
      // Create main dossier
      const [newDossier] = await tx.insert(dossier).values({
        gemeenteOin,
        status: 'draft',
        createdBy: userId,
        municipalityCode,
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

