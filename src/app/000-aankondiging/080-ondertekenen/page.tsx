'use client';

import type { JSX } from 'react';
import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { getAankondigingData } from '@/lib/aankondiging-storage';
import { generateAndDownloadAankondigingPDF } from '@/lib/pdf-generator';
import { GemeenteLogoCompact } from '@/components/GemeenteLogo';

/**
 * Ondertekenen page - Both partners sign the announcement
 * Shows declaration points and signing status for each partner
 */
function OndertekenenContent(): JSX.Element {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dossierId = searchParams.get('dossierId');
  
  const [partner1Signed, setPartner1Signed] = useState(false);
  const [partner2Signed, setPartner2Signed] = useState(false);
  const [partner1Name, setPartner1Name] = useState<string>('');
  const [partner2Name, setPartner2Name] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch partner data from dossier
  useEffect(() => {
    if (!dossierId) {
      setError('Geen dossier ID gevonden');
      setIsLoading(false);
      return;
    }

    async function fetchPartnerData() {
      try {
        const response = await fetch(`/api/dossier/${dossierId}/partners`);
        const result = await response.json();
        
        if (result.success && result.data) {
          // Format partner names: voornamen + achternaam
          if (result.data.partner1) {
            const name1 = `${result.data.partner1.voornamen || ''} ${result.data.partner1.achternaam || ''}`.trim();
            setPartner1Name(name1 || 'Partner 1');
          }
          
          if (result.data.partner2) {
            const name2 = `${result.data.partner2.voornamen || ''} ${result.data.partner2.achternaam || ''}`.trim();
            setPartner2Name(name2 || 'Partner 2');
          }
        } else {
          setError('Kon partner gegevens niet ophalen');
        }
      } catch (err) {
        console.error('Error fetching partner data:', err);
        setError('Er ging iets mis bij het ophalen van gegevens');
      } finally {
        setIsLoading(false);
      }
    }

    fetchPartnerData();
  }, [dossierId]);

  const handlePartner1Sign = () => {
    // TODO: Integrate with DigiD signing flow
    setPartner1Signed(true);
  };

  const handlePartner2Sign = () => {
    // TODO: Integrate with eIDAS signing flow
    setPartner2Signed(true);
  };

  const handleSubmit = () => {
    if (!partner1Signed || !partner2Signed) {
      alert('Beide partners moeten ondertekenen');
      return;
    }
    if (dossierId) {
      router.push(`/000-aankondiging/090-bevestiging?dossierId=${dossierId}`);
    } else {
      router.push('/000-aankondiging/090-bevestiging');
    }
  };

  const handleSaveForLater = () => {
    alert('Uw voortgang is opgeslagen. U ontvangt een e-mail met een link om verder te gaan.');
  };

  const handleDownloadPDF = () => {
    try {
      const formData = getAankondigingData();
      const mockDossierId = `preview-${Date.now()}`;
      generateAndDownloadAankondigingPDF(formData, mockDossierId);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Er ging iets mis bij het genereren van de PDF. Probeer het opnieuw.');
    }
  };

  const declarations = [
    'Een huwelijk aan te willen gaan met elkaar;',
    'Geen andere huwelijken of geregistreerde partnerschappen waar ook ter wereld te zijn aangegaan;',
    'Niet het oogmerk te hebben om met dit huwelijk toelating tot Nederland te krijgen;',
    'De intentie te hebben om te voldoen aan de plichten verbonden aan het huwelijk;',
    'Dit formulier naar waarheid te hebben ingevuld.',
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-blue-100">
      {/* Header */}
      <header className="bg-[#154273] text-white py-4 px-4 sm:px-6 lg:px-8">
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
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
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
        <article className="bg-white rounded-lg shadow-md p-6 sm:p-8">
          {/* Error message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-600 rounded" role="alert">
              <div className="flex items-start">
                <svg className="w-5 h-5 text-red-600 mr-2 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <div className="flex-1">
                  <h3 className="text-sm font-bold text-red-900 mb-1">Fout</h3>
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Loading message */}
          {isLoading && (
            <div className="mb-6 p-4 bg-blue-50 border-l-4 border-blue-600 rounded" role="status">
              <p className="text-sm text-blue-800">Gegevens worden geladen...</p>
            </div>
          )}

          {/* Previous step link */}
          <Link
            href={dossierId ? `/000-aankondiging/070-samenvatting?dossierId=${dossierId}` : '/000-aankondiging/070-samenvatting'}
            className="inline-flex items-center text-[#154273] hover:text-[#1a5a99] mb-6 text-sm"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4 mr-1"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Vorige stap
          </Link>

          {/* Page heading */}
          <h2 className="font-serif text-3xl font-bold mb-6">Ondertekenen</h2>

          {/* Progress bar */}
          <div className="mb-8">
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#154273] transition-all"
                style={{ width: '90%' }}
                role="progressbar"
                aria-valuenow={90}
                aria-valuemin={0}
                aria-valuemax={100}
              />
            </div>
          </div>

          {/* Declaration text */}
          <div className="mb-8">
            <p className="text-base text-gray-700 mb-4">
              Door dit formulier te ondertekenen verklaart u:
            </p>
            <ul className="list-disc list-inside space-y-2 text-base text-gray-700">
              {declarations.map((declaration, idx) => (
                <li key={idx}>{declaration}</li>
              ))}
            </ul>
          </div>

          {/* Partner 1 signing */}
          <div className="mb-8">
            <h3 className="font-bold text-lg mb-4">
              {isLoading ? 'Laden...' : partner1Name || 'Partner 1'}
            </h3>
            {!partner1Signed ? (
              <div>
                <p className="text-sm text-gray-700 mb-4">Onderteken uw aankondiging.</p>
                <button
                  onClick={handlePartner1Sign}
                  disabled={isLoading || !partner1Name}
                  className="inline-flex items-center justify-between w-full max-w-md bg-white text-gray-900 font-sans text-base px-4 py-3 rounded border-2 border-gray-400 hover:border-gray-600 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="font-medium">Ondertekenen met DigiD</span>
                  <span className="flex items-center justify-center bg-[#000000] text-white text-xs font-bold px-3 py-1 rounded min-w-[50px]">
                    DigiD
                  </span>
                </button>
              </div>
            ) : (
              <div className="inline-flex items-center gap-2 bg-green-50 border-2 border-green-500 text-green-700 px-4 py-3 rounded">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="font-medium">Aankondiging ondertekend</span>
              </div>
            )}
          </div>

          {/* Partner 2 signing */}
          <div className="mb-8">
            <h3 className="font-bold text-lg mb-4">
              {isLoading ? 'Laden...' : partner2Name || 'Partner 2'}
            </h3>
            {!partner2Signed ? (
              <div>
                <p className="text-sm text-gray-700 mb-4">Onderteken uw aankondiging.</p>
                <button
                  onClick={handlePartner2Sign}
                  disabled={isLoading || !partner2Name}
                  className="inline-flex items-center justify-between w-full max-w-md bg-white text-gray-900 font-sans text-base px-4 py-3 rounded border-2 border-gray-400 hover:border-gray-600 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="font-medium">Ondertekenen met eIDAS</span>
                  <span className="flex items-center justify-center bg-[#003399] text-white rounded-full w-7 h-7">
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                      <circle cx="12" cy="3" r="0.8" />
                      <circle cx="16.5" cy="4.5" r="0.8" />
                      <circle cx="19.8" cy="7.8" r="0.8" />
                      <circle cx="21" cy="12" r="0.8" />
                      <circle cx="19.8" cy="16.2" r="0.8" />
                      <circle cx="16.5" cy="19.5" r="0.8" />
                      <circle cx="12" cy="21" r="0.8" />
                      <circle cx="7.5" cy="19.5" r="0.8" />
                      <circle cx="4.2" cy="16.2" r="0.8" />
                      <circle cx="3" cy="12" r="0.8" />
                      <circle cx="4.2" cy="7.8" r="0.8" />
                      <circle cx="7.5" cy="4.5" r="0.8" />
                    </svg>
                  </span>
                </button>
              </div>
            ) : (
              <div className="inline-flex items-center gap-2 bg-green-50 border-2 border-green-500 text-green-700 px-4 py-3 rounded">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="font-medium">Aankondiging ondertekend</span>
              </div>
            )}
          </div>

          {/* Submit button - only show when both signed */}
          {partner1Signed && partner2Signed && (
            <div className="flex flex-col gap-4">
              <button
                onClick={handleSubmit}
                className="inline-flex items-center justify-center gap-2 bg-[#154273] text-white font-sans text-base font-bold px-6 py-3 rounded hover:bg-[#1a5a99] focus:outline-none focus:ring-2 focus:ring-[#154273] focus:ring-offset-2 transition-colors"
              >
                Aankondiging versturen
              </button>
            </div>
          )}

          {/* Save for later link */}
          <div className="mt-6 flex flex-col gap-3">
            <button
              onClick={handleDownloadPDF}
              className="inline-flex items-center gap-2 text-[#154273] hover:text-[#1a5a99] font-medium underline focus:outline-none focus:ring-2 focus:ring-[#154273] focus:ring-offset-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Download samenvatting als PDF
            </button>
            
            <button
              onClick={handleSaveForLater}
              className="text-[#154273] hover:text-[#1a5a99] underline text-sm"
            >
              Opslaan en later verder
            </button>
          </div>
        </article>
      </main>
    </div>
  );
}

/**
 * Page wrapper with Suspense boundary for useSearchParams
 */
export default function OndertekenenPage(): JSX.Element {
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
      <OndertekenenContent />
    </Suspense>
  );
}

