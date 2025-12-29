'use client';

import type { JSX } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { GemeenteLogoCompact } from '@/components/GemeenteLogo';

interface CeremonieData {
  id: string | null;
  datum: string | null;
  startTijd: string | null;
  eindTijd: string | null;
  typeCeremonieId: string | null;
  locatieId: string | null;
  babsId: string | null;
  taal: string | null;
  eigenBabs: boolean | null;
  locatieNaam: string | null;
  locatieAdres: string | null;
  babsNaam: string | null;
  babsVoornaam: string | null;
  babsTussenvoegsel: string | null;
  babsAchternaam: string | null;
  typeCeremonieCode: string | null;
  typeCeremonieNaam: string | null;
  typeCeremonieDuur: number | null;
  typeCeremonieOmschrijving: string | null;
  typeCeremonieTalen: string[] | null;
  typeCeremonieEigenBabs: boolean | null;
}

interface SelectedWish {
  id: string;
  naam: string;
  prijsEuro: string;
  gratis: boolean;
}

interface SamenvattingClientProps {
  dossierId: string;
  ceremonieData: CeremonieData | null;
  selectedWishes: SelectedWish[];
}

export function SamenvattingClient({ 
  dossierId, 
  ceremonieData, 
  selectedWishes 
}: SamenvattingClientProps): JSX.Element {
  const router = useRouter();

  const handleSubmit = () => {
    alert('Ceremonie planning opgeslagen!');
    router.push(`/dossier/${dossierId}`);
  };

  const formatDate = (dateStr: string | null): string => {
    if (!dateStr) return 'Nog niet gekozen';
    const date = new Date(dateStr);
    return date.toLocaleDateString('nl-NL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const formatTime = (timeStr: string | null): string => {
    if (!timeStr) return 'Nog niet gekozen';
    return timeStr.substring(0, 5) + ' uur';
  };

  const getBabsFullName = (): string => {
    if (!ceremonieData?.babsVoornaam && !ceremonieData?.babsAchternaam) {
      return 'Nog niet gekozen';
    }
    const parts = [
      ceremonieData?.babsVoornaam,
      ceremonieData?.babsTussenvoegsel,
      ceremonieData?.babsAchternaam,
    ].filter(Boolean);
    return parts.join(' ');
  };

  const getTaalDisplay = (taalCode: string | null): string => {
    if (!taalCode) return 'Nog niet gekozen';
    const taalNamen: Record<string, string> = {
      nl: 'Nederlands',
      en: 'Engels',
      de: 'Duits',
      fr: 'Frans',
    };
    return taalNamen[taalCode] || taalCode;
  };

  const formatDuur = (minuten: number | null): string => {
    if (!minuten) return '';
    if (minuten < 60) return `${minuten} minuten`;
    const uren = Math.floor(minuten / 60);
    const restMinuten = minuten % 60;
    if (restMinuten === 0) return `${uren} uur`;
    return `${uren} uur en ${restMinuten} minuten`;
  };

  const formatTalen = (talen: string[] | null): string => {
    if (!talen || talen.length === 0) return '';
    const taalNamen: Record<string, string> = {
      nl: 'Nederlands',
      en: 'Engels',
      de: 'Duits',
      fr: 'Frans',
      es: 'Spaans',
    };
    const formatted = talen.map(t => taalNamen[t] || t);
    if (formatted.length === 1) return formatted[0];
    if (formatted.length === 2) return formatted.join(' en ');
    return formatted.slice(0, -1).join(', ') + ' en ' + formatted[formatted.length - 1];
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <GemeenteLogoCompact />
          </div>
          <button
            onClick={() => router.push(`/dossier/${dossierId}`)}
            className="text-gray-600 hover:text-gray-900"
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
          <h1 className="font-sans text-lg font-normal">Ceremonie plannen</h1>
        </div>
      </div>

      {/* Main content */}
      <main className="max-w-3xl mx-auto px-6 py-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <Link
            href={`/dossier/${dossierId}/ceremonie/wensen`}
            className="inline-flex items-center text-blue-600 hover:text-blue-700 font-sans text-sm mb-6"
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Vorige stap
          </Link>

          <h2 className="font-serif text-3xl font-bold text-gray-900 mb-2">Samenvatting</h2>

          {/* Progress bar */}
          <div className="mb-8">
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div className="h-full bg-blue-600 rounded-full" style={{ width: '100%' }}></div>
            </div>
          </div>

          <p className="font-sans text-base text-gray-700 mb-6">
            Controleer uw gegevens en kijk of alles klopt.<br />
            Als er iets niet klopt, kunt u dit nu nog aanpassen voordat u de aanvraag verstuurt.
          </p>

          {/* Summary sections */}
          <div className="space-y-6 mb-8">
            {/* Soort ceremonie */}
            <div className="border-2 border-gray-300 rounded-lg p-6">
              <div className="flex items-start justify-between mb-4">
                <h3 className="font-sans text-lg font-semibold text-gray-900">Soort ceremonie</h3>
                <button
                  onClick={() => router.push(`/dossier/${dossierId}/ceremonie/soort`)}
                  className="text-blue-600 hover:text-blue-700 font-sans text-sm inline-flex items-center gap-1"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                  Wijzigen
                </button>
              </div>
              <dl className="space-y-3">
                <div>
                  <dt className="font-sans text-sm text-gray-600">Type ceremonie</dt>
                  <dd className="font-sans text-base font-semibold text-gray-900">
                    {ceremonieData?.typeCeremonieNaam || 'Nog niet gekozen'}
                    {ceremonieData?.typeCeremonieDuur && (
                      <span className="font-normal text-gray-700"> - {formatDuur(ceremonieData.typeCeremonieDuur)}</span>
                    )}
                  </dd>
                </div>
                {ceremonieData?.typeCeremonieOmschrijving && (
                  <div>
                    <dt className="font-sans text-sm text-gray-600">Beschrijving</dt>
                    <dd className="font-sans text-sm text-gray-700">
                      {ceremonieData.typeCeremonieOmschrijving}
                    </dd>
                  </div>
                )}
                {ceremonieData?.typeCeremonieTalen && ceremonieData.typeCeremonieTalen.length > 0 && (
                  <div>
                    <dt className="font-sans text-sm text-gray-600">Beschikbare talen</dt>
                    <dd className="font-sans text-sm text-gray-700">
                      {formatTalen(ceremonieData.typeCeremonieTalen)}
                    </dd>
                  </div>
                )}
                {ceremonieData?.typeCeremonieEigenBabs !== null && (
                  <div>
                    <dt className="font-sans text-sm text-gray-600">Eigen BABS mogelijk</dt>
                    <dd className="font-sans text-sm text-gray-700">
                      {ceremonieData.typeCeremonieEigenBabs ? 'Ja' : 'Nee'}
                    </dd>
                  </div>
                )}
              </dl>
            </div>

            {/* Datum en tijd */}
            <div className="border-2 border-gray-300 rounded-lg p-6">
              <div className="flex items-start justify-between mb-4">
                <h3 className="font-sans text-lg font-semibold text-gray-900">Datum en tijd</h3>
                <button
                  onClick={() => router.push(`/dossier/${dossierId}/ceremonie/datum`)}
                  className="text-blue-600 hover:text-blue-700 font-sans text-sm inline-flex items-center gap-1"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                  Wijzigen
                </button>
              </div>
              <dl className="space-y-2">
                <div>
                  <dt className="font-sans text-sm text-gray-600">Op welke datum moet de ceremonie plaatsvinden?</dt>
                  <dd className="font-sans text-base text-gray-900">{formatDate(ceremonieData?.datum || null)}</dd>
                </div>
                <div>
                  <dt className="font-sans text-sm text-gray-600">Op welk tijdstip moet de ceremonie plaatsvinden?</dt>
                  <dd className="font-sans text-base text-gray-900">{formatTime(ceremonieData?.startTijd || null)}</dd>
                </div>
              </dl>
            </div>

            {/* Locatie */}
            <div className="border-2 border-gray-300 rounded-lg p-6">
              <div className="flex items-start justify-between mb-4">
                <h3 className="font-sans text-lg font-semibold text-gray-900">Locatie</h3>
                <button
                  onClick={() => router.push(`/dossier/${dossierId}/ceremonie/locatie`)}
                  className="text-blue-600 hover:text-blue-700 font-sans text-sm inline-flex items-center gap-1"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                  Wijzigen
                </button>
              </div>
              <dl className="space-y-2">
                <div>
                  <dt className="font-sans text-sm text-gray-600">Gekozen locatie</dt>
                  <dd className="font-sans text-base text-gray-900">
                    {ceremonieData?.locatieNaam || 'Nog niet gekozen'}
                  </dd>
                  {ceremonieData?.locatieAdres && (
                    <dd className="font-sans text-sm text-gray-600 mt-1">
                      {ceremonieData.locatieAdres}
                    </dd>
                  )}
                </div>
              </dl>
            </div>

            {/* Ambtenaar */}
            <div className="border-2 border-gray-300 rounded-lg p-6">
              <div className="flex items-start justify-between mb-4">
                <h3 className="font-sans text-lg font-semibold text-gray-900">Ambtenaar</h3>
                <button
                  onClick={() => router.push(`/dossier/${dossierId}/ceremonie/ambtenaar`)}
                  className="text-blue-600 hover:text-blue-700 font-sans text-sm inline-flex items-center gap-1"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                  Wijzigen
                </button>
              </div>
              <dl className="space-y-2">
                <div>
                  <dt className="font-sans text-sm text-gray-600">Wilt u gebruik maken van een gemeentelijke of eigen ambtenaar?</dt>
                  <dd className="font-sans text-base text-gray-900">
                    {ceremonieData?.eigenBabs === true 
                      ? 'Eigen ambtenaar' 
                      : ceremonieData?.eigenBabs === false 
                        ? 'Gemeentelijke ambtenaar' 
                        : 'Nog niet gekozen'}
                  </dd>
                </div>
                <div>
                  <dt className="font-sans text-sm text-gray-600">In welke taal wilt u de ceremonie laten plaatsvinden?</dt>
                  <dd className="font-sans text-base text-gray-900">{getTaalDisplay(ceremonieData?.taal || null)}</dd>
                </div>
                <div>
                  <dt className="font-sans text-sm text-gray-600">Gekozen ambtenaar</dt>
                  <dd className="font-sans text-base text-gray-900">{getBabsFullName()}</dd>
                </div>
              </dl>
            </div>

            {/* Ceremoniewensen */}
            <div className="border-2 border-gray-300 rounded-lg p-6">
              <div className="flex items-start justify-between mb-4">
                <h3 className="font-sans text-lg font-semibold text-gray-900">Ceremoniewensen</h3>
                <button
                  onClick={() => router.push(`/dossier/${dossierId}/ceremonie/wensen`)}
                  className="text-blue-600 hover:text-blue-700 font-sans text-sm inline-flex items-center gap-1"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                  Wijzigen
                </button>
              </div>
              <dl className="space-y-2">
                <div>
                  <dt className="font-sans text-sm text-gray-600">Wat zijn uw ceremoniewensen?</dt>
                  <dd className="font-sans text-base text-gray-900">
                    {selectedWishes.length > 0 ? (
                      <ul className="list-disc list-inside">
                        {selectedWishes.map((wish) => (
                          <li key={wish.id}>{wish.naam}</li>
                        ))}
                      </ul>
                    ) : (
                      'Nog geen wensen geselecteerd'
                    )}
                  </dd>
                </div>
              </dl>
            </div>
          </div>

          <div className="flex gap-4">
            <button
              onClick={handleSubmit}
              className="bg-blue-600 hover:bg-blue-700 text-white font-sans text-base px-6 py-3 rounded focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 transition-colors"
            >
              Opslaan en sluiten
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

