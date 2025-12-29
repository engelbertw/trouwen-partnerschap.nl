import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { babs } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { getGemeenteContext, isBabsAdmin } from '@/lib/gemeente';

/**
 * GET /api/babs/beschikbaarheid
 * Get BABS own availability (for BABS admin only)
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

    // Only BABS can access their own availability
    if (!isBabsAdmin(context.data.rol) || !context.data.babsId) {
      return NextResponse.json(
        { success: false, error: 'Geen toegang. Alleen BABS kunnen hun eigen beschikbaarheid beheren.' },
        { status: 403 }
      );
    }

    const [babsData] = await db
      .select({
        id: babs.id,
        naam: babs.naam,
        voornaam: babs.voornaam,
        tussenvoegsel: babs.tussenvoegsel,
        achternaam: babs.achternaam,
        beschikbaarheid: babs.beschikbaarheid,
        beschikbaarVanaf: babs.beschikbaarVanaf,
        beschikbaarTot: babs.beschikbaarTot,
        opmerkingBeschikbaarheid: babs.opmerkingBeschikbaarheid,
      })
      .from(babs)
      .where(eq(babs.id, context.data.babsId))
      .limit(1);

    if (!babsData) {
      return NextResponse.json(
        { success: false, error: 'BABS gegevens niet gevonden' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: babsData,
    });
  } catch (error) {
    console.error('Error fetching BABS beschikbaarheid:', error);
    return NextResponse.json(
      { success: false, error: 'Er ging iets mis bij het ophalen van beschikbaarheid' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/babs/beschikbaarheid
 * Update BABS own availability (for BABS admin only)
 */
export async function PUT(request: NextRequest) {
  try {
    const context = await getGemeenteContext();
    if (!context.success) {
      return NextResponse.json(
        { success: false, error: context.error },
        { status: 401 }
      );
    }

    // Only BABS can update their own availability
    if (!isBabsAdmin(context.data.rol) || !context.data.babsId) {
      return NextResponse.json(
        { success: false, error: 'Geen toegang. Alleen BABS kunnen hun eigen beschikbaarheid beheren.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { beschikbaarheid, beschikbaarVanaf, beschikbaarTot, opmerkingBeschikbaarheid, email } = body;

    // Validate beschikbaarheid format if provided
    if (beschikbaarheid && typeof beschikbaarheid !== 'object') {
      return NextResponse.json(
        { success: false, error: 'Ongeldige beschikbaarheid format' },
        { status: 400 }
      );
    }

    // Build update object (only include fields that are provided)
    const updateData: any = {
      updatedAt: new Date(),
    };

    if (beschikbaarheid !== undefined) {
      updateData.beschikbaarheid = beschikbaarheid || {};
    }
    if (beschikbaarVanaf !== undefined) {
      updateData.beschikbaarVanaf = beschikbaarVanaf || null;
    }
    if (beschikbaarTot !== undefined) {
      updateData.beschikbaarTot = beschikbaarTot || null;
    }
    if (opmerkingBeschikbaarheid !== undefined) {
      updateData.opmerkingBeschikbaarheid = opmerkingBeschikbaarheid || null;
    }
    if (email !== undefined) {
      // Validate email format if provided
      if (email && email.trim() && !email.includes('@')) {
        return NextResponse.json(
          { success: false, error: 'Ongeldig email adres' },
          { status: 400 }
        );
      }
      updateData.email = email && email.trim() ? email.trim() : null;
    }

    const [updated] = await db
      .update(babs)
      .set(updateData)
      .where(eq(babs.id, context.data.babsId))
      .returning({
        id: babs.id,
        naam: babs.naam,
        beschikbaarheid: babs.beschikbaarheid,
        beschikbaarVanaf: babs.beschikbaarVanaf,
        beschikbaarTot: babs.beschikbaarTot,
        opmerkingBeschikbaarheid: babs.opmerkingBeschikbaarheid,
        email: babs.email,
      });

    if (!updated) {
      return NextResponse.json(
        { success: false, error: 'BABS niet gevonden' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: updated,
      message: 'Beschikbaarheid succesvol bijgewerkt',
    });
  } catch (error) {
    console.error('Error updating BABS beschikbaarheid:', error);
    return NextResponse.json(
      { success: false, error: 'Er ging iets mis bij het bijwerken van beschikbaarheid' },
      { status: 500 }
    );
  }
}

