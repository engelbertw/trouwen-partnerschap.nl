import { auth, clerkClient } from '@clerk/nextjs/server';
import { db } from '@/db';
import { gemeente, babsGemeente } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

/**
 * Gemeente context returned from authentication
 */
export type GemeenteContext = {
  userId: string;
  gemeenteOin: string;
  gemeenteNaam: string;
  rol: 'system_admin' | 'hb_admin' | 'loket_medewerker' | 'loket_readonly' | 'babs_admin' | 'locatie_admin';
  babsId?: string; // Only set for BABS users
  locatieId?: string; // Only set for locatie admin users
  babsGemeenten?: string[]; // Array of gemeente OINs for BABS users
};

/**
 * Get authenticated user's gemeente context
 * 
 * This function MUST be called at the start of every Server Action
 * and Server Component that accesses data.
 * 
 * It returns the user's gemeente_oin from Clerk metadata, which is
 * used to filter ALL database queries for multi-tenancy.
 * 
 * **Special case for BABS**: BABS users (rol='babs_admin') can work
 * for multiple gemeenten. Their Clerk metadata does NOT have a
 * gemeente_oin. Instead, they see ceremonies from all gemeenten
 * where they are registered (via babs_gemeente table).
 * 
 * @returns Success with GemeenteContext or error message
 * 
 * @example
 * ```typescript
 * // In a Server Action
 * export async function createDossier(input: CreateDossierInput) {
 *   const context = await getGemeenteContext();
 *   if (!context.success) {
 *     return { error: context.error };
 *   }
 *   
 *   const { gemeenteOin, userId } = context.data;
 *   
 *   await db.insert(dossier).values({
 *     ...input,
 *     gemeenteOin,  // Always set from context
 *     createdBy: userId,
 *   });
 * }
 * ```
 */
export async function getGemeenteContext(): Promise<
  | { success: true; data: GemeenteContext }
  | { success: false; error: string }
> {
  // 1. Authenticate with Clerk
  const { userId } = await auth();
  if (!userId) {
    return { success: false, error: 'Niet ingelogd' };
  }

  try {
    // 2. Get user metadata from Clerk
    const client = await clerkClient();
    const user = await client.users.getUser(userId);
    
    // Safely access publicMetadata (can be null/undefined)
    const publicMetadata = user.publicMetadata || {};
    
    const gemeenteOin = publicMetadata.gemeente_oin as string | undefined;
    const gemeenteNaam = publicMetadata.gemeente_naam as string | undefined;
    const rol = (publicMetadata.rol as GemeenteContext['rol']) || 'loket_medewerker';
    const babsId = publicMetadata.babs_id as string | undefined;
    const locatieId = publicMetadata.locatie_id as string | undefined;

    // 3. Special case: BABS users have gemeente_oin in Clerk metadata (primary gemeente)
    // They can work for multiple gemeenten via babs_gemeente junction table
    // The gemeente_oin in Clerk is the primary gemeente for context/authorization
    if (rol === 'babs_admin' && babsId) {
      // Get all gemeenten from babs_gemeente junction table (for ceremonies filtering)
      const babsGemeenten = await db
        .select({
          gemeenteOin: babsGemeente.gemeenteOin,
          gemeenteNaam: gemeente.naam,
        })
        .from(babsGemeente)
        .innerJoin(gemeente, eq(babsGemeente.gemeenteOin, gemeente.oin))
        .where(
          and(
            eq(babsGemeente.babsId, babsId),
            eq(babsGemeente.actief, true)
          )
        );

      // Use gemeente_oin from Clerk metadata as primary gemeente
      // If not set, use first gemeente from babs_gemeente as fallback
      const primaryGemeenteOin = gemeenteOin || (babsGemeenten.length > 0 ? babsGemeenten[0].gemeenteOin : '');
      const primaryGemeenteNaam = gemeenteNaam || (babsGemeenten.length > 0 ? babsGemeenten[0].gemeenteNaam : 'Geen gemeente toegewezen');

      return {
        success: true,
        data: {
          userId,
          gemeenteOin: primaryGemeenteOin, // Primary gemeente from Clerk metadata
          gemeenteNaam: primaryGemeenteNaam,
          rol,
          babsId,
          babsGemeenten: babsGemeenten.map(g => g.gemeenteOin), // Array of all gemeente OINs for filtering
        },
      };
    }

    // 4. Special case: Locatie admin users don't need gemeente_oin
    // They manage availability for their specific locatie
    if (rol === 'locatie_admin' && locatieId) {
      return {
        success: true,
        data: {
          userId,
          gemeenteOin: '', // Locatie admin has no fixed gemeente
          gemeenteNaam: 'Locatie Beheerder', // Placeholder
          rol,
          locatieId,
        },
      };
    }

    // 5. For non-BABS and non-locatie-admin users: validate gemeente is assigned
    if (!gemeenteOin) {
      return {
        success: false,
        error: 'Geen gemeente toegewezen aan gebruiker. Neem contact op met een beheerder.',
      };
    }

    // 6. Validate OIN format (20 digits)
    if (!/^\d{20}$/.test(gemeenteOin)) {
      console.error(`Invalid OIN format for user ${userId}: ${gemeenteOin}`);
      return {
        success: false,
        error: 'Ongeldige gemeente configuratie. Neem contact op met een beheerder.',
      };
    }

    // 7. If gemeenteNaam is not set, try to fetch it from database
    let finalGemeenteNaam = gemeenteNaam;
    if (!finalGemeenteNaam) {
      try {
        const gemeenteData = await db
          .select({ naam: gemeente.naam })
          .from(gemeente)
          .where(eq(gemeente.oin, gemeenteOin))
          .limit(1);
        
        if (gemeenteData.length > 0) {
          finalGemeenteNaam = gemeenteData[0].naam;
        }
      } catch (error) {
        // If database lookup fails, use fallback
        console.warn(`Could not fetch gemeente naam for OIN ${gemeenteOin}:`, error);
      }
    }

    return {
      success: true,
      data: {
        userId,
        gemeenteOin,
        gemeenteNaam: finalGemeenteNaam || 'Onbekende gemeente',
        rol,
        babsId,
        locatieId,
      },
    };
  } catch (error) {
    console.error('Error getting gemeente context:', error);
    return {
      success: false,
      error: 'Fout bij ophalen gemeente gegevens',
    };
  }
}

/**
 * Get gemeente context or throw error
 * 
 * Use this in Server Components that need to display an error page
 * when gemeente context cannot be obtained.
 * 
 * @throws Error if authentication or gemeente retrieval fails
 * 
 * @example
 * ```typescript
 * // In a Server Component
 * export default async function DossiersPage() {
 *   const { gemeenteOin } = await requireGemeenteContext();
 *   
 *   const dossiers = await db
 *     .select()
 *     .from(dossier)
 *     .where(eq(dossier.gemeenteOin, gemeenteOin));
 *   
 *   return <DossierList dossiers={dossiers} />;
 * }
 * ```
 */
export async function requireGemeenteContext(): Promise<GemeenteContext> {
  const result = await getGemeenteContext();
  
  if (!result.success) {
    throw new Error(result.error);
  }
  
  return result.data;
}

/**
 * Check if user has admin role (system_admin or hb_admin)
 * 
 * @example
 * ```typescript
 * export async function deleteAllDossiers() {
 *   const context = await getGemeenteContext();
 *   if (!context.success) return { error: context.error };
 *   
 *   if (!isAdmin(context.data.rol)) {
 *     return { error: 'Alleen beheerders kunnen deze actie uitvoeren' };
 *   }
 *   
 *   // Admin-only logic
 * }
 * ```
 */
export function isAdmin(rol: GemeenteContext['rol']): boolean {
  return rol === 'system_admin' || rol === 'hb_admin';
}

/**
 * Check if user is system admin (can access all gemeenten)
 */
export function isSystemAdmin(rol: GemeenteContext['rol']): boolean {
  return rol === 'system_admin';
}

/**
 * Check if user can write/modify data
 */
export function canWrite(rol: GemeenteContext['rol']): boolean {
  return rol !== 'loket_readonly';
}

/**
 * Check if user is BABS admin (can only manage their own availability)
 */
export function isBabsAdmin(rol: GemeenteContext['rol']): boolean {
  return rol === 'babs_admin';
}

/**
 * Check if user is locatie admin (can only manage their own locatie availability)
 */
export function isLocatieAdmin(rol: GemeenteContext['rol']): boolean {
  return rol === 'locatie_admin';
}

