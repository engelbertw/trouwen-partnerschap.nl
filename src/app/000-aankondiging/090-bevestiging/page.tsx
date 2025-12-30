'use client';

import type { JSX } from 'react';
import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { GemeenteLogoCompact } from '@/components/GemeenteLogo';
import { generateAndDownloadAankondigingPDF } from '@/lib/pdf-generator';

/**
 * Bevestiging page - Success confirmation after announcement is sent
 * Shows confirmation that the announcement has been saved to the database
 */
function BevestigingContent(): JSX.Element {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dossierIdFromUrl = searchParams.get('dossierId');
  
  const [dossierId, setDossierId] = useState<string | null>(dossierIdFromUrl);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [samenvattingData, setSamenvattingData] = useState<any>(null);

  useEffect(() => {
    // Load dossier data from database
    const loadDossierData = async () => {
      if (!dossierIdFromUrl) {
        setError('Geen dossier ID gevonden. Ga terug naar het formulier.');
        setIsLoading(false);
        return;
      }

      try {
        // Verify dossier exists and load summary data
        const response = await fetch(`/api/dossier/${dossierIdFromUrl}/samenvatting`);
        
        if (!response.ok) {
          const errorText = await response.text();
          let errorData;
          try {
            errorData = JSON.parse(errorText);
          } catch {
            errorData = { error: `HTTP ${response.status}: ${response.statusText}` };
          }
          setError(errorData.error || `Fout bij laden (${response.status})`);
          setIsLoading(false);
          return;
        }
        
        const result = await response.json();
        
        if (!result.success) {
          setError(result.error || 'Fout bij laden van gegevens');
          setIsLoading(false);
          return;
        }

        if (!result.data) {
          setError('Geen gegevens gevonden voor dit dossier');
          setIsLoading(false);
          return;
        }

        setSamenvattingData(result.data);
        setDossierId(dossierIdFromUrl);
        setIsLoading(false);
      } catch (err) {
        console.error('Error loading dossier data:', err);
        setError('Er ging iets mis bij het laden van de gegevens. Probeer het later opnieuw.');
        setIsLoading(false);
      }
    };

    loadDossierData();
  }, [dossierIdFromUrl]);

  const handleOpenDossier = () => {
    if (dossierId) {
      // TODO: Navigate to wedding dossier detail page
      router.push(`/dossier/${dossierId}`);
    } else {
      alert('Dossier ID niet beschikbaar');
    }
  };

  const handleClose = () => {
    router.push('/');
  };

  const handleDownloadPDF = () => {
    try {
      if (!dossierId) {
        alert('Kan PDF niet genereren: dossiernummer ontbreekt');
        return;
      }
      
      if (!samenvattingData) {
        alert('Kan PDF niet genereren: gegevens niet beschikbaar');
        return;
      }
      
      // Convert samenvatting data to format expected by PDF generator
      // The PDF generator expects the old format, so we need to transform it
      // Convert null to undefined to match AankondigingData interface
      const formData = {
        type: samenvattingData.type,
        partner1: samenvattingData.partner1 ? {
          voornamen: samenvattingData.partner1.voornamen || '',
          achternaam: samenvattingData.partner1.geslachtsnaam || samenvattingData.partner1.achternaam || '',
          geboortedatum: samenvattingData.partner1.geboortedatum || '',
          adres: samenvattingData.partner1.adres || '',
          postcode: samenvattingData.partner1.postcode || '',
          plaats: samenvattingData.partner1.plaats || '',
          burgerlijkeStaat: samenvattingData.partner1.burgerlijkeStaat || '',
          ouders: samenvattingData.partner1.ouders || [],
        } : undefined,
        partner2: samenvattingData.partner2 ? {
          voornamen: samenvattingData.partner2.voornamen || '',
          achternaam: samenvattingData.partner2.geslachtsnaam || samenvattingData.partner2.achternaam || '',
          geboortedatum: samenvattingData.partner2.geboortedatum || '',
          adres: samenvattingData.partner2.adres || '',
          postcode: samenvattingData.partner2.postcode || '',
          plaats: samenvattingData.partner2.plaats || '',
          burgerlijkeStaat: samenvattingData.partner2.burgerlijkeStaat || '',
          ouders: samenvattingData.partner2.ouders || [],
        } : undefined,
        kinderen: samenvattingData.kinderen ? {
          partner1HasChildren: samenvattingData.kinderen.partner1 === 'Ja',
          partner1Children: samenvattingData.kinderen.partner1Children || [],
          partner2HasChildren: samenvattingData.kinderen.partner2 === 'Ja',
          partner2Children: samenvattingData.kinderen.partner2Children || [],
        } : undefined,
        curatele: samenvattingData.curatele ? {
          partner1UnderGuardianship: samenvattingData.curatele.partner1 === 'Ja',
          partner2UnderGuardianship: samenvattingData.curatele.partner2 === 'Ja',
        } : undefined,
        bloedverwantschap: samenvattingData.bloedverwantschap ? {
          areBloodRelatives: samenvattingData.bloedverwantschap === 'Ja',
        } : undefined,
      };
      
      // Generate and download PDF
      generateAndDownloadAankondigingPDF(formData, dossierId);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Er ging iets mis bij het genereren van de PDF. Probeer het opnieuw.');
    }
  };

  // Show loading state while loading dossier data
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-blue-100">
        {/* Header */}
        <header className="bg-[#154273] text-white py-4 px-4 sm:px-6 lg:px-8">
          <div className="container mx-auto max-w-4xl">
            <GemeenteLogoCompact />
          </div>
        </header>

        <div className="bg-[#154273] text-white py-3 px-4 sm:px-6 lg:px-8 border-t border-white/20">
          <div className="container mx-auto max-w-4xl">
            <h1 className="text-lg font-normal">Huwelijk of partnerschap aankondigen</h1>
          </div>
        </div>

        <main className="container mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8 flex items-center justify-center min-h-[60vh]">
          <div className="bg-white rounded-lg shadow-md p-8 sm:p-12 text-center max-w-md">
            <div className="inline-block animate-spin rounded-full h-16 w-16 border-b-4 border-[#154273] mb-6"></div>
            <h2 className="font-serif text-2xl font-bold mb-4 text-gray-900">
              Gegevens laden...
            </h2>
            <p className="text-gray-700">
              Uw gegevens worden geladen.
              Dit kan een paar seconden duren.
            </p>
          </div>
        </main>
      </div>
    );
  }

  // Show error state if save failed
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-blue-100">
        {/* Header */}
        <header className="bg-[#154273] text-white py-4 px-4 sm:px-6 lg:px-8">
          <div className="container mx-auto max-w-4xl">
            <GemeenteLogoCompact />
          </div>
        </header>

        <div className="bg-[#154273] text-white py-3 px-4 sm:px-6 lg:px-8 border-t border-white/20">
          <div className="container mx-auto max-w-4xl">
            <h1 className="text-lg font-normal">Huwelijk of partnerschap aankondigen</h1>
          </div>
        </div>

        <main className="container mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8 flex items-center justify-center min-h-[60vh]">
          <div className="bg-white rounded-lg shadow-md p-8 sm:p-12 text-center max-w-md">
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
              Fout bij opslaan
            </h2>
            <p className="text-gray-700 mb-6 whitespace-pre-line">{error}</p>
            <div className="flex flex-col gap-3">
              <button
                onClick={() => router.push('/000-aankondiging/000-inleiding')}
                className="bg-[#154273] text-white font-bold px-6 py-3 rounded hover:bg-[#1a5a99] transition-colors"
              >
                Formulier opnieuw starten
              </button>
              <button
                onClick={() => {
                  if (dossierIdFromUrl) {
                    router.push(`/000-aankondiging/070-samenvatting?dossierId=${dossierIdFromUrl}`);
                  } else {
                    router.push('/000-aankondiging/070-samenvatting');
                  }
                }}
                className="bg-white text-[#154273] font-bold px-6 py-3 rounded border-2 border-[#154273] hover:bg-blue-50 transition-colors"
              >
                Terug naar samenvatting
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // Success state - show confirmation
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-blue-100">
      {/* Header */}
      <header className="bg-[#154273] text-white py-4 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto max-w-4xl flex items-center justify-between">
          <div className="flex items-center gap-4">
            <GemeenteLogoCompact />
          </div>
          <button
            onClick={handleClose}
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
        <article className="bg-white rounded-lg shadow-md p-8 sm:p-12 max-w-3xl mx-auto">
          {/* Success icon and heading */}
          <div className="flex items-start gap-4 mb-6">
            <svg
              className="w-8 h-8 text-green-600 flex-shrink-0 mt-1"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            <h2 className="font-serif text-3xl font-bold text-gray-900">
              Uw aankondiging is verstuurd
            </h2>
          </div>

          {/* Content sections */}
          <div className="space-y-6 text-base">
            {/* Bedankt section */}
            <section>
              <h3 className="font-bold text-gray-900 mb-2">Bedankt</h3>
              <p className="text-gray-700">
                Uw aankondiging is succesvol ontvangen en opgeslagen in ons systeem. 
                Binnen 8 weken ontvangt u een brief van de gemeente waarin staat of uw aankondiging is goedgekeurd.
              </p>
              {dossierId && (
                <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded">
                  <p className="text-sm font-medium text-gray-900">
                    Uw dossiernummer:
                  </p>
                  <code className="text-sm font-mono bg-white px-2 py-1 rounded border border-gray-300 inline-block mt-1">
                    {dossierId.substring(0, 8).toUpperCase()}
                  </code>
                </div>
              )}
            </section>

            {/* Wat kunt u nu doen? section */}
            <section>
              <h3 className="font-bold text-gray-900 mb-2">Wat kunt u nu doen?</h3>
              <p className="text-gray-700 mb-3">
                U ontvangt een e-mail met een link naar uw huwelijksdossier. U kunt uw dossier ook openen via de website van de gemeente door in te loggen met DigiD.
              </p>
              <p className="text-gray-700 mb-2">In uw dossier kunt u:</p>
              <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4">
                <li>de actuele status van uw aankondiging te bekijken;</li>
                <li>alvast de ceremonie te plannen;</li>
                <li>uw getuigen op te geven;</li>
                <li>op te geven welke documenten u wilt ontvangen.</li>
              </ul>
            </section>

            {/* Kopie van uw aanvraag section */}
            <section>
              <h3 className="font-bold text-gray-900 mb-2">Kopie van uw aanvraag</h3>
              <p className="text-gray-700 mb-4">
                Een kopie van uw aanvraag kunt u hier downloaden. U ontvangt geen kopie in uw bevestigingsmail.
              </p>
              <button
                onClick={handleDownloadPDF}
                className="inline-flex items-center gap-2 text-[#154273] hover:text-[#1a5a99] font-medium underline"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Download overzicht aanvraag PDF
              </button>
            </section>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row gap-4 mt-8 pt-6 border-t border-gray-200">
            <button
              onClick={handleOpenDossier}
              className="inline-flex items-center justify-center bg-[#154273] text-white font-sans text-base font-bold px-6 py-3 rounded hover:bg-[#1a5a99] focus:outline-none focus:ring-2 focus:ring-[#154273] focus:ring-offset-2 transition-colors"
            >
              Huwelijksdossier openen
            </button>
            <button
              onClick={handleClose}
              className="inline-flex items-center justify-center bg-white text-[#154273] font-sans text-base font-bold px-6 py-3 rounded border-2 border-[#154273] hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-[#154273] focus:ring-offset-2 transition-colors"
            >
              Formulier sluiten
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
export default function BevestigingPage(): JSX.Element {
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
      <BevestigingContent />
    </Suspense>
  );
}

