'use client';

import type { JSX } from 'react';
import { useEffect, useState } from 'react';
import Link from 'next/link';

interface CalendarTokenData {
  token: string;
  calendarFeedUrl: string;
  enabled: boolean;
  email?: string;
}

export default function BabsInstellingenPage(): JSX.Element {
  const [calendarToken, setCalendarToken] = useState<CalendarTokenData | null>(null);
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/babs/calendar-token');
      const result = await response.json();

      if (result.success) {
        setCalendarToken(result.data);
        setEmail(result.data.email || '');
      } else {
        setError(result.error || 'Kon instellingen niet ophalen');
      }
    } catch (err) {
      console.error('Error:', err);
      setError('Er ging iets mis');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveEmail = async () => {
    setIsSaving(true);
    setError(null);
    setSuccess(null);

    try {
      // Update email via beschikbaarheid API (we'll need to add this endpoint)
      // For now, we'll use a PUT to update the BABS record
      const response = await fetch('/api/babs/beschikbaarheid', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email.trim() || null,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setSuccess('Email adres succesvol bijgewerkt');
        // Refresh token data to get updated email
        await fetchData();
      } else {
        setError(result.error || 'Kon email niet bijwerken');
      }
    } catch (err) {
      console.error('Error saving email:', err);
      setError('Er ging iets mis bij het opslaan');
    } finally {
      setIsSaving(false);
    }
  };

  const handleRegenerateToken = async () => {
    if (!confirm('Weet u zeker dat u de calendar feed token wilt regenereren? U moet de nieuwe URL opnieuw toevoegen aan uw agenda.')) {
      return;
    }

    setIsSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch('/api/babs/calendar-token', {
        method: 'POST',
      });

      const result = await response.json();

      if (result.success) {
        setCalendarToken(result.data);
        setSuccess('Calendar token succesvol geregenereerd. Kopieer de nieuwe URL en voeg deze opnieuw toe aan uw agenda.');
      } else {
        setError(result.error || 'Kon token niet regenereren');
      }
    } catch (err) {
      console.error('Error regenerating token:', err);
      setError('Er ging iets mis bij het regenereren van token');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDisableFeed = async () => {
    if (!confirm('Weet u zeker dat u de calendar feed wilt uitschakelen? Uw agenda synchronisatie zal stoppen.')) {
      return;
    }

    setIsSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch('/api/babs/calendar-token', {
        method: 'DELETE',
      });

      const result = await response.json();

      if (result.success) {
        setSuccess('Calendar feed uitgeschakeld');
        await fetchData();
      } else {
        setError(result.error || 'Kon feed niet uitschakelen');
      }
    } catch (err) {
      console.error('Error disabling feed:', err);
      setError('Er ging iets mis bij het uitschakelen van feed');
    } finally {
      setIsSaving(false);
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

  if (error && !calendarToken) {
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
              Fout
            </h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <button
              onClick={fetchData}
              className="inline-block px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-sans text-sm font-medium"
            >
              Opnieuw proberen
            </button>
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
            BABS Portal - Instellingen
          </h1>
        </div>
      </div>

      {/* Main content */}
      <main className="max-w-4xl mx-auto px-6 py-12">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 space-y-8">
          {/* Success/Error Messages */}
          {success && (
            <div className="bg-green-50 border-l-4 border-green-600 p-4 rounded">
              <p className="text-sm text-green-900">{success}</p>
            </div>
          )}
          {error && (
            <div className="bg-red-50 border-l-4 border-red-600 p-4 rounded">
              <p className="text-sm text-red-900">{error}</p>
            </div>
          )}

          {/* Email Settings */}
          <section>
            <h2 className="font-serif text-xl font-bold text-gray-900 mb-4">
              📧 Email Notificaties
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email adres voor notificaties
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="uw.email@voorbeeld.nl"
                  className="w-full p-2 border border-gray-300 rounded"
                />
                <p className="mt-1 text-xs text-gray-500">
                  U ontvangt een email wanneer er een nieuwe ceremonie aan u wordt toegewezen.
                </p>
              </div>
              <button
                onClick={handleSaveEmail}
                disabled={isSaving}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-sans text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? 'Opslaan...' : 'Email opslaan'}
              </button>
            </div>
          </section>

          {/* Calendar Feed Settings */}
          {calendarToken && (
            <section>
              <h2 className="font-serif text-xl font-bold text-gray-900 mb-4">
                📅 Calendar Feed Instellingen
              </h2>
              <div className="space-y-4">
                <div className="bg-gray-50 p-4 rounded">
                  <p className="text-sm text-gray-700 mb-2">
                    <strong>Status:</strong>{' '}
                    {calendarToken.enabled ? (
                      <span className="text-green-600">Ingeschakeld</span>
                    ) : (
                      <span className="text-red-600">Uitgeschakeld</span>
                    )}
                  </p>
                  {calendarToken.enabled && (
                    <p className="text-xs text-gray-500 mt-2">
                      Uw calendar feed URL is actief. U kunt deze vinden op de beschikbaarheidspagina.
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <button
                    onClick={handleRegenerateToken}
                    disabled={isSaving || !calendarToken.enabled}
                    className="w-full px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700 font-sans text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSaving ? 'Bezig...' : '🔄 Token Regenereren'}
                  </button>
                  <p className="text-xs text-gray-500">
                    Genereer een nieuwe token als u denkt dat uw huidige token is gecompromitteerd.
                    U moet de nieuwe URL opnieuw toevoegen aan uw agenda.
                  </p>
                </div>

                {calendarToken.enabled && (
                  <div className="space-y-2">
                    <button
                      onClick={handleDisableFeed}
                      disabled={isSaving}
                      className="w-full px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 font-sans text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSaving ? 'Bezig...' : '❌ Calendar Feed Uitschakelen'}
                    </button>
                    <p className="text-xs text-gray-500">
                      Schakel de calendar feed uit om synchronisatie te stoppen. U kunt deze later weer inschakelen.
                    </p>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* Navigation */}
          <div className="mt-8 pt-6 border-t border-gray-200 flex justify-center gap-4">
            <Link
              href="/babs/beschikbaarheid"
              className="text-gray-600 hover:text-gray-900 text-sm"
            >
              ← Beschikbaarheid
            </Link>
            <span className="text-gray-300">|</span>
            <Link
              href="/babs/ceremonies"
              className="text-gray-600 hover:text-gray-900 text-sm"
            >
              Ceremonies
            </Link>
            <span className="text-gray-300">|</span>
            <Link
              href="/"
              className="text-gray-600 hover:text-gray-900 text-sm"
            >
              Terug naar home
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}

