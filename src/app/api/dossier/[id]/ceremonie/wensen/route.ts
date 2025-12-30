import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { ceremonie, ceremonieWensSelectie, ceremonieCustomWens, dossier } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { auth } from '@clerk/nextjs/server';

/**
 * GET /api/dossier/[id]/ceremonie/wensen
 * Get saved ceremony wishes for a dossier
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

    // Get ceremonie for this dossier
    const [ceremonieData] = await db
      .select()
      .from(ceremonie)
      .where(eq(ceremonie.dossierId, dossierId))
      .limit(1);

    if (!ceremonieData) {
      return NextResponse.json({
        success: true,
        data: {
          selectedWishes: [],
          customWishes: '',
        },
      });
    }

    // Get selected wishes
    const selectedWishes = await db
      .select({ wensId: ceremonieWensSelectie.wensId })
      .from(ceremonieWensSelectie)
      .where(eq(ceremonieWensSelectie.ceremonieId, ceremonieData.id));

    // Get custom wishes
    const [customWishData] = await db
      .select()
      .from(ceremonieCustomWens)
      .where(eq(ceremonieCustomWens.ceremonieId, ceremonieData.id))
      .limit(1);

    return NextResponse.json({
      success: true,
      data: {
        selectedWishes: selectedWishes.map((w) => w.wensId),
        customWishes: customWishData?.wensTekst || '',
      },
    });
  } catch (error) {
    console.error('Error fetching ceremony wishes:', error);
    return NextResponse.json(
      { success: false, error: 'Er ging iets mis bij het ophalen van de wensen' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/dossier/[id]/ceremonie/wensen
 * Save ceremony wishes for a dossier
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
    const body = await request.json();
    const { selectedWishes = [], customWishes = '' } = body;

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

    // Get or create ceremonie for this dossier
    let [ceremonieData] = await db
      .select()
      .from(ceremonie)
      .where(eq(ceremonie.dossierId, dossierId))
      .limit(1);

    if (!ceremonieData) {
      return NextResponse.json(
        { success: false, error: 'Ceremonie niet gevonden. Kies eerst een datum en locatie.' },
        { status: 404 }
      );
    }

    // Delete existing wish selections
    await db
      .delete(ceremonieWensSelectie)
      .where(eq(ceremonieWensSelectie.ceremonieId, ceremonieData.id));

    // Insert new wish selections
    if (selectedWishes.length > 0) {
      await db.insert(ceremonieWensSelectie).values(
        selectedWishes.map((wensId: string) => ({
          ceremonieId: ceremonieData.id,
          wensId,
        }))
      );
    }

    // Handle custom wishes
    if (customWishes.trim()) {
      // Check if custom wish already exists
      const [existingCustomWish] = await db
        .select()
        .from(ceremonieCustomWens)
        .where(eq(ceremonieCustomWens.ceremonieId, ceremonieData.id))
        .limit(1);

      if (existingCustomWish) {
        // Update existing
        await db
          .update(ceremonieCustomWens)
          .set({
            wensTekst: customWishes.trim(),
            updatedAt: new Date(),
          })
          .where(eq(ceremonieCustomWens.id, existingCustomWish.id));
      } else {
        // Insert new
        await db.insert(ceremonieCustomWens).values({
          ceremonieId: ceremonieData.id,
          wensTekst: customWishes.trim(),
          status: 'pending',
        });
      }
    } else {
      // Delete custom wish if text is empty
      await db
        .delete(ceremonieCustomWens)
        .where(eq(ceremonieCustomWens.ceremonieId, ceremonieData.id));
    }

    return NextResponse.json({
      success: true,
      message: 'Ceremoniewensen opgeslagen',
    });
  } catch (error) {
    console.error('Error saving ceremony wishes:', error);
    return NextResponse.json(
      { success: false, error: 'Er ging iets mis bij het opslaan van de wensen' },
      { status: 500 }
    );
  }
}

