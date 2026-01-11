'use client';

import type { JSX } from 'react';
import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { generateAndDownloadAankondigingPDF } from '@/lib/pdf-generator';
import { GemeenteLogoCompact } from '@/components/GemeenteLogo';

interface SamenvattingData {
  type: 'huwelijk' | 'partnerschap';
  partner1: {
    voornamen: string;
    achternaam: string;
    geboortedatum: string;
    adres: string;
    postcode: string;
    plaats: string;
    burgerlijkeStaat: string;
    ouders: string[];
  } | null;
  partner2: {
    voornamen: string;
    achternaam: string;
    geboortedatum: string;
    adres: string;
    postcode: string;
    plaats: string;
    burgerlijkeStaat: string;
    ouders: string[];
  } | null;
  curatele: {
    partner1: string;
    partner1Document?: string;
    partner2: string;
  };
  kinderen: {
    partner1: string;
    partner1Children: Array<{
      id: string;
      voornamen: string;
      achternaam: string;
      geboortedatum: string;
    }>;
    partner2: string;
    partner2Children: Array<{
      id: string;
      voornamen: string;
      achternaam: string;
      geboortedatum: string;
    }>;
  };
  bloedverwantschap: string;
}

/**
 * Samenvatting page - Summary of all collected data
 * Shows all information before signing
 */
function SamenvattingContent(): JSX.Element {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dossierId = searchParams.get('dossierId');
  
  const [confirmationChecked, setConfirmationChecked] = useState(false);
  const [data, setData] = useState<SamenvattingData | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load data from database on mount
  useEffect(() => {
    if (!dossierId) {
      setError('Geen dossier ID gevonden. Start opnieuw.');
      setIsLoaded(true);
      // Redirect to start after 3 seconds
      const timeoutId = setTimeout(() => {
        router.push('/000-aankondiging/010-aankondiging');
      }, 3000);
      return () => clearTimeout(timeoutId);
    }

    async function loadSamenvatting() {
      try {
        const response = await fetch(`/api/dossier/${dossierId}/samenvatting`);
        
        if (!response.ok) {
          const errorText = await response.text();
          let errorData;
          try {
            errorData = JSON.parse(errorText);
          } catch {
            errorData = { error: `HTTP ${response.status}: ${response.statusText}` };
          }
          setError(errorData.error || `Fout bij laden (${response.status})`);
          setIsLoaded(true);
          return;
        }
        
        const result = await response.json();
        
        if (!result.success) {
          setError(result.error || 'Fout bij laden van gegevens');
          setIsLoaded(true);
          return;
        }

        if (!result.data) {
          setError('Geen gegevens gevonden voor dit dossier');
          setIsLoaded(true);
          return;
        }

        setData(result.data);
        setIsLoaded(true);
      } catch (err) {
        console.error('Error loading samenvatting:', err);
        setError(`Er ging iets mis bij het laden van de gegevens: ${err instanceof Error ? err.message : String(err)}`);
        setIsLoaded(true);
      }
    }

    loadSamenvatting();
  }, [dossierId, router]);

  const handleContinue = () => {
    if (!dossierId) {
      setError('Geen dossier ID gevonden');
      return;
    }
    
    if (!confirmationChecked) {
      alert('Bevestig dat alle gegevens kloppen');
      return;
    }
    router.push(`/000-aankondiging/080-ondertekenen?dossierId=${dossierId}`);
  };

  const handleSaveForLater = () => {
    alert('Uw voortgang is opgeslagen. U ontvangt een e-mail met een link om verder te gaan.');
  };

  const handleDownloadPDF = () => {
    if (!data || !dossierId) {
      alert('Gegevens zijn nog niet geladen');
      return;
    }
    
    try {
      // Convert data format for PDF generator
      // Convert null to undefined to match AankondigingData interface
      const pdfData = {
        type: data.type,
        partner1: data.partner1 ?? undefined,
        partner2: data.partner2 ?? undefined,
        curatele: {
          partner1UnderGuardianship: data.curatele.partner1 === 'Ja',
          partner2UnderGuardianship: data.curatele.partner2 === 'Ja',
        },
        kinderen: {
          partner1HasChildren: data.kinderen.partner1 === 'Ja',
          partner1Children: data.kinderen.partner1Children,
          partner2HasChildren: data.kinderen.partner2 === 'Ja',
          partner2Children: data.kinderen.partner2Children,
        },
        bloedverwantschap: {
          areBloodRelatives: data.bloedverwantschap === 'Ja',
        },
      };
      
      // Generate and download PDF
      generateAndDownloadAankondigingPDF(pdfData, dossierId);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Er ging iets mis bij het genereren van de PDF. Probeer het opnieuw.');
    }
  };

  // Don't render until data is loaded
  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-blue-100 flex items-center justify-center">
        <p className="text-gray-700">Gegevens worden geladen...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-blue-100">
        <div className="container mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="p-4 bg-red-50 border-l-4 border-red-600 rounded" role="alert">
              <div className="flex items-start">
                <svg className="w-5 h-5 text-red-600 mr-2 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <div className="flex-1">
                  <h3 className="text-sm font-bold text-red-900 mb-1">Geen dossier gevonden</h3>
                  <p className="text-sm text-red-800 mb-4">{error || 'Geen gegevens gevonden'}</p>
                  <button
                    onClick={() => router.push('/000-aankondiging/010-aankondiging')}
                    className="inline-flex items-center gap-2 bg-[#2e75d4] text-white font-sans text-sm font-bold px-4 py-2 rounded hover:bg-[#4d8ada] focus:outline-none focus:ring-2 focus:ring-[#2e75d4] focus:ring-offset-2 transition-colors"
                  >
                    Start opnieuw
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Format data for display
  const displayData = {
    aankondiging: data.type === 'huwelijk' ? 'Huwelijk' : 'Partnerschap',
    partner1: data.partner1 || {
      voornamen: 'Niet ingevuld',
      achternaam: '',
      geboortedatum: '',
      adres: '',
      postcode: '',
      plaats: '',
      burgerlijkeStaat: '',
      ouders: [],
    },
    partner2: data.partner2 || {
      voornamen: 'Niet ingevuld',
      achternaam: '',
      geboortedatum: '',
      adres: '',
      postcode: '',
      plaats: '',
      burgerlijkeStaat: '',
      ouders: [],
    },
    curatele: data.curatele,
    kinderen: data.kinderen,
    bloedverwantschap: data.bloedverwantschap,
  };

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

      {/* Blue bar */}
      <div className="bg-[#004A91] text-white py-3 px-4 sm:px-6 lg:px-8 border-t border-white/20">
        <div className="container mx-auto max-w-4xl">
          <h1 className="text-lg font-normal">Huwelijk of partnerschap aankondigen</h1>
        </div>
      </div>

      {/* Main content */}
      <main className="container mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8">
        <article className="bg-white rounded-lg shadow-md p-6 sm:p-8">
          {/* Previous step link */}
          <Link
            href={dossierId ? `/000-aankondiging/060-bloedverwantschap?dossierId=${dossierId}` : '/000-aankondiging/060-bloedverwantschap'}
            className="inline-flex items-center text-[#2e75d4] hover:text-[#4d8ada] mb-6 text-sm"
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
          <h2 className="font-serif text-3xl font-bold mb-6">Samenvatting</h2>

          {/* Progress bar */}
          <div className="mb-8">
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#2e75d4] transition-all"
                style={{ width: '80%' }}
                role="progressbar"
                aria-valuenow={80}
                aria-valuemin={0}
                aria-valuemax={100}
              />
            </div>
          </div>

          {/* Intro text */}
          <p className="text-base text-gray-700 mb-8">
            Controleer uw gegevens en klik of alles klopt.<br />
            Als er iets niet klopt, kunt u dit nu nog aanpassen voordat u de aanvraag vervolgt.
          </p>

          {/* Summary sections */}
          <div className="space-y-6">
            {/* Aankondiging */}
            <div className="border border-gray-300 rounded-lg p-6">
              <div className="flex items-start justify-between mb-4">
                <h3 className="font-bold text-lg">Aankondiging</h3>
                <button 
                  onClick={() => router.push(dossierId ? `/000-aankondiging/010-aankondiging?dossierId=${dossierId}` : '/000-aankondiging/010-aankondiging')}
                  className="text-[#2e75d4] hover:text-[#4d8ada] focus:outline-none focus:ring-2 focus:ring-[#2e75d4] focus:ring-offset-2 rounded p-1"
                  aria-label="Bewerk aankondiging"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                </button>
              </div>
              <div>
                <p className="text-sm font-bold text-gray-900 mb-1">Wat wilt u aankondigen bij de gemeente?</p>
                <p className="text-base text-gray-700">{displayData.aankondiging}</p>
              </div>
            </div>

            {/* Partner 1 */}
            <div className="border border-gray-300 rounded-lg p-6">
              <div className="flex items-start justify-between mb-4">
                <h3 className="font-bold text-lg">Gegevens partner 1</h3>
              </div>
              <div className="space-y-4 text-sm">
                <div>
                  <p className="font-bold text-gray-900">Voornamen</p>
                  <p className="text-gray-700">{displayData.partner1.voornamen}</p>
                </div>
                <div>
                  <p className="font-bold text-gray-900">Achternaam</p>
                  <p className="text-gray-700">{displayData.partner1.achternaam}</p>
                </div>
                <div>
                  <p className="font-bold text-gray-900">Geboortedatum</p>
                  <p className="text-gray-700">{displayData.partner1.geboortedatum}</p>
                </div>
                <div>
                  <p className="font-bold text-gray-900">Adres</p>
                  <p className="text-gray-700">{displayData.partner1.adres}</p>
                  <p className="text-gray-700">{displayData.partner1.postcode} {displayData.partner1.plaats}</p>
                </div>
                <div>
                  <p className="font-bold text-gray-900">Burgerlijke staat</p>
                  <p className="text-gray-700">{displayData.partner1.burgerlijkeStaat}</p>
                </div>
                {displayData.partner1.ouders.length > 0 && (
                  <div>
                    <p className="font-bold text-gray-900">Ouders</p>
                    <ul className="list-disc list-inside text-gray-700">
                      {displayData.partner1.ouders.map((ouder, idx) => (
                        <li key={idx}>{ouder}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>

            {/* Partner 2 */}
            <div className="border border-gray-300 rounded-lg p-6">
              <div className="flex items-start justify-between mb-4">
                <h3 className="font-bold text-lg">Gegevens partner 2</h3>
              </div>
              <div className="space-y-4 text-sm">
                <div>
                  <p className="font-bold text-gray-900">Voornamen</p>
                  <p className="text-gray-700">{displayData.partner2.voornamen}</p>
                </div>
                <div>
                  <p className="font-bold text-gray-900">Achternaam</p>
                  <p className="text-gray-700">{displayData.partner2.achternaam}</p>
                </div>
                <div>
                  <p className="font-bold text-gray-900">Geboortedatum</p>
                  <p className="text-gray-700">{displayData.partner2.geboortedatum}</p>
                </div>
                <div>
                  <p className="font-bold text-gray-900">Adres</p>
                  <p className="text-gray-700">{displayData.partner2.adres}</p>
                  <p className="text-gray-700">{displayData.partner2.postcode} {displayData.partner2.plaats}</p>
                </div>
                <div>
                  <p className="font-bold text-gray-900">Burgerlijke staat</p>
                  <p className="text-gray-700">{displayData.partner2.burgerlijkeStaat}</p>
                </div>
                {displayData.partner2.ouders.length > 0 && (
                  <div>
                    <p className="font-bold text-gray-900">Ouders</p>
                    <ul className="list-disc list-inside text-gray-700">
                      {displayData.partner2.ouders.map((ouder, idx) => (
                        <li key={idx}>{ouder}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>

            {/* Curatele */}
            <div className="border border-gray-300 rounded-lg p-6">
              <div className="flex items-start justify-between mb-4">
                <h3 className="font-bold text-lg">Curatele</h3>
                <button 
                  onClick={() => router.push(dossierId ? `/000-aankondiging/040-curatele?dossierId=${dossierId}` : '/000-aankondiging/040-curatele')}
                  className="text-[#2e75d4] hover:text-[#4d8ada] focus:outline-none focus:ring-2 focus:ring-[#2e75d4] focus:ring-offset-2 rounded p-1"
                  aria-label="Bewerk curatele"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                </button>
              </div>
              <div className="space-y-4 text-sm">
                <div>
                  <p className="font-bold text-gray-900">Staat u onder curatele?</p>
                  <p className="text-gray-700">{displayData.curatele.partner1}</p>
                </div>
                {displayData.curatele.partner1Document && (
                  <div>
                    <p className="font-bold text-gray-900">Toestemmingsformulier van de curator</p>
                    <div className="flex items-center gap-2 mt-2">
                      <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                      </svg>
                      <span className="text-gray-700">{displayData.curatele.partner1Document}</span>
                    </div>
                  </div>
                )}
                <div>
                  <p className="font-bold text-gray-900">Staat uw partner onder curatele?</p>
                  <p className="text-gray-700">{displayData.curatele.partner2}</p>
                </div>
              </div>
            </div>

            {/* Kinderen */}
            <div className="border border-gray-300 rounded-lg p-6">
              <div className="flex items-start justify-between mb-4">
                <h3 className="font-bold text-lg">Kinderen uit een ander huwelijk</h3>
                <button 
                  onClick={() => router.push(dossierId ? `/000-aankondiging/050-kinderen?dossierId=${dossierId}` : '/000-aankondiging/050-kinderen')}
                  className="text-[#2e75d4] hover:text-[#4d8ada] focus:outline-none focus:ring-2 focus:ring-[#2e75d4] focus:ring-offset-2 rounded p-1"
                  aria-label="Bewerk kinderen"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                </button>
              </div>
              <div className="space-y-4 text-sm">
                <div>
                  <p className="font-bold text-gray-900">Heeft {displayData.partner1.voornamen} {displayData.partner1.achternaam} kinderen uit een ander huwelijk?</p>
                  <p className="text-gray-700">{displayData.kinderen.partner1}</p>
                </div>
                {displayData.kinderen.partner1Children && displayData.kinderen.partner1Children.length > 0 && (
                  <div>
                    <p className="font-bold text-gray-900 mb-2">Kinderen</p>
                    <ul className="list-disc list-inside text-gray-700">
                      {displayData.kinderen.partner1Children.map((kind) => (
                        <li key={kind.id}>{kind.voornamen} {kind.achternaam}, geboren op {kind.geboortedatum}</li>
                      ))}
                    </ul>
                  </div>
                )}
                <div>
                  <p className="font-bold text-gray-900">Heeft {displayData.partner2.voornamen} {displayData.partner2.achternaam} kinderen uit een ander huwelijk?</p>
                  <p className="text-gray-700">{displayData.kinderen.partner2}</p>
                </div>
                {displayData.kinderen.partner2Children && displayData.kinderen.partner2Children.length > 0 && (
                  <div>
                    <p className="font-bold text-gray-900 mb-2">Kinderen</p>
                    <ul className="list-disc list-inside text-gray-700">
                      {displayData.kinderen.partner2Children.map((kind) => (
                        <li key={kind.id}>{kind.voornamen} {kind.achternaam}, geboren op {kind.geboortedatum}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>

            {/* Bloedverwantschap */}
            <div className="border border-gray-300 rounded-lg p-6">
              <div className="flex items-start justify-between mb-4">
                <h3 className="font-bold text-lg">Bloedverwantschap</h3>
                <button 
                  onClick={() => router.push(dossierId ? `/000-aankondiging/060-bloedverwantschap?dossierId=${dossierId}` : '/000-aankondiging/060-bloedverwantschap')}
                  className="text-[#2e75d4] hover:text-[#4d8ada] focus:outline-none focus:ring-2 focus:ring-[#2e75d4] focus:ring-offset-2 rounded p-1"
                  aria-label="Bewerk bloedverwantschap"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                </button>
              </div>
              <div className="text-sm">
                <p className="font-bold text-gray-900">Zijn de partners bloedverwanten van elkaar?</p>
                <p className="text-gray-700">{displayData.bloedverwantschap}</p>
              </div>
            </div>
          </div>

          {/* Confirmation checkbox */}
          <div className="mt-8">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={confirmationChecked}
                onChange={(e) => setConfirmationChecked(e.target.checked)}
                className="w-5 h-5 text-[#2e75d4] border-gray-300 rounded focus:ring-2 focus:ring-[#2e75d4] mt-0.5"
              />
              <span className="text-base text-gray-900">
                Alle bovenstaande gegevens kloppen.
              </span>
            </label>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col gap-4 mt-8">
            <button
              onClick={handleContinue}
              disabled={!confirmationChecked}
              className="inline-flex items-center justify-center gap-2 bg-[#2e75d4] text-white font-sans text-base font-bold px-6 py-3 rounded hover:bg-[#4d8ada] focus:outline-none focus:ring-2 focus:ring-[#2e75d4] focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Ga naar ondertekenen
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>

            <button
              onClick={handleDownloadPDF}
              className="inline-flex items-center gap-2 text-[#2e75d4] hover:text-[#4d8ada] font-medium underline focus:outline-none focus:ring-2 focus:ring-[#2e75d4] focus:ring-offset-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Download samenvatting als PDF
            </button>

            <button
              onClick={handleSaveForLater}
              className="text-[#2e75d4] hover:text-[#4d8ada] underline text-sm"
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
export default function SamenvattingPage(): JSX.Element {
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
      <SamenvattingContent />
    </Suspense>
  );
}

