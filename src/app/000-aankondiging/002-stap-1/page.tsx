import type { Metadata } from 'next';
import type { JSX } from 'react';

export const metadata: Metadata = {
  title: 'Stap 1 - Aankondiging - Gemeente',
  description: 'Eerste stap in het aankondigingsproces',
  openGraph: {
    locale: 'nl_NL',
  },
};

/**
 * Eerste stap in het aankondigingsformulier
 * TODO: Implementeer formulier voor basis gegevens
 */
export default function AankondigingStap1(): JSX.Element {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-blue-100">
      <div className="bg-[#154273] text-white py-4 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto max-w-4xl">
          <h1 className="font-sans text-xl font-bold">
            Huwelijk of partnerschap aankondigen
          </h1>
        </div>
      </div>

      <main className="container mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8">
        <article className="bg-white rounded-lg shadow-md p-6 sm:p-8 lg:p-12">
          <h2 className="font-serif text-3xl sm:text-4xl font-bold mb-6">
            Stap 1: Persoonlijke gegevens
          </h2>
          
          <p className="text-base leading-relaxed text-gray-700">
            Dit is de eerste stap van het aankondigingsformulier.
          </p>
          
          {/* TODO: Implementeer formulier */}
          <div className="mt-8 p-4 bg-blue-50 rounded border border-blue-200">
            <p className="text-sm text-gray-600">
              <strong>TODO:</strong> Formulier voor persoonlijke gegevens implementeren
            </p>
          </div>
        </article>
      </main>
    </div>
  );
}

