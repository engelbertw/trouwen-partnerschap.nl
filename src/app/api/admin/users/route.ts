import { NextRequest, NextResponse } from 'next/server';
import { clerkClient } from '@clerk/nextjs/server';
import { getGemeenteContext } from '@/lib/gemeente';
import { isSystemAdmin } from '@/lib/gemeente';

/**
 * GET /api/admin/users
 * 
 * Returns list of all users (only for system admins)
 */
export async function GET(request: NextRequest) {
  try {
    // 1. Check authentication and get gemeente context
    const context = await getGemeenteContext();
    if (!context.success) {
      return NextResponse.json(
        { success: false, error: context.error },
        { status: 401 }
      );
    }

    // 2. Check if user is system admin
    if (!isSystemAdmin(context.data.rol)) {
      return NextResponse.json(
        { success: false, error: 'Alleen systeembeheerders hebben toegang' },
        { status: 403 }
      );
    }

    // 3. Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const email = searchParams.get('email'); // Optional email filter

    // 4. Fetch users from Clerk
    const client = await clerkClient();
    const users = await client.users.getUserList({
      limit,
      offset,
      emailAddress: email ? [email] : undefined,
    });

    // 5. Format user data with gemeente metadata
    const formattedUsers = users.data.map(user => ({
      id: user.id,
      emailAddresses: user.emailAddresses.map(e => e.emailAddress),
      firstName: user.firstName,
      lastName: user.lastName,
      createdAt: user.createdAt,
      lastSignInAt: user.lastSignInAt,
      gemeenteOin: user.publicMetadata.gemeente_oin as string | undefined,
      gemeenteNaam: user.publicMetadata.gemeente_naam as string | undefined,
      rol: user.publicMetadata.rol as string | undefined,
    }));

    return NextResponse.json({
      success: true,
      data: formattedUsers,
      pagination: {
        total: users.totalCount,
        limit,
        offset,
      },
    });

  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { success: false, error: 'Er ging iets mis bij het ophalen van gebruikers' },
      { status: 500 }
    );
  }
}

