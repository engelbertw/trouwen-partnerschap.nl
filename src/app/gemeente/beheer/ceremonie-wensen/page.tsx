'use client';

import type { JSX } from 'react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface CeremonieWens {
  id: string;
  code: string;
  naam: string;
  omschrijving: string;
  prijsEuro: string;
  gratis: boolean;
  actief: boolean;
  volgorde: number;
}

export default function CeremonieWensenBeheerPage(): JSX.Element {
  const router = useRouter();
  const [wensen, setWensen] = useState<CeremonieWens[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState<Partial<CeremonieWens>>({});

  useEffect(() => {
    fetchWensen();
  }, []);

  const fetchWensen = async () => {
    try {
      const response = await fetch('/api/gemeente/ceremonie-wensen');
      if (response.ok) {
        const data = await response.json();
        setWensen(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching wensen:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleActief = async (id: string, currentActief: boolean) => {
    try {
      const response = await fetch(`/api/gemeente/ceremonie-wensen/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ actief: !currentActief }),
      });

      if (response.ok) {
        fetchWensen();
      }
    } catch (error) {
      console.error('Error toggling actief:', error);
    }
  };

  const handleEdit = (wens: CeremonieWens) => {
    setEditingId(wens.id);
    setFormData({
      code: wens.code,
      naam: wens.naam,
      omschrijving: wens.omschrijving,
      prijsEuro: wens.prijsEuro,
      gratis: wens.gratis,
      actief: wens.actief,
      volgorde: wens.volgorde,
    });
    setShowAddForm(true);
    
    // Scroll to form
    setTimeout(() => {
      const formElement = document.querySelector('[data-form-section]');
      if (formElement) {
        formElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };

  const handleCancelForm = () => {
    setShowAddForm(false);
    setEditingId(null);
    setFormData({});
  };

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const url = editingId
        ? `/api/gemeente/ceremonie-wensen/${editingId}`
        : `/api/gemeente/ceremonie-wensen`;
      
      const method = editingId ? 'PATCH' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (result.success) {
        await fetchWensen();
        handleCancelForm();
        alert(editingId ? 'Wens bijgewerkt!' : 'Wens aangemaakt!');
      } else {
        alert(result.error || 'Fout bij opslaan');
      }
    } catch (error) {
      console.error('Error saving:', error);
      alert('Er ging iets mis bij het opslaan');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Weet u zeker dat u deze wens wilt verwijderen?')) {
      return;
    }

    try {
      const response = await fetch(`/api/gemeente/ceremonie-wensen/${id}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (result.success) {
        await fetchWensen();
        alert('Wens verwijderd!');
      } else {
        alert(result.error || 'Fout bij verwijderen');
      }
    } catch (error) {
      console.error('Error deleting:', error);
      alert('Er ging iets mis bij het verwijderen');
    }
  };

  const formatPrice = (wens: CeremonieWens) => {
    if (wens.gratis) return 'Gratis';
    const price = parseFloat(wens.prijsEuro);
    return `€ ${price.toFixed(2).replace('.', ',')}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <p>Laden...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Blue bar */}
      <div className="bg-blue-700 text-white">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <h1 className="font-sans text-lg font-normal">Gemeente Beheer - Tabellen</h1>
          <Link
            href="/"
            className="text-white hover:text-blue-100 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 rounded px-3 py-2 text-sm"
          >
            ← Terug naar overzicht
          </Link>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Navigation tabs */}
        <div className="mb-6 border-b border-gray-200">
          <nav className="flex space-x-8">
            <button
              onClick={() => router.push('/gemeente/beheer')}
              className="border-b-2 border-transparent py-4 px-1 text-sm font-medium text-gray-500 hover:text-gray-700 hover:border-gray-300"
            >
              Aankondigingen
            </button>
            <button
              onClick={() => router.push('/gemeente/beheer/lookup')}
              className="border-b-2 border-blue-600 py-4 px-1 text-sm font-medium text-blue-600"
            >
              Tabellen
            </button>
          </nav>
        </div>

        {/* Sub-tabs for lookup types */}
        <div className="mb-6 flex gap-2">
          <button
            onClick={() => router.push('/gemeente/beheer/lookup?tab=locaties')}
            className="px-4 py-2 rounded font-sans text-sm font-medium bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
          >
            Locaties
          </button>
          <button
            onClick={() => router.push('/gemeente/beheer/lookup?tab=babs')}
            className="px-4 py-2 rounded font-sans text-sm font-medium bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
          >
            BABS
          </button>
          <button
            onClick={() => router.push('/gemeente/beheer/lookup?tab=type-ceremonie')}
            className="px-4 py-2 rounded font-sans text-sm font-medium bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
          >
            Type Ceremonie
          </button>
          <button
            onClick={() => router.push('/gemeente/beheer/lookup?tab=documenten')}
            className="px-4 py-2 rounded font-sans text-sm font-medium bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
          >
            Documenten
          </button>
          <button
            onClick={() => router.push('/gemeente/beheer/ceremonie-wensen')}
            className="px-4 py-2 rounded font-sans text-sm font-medium bg-blue-600 text-white"
          >
            Ceremoniewensen
          </button>
        </div>

        {/* Add/Edit Form */}
        {showAddForm && (
          <div className="mb-6 bg-white rounded-lg shadow-sm border border-gray-200 p-6" data-form-section>
            <h3 className="font-sans text-lg font-semibold text-gray-900 mb-4">
              {editingId ? 'Wens bewerken' : 'Nieuwe wens toevoegen'}
            </h3>
            <form onSubmit={handleSubmitForm} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Code *
                </label>
                <input
                  type="text"
                  required
                  value={formData.code || ''}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-600"
                  placeholder="bijv. RINGEN"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Naam *
                </label>
                <input
                  type="text"
                  required
                  value={formData.naam || ''}
                  onChange={(e) => setFormData({ ...formData, naam: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-600"
                  placeholder="bijv. Ringen uitwisselen"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Omschrijving *
                </label>
                <textarea
                  required
                  rows={3}
                  value={formData.omschrijving || ''}
                  onChange={(e) => setFormData({ ...formData, omschrijving: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-600"
                  placeholder="Beschrijving voor burgers"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Prijs (€)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.prijsEuro || '0.00'}
                    onChange={(e) => setFormData({ ...formData, prijsEuro: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-600"
                    placeholder="24.50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Volgorde
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.volgorde || 0}
                    onChange={(e) => setFormData({ ...formData, volgorde: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
              </div>
              
              <div className="flex gap-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.gratis || false}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      gratis: e.target.checked,
                      prijsEuro: e.target.checked ? '0.00' : formData.prijsEuro 
                    })}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700">Gratis</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.actief !== false}
                    onChange={(e) => setFormData({ ...formData, actief: e.target.checked })}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700">Actief</span>
                </label>
              </div>
              
              <div className="flex gap-2 pt-4">
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-sans text-sm font-medium"
                >
                  {editingId ? 'Bijwerken' : 'Toevoegen'}
                </button>
                <button
                  type="button"
                  onClick={handleCancelForm}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 font-sans text-sm font-medium"
                >
                  Annuleren
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-semibold">Ceremoniewensen</h2>
                <p className="text-sm text-gray-600 mt-1">
                  Beheer de beschikbare ceremoniewensen die burgers kunnen selecteren
                </p>
              </div>
              <button
                onClick={() => {
                  setShowAddForm(!showAddForm);
                  setEditingId(null);
                  setFormData({});
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
              >
                {showAddForm ? 'Annuleren' : '+ Nieuwe wens toevoegen'}
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Code
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Naam
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Omschrijving
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Prijs
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Volgorde
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Acties
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {wensen.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                      Geen ceremoniewensen gevonden
                    </td>
                  </tr>
                ) : (
                  wensen.map((wens) => (
                    <tr key={wens.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <span className="font-mono text-sm text-gray-900">{wens.code}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-medium text-gray-900">{wens.naam}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-600 line-clamp-2">
                          {wens.omschrijving}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-900">{formatPrice(wens)}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-900">{wens.volgorde}</span>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => toggleActief(wens.id, wens.actief)}
                          className={`px-2 py-1 text-xs rounded ${
                            wens.actief
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {wens.actief ? 'Actief' : 'Inactief'}
                        </button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleEdit(wens)}
                          className="text-blue-600 hover:text-blue-700 text-sm mr-4"
                        >
                          Bewerken
                        </button>
                        <button
                          onClick={() => handleDelete(wens.id)}
                          className="text-red-600 hover:text-red-700 text-sm"
                        >
                          Verwijderen
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}

