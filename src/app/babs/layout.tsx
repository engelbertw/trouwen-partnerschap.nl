import { redirect } from 'next/navigation';
import { auth, clerkClient } from '@clerk/nextjs/server';

/**
 * Layout for /babs subdirectories
 * No longer blocks babs_admin - they have access to all /babs routes
 */
export default async function BabsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId } = await auth();
  
  if (!userId) {
    redirect('/sign-in');
  }

  // babs_admin now has access to all /babs routes
  // Blocking is handled in middleware for aankondiging routes

  return <>{children}</>;
}

