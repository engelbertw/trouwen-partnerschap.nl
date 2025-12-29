'use client';

import type { JSX } from 'react';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { GemeenteLogoCompact } from '@/components/GemeenteLogo';

export default function AmbtenaarTypePage(): JSX.Element {
  const params = useParams();
  const router = useRouter();
  const dossierId = params.id as string;
  const [ambtenaarType, setAmbtenaarType] = useState<string | null>(null);
  const [isOwnCertified, setIsOwnCertified] = useState<boolean | null>(null);
  const [showWarning, setShowWarning] = useState(false);
  const [taal, setTaal] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Load saved type and taal on mount
  useEffect(() => {
    const loadSavedData = async () => {
      try {
        // Load ambtenaar type
        const typeResponse = await fetch(`/api/dossier/${dossierId}/ceremonie/ambtenaar-type`);
        const typeResult = await typeResponse.json();
        console.log('📋 Loaded ambtenaar type:', typeResult);
        if (typeResult.success && typeResult.data.eigenBabs !== null) {
          const type = typeResult.data.eigenBabs ? 'eigen' : 'gemeentelijk';
          console.log('✅ Setting ambtenaarType to:', type);
          setAmbtenaarType(type);
          if (typeResult.data.eigenBabs) {
            setIsOwnCertified(true); // If it was saved, they must have been certified
          }
        } else {
          console.log('ℹ️ No saved ambtenaar type found (eigenBabs is null)');
        }

        // Load taal
        const taalResponse = await fetch(`/api/dossier/${dossierId}/ceremonie/taal`);
        const taalResult = await taalResponse.json();
        console.log('📋 Loaded taal:', taalResult);
        if (taalResult.success && taalResult.data.taal) {
          console.log('✅ Setting taal to:', taalResult.data.taal);
          setTaal(taalResult.data.taal);
        } else {
          console.log('ℹ️ No saved taal found');
        }
      } catch (error) {
        console.error('Error loading saved data:', error);
      }
    };
    loadSavedData();
  }, [dossierId]);

  const handleTypeChange = (type: string) => {
    setAmbtenaarType(type);
    setIsOwnCertified(null);
    setShowWarning(false);
  };

  const handleCertifiedChange = (certified: boolean) => {
    setIsOwnCertified(certified);
    if (!certified) {
      setShowWarning(true);
    } else {
      setShowWarning(false);
    }
  };

  const handleContinue = async () => {
    if (!ambtenaarType) {
      alert('Selecteer eerst een type ambtenaar');
      return;
    }
    if (ambtenaarType === 'eigen' && isOwnCertified === null) {
      alert('Geef aan of uw eigen ambtenaar al beëdigd is');
      return;
    }
    if (ambtenaarType === 'eigen' && !isOwnCertified) {
      // Cannot continue if not certified
      return;
    }
    if (!taal) {
      alert('Selecteer eerst een taal voor de ceremonie');
      return;
    }

    setLoading(true);
    try {
      // Save ambtenaar type
      const eigenBabs = ambtenaarType === 'eigen';
      const typeResponse = await fetch(`/api/dossier/${dossierId}/ceremonie/ambtenaar-type`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eigenBabs }),
      });

      const typeResult = await typeResponse.json();

      if (!typeResult.success) {
        alert(typeResult.error || 'Er ging iets mis bij het opslaan van het ambtenaar type');
        setLoading(false);
        return;
      }

      // Save taal
      const taalResponse = await fetch(`/api/dossier/${dossierId}/ceremonie/taal`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taal }),
      });

      const taalResult = await taalResponse.json();

      if (taalResult.success) {
        router.push(`/dossier/${dossierId}/ceremonie/ambtenaar/kiezen`);
      } else {
        alert(taalResult.error || 'Er ging iets mis bij het opslaan van de taal');
        setLoading(false);
      }
    } catch (error) {
      console.error('Error saving data:', error);
      alert('Er ging iets mis bij het opslaan');
      setLoading(false);
    }
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
            href={`/dossier/${dossierId}/ceremonie/keuze`}
            className="inline-flex items-center text-blue-600 hover:text-blue-700 font-sans text-sm mb-6"
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Vorige stap
          </Link>

          <h2 className="font-serif text-3xl font-bold text-gray-900 mb-2">Ambtenaar</h2>

          {/* Progress bar */}
          <div className="mb-8">
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div className="h-full bg-blue-600 rounded-full" style={{ width: '70%' }}></div>
            </div>
          </div>

          <p className="font-sans text-base font-semibold text-gray-900 mb-4">
            Wilt u gebruik maken van een gemeentelijke of eigen ambtenaar?
          </p>

          <div className="space-y-4 mb-6">
            <button
              onClick={() => handleTypeChange('gemeentelijk')}
              className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                ambtenaarType === 'gemeentelijk'
                  ? 'border-blue-600 bg-blue-50'
                  : 'border-gray-300 bg-white hover:border-gray-400'
              }`}
            >
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 mt-1">
                  <div
                    className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                      ambtenaarType === 'gemeentelijk'
                        ? 'border-blue-600 bg-blue-600'
                        : 'border-gray-400'
                    }`}
                  >
                    {ambtenaarType === 'gemeentelijk' && (
                      <div className="w-3 h-3 bg-white rounded-full"></div>
                    )}
                  </div>
                </div>
                <div className="flex-1">
                  <p className="font-sans text-base text-gray-900">Gemeentelijke ambtenaar</p>
                </div>
              </div>
            </button>

            <button
              onClick={() => handleTypeChange('eigen')}
              className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                ambtenaarType === 'eigen'
                  ? 'border-blue-600 bg-blue-50'
                  : 'border-gray-300 bg-white hover:border-gray-400'
              }`}
            >
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 mt-1">
                  <div
                    className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                      ambtenaarType === 'eigen'
                        ? 'border-blue-600 bg-blue-600'
                        : 'border-gray-400'
                    }`}
                  >
                    {ambtenaarType === 'eigen' && (
                      <div className="w-3 h-3 bg-white rounded-full"></div>
                    )}
                  </div>
                </div>
                <div className="flex-1">
                  <p className="font-sans text-base text-gray-900">Eigen ambtenaar (BABS)</p>
                </div>
              </div>
            </button>
          </div>

          {/* Conditional question for BABS */}
          {ambtenaarType === 'eigen' && (
            <div className="mb-6">
              <p className="font-sans text-base font-semibold text-gray-900 mb-4">
                Is uw eigen ambtenaar (BABS) al beëdigd?
              </p>

              <div className="space-y-3">
                <button
                  onClick={() => handleCertifiedChange(true)}
                  className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                    isOwnCertified === true
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-300 bg-white hover:border-gray-400'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 mt-1">
                      <div
                        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                          isOwnCertified === true
                            ? 'border-blue-600 bg-blue-600'
                            : 'border-gray-400'
                        }`}
                      >
                        {isOwnCertified === true && (
                          <div className="w-3 h-3 bg-white rounded-full"></div>
                        )}
                      </div>
                    </div>
                    <div className="flex-1">
                      <p className="font-sans text-base text-gray-900">Ja</p>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => handleCertifiedChange(false)}
                  className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                    isOwnCertified === false
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-300 bg-white hover:border-gray-400'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 mt-1">
                      <div
                        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                          isOwnCertified === false
                            ? 'border-blue-600 bg-blue-600'
                            : 'border-gray-400'
                        }`}
                      >
                        {isOwnCertified === false && (
                          <div className="w-3 h-3 bg-white rounded-full"></div>
                        )}
                      </div>
                    </div>
                    <div className="flex-1">
                      <p className="font-sans text-base text-gray-900">Nee</p>
                    </div>
                  </div>
                </button>
              </div>

              {/* Warning when not certified */}
              {showWarning && (
                <div className="mt-6 bg-yellow-50 border-l-4 border-yellow-400 p-4">
                  <div className="flex items-start gap-3">
                    <svg
                      className="w-6 h-6 text-yellow-600 flex-shrink-0"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <div>
                      <h4 className="font-sans text-sm font-semibold text-gray-900 mb-1">
                        Ceremonie kan nog niet worden gepland
                      </h4>
                      <p className="font-sans text-sm text-gray-700">
                        Uw eigen ambtenaar (BABS) is nog niet beëdigd. Omdat dit proces minimaal 4 maanden
                        duurt, kunt u op dit moment nog geen ceremonie plannen. U kunt een beëdiging
                        aanvragen via de{' '}
                        <a href="#" className="text-blue-600 underline">
                          website van de gemeente
                        </a>
                        .
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Taal selectie */}
          <div className="mb-6">
            <p className="font-sans text-base font-semibold text-gray-900 mb-4">
              In welke taal wilt u de ceremonie laten plaatsvinden?
            </p>

            <div className="space-y-3">
              <button
                onClick={() => setTaal('nl')}
                className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                  taal === 'nl'
                    ? 'border-blue-600 bg-blue-50'
                    : 'border-gray-300 bg-white hover:border-gray-400'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 mt-1">
                    <div
                      className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                        taal === 'nl' ? 'border-blue-600 bg-blue-600' : 'border-gray-400'
                      }`}
                    >
                      {taal === 'nl' && <div className="w-3 h-3 bg-white rounded-full"></div>}
                    </div>
                  </div>
                  <div className="flex-1">
                    <p className="font-sans text-base text-gray-900">Nederlands</p>
                  </div>
                </div>
              </button>

              <button
                onClick={() => setTaal('en')}
                className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                  taal === 'en'
                    ? 'border-blue-600 bg-blue-50'
                    : 'border-gray-300 bg-white hover:border-gray-400'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 mt-1">
                    <div
                      className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                        taal === 'en' ? 'border-blue-600 bg-blue-600' : 'border-gray-400'
                      }`}
                    >
                      {taal === 'en' && <div className="w-3 h-3 bg-white rounded-full"></div>}
                    </div>
                  </div>
                  <div className="flex-1">
                    <p className="font-sans text-base text-gray-900">Engels</p>
                  </div>
                </div>
              </button>

              <button
                onClick={() => setTaal('de')}
                className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                  taal === 'de'
                    ? 'border-blue-600 bg-blue-50'
                    : 'border-gray-300 bg-white hover:border-gray-400'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 mt-1">
                    <div
                      className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                        taal === 'de' ? 'border-blue-600 bg-blue-600' : 'border-gray-400'
                      }`}
                    >
                      {taal === 'de' && <div className="w-3 h-3 bg-white rounded-full"></div>}
                    </div>
                  </div>
                  <div className="flex-1">
                    <p className="font-sans text-base text-gray-900">Duits</p>
                  </div>
                </div>
              </button>

              <button
                onClick={() => setTaal('fr')}
                className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                  taal === 'fr'
                    ? 'border-blue-600 bg-blue-50'
                    : 'border-gray-300 bg-white hover:border-gray-400'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 mt-1">
                    <div
                      className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                        taal === 'fr' ? 'border-blue-600 bg-blue-600' : 'border-gray-400'
                      }`}
                    >
                      {taal === 'fr' && <div className="w-3 h-3 bg-white rounded-full"></div>}
                    </div>
                  </div>
                  <div className="flex-1">
                    <p className="font-sans text-base text-gray-900">Frans</p>
                  </div>
                </div>
              </button>
            </div>
          </div>

          <div className="flex gap-4">
            <button
              onClick={handleContinue}
              disabled={!ambtenaarType || (ambtenaarType === 'eigen' && !isOwnCertified) || !taal || loading}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-sans text-base px-6 py-3 rounded focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 transition-colors inline-flex items-center gap-2"
            >
              {loading ? 'Opslaan...' : 'Volgende stap'}
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          <Link
            href={`/dossier/${dossierId}`}
            className="inline-block mt-4 text-blue-600 hover:underline font-sans text-sm"
          >
            Opslaan en later verder
          </Link>
        </div>
      </main>
    </div>
  );
}

