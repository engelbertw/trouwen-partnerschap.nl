import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { dossier } from '@/db/schema';
import { eq } from 'drizzle-orm';

/**
 * PUT /api/dossier/[id]/ceremonie/type
 * Save the selected ceremony type to the DOSSIER table  
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: dossierId } = await params;
    const { typeCeremonieId } = await request.json();

    if (!typeCeremonieId) {
      return NextResponse.json(
        { success: false, error: 'Type ceremonie ID is verplicht' },
        { status: 400 }
      );
    }

    // Update the dossier with the selected ceremony type
    const [updated] = await db
      .update(dossier)
      .set({ 
        typeCeremonieId,
        updatedAt: new Date(),
      })
      .where(eq(dossier.id, dossierId))
      .returning();

    if (!updated) {
      return NextResponse.json(
        { success: false, error: 'Dossier niet gevonden' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: updated,
      message: 'Type ceremonie opgeslagen',
    });
  } catch (error) {
    console.error('Error saving ceremony type:', error);
    return NextResponse.json(
      { success: false, error: 'Er ging iets mis bij het opslaan' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/dossier/[id]/ceremonie/type
 * Get the selected ceremony type from the DOSSIER table
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: dossierId } = await params;

    const [existingDossier] = await db
      .select({
        typeCeremonieId: dossier.typeCeremonieId,
      })
      .from(dossier)
      .where(eq(dossier.id, dossierId))
      .limit(1);

    if (!existingDossier) {
      return NextResponse.json({
        success: false,
        error: 'Dossier niet gevonden',
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: { typeCeremonieId: existingDossier.typeCeremonieId },
    });
  } catch (error) {
    console.error('Error fetching ceremony type:', error);
    return NextResponse.json(
      { success: false, error: 'Er ging iets mis bij het ophalen' },
      { status: 500 }
    );
  }
}
