'use client';

import type { JSX } from 'react';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { GemeenteLogoCompact } from '@/components/GemeenteLogo';

export default function DatumTijdPage(): JSX.Element {
  const params = useParams();
  const router = useRouter();
  const dossierId = params.id as string;
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');

  // Load saved date/time from sessionStorage on mount
  useEffect(() => {
    const savedData = sessionStorage.getItem(`ceremonie-datum-tijd-${dossierId}`);
    if (savedData) {
      try {
        const data = JSON.parse(savedData);
        setSelectedDate(data.datum || '');
        setSelectedTime(data.startTijd || '');
      } catch (error) {
        console.error('Error loading saved date/time:', error);
      }
    }
  }, [dossierId]);

  const handleContinue = async () => {
    if (!selectedDate || !selectedTime) {
      alert('Selecteer eerst een datum en tijd');
      return;
    }

    // Save date and time to database (always)
    try {
      const response = await fetch(`/api/dossier/${dossierId}/ceremonie/datum-tijd`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          datum: selectedDate,
          startTijd: selectedTime,
          duurMinuten: 60, // Default duration
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Kon datum en tijd niet opslaan');
      }

      // Also save to sessionStorage as cache for faster access
      const datumTijdData = {
        datum: selectedDate,
        startTijd: selectedTime,
        duurMinuten: 60,
        timestamp: Date.now(),
      };
      sessionStorage.setItem(`ceremonie-datum-tijd-${dossierId}`, JSON.stringify(datumTijdData));

      // Navigate to next page
      router.push(`/dossier/${dossierId}/ceremonie/keuze`);
    } catch (error) {
      console.error('Error saving date/time:', error);
      alert('Er ging iets mis bij het opslaan van datum en tijd. Probeer het opnieuw.');
    }
  };

  const timeSlots = [
    '9:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00'
  ];

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
            href={`/dossier/${dossierId}/ceremonie/soort`}
            className="inline-flex items-center text-blue-600 hover:text-blue-700 font-sans text-sm mb-6"
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Vorige stap
          </Link>

          <h2 className="font-serif text-3xl font-bold text-gray-900 mb-2">Datum en tijd</h2>

          {/* Progress bar */}
          <div className="mb-8">
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div className="h-full bg-blue-600 rounded-full" style={{ width: '30%' }}></div>
            </div>
          </div>

          <p className="font-sans text-base text-gray-700 mb-6">
            Kies de gewenste datum en tijd voor uw ceremonie. Deze blijven zichtbaar en kunnen dit proces
            nog worden aangepast. Wilt u liever eerst een locatie of ambtenaar kiezen? Laat deze velden dan
            leeg.
          </p>

          <div className="mb-6">
            <label className="block font-sans text-base font-semibold text-gray-900 mb-2">
              Op welke datum moet de ceremonie plaatsvinden?{' '}
              <span className="font-normal text-gray-600">(niet verplicht)</span>
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full max-w-sm px-4 py-2 border-2 border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
              placeholder="dd-mm-jjjj"
            />
          </div>

          <div className="mb-8">
            <label className="block font-sans text-base font-semibold text-gray-900 mb-2">
              Op welk tijdstip moet de ceremonie plaatsvinden?{' '}
              <span className="font-normal text-gray-600">(niet verplicht)</span>
            </label>
            <select
              value={selectedTime}
              onChange={(e) => setSelectedTime(e.target.value)}
              className="w-full max-w-sm px-4 py-2 border-2 border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent appearance-none bg-white"
            >
              <option value="">Kies een tijdstip</option>
              {timeSlots.map((time) => (
                <option key={time} value={time}>
                  {time}
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-4">
            <button
              onClick={handleContinue}
              className="bg-blue-600 hover:bg-blue-700 text-white font-sans text-base px-6 py-3 rounded focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 transition-colors inline-flex items-center gap-2"
            >
              Volgende stap
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          <Link
            href={`/dossier/${dossierId}`}
            className="inline-block mt-4 text-blue-600 hover:underline font-sans text-sm"
          >
            Opslaan en later verder
          </Link>
        </div>
      </main>
    </div>
  );
}

