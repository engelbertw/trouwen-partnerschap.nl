import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { locatie } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { getGemeenteContext, isLocatieAdmin } from '@/lib/gemeente';

/**
 * GET /api/locaties/beschikbaarheid
 * Get locatie own availability (for locatie admin only)
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

    // Only locatie admin can access their own availability
    if (!isLocatieAdmin(context.data.rol) || !context.data.locatieId) {
      return NextResponse.json(
        { success: false, error: 'Geen toegang. Alleen locatie beheerders kunnen hun eigen beschikbaarheid beheren.' },
        { status: 403 }
      );
    }

    const [locatieData] = await db
      .select({
        id: locatie.id,
        naam: locatie.naam,
        code: locatie.code,
        type: locatie.type,
        beschikbaarheid: locatie.beschikbaarheid,
        beschikbaarVanaf: locatie.beschikbaarVanaf,
        beschikbaarTot: locatie.beschikbaarTot,
        opmerkingBeschikbaarheid: locatie.opmerkingBeschikbaarheid,
        email: locatie.email,
      })
      .from(locatie)
      .where(eq(locatie.id, context.data.locatieId))
      .limit(1);

    if (!locatieData) {
      return NextResponse.json(
        { success: false, error: 'Locatie gegevens niet gevonden' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: locatieData,
    });
  } catch (error) {
    console.error('Error fetching locatie beschikbaarheid:', error);
    return NextResponse.json(
      { success: false, error: 'Er ging iets mis bij het ophalen van beschikbaarheid' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/locaties/beschikbaarheid
 * Update locatie own availability (for locatie admin only)
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

    // Only locatie admin can update their own availability
    if (!isLocatieAdmin(context.data.rol) || !context.data.locatieId) {
      return NextResponse.json(
        { success: false, error: 'Geen toegang. Alleen locatie beheerders kunnen hun eigen beschikbaarheid beheren.' },
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
      .update(locatie)
      .set(updateData)
      .where(eq(locatie.id, context.data.locatieId))
      .returning({
        id: locatie.id,
        naam: locatie.naam,
        beschikbaarheid: locatie.beschikbaarheid,
        beschikbaarVanaf: locatie.beschikbaarVanaf,
        beschikbaarTot: locatie.beschikbaarTot,
        opmerkingBeschikbaarheid: locatie.opmerkingBeschikbaarheid,
        email: locatie.email,
      });

    if (!updated) {
      return NextResponse.json(
        { success: false, error: 'Locatie niet gevonden' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: updated,
      message: 'Beschikbaarheid succesvol bijgewerkt',
    });
  } catch (error) {
    console.error('Error updating locatie beschikbaarheid:', error);
    return NextResponse.json(
      { success: false, error: 'Er ging iets mis bij het bijwerken van beschikbaarheid' },
      { status: 500 }
    );
  }
}

