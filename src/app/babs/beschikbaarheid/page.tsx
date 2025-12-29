'use client';

import type { JSX } from 'react';
import { useEffect, useState } from 'react';
import Link from 'next/link';

interface BabsData {
  id: string;
  naam: string;
  voornaam?: string;
  tussenvoegsel?: string;
  achternaam: string;
}

interface CalendarTokenData {
  token: string;
  calendarFeedUrl: string;
  enabled: boolean;
  email?: string;
}

export default function BabsBeschikbaarheidPage(): JSX.Element {
  const [data, setData] = useState<BabsData | null>(null);
  const [calendarToken, setCalendarToken] = useState<CalendarTokenData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingToken, setIsLoadingToken] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

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
        setError('Er ging iets mis');
      } finally {
        setIsLoading(false);
      }
    };

    const fetchCalendarToken = async () => {
      try {
        const response = await fetch('/api/babs/calendar-token');
        const result = await response.json();

        if (result.success) {
          setCalendarToken(result.data);
        }
      } catch (err) {
        console.error('Error fetching calendar token:', err);
      } finally {
        setIsLoadingToken(false);
      }
    };

    fetchData();
    fetchCalendarToken();
  }, []);

  const copyToClipboard = async () => {
    if (calendarToken?.calendarFeedUrl) {
      try {
        await navigator.clipboard.writeText(calendarToken.calendarFeedUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.error('Failed to copy:', err);
      }
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Laden...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center">
        <div className="max-w-md mx-auto px-6 py-8 bg-white rounded-lg shadow-sm border border-red-200">
          <div className="text-center">
            <svg
              className="w-12 h-12 text-red-600 mx-auto mb-4"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
            <h2 className="font-sans text-xl font-semibold text-gray-900 mb-2">
              Geen toegang
            </h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <Link
              href="/"
              className="inline-block px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-sans text-sm font-medium"
            >
              Terug naar home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Blue bar */}
      <div className="bg-blue-700 text-white">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <h1 className="font-sans text-lg font-normal">
            BABS Portal - Beschikbaarheidsbeheer
          </h1>
        </div>
      </div>

      {/* Main content */}
      <main className="max-w-4xl mx-auto px-6 py-12">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <div className="text-center mb-8">
            <h2 className="font-serif text-2xl font-bold text-gray-900 mb-2">
              Welkom, {data.voornaam} {data.tussenvoegsel ? `${data.tussenvoegsel} ` : ''}
              {data.achternaam}
            </h2>
            <p className="text-gray-600">
              Beheer uw beschikbaarheid voor ceremonies
            </p>
          </div>

          {/* Calendar Feed Section */}
          {!isLoadingToken && calendarToken && (
            <section className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
              <h2 className="font-serif text-xl font-bold text-gray-900 mb-4">
                📅 Agenda Synchronisatie
              </h2>
              
              <div className="space-y-4">
                <div className="bg-blue-50 border-l-4 border-blue-600 p-4 rounded">
                  <p className="text-sm text-blue-900 mb-2">
                    Synchroniseer uw geboekte ceremonies met uw persoonlijke agenda (Gmail, Outlook, Apple Calendar)
                  </p>
                  <div className="flex items-center gap-2">
                    <input 
                      readOnly 
                      value={calendarToken.calendarFeedUrl} 
                      className="flex-1 p-2 border border-gray-300 rounded text-sm font-mono bg-white"
                      onClick={(e) => (e.target as HTMLInputElement).select()}
                    />
                    <button 
                      onClick={copyToClipboard}
                      className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-sans text-sm font-medium transition-colors"
                    >
                      {copied ? '✓ Gekopieerd' : 'Kopieer'}
                    </button>
                  </div>
                </div>
                
                <details className="border border-gray-200 rounded p-4">
                  <summary className="cursor-pointer font-semibold text-gray-900">
                    Hoe voeg ik dit toe aan mijn agenda?
                  </summary>
                  <div className="mt-4 space-y-4">
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">📧 Gmail / Google Calendar</h4>
                      <ol className="list-decimal list-inside text-sm text-gray-700 space-y-1 ml-2">
                        <li>Ga naar <a href="https://calendar.google.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Google Calendar</a></li>
                        <li>Klik op het "+" icoon naast "Andere agenda's" in de linkerzijbalk</li>
                        <li>Kies "Via URL"</li>
                        <li>Plak de URL hierboven en klik op "Agenda toevoegen"</li>
                      </ol>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">📨 Outlook / Hotmail</h4>
                      <ol className="list-decimal list-inside text-sm text-gray-700 space-y-1 ml-2">
                        <li>Ga naar <a href="https://outlook.live.com/calendar" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Outlook Calendar</a></li>
                        <li>Klik op "Agenda toevoegen" in de linkerzijbalk</li>
                        <li>Kies "Abonneren via internet"</li>
                        <li>Plak de URL en klik op "Importeren"</li>
                      </ol>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">🍎 Apple Calendar (macOS / iOS)</h4>
                      <ol className="list-decimal list-inside text-sm text-gray-700 space-y-1 ml-2">
                        <li>Open de Calendar app</li>
                        <li>Kies "Bestand" → "Nieuwe agenda-abonnement" (macOS) of "Abonneren op agenda" (iOS)</li>
                        <li>Plak de URL hierboven</li>
                        <li>Klik op "Abonneren"</li>
                      </ol>
                    </div>
                  </div>
                </details>
              </div>
            </section>
          )}

          <div className="bg-blue-50 border-l-4 border-blue-600 p-6 rounded mb-8">
            <div className="flex items-start">
              <svg
                className="w-6 h-6 text-blue-600 mr-3 flex-shrink-0 mt-0.5"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                  clipRule="evenodd"
                />
              </svg>
              <div className="text-sm text-blue-900">
                <p className="font-semibold mb-2">📅 Beschikbaarheidskalender</p>
                <p>
                  Gebruik de kalender om uw beschikbaarheid in te stellen:
                </p>
                <ul className="list-disc ml-5 mt-2 space-y-1">
                  <li><strong>Terugkerende beschikbaarheid</strong> - Stel patronen in (bijv. elke maandag)</li>
                  <li><strong>Blokkeer datums</strong> - Markeer vakantiedagen of andere afwezigheden</li>
                  <li><strong>Beëdigingsperiode</strong> - Wordt automatisch getoond in de kalender</li>
                  <li><strong>Wijzigingshistorie</strong> - Zie alle eerdere aanpassingen</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="text-center">
            <Link
              href={`/gemeente/beheer/babs/${data.id}/calendar`}
              className="inline-flex items-center px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-sans text-base font-medium transition-colors shadow-sm"
            >
              <svg 
                className="w-5 h-5 mr-2" 
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
              Open Beschikbaarheidskalender
            </Link>
          </div>

          <div className="mt-8 pt-6 border-t border-gray-200 flex justify-center gap-4">
            <Link
              href="/babs/ceremonies"
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              Bekijk geboekte ceremonies →
            </Link>
            <span className="text-gray-300">|</span>
            <Link
              href="/babs/instellingen"
              className="text-gray-600 hover:text-gray-900 text-sm"
            >
              Instellingen
            </Link>
            <span className="text-gray-300">|</span>
            <Link
              href="/"
              className="text-gray-600 hover:text-gray-900 text-sm"
            >
              ← Terug naar home
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
