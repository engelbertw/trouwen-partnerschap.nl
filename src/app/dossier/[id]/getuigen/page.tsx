'use client';

import type { JSX } from 'react';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { GemeenteLogoCompact } from '@/components/GemeenteLogo';
import { validateGetuigen, formatValidationErrors, formatValidationWarnings } from '@/lib/validation';
import type { GetuigeData } from '@/lib/validation';

interface Getuige {
  id?: string;
  voornamen: string;
  voorvoegsel: string;
  achternaam: string;
  geboortedatum: string;
  geboorteplaats: string;
  documentUploadId?: string;
  documentStatus?: string;
  file?: File | null;
  fileName?: string;
  volgorde: number;
}

export default function GetuigenPage(): JSX.Element {
  const params = useParams();
  const router = useRouter();
  const dossierId = params.id as string;
  const [getuigen, setGetuigen] = useState<Getuige[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [validationWarnings, setValidationWarnings] = useState<string[]>([]);
  const [showIntroduction, setShowIntroduction] = useState(true);

  useEffect(() => {
    const fetchGetuigen = async () => {
      try {
        const response = await fetch(`/api/dossier/${dossierId}/getuigen`);
        const result = await response.json();

        if (result.success && result.getuigen.length > 0) {
          setGetuigen(result.getuigen.map((g: Getuige) => ({
            ...g,
            geboortedatum: g.geboortedatum ? formatDateForInput(g.geboortedatum) : '',
            file: null,
            fileName: g.documentUploadId ? 'Document geüpload' : undefined,
          })));
          setShowIntroduction(false);
        } else {
          // Initialize with 2 empty witnesses
          setGetuigen([
            {
              voornamen: '',
              voorvoegsel: '',
              achternaam: '',
              geboortedatum: '',
              geboorteplaats: '',
              file: null,
              volgorde: 1,
            },
            {
              voornamen: '',
              voorvoegsel: '',
              achternaam: '',
              geboortedatum: '',
              geboorteplaats: '',
              file: null,
              volgorde: 2,
            },
          ]);
        }
      } catch (err) {
        console.error('Error fetching getuigen:', err);
        setError('Er ging iets mis bij het ophalen van de getuigen');
      } finally {
        setIsLoading(false);
      }
    };

    if (dossierId) {
      fetchGetuigen();
    }
  }, [dossierId]);

  const formatDateForInput = (dateString: string): string => {
    // Convert DD-MM-YYYY to YYYY-MM-DD for input[type="date"]
    if (dateString.includes('-')) {
      const parts = dateString.split('-');
      if (parts.length === 3 && parts[0].length === 2) {
        return `${parts[2]}-${parts[1]}-${parts[0]}`;
      }
    }
    return dateString;
  };

  const formatDateForDisplay = (dateString: string): string => {
    // Convert YYYY-MM-DD to DD-MM-YYYY for display
    if (dateString.includes('-')) {
      const parts = dateString.split('-');
      if (parts.length === 3 && parts[0].length === 4) {
        return `${parts[2]}-${parts[1]}-${parts[0]}`;
      }
    }
    return dateString;
  };

  const handleAddGetuige = () => {
    if (getuigen.length < 4) {
      setGetuigen([
        ...getuigen,
        {
          voornamen: '',
          voorvoegsel: '',
          achternaam: '',
          geboortedatum: '',
          geboorteplaats: '',
          file: null,
          volgorde: getuigen.length + 1,
        },
      ]);
    }
  };

  const handleRemoveGetuige = (index: number) => {
    if (getuigen.length > 2) {
      const updatedGetuigen = getuigen.filter((_, i) => i !== index);
      // Update volgorde
      updatedGetuigen.forEach((g, i) => {
        g.volgorde = i + 1;
      });
      setGetuigen(updatedGetuigen);
    }
  };

  const handleInputChange = (
    index: number,
    field: keyof Getuige,
    value: string
  ) => {
    const updated = [...getuigen];
    updated[index] = { ...updated[index], [field]: value };
    setGetuigen(updated);
  };

  const handleFileChange = (index: number, file: File | null) => {
    const updated = [...getuigen];
    updated[index] = { 
      ...updated[index], 
      file,
      fileName: file?.name 
    };
    setGetuigen(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);
    setValidationErrors([]);
    setValidationWarnings([]);

    try {
      // Format dates for validation (DD-MM-YYYY)
      const getuigenForValidation: GetuigeData[] = getuigen.map(g => ({
        voornamen: g.voornamen,
        voorvoegsel: g.voorvoegsel,
        achternaam: g.achternaam,
        geboortedatum: formatDateForDisplay(g.geboortedatum),
        geboorteplaats: g.geboorteplaats,
      }));

      // Validate witnesses
      const validationResult = validateGetuigen(getuigenForValidation);

      if (!validationResult.isValid) {
        setValidationErrors(formatValidationErrors(validationResult));
        setValidationWarnings(formatValidationWarnings(validationResult));
        setIsSaving(false);
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }

      // Set warnings if any
      if (validationResult.warnings.length > 0) {
        setValidationWarnings(formatValidationWarnings(validationResult));
      }

      // Format dates for database (DD-MM-YYYY)
      const getuigenData = getuigen.map(g => ({
        ...g,
        geboortedatum: formatDateForDisplay(g.geboortedatum),
        // Remove file and fileName from submission (would need separate file upload endpoint)
        file: undefined,
        fileName: undefined,
      }));

      const response = await fetch(`/api/dossier/${dossierId}/getuigen`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ getuigen: getuigenData }),
      });

      const result = await response.json();

      if (result.success) {
        router.push(`/dossier/${dossierId}`);
      } else {
        setError(result.error || 'Er ging iets mis bij het opslaan');
      }
    } catch (err) {
      console.error('Error saving getuigen:', err);
      setError('Er ging iets mis bij het opslaan van de getuigen');
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
            <h1 className="font-sans text-lg font-normal">Getuigen doorgeven</h1>
          </div>
        </div>

        {/* Main content */}
        <main className="max-w-3xl mx-auto px-6 py-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
            <h2 className="font-serif text-3xl font-bold text-gray-900 mb-6">Inleiding</h2>

            <p className="font-sans text-base text-gray-700 mb-6">
              Met dit formulier geeft u de getuigen voor uw ceremonie door.
            </p>

            <div className="mb-8">
              <h3 className="font-sans text-lg font-semibold text-gray-900 mb-3">
                Wat u doet in dit formulier
              </h3>
              <ul className="list-disc list-inside space-y-2 font-sans text-base text-gray-700 ml-2">
                <li>U vult de namen van uw getuigen in. U kiest 2, 3 of 4 getuigen. Uw getuige is 18 jaar of ouder.</li>
                <li>U stuurt ook een digitale kopie van hun identiteitsbewijs op.</li>
              </ul>
            </div>

            <div className="mb-8">
              <h3 className="font-sans text-lg font-semibold text-gray-900 mb-3">
                Getuigen later aanpassen
              </h3>
              <p className="font-sans text-base text-gray-700">
                U kunt uw getuigen nog toevoegen of aanpassen tot 2 weken voor de datum van uw ceremonie
              </p>
            </div>

            <button
              onClick={() => setShowIntroduction(false)}
              className="bg-blue-600 hover:bg-blue-700 text-white font-sans text-base px-6 py-3 rounded focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 transition-colors inline-flex items-center gap-2"
            >
              Start met getuigen doorgeven
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </main>
      </div>
    );
  }

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
          <h1 className="font-sans text-lg font-normal">Getuigen doorgeven</h1>
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

          <h2 className="font-serif text-3xl font-bold text-gray-900 mb-8">Getuigen</h2>

          {/* Validation Errors */}
          {validationErrors.length > 0 && (
            <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-600 rounded" role="alert">
              <div className="flex items-start">
                <svg className="w-5 h-5 text-red-600 mr-2 flex-shrink-0 mt-0.5" 
                     fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <div>
                  <h3 className="text-sm font-bold text-red-900 mb-1">Controleer uw invoer</h3>
                  <ul className="list-disc list-inside text-sm text-red-800">
                    {validationErrors.map((error, idx) => (
                      <li key={idx}>{error}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Validation Warnings */}
          {validationWarnings.length > 0 && validationErrors.length === 0 && (
            <div className="mb-6 p-4 bg-yellow-50 border-l-4 border-yellow-600 rounded" role="alert">
              <div className="flex items-start">
                <svg className="w-5 h-5 text-yellow-600 mr-2 flex-shrink-0 mt-0.5" 
                     fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <div>
                  <h3 className="text-sm font-bold text-yellow-900 mb-1">Let op</h3>
                  <ul className="list-disc list-inside text-sm text-yellow-800">
                    {validationWarnings.map((warning, idx) => (
                      <li key={idx}>{warning}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

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
            {/* Witnesses */}
            {getuigen.map((getuige, index) => (
              <div
                key={index}
                className="border border-gray-200 rounded-lg p-6 mb-6"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-lg">
                    Getuige {index + 1}
                  </h3>
                  {getuigen.length > 2 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveGetuige(index)}
                      className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
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
                        <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                      </svg>
                      Verwijder getuige
                    </button>
                  )}
                </div>

                {/* Name fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label
                      htmlFor={`voornamen-${index}`}
                      className="block text-sm font-medium text-gray-900 mb-2"
                    >
                      Voornamen
                    </label>
                    <input
                      type="text"
                      id={`voornamen-${index}`}
                      value={getuige.voornamen}
                      onChange={(e) =>
                        handleInputChange(index, 'voornamen', e.target.value)
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label
                      htmlFor={`achternaam-${index}`}
                      className="block text-sm font-medium text-gray-900 mb-2"
                    >
                      Achternaam
                    </label>
                    <input
                      type="text"
                      id={`achternaam-${index}`}
                      value={getuige.achternaam}
                      onChange={(e) =>
                        handleInputChange(index, 'achternaam', e.target.value)
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                </div>

                {/* Birth date */}
                <div className="mb-4">
                  <label
                    htmlFor={`geboortedatum-${index}`}
                    className="block text-sm font-medium text-gray-900 mb-2"
                  >
                    Geboortedatum
                  </label>
                  <input
                    type="date"
                    id={`geboortedatum-${index}`}
                    value={getuige.geboortedatum}
                    onChange={(e) =>
                      handleInputChange(index, 'geboortedatum', e.target.value)
                    }
                    placeholder="dd-mm-jjjj"
                    className="w-full md:w-64 px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                {/* File upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Upload het identiteitsbewijs van de getuige
                  </label>
                  <p className="text-sm text-gray-600 mb-3">
                    Toegestane bestanden: pdf, jpg of png (maximaal 10 MB)
                  </p>

                  {getuige.file || getuige.fileName ? (
                    <div className="flex items-center justify-between p-4 bg-gray-50 border border-gray-200 rounded">
                      <div className="flex items-center">
                        <svg
                          className="w-8 h-8 text-red-600 mr-3"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z"
                            clipRule="evenodd"
                          />
                        </svg>
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {getuige.file?.name || getuige.fileName}
                          </div>
                          <div className="text-xs text-green-600 flex items-center mt-1">
                            <svg
                              className="w-4 h-4 mr-1"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                clipRule="evenodd"
                              />
                            </svg>
                            Upload geslaagd
                          </div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleFileChange(index, null)}
                        className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
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
                          <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                        </svg>
                        Verwijder document
                      </button>
                    </div>
                  ) : (
                    <div>
                      <label
                        htmlFor={`file-${index}`}
                        className="inline-flex items-center px-4 py-2 border border-blue-600 text-blue-600 rounded hover:bg-blue-50 cursor-pointer transition-colors"
                      >
                        <svg
                          className="w-5 h-5 mr-2"
                          fill="none"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
                        </svg>
                        Upload identiteitsbewijs
                      </label>
                      <input
                        type="file"
                        id={`file-${index}`}
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(e) =>
                          handleFileChange(index, e.target.files?.[0] || null)
                        }
                        className="hidden"
                      />
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* Add witness button */}
            {getuigen.length < 4 && (
              <button
                type="button"
                onClick={handleAddGetuige}
                className="inline-flex items-center px-4 py-2 border border-blue-600 text-blue-600 rounded hover:bg-blue-50 transition-colors mb-6"
              >
                <svg
                  className="w-5 h-5 mr-2"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path d="M12 4v16m8-8H4"></path>
                </svg>
                Getuige toevoegen
              </button>
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

