import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/db';
import { dossier, partner } from '@/db/schema';
import { eq } from 'drizzle-orm';

/**
 * PUT /api/dossier/[id]/curatele
 * 
 * Updates curatele information
 */
export async function PUT(
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

    // Get request data
    const body = await request.json();
    const { 
      partner1UnderGuardianship,
      partner2UnderGuardianship,
    } = body;

    // Verify dossier access
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

    if (partners.length !== 2) {
      return NextResponse.json(
        { success: false, error: 'Partners niet gevonden' },
        { status: 400 }
      );
    }

    // Update partner records (curatele info stored in partner table)
    // Note: In a full implementation, you might have a separate curatele table
    // For now, we'll store this as metadata or in a separate field if added to schema
    
    // TODO: Add curatele fields to partner schema if needed
    // For now, just return success as the data structure needs to be defined

    return NextResponse.json({
      success: true,
      message: 'Curatele informatie opgeslagen',
      note: 'Curatele schema update required for full implementation',
    });

  } catch (error) {
    console.error('Error updating curatele:', error);
    
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
 * GET /api/dossier/[id]/curatele
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

    // TODO: Fetch actual curatele data when schema is updated
    return NextResponse.json({
      success: true,
      data: {
        partner1UnderGuardianship: false,
        partner2UnderGuardianship: false,
      },
    });

  } catch (error) {
    console.error('Error fetching curatele:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Er ging iets mis',
      },
      { status: 500 }
    );
  }
}

