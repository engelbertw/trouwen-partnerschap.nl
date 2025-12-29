'use client';

import type { JSX } from 'react';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { GemeenteLogoCompact } from '@/components/GemeenteLogo';

type NaamgebruikKeuze = 'eigen' | 'partner' | 'eigen_partner' | 'partner_eigen';

interface PartnerData {
  voornamen: string;
  voorvoegsel?: string;
  geslachtsnaam: string;
  naamgebruikKeuze?: NaamgebruikKeuze;
}

export default function Partner2NaamgebruikPage(): JSX.Element {
  const params = useParams();
  const router = useRouter();
  const dossierId = params.id as string;
  const [partner1, setPartner1] = useState<PartnerData | null>(null);
  const [partner2, setPartner2] = useState<PartnerData | null>(null);
  const [selectedKeuze, setSelectedKeuze] = useState<NaamgebruikKeuze | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPartners = async () => {
      try {
        const response = await fetch(`/api/dossier/${dossierId}/naamgebruik`);
        const result = await response.json();

        if (result.success) {
          setPartner1(result.partner1);
          setPartner2(result.partner2);
          setSelectedKeuze(result.partner2?.naamgebruikKeuze || null);
        } else {
          setError(result.error || 'Kon gegevens niet ophalen');
        }
      } catch (err) {
        console.error('Error fetching partners:', err);
        setError('Er ging iets mis bij het ophalen van de gegevens');
      } finally {
        setIsLoading(false);
      }
    };

    if (dossierId) {
      fetchPartners();
    }
  }, [dossierId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedKeuze) {
      setError('Selecteer een naamgebruik optie');
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const response = await fetch(`/api/dossier/${dossierId}/naamgebruik`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          partnerId: 2,
          naamgebruikKeuze: selectedKeuze,
        }),
      });

      const result = await response.json();

      if (result.success) {
        router.push(`/dossier/${dossierId}`);
      } else {
        setError(result.error || 'Er ging iets mis bij het opslaan');
      }
    } catch (err) {
      console.error('Error saving naamgebruik:', err);
      setError('Er ging iets mis bij het opslaan');
    } finally {
      setIsSaving(false);
    }
  };

  const getFullName = (partner: PartnerData) => {
    return `${partner.voornamen} ${partner.voorvoegsel || ''} ${partner.geslachtsnaam}`.trim();
  };

  const getDisplayName = (keuze: NaamgebruikKeuze): string => {
    if (!partner1 || !partner2) return '';

    const eigen = partner2.voorvoegsel 
      ? `${partner2.voorvoegsel} ${partner2.geslachtsnaam}` 
      : partner2.geslachtsnaam;
    const partnerNaam = partner1.voorvoegsel 
      ? `${partner1.voorvoegsel} ${partner1.geslachtsnaam}` 
      : partner1.geslachtsnaam;

    switch (keuze) {
      case 'eigen':
        return `Alleen uw eigen achternaam`;
      case 'partner':
        return `Alleen de achternaam van uw partner`;
      case 'eigen_partner':
        return `Uw eigen achternaam, gevolgd door de achternaam van uw partner`;
      case 'partner_eigen':
        return `De achternaam van uw partner, gevolgd door uw eigen naam`;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Laden...</p>
        </div>
      </div>
    );
  }

  if (!partner1 || !partner2) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">Partnergegevens niet gevonden</p>
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

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <GemeenteLogoCompact />
          <Link
            href={`/dossier/${dossierId}`}
            className="text-gray-600 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 rounded p-2"
          >
            Terug naar dossier
          </Link>
        </div>
      </header>

      {/* Blue bar */}
      <div className="bg-blue-700 text-white">
        <div className="max-w-4xl mx-auto px-6 py-3">
          <h1 className="font-sans text-lg font-normal">Naamgebruik kiezen</h1>
        </div>
      </div>

      {/* Main content */}
      <main className="max-w-4xl mx-auto px-6 py-8">
        <div className="mb-4">
          <Link
            href={`/dossier/${dossierId}/naamgebruik/partner1`}
            className="text-blue-600 hover:text-blue-800 text-sm flex items-center"
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Vorige stap
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <h2 className="font-serif text-2xl font-bold text-gray-900 mb-2">
            Naamgebruik {getFullName(partner2)}
          </h2>

          {/* Progress bar */}
          <div className="w-full bg-gray-200 rounded-full h-2 mb-8">
            <div className="bg-blue-600 h-2 rounded-full" style={{ width: '100%' }}></div>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="mb-6">
              <h3 className="font-sans text-lg font-semibold text-gray-900 mb-4">
                Welke achternamen wilt u gebruiken?
              </h3>

              <div className="space-y-3">
                <label className="flex items-start p-4 border-2 border-gray-300 rounded hover:border-blue-600 cursor-pointer transition-colors">
                  <input
                    type="radio"
                    name="naamgebruik"
                    value="eigen"
                    checked={selectedKeuze === 'eigen'}
                    onChange={(e) => setSelectedKeuze(e.target.value as NaamgebruikKeuze)}
                    className="mt-1 mr-3 text-blue-600 focus:ring-blue-600"
                  />
                  <span className="flex-1 text-gray-900">
                    {getDisplayName('eigen')}
                  </span>
                </label>

                <label className="flex items-start p-4 border-2 border-gray-300 rounded hover:border-blue-600 cursor-pointer transition-colors">
                  <input
                    type="radio"
                    name="naamgebruik"
                    value="partner"
                    checked={selectedKeuze === 'partner'}
                    onChange={(e) => setSelectedKeuze(e.target.value as NaamgebruikKeuze)}
                    className="mt-1 mr-3 text-blue-600 focus:ring-blue-600"
                  />
                  <span className="flex-1 text-gray-900">
                    {getDisplayName('partner')}
                  </span>
                </label>

                <label className="flex items-start p-4 border-2 border-gray-300 rounded hover:border-blue-600 cursor-pointer transition-colors">
                  <input
                    type="radio"
                    name="naamgebruik"
                    value="eigen_partner"
                    checked={selectedKeuze === 'eigen_partner'}
                    onChange={(e) => setSelectedKeuze(e.target.value as NaamgebruikKeuze)}
                    className="mt-1 mr-3 text-blue-600 focus:ring-blue-600"
                  />
                  <span className="flex-1 text-gray-900">
                    {getDisplayName('eigen_partner')}
                  </span>
                </label>

                <label className="flex items-start p-4 border-2 border-gray-300 rounded hover:border-blue-600 cursor-pointer transition-colors">
                  <input
                    type="radio"
                    name="naamgebruik"
                    value="partner_eigen"
                    checked={selectedKeuze === 'partner_eigen'}
                    onChange={(e) => setSelectedKeuze(e.target.value as NaamgebruikKeuze)}
                    className="mt-1 mr-3 text-blue-600 focus:ring-blue-600"
                  />
                  <span className="flex-1 text-gray-900">
                    {getDisplayName('partner_eigen')}
                  </span>
                </label>
              </div>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-600 rounded">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-red-800">{error}</p>
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-between items-center pt-6 border-t border-gray-200">
              <Link
                href={`/dossier/${dossierId}/naamgebruik/partner1`}
                className="text-blue-600 hover:text-blue-800 font-sans text-sm"
              >
                ← Vorige stap
              </Link>
              <button
                type="submit"
                disabled={!selectedKeuze || isSaving}
                className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-sans text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? 'Opslaan...' : 'Opslaan en sluiten'}
              </button>
            </div>

            <div className="mt-4 text-center">
              <Link
                href={`/dossier/${dossierId}`}
                className="text-blue-600 hover:text-blue-800 text-sm"
              >
                Opslaan en later verder
              </Link>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}

