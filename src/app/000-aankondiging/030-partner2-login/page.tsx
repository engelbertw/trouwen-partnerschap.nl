'use client';

import type { JSX } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

/**
 * Partner 2 DigiD/eIDAS login prompt
 * Partner kan kiezen tussen DigiD of eIDAS
 * 
 * Note: For now, this is a mock page that simulates authentication.
 * In production, integrate with actual DigiD/eIDAS via Clerk OIDC.
 */
export default function Partner2LoginPage(): JSX.Element {
  const searchParams = useSearchParams();
  const dossierId = searchParams.get('dossierId');
  const handleSaveForLater = () => {
    // TODO: Opslaan en email versturen
    alert('Uw voortgang is opgeslagen. U ontvangt een e-mail met een link om verder te gaan.');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-blue-100">
      {/* Blue header bar */}
      <div className="bg-[#154273] text-white py-4 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto max-w-4xl">
          <h1 className="font-sans text-xl font-bold">
            Huwelijk of partnerschap aankondigen
          </h1>
        </div>
      </div>

      {/* Main content */}
      <main className="container mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8">
        <article className="bg-white rounded-lg shadow-md p-6 sm:p-8 lg:p-12">
          {/* Previous step link */}
          <Link
            href={dossierId ? `/000-aankondiging/021-partner1-gegevens?dossierId=${dossierId}` : '/000-aankondiging/021-partner1-gegevens'}
            className="inline-flex items-center gap-2 text-[#154273] hover:text-[#1a5a99] focus:outline-none focus:ring-2 focus:ring-[#154273] focus:ring-offset-2 mb-6 transition-colors"
          >
            <svg 
              className="w-4 h-4" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M15 19l-7-7 7-7" 
              />
            </svg>
            Vorige stap
          </Link>

          {/* Page heading */}
          <h2 className="font-sans text-3xl sm:text-4xl font-bold mb-6">
            Gegevens partner 2
          </h2>

          {/* Progress bar */}
          <div className="mb-8">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-[#154273] h-2 rounded-full transition-all duration-300"
                style={{ width: '40%' }}
                role="progressbar"
                aria-valuenow={40}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label="Voortgang: 40%"
              />
            </div>
          </div>

          {/* Error message if no dossierId */}
          {!dossierId && (
            <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-600 rounded" role="alert">
              <div className="flex items-start">
                <svg className="w-5 h-5 text-red-600 mr-2 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <div className="flex-1">
                  <h3 className="text-sm font-bold text-red-900 mb-1">Geen dossier gevonden</h3>
                  <p className="text-sm text-red-800 mb-4">Geen dossier ID gevonden. Start opnieuw.</p>
                  <Link
                    href="/000-aankondiging/010-aankondiging"
                    className="inline-flex items-center gap-2 bg-[#154273] text-white font-sans text-sm font-bold px-4 py-2 rounded hover:bg-[#1a5a99] focus:outline-none focus:ring-2 focus:ring-[#154273] focus:ring-offset-2 transition-colors"
                  >
                    Start opnieuw
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* Instructions */}
          <p className="text-base leading-relaxed mb-8 text-gray-700">
            Log in met DigiD of eIDAS om verder te gaan.
          </p>

          {/* Login options */}
          <div className="flex flex-col gap-4 mb-8">
            {/* DigiD Button */}
            <Link
              href={dossierId ? `/000-aankondiging/031-partner2-gegevens?dossierId=${dossierId}` : '/000-aankondiging/031-partner2-gegevens'}
              className={`inline-flex items-center justify-between w-full max-w-md bg-white text-gray-900 font-sans text-base px-5 py-4 rounded border border-gray-300 hover:border-gray-400 hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-[#154273] focus:ring-offset-2 transition-all ${!dossierId ? 'opacity-50 cursor-not-allowed' : ''}`}
              onClick={(e) => {
                if (!dossierId) {
                  e.preventDefault();
                }
              }}
            >
              <span className="font-normal">Inloggen met DigiD</span>
              <span className="bg-black text-white text-xs font-bold px-3 py-1.5 rounded">
                DigiD
              </span>
            </Link>

            {/* eIDAS Button */}
            <Link
              href={dossierId ? `/000-aankondiging/031-partner2-gegevens?dossierId=${dossierId}` : '/000-aankondiging/031-partner2-gegevens'}
              className={`inline-flex items-center justify-between w-full max-w-md bg-white text-gray-900 font-sans text-base px-5 py-4 rounded border border-gray-300 hover:border-gray-400 hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-[#154273] focus:ring-offset-2 transition-all ${!dossierId ? 'opacity-50 cursor-not-allowed' : ''}`}
              onClick={(e) => {
                if (!dossierId) {
                  e.preventDefault();
                }
              }}
            >
              <span className="font-normal">Inloggen met eIDAS</span>
              <span className="bg-[#003399] text-white rounded-full flex items-center justify-center w-8 h-8">
                <svg 
                  viewBox="0 0 24 24" 
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="w-5 h-5"
                  aria-hidden="true"
                >
                  <circle cx="12" cy="5" r="1.5" fill="currentColor" />
                  <circle cx="6" cy="11" r="1.5" fill="currentColor" />
                  <circle cx="18" cy="11" r="1.5" fill="currentColor" />
                  <circle cx="9" cy="17" r="1.5" fill="currentColor" />
                  <circle cx="15" cy="17" r="1.5" fill="currentColor" />
                  <line x1="12" y1="6.5" x2="6" y2="9.5" />
                  <line x1="12" y1="6.5" x2="18" y2="9.5" />
                  <line x1="6" y1="12.5" x2="9" y2="15.5" />
                  <line x1="18" y1="12.5" x2="15" y2="15.5" />
                </svg>
              </span>
            </Link>
          </div>

          {/* Save for later link */}
          <div className="mt-4">
            <button
              onClick={handleSaveForLater}
              className="text-[#154273] hover:text-[#1a5a99] underline focus:outline-none focus:ring-2 focus:ring-[#154273] focus:ring-offset-2 transition-colors"
            >
              Opslaan en later verder
            </button>
          </div>
        </article>
      </main>
    </div>
  );
}

