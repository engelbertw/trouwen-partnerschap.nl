'use client';

import type { JSX } from 'react';
import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';

/**
 * Aankondiging type selectie pagina
 * Gebruiker kiest tussen Huwelijk of Partnerschap
 */
function AankondigingTypeContent(): JSX.Element {
  const router = useRouter();
  const searchParams = useSearchParams();
  const existingDossierId = searchParams.get('dossierId');
  
  const [selectedType, setSelectedType] = useState<'huwelijk' | 'partnerschap' | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dossierId, setDossierId] = useState<string | null>(existingDossierId);

  // Load existing data if editing
  useEffect(() => {
    async function loadData() {
      if (existingDossierId) {
        try {
          const response = await fetch(`/api/dossier/${existingDossierId}/aankondiging`);
          const result = await response.json();
          
          if (result.success && result.data) {
            setSelectedType(result.data.partnerschap ? 'partnerschap' : 'huwelijk');
          }
        } catch (err) {
          console.error('Error loading data:', err);
        }
      }
      setIsLoaded(true);
    }
    
    loadData();
  }, [existingDossierId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedType) return;
    
    setIsSaving(true);
    setError(null);
    
    try {
      // Create or update dossier
      let currentDossierId = dossierId;
      
      if (!currentDossierId) {
        // Create new dossier
        const createResponse = await fetch('/api/dossier/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: selectedType }),
        });
        
        const createResult = await createResponse.json();
        
        if (!createResult.success) {
          setError(createResult.error || 'Fout bij aanmaken dossier');
          return;
        }
        
        currentDossierId = createResult.dossierId;
        setDossierId(currentDossierId);
      }
      
      // Update aankondiging type
      const updateResponse = await fetch(`/api/dossier/${currentDossierId}/aankondiging`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: selectedType }),
      });
      
      const updateResult = await updateResponse.json();
      
      if (!updateResult.success) {
        setError(updateResult.error || 'Fout bij opslaan');
        return;
      }
      
      // Navigate to next step with dossierId
      router.push(`/000-aankondiging/020-partner1-login?dossierId=${currentDossierId}`);
    } catch (err) {
      console.error('Error saving:', err);
      setError('Er ging iets mis bij het opslaan');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-blue-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Laden...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-blue-100">
      {/* Blue header bar */}
      <div className="bg-[#004A91] text-white py-4 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto max-w-4xl">
          <h1 className="font-sans text-xl font-bold">
            Huwelijk of partnerschap aankondigen
          </h1>
        </div>
      </div>

      {/* Main content */}
      <main className="container mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8">
        <article className="bg-white rounded-lg shadow-md p-6 sm:p-8 lg:p-12">
          {/* Previous step link */}
          <Link
            href="/000-aankondiging/000-inleiding"
            className="inline-flex items-center gap-2 text-[#2e75d4] hover:text-[#4d8ada] focus:outline-none focus:ring-2 focus:ring-[#2e75d4] focus:ring-offset-2 mb-6 transition-colors"
          >
            <svg 
              className="w-4 h-4" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M15 19l-7-7 7-7" 
              />
            </svg>
            Vorige stap
          </Link>

          {/* Page heading */}
          <h2 className="font-sans text-3xl sm:text-4xl font-bold mb-6">
            Aankondiging
          </h2>

          {/* Progress bar */}
          <div className="mb-8">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-[#2e75d4] h-2 rounded-full transition-all duration-300"
                style={{ width: '10%' }}
                role="progressbar"
                aria-valuenow={10}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label="Voortgang: 10%"
              />
            </div>
          </div>

          {/* Error message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-600 rounded" role="alert">
              <div className="flex items-start">
                <svg className="w-5 h-5 text-red-600 mr-2 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <p className="text-sm text-red-800">{error}</p>
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit}>
            {/* Question */}
            <fieldset className="mb-8">
              <legend className="text-lg font-bold mb-6 text-gray-900">
                Wat wilt u aankondigen bij de gemeente?
              </legend>

              {/* Radio options */}
              <div className="space-y-4">
                {/* Huwelijk option */}
                <div className="flex items-center">
                  <input
                    type="radio"
                    id="huwelijk"
                    name="aankondigingType"
                    value="huwelijk"
                    checked={selectedType === 'huwelijk'}
                    onChange={(e) => setSelectedType(e.target.value as 'huwelijk')}
                    className="w-5 h-5 text-[#2e75d4] border-gray-300 focus:ring-2 focus:ring-[#2e75d4] focus:ring-offset-2 cursor-pointer"
                  />
                  <label 
                    htmlFor="huwelijk" 
                    className="ml-3 text-base text-gray-900 cursor-pointer"
                  >
                    Huwelijk
                  </label>
                </div>

                {/* Partnerschap option */}
                <div className="flex items-center">
                  <input
                    type="radio"
                    id="partnerschap"
                    name="aankondigingType"
                    value="partnerschap"
                    checked={selectedType === 'partnerschap'}
                    onChange={(e) => setSelectedType(e.target.value as 'partnerschap')}
                    className="w-5 h-5 text-[#2e75d4] border-gray-300 focus:ring-2 focus:ring-[#2e75d4] focus:ring-offset-2 cursor-pointer"
                  />
                  <label 
                    htmlFor="partnerschap" 
                    className="ml-3 text-base text-gray-900 cursor-pointer"
                  >
                    Partnerschap
                  </label>
                </div>
              </div>
            </fieldset>

            {/* Next step button */}
            <div className="flex gap-4">
              <button
                type="submit"
                disabled={!selectedType || isSaving}
                className="inline-flex items-center justify-center gap-2 bg-[#2e75d4] text-white font-sans text-base font-bold px-6 py-3 rounded hover:bg-[#4d8ada] focus:outline-none focus:ring-2 focus:ring-[#2e75d4] focus:ring-offset-2 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed disabled:hover:bg-gray-300"
              >
                {isSaving ? 'Opslaan...' : 'Volgende stap'}
                <svg 
                  className="w-5 h-5" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M9 5l7 7-7 7" 
                  />
                </svg>
              </button>
            </div>
          </form>
        </article>
      </main>
    </div>
  );
}

/**
 * Page wrapper with Suspense boundary for useSearchParams
 */
export default function AankondigingTypePage(): JSX.Element {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-b from-blue-50 to-blue-100 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Laden...</p>
          </div>
        </div>
      }
    >
      <AankondigingTypeContent />
    </Suspense>
  );
}

