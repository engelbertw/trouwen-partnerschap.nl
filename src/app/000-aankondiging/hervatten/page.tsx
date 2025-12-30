'use client';

import type { JSX } from 'react';
import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { resumeFromToken } from '@/lib/aankondiging-storage';
import { GemeenteLogoCompact } from '@/components/GemeenteLogo';

/**
 * Hervatten page - Resume saved announcement form
 * Loads saved data from token and redirects to appropriate step
 */
function HervattenContent(): JSX.Element {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = searchParams.get('token');
    
    if (!token) {
      setStatus('error');
      setError('Geen token gevonden. Controleer uw link.');
      return;
    }

    // Try to resume from token
    const data = resumeFromToken(token);
    
    if (data) {
      setStatus('success');
      
      // Determine which step to redirect to based on saved data
      // Go to the first incomplete step
      setTimeout(() => {
        if (!data.type) {
          router.push('/000-aankondiging/010-aankondiging');
        } else if (!data.partner1) {
          router.push('/000-aankondiging/020-partner1-login');
        } else if (!data.partner2) {
          router.push('/000-aankondiging/030-partner2-login');
        } else if (!data.curatele) {
          router.push('/000-aankondiging/040-curatele');
        } else if (!data.kinderen) {
          router.push('/000-aankondiging/050-kinderen');
        } else if (!data.bloedverwantschap) {
          router.push('/000-aankondiging/060-bloedverwantschap');
        } else {
          // All data present, go to summary
          router.push('/000-aankondiging/070-samenvatting');
        }
      }, 1500);
    } else {
      setStatus('error');
      setError('Opgeslagen voortgang niet gevonden. De link is mogelijk verlopen.');
    }
  }, [searchParams, router]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-blue-100">
      {/* Header */}
      <header className="bg-[#154273] text-white py-4 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto max-w-4xl">
            <GemeenteLogoCompact />
        </div>
      </header>

      {/* Blue bar */}
      <div className="bg-[#154273] text-white py-3 px-4 sm:px-6 lg:px-8 border-t border-white/20">
        <div className="container mx-auto max-w-4xl">
          <h1 className="text-lg font-normal">Huwelijk of partnerschap aankondigen</h1>
        </div>
      </div>

      {/* Main content */}
      <main className="container mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8">
        <article className="bg-white rounded-lg shadow-md p-8 sm:p-12 max-w-2xl mx-auto text-center">
          {status === 'loading' && (
            <>
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#154273] mb-6"></div>
              <h2 className="font-serif text-2xl font-bold mb-4">
                Uw voortgang laden...
              </h2>
              <p className="text-gray-700">
                Een moment geduld alstublieft.
              </p>
            </>
          )}

          {status === 'success' && (
            <>
              <svg
                className="w-16 h-16 text-green-600 mx-auto mb-6"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <h2 className="font-serif text-2xl font-bold mb-4">
                Voortgang hersteld!
              </h2>
              <p className="text-gray-700">
                U wordt doorgestuurd naar waar u was gebleven...
              </p>
            </>
          )}

          {status === 'error' && (
            <>
              <svg
                className="w-16 h-16 text-red-600 mx-auto mb-6"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
              <h2 className="font-serif text-2xl font-bold mb-4 text-red-900">
                Fout bij herstellen
              </h2>
              <p className="text-gray-700 mb-6">
                {error}
              </p>
              <button
                onClick={() => router.push('/000-aankondiging/000-inleiding')}
                className="inline-flex items-center justify-center bg-[#154273] text-white font-sans text-base font-bold px-6 py-3 rounded hover:bg-[#1a5a99] focus:outline-none focus:ring-2 focus:ring-[#154273] focus:ring-offset-2 transition-colors"
              >
                Opnieuw beginnen
              </button>
            </>
          )}
        </article>
      </main>
    </div>
  );
}

/**
 * Page wrapper with Suspense boundary for useSearchParams
 */
export default function HervattenPage(): JSX.Element {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-b from-blue-50 to-blue-100 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Laden...</p>
          </div>
        </div>
      }
    >
      <HervattenContent />
    </Suspense>
  );
}

