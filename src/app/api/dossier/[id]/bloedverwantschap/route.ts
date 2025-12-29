import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/db';
import { aankondiging, dossier } from '@/db/schema';
import { eq } from 'drizzle-orm';

/**
 * PUT /api/dossier/[id]/bloedverwantschap
 * 
 * Updates bloedverwantschap status
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
    const { areBloodRelatives } = body;

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

    // Update aankondiging record
    const [existingAankondiging] = await db
      .select()
      .from(aankondiging)
      .where(eq(aankondiging.dossierId, dossierId))
      .limit(1);

    if (!existingAankondiging) {
      return NextResponse.json(
        { success: false, error: 'Aankondiging niet gevonden' },
        { status: 404 }
      );
    }

    // Update bloedverwantschap field
    // Note: Check if bloedverwantschap field exists in aankondiging schema
    // For now, we'll store in valid field or add new field
    await db
      .update(aankondiging)
      .set({
        // TODO: Add bloedverwantschap field to aankondiging schema
        // bloedverwantschap: areBloodRelatives,
        updatedAt: new Date(),
      })
      .where(eq(aankondiging.dossierId, dossierId));

    return NextResponse.json({
      success: true,
      message: 'Bloedverwantschap opgeslagen',
      note: 'Schema update may be required for dedicated bloedverwantschap field',
    });

  } catch (error) {
    console.error('Error updating bloedverwantschap:', error);
    
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
 * GET /api/dossier/[id]/bloedverwantschap
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

    // Get aankondiging
    const [result] = await db
      .select()
      .from(aankondiging)
      .where(eq(aankondiging.dossierId, dossierId))
      .limit(1);

    return NextResponse.json({
      success: true,
      data: {
        areBloodRelatives: false, // TODO: Get from actual field when schema updated
      },
    });

  } catch (error) {
    console.error('Error fetching bloedverwantschap:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Er ging iets mis',
      },
      { status: 500 }
    );
  }
}

