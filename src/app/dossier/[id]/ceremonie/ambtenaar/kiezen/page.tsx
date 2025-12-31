'use client';

import type { JSX } from 'react';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { GemeenteLogoCompact } from '@/components/GemeenteLogo';

interface Babs {
  id: string;
  volledigeNaam: string;
  talen: string[] | null;
}

export default function AmbtenaarKiezenPage(): JSX.Element {
  const params = useParams();
  const router = useRouter();
  const dossierId = params.id as string;
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAmbtenaar, setSelectedAmbtenaar] = useState<string | null>(null);
  const [previouslySelectedBabs, setPreviouslySelectedBabs] = useState<Babs | null>(null);
  const [babsList, setBabsList] = useState<Babs[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [datum, setDatum] = useState<string>('');
  const [tijd, setTijd] = useState<string>('');
  const [taal, setTaal] = useState<string>('');
  const [typeCeremonieId, setTypeCeremonieId] = useState<string | null>(null);
  const [requiredTalen, setRequiredTalen] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  // Load saved BABS selection on mount
  useEffect(() => {
    const loadSavedBabs = async () => {
      try {
        const response = await fetch(`/api/dossier/${dossierId}/ceremonie/babs`);
        const result = await response.json();
        console.log('📋 Loaded saved BABS:', result);
        if (result.success && result.data.babsId) {
          console.log('✅ Setting selectedAmbtenaar to:', result.data.babsId);
          setSelectedAmbtenaar(result.data.babsId);
          
          // Fetch BABS details to show name
          try {
            const babsResponse = await fetch(`/api/babs/${result.data.babsId}`);
            const babsResult = await babsResponse.json();
            if (babsResult.success && babsResult.data) {
              setPreviouslySelectedBabs({
                id: babsResult.data.id,
                volledigeNaam: babsResult.data.naam,
                talen: babsResult.data.talen || null,
              });
            }
          } catch (err) {
            console.error('Error loading BABS details:', err);
          }
        } else {
          console.log('ℹ️ No saved BABS selection found');
        }
      } catch (error) {
        console.error('Error loading saved BABS:', error);
      }
    };
    loadSavedBabs();
  }, [dossierId]);

  // Fetch ceremony date/time and taal from database (primary) and sessionStorage (cache)
  useEffect(() => {
    async function fetchCeremonieData() {
      // Always fetch from database first (source of truth)
      try {
        // Fetch date/time
        const dateTimeResponse = await fetch(`/api/dossier/${dossierId}/ceremonie/datum-tijd`);
        if (dateTimeResponse.ok) {
          const data = await dateTimeResponse.json();
          if (data.success && data.data) {
            setDatum(data.data.datum);
            const timeStr = data.data.startTijd.split(':').slice(0, 2).join(':');
            setTijd(timeStr);
            // Update sessionStorage with database data for faster future access
            sessionStorage.setItem(
              `ceremonie-datum-tijd-${dossierId}`,
              JSON.stringify({
                datum: data.data.datum,
                startTijd: timeStr,
                duurMinuten: 60,
                timestamp: Date.now(),
              })
            );
          }
        }

        // Fetch taal
        const taalResponse = await fetch(`/api/dossier/${dossierId}/ceremonie/taal`);
        if (taalResponse.ok) {
          const data = await taalResponse.json();
          if (data.success && data.data && data.data.taal) {
            setTaal(data.data.taal);
          }
        }

        // Fetch typeCeremonieId from dossier
        const typeResponse = await fetch(`/api/dossier/${dossierId}/ceremonie/type`);
        if (typeResponse.ok) {
          const typeData = await typeResponse.json();
          if (typeData.success && typeData.data && typeData.data.typeCeremonieId) {
            setTypeCeremonieId(typeData.data.typeCeremonieId);
            console.log('✅ Type ceremonie ID opgehaald:', typeData.data.typeCeremonieId);
          }
        }
      } catch (err) {
        console.error('Error fetching ceremony data from API:', err);
        
        // Fallback to sessionStorage if database doesn't have it yet
        const savedData = sessionStorage.getItem(`ceremonie-datum-tijd-${dossierId}`);
        if (savedData) {
          try {
            const data = JSON.parse(savedData);
            setDatum(data.datum || '');
            const timeStr = (data.startTijd || '').split(':').slice(0, 2).join(':');
            setTijd(timeStr);
          } catch (error) {
            console.error('Error parsing saved date/time:', error);
          }
        }
      }
    }

    fetchCeremonieData();
  }, [dossierId]);

  // Fetch available BABS when date/time is available
  useEffect(() => {
    if (!datum || !tijd) {
      setLoading(false);
      return;
    }

    async function fetchBeschikbareBabs() {
      setLoading(true);
      setError(null);
      
      try {
        const params = new URLSearchParams({
          datum,
          startTijd: tijd,
          duurMinuten: '60', // Default duration
        });

        // Add taal if available
        console.log('🔍 Fetching BABS with taal:', taal || 'NIET INGESTELD');
        if (taal) {
          params.append('taal', taal);
          console.log('✅ Taal parameter toegevoegd aan API call:', taal);
        } else {
          console.log('⚠️ GEEN taal parameter - alle BABS worden getoond!');
        }

        // Add typeCeremonieId if available (for language matching from type ceremonie)
        if (typeCeremonieId) {
          params.append('typeCeremonieId', typeCeremonieId);
          console.log('✅ Type ceremonie ID toegevoegd aan API call:', typeCeremonieId);
        }

        console.log('📞 API Call:', `/api/ceremonie/beschikbare-babs?${params.toString()}`);

        const response = await fetch(`/api/ceremonie/beschikbare-babs?${params}`);
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || 'Kon beschikbare BABS niet ophalen');
        }
        
        const data = await response.json();
        if (data.success) {
          console.log('📋 Beschikbare BABS response:', {
            count: data.count,
            babs: data.data,
            debug: data.debug,
            filterTaal: taal || 'niet opgegeven',
          });
          setBabsList(data.data || []);
        } else {
          setError(data.error || 'Kon beschikbare BABS niet ophalen');
        }
      } catch (err) {
        console.error('Error fetching available BABS:', err);
        setError('Er ging iets mis bij het ophalen van beschikbare ambtenaren');
      } finally {
        setLoading(false);
      }
    }

    fetchBeschikbareBabs();
  }, [datum, tijd, taal, typeCeremonieId]);

  // Determine required languages from taal or typeCeremonieId
  useEffect(() => {
    async function determineRequiredTalen() {
      let talenArray: string[] = [];
      
      // Priority 1: Direct taal from ceremonie
      if (taal) {
        talenArray = [taal];
        setRequiredTalen(talenArray);
        return;
      }
      
      // Priority 2: Talen from type ceremonie
      if (typeCeremonieId) {
        try {
          const typeResponse = await fetch(`/api/gemeente/lookup/type-ceremonie`);
          if (typeResponse.ok) {
            const typeData = await typeResponse.json();
            if (typeData.success && typeData.data) {
              const typeCeremonie = typeData.data.find((t: any) => t.id === typeCeremonieId);
              if (typeCeremonie && typeCeremonie.talen) {
                talenArray = Array.isArray(typeCeremonie.talen) ? typeCeremonie.talen : ['nl'];
                setRequiredTalen(talenArray);
              }
            }
          }
        } catch (err) {
          console.error('Error fetching type ceremonie languages:', err);
        }
      }
    }

    determineRequiredTalen();
  }, [taal, typeCeremonieId]);

  const handleContinue = async () => {
    if (!selectedAmbtenaar) {
      alert('Selecteer eerst een ambtenaar');
      return;
    }

    // Validate selected BABS against language requirements
    if (requiredTalen.length > 0) {
      const selectedBabs = babsList.find(b => b.id === selectedAmbtenaar);
      if (selectedBabs) {
        const babsTalen = Array.isArray(selectedBabs.talen) ? selectedBabs.talen : ['nl'];
        const hasMatchingLanguage = requiredTalen.some((taal: string) => babsTalen.includes(taal));
        
        if (!hasMatchingLanguage) {
          const taalNamen: Record<string, string> = {
            nl: 'Nederlands',
            en: 'Engels',
            de: 'Duits',
            fr: 'Frans',
            es: 'Spaans',
          };
          const requiredTalenNamen = requiredTalen.map(t => taalNamen[t] || t).join(', ');
          const babsTalenNamen = babsTalen.map(t => taalNamen[t] || t).join(', ');
          
          const confirmMessage = `⚠️ Let op: De geselecteerde ambtenaar spreekt ${babsTalenNamen}, maar voor dit ceremonie type is ${requiredTalenNamen} vereist.\n\nDeze ambtenaar is mogelijk niet beschikbaar voor uw ceremonie.\n\nWilt u toch doorgaan?`;
          
          if (!confirm(confirmMessage)) {
            return;
          }
        }
      }
    }

    setSaving(true);
    try {
      const response = await fetch(`/api/dossier/${dossierId}/ceremonie/babs`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ babsId: selectedAmbtenaar }),
      });

      const result = await response.json();

      if (result.success) {
        router.push(`/dossier/${dossierId}/ceremonie/wensen`);
      } else {
        alert(result.error || 'Er ging iets mis bij het opslaan');
        setSaving(false);
      }
    } catch (error) {
      console.error('Error saving BABS:', error);
      alert('Er ging iets mis bij het opslaan');
      setSaving(false);
    }
  };

  const handleSkip = async () => {
    setSaving(true);
    try {
      const response = await fetch(`/api/dossier/${dossierId}/ceremonie/babs`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ babsId: null }),
      });

      const result = await response.json();

      if (result.success) {
        router.push(`/dossier/${dossierId}/ceremonie/wensen`);
      } else {
        alert(result.error || 'Er ging iets mis bij het opslaan');
        setSaving(false);
      }
    } catch (error) {
      console.error('Error skipping BABS:', error);
      alert('Er ging iets mis bij het opslaan');
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
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
        <div className="max-w-7xl mx-auto px-6 py-3">
          <h1 className="font-sans text-lg font-normal">Ceremonie plannen</h1>
        </div>
      </div>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <Link
            href={`/dossier/${dossierId}/ceremonie/ambtenaar`}
            className="inline-flex items-center text-blue-600 hover:text-blue-700 font-sans text-sm mb-6"
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Vorige stap
          </Link>

          <div className="flex items-center justify-between mb-2">
            <h2 className="font-serif text-3xl font-bold text-gray-900">
              Ambtenaar kiezen <span className="text-gray-500 text-lg">(niet verplicht)</span>
            </h2>
            {datum && tijd && (
              <div className="text-sm text-gray-600">
                Beschikbaar op <strong>{datum.split('-').reverse().join('-')}</strong> om <strong>{tijd}</strong>
                <button 
                  onClick={() => router.push(`/dossier/${dossierId}/ceremonie/datum`)}
                  className="ml-2 text-blue-600 hover:underline"
                  aria-label="Wijzig datum en tijd"
                >
                  ✏️
                </button>
              </div>
            )}
            {!datum || !tijd ? (
              <div className="text-sm text-yellow-600">
                <Link href={`/dossier/${dossierId}/ceremonie/datum`} className="underline">
                  Kies eerst een datum en tijd
                </Link>
              </div>
            ) : null}
          </div>

          {/* Progress bar */}
          <div className="mb-8">
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div className="h-full bg-blue-600 rounded-full" style={{ width: '80%' }}></div>
            </div>
          </div>

          <p className="font-sans text-base text-gray-700 mb-6">
            Geef uw voorkeur voor een gemeentelijke ambtenaar op. Let op: dit is een voorkeur, er is geen
            garantie dat u deze ambtenaar krijgt. 
            {datum && tijd ? (
              <> Alleen ambtenaren die beschikbaar zijn op de gekozen datum en tijd worden getoond.</>
            ) : (
              <> Om beschikbare ambtenaren te zien, heeft u een datum en tijd nodig. U kunt deze later nog aanpassen.</>
            )}
            {' '}Hebt u geen voorkeur?{' '}
            <button
              onClick={handleSkip}
              disabled={saving}
              className="text-blue-600 underline disabled:text-gray-400"
            >
              Sla deze stap over
            </button>
          </p>

          {/* Previously selected BABS indicator */}
          {previouslySelectedBabs && (() => {
            // Check if BABS matches language requirements
            const babsTalen = Array.isArray(previouslySelectedBabs.talen) ? previouslySelectedBabs.talen : ['nl'];
            const hasMatchingLanguage = requiredTalen.length === 0 || requiredTalen.some((taal: string) => babsTalen.includes(taal));
            const taalNamen: Record<string, string> = {
              nl: 'Nederlands',
              en: 'Engels',
              de: 'Duits',
              fr: 'Frans',
              es: 'Spaans',
            };
            const requiredTalenNamen = requiredTalen.map(t => taalNamen[t] || t).join(', ');
            const babsTalenNamen = babsTalen.map(t => taalNamen[t] || t).join(', ');

            return (
              <div className={`border-l-4 p-4 mb-6 rounded-r ${
                hasMatchingLanguage 
                  ? 'bg-blue-50 border-blue-600' 
                  : 'bg-yellow-50 border-yellow-600'
              }`}>
                <div className="flex items-start gap-3">
                  {hasMatchingLanguage ? (
                    <svg
                      className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                  ) : (
                    <svg
                      className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                  <div className="flex-1">
                    <p className={`text-sm font-semibold mb-1 ${
                      hasMatchingLanguage ? 'text-blue-900' : 'text-yellow-900'
                    }`}>
                      U heeft eerder een voorkeur aangegeven
                    </p>
                    <p className={`text-sm ${
                      hasMatchingLanguage ? 'text-blue-800' : 'text-yellow-800'
                    }`}>
                      Gekozen ambtenaar: <strong>{previouslySelectedBabs.volledigeNaam}</strong>
                    </p>
                    {!hasMatchingLanguage && requiredTalen.length > 0 && (
                      <div className="mt-2 p-2 bg-yellow-100 rounded text-xs text-yellow-900">
                        <p className="font-semibold mb-1">⚠️ Let op: Taalvereiste niet voldaan</p>
                        <p>Deze ambtenaar spreekt: <strong>{babsTalenNamen}</strong></p>
                        <p>Voor dit ceremonie type is vereist: <strong>{requiredTalenNamen}</strong></p>
                        <p className="mt-1">Deze ambtenaar is mogelijk niet beschikbaar voor uw ceremonie. Selecteer een andere ambtenaar die de vereiste taal spreekt.</p>
                      </div>
                    )}
                    <p className={`text-xs mt-2 ${
                      hasMatchingLanguage ? 'text-blue-700' : 'text-yellow-700'
                    }`}>
                      U kunt hieronder een andere ambtenaar selecteren of uw huidige keuze behouden.
                    </p>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Search */}
          <div className="mb-6">
            <label className="block font-sans text-sm font-semibold text-gray-900 mb-2">Zoeken</label>
            <div className="relative max-w-2xl">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Zoek op naam trouwambtenaar"
                className="w-full px-4 py-2 pl-10 border-2 border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
              />
              <svg
                className="absolute left-3 top-3 w-5 h-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
          </div>

          {/* Loading state */}
          {loading && (
            <div className="text-center py-8 text-gray-500">
              Beschikbare ambtenaren worden opgehaald...
            </div>
          )}

          {/* Error state */}
          {error && (
            <div className="bg-red-50 border-l-4 border-red-600 p-4 mb-6">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {/* No date/time selected */}
          {!loading && !error && (!datum || !tijd) && (
            <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-6">
              <div className="flex items-start gap-3">
                <svg
                  className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                    clipRule="evenodd"
                  />
                </svg>
                <div className="flex-1">
                  <p className="text-sm font-medium text-blue-900 mb-1">
                    Datum en tijd nodig voor beschikbaarheidscontrole
                  </p>
                  <p className="text-sm text-blue-800 mb-2">
                    U heeft op de vorige pagina de mogelijkheid gehad om een datum en tijd te kiezen. 
                    Om beschikbare ambtenaren te zien, heeft u deze informatie nodig. U kunt deze stap overslaan 
                    of teruggaan om een datum en tijd te kiezen.
                  </p>
                  <div className="flex gap-3 mt-3">
                    <Link
                      href={`/dossier/${dossierId}/ceremonie/datum`}
                      className="inline-flex items-center text-sm font-medium text-blue-700 hover:text-blue-800 underline"
                    >
                      Ga terug naar datum en tijd kiezen
                    </Link>
                    <span className="text-blue-600">of</span>
                    <button
                      onClick={handleSkip}
                      disabled={saving}
                      className="text-sm font-medium text-blue-700 hover:text-blue-800 underline disabled:text-gray-400"
                    >
                      Sla deze stap over
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* No available BABS */}
          {!loading && !error && datum && tijd && babsList.length === 0 && (
            <div className="bg-gray-50 border-l-4 border-gray-400 p-4 mb-6">
              <p className="text-sm text-gray-800">
                Er zijn geen ambtenaren beschikbaar op {datum.split('-').reverse().join('-')} om {tijd}.
                Probeer een andere datum of tijd.
              </p>
            </div>
          )}

          {/* Ambtenaren Grid */}
          {!loading && !error && babsList.length > 0 && (
            <>
              <div className="mb-6">
                <label className="block font-sans text-sm font-semibold text-gray-900 mb-2">Zoeken</label>
                <div className="relative max-w-2xl">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Zoek op naam trouwambtenaar"
                    className="w-full px-4 py-2 pl-10 border-2 border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                  />
                  <svg
                    className="absolute left-3 top-3 w-5 h-5 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                {babsList
                  .filter((babs) => {
                    if (!searchQuery) return true;
                    const query = searchQuery.toLowerCase();
                    return babs.volledigeNaam.toLowerCase().includes(query);
                  })
                  .map((babs) => {
                    // Format languages
                    const taalNamen: Record<string, string> = {
                      nl: 'Nederlands',
                      en: 'Engels',
                      de: 'Duits',
                      fr: 'Frans',
                      es: 'Spaans',
                    };
                    const talen = Array.isArray(babs.talen) 
                      ? babs.talen.map(t => taalNamen[t] || t)
                      : ['Nederlands'];

                    // Debug log for each BABS
                    console.log('🔍 BABS in lijst:', {
                      naam: babs.volledigeNaam,
                      id: babs.id,
                      talen: babs.talen,
                      isSelected: selectedAmbtenaar === babs.id,
                      geselecteerdeTaal: taal,
                    });

                    const isPreviouslySelected = previouslySelectedBabs?.id === babs.id;
                    
                    return (
                      <button
                        key={babs.id}
                        onClick={() => setSelectedAmbtenaar(babs.id)}
                        className={`text-center border-2 rounded-lg overflow-hidden transition-all relative ${
                          selectedAmbtenaar === babs.id
                            ? 'border-blue-600 bg-blue-50'
                            : 'border-gray-300 hover:border-gray-400'
                        }`}
                      >
                        {isPreviouslySelected && (
                          <div className="absolute top-2 right-2 bg-blue-600 text-white text-xs font-semibold px-2 py-1 rounded z-10">
                            Eerder gekozen
                          </div>
                        )}
                        <div className="aspect-square bg-gray-200 flex items-center justify-center text-gray-400 text-4xl">
                          👤
                        </div>
                        <div className="p-4">
                          <h3 className="font-sans text-base font-semibold text-gray-900 mb-2">
                            {babs.volledigeNaam}
                          </h3>
                          <div className="flex flex-wrap gap-1 justify-center">
                            {talen.map((lang) => (
                              <span
                                key={lang}
                                className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded"
                              >
                                {lang}
                              </span>
                            ))}
                          </div>
                        </div>
                      </button>
                    );
                  })}
              </div>
            </>
          )}

          <div className="flex gap-4">
            <button
              onClick={handleContinue}
              disabled={saving}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-sans text-base px-6 py-3 rounded focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 transition-colors inline-flex items-center gap-2"
            >
              {saving ? 'Opslaan...' : 'Volgende stap'}
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

