'use client';

import type { JSX } from 'react';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface BabsData {
  id: string;
  naam: string;
  voornaam?: string;
  tussenvoegsel?: string;
  achternaam: string;
  email?: string;
}

interface NavigationCard {
  title: string;
  description: string;
  href: string;
  icon: JSX.Element;
  color: string;
}

export default function BabsHomePage(): JSX.Element {
  const [data, setData] = useState<BabsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/babs/beschikbaarheid');
        const result = await response.json();

        if (result.success) {
          setData(result.data);
        } else {
          setError(result.error || 'Kon uw gegevens niet ophalen');
        }
      } catch (err) {
        console.error('Error:', err);
        setError('Er ging iets mis bij het ophalen van uw gegevens');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700 mb-4"></div>
          <p className="text-gray-600">Laden...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !data) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center">
        <div className="max-w-md mx-auto px-6">
          <div className="bg-red-50 border-l-4 border-red-600 rounded p-6">
            <div className="flex items-start">
              <svg
                className="w-6 h-6 text-red-600 mr-3 flex-shrink-0"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
              <div>
                <h3 className="text-sm font-bold text-red-900 mb-1">Fout</h3>
                <p className="text-sm text-red-800">{error}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const navigationCards: NavigationCard[] = [
        {
          title: 'Beschikbaarheid',
          description: 'Beheer uw beschikbaarheid voor trouwceremonies via de kalender',
          href: '/babs/beschikbaarheid',
          color: 'bg-green-50 border-green-200 hover:border-green-400',
          icon: (
            <svg
              className="w-8 h-8 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          ),
        },
        {
          title: 'Ceremonies',
          description: 'Bekijk uw geplande trouwceremonies en agenda',
          href: '/babs/ceremonies',
          color: 'bg-blue-50 border-blue-200 hover:border-blue-400',
          icon: (
            <svg
              className="w-8 h-8 text-blue-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          ),
        },
        {
          title: 'Instellingen',
          description: 'Beheer uw profiel, email en kalender synchronisatie',
          href: '/babs/instellingen',
          color: 'bg-purple-50 border-purple-200 hover:border-purple-400',
          icon: (
            <svg
              className="w-8 h-8 text-purple-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
          ),
        },
      ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Header */}
      <div className="bg-blue-700 text-white">
        <div className="max-w-6xl mx-auto px-6 py-6">
          <h1 className="font-sans text-2xl font-semibold">BABS Portal</h1>
          <p className="text-blue-100 mt-1">
            Buitengewoon Ambtenaar Burgerlijke Stand
          </p>
        </div>
      </div>

      {/* Main content */}
      <main className="max-w-6xl mx-auto px-6 py-12">
        {/* Welcome section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 mb-8">
          <h2 className="font-serif text-3xl font-bold text-gray-900 mb-2">
            Welkom, {data.voornaam} {data.tussenvoegsel ? `${data.tussenvoegsel} ` : ''}
            {data.achternaam}
          </h2>
          <p className="text-gray-600 text-lg">
            Beheer uw beschikbaarheid en bekijk uw geplande ceremonies
          </p>
        </div>

        {/* Navigation cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {navigationCards.map((card) => (
            <Link
              key={card.href}
              href={card.href}
              className={`block rounded-lg border-2 p-6 transition-all duration-200 ${card.color} hover:shadow-lg transform hover:-translate-y-1`}
            >
              <div className="flex flex-col items-center text-center">
                <div className="mb-4">{card.icon}</div>
                <h3 className="font-serif text-xl font-bold text-gray-900 mb-2">
                  {card.title}
                </h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  {card.description}
                </p>
              </div>
            </Link>
          ))}
        </div>

        {/* Quick info section */}
        <div className="mt-12 bg-blue-50 rounded-lg border border-blue-200 p-6">
          <div className="flex items-start">
            <svg
              className="w-6 h-6 text-blue-600 mr-3 flex-shrink-0 mt-1"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                clipRule="evenodd"
              />
            </svg>
            <div>
              <h3 className="font-bold text-blue-900 mb-1">Belangrijke informatie</h3>
              <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                <li>Houd uw beschikbaarheid actueel in de kalender</li>
                <li>U ontvangt automatisch notificaties voor nieuwe ceremonies</li>
                <li>Synchroniseer uw agenda via de kalender feed in Instellingen</li>
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

