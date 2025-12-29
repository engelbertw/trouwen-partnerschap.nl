import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { babs, babsAuditLog } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { getGemeenteContext, isAdmin } from '@/lib/gemeente';
import { clerkClient } from '@clerk/nextjs/server';

/**
 * PUT /api/gemeente/lookup/babs/[id]
 * Update a BABS
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const context = await getGemeenteContext();
    if (!context.success) {
      return NextResponse.json(
        { success: false, error: context.error },
        { status: 401 }
      );
    }

    // Only admins can update BABS records
    if (!isAdmin(context.data.rol)) {
      return NextResponse.json(
        { success: false, error: 'Geen toegang' },
        { status: 403 }
      );
    }

    const resolvedParams = await params;
    const { id } = resolvedParams;
    const body = await request.json();

    const { 
      code, naam, voornaam, tussenvoegsel, achternaam, status, 
      beedigdVanaf, beedigdTot, aanvraagDatum, opmerkingen, 
      beschikbaarVanaf, beschikbaarTot, opmerkingBeschikbaarheid,
      talen, // Talen die deze BABS spreekt
      email, // Email adres
      actief 
    } = body;

    if (!naam || !achternaam) {
      return NextResponse.json(
        { success: false, error: 'Naam en achternaam zijn verplicht' },
        { status: 400 }
      );
    }

    // Fetch current BABS data for audit comparison
    const [currentBabs] = await db
      .select()
      .from(babs)
      .where(eq(babs.id, id))
      .limit(1);

    if (!currentBabs) {
      return NextResponse.json(
        { success: false, error: 'BABS niet gevonden' },
        { status: 404 }
      );
    }

    // Get user info for audit log
    const client = await clerkClient();
    const user = await client.users.getUser(context.data.userId);
    const userName = user.firstName && user.lastName 
      ? `${user.firstName} ${user.lastName}` 
      : user.emailAddresses[0]?.emailAddress || 'Onbekend';

    // Track fields that need audit logging
    const auditFields = [
      { name: 'status', oldValue: currentBabs.status, newValue: status },
      { name: 'actief', oldValue: String(currentBabs.actief), newValue: String(actief) },
      { name: 'beedigdVanaf', oldValue: currentBabs.beedigdVanaf, newValue: beedigdVanaf },
      { name: 'beedigdTot', oldValue: currentBabs.beedigdTot, newValue: beedigdTot },
      { name: 'beschikbaarVanaf', oldValue: currentBabs.beschikbaarVanaf, newValue: beschikbaarVanaf },
      { name: 'beschikbaarTot', oldValue: currentBabs.beschikbaarTot, newValue: beschikbaarTot },
      { name: 'opmerkingBeschikbaarheid', oldValue: currentBabs.opmerkingBeschikbaarheid, newValue: opmerkingBeschikbaarheid },
      { name: 'email', oldValue: currentBabs.email, newValue: email },
    ];

    // Validate talen if provided
    let talenArray = currentBabs.talen || ['nl'];
    if (talen !== undefined) {
      talenArray = Array.isArray(talen) ? talen : (talen ? JSON.parse(talen) : ['nl']);
      if (!Array.isArray(talenArray) || talenArray.length === 0) {
        return NextResponse.json(
          { success: false, error: 'Minimaal 1 taal is vereist' },
          { status: 400 }
        );
      }
    }

    // Update BABS
    const [updatedBabs] = await db
      .update(babs)
      .set({
        code: code || null,
        naam,
        voornaam: voornaam || null,
        tussenvoegsel: tussenvoegsel || null,
        achternaam,
        status: status || 'in_aanvraag',
        beedigdVanaf: beedigdVanaf || null,
        beedigdTot: beedigdTot || null,
        aanvraagDatum: aanvraagDatum || null,
        opmerkingen: opmerkingen || null,
        beschikbaarVanaf: beschikbaarVanaf || null,
        beschikbaarTot: beschikbaarTot || null,
        opmerkingBeschikbaarheid: opmerkingBeschikbaarheid || null,
        talen: talenArray,
        email: email !== undefined ? (email && email.trim() ? email.trim() : null) : currentBabs.email,
        actief: actief !== undefined ? actief : true,
        updatedAt: new Date(),
      })
      .where(eq(babs.id, id))
      .returning();

    // Create audit log entries for changed fields
    const auditEntries = auditFields
      .filter(field => {
        const oldVal = field.oldValue === null ? '' : String(field.oldValue);
        const newVal = field.newValue === null || field.newValue === undefined ? '' : String(field.newValue);
        return oldVal !== newVal;
      })
      .map(field => ({
        babsId: id,
        fieldName: field.name,
        oldValue: field.oldValue === null ? null : String(field.oldValue),
        newValue: field.newValue === null || field.newValue === undefined ? null : String(field.newValue),
        changedBy: context.data.userId,
        changedByName: userName,
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || null,
      }));

    if (auditEntries.length > 0) {
      await db.insert(babsAuditLog).values(auditEntries);
    }

    return NextResponse.json({
      success: true,
      data: updatedBabs,
    });
  } catch (error) {
    console.error('Error updating BABS:', error);
    return NextResponse.json(
      { success: false, error: 'Er ging iets mis bij het bijwerken van BABS' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/gemeente/lookup/babs/[id]
 * Delete a BABS
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const context = await getGemeenteContext();
    if (!context.success) {
      return NextResponse.json(
        { success: false, error: context.error },
        { status: 401 }
      );
    }

    // Only admins can delete BABS records
    if (!isAdmin(context.data.rol)) {
      return NextResponse.json(
        { success: false, error: 'Geen toegang' },
        { status: 403 }
      );
    }

    const resolvedParams = await params;
    const { id } = resolvedParams;

    await db.delete(babs).where(eq(babs.id, id));

    return NextResponse.json({
      success: true,
      message: 'BABS verwijderd',
    });
  } catch (error) {
    console.error('Error deleting BABS:', error);
    return NextResponse.json(
      { success: false, error: 'Er ging iets mis bij het verwijderen van BABS' },
      { status: 500 }
    );
  }
}
