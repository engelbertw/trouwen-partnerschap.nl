import { NextRequest, NextResponse } from 'next/server';
import { clerkClient } from '@clerk/nextjs/server';
import { getGemeenteContext, isSystemAdmin } from '@/lib/gemeente';

/**
 * POST /api/admin/users/create
 * 
 * Create a new user in Clerk with gemeente metadata
 * Only accessible by system admins
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Check authentication
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

    const body = await request.json();
    const { email, firstName, lastName, gemeenteOin, gemeenteNaam, rol } = body;

    // 3. Validate required fields
    if (!email || !firstName || !lastName || !gemeenteOin || !gemeenteNaam || !rol) {
      return NextResponse.json(
        { success: false, error: 'Alle velden zijn verplicht' },
        { status: 400 }
      );
    }

    // 4. Validate email format
    if (!email.includes('@')) {
      return NextResponse.json(
        { success: false, error: 'Ongeldig email adres' },
        { status: 400 }
      );
    }

    // 5. Validate OIN format
    if (!/^\d{20}$/.test(gemeenteOin)) {
      return NextResponse.json(
        { success: false, error: 'OIN moet exact 20 cijfers zijn' },
        { status: 400 }
      );
    }

    // 6. Validate rol
    const validRoles = ['system_admin', 'hb_admin', 'loket_medewerker', 'loket_readonly', 'babs_admin'];
    if (!validRoles.includes(rol)) {
      return NextResponse.json(
        { success: false, error: `Rol moet een van de volgende zijn: ${validRoles.join(', ')}` },
        { status: 400 }
      );
    }

    // 7. Create user in Clerk
    const client = await clerkClient();
    
    try {
      const newUser = await client.users.createUser({
        emailAddress: [email],
        firstName,
        lastName,
        publicMetadata: {
          gemeente_oin: gemeenteOin,
          gemeente_naam: gemeenteNaam,
          rol,
        },
        skipPasswordRequirement: true, // User will set password via invitation email
        skipPasswordChecks: true,
      });

      return NextResponse.json({
        success: true,
        data: {
          id: newUser.id,
          email: newUser.emailAddresses[0]?.emailAddress,
          firstName: newUser.firstName,
          lastName: newUser.lastName,
          gemeenteOin,
          gemeenteNaam,
          rol,
        },
        message: 'Gebruiker succesvol aangemaakt. De gebruiker ontvangt een email om een wachtwoord in te stellen.',
      });
    } catch (clerkError: unknown) {
      console.error('Clerk error creating user:', clerkError);
      
      // Check if email already exists
      const errorMessage = clerkError instanceof Error ? clerkError.message : String(clerkError);
      if (errorMessage.includes('email_address') || errorMessage.includes('already exists')) {
        return NextResponse.json(
          { success: false, error: 'Een gebruiker met dit email adres bestaat al' },
          { status: 409 }
        );
      }
      
      return NextResponse.json(
        { success: false, error: 'Er ging iets mis bij het aanmaken in Clerk' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json(
      { success: false, error: 'Er ging iets mis bij het aanmaken van gebruiker' },
      { status: 500 }
    );
  }
}

