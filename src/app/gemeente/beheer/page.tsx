'use client';

import type { JSX } from 'react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { GemeenteLogoCompact } from '@/components/GemeenteLogo';

interface Aankondiging {
  aankondiging: {
    id: string;
    dossierId: string;
    partnerschap: boolean;
    valid: boolean;
    invalidReason: string | null;
    aangemaaktOp: string;
    gevalideerdOp: string | null;
    gevalideerdDoor: string | null;
  };
  dossier: {
    id: string;
    identificatie: string | null;
    status: string;
    createdAt: string;
  };
  partner1: {
    voornamen: string;
    geslachtsnaam: string;
  };
  partner2: {
    voornamen: string;
    geslachtsnaam: string;
  };
}

export default function GemeenteBeheerPage(): JSX.Element {
  const router = useRouter();
  const [aankondigingen, setAankondigingen] = useState<Aankondiging[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<'pending' | 'approved' | 'rejected' | 'all'>('pending');
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [showReasonModal, setShowReasonModal] = useState<{ show: boolean; reason: string; dossierId: string } | null>(null);

  useEffect(() => {
    fetchAankondigingen();
  }, [statusFilter]);

  const fetchAankondigingen = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/gemeente/aankondigingen?status=${statusFilter}`);
      const result = await response.json();

      if (result.success) {
        setAankondigingen(result.data);
      } else {
        setError(result.error || 'Fout bij ophalen aankondigingen');
      }
    } catch (err) {
      console.error('Error fetching aankondigingen:', err);
      setError('Er ging iets mis bij het ophalen van aankondigingen');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoedkeuren = async (dossierId: string) => {
    if (!confirm('Weet u zeker dat u deze aankondiging wilt goedkeuren?')) {
      return;
    }

    setProcessingId(dossierId);
    try {
      const response = await fetch(`/api/gemeente/aankondigingen/${dossierId}/goedkeuren`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const result = await response.json();

      if (result.success) {
        // Refresh list
        await fetchAankondigingen();
      } else {
        alert(result.error || 'Fout bij goedkeuren');
      }
    } catch (err) {
      console.error('Error approving:', err);
      alert('Er ging iets mis bij het goedkeuren');
    } finally {
      setProcessingId(null);
    }
  };

  const handleAfkeuren = async (dossierId: string) => {
    const reden = prompt('Geef de reden voor afkeuring op:');
    if (!reden || !reden.trim()) {
      return;
    }

    setProcessingId(dossierId);
    try {
      const response = await fetch(`/api/gemeente/aankondigingen/${dossierId}/afkeuren`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reden: reden.trim() }),
      });

      const result = await response.json();

      if (result.success) {
        // Refresh list
        await fetchAankondigingen();
      } else {
        alert(result.error || 'Fout bij afkeuren');
      }
    } catch (err) {
      console.error('Error rejecting:', err);
      alert('Er ging iets mis bij het afkeuren');
    } finally {
      setProcessingId(null);
    }
  };

  const handleForceerGoedkeuren = async (dossierId: string) => {
    if (!confirm('Weet u zeker dat u deze afgekeurde aankondiging alsnog wilt goedkeuren? Dit overschrijft de eerdere afkeuring EN negeerd alle automatische controles (showstoppers).')) {
      return;
    }

    setProcessingId(dossierId);
    try {
      const response = await fetch(`/api/gemeente/aankondigingen/${dossierId}/goedkeuren`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ force: true }), // Force flag to bypass showstoppers
      });

      const result = await response.json();

      if (result.success) {
        // Close modal if open
        setShowReasonModal(null);
        // Refresh list
        await fetchAankondigingen();
        alert('Aankondiging succesvol goedgekeurd (geforceerd)!');
      } else {
        alert(result.error || 'Fout bij goedkeuren');
      }
    } catch (err) {
      console.error('Error approving:', err);
      alert('Er ging iets mis bij het goedkeuren');
    } finally {
      setProcessingId(null);
    }
  };

  const handleToonReden = (reason: string, dossierId: string) => {
    setShowReasonModal({ show: true, reason, dossierId });
  };

  const formatDate = (dateStr: string | null): string => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleDateString('nl-NL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
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

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <GemeenteLogoCompact />
          <Link
            href="/"
            className="text-gray-600 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 rounded p-2"
          >
            Terug naar overzicht
          </Link>
        </div>
      </header>

      {/* Blue bar */}
      <div className="bg-blue-700 text-white">
        <div className="max-w-7xl mx-auto px-6 py-3">
          <h1 className="font-sans text-lg font-normal">Gemeente Beheer</h1>
        </div>
      </div>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Navigation tabs */}
        <div className="mb-6 border-b border-gray-200">
          <nav className="flex space-x-8">
            <button
              onClick={() => router.push('/gemeente/beheer')}
              className="border-b-2 border-blue-600 py-4 px-1 text-sm font-medium text-blue-600"
            >
              Aankondigingen
            </button>
            <button
              onClick={() => router.push('/gemeente/beheer/lookup')}
              className="border-b-2 border-transparent py-4 px-1 text-sm font-medium text-gray-500 hover:text-gray-700 hover:border-gray-300"
            >
              Tabellen
            </button>
            <Link
              href="/admin/gebruikers"
              className="border-b-2 border-transparent py-4 px-1 text-sm font-medium text-gray-500 hover:text-gray-700 hover:border-gray-300"
            >
              Gebruikersbeheer
            </Link>
          </nav>
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-6 bg-red-50 border-l-4 border-red-600 p-4 rounded">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Filter buttons */}
        <div className="mb-6 flex gap-2">
          <button
            onClick={() => setStatusFilter('pending')}
            className={`px-4 py-2 rounded font-sans text-sm font-medium ${
              statusFilter === 'pending'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            Te beoordelen
          </button>
          <button
            onClick={() => setStatusFilter('approved')}
            className={`px-4 py-2 rounded font-sans text-sm font-medium ${
              statusFilter === 'approved'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            Goedgekeurd
          </button>
          <button
            onClick={() => setStatusFilter('rejected')}
            className={`px-4 py-2 rounded font-sans text-sm font-medium ${
              statusFilter === 'rejected'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            Afgekeurd
          </button>
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-4 py-2 rounded font-sans text-sm font-medium ${
              statusFilter === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            Alles
          </button>
        </div>

        {/* Aankondigingen list */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          {aankondigingen.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <p>Geen aankondigingen gevonden</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Dossier
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Partners
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Aangemaakt
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acties
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {aankondigingen.map((item) => {
                    const isProcessing = processingId === item.dossier.id;
                    const isPending = !item.aankondiging.gevalideerdOp;
                    const isApproved = item.aankondiging.valid && item.aankondiging.gevalideerdOp;
                    const isRejected = !item.aankondiging.valid && item.aankondiging.gevalideerdOp;

                    return (
                      <tr key={item.dossier.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Link
                            href={`/dossier/${item.dossier.id}`}
                            className="text-sm font-medium text-blue-600 hover:text-blue-900 hover:underline"
                          >
                            {item.dossier.identificatie || item.dossier.id.substring(0, 8)}
                          </Link>
                        </td>
                        <td className="px-6 py-4">
                          <Link
                            href={`/dossier/${item.dossier.id}`}
                            className="block hover:underline"
                          >
                            <div className="text-sm text-gray-900">
                              {item.partner1.voornamen} {item.partner1.geslachtsnaam}
                            </div>
                            <div className="text-sm text-gray-500">
                              en {item.partner2.voornamen} {item.partner2.geslachtsnaam}
                            </div>
                          </Link>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm text-gray-900">
                            {item.aankondiging.partnerschap ? 'Partnerschap' : 'Huwelijk'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(item.aankondiging.aangemaaktOp)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {isPending && (
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                              Te beoordelen
                            </span>
                          )}
                          {isApproved && (
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                              Goedgekeurd
                            </span>
                          )}
                          {isRejected && (
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                              Afgekeurd
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex justify-end gap-2 items-center">
                            <Link
                              href={`/dossier/${item.dossier.id}`}
                              className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-900 font-medium"
                              title="Bekijk volledig huwelijksdossier"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                              Dossier
                            </Link>
                            {isPending && (
                              <>
                                <span className="text-gray-300">|</span>
                                <button
                                  onClick={() => handleGoedkeuren(item.dossier.id)}
                                  disabled={isProcessing}
                                  className="text-green-600 hover:text-green-900 disabled:opacity-50 font-medium"
                                >
                                  {isProcessing ? 'Bezig...' : 'Goedkeuren'}
                                </button>
                                <button
                                  onClick={() => handleAfkeuren(item.dossier.id)}
                                  disabled={isProcessing}
                                  className="text-red-600 hover:text-red-900 disabled:opacity-50 font-medium"
                                >
                                  Afkeuren
                                </button>
                              </>
                            )}
                            {isRejected && (
                              <>
                                <span className="text-gray-300">|</span>
                                {item.aankondiging.invalidReason && (
                                  <button
                                    onClick={() => handleToonReden(item.aankondiging.invalidReason!, item.dossier.id)}
                                    className="text-gray-600 hover:text-gray-900 text-xs underline"
                                  >
                                    Toon reden
                                  </button>
                                )}
                                <button
                                  onClick={() => handleForceerGoedkeuren(item.dossier.id)}
                                  disabled={isProcessing}
                                  className="text-orange-600 hover:text-orange-900 font-semibold disabled:opacity-50"
                                >
                                  {isProcessing ? 'Bezig...' : 'Forceer goedkeuring'}
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Reden Modal */}
        {showReasonModal?.show && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6">
              <div className="flex justify-between items-start mb-4">
                <h3 className="font-sans text-lg font-semibold text-gray-900">
                  Reden voor afkeuring
                </h3>
                <button
                  onClick={() => setShowReasonModal(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="bg-red-50 border-l-4 border-red-600 p-4 mb-6">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-red-800 whitespace-pre-wrap">
                      {showReasonModal.reason}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-center">
                <button
                  onClick={() => handleForceerGoedkeuren(showReasonModal.dossierId)}
                  disabled={processingId === showReasonModal.dossierId}
                  className="px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 font-sans text-sm font-medium disabled:opacity-50"
                >
                  {processingId === showReasonModal.dossierId ? 'Bezig...' : 'Forceer goedkeuring'}
                </button>
                <button
                  onClick={() => setShowReasonModal(null)}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 font-sans text-sm font-medium"
                >
                  Sluiten
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

