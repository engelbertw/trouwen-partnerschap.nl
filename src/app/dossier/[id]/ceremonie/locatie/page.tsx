'use client';

import type { JSX } from 'react';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { GemeenteLogoCompact } from '@/components/GemeenteLogo';

interface Location {
  id: string;
  code: string;
  naam: string;
  type: string;
  afbeeldingUrl?: string;
  capaciteit?: number;
  prijsCents: number;
  actief: boolean;
}

export default function LocatieSelectiePage(): JSX.Element {
  const params = useParams();
  const router = useRouter();
  const dossierId = params.id as string;
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);
  const [locations, setLocations] = useState<Location[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [datum, setDatum] = useState<string>('');
  const [tijd, setTijd] = useState<string>('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchLocations();
    fetchCeremonieDatumTijd();
    loadSavedLocation();
  }, []);

  const loadSavedLocation = async () => {
    try {
      const response = await fetch(`/api/dossier/${dossierId}/ceremonie/locatie`);
      const result = await response.json();
      if (result.success && result.data.locatieId) {
        setSelectedLocation(result.data.locatieId);
      }
    } catch (error) {
      console.error('Error loading saved location:', error);
    }
  };

  const fetchCeremonieDatumTijd = async () => {
    // Always fetch from database first (source of truth)
    try {
      const response = await fetch(`/api/dossier/${dossierId}/ceremonie/datum-tijd`);
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          setDatum(data.data.datum);
          const timeStr = data.data.startTijd.split(':').slice(0, 2).join(':');
          setTijd(timeStr);
          // Update sessionStorage with database data
          sessionStorage.setItem(
            `ceremonie-datum-tijd-${dossierId}`,
            JSON.stringify({
              datum: data.data.datum,
              startTijd: timeStr,
              duurMinuten: 60,
              timestamp: Date.now(),
            })
          );
          return; // Successfully loaded from database
        }
      }
    } catch (error) {
      console.error('Error fetching ceremony date/time:', error);
    }

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
  };

  const fetchLocations = async () => {
    try {
      const response = await fetch('/api/gemeente/lookup/locaties');
      const data = await response.json();
      
      if (data.success) {
        setLocations(data.data);
      }
    } catch (error) {
      console.error('Error fetching locations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleContinue = async () => {
    if (!selectedLocation) {
      alert('Selecteer eerst een locatie');
      return;
    }

    setSaving(true);
    try {
      const response = await fetch(`/api/dossier/${dossierId}/ceremonie/locatie`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ locatieId: selectedLocation }),
      });

      const result = await response.json();

      if (result.success) {
        router.push(`/dossier/${dossierId}/ceremonie/ambtenaar`);
      } else {
        alert(result.error || 'Er ging iets mis bij het opslaan');
        setSaving(false);
      }
    } catch (error) {
      console.error('Error saving location:', error);
      alert('Er ging iets mis bij het opslaan');
      setSaving(false);
    }
  };

  const filteredLocations = locations.filter((loc) =>
    loc.naam.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Locaties laden...</p>
        </div>
      </div>
    );
  }

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
            href={`/dossier/${dossierId}/ceremonie/keuze`}
            className="inline-flex items-center text-blue-600 hover:text-blue-700 font-sans text-sm mb-6"
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Vorige stap
          </Link>

          <div className="flex items-center justify-between mb-2">
            <h2 className="font-serif text-3xl font-bold text-gray-900">Locatie</h2>
            <div className="text-sm text-gray-600">
              {datum && tijd ? (
                <>
                  Beschikbaar op <strong>{datum.split('-').reverse().join('-')}</strong> om <strong>{tijd}</strong>
                  <button 
                    onClick={() => router.push(`/dossier/${dossierId}/ceremonie/datum`)}
                    className="ml-2 text-blue-600 hover:underline"
                    aria-label="Wijzig datum en tijd"
                  >
                    ✏️
                  </button>
                </>
              ) : (
                <Link href={`/dossier/${dossierId}/ceremonie/datum`} className="text-blue-600 underline">
                  Kies eerst een datum en tijd
                </Link>
              )}
            </div>
          </div>

          {/* Progress bar */}
          <div className="mb-8">
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div className="h-full bg-blue-600 rounded-full" style={{ width: '60%' }}></div>
            </div>
          </div>

          {/* Search and Filter */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block font-sans text-sm font-semibold text-gray-900 mb-2">
                Zoeken
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Zoek op naam locatie"
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

            <div>
              <label className="block font-sans text-sm font-semibold text-gray-900 mb-2">
                Soort locatie
              </label>
              <select className="w-full px-4 py-2 border-2 border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent">
                <option>Filter op soort locatie</option>
                <option>Boerderij, molen</option>
                <option>Historisch pand</option>
                <option>Moderne locatie</option>
              </select>
            </div>
          </div>

          <p className="text-sm text-gray-600 mb-4">
            {filteredLocations.length} locaties gevonden
            <button className="ml-4 text-blue-600 hover:underline inline-flex items-center gap-1">
              🗺️ Bekijk op kaart
            </button>
          </p>

          {/* Locations Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {filteredLocations.map((location) => (
              <button
                key={location.id}
                onClick={() => location.actief && setSelectedLocation(location.id)}
                disabled={!location.actief}
                className={`text-left border-2 rounded-lg overflow-hidden transition-all ${
                  selectedLocation === location.id
                    ? 'border-blue-600 bg-blue-50'
                    : location.actief
                    ? 'border-gray-300 hover:border-gray-400'
                    : 'border-gray-200 opacity-60 cursor-not-allowed'
                }`}
              >
                <div className="aspect-video bg-gray-200 flex items-center justify-center overflow-hidden">
                  {location.afbeeldingUrl ? (
                    <img
                      src={location.afbeeldingUrl}
                      alt={location.naam}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        // Fallback als afbeelding niet laadt
                        (e.target as HTMLImageElement).style.display = 'none';
                        const parent = (e.target as HTMLImageElement).parentElement;
                        if (parent) {
                          parent.innerHTML = '<span class="text-4xl text-gray-400">📷</span>';
                        }
                      }}
                    />
                  ) : (
                    <span className="text-4xl text-gray-400">📷</span>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="font-sans text-base font-semibold text-gray-900 mb-1">
                    {location.naam}
                  </h3>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">
                      {location.capaciteit ? `${location.capaciteit} personen` : ''}
                    </span>
                    <span className="text-sm font-semibold text-gray-900">
                      {location.prijsCents > 0
                        ? `€ ${(location.prijsCents / 100).toFixed(2).replace('.', ',')}`
                        : 'Gratis'}
                    </span>
                  </div>
                  {!location.actief && (
                    <span className="text-xs text-red-600 font-medium">Niet beschikbaar</span>
                  )}
                </div>
              </button>
            ))}
          </div>

          <div className="flex gap-4">
            <button
              onClick={handleContinue}
              disabled={!selectedLocation || saving}
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

