'use client';

import type { JSX } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { GemeenteLogoCompact } from '@/components/GemeenteLogo';

export default function CeremonieInleidingPage(): JSX.Element {
  const params = useParams();
  const router = useRouter();
  const dossierId = params.id as string;

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
          <h1 className="font-sans text-lg font-normal">Ceremonie plannen</h1>
        </div>
      </div>

      {/* Main content */}
      <main className="max-w-3xl mx-auto px-6 py-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <h2 className="font-serif text-3xl font-bold text-gray-900 mb-6">Inleiding</h2>

          <p className="font-sans text-base text-gray-700 mb-6">
            Met dit formulier plant u uw ceremonie.
          </p>

          <div className="mb-8">
            <h3 className="font-sans text-lg font-semibold text-gray-900 mb-3">
              Wat u doet in dit formulier
            </h3>
            <ul className="list-disc list-inside space-y-2 font-sans text-base text-gray-700 ml-2">
              <li>U kiest het soort ceremonie en een datum.</li>
              <li>U geeft uw locatie door.</li>
              <li>U kiest een trouwambtenaar</li>
              <li>En u geeft uw ceremoniewensen door</li>
            </ul>
          </div>

          <div className="mb-8">
            <h3 className="font-sans text-lg font-semibold text-gray-900 mb-3">
              Eigen trouwambtenaar
            </h3>
            <p className="font-sans text-base text-gray-700">
              U kunt kiezen voor een gemeentelijke trouwambtenaar. Of u kunt uw eigen trouwambtenaar
              meenemen (BABS).
            </p>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded p-4 mb-8">
            <p className="font-sans text-sm text-gray-700">
              <strong>Let op:</strong> een eigen trouwambtenaar moet eerst beëdigd zijn. Dit duurt vaak
              lang. Houd rekening met minimaal 4 maanden.
            </p>
          </div>

          <div className="mb-8">
            <h3 className="font-sans text-lg font-semibold text-gray-900 mb-3">
              Opslaan en later verder
            </h3>
            <p className="font-sans text-base text-gray-700">
              Wilt u tijdens het invullen iets opzoeken of even pauzeren? Klik dan op &apos;Opslaan en later
              verder&apos;. U kunt op elk moment met DigiD inloggen op uw dossier om verder te gaan.
            </p>
          </div>

          <button
            onClick={() => router.push(`/dossier/${dossierId}/ceremonie/soort`)}
            className="bg-blue-600 hover:bg-blue-700 text-white font-sans text-base px-6 py-3 rounded focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 transition-colors inline-flex items-center gap-2"
          >
            Start met ceremonie plannen
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </main>
    </div>
  );
}

