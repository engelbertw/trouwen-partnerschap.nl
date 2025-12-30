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

    // Update partner records with curatele information
    const partner1 = partners.find(p => p.sequence === 1);
    const partner2 = partners.find(p => p.sequence === 2);

    if (!partner1 || !partner2) {
      return NextResponse.json(
        { success: false, error: 'Partners niet correct gevonden' },
        { status: 400 }
      );
    }

    // Update partner 1
    await db
      .update(partner)
      .set({
        onderCuratele: partner1UnderGuardianship || false,
        updatedAt: new Date(),
      })
      .where(eq(partner.id, partner1.id));

    // Update partner 2
    await db
      .update(partner)
      .set({
        onderCuratele: partner2UnderGuardianship || false,
        updatedAt: new Date(),
      })
      .where(eq(partner.id, partner2.id));

    return NextResponse.json({
      success: true,
      message: 'Curatele informatie opgeslagen',
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

    // Fetch partners with curatele information
    const partners = await db
      .select({
        sequence: partner.sequence,
        onderCuratele: partner.onderCuratele,
      })
      .from(partner)
      .where(eq(partner.dossierId, dossierId))
      .orderBy(partner.sequence);

    const partner1 = partners.find(p => p.sequence === 1);
    const partner2 = partners.find(p => p.sequence === 2);

    return NextResponse.json({
      success: true,
      data: {
        partner1UnderGuardianship: partner1?.onderCuratele || false,
        partner2UnderGuardianship: partner2?.onderCuratele || false,
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

