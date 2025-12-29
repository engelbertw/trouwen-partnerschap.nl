import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/db';
import { kind, dossier, partner } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

/**
 * PUT /api/dossier/[id]/kinderen
 * 
 * Updates children for both partners
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
    const { partner1Children, partner2Children } = body;

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

    const gemeenteOin = existingDossier.gemeenteOin;

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

    const [partner1, partner2] = partners;

    // Helper function to convert DD-MM-YYYY to YYYY-MM-DD
    const convertDateFormat = (dateStr: string): string => {
      if (!dateStr) return '';
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
      if (/^\d{2}-\d{2}-\d{4}$/.test(dateStr)) {
        const [day, month, year] = dateStr.split('-');
        return `${year}-${month}-${day}`;
      }
      throw new Error(`Invalid date format: ${dateStr}`);
    };

    await db.transaction(async (tx) => {
      // Delete existing children for both partners
      await tx.delete(kind).where(eq(kind.dossierId, dossierId));

      // Insert partner 1 children
      if (partner1Children && Array.isArray(partner1Children)) {
        for (const child of partner1Children) {
          await tx.insert(kind).values({
            dossierId,
            gemeenteOin,
            partnerId: partner1.id,
            voornamen: child.voornamen,
            achternaam: child.achternaam,
            geboortedatum: convertDateFormat(child.geboortedatum),
          });
        }
      }

      // Insert partner 2 children
      if (partner2Children && Array.isArray(partner2Children)) {
        for (const child of partner2Children) {
          await tx.insert(kind).values({
            dossierId,
            gemeenteOin,
            partnerId: partner2.id,
            voornamen: child.voornamen,
            achternaam: child.achternaam,
            geboortedatum: convertDateFormat(child.geboortedatum),
          });
        }
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Kinderen opgeslagen',
    });

  } catch (error) {
    console.error('Error updating kinderen:', error);
    
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
 * GET /api/dossier/[id]/kinderen
 * 
 * Gets children for a dossier
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

    if (partners.length === 0) {
      return NextResponse.json({
        success: true,
        data: { partner1Children: [], partner2Children: [] },
      });
    }

    // Get children
    const children = await db
      .select()
      .from(kind)
      .where(eq(kind.dossierId, dossierId));

    const partner1Children = children.filter(
      (child) => child.partnerId === partners[0]?.id
    );
    const partner2Children = children.filter(
      (child) => child.partnerId === partners[1]?.id
    );

    // Helper to convert date back to DD-MM-YYYY
    const formatDate = (date: string): string => {
      if (!date) return '';
      const [year, month, day] = date.split('-');
      return `${day}-${month}-${year}`;
    };

    return NextResponse.json({
      success: true,
      data: {
        partner1Children: partner1Children.map((child) => ({
          id: child.id,
          voornamen: child.voornamen,
          achternaam: child.achternaam,
          geboortedatum: formatDate(child.geboortedatum),
        })),
        partner2Children: partner2Children.map((child) => ({
          id: child.id,
          voornamen: child.voornamen,
          achternaam: child.achternaam,
          geboortedatum: formatDate(child.geboortedatum),
        })),
      },
    });

  } catch (error) {
    console.error('Error fetching kinderen:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Er ging iets mis',
      },
      { status: 500 }
    );
  }
}

