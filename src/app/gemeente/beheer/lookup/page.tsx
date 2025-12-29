'use client';

import type { JSX } from 'react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

type LookupType = 'locaties' | 'babs' | 'type-ceremonie' | 'documenten';

interface LookupItem {
  id: string;
  [key: string]: any;
}

export default function LookupBeheerPage(): JSX.Element {
  const router = useRouter();
  const searchParams = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
  const tabFromUrl = searchParams.get('tab') as LookupType | null;
  
  const [activeTab, setActiveTab] = useState<LookupType>(tabFromUrl || 'locaties');
  const [items, setItems] = useState<LookupItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingItem, setEditingItem] = useState<LookupItem | null>(null);
  
  // Form state for new/edit
  const [formData, setFormData] = useState<Record<string, any>>({});
  
  // State for target editing modal
  const [editingTarget, setEditingTarget] = useState<{ babsId: string; naam: string; currentTarget: number | null } | null>(null);
  const [targetInput, setTargetInput] = useState<string>('');

  // Update URL when tab changes
  const handleTabChange = (tab: LookupType) => {
    setActiveTab(tab);
    const url = new URL(window.location.href);
    url.searchParams.set('tab', tab);
    window.history.pushState({}, '', url.toString());
  };

  useEffect(() => {
    fetchItems();
    setShowAddForm(false);
    setEditingItem(null);
    setFormData({});
  }, [activeTab]);

  const fetchItems = async () => {
    setIsLoading(true);
    setError(null);
    try {
      console.log(`[DEBUG] Fetching ${activeTab}...`);
      const response = await fetch(`/api/gemeente/lookup/${activeTab}`);
      console.log(`[DEBUG] Response status: ${response.status}`);
      const result = await response.json();
      console.log(`[DEBUG] Result:`, result);

      if (result.success) {
        console.log(`[DEBUG] Setting ${result.data.length} items`);
        setItems(result.data);
      } else {
        console.error(`[DEBUG] Error from API:`, result.error);
        setError(result.error || 'Fout bij ophalen gegevens');
      }
    } catch (err) {
      console.error('Error fetching items:', err);
      setError('Er ging iets mis bij het ophalen van gegevens');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Weet u zeker dat u dit item wilt verwijderen?')) {
      return;
    }

    try {
      const response = await fetch(`/api/gemeente/lookup/${activeTab}/${id}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (result.success) {
        await fetchItems();
      } else {
        alert(result.error || 'Fout bij verwijderen');
      }
    } catch (err) {
      console.error('Error deleting:', err);
      alert('Er ging iets mis bij het verwijderen');
    }
  };

  const handleUpdateTarget = async (babsId: string, jaar: number, targetCeremonies: number) => {
    if (isNaN(targetCeremonies) || targetCeremonies < 0) {
      alert('Target moet een positief getal zijn');
      return;
    }

    try {
      const response = await fetch(`/api/gemeente/babs/${babsId}/target`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jaar, targetCeremonies }),
      });

      const result = await response.json();

      if (result.success) {
        await fetchItems(); // Refresh list
        setEditingTarget(null);
        setTargetInput('');
        alert('Target succesvol bijgewerkt!');
      } else {
        alert(result.error || 'Fout bij bijwerken target');
      }
    } catch (err) {
      console.error('Error updating target:', err);
      alert('Er ging iets mis bij het bijwerken van de target');
    }
  };

  const openTargetModal = (babsId: string, naam: string, currentTarget: number | null) => {
    setEditingTarget({ babsId, naam, currentTarget });
    setTargetInput(currentTarget ? String(currentTarget) : '40');
  };

  const handleTargetSubmit = () => {
    if (!editingTarget) return;
    
    const parsedTarget = parseInt(targetInput);
    if (isNaN(parsedTarget) || parsedTarget < 0) {
      alert('Target moet een positief getal zijn');
      return;
    }

    const currentYear = new Date().getFullYear();
    handleUpdateTarget(editingTarget.babsId, currentYear, parsedTarget);
  };

  const handleEdit = (item: LookupItem) => {
    console.log('[DEBUG] handleEdit called with item:', item);
    
    // Normalize the item data for form
    const normalizedData: Record<string, any> = { ...item };
    
    // Ensure talen is always an array (for both type-ceremonie and babs)
    if (normalizedData.talen) {
      if (typeof normalizedData.talen === 'string') {
        try {
          normalizedData.talen = JSON.parse(normalizedData.talen);
        } catch {
          normalizedData.talen = ['nl'];
        }
      } else if (!Array.isArray(normalizedData.talen)) {
        normalizedData.talen = ['nl'];
      }
    } else {
      normalizedData.talen = ['nl'];
    }
    
    // Ensure other JSONB fields are handled correctly
    if (normalizedData.beschikbaarheid && typeof normalizedData.beschikbaarheid === 'string') {
      try {
        normalizedData.beschikbaarheid = JSON.parse(normalizedData.beschikbaarheid);
      } catch {
        normalizedData.beschikbaarheid = {};
      }
    }
    
    setEditingItem(item);
    setFormData(normalizedData);
    setShowAddForm(true);
    console.log('[DEBUG] showAddForm set to true, editingItem set, normalizedData:', normalizedData);
    
    // Scroll to form after a short delay to ensure it's rendered
    setTimeout(() => {
      const formElement = document.querySelector('[data-form-section]');
      if (formElement) {
        formElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };

  const handleCancelForm = () => {
    setShowAddForm(false);
    setEditingItem(null);
    setFormData({});
  };

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Extra validatie voor BABS met status 'beedigd'
    if (activeTab === 'babs' && formData.status === 'beedigd') {
      if (!formData.beedigdVanaf || !formData.beedigdTot) {
        alert('⚠️ Bij status "Beedigd" zijn beide beëdiging datums (vanaf en tot) verplicht.');
        return;
      }
    }
    
    try {
      const url = editingItem
        ? `/api/gemeente/lookup/${activeTab}/${editingItem.id}`
        : `/api/gemeente/lookup/${activeTab}`;
      
      const method = editingItem ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (result.success) {
        await fetchItems();
        handleCancelForm();
        
        // Show success message with Clerk info for BABS
        if (activeTab === 'babs' && !editingItem) {
          if (result.clerkUserId) {
            alert(`✅ BABS succesvol aangemaakt!\n\n${result.message}\n\nClerk User ID: ${result.clerkUserId}`);
          } else if (result.warning) {
            alert(`⚠️ BABS aangemaakt maar:\n\n${result.warning}`);
          } else {
            alert(`✅ ${result.message || 'BABS succesvol aangemaakt'}`);
          }
        }
      } else {
        alert(result.error || 'Fout bij opslaan');
      }
    } catch (err) {
      console.error('Error saving:', err);
      alert('Er ging iets mis bij het opslaan');
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

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
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

      {/* Main content */}
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
            onClick={() => handleTabChange('locaties')}
            className={`px-4 py-2 rounded font-sans text-sm font-medium ${
              activeTab === 'locaties'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            Locaties
          </button>
          <button
            onClick={() => handleTabChange('babs')}
            className={`px-4 py-2 rounded font-sans text-sm font-medium ${
              activeTab === 'babs'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            BABS
          </button>
          <button
            onClick={() => handleTabChange('type-ceremonie')}
            className={`px-4 py-2 rounded font-sans text-sm font-medium ${
              activeTab === 'type-ceremonie'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            Type Ceremonie
          </button>
          <button
            onClick={() => handleTabChange('documenten')}
            className={`px-4 py-2 rounded font-sans text-sm font-medium ${
              activeTab === 'documenten'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            Documenten
          </button>
          <button
            onClick={() => router.push('/gemeente/beheer/ceremonie-wensen')}
            className="px-4 py-2 rounded font-sans text-sm font-medium bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
          >
            Ceremoniewensen
          </button>
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

        {/* Add/Edit Form */}
        {showAddForm && (
          <div className="mb-6 bg-white rounded-lg shadow-sm border border-gray-200 p-6" data-form-section>
            <h3 className="font-sans text-lg font-semibold text-gray-900 mb-4">
              {editingItem ? 'Bewerken' : 'Nieuw toevoegen'}
            </h3>
            <form onSubmit={handleSubmitForm} className="space-y-4">
              {activeTab === 'documenten' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Code *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.code || ''}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-600"
                      placeholder="bijv. extra-akte"
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
                      placeholder="bijv. Extra huwelijksakte"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Omschrijving
                    </label>
                    <textarea
                      value={formData.omschrijving || ''}
                      onChange={(e) => setFormData({ ...formData, omschrijving: e.target.value })}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-600"
                      placeholder="Beschrijving voor burgers"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Papier Type *
                    </label>
                    <select
                      required
                      value={formData.papierType || ''}
                      onChange={(e) => setFormData({ ...formData, papierType: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-600"
                    >
                      <option value="">Selecteer type</option>
                      <option value="trouwboekje">Trouwboekje</option>
                      <option value="geboorteakte">Geboorteakte</option>
                      <option value="nationaliteitsverklaring">Nationaliteitsverklaring</option>
                      <option value="bewijs_van_nederlanderschap">Bewijs van Nederlanderschap</option>
                      <option value="uittreksel">Uittreksel</option>
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Prijs (in eurocenten)
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={formData.prijsCents || 0}
                        onChange={(e) => setFormData({ ...formData, prijsCents: parseInt(e.target.value) || 0 })}
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-600"
                        placeholder="bijv. 1710 voor €17,10"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        {formData.prijsCents ? `€ ${(formData.prijsCents / 100).toFixed(2).replace('.', ',')}` : '€ 0,00'}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Volgorde
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={formData.volgorde || 1}
                        onChange={(e) => setFormData({ ...formData, volgorde: parseInt(e.target.value) || 1 })}
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-600"
                      />
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.gratis || false}
                        onChange={(e) => setFormData({ ...formData, gratis: e.target.checked, prijsCents: e.target.checked ? 0 : formData.prijsCents })}
                        className="mr-2"
                      />
                      <span className="text-sm text-gray-700">Gratis</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.verplicht || false}
                        onChange={(e) => setFormData({ ...formData, verplicht: e.target.checked })}
                        className="mr-2"
                      />
                      <span className="text-sm text-gray-700">Verplicht</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.actief !== undefined ? formData.actief : true}
                        onChange={(e) => setFormData({ ...formData, actief: e.target.checked })}
                        className="mr-2"
                      />
                      <span className="text-sm text-gray-700">Actief</span>
                    </label>
                  </div>
                </>
              )}

              {activeTab === 'locaties' && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Code *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.code || ''}
                        onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-600"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Type *
                      </label>
                      <select
                        required
                        value={formData.type || ''}
                        onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-600"
                      >
                        <option value="">Selecteer type</option>
                        <option value="stadhuis">Stadhuis</option>
                        <option value="stadsloket">Stadsloket</option>
                        <option value="buitenlocatie">Buitenlocatie</option>
                      </select>
                    </div>
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
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Adres
                    </label>
                    <input
                      type="text"
                      value={formData.adres || ''}
                      onChange={(e) => setFormData({ ...formData, adres: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Afbeelding URL
                    </label>
                    <input
                      type="url"
                      value={formData.afbeeldingUrl || ''}
                      onChange={(e) => setFormData({ ...formData, afbeeldingUrl: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-600"
                      placeholder="https://voorbeeld.nl/afbeelding.jpg"
                    />
                    {formData.afbeeldingUrl && (
                      <div className="mt-2">
                        <p className="text-xs text-gray-600 mb-1">Preview:</p>
                        <img 
                          src={formData.afbeeldingUrl} 
                          alt="Preview" 
                          className="w-48 h-32 object-cover rounded border border-gray-300"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="150"%3E%3Crect fill="%23ddd" width="200" height="150"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" fill="%23999"%3EInvalid URL%3C/text%3E%3C/svg%3E';
                          }}
                        />
                      </div>
                    )}
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Capaciteit
                      </label>
                      <input
                        type="number"
                        value={formData.capaciteit || 50}
                        onChange={(e) => setFormData({ ...formData, capaciteit: parseInt(e.target.value) })}
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-600"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Prijs (cents)
                      </label>
                      <input
                        type="number"
                        value={formData.prijsCents || 0}
                        onChange={(e) => setFormData({ ...formData, prijsCents: parseInt(e.target.value) })}
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-600"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Volgorde
                      </label>
                      <input
                        type="number"
                        value={formData.volgorde || 0}
                        onChange={(e) => setFormData({ ...formData, volgorde: parseInt(e.target.value) })}
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-600"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.actief !== undefined ? formData.actief : true}
                        onChange={(e) => setFormData({ ...formData, actief: e.target.checked })}
                        className="mr-2"
                      />
                      <span className="text-sm text-gray-700">Actief</span>
                    </label>
                  </div>
                </>
              )}

              {activeTab === 'babs' && (
                <>
                  {/* Code */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Code
                    </label>
                    <input
                      type="text"
                      value={formData.code || ''}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-600"
                      placeholder="bijv. babs_001"
                    />
                    <p className="text-xs text-gray-500 mt-1">Unieke code voor deze BABS (optioneel)</p>
                  </div>

                  {/* Naam (algemeen) */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Naam (weergave) *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.naam || ''}
                      onChange={(e) => setFormData({ ...formData, naam: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-600"
                      placeholder="Volledige naam voor weergave"
                    />
                    <p className="text-xs text-gray-500 mt-1">Naam zoals deze getoond wordt aan burgers</p>
                  </div>

                  {/* Voornaam, Tussenvoegsel, Achternaam */}
                  <div className="grid grid-cols-12 gap-4">
                    <div className="col-span-5">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Voornaam
                      </label>
                      <input
                        type="text"
                        value={formData.voornaam || ''}
                        onChange={(e) => setFormData({ ...formData, voornaam: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-600"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Tussenvoegsel
                      </label>
                      <input
                        type="text"
                        value={formData.tussenvoegsel || ''}
                        onChange={(e) => setFormData({ ...formData, tussenvoegsel: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-600"
                        placeholder="van, de"
                      />
                    </div>
                    <div className="col-span-5">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Achternaam *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.achternaam || ''}
                        onChange={(e) => setFormData({ ...formData, achternaam: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-600"
                      />
                    </div>
                  </div>

                  {/* Email voor Clerk account */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email adres {!editingItem && <span className="text-red-600">*</span>}
                    </label>
                    <input
                      type="email"
                      required={!editingItem}
                      value={formData.email || ''}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-600"
                      placeholder="naam@voorbeeld.nl"
                    />
                    {!editingItem && (
                      <p className="text-xs text-gray-500 mt-1">
                        Verplicht voor het aanmaken van een gebruikersaccount. De BABS ontvangt een email om in te loggen.
                      </p>
                    )}
                  </div>

                  {/* Talen */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Talen * (minimaal 1 taal vereist)
                    </label>
                    <div className="grid grid-cols-4 gap-3">
                      {['nl', 'en', 'de', 'fr'].map((taal) => {
                        const taalNamen: Record<string, string> = {
                          nl: 'Nederlands',
                          en: 'Engels',
                          de: 'Duits',
                          fr: 'Frans',
                        };
                        const currentTalen = Array.isArray(formData.talen) ? formData.talen : (formData.talen ? JSON.parse(formData.talen) : ['nl']);
                        return (
                          <label key={taal} className="flex items-center">
                            <input
                              type="checkbox"
                              checked={currentTalen.includes(taal)}
                              onChange={(e) => {
                                const newTalen = e.target.checked
                                  ? [...currentTalen, taal]
                                  : currentTalen.filter((t: string) => t !== taal);
                                setFormData({ ...formData, talen: newTalen.length > 0 ? newTalen : ['nl'] });
                              }}
                              className="mr-2"
                            />
                            <span className="text-sm text-gray-700">{taalNamen[taal]}</span>
                          </label>
                        );
                      })}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Selecteer de talen die deze BABS spreekt
                    </p>
                  </div>

                  {/* Checkbox voor Clerk account (alleen bij nieuw aanmaken) */}
                  {!editingItem && (
                    <div className="bg-blue-50 border border-blue-200 rounded p-4">
                      <label className="flex items-start cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.createClerkAccount !== false}
                          onChange={(e) => setFormData({ ...formData, createClerkAccount: e.target.checked })}
                          className="mr-3 mt-1"
                        />
                        <div>
                          <span className="text-sm font-medium text-gray-900">Maak automatisch een gebruikersaccount aan</span>
                          <p className="text-xs text-gray-600 mt-1">
                            ✓ Aangevinkt: BABS ontvangt een email om in te loggen op het systeem (rol: babs_admin).<br />
                            ✗ Uitgevinkt: Alleen BABS gegevens worden opgeslagen zonder login mogelijkheid.
                          </p>
                        </div>
                      </label>
                    </div>
                  )}

                  {/* Status */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Status
                    </label>
                    <select
                      value={formData.status || 'in_aanvraag'}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-600"
                    >
                      <option value="in_aanvraag">In aanvraag</option>
                      <option value="beedigd">Beedigd</option>
                      <option value="ongeldig">Ongeldig</option>
                    </select>
                    {(formData.status === 'beedigd') && (
                      <p className="text-xs text-amber-600 mt-1 font-medium">
                        ⚠️ Bij status "Beedigd" zijn beide beëdiging datums verplicht
                      </p>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Beedigd vanaf {(formData.status === 'beedigd') && <span className="text-red-600">*</span>}
                      </label>
                      <input
                        type="date"
                        required={formData.status === 'beedigd'}
                        value={formData.beedigdVanaf || ''}
                        onChange={(e) => setFormData({ ...formData, beedigdVanaf: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-600"
                      />
                      <p className="text-xs text-gray-500 mt-1">Datum van beëdiging</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Beedigd tot {(formData.status === 'beedigd') && <span className="text-red-600">*</span>}
                      </label>
                      <input
                        type="date"
                        required={formData.status === 'beedigd'}
                        value={formData.beedigdTot || ''}
                        onChange={(e) => setFormData({ ...formData, beedigdTot: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-600"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        {(formData.status === 'beedigd') ? 'Einddatum beëdiging (verplicht voor status beedigd)' : 'Einddatum beëdiging (optioneel)'}
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Beschikbaar vanaf
                      </label>
                      <input
                        type="date"
                        value={formData.beschikbaarVanaf || ''}
                        onChange={(e) => setFormData({ ...formData, beschikbaarVanaf: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-600"
                      />
                      <p className="text-xs text-gray-500 mt-1">Vanaf wanneer inzetbaar voor ceremonies</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Beschikbaar tot
                      </label>
                      <input
                        type="date"
                        value={formData.beschikbaarTot || ''}
                        onChange={(e) => setFormData({ ...formData, beschikbaarTot: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-600"
                      />
                      <p className="text-xs text-gray-500 mt-1">Tot wanneer inzetbaar (optioneel)</p>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Opmerking beschikbaarheid
                    </label>
                    <textarea
                      value={formData.opmerkingBeschikbaarheid || ''}
                      onChange={(e) => setFormData({ ...formData, opmerkingBeschikbaarheid: e.target.value })}
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-600"
                      placeholder="bijv. Alleen op woensdag beschikbaar in december"
                    />
                  </div>

                  {/* Ceremonie Target (alleen bij nieuw aanmaken) */}
                  {!editingItem && (
                    <div className="bg-green-50 border border-green-200 rounded p-4">
                      <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center">
                        <span className="mr-2">🎯</span>
                        Jaarlijks Ceremonie Target
                      </h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Jaar
                          </label>
                          <input
                            type="number"
                            value={formData.targetJaar || new Date().getFullYear()}
                            onChange={(e) => setFormData({ ...formData, targetJaar: parseInt(e.target.value) })}
                            min={new Date().getFullYear()}
                            max={new Date().getFullYear() + 5}
                            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-600"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Aantal ceremonies
                          </label>
                          <input
                            type="number"
                            value={formData.targetCeremonies || 40}
                            onChange={(e) => setFormData({ ...formData, targetCeremonies: parseInt(e.target.value) })}
                            min={0}
                            max={200}
                            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-600"
                          />
                        </div>
                      </div>
                      <p className="text-xs text-gray-600 mt-2">
                        💡 Hoeveel ceremonies deze BABS naar verwachting dit jaar voor deze gemeente uitvoert (optioneel)
                      </p>
                    </div>
                  )}
                  
                  <div>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.actief !== undefined ? formData.actief : true}
                        onChange={(e) => setFormData({ ...formData, actief: e.target.checked })}
                        className="mr-2"
                      />
                      <span className="text-sm text-gray-700">Actief</span>
                    </label>
                  </div>
                </>
              )}

              {activeTab === 'type-ceremonie' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Code *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.code || ''}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-600"
                      placeholder="bijv. gratis"
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
                      placeholder="bijv. Gratis Ceremonie"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Omschrijving (kort)
                    </label>
                    <textarea
                      value={formData.omschrijving || ''}
                      onChange={(e) => setFormData({ ...formData, omschrijving: e.target.value })}
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-600"
                      placeholder="Korte beschrijving"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Uitgebreide omschrijving
                    </label>
                    <textarea
                      value={formData.uitgebreideOmschrijving || ''}
                      onChange={(e) => setFormData({ ...formData, uitgebreideOmschrijving: e.target.value })}
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-600"
                      placeholder="bijv. De gratis ceremonie duurt 10 minuten en is op het stadsloket. Deze is in het Nederlands of Engels. Voor de gratis ceremonie geldt een lange wachttijd."
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Deze tekst wordt getoond aan burgers bij het kiezen van een ceremonie type
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Talen * (minimaal 1 taal vereist)
                    </label>
                    <div className="grid grid-cols-4 gap-3">
                      {['nl', 'en', 'de', 'fr'].map((taal) => {
                        const taalNamen: Record<string, string> = {
                          nl: 'Nederlands',
                          en: 'Engels',
                          de: 'Duits',
                          fr: 'Frans',
                        };
                        const currentTalen = Array.isArray(formData.talen) ? formData.talen : (formData.talen ? JSON.parse(formData.talen) : ['nl']);
                        return (
                          <label key={taal} className="flex items-center">
                            <input
                              type="checkbox"
                              checked={currentTalen.includes(taal)}
                              onChange={(e) => {
                                const newTalen = e.target.checked
                                  ? [...currentTalen, taal]
                                  : currentTalen.filter((t: string) => t !== taal);
                                setFormData({ ...formData, talen: newTalen.length > 0 ? newTalen : ['nl'] });
                              }}
                              className="mr-2"
                            />
                            <span className="text-sm text-gray-700">{taalNamen[taal]}</span>
                          </label>
                        );
                      })}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Selecteer de talen die deze ceremonie ondersteunt
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Openstelling (weken)
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={formData.openstellingWeken || 6}
                        onChange={(e) => setFormData({ ...formData, openstellingWeken: parseInt(e.target.value) || 6 })}
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-600"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Lead time (dagen)
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={formData.leadTimeDays || 14}
                        onChange={(e) => setFormData({ ...formData, leadTimeDays: parseInt(e.target.value) || 14 })}
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-600"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Wijzigbaar tot (dagen voor ceremonie)
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={formData.wijzigbaarTotDays || 7}
                        onChange={(e) => setFormData({ ...formData, wijzigbaarTotDays: parseInt(e.target.value) || 7 })}
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-600"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Max getuigen
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="10"
                        value={formData.maxGetuigen || 4}
                        onChange={(e) => setFormData({ ...formData, maxGetuigen: parseInt(e.target.value) || 4 })}
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-600"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Volgorde
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={formData.volgorde || 1}
                        onChange={(e) => setFormData({ ...formData, volgorde: parseInt(e.target.value) || 1 })}
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-600"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Tijdsduur (minuten) *
                      </label>
                      <input
                        type="number"
                        min="15"
                        max="480"
                        step="15"
                        required
                        value={formData.duurMinuten || 60}
                        onChange={(e) => setFormData({ ...formData, duurMinuten: parseInt(e.target.value) || 60 })}
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-600"
                        placeholder="bijv. 60 voor 1 uur"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Duur van de ceremonie in minuten (15-480, stappen van 15)
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.gratis || false}
                        onChange={(e) => setFormData({ ...formData, gratis: e.target.checked })}
                        className="mr-2"
                      />
                      <span className="text-sm text-gray-700">Gratis</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.budget || false}
                        onChange={(e) => setFormData({ ...formData, budget: e.target.checked })}
                        className="mr-2"
                      />
                      <span className="text-sm text-gray-700">Budget optie</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.eigenBabsToegestaan || false}
                        onChange={(e) => setFormData({ ...formData, eigenBabsToegestaan: e.target.checked })}
                        className="mr-2"
                      />
                      <span className="text-sm text-gray-700">Eigen ambtenaar toegestaan</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.actief !== undefined ? formData.actief : true}
                        onChange={(e) => setFormData({ ...formData, actief: e.target.checked })}
                        className="mr-2"
                      />
                      <span className="text-sm text-gray-700">Actief</span>
                    </label>
                  </div>
                </>
              )}

              <div className="flex gap-2 pt-4">
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-sans text-sm font-medium"
                >
                  {editingItem ? 'Bijwerken' : 'Toevoegen'}
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

        {/* Items list */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-4 border-b border-gray-200 flex justify-between items-center">
            <h2 className="font-sans text-lg font-semibold text-gray-900">
              {activeTab === 'locaties' && 'Locaties'}
              {activeTab === 'babs' && 'BABS'}
              {activeTab === 'type-ceremonie' && 'Type Ceremonie'}
              {activeTab === 'documenten' && 'Document Opties'}
            </h2>
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-sans text-sm font-medium"
            >
              {showAddForm ? 'Annuleren' : 'Nieuw toevoegen'}
            </button>
          </div>

          {items.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <p>Geen items gevonden</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    {activeTab === 'locaties' && (
                      <>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Code</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Naam</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actief</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Acties</th>
                      </>
                    )}
                    {activeTab === 'babs' && (
                      <>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Naam</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Voortgang</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actief</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Acties</th>
                      </>
                    )}
                    {activeTab === 'type-ceremonie' && (
                      <>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Code</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Naam</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actief</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Acties</th>
                      </>
                    )}
                    {activeTab === 'documenten' && (
                      <>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Code</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Naam</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Prijs</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actief</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Acties</th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {items.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      {activeTab === 'locaties' && (
                        <>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.code}</td>
                          <td className="px-6 py-4 text-sm text-gray-900">{item.naam}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.type}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {item.actief ? (
                              <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                Actief
                              </span>
                            ) : (
                              <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                                Inactief
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button
                              onClick={() => router.push(`/gemeente/beheer/locaties/${item.id}/calendar`)}
                              className="text-green-600 hover:text-green-900 mr-4"
                              title="Beschikbaarheid beheren"
                            >
                              📅 Agenda
                            </button>
                            <button
                              onClick={() => handleEdit(item)}
                              className="text-blue-600 hover:text-blue-900 mr-4"
                            >
                              Bewerken
                            </button>
                            <button
                              onClick={() => handleDelete(item.id)}
                              className="text-red-600 hover:text-red-900"
                            >
                              Verwijderen
                            </button>
                          </td>
                        </>
                      )}
                      {activeTab === 'babs' && (
                        <>
                          <td className="px-6 py-4 text-sm text-gray-900">{item.naam}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.status}</td>
                          <td className="px-6 py-4 text-sm">
                            {item.targetCeremonies > 0 ? (
                              <div className="flex items-center gap-2">
                                <span className="text-2xl">
                                  {item.percentageBehaald >= 100 ? '🟢' :
                                   item.percentageBehaald >= 50 ? '🟡' :
                                   '🔴'}
                                </span>
                                <div>
                                  <div className="font-semibold text-gray-900">
                                    {item.ceremoniesTotNu}/{item.targetCeremonies}
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    ({item.percentageBehaald}% behaald)
                                  </div>
                                  <button
                                    onClick={() => openTargetModal(item.id, item.naam, item.targetCeremonies)}
                                    className="text-xs text-blue-600 hover:text-blue-800 mt-1"
                                  >
                                    ✏️ Wijzig
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div>
                                <span className="text-gray-400 text-xs block mb-1">Geen target ingesteld</span>
                                <button
                                  onClick={() => openTargetModal(item.id, item.naam, null)}
                                  className="text-xs text-blue-600 hover:text-blue-800"
                                >
                                  ➕ Target instellen
                                </button>
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {item.actief ? (
                              <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                Actief
                              </span>
                            ) : (
                              <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                                Inactief
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button
                              onClick={() => router.push(`/gemeente/beheer/babs/${item.id}/calendar`)}
                              className="text-green-600 hover:text-green-900 mr-4"
                              title="Beschikbaarheid beheren"
                            >
                              📅 Agenda
                            </button>
                            <button
                              onClick={() => handleEdit(item)}
                              className="text-blue-600 hover:text-blue-900 mr-4"
                            >
                              Bewerken
                            </button>
                            <button
                              onClick={() => handleDelete(item.id)}
                              className="text-red-600 hover:text-red-900"
                            >
                              Verwijderen
                            </button>
                          </td>
                        </>
                      )}
                      {activeTab === 'type-ceremonie' && (
                        <>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.code}</td>
                          <td className="px-6 py-4 text-sm text-gray-900">{item.naam}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {item.actief ? (
                              <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                Actief
                              </span>
                            ) : (
                              <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                                Inactief
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button
                              onClick={() => handleEdit(item)}
                              className="text-blue-600 hover:text-blue-900 mr-4"
                            >
                              Bewerken
                            </button>
                            <button
                              onClick={() => handleDelete(item.id)}
                              className="text-red-600 hover:text-red-900"
                            >
                              Verwijderen
                            </button>
                          </td>
                        </>
                      )}
                      {activeTab === 'documenten' && (
                        <>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.code}</td>
                          <td className="px-6 py-4 text-sm text-gray-900">{item.naam}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {item.gratis ? 'Gratis' : `€ ${(item.prijsCents / 100).toFixed(2).replace('.', ',')}`}
                            {item.verplicht && <span className="ml-2 text-xs text-gray-500">(verplicht)</span>}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.papierType}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {item.actief ? (
                              <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                Actief
                              </span>
                            ) : (
                              <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                                Inactief
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button
                              onClick={() => handleEdit(item)}
                              className="text-blue-600 hover:text-blue-900 mr-4"
                            >
                              Bewerken
                            </button>
                            <button
                              onClick={() => handleDelete(item.id)}
                              className="text-red-600 hover:text-red-900"
                            >
                              Verwijderen
                            </button>
                          </td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* Target Edit Modal */}
      {editingTarget && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
          <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                Target instellen voor {editingTarget.naam}
              </h3>
            </div>
            <div className="px-6 py-4">
              <label htmlFor="target-input" className="block text-sm font-medium text-gray-700 mb-2">
                Aantal ceremonies per jaar
              </label>
              <input
                id="target-input"
                type="number"
                min="0"
                value={targetInput}
                onChange={(e) => setTargetInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleTargetSubmit();
                  } else if (e.key === 'Escape') {
                    setEditingTarget(null);
                    setTargetInput('');
                  }
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="40"
                autoFocus
              />
              <p className="mt-2 text-sm text-gray-500">
                Voer het aantal ceremonies in dat {editingTarget.naam} dit jaar moet uitvoeren.
              </p>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={() => {
                  setEditingTarget(null);
                  setTargetInput('');
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Annuleren
              </button>
              <button
                onClick={handleTargetSubmit}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Opslaan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

