import type { Metadata } from 'next';
import type { JSX } from 'react';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Huwelijk of partnerschap aankondigen - Gemeente',
  description: 'Kondig uw huwelijk of partnerschap aan bij de gemeente',
  openGraph: {
    locale: 'nl_NL',
  },
};

/**
 * Landing page voor het aankondigen van een huwelijk of partnerschap
 * Biedt informatie over DigiD authenticatie en het opslaan van voortgang
 */
export default function AankondigingInleiding(): JSX.Element {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-blue-100">
      {/* Page header with title */}
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
          {/* Main heading */}
          <h2 className="font-serif text-3xl sm:text-4xl font-bold mb-6">
            Huwelijk of partnerschap aankondigen
          </h2>

          {/* Introduction text */}
          <p className="text-base leading-relaxed mb-8 text-gray-700">
            Met dit formulier kunt u uw huwelijk of partnerschap aankondigen.
          </p>

          {/* DigiD or eIDAS section */}
          <section className="mb-8">
            <h3 className="font-sans text-xl font-bold mb-3">
              DigiD of eIDAS
            </h3>
            <p className="text-base leading-relaxed mb-3 text-gray-700">
              U moet inloggen met DigiD. Uw partner moet ook inloggen. Uw partner kan 
              inloggen met DigiD of eIDAS. Vraag DigiD aan als u dat nog niet heeft:{' '}
              <a 
                href="https://www.digid.nl" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-[#2e75d4] underline hover:text-[#4d8ada] focus:outline-none focus:ring-2 focus:ring-[#2e75d4] focus:ring-offset-2"
              >
                DigiD.nl
              </a>
            </p>
            <p className="text-base leading-relaxed text-gray-700">
              Sommige gegevens van u zijn bij ons bekend. Er zijn ook gegevens die we niet 
              kunnen zien via DigiD of eIDAS. Of we mogen die niet bekijken bij andere 
              instanties. Die moet u daarom zelf invullen of opsturen.
            </p>
          </section>

          {/* Save and continue later section */}
          <section className="mb-8">
            <h3 className="font-sans text-xl font-bold mb-3">
              Opslaan en later verder
            </h3>
            <p className="text-base leading-relaxed text-gray-700">
              Wilt u pauzeren tijdens het invullen? Klik dan op &apos;Opslaan en later verder&apos;. 
              U krijgt dan een e-mail met een link naar uw dossier. U kunt op elk moment 
              via deze link of via de website van de gemeente inloggen met DigiD om verder 
              te gaan.
            </p>
          </section>

          {/* Call to action button */}
          <div className="mt-8">
            <Link
              href="/000-aankondiging/001-start"
              className="inline-flex items-center justify-center gap-2 bg-[#2e75d4] text-white font-sans text-base font-bold px-6 py-3 rounded hover:bg-[#4d8ada] focus:outline-none focus:ring-2 focus:ring-[#2e75d4] focus:ring-offset-2 transition-colors"
            >
              Start aankondiging
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
            </Link>
          </div>
        </article>
      </main>
    </div>
  );
}
