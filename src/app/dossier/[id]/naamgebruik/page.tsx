'use client';

import type { JSX } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { GemeenteLogoCompact } from '@/components/GemeenteLogo';

export default function NaamgebruikPage(): JSX.Element {
  const params = useParams();
  const router = useRouter();
  const dossierId = params.id as string;

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <GemeenteLogoCompact />
          <Link
            href={`/dossier/${dossierId}`}
            className="text-gray-600 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 rounded p-2"
          >
            Terug naar dossier
          </Link>
        </div>
      </header>

      {/* Blue bar */}
      <div className="bg-blue-700 text-white">
        <div className="max-w-4xl mx-auto px-6 py-3">
          <h1 className="font-sans text-lg font-normal">Naamgebruik kiezen</h1>
        </div>
      </div>

      {/* Main content */}
      <main className="max-w-4xl mx-auto px-6 py-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <h2 className="font-serif text-2xl font-bold text-gray-900 mb-6">
            Inleiding
          </h2>

          <div className="prose prose-blue max-w-none mb-8">
            <p className="text-gray-700 leading-relaxed mb-4">
              Met dit formulier kiest u welke achternaam u en uw partner willen bij uw huwelijk of 
              geregistreerd partnerschap.
            </p>

            <h3 className="font-sans text-lg font-semibold text-gray-900 mt-6 mb-3">
              Wat u doet in dit formulier
            </h3>
            <ul className="list-disc list-inside space-y-2 text-gray-700">
              <li>U kiest 2, 3 of 4 getuigen. Uw getuige is 18 jaar of ouder.</li>
              <li>U stuurt ook een digitale kopie van hun identiteitsbewijs op.</li>
            </ul>

            <div className="bg-blue-50 border-l-4 border-blue-600 p-4 mt-6">
              <h4 className="font-sans text-sm font-semibold text-blue-900 mb-2">
                DigiD
              </h4>
              <p className="text-sm text-blue-800">
                U en uw partner moeten dit formulier ondertekenen met DigiD.
              </p>
              <p className="text-sm text-blue-800 mt-2">
                Vraag DigiD aan als u dat nog niet heeft:{' '}
                <a 
                  href="https://digid.nl" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 underline"
                >
                  DigiD.nl
                </a>
              </p>
            </div>
          </div>

          <div className="flex justify-between items-center pt-6 border-t border-gray-200">
            <Link
              href={`/dossier/${dossierId}`}
              className="text-blue-600 hover:text-blue-800 font-sans text-sm"
            >
              ← Terug naar dossier
            </Link>
            <button
              onClick={() => router.push(`/dossier/${dossierId}/naamgebruik/partner1`)}
              className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-sans text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2"
            >
              Start naamgebruik kiezen →
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

