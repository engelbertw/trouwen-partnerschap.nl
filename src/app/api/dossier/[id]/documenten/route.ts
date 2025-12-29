import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/db';
import { papier, dossier, documentOptie, dossierBlock } from '@/db/schema';
import { eq } from 'drizzle-orm';

/**
 * GET /api/dossier/[id]/documenten
 * Fetch selected documents for a dossier and available options
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id: dossierId } = await context.params;

    // Verify dossier belongs to user
    const [dossierRecord] = await db
      .select()
      .from(dossier)
      .where(eq(dossier.id, dossierId))
      .limit(1);

    if (!dossierRecord) {
      return NextResponse.json(
        { success: false, error: 'Dossier niet gevonden' },
        { status: 404 }
      );
    }

    if (dossierRecord.createdBy !== userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Fetch available document options for this gemeente
    const documentOptionsRaw = await db
      .select()
      .from(documentOptie)
      .where(eq(documentOptie.gemeenteOin, dossierRecord.gemeenteOin))
      .orderBy(documentOptie.volgorde);

    // Format document options to camelCase for frontend
    const documentOptions = documentOptionsRaw.map(doc => ({
      id: doc.id,
      code: doc.code,
      naam: doc.naam,
      omschrijving: doc.omschrijving || '',
      papierType: doc.papierType,
      prijsCents: doc.prijsCents,
      gratis: doc.gratis,
      verplicht: doc.verplicht,
      volgorde: doc.volgorde,
    }));

    // Fetch all documents for this dossier
    const documenten = await db
      .select()
      .from(papier)
      .where(eq(papier.dossierId, dossierId));

    // Map to document codes
    const selections = documenten.map(doc => doc.omschrijving || doc.type);

    return NextResponse.json({
      success: true,
      documentOptions,
      selections: Array.from(new Set(selections)), // Remove duplicates
    });
  } catch (error) {
    console.error('Error fetching documenten:', error);
    return NextResponse.json(
      { success: false, error: 'Er ging iets mis bij het ophalen van de documenten' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/dossier/[id]/documenten
 * Create or update document selections for a dossier
 */
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id: dossierId } = await context.params;
    const body = await request.json();
    const { documents } = body;

    if (!Array.isArray(documents)) {
      return NextResponse.json(
        { success: false, error: 'Ongeldige documentenselectie' },
        { status: 400 }
      );
    }

    // Verify dossier belongs to user
    const [dossierRecord] = await db
      .select()
      .from(dossier)
      .where(eq(dossier.id, dossierId))
      .limit(1);

    if (!dossierRecord) {
      return NextResponse.json(
        { success: false, error: 'Dossier niet gevonden' },
        { status: 404 }
      );
    }

    if (dossierRecord.createdBy !== userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Delete existing documents
    await db.delete(papier).where(eq(papier.dossierId, dossierId));

    // Insert new documents
    if (documents.length > 0) {
      const documentsToInsert = documents.map((doc: { documentId: string; code: string; type: string }) => ({
        dossierId: dossierId,
        gemeenteOin: dossierRecord.gemeenteOin,
        type: doc.type,
        status: 'ontbreekt' as const,
        omschrijving: doc.code, // Store the document code
      }));

      await db.insert(papier).values(documentsToInsert);
    }

    // Note: We don't mark the block as complete here because documents need to be
    // approved/uploaded first. The block will be marked complete by the municipality
    // or document verification flow.

    return NextResponse.json({
      success: true,
      message: 'Documenten succesvol opgeslagen',
    });
  } catch (error) {
    console.error('Error saving documenten:', error);
    return NextResponse.json(
      { success: false, error: 'Er ging iets mis bij het opslaan van de documenten' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/dossier/[id]/documenten
 * Delete all document selections for a dossier
 */
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id: dossierId } = await context.params;

    // Verify dossier belongs to user
    const [dossierRecord] = await db
      .select()
      .from(dossier)
      .where(eq(dossier.id, dossierId))
      .limit(1);

    if (!dossierRecord) {
      return NextResponse.json(
        { success: false, error: 'Dossier niet gevonden' },
        { status: 404 }
      );
    }

    if (dossierRecord.createdBy !== userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Delete documents
    await db.delete(papier).where(eq(papier.dossierId, dossierId));

    return NextResponse.json({
      success: true,
      message: 'Documenten succesvol verwijderd',
    });
  } catch (error) {
    console.error('Error deleting documenten:', error);
    return NextResponse.json(
      { success: false, error: 'Er ging iets mis bij het verwijderen van de documenten' },
      { status: 500 }
    );
  }
}

