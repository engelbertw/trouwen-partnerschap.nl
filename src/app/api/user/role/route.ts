import { NextRequest, NextResponse } from 'next/server';
import { auth, clerkClient } from '@clerk/nextjs/server';

/**
 * GET /api/user/role
 * 
 * Get current user's role from Clerk metadata
 */
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Niet ingelogd' },
        { status: 401 }
      );
    }

    const client = await clerkClient();
    const user = await client.users.getUser(userId);
    const publicMetadata = user.publicMetadata || {};
    const rol = (publicMetadata.rol as string) || '';

    return NextResponse.json({
      success: true,
      rol,
    });
  } catch (error) {
    console.error('Error fetching user role:', error);
    return NextResponse.json(
      { success: false, error: 'Fout bij ophalen rol' },
      { status: 500 }
    );
  }
}

