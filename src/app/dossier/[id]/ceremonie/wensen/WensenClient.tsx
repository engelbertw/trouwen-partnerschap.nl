'use client';

import type { JSX } from 'react';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { GemeenteLogoCompact } from '@/components/GemeenteLogo';

interface CeremonieWens {
  id: string;
  code: string;
  naam: string;
  omschrijving: string;
  prijsEuro: string;
  gratis: boolean;
  actief: boolean;
}

interface WensenClientProps {
  wensen: CeremonieWens[];
  dossierId: string;
}

export function WensenClient({ wensen, dossierId }: WensenClientProps): JSX.Element {
  const router = useRouter();
  const [selectedWishes, setSelectedWishes] = useState<string[]>([]);
  const [customWishes, setCustomWishes] = useState('');
  const [loading, setLoading] = useState(false);

  // Load saved wishes on mount
  useEffect(() => {
    async function loadSavedWishes() {
      try {
        const response = await fetch(`/api/dossier/${dossierId}/ceremonie/wensen`);
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data) {
            setSelectedWishes(data.data.selectedWishes || []);
            setCustomWishes(data.data.customWishes || '');
          }
        }
      } catch (error) {
        console.error('Error loading saved wishes:', error);
      }
    }
    loadSavedWishes();
  }, [dossierId]);

  const toggleWish = (wensId: string) => {
    if (selectedWishes.includes(wensId)) {
      setSelectedWishes(selectedWishes.filter((w) => w !== wensId));
    } else {
      setSelectedWishes([...selectedWishes, wensId]);
    }
  };

  const handleContinue = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/dossier/${dossierId}/ceremonie/wensen`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          selectedWishes,
          customWishes,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save wishes');
      }

      router.push(`/dossier/${dossierId}/ceremonie/samenvatting`);
    } catch (error) {
      console.error('Error saving wishes:', error);
      alert('Er is een fout opgetreden bij het opslaan van uw wensen.');
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (wens: CeremonieWens) => {
    if (wens.gratis) {
      return 'Gratis';
    }
    const price = parseFloat(wens.prijsEuro);
    return `€ ${price.toFixed(2).replace('.', ',')}`;
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
            href={`/dossier/${dossierId}/ceremonie/ambtenaar/kiezen`}
            className="inline-flex items-center text-blue-600 hover:text-blue-700 font-sans text-sm mb-6"
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Vorige stap
          </Link>

          <h2 className="font-serif text-3xl font-bold text-gray-900 mb-2">Ceremoniewensen</h2>

          {/* Progress bar */}
          <div className="mb-8">
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div className="h-full bg-blue-600 rounded-full" style={{ width: '90%' }}></div>
            </div>
          </div>

          <p className="font-sans text-base font-semibold text-gray-900 mb-6">
            Wat zijn uw ceremoniewensen?
          </p>

          {wensen.length === 0 ? (
            <div className="p-4 bg-gray-50 border border-gray-200 rounded text-center">
              <p className="text-gray-600">Er zijn momenteel geen ceremoniewensen beschikbaar.</p>
            </div>
          ) : (
            <div className="space-y-4 mb-6">
              {wensen.map((wens) => (
                <label
                  key={wens.id}
                  className="flex items-start gap-4 p-4 border-2 border-gray-300 rounded-lg cursor-pointer hover:border-gray-400 transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={selectedWishes.includes(wens.id)}
                    onChange={() => toggleWish(wens.id)}
                    className="w-5 h-5 text-blue-600 focus:ring-2 focus:ring-blue-600 rounded mt-0.5"
                  />
                  <div>
                    <div className="font-sans text-base font-semibold text-gray-900 mb-1">
                      {wens.naam} - {formatPrice(wens)}
                    </div>
                    <p className="font-sans text-sm text-gray-700">{wens.omschrijving}</p>
                  </div>
                </label>
              ))}
            </div>
          )}

          {/* Custom wishes textarea */}
          <div className="mb-8">
            <label className="block font-sans text-base font-semibold text-gray-900 mb-2">
              Beschrijf uw overige wensen
            </label>
            <textarea
              value={customWishes}
              onChange={(e) => setCustomWishes(e.target.value)}
              placeholder="Beschrijf uw overige wensen"
              rows={5}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent resize-none"
            />
          </div>

          <div className="flex gap-4">
            <button
              onClick={handleContinue}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-sans text-base px-6 py-3 rounded focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 transition-colors inline-flex items-center gap-2"
            >
              {loading ? 'Bezig met opslaan...' : 'Volgende stap'}
              {!loading && (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              )}
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

