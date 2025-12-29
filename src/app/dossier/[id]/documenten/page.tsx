'use client';

import type { JSX } from 'react';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { GemeenteLogoCompact } from '@/components/GemeenteLogo';

interface DocumentOption {
  id: string;
  code: string;
  naam: string;
  omschrijving: string;
  papierType: string;
  prijsCents: number;
  gratis: boolean;
  verplicht: boolean;
  volgorde: number;
}

export default function DocumentenPage(): JSX.Element {
  const params = useParams();
  const router = useRouter();
  // Destructure immediately to avoid DevTools enumeration warning
  const dossierId = params.id as string;
  const [documentOptions, setDocumentOptions] = useState<DocumentOption[]>([]);
  const [selections, setSelections] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showIntroduction, setShowIntroduction] = useState(true);

  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        const response = await fetch(`/api/dossier/${dossierId}/documenten`);
        const result = await response.json();

        if (result.success) {
          // Load document options from database
          setDocumentOptions(result.documentOptions || []);
          
          // Initialize selections
          const initialSelections: Record<string, boolean> = {};
          (result.documentOptions || []).forEach((doc: DocumentOption) => {
            initialSelections[doc.id] = doc.verplicht || (result.selections?.includes(doc.code) || false);
          });
          setSelections(initialSelections);
          
          // If user has already made selections, skip introduction
          if (result.selections && result.selections.length > 0) {
            setShowIntroduction(false);
          }
        } else {
          setError(result.error || 'Kon documenten niet ophalen');
        }
      } catch (err) {
        console.error('Error fetching documenten:', err);
        setError('Er ging iets mis bij het ophalen van de documentopties');
      } finally {
        setIsLoading(false);
      }
    };

    if (dossierId) {
      fetchDocuments();
    }
  }, [dossierId]);

  const handleToggle = (documentId: string) => {
    const doc = documentOptions.find(d => d.id === documentId);
    if (doc?.verplicht) return; // Cannot toggle required documents
    
    setSelections(prev => ({
      ...prev,
      [documentId]: !prev[documentId],
    }));
  };

  const calculateTotal = (): number => {
    return documentOptions.reduce((total, doc) => {
      if (selections[doc.id]) {
        return total + doc.prijsCents;
      }
      return total;
    }, 0);
  };

  const formatPrice = (cents: number): string => {
    if (cents === 0) return 'Gratis';
    const euros = cents / 100;
    return `€ ${euros.toFixed(2).replace('.', ',')}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);

    try {
      const selectedDocuments = Object.entries(selections)
        .filter(([_, selected]) => selected)
        .map(([documentId]) => {
          const doc = documentOptions.find(d => d.id === documentId);
          return {
            documentId,
            code: doc?.code || documentId,
            type: doc?.papierType || 'trouwboekje',
          };
        });

      const response = await fetch(`/api/dossier/${dossierId}/documenten`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ documents: selectedDocuments }),
      });

      const result = await response.json();

      if (result.success) {
        router.push(`/dossier/${dossierId}`);
      } else {
        setError(result.error || 'Er ging iets mis bij het opslaan');
      }
    } catch (err) {
      console.error('Error saving documenten:', err);
      setError('Er ging iets mis bij het opslaan van uw documentkeuze');
    } finally {
      setIsSaving(false);
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

  if (showIntroduction) {
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
            <h1 className="font-sans text-lg font-normal">Te ontvangen documenten opgeven</h1>
          </div>
        </div>

        {/* Main content */}
        <main className="max-w-3xl mx-auto px-6 py-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
            <h2 className="font-serif text-3xl font-bold text-gray-900 mb-6">Inleiding</h2>

            <p className="font-sans text-base text-gray-700 mb-6">
              Met dit formulier kunt u kiezen welke documenten u wilt ontvangen na de ceremonie.
            </p>

            <div className="mb-8">
              <h3 className="font-sans text-lg font-semibold text-gray-900 mb-3">
                Welke documenten u kunt aanvragen
              </h3>
              <ul className="list-disc list-inside space-y-2 font-sans text-base text-gray-700 ml-2">
                <li>Huwelijksakte</li>
                <li>Internationale huwelijksakte</li>
                <li>Extra exemplaar trouwboekje</li>
              </ul>
            </div>

            <div className="mb-8">
              <p className="font-sans text-base text-gray-700">
                U ontvangt standaard een trouwboekje.
              </p>
            </div>

            <div className="mb-8">
              <h3 className="font-sans text-lg font-semibold text-gray-900 mb-3">
                Later documenten aanvragen
              </h3>
              <p className="font-sans text-base text-gray-700">
                U kunt nog tot twee weken voor de ceremoniedatum extra documenten aanvragen.
              </p>
            </div>

            <button
              onClick={() => setShowIntroduction(false)}
              className="bg-blue-600 hover:bg-blue-700 text-white font-sans text-base px-6 py-3 rounded focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 transition-colors inline-flex items-center gap-2"
            >
              Documenten opgeven
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </main>
      </div>
    );
  }

  const verplichteDocs = documentOptions.filter(doc => doc.gratis || doc.verplicht);
  const optionaleDocs = documentOptions.filter(doc => !doc.gratis && !doc.verplicht);

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
          <h1 className="font-sans text-lg font-normal">Te ontvangen documenten opgeven</h1>
        </div>
      </div>

      {/* Main content */}
      <main className="max-w-3xl mx-auto px-6 py-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          {/* Back link */}
          <Link
            href="#"
            onClick={(e) => {
              e.preventDefault();
              setShowIntroduction(true);
            }}
            className="inline-flex items-center text-blue-600 hover:text-blue-800 text-sm mb-6"
          >
            <svg
              className="w-4 h-4 mr-1"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path d="M15 19l-7-7 7-7"></path>
            </svg>
            Vorige stap
          </Link>

          <h2 className="font-serif text-3xl font-bold text-gray-900 mb-8">
            Te ontvangen documenten opgeven
          </h2>

          {/* Error message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-600 rounded" role="alert">
              <div className="flex items-start">
                <svg className="w-5 h-5 text-red-600 mr-2 flex-shrink-0 mt-0.5" 
                     fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <div>
                  <h3 className="text-sm font-bold text-red-900 mb-1">Fout bij opslaan</h3>
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Standard (gratis) documents */}
            <div className="mb-8">
              <h3 className="font-sans text-lg font-semibold text-gray-900 mb-4">
                U ontvangt standaard:
              </h3>
              
              {verplichteDocs.map((doc) => (
                <div key={doc.id} className="border border-gray-200 rounded-lg p-6 mb-4 bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-sans text-base font-semibold text-gray-900 mb-2">
                        {doc.naam} - {formatPrice(doc.prijsCents)}
                      </h4>
                      <p className="font-sans text-sm text-gray-700">
                        {doc.omschrijving}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Optional documents */}
            {optionaleDocs.length > 0 && (
              <div className="mb-8">
                <h3 className="font-sans text-lg font-semibold text-gray-900 mb-4">
                  Welke documenten wilt u nog meer ontvangen?
                </h3>
                
                {optionaleDocs.map((doc) => (
                  <div key={doc.id} className="border border-gray-200 rounded-lg p-6 mb-4">
                    <label className="flex items-start cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selections[doc.id] || false}
                        onChange={() => handleToggle(doc.id)}
                        className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 focus:ring-2 mt-1"
                      />
                      <div className="ml-4 flex-1">
                        <div className="font-sans text-base font-semibold text-gray-900 mb-2">
                          {doc.naam} - {formatPrice(doc.prijsCents)}
                        </div>
                        <p className="font-sans text-sm text-gray-700">
                          {doc.omschrijving}
                        </p>
                      </div>
                    </label>
                  </div>
                ))}
              </div>
            )}

            {/* Navigation buttons */}
            <div className="flex items-center justify-between pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={() => setShowIntroduction(true)}
                className="inline-flex items-center text-blue-600 hover:text-blue-800"
              >
                <svg
                  className="w-4 h-4 mr-1"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path d="M15 19l-7-7 7-7"></path>
                </svg>
                Vorige stap
              </button>

              <button
                type="submit"
                disabled={isSaving}
                className="px-6 py-3 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors font-medium disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {isSaving ? 'Opslaan...' : 'Opslaan en sluiten'}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}

