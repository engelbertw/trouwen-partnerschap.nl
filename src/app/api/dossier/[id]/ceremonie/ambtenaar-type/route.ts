import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/db';
import { ceremonie, locatie, dossier } from '@/db/schema';
import { eq } from 'drizzle-orm';

/**
 * PUT /api/dossier/[id]/ceremonie/ambtenaar-type
 * Save whether user wants gemeente or eigen BABS
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
    const { eigenBabs } = await request.json();

    if (typeof eigenBabs !== 'boolean') {
      return NextResponse.json(
        { success: false, error: 'eigenBabs moet een boolean zijn' },
        { status: 400 }
      );
    }

    // Verify dossier exists and user owns it
    const [dossierCheck] = await db
      .select()
      .from(dossier)
      .where(eq(dossier.id, dossierId))
      .limit(1);

    if (!dossierCheck) {
      return NextResponse.json(
        { success: false, error: 'Dossier niet gevonden' },
        { status: 404 }
      );
    }

    if (dossierCheck.createdBy !== userId) {
      return NextResponse.json(
        { success: false, error: 'Geen toegang tot dit dossier' },
        { status: 403 }
      );
    }

    // Check if ceremony record exists
    const [existingCeremonie] = await db
      .select()
      .from(ceremonie)
      .where(eq(ceremonie.dossierId, dossierId))
      .limit(1);

    if (existingCeremonie) {
      // Update existing ceremony
      const [updated] = await db
        .update(ceremonie)
        .set({ 
          eigenBabs,
          updatedAt: new Date(),
        })
        .where(eq(ceremonie.id, existingCeremonie.id))
        .returning();

      return NextResponse.json({
        success: true,
        data: updated,
        message: 'Ambtenaar type opgeslagen',
      });
    } else {
      // Ceremony record doesn't exist yet - user might have skipped datum/tijd step
      // We cannot create a ceremony without datum/tijd (required fields)
      return NextResponse.json({
        success: false,
        error: 'Selecteer eerst een datum en tijd voor de ceremonie',
      }, { status: 400 });
    }
  } catch (error) {
    console.error('Error saving ambtenaar type:', error);
    return NextResponse.json(
      { success: false, error: 'Er ging iets mis bij het opslaan' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/dossier/[id]/ceremonie/ambtenaar-type
 * Get the saved ambtenaar type
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

    // Verify dossier exists and user owns it
    const [dossierCheck] = await db
      .select()
      .from(dossier)
      .where(eq(dossier.id, dossierId))
      .limit(1);

    if (!dossierCheck) {
      return NextResponse.json(
        { success: false, error: 'Dossier niet gevonden' },
        { status: 404 }
      );
    }

    if (dossierCheck.createdBy !== userId) {
      return NextResponse.json(
        { success: false, error: 'Geen toegang tot dit dossier' },
        { status: 403 }
      );
    }

    const [existingCeremonie] = await db
      .select({
        eigenBabs: ceremonie.eigenBabs,
      })
      .from(ceremonie)
      .where(eq(ceremonie.dossierId, dossierId))
      .limit(1);

    if (!existingCeremonie) {
      return NextResponse.json({
        success: true,
        data: { eigenBabs: null },
      });
    }

    return NextResponse.json({
      success: true,
      data: { eigenBabs: existingCeremonie.eigenBabs },
    });
  } catch (error) {
    console.error('Error fetching ambtenaar type:', error);
    return NextResponse.json(
      { success: false, error: 'Er ging iets mis bij het ophalen' },
      { status: 500 }
    );
  }
}

