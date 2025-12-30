import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { documentOptie } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { getGemeenteContext, isAdmin } from '@/lib/gemeente';

/**
 * PUT /api/gemeente/lookup/documenten/[id]
 * Updates a document option
 */
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const gemeenteContext = await getGemeenteContext();
    if (!gemeenteContext.success) {
      return NextResponse.json(
        { success: false, error: gemeenteContext.error },
        { status: 401 }
      );
    }

    // Only admins can update document options
    if (!isAdmin(gemeenteContext.data.rol)) {
      return NextResponse.json(
        { success: false, error: 'Alleen beheerders kunnen documentopties bijwerken' },
        { status: 403 }
      );
    }

    const { id } = await context.params;
    const body = await request.json();
    const { code, naam, omschrijving, papierType, prijsCents, gratis, verplicht, actief, volgorde } = body;

    if (!code || !naam || !papierType) {
      return NextResponse.json(
        { success: false, error: 'Code, naam en papierType zijn verplicht' },
        { status: 400 }
      );
    }

    // Validate gratis/prijs logic
    if (gratis && prijsCents > 0) {
      return NextResponse.json(
        { success: false, error: 'Gratis documenten kunnen geen prijs hebben' },
        { status: 400 }
      );
    }

    // Update only if belongs to this gemeente
    const [updated] = await db
      .update(documentOptie)
      .set({
        code,
        naam,
        omschrijving: omschrijving || null,
        papierType,
        prijsCents: prijsCents || 0,
        gratis: gratis || false,
        verplicht: verplicht || false,
        actief: actief !== undefined ? actief : true,
        volgorde: volgorde || 1,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(documentOptie.id, id),
          eq(documentOptie.gemeenteOin, gemeenteContext.data.gemeenteOin)
        )
      )
      .returning();

    if (!updated) {
      return NextResponse.json(
        { success: false, error: 'Document optie niet gevonden of geen toegang' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: updated,
    });
  } catch (error) {
    console.error('Error updating document option:', error);
    return NextResponse.json(
      { success: false, error: 'Er ging iets mis bij het bijwerken van documentoptie' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/gemeente/lookup/documenten/[id]
 * Deletes a document option
 */
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const gemeenteContext = await getGemeenteContext();
    if (!gemeenteContext.success) {
      return NextResponse.json(
        { success: false, error: gemeenteContext.error },
        { status: 401 }
      );
    }

    // Only admins can delete document options
    if (!isAdmin(gemeenteContext.data.rol)) {
      return NextResponse.json(
        { success: false, error: 'Alleen beheerders kunnen documentopties verwijderen' },
        { status: 403 }
      );
    }

    const { id } = await context.params;

    // Delete only if belongs to this gemeente
    const deleted = await db
      .delete(documentOptie)
      .where(
        and(
          eq(documentOptie.id, id),
          eq(documentOptie.gemeenteOin, gemeenteContext.data.gemeenteOin)
        )
      )
      .returning();

    if (deleted.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Document optie niet gevonden of geen toegang' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Document optie verwijderd',
    });
  } catch (error) {
    console.error('Error deleting document option:', error);
    return NextResponse.json(
      { success: false, error: 'Er ging iets mis bij het verwijderen van documentoptie' },
      { status: 500 }
    );
  }
}

