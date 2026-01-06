'use client';

import type { JSX } from 'react';
import { SignInButton, SignUpButton, UserButton, useAuth } from '@clerk/nextjs';
import { Button } from '@utrecht/component-library-react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { GemeenteLogo } from './GemeenteLogo';

/**
 * Global header component met gemeente logo en navigatie
 * Toont inlog/registratie knoppen of gebruikersprofiel
 * Toont sluit-knop op formulier paginas
 */
export function Header(): JSX.Element {
  const pathname = usePathname();
  const { isSignedIn, isLoaded } = useAuth();
  const isFormPage = pathname?.startsWith('/000-aankondiging');
  const isDossierPage = pathname?.startsWith('/dossier/');
  const isGetuigenPage = pathname === '/getuigen';
  
  // Hide header only on pages that have their own custom header (not form pages)
  const hideHeader = isDossierPage || isGetuigenPage;

  // Debug logging
  if (typeof window !== 'undefined') {
    console.log('[Header Debug]', {
      pathname,
      isFormPage,
      isDossierPage,
      isGetuigenPage,
      hideHeader,
      isSignedIn,
      isLoaded,
    });
  }

  if (hideHeader) {
    return <></>;
  }

  return (
    <header className="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        {/* Logo en titel */}
        <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
          <GemeenteLogo />
          <h1 className="font-serif text-2xl font-bold text-gray-900 dark:text-white">
            Huwelijk
          </h1>
        </Link>

        {/* Navigatie en acties */}
        <nav className="flex items-center gap-4">
          {/* Sluit-knop voor formulier paginas */}
          {isFormPage && (
            <Link
              href="/"
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
              aria-label="Sluit formulier"
            >
              <svg 
                className="w-6 h-6 text-gray-600 dark:text-gray-400" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M6 18L18 6M6 6l12 12" 
                />
              </svg>
            </Link>
          )}

          {/* Authenticatie knoppen */}
          {isLoaded ? (
            <>
              {!isSignedIn ? (
                <>
                  <SignInButton mode="modal">
                    <Button appearance="secondary-action-button">
                      Inloggen
                    </Button>
                  </SignInButton>
                  <SignUpButton mode="modal">
                    <Button appearance="primary-action-button">
                      Registreren
                    </Button>
                  </SignUpButton>
                </>
              ) : (
                <UserButton 
                  afterSignOutUrl="/"
                  appearance={{
                    elements: {
                      avatarBox: 'w-10 h-10',
                    },
                  }}
                />
              )}
            </>
          ) : (
            // Show loading state or fallback while Clerk is loading
            <div className="w-10 h-10" />
          )}
        </nav>
      </div>
    </header>
  );
}
