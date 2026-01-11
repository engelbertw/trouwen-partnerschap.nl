'use client';

import type { JSX } from 'react';
import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { GemeenteLogoCompact } from '@/components/GemeenteLogo';

function BloedverwantschapContent(): JSX.Element | null {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dossierId = searchParams.get('dossierId');
  
  const [areBloodRelatives, setAreBloodRelatives] = useState<boolean | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load existing data from database on mount
  useEffect(() => {
    if (!dossierId) {
      setError('Geen dossier ID gevonden. Start opnieuw.');
      setIsLoaded(true);
      return;
    }

    async function loadData() {
      try {
        const response = await fetch(`/api/dossier/${dossierId}/bloedverwantschap`);
        const result = await response.json();
        
        if (result.success && result.data) {
          setAreBloodRelatives(result.data.areBloodRelatives || false);
        }
        
        setIsLoaded(true);
      } catch (err) {
        console.error('Error loading data:', err);
        setError('Fout bij laden van gegevens');
        setIsLoaded(true);
      }
    }

    loadData();
  }, [dossierId]);

  const handleContinue = async () => {
    if (!dossierId) {
      setError('Geen dossier ID gevonden');
      return;
    }

    if (areBloodRelatives === null) {
      alert('Maak een keuze om verder te gaan');
      return;
    }

    if (areBloodRelatives === false) {
      // Save to database
      setIsSaving(true);
      setError(null);
      
      try {
        const response = await fetch(`/api/dossier/${dossierId}/bloedverwantschap`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ areBloodRelatives }),
        });

        const result = await response.json();
        
        if (!result.success) {
          setError(result.error || 'Fout bij opslaan');
          return;
        }

        // Navigate to samenvatting
        router.push(`/000-aankondiging/070-samenvatting?dossierId=${dossierId}`);
      } catch (err) {
        console.error('Error saving:', err);
        setError('Er ging iets mis bij het opslaan');
      } finally {
        setIsSaving(false);
      }
    }
  };

  if (!isLoaded) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-blue-100">
      {/* Header */}
      <header className="bg-[#004A91] text-white py-4 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto max-w-4xl flex items-center justify-between">
          <div className="flex items-center gap-4">
            <GemeenteLogoCompact />
          </div>
          <button
            onClick={() => router.push('/')}
            className="text-white hover:text-gray-200 transition-colors"
            aria-label="Sluiten"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      </header>

      {/* Blue bar with title */}
      <div className="bg-[#004A91] text-white py-3 px-4 sm:px-6 lg:px-8 border-t border-white/20">
        <div className="container mx-auto max-w-4xl">
          <h1 className="text-lg font-normal">Huwelijk of partnerschap aankondigen</h1>
        </div>
      </div>

      {/* Main content */}
      <main className="container mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8">
        <article className="bg-white rounded-lg shadow-md p-6 sm:p-8 lg:p-12">
          {/* Error message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-600 rounded" role="alert">
              <div className="flex items-start">
                <svg className="w-5 h-5 text-red-600 mr-2 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <p className="text-sm text-red-800">{error}</p>
              </div>
            </div>
          )}

          {/* Previous step link */}
          <Link
            href={dossierId ? `/000-aankondiging/050-kinderen?dossierId=${dossierId}` : '/000-aankondiging/050-kinderen'}
            className="inline-flex items-center text-[#2e75d4] hover:text-[#4d8ada] mb-6 text-sm font-medium"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4 mr-1"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
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
          <h2 className="font-serif text-3xl sm:text-4xl font-bold mb-6 text-gray-900">
            Bloedverwantschap
          </h2>

          {/* Progress bar */}
          <div className="mb-8">
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#2e75d4] transition-all duration-300"
                style={{ width: '60%' }}
                role="progressbar"
                aria-valuenow={60}
                aria-valuemin={0}
                aria-valuemax={100}
              />
            </div>
          </div>

          {/* Question */}
          <fieldset className="mb-8">
            <legend className="text-lg font-bold mb-2 text-gray-900">
              Zijn de partners bloedverwanten?
            </legend>
            <p className="text-sm text-gray-600 mb-6">
              Bloedverwanten zijn ouders, kinderen, broers of zussen en neven of nichten.
            </p>

            {/* Radio buttons */}
            <div className="space-y-3">
              <label className="flex items-center gap-3 cursor-pointer group">
                <input
                  type="radio"
                  name="bloedverwantschap"
                  value="ja"
                  checked={areBloodRelatives === true}
                  onChange={() => setAreBloodRelatives(true)}
                  className="w-5 h-5 text-[#2e75d4] border-gray-400 focus:ring-[#2e75d4] focus:ring-2 cursor-pointer"
                />
                <span className="text-base text-gray-900 group-hover:text-[#2e75d4]">
                  Ja
                </span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer group">
                <input
                  type="radio"
                  name="bloedverwantschap"
                  value="nee"
                  checked={areBloodRelatives === false}
                  onChange={() => setAreBloodRelatives(false)}
                  className="w-5 h-5 text-[#2e75d4] border-gray-400 focus:ring-[#2e75d4] focus:ring-2 cursor-pointer"
                />
                <span className="text-base text-gray-900 group-hover:text-[#2e75d4]">
                  Nee
                </span>
              </label>
            </div>
          </fieldset>

          {/* Warning message when "Ja" is selected */}
          {areBloodRelatives === true && (
            <div className="mb-8 p-4 bg-yellow-50 border-l-4 border-yellow-400 rounded">
              <div className="flex items-start gap-3">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6 text-yellow-600 flex-shrink-0 mt-0.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
                <div>
                  <h3 className="font-bold text-gray-900 mb-2">
                    Maak een afspraak bij de gemeente
                  </h3>
                  <p className="text-sm text-gray-700">
                    U kunt uw huwelijk of partnerschap niet online aankondigen omdat u hebt aangegeven familie van elkaar te zijn. Maak een afspraak bij het stadslokket om de mogelijkheden te bespreken.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row gap-4 mt-8">
            {areBloodRelatives === false && (
              <button
                onClick={handleContinue}
                disabled={isSaving}
                className="inline-flex items-center justify-center gap-2 bg-[#2e75d4] text-white font-sans text-base font-bold px-6 py-3 rounded hover:bg-[#4d8ada] focus:outline-none focus:ring-2 focus:ring-[#2e75d4] focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? 'Opslaan...' : 'Volgende stap'}
                {!isSaving && (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                )}
              </button>
            )}
          </div>
        </article>
      </main>
    </div>
  );
}

/**
 * Page wrapper with Suspense boundary for useSearchParams
 */
export default function BloedverwantschapPage(): JSX.Element {
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
      <BloedverwantschapContent />
    </Suspense>
  );
}

