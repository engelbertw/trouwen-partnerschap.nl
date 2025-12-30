'use client';

import type { JSX } from 'react';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { generateAndDownloadAankondigingPDF } from '@/lib/pdf-generator';
import type { AankondigingData } from '@/lib/aankondiging-storage';
import { GemeenteLogoCompact } from '@/components/GemeenteLogo';

interface DossierSummaryData {
  id: string;
  type: 'huwelijk' | 'partnerschap';
  partner1: {
    voornamen: string;
    geslachtsnaam: string;
    geboortedatum: string;
    geboorteplaats: string;
    geboorteland: string;
    email: string | null;
  };
  partner2: {
    voornamen: string;
    geslachtsnaam: string;
    geboortedatum: string;
    geboorteplaats: string;
    geboorteland: string;
    email: string | null;
  };
  createdAt: string;
  geldigTot: string;
}

export default function DossierSamenvattingPage(): JSX.Element {
  const params = useParams();
  const router = useRouter();
  const dossierId = params.id as string;
  const [data, setData] = useState<DossierSummaryData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(`/api/dossier/${dossierId}/samenvatting`);
        const result = await response.json();

        if (result.success) {
          setData(result.data);
        } else {
          setError(result.error || 'Gegevens niet gevonden');
        }
      } catch (err) {
        console.error('Error fetching summary:', err);
        setError('Er ging iets mis bij het ophalen van de gegevens');
      } finally {
        setIsLoading(false);
      }
    };

    if (dossierId) {
      fetchData();
    }
  }, [dossierId]);

  const handleDownloadPDF = () => {
    if (!data) {
      console.error('Cannot generate PDF: data is not available');
      alert('Gegevens zijn niet beschikbaar. Probeer de pagina te vernieuwen.');
      return;
    }

    try {
      // Convert dossier data to AankondigingData format for PDF generator
      const aankondigingData: AankondigingData = {
        type: data.type,
        partner1: {
          voornamen: data.partner1.voornamen,
          achternaam: data.partner1.geslachtsnaam,
          geboortedatum: data.partner1.geboortedatum,
          plaats: data.partner1.geboorteplaats,
          email: data.partner1.email || undefined,
        },
        partner2: {
          voornamen: data.partner2.voornamen,
          achternaam: data.partner2.geslachtsnaam,
          geboortedatum: data.partner2.geboortedatum,
          plaats: data.partner2.geboorteplaats,
          email: data.partner2.email || undefined,
        },
      };

      // Use dossier ID for PDF filename
      generateAndDownloadAankondigingPDF(aankondigingData, data.id);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Er ging iets mis bij het genereren van de PDF. Probeer het opnieuw.');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Gegevens laden...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || 'Gegevens niet gevonden'}</p>
          <button
            onClick={() => router.push(`/dossier/${dossierId}`)}
            className="text-blue-600 hover:underline"
          >
            Terug naar dossier
          </button>
        </div>
      </div>
    );
  }

  const ceremonyType = data.type === 'huwelijk' ? 'huwelijk' : 'partnerschap';

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <GemeenteLogoCompact />
          <button
            onClick={() => router.push(`/dossier/${dossierId}`)}
            className="text-gray-600 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 rounded p-2"
            aria-label="Sluiten"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </header>

      {/* Blue bar */}
      <div className="bg-blue-700 text-white">
        <div className="max-w-5xl mx-auto px-6 py-3">
          <h1 className="font-sans text-lg font-normal">Samenvatting aankondiging</h1>
        </div>
      </div>

      {/* Main content */}
      <main className="max-w-5xl mx-auto px-6 py-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          {/* Type aankondiging */}
          <section className="mb-8 pb-8 border-b border-gray-200">
            <h2 className="font-serif text-xl font-bold text-gray-900 mb-4">
              Type aankondiging
            </h2>
            <p className="font-sans text-base text-gray-700 capitalize">
              {ceremonyType}
            </p>
          </section>

          {/* Partner 1 */}
          <section className="mb-8 pb-8 border-b border-gray-200">
            <h2 className="font-serif text-xl font-bold text-gray-900 mb-4">Partner 1</h2>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <dt className="font-sans text-sm font-semibold text-gray-600 mb-1">
                  Voornamen
                </dt>
                <dd className="font-sans text-base text-gray-900">{data.partner1.voornamen}</dd>
              </div>
              <div>
                <dt className="font-sans text-sm font-semibold text-gray-600 mb-1">
                  Achternaam
                </dt>
                <dd className="font-sans text-base text-gray-900">
                  {data.partner1.geslachtsnaam}
                </dd>
              </div>
              <div>
                <dt className="font-sans text-sm font-semibold text-gray-600 mb-1">
                  Geboortedatum
                </dt>
                <dd className="font-sans text-base text-gray-900">
                  {data.partner1.geboortedatum}
                </dd>
              </div>
              <div>
                <dt className="font-sans text-sm font-semibold text-gray-600 mb-1">
                  Geboorteplaats
                </dt>
                <dd className="font-sans text-base text-gray-900">
                  {data.partner1.geboorteplaats}
                </dd>
              </div>
              <div>
                <dt className="font-sans text-sm font-semibold text-gray-600 mb-1">
                  Geboorteland
                </dt>
                <dd className="font-sans text-base text-gray-900">
                  {data.partner1.geboorteland}
                </dd>
              </div>
              {data.partner1.email && (
                <div>
                  <dt className="font-sans text-sm font-semibold text-gray-600 mb-1">
                    E-mailadres
                  </dt>
                  <dd className="font-sans text-base text-gray-900">{data.partner1.email}</dd>
                </div>
              )}
            </dl>
          </section>

          {/* Partner 2 */}
          <section className="mb-8 pb-8 border-b border-gray-200">
            <h2 className="font-serif text-xl font-bold text-gray-900 mb-4">Partner 2</h2>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <dt className="font-sans text-sm font-semibold text-gray-600 mb-1">
                  Voornamen
                </dt>
                <dd className="font-sans text-base text-gray-900">{data.partner2.voornamen}</dd>
              </div>
              <div>
                <dt className="font-sans text-sm font-semibold text-gray-600 mb-1">
                  Achternaam
                </dt>
                <dd className="font-sans text-base text-gray-900">
                  {data.partner2.geslachtsnaam}
                </dd>
              </div>
              <div>
                <dt className="font-sans text-sm font-semibold text-gray-600 mb-1">
                  Geboortedatum
                </dt>
                <dd className="font-sans text-base text-gray-900">
                  {data.partner2.geboortedatum}
                </dd>
              </div>
              <div>
                <dt className="font-sans text-sm font-semibold text-gray-600 mb-1">
                  Geboorteplaats
                </dt>
                <dd className="font-sans text-base text-gray-900">
                  {data.partner2.geboorteplaats}
                </dd>
              </div>
              <div>
                <dt className="font-sans text-sm font-semibold text-gray-600 mb-1">
                  Geboorteland
                </dt>
                <dd className="font-sans text-base text-gray-900">
                  {data.partner2.geboorteland}
                </dd>
              </div>
              {data.partner2.email && (
                <div>
                  <dt className="font-sans text-sm font-semibold text-gray-600 mb-1">
                    E-mailadres
                  </dt>
                  <dd className="font-sans text-base text-gray-900">{data.partner2.email}</dd>
                </div>
              )}
            </dl>
          </section>

          {/* Datum aankondiging */}
          <section className="mb-8">
            <h2 className="font-serif text-xl font-bold text-gray-900 mb-4">
              Datum aankondiging
            </h2>
            <p className="font-sans text-base text-gray-700 mb-2">
              Aangemaakt op: {data.createdAt}
            </p>
            <p className="font-sans text-base text-gray-700">Geldig tot: {data.geldigTot}</p>
          </section>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-gray-200">
            <button
              onClick={handleDownloadPDF}
              className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-sans text-base px-6 py-3 rounded focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              Download als PDF
            </button>
            <button
              onClick={() => router.push(`/dossier/${dossierId}`)}
              className="inline-flex items-center justify-center bg-white border-2 border-blue-600 text-blue-600 hover:bg-blue-50 font-sans text-base px-6 py-3 rounded focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 transition-colors"
            >
              Terug naar dossier
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

