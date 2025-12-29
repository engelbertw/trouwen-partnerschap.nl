'use client';

import type { JSX } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { GemeenteLogoCompact } from '@/components/GemeenteLogo';

export default function CeremonieKeuzePage(): JSX.Element {
  const params = useParams();
  const router = useRouter();
  const dossierId = params.id as string;

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
            href={`/dossier/${dossierId}/ceremonie/datum`}
            className="inline-flex items-center text-blue-600 hover:text-blue-700 font-sans text-sm mb-6"
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Vorige stap
          </Link>

          <h2 className="font-serif text-3xl font-bold text-gray-900 mb-2">Ceremonie plannen</h2>

          {/* Progress bar */}
          <div className="mb-8">
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div className="h-full bg-blue-600 rounded-full" style={{ width: '45%' }}></div>
            </div>
          </div>

          <p className="font-sans text-base text-gray-700 mb-6">
            <strong>Waar wilt u mee beginnen?</strong>
          </p>

          <p className="font-sans text-base text-gray-700 mb-6">
            U kunt eerst uw gewenste locatie of ambtenaar kiezen.<br />
            Uw opgegeven ceremoniedatum en -tijd blijven zichtbaar en kunnen in de volgende stappen nog
            worden aangepast.
          </p>

          <div className="space-y-4 mb-8">
            <button
              onClick={() => router.push(`/dossier/${dossierId}/ceremonie/locatie`)}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-sans text-base px-6 py-4 rounded focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 transition-colors flex items-center justify-between"
            >
              <span>Locatie kiezen</span>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>

            <button
              onClick={() => router.push(`/dossier/${dossierId}/ceremonie/ambtenaar`)}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-sans text-base px-6 py-4 rounded focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 transition-colors flex items-center justify-between"
            >
              <span>Ambtenaar kiezen</span>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          <Link
            href={`/dossier/${dossierId}`}
            className="inline-block text-blue-600 hover:underline font-sans text-sm"
          >
            Opslaan en later verder
          </Link>
        </div>
      </main>
    </div>
  );
}

