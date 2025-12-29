'use client';

import type { JSX } from 'react';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { GemeenteLogoCompact } from '@/components/GemeenteLogo';
import { generateAndDownloadAankondigingPDF } from '@/lib/pdf-generator';
import type { AankondigingData } from '@/lib/aankondiging-storage';

interface GetuigeData {
  voornamen: string;
  voorvoegsel: string | null;
  achternaam: string;
  volledigeNaam: string;
}

interface DocumentData {
  naam: string;
  prijsCents: number;
  gratis: boolean;
  verplicht: boolean;
}

interface CeremonieData {
  datum: string;
  startTijd: string;
  eindTijd: string;
  locatie: {
    naam: string;
    type: string;
  } | null;
  babs: {
    naam: string;
  } | null;
  type: {
    naam: string;
    code: string;
    duurMinuten: number | null;
    eigenBabsToegestaan: boolean;
  } | null;
  wijzigbaarTot: string | null;
}

interface DossierData {
  id: string;
  identificatie?: string; // GEMMA zaaknummer (HUW-2025-000001)
  partner1: {
    voornamen: string;
    geslachtsnaam: string;
    naamgebruikKeuze?: string | null;
  };
  partner2: {
    voornamen: string;
    geslachtsnaam: string;
    naamgebruikKeuze?: string | null;
  };
  type: 'huwelijk' | 'partnerschap';
  status: string;
  geldigTot: string;
  createdAt: string;
  ceremonie: CeremonieData | null;
  getuigen: GetuigeData[];
  documenten: DocumentData[];
  kosten?: {
    ceremonieKostenCents: number;
    documentenKostenCents: number;
    totaalKostenCents: number;
  };
  acties?: {
    ceremonie: boolean;
    getuigen: boolean;
    documenten: boolean;
    naamgebruik: boolean;
  };
}

export default function HuwelijksdossierPage(): JSX.Element {
  const params = useParams();
  const router = useRouter();
  const dossierId = params.id as string;
  const [dossier, setDossier] = useState<DossierData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const formatPrice = (cents: number): string => {
    const euros = cents / 100;
    return `€ ${euros.toFixed(2).replace('.', ',')}`;
  };

  useEffect(() => {
    const fetchDossier = async () => {
      try {
        const response = await fetch(`/api/dossier/${dossierId}`);
        const result = await response.json();

        if (result.success) {
          setDossier(result.dossier);
        } else {
          setError(result.error || 'Dossier niet gevonden');
        }
      } catch (err) {
        console.error('Error fetching dossier:', err);
        setError('Er ging iets mis bij het ophalen van het dossier');
      } finally {
        setIsLoading(false);
      }
    };

    if (dossierId) {
      fetchDossier();
    }
  }, [dossierId]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Dossier laden...</p>
        </div>
      </div>
    );
  }

  if (error || !dossier) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || 'Dossier niet gevonden'}</p>
          <button
            onClick={() => router.push('/')}
            className="text-blue-600 hover:underline"
          >
            Terug naar home
          </button>
        </div>
      </div>
    );
  }

  const ceremonyType = dossier.type === 'huwelijk' ? 'huwelijk' : 'partnerschap';

  const getNaamgebruikLabel = (keuze: string | null | undefined, partner1Naam: string, partner2Naam: string): string => {
    if (!keuze) return 'Nog niet gekozen';
    
    switch (keuze) {
      case 'eigen':
        return 'Eigen naam';
      case 'partner':
        return `Naam van partner (${partner1Naam === dossier.partner1.geslachtsnaam ? partner2Naam : partner1Naam})`;
      case 'eigen_partner':
        return `Eigen naam-Partnernaam (${partner1Naam === dossier.partner1.geslachtsnaam ? `${partner1Naam}-${partner2Naam}` : `${partner2Naam}-${partner1Naam}`})`;
      case 'partner_eigen':
        return `Partnernaam-Eigen naam (${partner1Naam === dossier.partner1.geslachtsnaam ? `${partner2Naam}-${partner1Naam}` : `${partner1Naam}-${partner2Naam}`})`;
      default:
        return 'Onbekend';
    }
  };

  const handleDownloadPDF = () => {
    try {
      // Convert dossier data to AankondigingData format
      // Note: Some fields are not available in dossier structure, using placeholders
      const aankondigingData: AankondigingData = {
        type: dossier.type,
        partner1: {
          voornamen: dossier.partner1.voornamen || '',
          achternaam: dossier.partner1.geslachtsnaam || '',
          geboortedatum: '', // Not available in this data structure
          adres: '', // Not available in this data structure
          postcode: '', // Not available in this data structure
          plaats: '', // Not available in this data structure
          burgerlijkeStaat: '', // Not available in this data structure
          ouders: [], // Not available in this data structure
        },
        partner2: {
          voornamen: dossier.partner2.voornamen || '',
          achternaam: dossier.partner2.geslachtsnaam || '',
          geboortedatum: '', // Not available in this data structure
          adres: '', // Not available in this data structure
          postcode: '', // Not available in this data structure
          plaats: '', // Not available in this data structure
          burgerlijkeStaat: '', // Not available in this data structure
          ouders: [], // Not available in this data structure
        },
      };

      generateAndDownloadAankondigingPDF(aankondigingData, dossier.id);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Er ging iets mis bij het genereren van de PDF. Probeer het opnieuw.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <GemeenteLogoCompact />
          <button
            onClick={() => router.push('/')}
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
          <h1 className="font-sans text-lg font-normal">Huwelijksdossier</h1>
        </div>
      </div>

      {/* Main content */}
      <main className="max-w-5xl mx-auto px-6 py-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 mb-6">
          {/* Openstaande acties */}
          <section className="mb-10">
            <h2 className="font-serif text-2xl font-bold text-gray-900 mb-6">
              Openstaande acties
            </h2>
            {/* Openstaande acties - alleen tonen als er nog acties openstaan */}
            {(dossier.acties?.ceremonie || 
              dossier.acties?.getuigen || 
              dossier.acties?.documenten || 
              dossier.acties?.naamgebruik) ? (
              <div className="space-y-3">
                {/* Plan ceremonie - alleen tonen als nog niet gepland */}
                {dossier.acties?.ceremonie && (
                  <Link
                    href={`/dossier/${dossierId}/ceremonie`}
                    className="flex items-center justify-between bg-blue-50 hover:bg-blue-100 px-4 py-3 rounded transition-colors group"
                  >
                    <span className="font-sans text-base text-gray-900">
                      Plan jullie ceremonie
                    </span>
                    <svg
                      className="w-5 h-5 text-blue-600 group-hover:translate-x-1 transition-transform"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                )}

                {/* Geef getuigen door - alleen tonen als nog niet voltooid */}
                {dossier.acties?.getuigen && (
                  <Link
                    href={`/dossier/${dossierId}/getuigen`}
                    className="flex items-center justify-between bg-blue-50 hover:bg-blue-100 px-4 py-3 rounded transition-colors group"
                  >
                    <span className="font-sans text-base text-gray-900">
                      Geef jullie getuigen door
                    </span>
                    <svg
                      className="w-5 h-5 text-blue-600 group-hover:translate-x-1 transition-transform"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                )}

                {/* Kies documenten - alleen tonen als nog niet voltooid */}
                {dossier.acties?.documenten && (
                  <Link
                    href={`/dossier/${dossierId}/documenten`}
                    className="flex items-center justify-between bg-blue-50 hover:bg-blue-100 px-4 py-3 rounded transition-colors group"
                  >
                    <span className="font-sans text-base text-gray-900">
                      Kies welke documenten jullie willen ontvangen
                    </span>
                    <svg
                      className="w-5 h-5 text-blue-600 group-hover:translate-x-1 transition-transform"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                )}

                {/* Kies naamgebruik - alleen tonen als nog niet voltooid */}
                {dossier.acties?.naamgebruik && (
                  <Link
                    href={`/dossier/${dossierId}/naamgebruik`}
                    className="flex items-center justify-between bg-blue-50 hover:bg-blue-100 px-4 py-3 rounded transition-colors group"
                  >
                    <span className="font-sans text-base text-gray-900">
                      Kies jullie naamgebruik
                    </span>
                    <svg
                      className="w-5 h-5 text-blue-600 group-hover:translate-x-1 transition-transform"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                )}
              </div>
            ) : (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-start gap-2">
                  <svg className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <p className="font-sans text-sm font-semibold text-green-900 mb-1">
                      Alle acties voltooid
                    </p>
                    <p className="font-sans text-sm text-green-700">
                      U heeft alle openstaande acties voltooid. Uw dossier is klaar voor verdere verwerking.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </section>

          {/* Jullie huwelijk */}
          <section className="mb-10">
            <h2 className="font-serif text-2xl font-bold text-gray-900 mb-6">
              Jullie {ceremonyType}
            </h2>

            {/* Aankondiging */}
            <div className="border border-gray-200 rounded-lg p-6 mb-6">
              <h3 className="font-sans text-lg font-semibold text-gray-900 mb-3">
                Aankondiging
              </h3>

              <p className="font-sans text-base text-gray-700 mb-4">
                {dossier.partner1.voornamen} {dossier.partner1.geslachtsnaam} en{' '}
                {dossier.partner2.voornamen} {dossier.partner2.geslachtsnaam} hebben hun{' '}
                {ceremonyType} aangekondigd.
              </p>

              <div className="flex items-start gap-2 mb-3">
                <span className="font-sans text-sm text-gray-600">Status:</span>
                <div className="flex items-center gap-2">
                  {dossier.status === 'in_review' || dossier.status === 'ready_for_payment' || dossier.status === 'locked' ? (
                    <>
                      <span className="inline-block w-2 h-2 bg-green-500 rounded-full"></span>
                      <span className="font-sans text-sm font-medium text-gray-900">
                        Goedgekeurd door de gemeente
                      </span>
                    </>
                  ) : (
                    <>
                      <span className="inline-block w-2 h-2 bg-yellow-500 rounded-full"></span>
                      <span className="font-sans text-sm font-medium text-gray-900">
                        In behandeling bij de gemeente
                      </span>
                    </>
                  )}
                </div>
              </div>

              <div className="flex items-start gap-2 mb-6 bg-blue-50 p-3 rounded">
                <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <span className="font-sans text-sm text-gray-700">
                  Uw aankondiging is geldig tot {dossier.geldigTot}.
                </span>
              </div>

              <button
                onClick={() => router.push(`/dossier/${dossierId}/samenvatting`)}
                className="inline-flex items-center gap-2 bg-white border-2 border-blue-600 text-blue-600 font-sans text-base px-4 py-2 rounded hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Samenvatting bekijken
              </button>

              <button
                onClick={handleDownloadPDF}
                className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium underline focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Download als PDF
              </button>
            </div>

            {/* Ceremonie */}
            <div className="border border-gray-200 rounded-lg p-6">
              <h3 className="font-sans text-lg font-semibold text-gray-900 mb-4">
                Ceremonie
              </h3>

              {dossier.ceremonie ? (
                <>
                  {/* Ceremony Type Info Box (green) */}
                  {dossier.ceremonie.type && (
                    <div className="flex items-start gap-2 bg-green-50 p-4 rounded mb-6">
                      <svg className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <div className="flex-1">
                        <p className="font-sans text-sm font-semibold text-green-900 mb-1">
                          {dossier.ceremonie.type.naam}
                        </p>
                        <p className="font-sans text-sm text-green-700">
                          {dossier.ceremonie.type.duurMinuten && `Duur: ${dossier.ceremonie.type.duurMinuten} minuten`}
                          {dossier.ceremonie.type.eigenBabsToegestaan && ' • Eigen BABS mogelijk'}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Date and Time */}
                  <div className="flex items-center gap-3 mb-4">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span className="font-sans text-base text-gray-900">{dossier.ceremonie.datum}</span>
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="font-sans text-base text-gray-900">{dossier.ceremonie.startTijd} uur</span>
                  </div>

                  {/* Location and Officiant */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    {dossier.ceremonie.locatie && (
                      <div>
                        <div className="aspect-video bg-gray-200 rounded-lg overflow-hidden mb-2 flex items-center justify-center">
                          <span className="text-4xl">🏛️</span>
                        </div>
                        <p className="font-sans text-sm font-semibold text-gray-900">
                          {dossier.ceremonie.locatie.naam}
                        </p>
                      </div>
                    )}
                    {dossier.ceremonie.babs && (
                      <div>
                        <div className="aspect-video bg-gray-200 rounded-lg overflow-hidden mb-2 flex items-center justify-center">
                          <span className="text-4xl">👤</span>
                        </div>
                        <p className="font-sans text-sm font-semibold text-gray-900">
                          {dossier.ceremonie.babs.naam}
                        </p>
                      </div>
                    )}
                  </div>

                  {dossier.ceremonie.wijzigbaarTot && (
                    <div className="flex items-start gap-2 mb-6 bg-blue-50 p-3 rounded">
                      <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                      <span className="font-sans text-sm text-gray-700">
                        U kunt uw ceremonie kosteloos wijzigen tot {dossier.ceremonie.wijzigbaarTot}.
                      </span>
                    </div>
                  )}

                  <div className="flex gap-3">
                    <button
                      onClick={() => router.push(`/dossier/${dossierId}/ceremonie`)}
                      className="inline-flex items-center gap-2 bg-white border-2 border-blue-600 text-blue-600 font-sans text-base px-4 py-2 rounded hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 transition-colors"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      Ceremonie wijzigen
                    </button>
                    <button
                      onClick={() => router.push(`/dossier/${dossierId}/ceremonie/samenvatting`)}
                      className="inline-flex items-center gap-2 bg-white border-2 border-blue-600 text-blue-600 font-sans text-base px-4 py-2 rounded hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 transition-colors"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Samenvatting bekijken
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-start gap-2 mb-6 bg-gray-50 p-4 rounded">
                    <svg className="w-5 h-5 text-gray-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                    <div className="flex-1">
                      <p className="font-sans text-sm font-semibold text-gray-900 mb-1">
                        Ceremonie nog niet gepland
                      </p>
                      <p className="font-sans text-sm text-gray-700">
                        U kunt uw ceremonie plannen nadat uw aankondiging is goedgekeurd.
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => router.push(`/dossier/${dossierId}/ceremonie`)}
                    className="inline-flex items-center gap-2 bg-[#154273] text-white font-sans text-base font-bold px-6 py-3 rounded hover:bg-[#1a5a99] focus:outline-none focus:ring-2 focus:ring-[#154273] focus:ring-offset-2 transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Ceremonie plannen
                  </button>
                </>
              )}
            </div>

            {/* Naamgebruik */}
            <div className="border border-gray-200 rounded-lg p-6 mt-6">
              <h3 className="font-sans text-lg font-semibold text-gray-900 mb-4">
                Naamgebruik
              </h3>

              {!dossier.acties?.naamgebruik ? (
                <>
                  {/* Naamgebruik is gekozen - toon keuzes */}
                  <div className="space-y-4 mb-6">
                    {/* Info box */}
                    <div className="flex items-start gap-2 bg-green-50 p-4 rounded">
                      <svg className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <div className="flex-1">
                        <p className="font-sans text-sm font-semibold text-green-900 mb-1">
                          Naamgebruik gekozen
                        </p>
                        <p className="font-sans text-sm text-green-700">
                          Beide partners hebben hun naamgebruik keuze doorgegeven.
                        </p>
                      </div>
                    </div>

                    {/* Partner keuzes */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-gray-50 p-4 rounded">
                        <p className="font-sans text-sm font-semibold text-gray-900 mb-2">
                          {dossier.partner1.voornamen} {dossier.partner1.geslachtsnaam}
                        </p>
                        <p className="font-sans text-sm text-gray-600">
                          Naamgebruik: <span className="font-medium text-gray-900">
                            {getNaamgebruikLabel(dossier.partner1.naamgebruikKeuze, dossier.partner1.geslachtsnaam, dossier.partner2.geslachtsnaam)}
                          </span>
                        </p>
                      </div>
                      <div className="bg-gray-50 p-4 rounded">
                        <p className="font-sans text-sm font-semibold text-gray-900 mb-2">
                          {dossier.partner2.voornamen} {dossier.partner2.geslachtsnaam}
                        </p>
                        <p className="font-sans text-sm text-gray-600">
                          Naamgebruik: <span className="font-medium text-gray-900">
                            {getNaamgebruikLabel(dossier.partner2.naamgebruikKeuze, dossier.partner2.geslachtsnaam, dossier.partner1.geslachtsnaam)}
                          </span>
                        </p>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => router.push(`/dossier/${dossierId}/naamgebruik`)}
                    className="inline-flex items-center gap-2 bg-white border-2 border-blue-600 text-blue-600 font-sans text-base px-4 py-2 rounded hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Naamgebruik wijzigen
                  </button>
                </>
              ) : (
                <>
                  {/* Naamgebruik nog niet gekozen */}
                  <div className="flex items-start gap-2 mb-6 bg-gray-50 p-4 rounded">
                    <svg className="w-5 h-5 text-gray-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                    <div className="flex-1">
                      <p className="font-sans text-sm font-semibold text-gray-900 mb-1">
                        Naamgebruik nog niet gekozen
                      </p>
                      <p className="font-sans text-sm text-gray-700">
                        Beide partners moeten hun naamgebruik keuze doorgeven. Kies welke achternaam u wilt gebruiken na uw {ceremonyType}.
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => router.push(`/dossier/${dossierId}/naamgebruik`)}
                    className="inline-flex items-center gap-2 bg-[#154273] text-white font-sans text-base font-bold px-6 py-3 rounded hover:bg-[#1a5a99] focus:outline-none focus:ring-2 focus:ring-[#154273] focus:ring-offset-2 transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    Naamgebruik kiezen
                  </button>
                </>
              )}
            </div>

            {/* Getuigen */}
            <div className="border border-gray-200 rounded-lg p-6 mt-6">
              <h3 className="font-sans text-lg font-semibold text-gray-900 mb-4">
                Getuigen
              </h3>

              {dossier.getuigen && dossier.getuigen.length > 0 ? (
                <>
                  {/* Getuigen zijn ingevuld - toon lijst */}
                  <div className="space-y-4 mb-6">
                    {/* Info box */}
                    <div className="flex items-start gap-2 bg-green-50 p-4 rounded">
                      <svg className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <div className="flex-1">
                        <p className="font-sans text-sm font-semibold text-green-900 mb-1">
                          Getuigen opgegeven
                        </p>
                        <p className="font-sans text-sm text-green-700">
                          U heeft {dossier.getuigen.length} {dossier.getuigen.length === 1 ? 'getuige' : 'getuigen'} doorgegeven.
                        </p>
                      </div>
                    </div>

                    {/* Getuigen lijst */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {dossier.getuigen.map((getuige, index) => (
                        <div key={index} className="bg-gray-50 p-4 rounded flex items-start gap-3">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                            </svg>
                          </div>
                          <div className="flex-1">
                            <p className="font-sans text-sm font-semibold text-gray-900">
                              {getuige.volledigeNaam}
                            </p>
                            <p className="font-sans text-xs text-gray-600 mt-1">
                              Getuige {index + 1}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={() => router.push(`/dossier/${dossierId}/getuigen`)}
                    className="inline-flex items-center gap-2 bg-white border-2 border-blue-600 text-blue-600 font-sans text-base px-4 py-2 rounded hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Getuigen wijzigen
                  </button>
                </>
              ) : (
                <>
                  {/* Getuigen nog niet opgegeven */}
                  <div className="flex items-start gap-2 mb-6 bg-gray-50 p-4 rounded">
                    <svg className="w-5 h-5 text-gray-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                    <div className="flex-1">
                      <p className="font-sans text-sm font-semibold text-gray-900 mb-1">
                        Getuigen nog niet opgegeven
                      </p>
                      <p className="font-sans text-sm text-gray-700">
                        Geef de gegevens door van 2 tot 4 getuigen die aanwezig zullen zijn bij uw {ceremonyType}.
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => router.push(`/dossier/${dossierId}/getuigen`)}
                    className="inline-flex items-center gap-2 bg-[#154273] text-white font-sans text-base font-bold px-6 py-3 rounded hover:bg-[#1a5a99] focus:outline-none focus:ring-2 focus:ring-[#154273] focus:ring-offset-2 transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    Getuigen doorgeven
                  </button>
                </>
              )}
            </div>

            {/* Documenten */}
            <div className="border border-gray-200 rounded-lg p-6 mt-6">
              <h3 className="font-sans text-lg font-semibold text-gray-900 mb-4">
                Documenten
              </h3>

              {dossier.documenten && dossier.documenten.length > 0 ? (
                <>
                  {/* Documenten zijn geselecteerd - toon lijst */}
                  <div className="space-y-4 mb-6">
                    {/* Info box */}
                    <div className="flex items-start gap-2 bg-green-50 p-4 rounded">
                      <svg className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <div className="flex-1">
                        <p className="font-sans text-sm font-semibold text-green-900 mb-1">
                          Documenten geselecteerd
                        </p>
                        <p className="font-sans text-sm text-green-700">
                          U heeft {dossier.documenten.length} {dossier.documenten.length === 1 ? 'document' : 'documenten'} geselecteerd.
                        </p>
                      </div>
                    </div>

                    {/* Documenten lijst */}
                    <div className="grid grid-cols-1 gap-3">
                      {dossier.documenten.map((document, index) => (
                        <div key={index} className="bg-gray-50 p-4 rounded flex items-start justify-between">
                          <div className="flex items-start gap-3 flex-1">
                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                              <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                              </svg>
                            </div>
                            <div className="flex-1">
                              <p className="font-sans text-sm font-semibold text-gray-900">
                                {document.naam}
                                {document.verplicht && <span className="ml-2 text-xs text-gray-500">(verplicht)</span>}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-sans text-sm font-medium text-gray-900">
                              {document.gratis ? 'Gratis' : `€ ${(document.prijsCents / 100).toFixed(2).replace('.', ',')}`}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={() => router.push(`/dossier/${dossierId}/documenten`)}
                    className="inline-flex items-center gap-2 bg-white border-2 border-blue-600 text-blue-600 font-sans text-base px-4 py-2 rounded hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Documenten wijzigen
                  </button>
                </>
              ) : (
                <>
                  {/* Documenten nog niet geselecteerd */}
                  <div className="flex items-start gap-2 mb-6 bg-gray-50 p-4 rounded">
                    <svg className="w-5 h-5 text-gray-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                    <div className="flex-1">
                      <p className="font-sans text-sm font-semibold text-gray-900 mb-1">
                        Documenten nog niet geselecteerd
                      </p>
                      <p className="font-sans text-sm text-gray-700">
                        Geef aan welke documenten u wilt ontvangen na uw {ceremonyType}.
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => router.push(`/dossier/${dossierId}/documenten`)}
                    className="inline-flex items-center gap-2 bg-[#154273] text-white font-sans text-base font-bold px-6 py-3 rounded hover:bg-[#1a5a99] focus:outline-none focus:ring-2 focus:ring-[#154273] focus:ring-offset-2 transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Documenten selecteren
                  </button>
                </>
              )}
            </div>
          </section>

          {/* Kostenoverzicht */}
          <section>
            <h2 className="font-serif text-2xl font-bold text-gray-900 mb-6">
              Kostenoverzicht
            </h2>

            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left font-sans text-sm font-semibold text-gray-900 px-6 py-3">
                      Omschrijving
                    </th>
                    <th className="text-right font-sans text-sm font-semibold text-gray-900 px-6 py-3">
                      Prijs
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-gray-200">
                    <td className="font-sans text-base text-gray-700 px-6 py-4">Ceremonie</td>
                    <td className="font-sans text-base text-gray-700 px-6 py-4 text-right">
                      {dossier.kosten?.ceremonieKostenCents > 0 
                        ? formatPrice(dossier.kosten.ceremonieKostenCents)
                        : dossier.ceremonie ? 'Gratis' : 'Wordt nog bepaald'}
                    </td>
                  </tr>
                  <tr className="border-b border-gray-200">
                    <td className="font-sans text-base text-gray-700 px-6 py-4">Documenten</td>
                    <td className="font-sans text-base text-gray-700 px-6 py-4 text-right">
                      {dossier.kosten?.documentenKostenCents > 0 
                        ? formatPrice(dossier.kosten.documentenKostenCents)
                        : dossier.documenten.length > 0 ? 'Gratis' : 'Wordt nog bepaald'}
                    </td>
                  </tr>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <td className="font-sans text-base font-semibold text-gray-900 px-6 py-4">
                      Totaal
                    </td>
                    <td className="font-sans text-base font-semibold text-gray-900 px-6 py-4 text-right">
                      {formatPrice(dossier.kosten?.totaalKostenCents || 0)}
                    </td>
                  </tr>
                  <tr className="border-b border-gray-200">
                    <td className="font-sans text-base text-gray-700 px-6 py-4">Reeds betaald</td>
                    <td className="font-sans text-base text-gray-700 px-6 py-4 text-right">
                      € 0,00
                    </td>
                  </tr>
                  <tr className="bg-gray-50">
                    <td className="font-sans text-base font-semibold text-gray-900 px-6 py-4">
                      Te betalen
                    </td>
                    <td className="font-sans text-base font-semibold text-gray-900 px-6 py-4 text-right">
                      {formatPrice(dossier.kosten?.totaalKostenCents || 0)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="flex items-start gap-2 mt-4 bg-blue-50 p-4 rounded">
              <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <span className="font-sans text-sm text-gray-700">
                U kunt pas betalen wanneer u de ceremonie heeft gepland en heeft aangegeven welke
                documenten u wilt ontvangen.
              </span>
            </div>

            <button
              disabled
              className="mt-6 bg-gray-300 text-gray-500 font-sans text-base px-6 py-3 rounded cursor-not-allowed"
            >
              Nu betalen
            </button>
          </section>
        </div>
      </main>
    </div>
  );
}

