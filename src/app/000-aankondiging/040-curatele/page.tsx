'use client';

import type { JSX } from 'react';
import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';

/**
 * Curatele page - Guardianship status for both partners
 * Shows conditional file upload if under guardianship
 */
function CurateleContent(): JSX.Element | null {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dossierIdFromQuery = searchParams.get('dossierId');
  
  // Get dossierId from query params or sessionStorage as fallback
  const [dossierId, setDossierId] = useState<string | null>(() => {
    if (dossierIdFromQuery) {
      // Store in sessionStorage for fallback
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('dossierId', dossierIdFromQuery);
      }
      return dossierIdFromQuery;
    }
    // Fallback to sessionStorage
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem('dossierId');
    }
    return null;
  });
  
  const [partner1UnderGuardianship, setPartner1UnderGuardianship] = useState<boolean | null>(null);
  const [partner2UnderGuardianship, setPartner2UnderGuardianship] = useState<boolean | null>(null);
  const [partner1UploadedFile, setPartner1UploadedFile] = useState<File | null>(null);
  const [partner2UploadedFile, setPartner2UploadedFile] = useState<File | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [partner1Name, setPartner1Name] = useState<string>('');
  const [partner2Name, setPartner2Name] = useState<string>('');

  // Update dossierId when query param changes
  useEffect(() => {
    if (dossierIdFromQuery) {
      setDossierId(dossierIdFromQuery);
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('dossierId', dossierIdFromQuery);
      }
    }
  }, [dossierIdFromQuery]);

  // Load existing data from database on mount
  useEffect(() => {
    // Final check: if still no dossierId, try sessionStorage one more time
    let finalDossierId = dossierId;
    if (!finalDossierId && typeof window !== 'undefined') {
      const storedId = sessionStorage.getItem('dossierId');
      if (storedId) {
        finalDossierId = storedId;
        setDossierId(storedId);
      }
    }
    
    if (!finalDossierId) {
      setError('Geen dossier ID gevonden. Start opnieuw.');
      setIsLoaded(true);
      return;
    }

    async function loadData() {
      try {
        // Load curatele data
        const curateleResponse = await fetch(`/api/dossier/${finalDossierId}/curatele`);
        const curateleResult = await curateleResponse.json();
        
        if (curateleResult.success && curateleResult.data) {
          setPartner1UnderGuardianship(curateleResult.data.partner1UnderGuardianship || false);
          setPartner2UnderGuardianship(curateleResult.data.partner2UnderGuardianship || false);
        }
        
        // Load partner names
        const partnersResponse = await fetch(`/api/dossier/${finalDossierId}/partners`);
        const partnersResult = await partnersResponse.json();
        
        if (partnersResult.success && partnersResult.data) {
          if (partnersResult.data.partner1) {
            const name1 = `${partnersResult.data.partner1.voornamen || ''} ${partnersResult.data.partner1.achternaam || ''}`.trim();
            setPartner1Name(name1 || 'Partner 1');
          }
          
          if (partnersResult.data.partner2) {
            const name2 = `${partnersResult.data.partner2.voornamen || ''} ${partnersResult.data.partner2.achternaam || ''}`.trim();
            setPartner2Name(name2 || 'Partner 2');
          }
        }
        
        setIsLoaded(true);
      } catch (err) {
        console.error('Error loading data:', err);
        setError('Fout bij laden van gegevens');
        setIsLoaded(true);
      }
    }

    loadData();
  }, [dossierId]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, partner: 'partner1' | 'partner2') => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type and size
      const validTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
      const maxSize = 10 * 1024 * 1024; // 10MB

      if (!validTypes.includes(file.type)) {
        alert('Alleen pdf, jpg, jpeg of png bestanden zijn toegestaan');
        return;
      }

      if (file.size > maxSize) {
        alert('Bestand mag maximaal 10 MB zijn');
        return;
      }

      if (partner === 'partner1') {
        setPartner1UploadedFile(file);
      } else {
        setPartner2UploadedFile(file);
      }
    }
  };

  const handleRemoveFile = (partner: 'partner1' | 'partner2') => {
    if (partner === 'partner1') {
      setPartner1UploadedFile(null);
    } else {
      setPartner2UploadedFile(null);
    }
  };

  const handleContinue = async () => {
    if (!dossierId) {
      setError('Geen dossier ID gevonden');
      return;
    }

    // Validate: if under guardianship, file must be uploaded
    if (partner1UnderGuardianship && !partner1UploadedFile) {
      alert('Upload het toestemmingsformulier van uw curator');
      return;
    }

    if (partner2UnderGuardianship && !partner2UploadedFile) {
      alert('Upload het toestemmingsformulier van de curator van uw partner');
      return;
    }

    if (partner1UnderGuardianship === null || partner2UnderGuardianship === null) {
      alert('Beantwoord beide vragen');
      return;
    }

    // Save to database
    setIsSaving(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/dossier/${dossierId}/curatele`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          partner1UnderGuardianship: partner1UnderGuardianship || false,
          partner2UnderGuardianship: partner2UnderGuardianship || false,
          // TODO: File upload handling when document storage is implemented
        }),
      });

      const result = await response.json();
      
      if (!result.success) {
        setError(result.error || 'Fout bij opslaan');
        return;
      }

      // Store dossierId in sessionStorage before navigation
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('dossierId', dossierId);
      }
      
      // Navigate to next step
      router.push(`/000-aankondiging/050-kinderen?dossierId=${dossierId}`);
    } catch (err) {
      console.error('Error saving:', err);
      setError('Er ging iets mis bij het opslaan');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isLoaded) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-blue-100">
      {/* Blue header bar */}
      <div className="bg-[#154273] text-white py-4 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto max-w-4xl">
          <h1 className="font-sans text-xl font-bold">
            Huwelijk of partnerschap aankondigen
          </h1>
        </div>
      </div>

      {/* Main content */}
      <main className="container mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8">
        <article className="bg-white rounded-lg shadow-md p-6 sm:p-8 lg:p-12">
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

          {/* Previous step link */}
          <Link
            href={(() => {
              const id = dossierId || (typeof window !== 'undefined' ? sessionStorage.getItem('dossierId') : null);
              return id ? `/000-aankondiging/031-partner2-gegevens?dossierId=${id}` : '/000-aankondiging/031-partner2-gegevens';
            })()}
            className="inline-flex items-center gap-2 text-[#154273] hover:text-[#1a5a99] focus:outline-none focus:ring-2 focus:ring-[#154273] focus:ring-offset-2 mb-6 transition-colors"
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
            Curatele
          </h2>

          {/* Progress bar */}
          <div className="mb-8">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-[#154273] h-2 rounded-full transition-all duration-300"
                style={{ width: '60%' }}
                role="progressbar"
                aria-valuenow={60}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label="Voortgang: 60%"
              />
            </div>
          </div>

          {/* Question 1: Partner 1 under guardianship */}
          <fieldset className="mb-8">
            <legend className="text-lg font-bold mb-4 text-gray-900">
              Staat u onder curatele?
            </legend>

            <div className="space-y-3">
              {/* Ja option */}
              <div className="flex items-center">
                <input
                  type="radio"
                  id="partner1-ja"
                  name="partner1Curatele"
                  value="ja"
                  checked={partner1UnderGuardianship === true}
                  onChange={() => setPartner1UnderGuardianship(true)}
                  className="w-5 h-5 text-[#154273] border-gray-300 focus:ring-2 focus:ring-[#154273] focus:ring-offset-2 cursor-pointer"
                />
                <label 
                  htmlFor="partner1-ja" 
                  className="ml-3 text-base text-gray-900 cursor-pointer"
                >
                  Ja
                </label>
              </div>

              {/* Nee option */}
              <div className="flex items-center">
                <input
                  type="radio"
                  id="partner1-nee"
                  name="partner1Curatele"
                  value="nee"
                  checked={partner1UnderGuardianship === false}
                  onChange={() => setPartner1UnderGuardianship(false)}
                  className="w-5 h-5 text-[#154273] border-gray-300 focus:ring-2 focus:ring-[#154273] focus:ring-offset-2 cursor-pointer"
                />
                <label 
                  htmlFor="partner1-nee" 
                  className="ml-3 text-base text-gray-900 cursor-pointer"
                >
                  Nee
                </label>
              </div>
            </div>
          </fieldset>

          {/* Conditional file upload for Partner 1 */}
          {partner1UnderGuardianship === true && (
            <div className="mb-8">
              <h3 className="text-base font-bold mb-2 text-gray-900">
                Upload het toestemmingsformulier van de curator
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Toegestane bestanden: pdf, jpg of png (maximaal 10 MB)
              </p>

              {!partner1UploadedFile ? (
                <label className="inline-flex items-center gap-2 bg-white text-[#154273] font-sans text-base font-bold px-5 py-3 rounded border-2 border-[#154273] hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-[#154273] focus:ring-offset-2 transition-colors cursor-pointer">
                  <svg 
                    className="w-5 h-5" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={2} 
                      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" 
                    />
                  </svg>
                  Upload toestemmingsformulier
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => handleFileUpload(e, 'partner1')}
                    className="hidden"
                  />
                </label>
              ) : (
                <div className="flex items-center gap-3 p-4 bg-gray-50 border border-gray-300 rounded">
                  {/* File icon */}
                  <div className="flex-shrink-0 w-10 h-10 bg-red-100 rounded flex items-center justify-center">
                    <span className="text-red-600 font-bold text-xs">
                      {partner1UploadedFile.type === 'application/pdf' ? 'PDF' : 'IMG'}
                    </span>
                  </div>

                  {/* File info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {partner1UploadedFile.name}
                    </p>
                    <p className="text-xs text-green-600 flex items-center gap-1">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      Upload geslaagd
                    </p>
                  </div>

                  {/* Remove button */}
                  <button
                    onClick={() => handleRemoveFile('partner1')}
                    className="text-[#154273] hover:text-[#1a5a99] font-medium text-sm underline"
                  >
                    Verwijder
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Question 2: Partner 2 under guardianship */}
          <fieldset className="mb-8">
            <legend className="text-lg font-bold mb-4 text-gray-900">
              Staat uw partner {partner2Name || 'Partner 2'} onder curatele?
            </legend>

            <div className="space-y-3">
              {/* Ja option */}
              <div className="flex items-center">
                <input
                  type="radio"
                  id="partner2-ja"
                  name="partner2Curatele"
                  value="ja"
                  checked={partner2UnderGuardianship === true}
                  onChange={() => setPartner2UnderGuardianship(true)}
                  className="w-5 h-5 text-[#154273] border-gray-300 focus:ring-2 focus:ring-[#154273] focus:ring-offset-2 cursor-pointer"
                />
                <label 
                  htmlFor="partner2-ja" 
                  className="ml-3 text-base text-gray-900 cursor-pointer"
                >
                  Ja
                </label>
              </div>

              {/* Nee option */}
              <div className="flex items-center">
                <input
                  type="radio"
                  id="partner2-nee"
                  name="partner2Curatele"
                  value="nee"
                  checked={partner2UnderGuardianship === false}
                  onChange={() => setPartner2UnderGuardianship(false)}
                  className="w-5 h-5 text-[#154273] border-gray-300 focus:ring-2 focus:ring-[#154273] focus:ring-offset-2 cursor-pointer"
                />
                <label 
                  htmlFor="partner2-nee" 
                  className="ml-3 text-base text-gray-900 cursor-pointer"
                >
                  Nee
                </label>
              </div>
            </div>
          </fieldset>

          {/* Conditional file upload for Partner 2 */}
          {partner2UnderGuardianship === true && (
            <div className="mb-8">
              <h3 className="text-base font-bold mb-2 text-gray-900">
                Upload het toestemmingsformulier van de curator van uw partner
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Toegestane bestanden: pdf, jpg of png (maximaal 10 MB)
              </p>

              {!partner2UploadedFile ? (
                <label className="inline-flex items-center gap-2 bg-white text-[#154273] font-sans text-base font-bold px-5 py-3 rounded border-2 border-[#154273] hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-[#154273] focus:ring-offset-2 transition-colors cursor-pointer">
                  <svg 
                    className="w-5 h-5" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={2} 
                      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" 
                    />
                  </svg>
                  Upload toestemmingsformulier
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => handleFileUpload(e, 'partner2')}
                    className="hidden"
                  />
                </label>
              ) : (
                <div className="flex items-center gap-3 p-4 bg-gray-50 border border-gray-300 rounded">
                  {/* File icon */}
                  <div className="flex-shrink-0 w-10 h-10 bg-red-100 rounded flex items-center justify-center">
                    <span className="text-red-600 font-bold text-xs">
                      {partner2UploadedFile.type === 'application/pdf' ? 'PDF' : 'IMG'}
                    </span>
                  </div>

                  {/* File info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {partner2UploadedFile.name}
                    </p>
                    <p className="text-xs text-green-600 flex items-center gap-1">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      Upload geslaagd
                    </p>
                  </div>

                  {/* Remove button */}
                  <button
                    onClick={() => handleRemoveFile('partner2')}
                    className="text-[#154273] hover:text-[#1a5a99] font-medium text-sm underline"
                  >
                    Verwijder
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Action buttons */}
          <div className="flex flex-col gap-4">
            <button
              onClick={handleContinue}
              disabled={isSaving}
              className="inline-flex items-center justify-center gap-2 bg-[#154273] text-white font-sans text-base font-bold px-6 py-3 rounded hover:bg-[#1a5a99] focus:outline-none focus:ring-2 focus:ring-[#154273] focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? 'Opslaan...' : 'Volgende stap'}
              {!isSaving && (
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
              )}
            </button>
          </div>
        </article>
      </main>
    </div>
  );
}

/**
 * Page wrapper with Suspense boundary for useSearchParams
 */
export default function CuratelePage(): JSX.Element {
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
      <CurateleContent />
    </Suspense>
  );
}

