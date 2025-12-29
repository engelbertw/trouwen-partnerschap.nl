'use client';

import type { JSX } from 'react';
import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Ceremony {
  id: string;
  dossierId: string;
  datum: string;
  startTijd: string;
  eindTijd: string;
  locatieNaam: string;
  locatieAdres?: any;
  taal?: string;
  trouwboekje?: boolean;
  speech?: boolean;
  geboektOp?: string;
  status: 'gepland' | 'voltooid';
}

export default function BabsCeremoniesPage(): JSX.Element {
  const [ceremonies, setCeremonies] = useState<Ceremony[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateFilter, setDateFilter] = useState({
    from: new Date(new Date().setMonth(new Date().getMonth() - 3)).toISOString().split('T')[0],
    to: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
  });

  useEffect(() => {
    fetchCeremonies();
  }, [dateFilter]);

  const fetchCeremonies = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        from: dateFilter.from,
        to: dateFilter.to,
      });
      const response = await fetch(`/api/babs/ceremonies?${params}`);
      const result = await response.json();

      if (result.success) {
        setCeremonies(result.data);
      } else {
        setError(result.error || 'Kon ceremonies niet ophalen');
      }
    } catch (err) {
      console.error('Error:', err);
      setError('Er ging iets mis');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('nl-NL', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (timeStr: string): string => {
    return timeStr.substring(0, 5); // HH:mm
  };

  const downloadIcs = async (ceremony: Ceremony) => {
    try {
      const response = await fetch(`/api/babs/ceremonies/${ceremony.id}/ics`);
      if (!response.ok) {
        throw new Error('Download mislukt');
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `ceremonie-${ceremony.datum}-${ceremony.startTijd.replace(':', '')}.ics`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error downloading ICS:', err);
      alert('Kon bestand niet downloaden. Probeer het opnieuw.');
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

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center">
        <div className="max-w-md mx-auto px-6 py-8 bg-white rounded-lg shadow-sm border border-red-200">
          <div className="text-center">
            <svg
              className="w-12 h-12 text-red-600 mx-auto mb-4"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
            <h2 className="font-sans text-xl font-semibold text-gray-900 mb-2">
              Fout
            </h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <button
              onClick={fetchCeremonies}
              className="inline-block px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-sans text-sm font-medium"
            >
              Opnieuw proberen
            </button>
          </div>
        </div>
      </div>
    );
  }

  const geplandeCeremonies = ceremonies.filter(c => c.status === 'gepland');
  const voltooideCeremonies = ceremonies.filter(c => c.status === 'voltooid');

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Blue bar */}
      <div className="bg-blue-700 text-white">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <h1 className="font-sans text-lg font-normal">
            BABS Portal - Geboekte Ceremonies
          </h1>
        </div>
      </div>

      {/* Main content */}
      <main className="max-w-6xl mx-auto px-6 py-12">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          {/* Filters */}
          <div className="mb-6 pb-6 border-b border-gray-200">
            <h2 className="font-serif text-lg font-bold text-gray-900 mb-4">
              Filters
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Van datum
                </label>
                <input
                  type="date"
                  value={dateFilter.from}
                  onChange={(e) => setDateFilter({ ...dateFilter, from: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tot datum
                </label>
                <input
                  type="date"
                  value={dateFilter.to}
                  onChange={(e) => setDateFilter({ ...dateFilter, to: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded"
                />
              </div>
            </div>
          </div>

          {/* Geplande Ceremonies */}
          {geplandeCeremonies.length > 0 && (
            <div className="mb-8">
              <h2 className="font-serif text-xl font-bold text-gray-900 mb-4">
                Geplande Ceremonies ({geplandeCeremonies.length})
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="text-left p-3 text-sm font-semibold text-gray-700">Datum</th>
                      <th className="text-left p-3 text-sm font-semibold text-gray-700">Tijd</th>
                      <th className="text-left p-3 text-sm font-semibold text-gray-700">Locatie</th>
                      <th className="text-left p-3 text-sm font-semibold text-gray-700">Acties</th>
                    </tr>
                  </thead>
                  <tbody>
                    {geplandeCeremonies.map((ceremony) => (
                      <tr key={ceremony.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="p-3 text-sm text-gray-900">
                          {formatDate(ceremony.datum)}
                        </td>
                        <td className="p-3 text-sm text-gray-700">
                          {formatTime(ceremony.startTijd)} - {formatTime(ceremony.eindTijd)}
                        </td>
                        <td className="p-3 text-sm text-gray-700">
                          {ceremony.locatieNaam}
                        </td>
                        <td className="p-3">
                          <button
                            onClick={() => downloadIcs(ceremony)}
                            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                            title="Download .ics bestand"
                          >
                            📥 Download
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Voltooide Ceremonies */}
          {voltooideCeremonies.length > 0 && (
            <div className="mb-8">
              <h2 className="font-serif text-xl font-bold text-gray-900 mb-4">
                Voltooide Ceremonies ({voltooideCeremonies.length})
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="text-left p-3 text-sm font-semibold text-gray-700">Datum</th>
                      <th className="text-left p-3 text-sm font-semibold text-gray-700">Tijd</th>
                      <th className="text-left p-3 text-sm font-semibold text-gray-700">Locatie</th>
                      <th className="text-left p-3 text-sm font-semibold text-gray-700">Acties</th>
                    </tr>
                  </thead>
                  <tbody>
                    {voltooideCeremonies.map((ceremony) => (
                      <tr key={ceremony.id} className="border-b border-gray-100 hover:bg-gray-50 opacity-75">
                        <td className="p-3 text-sm text-gray-600">
                          {formatDate(ceremony.datum)}
                        </td>
                        <td className="p-3 text-sm text-gray-600">
                          {formatTime(ceremony.startTijd)} - {formatTime(ceremony.eindTijd)}
                        </td>
                        <td className="p-3 text-sm text-gray-600">
                          {ceremony.locatieNaam}
                        </td>
                        <td className="p-3">
                          <button
                            onClick={() => downloadIcs(ceremony)}
                            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                            title="Download .ics bestand"
                          >
                            📥 Download
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {ceremonies.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-600 mb-4">Geen ceremonies gevonden voor deze periode.</p>
              <button
                onClick={() => {
                  setDateFilter({
                    from: new Date(new Date().setMonth(new Date().getMonth() - 3)).toISOString().split('T')[0],
                    to: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
                  });
                }}
                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                Reset filters
              </button>
            </div>
          )}

          {/* Navigation */}
          <div className="mt-8 pt-6 border-t border-gray-200 flex justify-center gap-4">
            <Link
              href="/babs/beschikbaarheid"
              className="text-gray-600 hover:text-gray-900 text-sm"
            >
              ← Beschikbaarheid
            </Link>
            <span className="text-gray-300">|</span>
            <Link
              href="/babs/instellingen"
              className="text-gray-600 hover:text-gray-900 text-sm"
            >
              Instellingen
            </Link>
            <span className="text-gray-300">|</span>
            <Link
              href="/"
              className="text-gray-600 hover:text-gray-900 text-sm"
            >
              Terug naar home
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}

