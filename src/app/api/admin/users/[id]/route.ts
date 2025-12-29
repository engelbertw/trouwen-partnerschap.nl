import { NextRequest, NextResponse } from 'next/server';
import { clerkClient } from '@clerk/nextjs/server';
import { getGemeenteContext, isSystemAdmin } from '@/lib/gemeente';

/**
 * GET /api/admin/users/[id]
 * 
 * Get a specific user by ID (only for system admins)
 */
export async function GET(
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

    if (!isSystemAdmin(context.data.rol)) {
      return NextResponse.json(
        { success: false, error: 'Alleen systeembeheerders hebben toegang' },
        { status: 403 }
      );
    }

    const { id } = await params;
    const client = await clerkClient();
    const user = await client.users.getUser(id);

    return NextResponse.json({
      success: true,
      data: {
        id: user.id,
        emailAddresses: user.emailAddresses.map(e => e.emailAddress),
        firstName: user.firstName,
        lastName: user.lastName,
        createdAt: user.createdAt,
        lastSignInAt: user.lastSignInAt,
        gemeenteOin: user.publicMetadata.gemeente_oin as string | undefined,
        gemeenteNaam: user.publicMetadata.gemeente_naam as string | undefined,
        rol: user.publicMetadata.rol as string | undefined,
      },
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json(
      { success: false, error: 'Gebruiker niet gevonden' },
      { status: 404 }
    );
  }
}

/**
 * PUT /api/admin/users/[id]
 * 
 * Update user gemeente metadata (only for system admins)
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

    if (!isSystemAdmin(context.data.rol)) {
      return NextResponse.json(
        { success: false, error: 'Alleen systeembeheerders hebben toegang' },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const { gemeenteOin, gemeenteNaam, rol } = body;

    // Validate OIN format if provided
    if (gemeenteOin && !/^\d{20}$/.test(gemeenteOin)) {
      return NextResponse.json(
        { success: false, error: 'OIN moet exact 20 cijfers zijn' },
        { status: 400 }
      );
    }

    // Validate rol if provided
    const validRoles = ['system_admin', 'hb_admin', 'loket_medewerker', 'loket_readonly'];
    if (rol && !validRoles.includes(rol)) {
      return NextResponse.json(
        { success: false, error: `Rol moet een van de volgende zijn: ${validRoles.join(', ')}` },
        { status: 400 }
      );
    }

    // Get current user to merge metadata
    const client = await clerkClient();
    const currentUser = await client.users.getUser(id);
    const currentMetadata = currentUser.publicMetadata || {};

    // Update user metadata
    await client.users.updateUser(id, {
      publicMetadata: {
        ...currentMetadata,
        ...(gemeenteOin && { gemeente_oin: gemeenteOin }),
        ...(gemeenteNaam && { gemeente_naam: gemeenteNaam }),
        ...(rol && { rol }),
      },
    });

    // Fetch updated user
    const updatedUser = await client.users.getUser(id);

    return NextResponse.json({
      success: true,
      data: {
        id: updatedUser.id,
        emailAddresses: updatedUser.emailAddresses.map(e => e.emailAddress),
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        gemeenteOin: updatedUser.publicMetadata.gemeente_oin as string | undefined,
        gemeenteNaam: updatedUser.publicMetadata.gemeente_naam as string | undefined,
        rol: updatedUser.publicMetadata.rol as string | undefined,
      },
      message: 'Gebruiker bijgewerkt',
    });
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json(
      { success: false, error: 'Er ging iets mis bij het bijwerken van gebruiker' },
      { status: 500 }
    );
  }
}

