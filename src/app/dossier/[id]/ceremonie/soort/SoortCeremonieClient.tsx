'use client';

import type { JSX } from 'react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { GemeenteLogoCompact } from '@/components/GemeenteLogo';
import type { TypeCeremonie } from '@/db/schema';

interface SoortCeremonieClientProps {
  dossierId: string;
  types: TypeCeremonie[];
}

type CategoryType = 'gratis' | 'budget' | 'standaard';

interface CategoryInfo {
  type: CategoryType;
  naam: string;
  omschrijving: string;
  prijsInfo?: string;
}

export function SoortCeremonieClient({ dossierId, types }: SoortCeremonieClientProps): JSX.Element {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState<CategoryType | null>(null);
  const [selectedTypeId, setSelectedTypeId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Helper to format price from cents
  const formatPrice = (cents: number | null | undefined): string => {
    if (!cents || cents === 0) return 'Gratis';
    const euros = (cents / 100).toFixed(2);
    return `€ ${euros.replace('.', ',')}`;
  };

  // Group types by category
  const gratisTypes = types.filter(t => t.gratis);
  const budgetTypes = types.filter(t => t.budget && !t.gratis);
  const standaardTypes = types.filter(t => !t.gratis && !t.budget);

  // Get types for selected category
  const getTypesForCategory = (category: CategoryType): TypeCeremonie[] => {
    switch (category) {
      case 'gratis':
        return gratisTypes;
      case 'budget':
        return budgetTypes;
      case 'standaard':
        return standaardTypes;
      default:
        return [];
    }
  };

  // Helper to get category price info from types
  const getCategoryPriceInfo = (category: CategoryType): string | undefined => {
    const categoryTypes = getTypesForCategory(category);
    if (categoryTypes.length === 0) return undefined;
    
    // Get minimum price for category
    const prices = categoryTypes
      .map(t => t.prijsCents || 0)
      .filter(p => p > 0);
    
    if (prices.length === 0) return undefined;
    
    const minPrice = Math.min(...prices);
    if (category === 'standaard') {
      return `vanaf ${formatPrice(minPrice)}`;
    }
    return formatPrice(minPrice);
  };

  // Category definitions with descriptions
  const categories: CategoryInfo[] = [
    {
      type: 'gratis',
      naam: 'Gratis',
      omschrijving: 'De gratis ceremonie duurt 10 minuten en is op het stadsloket. Deze is in het Nederlands of Engels. Voor de gratis ceremonie geldt een lange wachttijd.',
    },
    {
      type: 'budget',
      naam: 'Budget',
      omschrijving: 'De budgetceremonie duurt 10 minuten en is op het stadsloket. Deze is in het Nederlands, Engels, Duits of Frans.',
      prijsInfo: getCategoryPriceInfo('budget') || '€ 193,30', // Fallback to hardcoded if no types
    },
    {
      type: 'standaard',
      naam: 'Standaard',
      omschrijving: 'Bij een standaard ceremonie kunt u veel zelf bepalen, zoals de locatie en (eigen) trouwambtenaar. Deze is in het Nederlands, Engels, Duits of Frans.',
      prijsInfo: getCategoryPriceInfo('standaard') || 'vanaf € 861,60', // Fallback to hardcoded if no types
    },
  ];

  // Load saved type on mount
  useEffect(() => {
    const loadSavedType = async () => {
      try {
        const response = await fetch(`/api/dossier/${dossierId}/ceremonie/type`);
        const result = await response.json();
        if (result.success && result.data.typeCeremonieId) {
          setSelectedTypeId(result.data.typeCeremonieId);
          // Determine category from saved type
          const savedType = types.find(t => t.id === result.data.typeCeremonieId);
          if (savedType) {
            if (savedType.gratis) {
              setSelectedCategory('gratis');
            } else if (savedType.budget) {
              setSelectedCategory('budget');
            } else {
              setSelectedCategory('standaard');
            }
          }
        }
      } catch (error) {
        console.error('Error loading saved type:', error);
      }
    };
    loadSavedType();
  }, [dossierId, types]);

  // Auto-save when type is selected
  const handleTypeSelect = async (typeId: string) => {
    setSelectedTypeId(typeId);
    setSaving(true);
    setSaveSuccess(false);

    try {
      const response = await fetch(`/api/dossier/${dossierId}/ceremonie/type`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ typeCeremonieId: typeId }),
      });

      const result = await response.json();

      if (result.success) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 2000);
      } else {
        console.error('Error saving type:', result.error);
        alert(result.error || 'Er ging iets mis bij het opslaan');
      }
    } catch (error) {
      console.error('Error saving type:', error);
      alert('Er ging iets mis bij het opslaan');
    } finally {
      setSaving(false);
    }
  };

  const handleCategorySelect = (category: CategoryType) => {
    setSelectedCategory(category);
    // Reset type selection when changing category
    if (selectedTypeId) {
      const currentType = types.find(t => t.id === selectedTypeId);
      const isInCategory = getTypesForCategory(category).some(t => t.id === selectedTypeId);
      if (!isInCategory) {
        setSelectedTypeId(null);
      }
    }
  };

  const handleContinue = async () => {
    if (!selectedTypeId) {
      alert('Selecteer eerst een soort ceremonie');
      return;
    }

    setLoading(true);
    router.push(`/dossier/${dossierId}/ceremonie/datum`);
  };

  // Helper function to format languages
  const formatTalen = (talen: string[] | null | undefined): string => {
    if (!talen || !Array.isArray(talen) || talen.length === 0) {
      return 'Nederlands';
    }

    const taalNamen: Record<string, string> = {
      nl: 'Nederlands',
      en: 'Engels',
      de: 'Duits',
      fr: 'Frans',
      es: 'Spaans',
    };

    return talen.map(t => taalNamen[t] || t).join(', ');
  };

  // Helper function to format duration
  const formatDuur = (minuten: number | null | undefined): string => {
    if (!minuten) return '';
    if (minuten < 60) {
      return `${minuten} minuten`;
    }
    const uren = Math.floor(minuten / 60);
    const restMinuten = minuten % 60;
    if (restMinuten === 0) {
      return `${uren} ${uren === 1 ? 'uur' : 'uur'}`;
    }
    return `${uren} ${uren === 1 ? 'uur' : 'uur'} en ${restMinuten} minuten`;
  };

  const selectedCategoryTypes = selectedCategory ? getTypesForCategory(selectedCategory) : [];

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
            href={`/dossier/${dossierId}/ceremonie`}
            className="inline-flex items-center text-blue-600 hover:text-blue-700 font-sans text-sm mb-6"
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Vorige stap
          </Link>

          <h2 className="font-serif text-3xl font-bold text-gray-900 mb-2">Soort ceremonie</h2>

          {/* Progress bar */}
          <div className="mb-8">
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div className="h-full bg-blue-600 rounded-full" style={{ width: '15%' }}></div>
            </div>
          </div>

          <p className="font-sans text-base text-gray-700 mb-6">
            Wat voor soort ceremonie wilt u?
          </p>

          {/* Category selection */}
          {!selectedCategory && (
            <div className="space-y-4 mb-8">
              {categories.map((category) => {
                const categoryTypes = getTypesForCategory(category.type);
                const hasTypes = categoryTypes.length > 0;
                
                return (
                  <button
                    key={category.type}
                    onClick={() => hasTypes && handleCategorySelect(category.type)}
                    disabled={!hasTypes}
                    className={`w-full text-left p-6 rounded-lg border-2 transition-all ${
                      hasTypes
                        ? 'border-gray-300 bg-white hover:border-blue-600 hover:bg-blue-50'
                        : 'border-gray-200 bg-gray-50 opacity-50 cursor-not-allowed'
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 mt-1">
                        <div className="w-6 h-6 rounded-full border-2 border-gray-400 flex items-center justify-center">
                          <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-sans text-lg font-semibold text-gray-900">
                            {category.naam}
                            {category.prijsInfo && (
                              <span className="ml-2 text-base font-normal text-gray-600">
                                - {category.prijsInfo}
                              </span>
                            )}
                          </h3>
                        </div>
                        <p className="font-sans text-sm text-gray-700">
                          {category.omschrijving}
                        </p>
                        {!hasTypes && (
                          <p className="font-sans text-xs text-gray-500 mt-2 italic">
                            Geen beschikbare ceremonies in deze categorie
                          </p>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* Specific ceremony types for selected category */}
          {selectedCategory && (
            <div className="mb-8">
              {/* Back to categories button */}
              <button
                onClick={() => {
                  setSelectedCategory(null);
                  setSelectedTypeId(null);
                }}
                className="inline-flex items-center text-blue-600 hover:text-blue-700 font-sans text-sm mb-4"
              >
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Terug naar categorieën
              </button>

              {/* Category header */}
              <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h3 className="font-sans text-lg font-semibold text-gray-900 mb-1">
                  {categories.find(c => c.type === selectedCategory)?.naam}
                  {categories.find(c => c.type === selectedCategory)?.prijsInfo && (
                    <span className="ml-2 text-base font-normal text-gray-600">
                      - {categories.find(c => c.type === selectedCategory)?.prijsInfo}
                    </span>
                  )}
                </h3>
                <p className="font-sans text-sm text-gray-700">
                  {categories.find(c => c.type === selectedCategory)?.omschrijving}
                </p>
              </div>

              {/* Ceremony types in this category */}
              {selectedCategoryTypes.length > 0 ? (
                <div className="space-y-4">
                  {selectedCategoryTypes.map((type) => (
                    <button
                      key={type.id}
                      onClick={() => handleTypeSelect(type.id)}
                      disabled={saving}
                      className={`w-full text-left p-6 rounded-lg border-2 transition-all ${
                        selectedTypeId === type.id
                          ? 'border-blue-600 bg-blue-50'
                          : 'border-gray-300 bg-white hover:border-gray-400'
                      } ${saving ? 'opacity-50 cursor-wait' : ''}`}
                    >
                      <div className="flex items-start gap-4">
                        <div className="flex-shrink-0 mt-1">
                          <div
                            className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                              selectedTypeId === type.id
                                ? 'border-blue-600 bg-blue-600'
                                : 'border-gray-400'
                            }`}
                          >
                            {selectedTypeId === type.id && (
                              <div className="w-3 h-3 bg-white rounded-full"></div>
                            )}
                          </div>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-sans text-lg font-semibold text-gray-900">
                              {type.naam}
                              {type.duurMinuten && ` - ${formatDuur(type.duurMinuten)}`}
                              {type.eigenBabsToegestaan && ' (eigen BABS mogelijk)'}
                            </h4>
                            {type.prijsCents !== undefined && type.prijsCents !== null && (
                              <span className="font-sans text-base font-semibold text-gray-900">
                                {formatPrice(type.prijsCents)}
                              </span>
                            )}
                          </div>
                          <p className="font-sans text-sm text-gray-700">
                            {type.uitgebreideOmschrijving || type.omschrijving || 'Geen beschrijving beschikbaar.'}
                            {type.talen && Array.isArray(type.talen) && type.talen.length > 0 ? (
                              <> Deze is in het {formatTalen(type.talen)}.</>
                            ) : null}
                          </p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <p>Geen ceremonies beschikbaar in deze categorie.</p>
                </div>
              )}
            </div>
          )}

          {types.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <p>Geen ceremonie types beschikbaar.</p>
            </div>
          )}

          {/* Success message */}
          {saveSuccess && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2 text-green-800">
              <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="font-sans text-sm">Uw keuze is opgeslagen</span>
            </div>
          )}

          {/* Saving indicator */}
          {saving && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center gap-2 text-blue-800">
              <svg className="w-5 h-5 flex-shrink-0 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span className="font-sans text-sm">Bezig met opslaan...</span>
            </div>
          )}

          <div className="flex gap-4">
            <button
              onClick={handleContinue}
              disabled={!selectedTypeId || loading || saving}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-sans text-base px-6 py-3 rounded focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 transition-colors inline-flex items-center gap-2"
            >
              {loading ? 'Bezig...' : 'Volgende stap'}
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
