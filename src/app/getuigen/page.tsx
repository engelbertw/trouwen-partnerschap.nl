'use client';

import { useState } from 'react';
import Link from 'next/link';
import { GemeenteLogoCompact } from '@/components/GemeenteLogo';

interface Witness {
  id: string;
  voornamen: string;
  achternaam: string;
  geboortedatum: string;
  identiteitsbewijs: File | null;
}

export default function GetuigenPage() {
  const [witnesses, setWitnesses] = useState<Witness[]>([
    { id: '1', voornamen: '', achternaam: '', geboortedatum: '', identiteitsbewijs: null },
    { id: '2', voornamen: '', achternaam: '', geboortedatum: '', identiteitsbewijs: null },
  ]);

  const handleAddWitness = () => {
    if (witnesses.length < 4) {
      setWitnesses([
        ...witnesses,
        {
          id: String(witnesses.length + 1),
          voornamen: '',
          achternaam: '',
          geboortedatum: '',
          identiteitsbewijs: null,
        },
      ]);
    }
  };

  const handleRemoveWitness = (id: string) => {
    if (witnesses.length > 2) {
      setWitnesses(witnesses.filter((w) => w.id !== id));
    }
  };

  const handleFileChange = (id: string, file: File | null) => {
    setWitnesses(
      witnesses.map((w) =>
        w.id === id ? { ...w, identiteitsbewijs: file } : w
      )
    );
  };

  const handleInputChange = (
    id: string,
    field: keyof Witness,
    value: string
  ) => {
    setWitnesses(
      witnesses.map((w) => (w.id === id ? { ...w, [field]: value } : w))
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement form submission
    console.log('Getuigen data:', witnesses);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-blue-100">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between max-w-5xl mx-auto">
          <GemeenteLogoCompact />
          <button
            type="button"
            className="text-gray-600 hover:text-gray-900"
            aria-label="Sluiten"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>
      </header>

      {/* Title bar */}
      <div className="bg-blue-700 text-white px-6 py-4">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-xl font-semibold">Getuigen doorgeven</h1>
        </div>
      </div>

      {/* Main content */}
      <main className="px-6 py-8">
        <div className="max-w-3xl mx-auto">
          <div className="bg-white rounded-lg shadow-sm p-8">
            {/* Back link */}
            <Link
              href="#"
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

            <h2 className="font-serif text-3xl font-bold mb-8">Getuigen</h2>

            <form onSubmit={handleSubmit}>
              {/* Witnesses */}
              {witnesses.map((witness, index) => (
                <div
                  key={witness.id}
                  className="border border-gray-200 rounded-lg p-6 mb-6"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-lg">
                      Getuige {index + 1}
                    </h3>
                    {witnesses.length > 2 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveWitness(witness.id)}
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
                        htmlFor={`voornamen-${witness.id}`}
                        className="block text-sm font-medium text-gray-900 mb-2"
                      >
                        Voornamen
                      </label>
                      <input
                        type="text"
                        id={`voornamen-${witness.id}`}
                        value={witness.voornamen}
                        onChange={(e) =>
                          handleInputChange(
                            witness.id,
                            'voornamen',
                            e.target.value
                          )
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>
                    <div>
                      <label
                        htmlFor={`achternaam-${witness.id}`}
                        className="block text-sm font-medium text-gray-900 mb-2"
                      >
                        Achternaam
                      </label>
                      <input
                        type="text"
                        id={`achternaam-${witness.id}`}
                        value={witness.achternaam}
                        onChange={(e) =>
                          handleInputChange(
                            witness.id,
                            'achternaam',
                            e.target.value
                          )
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>
                  </div>

                  {/* Birth date */}
                  <div className="mb-4">
                    <label
                      htmlFor={`geboortedatum-${witness.id}`}
                      className="block text-sm font-medium text-gray-900 mb-2"
                    >
                      Geboortedatum
                    </label>
                    <input
                      type="date"
                      id={`geboortedatum-${witness.id}`}
                      value={witness.geboortedatum}
                      onChange={(e) =>
                        handleInputChange(
                          witness.id,
                          'geboortedatum',
                          e.target.value
                        )
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

                    {witness.identiteitsbewijs ? (
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
                              {witness.identiteitsbewijs.name}
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
                          onClick={() => handleFileChange(witness.id, null)}
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
                          htmlFor={`file-${witness.id}`}
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
                          id={`file-${witness.id}`}
                          accept=".pdf,.jpg,.jpeg,.png"
                          onChange={(e) =>
                            handleFileChange(
                              witness.id,
                              e.target.files?.[0] || null
                            )
                          }
                          className="hidden"
                        />
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {/* Add witness button */}
              {witnesses.length < 4 && (
                <button
                  type="button"
                  onClick={handleAddWitness}
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
                <Link
                  href="#"
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
                </Link>

                <button
                  type="submit"
                  className="px-6 py-3 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors font-medium"
                >
                  Opslaan en sluiten
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}

