import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { babsGemeenteTarget } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { getGemeenteContext, isAdmin } from '@/lib/gemeente';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ babsId: string }> }
) {
  try {
    const context = await getGemeenteContext();
    if (!context.success) {
      return NextResponse.json(
        { success: false, error: context.error },
        { status: 401 }
      );
    }

    if (!isAdmin(context.data.rol)) {
      return NextResponse.json(
        { success: false, error: 'Alleen beheerders hebben toegang' },
        { status: 403 }
      );
    }

    const resolvedParams = await params;
    const { babsId } = resolvedParams;
    
    if (!babsId) {
      return NextResponse.json(
        { success: false, error: 'BABS ID is verplicht' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { jaar, targetCeremonies } = body;

    if (!jaar || targetCeremonies === undefined) {
      return NextResponse.json(
        { success: false, error: 'Jaar en targetCeremonies zijn verplicht' },
        { status: 400 }
      );
    }

    if (typeof targetCeremonies !== 'number' || targetCeremonies < 0) {
      return NextResponse.json(
        { success: false, error: 'Target ceremonies moet een positief getal zijn' },
        { status: 400 }
      );
    }

    const currentYear = new Date().getFullYear();
    if (jaar < currentYear || jaar > currentYear + 5) {
      return NextResponse.json(
        { success: false, error: `Jaar moet tussen ${currentYear} en ${currentYear + 5} liggen` },
        { status: 400 }
      );
    }

    if (!context.data.gemeenteOin) {
      return NextResponse.json(
        { success: false, error: 'Gemeente OIN is niet beschikbaar' },
        { status: 400 }
      );
    }

    // Upsert the target
    const [updatedTarget] = await db
      .insert(babsGemeenteTarget)
      .values({
        babsId,
        gemeenteOin: context.data.gemeenteOin,
        jaar,
        targetCeremonies,
      })
      .onConflictDoUpdate({
        target: [babsGemeenteTarget.babsId, babsGemeenteTarget.gemeenteOin, babsGemeenteTarget.jaar],
        set: { targetCeremonies, updatedAt: new Date() },
      })
      .returning();

    return NextResponse.json({
      success: true,
      data: updatedTarget,
    });
  } catch (error) {
    console.error('Error updating BABS target:', error);
    return NextResponse.json(
      { success: false, error: 'Er ging iets mis bij het bijwerken van het target' },
      { status: 500 }
    );
  }
}

