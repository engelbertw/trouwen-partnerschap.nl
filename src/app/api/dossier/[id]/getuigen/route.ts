import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/db';
import { getuige, dossier } from '@/db/schema';
import { eq, and, desc } from 'drizzle-orm';

/**
 * GET /api/dossier/[id]/getuigen
 * Fetch all witnesses for a dossier
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

    // Verify ownership
    if (dossierRecord.createdBy !== userId) {
      return NextResponse.json(
        { success: false, error: 'Geen toegang tot dit dossier' },
        { status: 403 }
      );
    }

    // Fetch all witnesses for this dossier
    const getuigenList = await db
      .select()
      .from(getuige)
      .where(eq(getuige.dossierId, dossierId))
      .orderBy(getuige.volgorde);

    // Format dates for frontend (DD-MM-YYYY)
    const formattedGetuigen = getuigenList.map(g => ({
      ...g,
      geboortedatum: g.geboortedatum ? formatDateForDisplay(g.geboortedatum) : '',
    }));

    return NextResponse.json({
      success: true,
      getuigen: formattedGetuigen,
    });
  } catch (error) {
    console.error('Error fetching getuigen:', error);
    return NextResponse.json(
      { success: false, error: 'Er ging iets mis bij het ophalen van de getuigen' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/dossier/[id]/getuigen
 * Create or update witnesses for a dossier
 */
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { userId, orgId } = await auth();
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id: dossierId } = await context.params;
    const body = await request.json();
    const { getuigen: getuigenData } = body;

    if (!Array.isArray(getuigenData) || getuigenData.length < 2 || getuigenData.length > 4) {
      return NextResponse.json(
        { success: false, error: 'U moet minimaal 2 en maximaal 4 getuigen opgeven' },
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

    // Verify ownership
    if (dossierRecord.createdBy !== userId) {
      return NextResponse.json(
        { success: false, error: 'Geen toegang tot dit dossier' },
        { status: 403 }
      );
    }

    // Delete existing witnesses
    await db.delete(getuige).where(eq(getuige.dossierId, dossierId));

    // Insert new witnesses
    // Valid document status values from enum
    type DocumentStatus = 'ontbreekt' | 'ingeleverd' | 'goedgekeurd' | 'afgekeurd';
    
    const getuigenToInsert = getuigenData.map((g, index) => ({
      dossierId: dossierId,
      gemeenteOin: dossierRecord.gemeenteOin,
      isGemeentelijkeGetuige: false,
      voornamen: g.voornamen,
      voorvoegsel: g.voorvoegsel || null,
      achternaam: g.achternaam,
      geboortedatum: formatDateForDatabase(g.geboortedatum),
      geboorteplaats: g.geboorteplaats || null,
      documentUploadId: g.documentUploadId || null,
      documentStatus: (g.documentUploadId ? 'ingeleverd' : 'ontbreekt') as DocumentStatus,
      volgorde: index + 1,
    }));

    const insertedGetuigen = await db.insert(getuige).values(getuigenToInsert).returning();

    return NextResponse.json({
      success: true,
      getuigen: insertedGetuigen,
      message: 'Getuigen succesvol opgeslagen',
    });
  } catch (error) {
    console.error('Error saving getuigen:', error);
    return NextResponse.json(
      { success: false, error: 'Er ging iets mis bij het opslaan van de getuigen' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/dossier/[id]/getuigen
 * Delete all witnesses for a dossier
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

    // Verify ownership
    if (dossierRecord.createdBy !== userId) {
      return NextResponse.json(
        { success: false, error: 'Geen toegang tot dit dossier' },
        { status: 403 }
      );
    }

    // Delete witnesses
    await db.delete(getuige).where(eq(getuige.dossierId, dossierId));

    return NextResponse.json({
      success: true,
      message: 'Getuigen succesvol verwijderd',
    });
  } catch (error) {
    console.error('Error deleting getuigen:', error);
    return NextResponse.json(
      { success: false, error: 'Er ging iets mis bij het verwijderen van de getuigen' },
      { status: 500 }
    );
  }
}

// Helper functions
function formatDateForDisplay(dateValue: string | Date): string {
  if (!dateValue) return '';
  
  const date = typeof dateValue === 'string' ? new Date(dateValue) : dateValue;
  
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  
  return `${day}-${month}-${year}`;
}

/**
 * Convert Dutch date format (DD-MM-YYYY) to PostgreSQL format (YYYY-MM-DD)
 */
function formatDateForDatabase(dateString: string): string {
  if (!dateString) return '';
  
  // If already in YYYY-MM-DD format (PostgreSQL), return as is
  if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
    return dateString;
  }
  
  // If in DD-MM-YYYY format (Dutch), convert to YYYY-MM-DD
  if (dateString.match(/^\d{2}-\d{2}-\d{4}$/)) {
    const [day, month, year] = dateString.split('-');
    return `${year}-${month}-${day}`;
  }
  
  return dateString;
}

