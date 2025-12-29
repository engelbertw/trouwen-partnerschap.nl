'use client';

import type { JSX } from 'react';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  validateKind, 
  formatValidationErrors, 
  formatValidationWarnings,
  type ValidationResult,
  type KindData,
  type PartnerData
} from '@/lib/validation';

interface Child {
  id: string;
  voornamen: string;
  achternaam: string;
  geboortedatum: string;
}

/**
 * Kinderen uit een ander huwelijk page
 * Collects information about children from previous marriages for both partners
 * Includes comprehensive validation based on database rules
 */
export default function KinderenPage(): JSX.Element {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dossierId = searchParams.get('dossierId');
  
  const [partner1HasChildren, setPartner1HasChildren] = useState<boolean | null>(null);
  const [partner2HasChildren, setPartner2HasChildren] = useState<boolean | null>(null);
  const [partner1Children, setPartner1Children] = useState<Child[]>([]);
  const [partner2Children, setPartner2Children] = useState<Child[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Validation state
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [validationWarnings, setValidationWarnings] = useState<string[]>([]);
  
  // Partner data for validation
  const [partner1Data, setPartner1Data] = useState<PartnerData | null>(null);
  const [partner2Data, setPartner2Data] = useState<PartnerData | null>(null);
  const [partner1Name, setPartner1Name] = useState<string>('');
  const [partner2Name, setPartner2Name] = useState<string>('');

  // Load existing data from database on mount
  useEffect(() => {
    if (!dossierId) {
      setValidationErrors(['Geen dossier ID gevonden. Start opnieuw.']);
      return;
    }

    async function loadData() {
      try {
        // Load children from database
        const kinderenResponse = await fetch(`/api/dossier/${dossierId}/kinderen`);
        const kinderenResult = await kinderenResponse.json();
        
        if (kinderenResult.success && kinderenResult.data) {
          setPartner1Children(kinderenResult.data.partner1Children || []);
          setPartner2Children(kinderenResult.data.partner2Children || []);
          setPartner1HasChildren(kinderenResult.data.partner1Children?.length > 0 || false);
          setPartner2HasChildren(kinderenResult.data.partner2Children?.length > 0 || false);
        }

        // Load partner data for validation and display
        const partnersResponse = await fetch(`/api/dossier/${dossierId}/partners`);
        const partnersResult = await partnersResponse.json();
        
        if (partnersResult.success && partnersResult.data) {
          // Partner 1 data
          if (partnersResult.data.partner1) {
            const name1 = `${partnersResult.data.partner1.voornamen || ''} ${partnersResult.data.partner1.achternaam || ''}`.trim();
            setPartner1Name(name1 || 'Partner 1');
            
            // Convert date from DD-MM-YYYY to format needed for validation
            const dateParts = partnersResult.data.partner1.geboortedatum?.split('-');
            const formattedDate = dateParts && dateParts.length === 3 
              ? `${dateParts[2]}-${dateParts[1]}-${dateParts[0]}`
              : partnersResult.data.partner1.geboortedatum || '';
            
            setPartner1Data({
              voornamen: partnersResult.data.partner1.voornamen || '',
              achternaam: partnersResult.data.partner1.achternaam || '',
              geboortedatum: formattedDate,
            });
          }
          
          // Partner 2 data
          if (partnersResult.data.partner2) {
            const name2 = `${partnersResult.data.partner2.voornamen || ''} ${partnersResult.data.partner2.achternaam || ''}`.trim();
            setPartner2Name(name2 || 'Partner 2');
            
            // Convert date from DD-MM-YYYY to format needed for validation
            const dateParts = partnersResult.data.partner2.geboortedatum?.split('-');
            const formattedDate = dateParts && dateParts.length === 3 
              ? `${dateParts[2]}-${dateParts[1]}-${dateParts[0]}`
              : partnersResult.data.partner2.geboortedatum || '';
            
            setPartner2Data({
              voornamen: partnersResult.data.partner2.voornamen || '',
              achternaam: partnersResult.data.partner2.achternaam || '',
              geboortedatum: formattedDate,
            });
          }
        }
        
        setIsLoaded(true);
      } catch (error) {
        console.error('Error loading data:', error);
        setValidationErrors(['Fout bij laden van gegevens']);
        setIsLoaded(true);
      }
    }

    loadData();
  }, [dossierId]);

  // Temporary state for new child form (partner 1)
  const [newChild1, setNewChild1] = useState<Partial<Child>>({
    voornamen: '',
    achternaam: '',
    geboortedatum: '',
  });

  // Temporary state for new child form (partner 2)
  const [newChild2, setNewChild2] = useState<Partial<Child>>({
    voornamen: '',
    achternaam: '',
    geboortedatum: '',
  });
  
  // Real-time validation state for form fields
  const [child1ValidationResult, setChild1ValidationResult] = useState<ValidationResult | null>(null);
  const [child2ValidationResult, setChild2ValidationResult] = useState<ValidationResult | null>(null);
  
  // Validate child 1 in real-time
  useEffect(() => {
    if (!newChild1.voornamen && !newChild1.achternaam && !newChild1.geboortedatum) {
      setChild1ValidationResult(null);
      return;
    }
    
    const dateParts = newChild1.geboortedatum?.split('-');
    const formattedDate = dateParts && dateParts.length === 3 
      ? `${dateParts[2]}-${dateParts[1]}-${dateParts[0]}`
      : newChild1.geboortedatum || '';
    
    const kindData: KindData = {
      voornamen: newChild1.voornamen || '',
      achternaam: newChild1.achternaam || '',
      geboortedatum: formattedDate,
    };
    
    if (partner1Data) {
      const result = validateKind(kindData, partner1Data);
      setChild1ValidationResult(result);
    }
  }, [newChild1, partner1Data]);
  
  // Validate child 2 in real-time
  useEffect(() => {
    if (!newChild2.voornamen && !newChild2.achternaam && !newChild2.geboortedatum) {
      setChild2ValidationResult(null);
      return;
    }
    
    const dateParts = newChild2.geboortedatum?.split('-');
    const formattedDate = dateParts && dateParts.length === 3 
      ? `${dateParts[2]}-${dateParts[1]}-${dateParts[0]}`
      : newChild2.geboortedatum || '';
    
    const kindData: KindData = {
      voornamen: newChild2.voornamen || '',
      achternaam: newChild2.achternaam || '',
      geboortedatum: formattedDate,
    };
    
    if (partner2Data) {
      const result = validateKind(kindData, partner2Data);
      setChild2ValidationResult(result);
    }
  }, [newChild2, partner2Data]);

  const addChild1 = () => {
    // Clear previous global validation messages
    setValidationErrors([]);
    setValidationWarnings([]);
    
    if (!newChild1.voornamen || !newChild1.achternaam || !newChild1.geboortedatum) {
      setValidationErrors(['Vul alle velden in voor het kind']);
      return;
    }

    // Check real-time validation result
    if (child1ValidationResult && !child1ValidationResult.isValid) {
      setValidationErrors(formatValidationErrors(child1ValidationResult));
      setValidationWarnings(formatValidationWarnings(child1ValidationResult));
      return;
    }

    // Convert date format from YYYY-MM-DD to DD-MM-YYYY
    const dateParts = newChild1.geboortedatum.split('-');
    const formattedDate = dateParts.length === 3 
      ? `${dateParts[2]}-${dateParts[1]}-${dateParts[0]}`
      : newChild1.geboortedatum;

    const child: Child = {
      id: Date.now().toString(),
      voornamen: newChild1.voornamen,
      achternaam: newChild1.achternaam,
      geboortedatum: formattedDate,
    };

    setPartner1Children([...partner1Children, child]);
    
    // Reset form and validation
    setNewChild1({
      voornamen: '',
      achternaam: '',
      geboortedatum: '',
    });
    setChild1ValidationResult(null);
  };

  const addChild2 = () => {
    // Clear previous global validation messages
    setValidationErrors([]);
    setValidationWarnings([]);
    
    if (!newChild2.voornamen || !newChild2.achternaam || !newChild2.geboortedatum) {
      setValidationErrors(['Vul alle velden in voor het kind']);
      return;
    }

    // Check real-time validation result
    if (child2ValidationResult && !child2ValidationResult.isValid) {
      setValidationErrors(formatValidationErrors(child2ValidationResult));
      setValidationWarnings(formatValidationWarnings(child2ValidationResult));
      return;
    }

    // Convert date format from YYYY-MM-DD to DD-MM-YYYY
    const dateParts = newChild2.geboortedatum.split('-');
    const formattedDate = dateParts.length === 3 
      ? `${dateParts[2]}-${dateParts[1]}-${dateParts[0]}`
      : newChild2.geboortedatum;

    const child: Child = {
      id: Date.now().toString(),
      voornamen: newChild2.voornamen,
      achternaam: newChild2.achternaam,
      geboortedatum: formattedDate,
    };

    setPartner2Children([...partner2Children, child]);
    
    // Reset form and validation
    setNewChild2({
      voornamen: '',
      achternaam: '',
      geboortedatum: '',
    });
    setChild2ValidationResult(null);
  };

  const removeChild1 = (id: string) => {
    setPartner1Children(partner1Children.filter(child => child.id !== id));
  };

  const removeChild2 = (id: string) => {
    setPartner2Children(partner2Children.filter(child => child.id !== id));
  };

  const handleContinue = async () => {
    // Clear validation messages
    setValidationErrors([]);
    setValidationWarnings([]);
    
    if (!dossierId) {
      setValidationErrors(['Geen dossier ID gevonden']);
      return;
    }
    
    // Validate
    if (partner1HasChildren === null || partner2HasChildren === null) {
      setValidationErrors(['Beantwoord beide vragen']);
      return;
    }

    if (partner1HasChildren && partner1Children.length === 0) {
      setValidationErrors(['Voeg minimaal één kind toe of selecteer "Nee"']);
      return;
    }

    if (partner2HasChildren && partner2Children.length === 0) {
      setValidationErrors(['Voeg voor uw partner minimaal één kind toe of selecteer "Nee"']);
      return;
    }

    // Save to database
    setIsSaving(true);
    try {
      const response = await fetch(`/api/dossier/${dossierId}/kinderen`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          partner1Children: partner1HasChildren ? partner1Children : [],
          partner2Children: partner2HasChildren ? partner2Children : [],
        }),
      });

      const result = await response.json();
      
      if (!result.success) {
        setValidationErrors([result.error || 'Fout bij opslaan']);
        return;
      }

      // Navigate to next step
      router.push(`/000-aankondiging/060-bloedverwantschap?dossierId=${dossierId}`);
    } catch (error) {
      console.error('Error saving:', error);
      setValidationErrors(['Er ging iets mis bij het opslaan']);
    } finally {
      setIsSaving(false);
    }
  };

  // Don't render until data is loaded
  if (!isLoaded) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-blue-100">
      {/* Blue header bar */}
      <div className="bg-[#154273] text-white py-4 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto max-w-4xl">
          <h1 className="font-sans text-xl font-bold">
            Huwelijk of partnerschap aankondigen
          </h1>
        </div>
      </div>

      {/* Main content */}
      <main className="container mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8">
        <article className="bg-white rounded-lg shadow-md p-6 sm:p-8 lg:p-12">
          {/* Previous step link */}
          <Link
            href="/000-aankondiging/040-curatele"
            className="inline-flex items-center gap-2 text-[#154273] hover:text-[#1a5a99] focus:outline-none focus:ring-2 focus:ring-[#154273] focus:ring-offset-2 mb-6 transition-colors"
          >
            <svg 
              className="w-4 h-4" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M15 19l-7-7 7-7" 
              />
            </svg>
            Vorige stap
          </Link>

          {/* Page heading */}
          <h2 className="font-sans text-3xl sm:text-4xl font-bold mb-6">
            Kinderen uit een ander huwelijk
          </h2>

          {/* Progress bar */}
          <div className="mb-8">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-[#154273] h-2 rounded-full transition-all duration-300"
                style={{ width: '70%' }}
                role="progressbar"
                aria-valuenow={70}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label="Voortgang: 70%"
              />
            </div>
          </div>

          {/* Question 1: Partner 1 has children */}
          <fieldset className="mb-8">
            <legend className="text-lg font-bold mb-4 text-gray-900">
              Hebt u kinderen uit een ander huwelijk?
            </legend>

            <div className="space-y-3">
              {/* Ja option */}
              <div className="flex items-center">
                <input
                  type="radio"
                  id="partner1-children-ja"
                  name="partner1Children"
                  value="ja"
                  checked={partner1HasChildren === true}
                  onChange={() => setPartner1HasChildren(true)}
                  className="w-5 h-5 text-[#154273] border-gray-300 focus:ring-2 focus:ring-[#154273] focus:ring-offset-2 cursor-pointer"
                />
                <label 
                  htmlFor="partner1-children-ja" 
                  className="ml-3 text-base text-gray-900 cursor-pointer"
                >
                  Ja
                </label>
              </div>

              {/* Nee option */}
              <div className="flex items-center">
                <input
                  type="radio"
                  id="partner1-children-nee"
                  name="partner1Children"
                  value="nee"
                  checked={partner1HasChildren === false}
                  onChange={() => setPartner1HasChildren(false)}
                  className="w-5 h-5 text-[#154273] border-gray-300 focus:ring-2 focus:ring-[#154273] focus:ring-offset-2 cursor-pointer"
                />
                <label 
                  htmlFor="partner1-children-nee" 
                  className="ml-3 text-base text-gray-900 cursor-pointer"
                >
                  Nee
                </label>
              </div>
            </div>
          </fieldset>

          {/* Conditional children form */}
          {partner1HasChildren === true && (
            <div className="mb-8">
              {/* Real-time validation feedback - inline bij formulier */}
              {child1ValidationResult && !child1ValidationResult.isValid && (
                <div className="mb-4 p-4 bg-red-50 border-l-4 border-red-600 rounded" role="alert">
                  <div className="flex items-start">
                    <svg className="w-5 h-5 text-red-600 mr-2 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    <div>
                      <h3 className="text-sm font-bold text-red-900 mb-1">Controleer de invoer</h3>
                      <ul className="list-disc list-inside text-sm text-red-800">
                        {formatValidationErrors(child1ValidationResult).map((error, idx) => (
                          <li key={idx}>{error}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Real-time warnings feedback */}
              {child1ValidationResult && child1ValidationResult.isValid && child1ValidationResult.warnings.length > 0 && (
                <div className="mb-4 p-4 bg-yellow-50 border-l-4 border-yellow-600 rounded" role="alert">
                  <div className="flex items-start">
                    <svg className="w-5 h-5 text-yellow-600 mr-2 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    <div>
                      <h3 className="text-sm font-bold text-yellow-900 mb-1">Let op</h3>
                      <ul className="list-disc list-inside text-sm text-yellow-800">
                        {formatValidationWarnings(child1ValidationResult).map((warning, idx) => (
                          <li key={idx}>{warning}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Validation errors bij toevoegen (globaal) */}
              {validationErrors.length > 0 && (
                <div className="mb-4 p-4 bg-red-50 border-l-4 border-red-600 rounded" role="alert">
                  <div className="flex items-start">
                    <svg className="w-5 h-5 text-red-600 mr-2 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    <div>
                      <h3 className="text-sm font-bold text-red-900 mb-1">Controleer uw invoer</h3>
                      <ul className="list-disc list-inside text-sm text-red-800">
                        {validationErrors.map((error, idx) => (
                          <li key={idx}>{error}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Validation warnings bij toevoegen (globaal) */}
              {validationWarnings.length > 0 && validationErrors.length === 0 && (
                <div className="mb-4 p-4 bg-yellow-50 border-l-4 border-yellow-600 rounded" role="alert">
                  <div className="flex items-start">
                    <svg className="w-5 h-5 text-yellow-600 mr-2 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    <div>
                      <h3 className="text-sm font-bold text-yellow-900 mb-1">Let op</h3>
                      <ul className="list-disc list-inside text-sm text-yellow-800">
                        {validationWarnings.map((warning, idx) => (
                          <li key={idx}>{warning}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Existing children list */}
              {partner1Children.map((child) => (
                <div key={child.id} className="grid grid-cols-1 md:grid-cols-12 gap-4 mb-4">
                  {/* Voornamen */}
                  <div className="md:col-span-4">
                    <label className="block text-sm font-bold mb-2 text-gray-900">
                      Voornamen
                    </label>
                    <input
                      type="text"
                      value={child.voornamen}
                      disabled
                      className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#154273] bg-gray-50"
                    />
                  </div>

                  {/* Achternaam */}
                  <div className="md:col-span-4">
                    <label className="block text-sm font-bold mb-2 text-gray-900">
                      Achternaam
                    </label>
                    <input
                      type="text"
                      value={child.achternaam}
                      disabled
                      className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#154273] bg-gray-50"
                    />
                  </div>

                  {/* Geboortedatum */}
                  <div className="md:col-span-3">
                    <label className="block text-sm font-bold mb-2 text-gray-900">
                      Geboortedatum
                    </label>
                    <input
                      type="text"
                      value={child.geboortedatum}
                      disabled
                      className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#154273] bg-gray-50"
                    />
                  </div>

                  {/* Delete button */}
                  <div className="md:col-span-1 flex items-end">
                    <button
                      onClick={() => removeChild1(child.id)}
                      className="w-full md:w-auto p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded focus:outline-none focus:ring-2 focus:ring-red-600 focus:ring-offset-2"
                      aria-label="Verwijder kind"
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}

              {/* New child form */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4 mb-4">
                {/* Voornamen */}
                <div className="md:col-span-4">
                  <label htmlFor="new-voornamen" className="block text-sm font-bold mb-2 text-gray-900">
                    Voornamen
                  </label>
                  <input
                    type="text"
                    id="new-voornamen"
                    value={newChild1.voornamen}
                    onChange={(e) => setNewChild1({ ...newChild1, voornamen: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#154273]"
                    placeholder=""
                  />
                </div>

                {/* Achternaam */}
                <div className="md:col-span-4">
                  <label htmlFor="new-achternaam" className="block text-sm font-bold mb-2 text-gray-900">
                    Achternaam
                  </label>
                  <input
                    type="text"
                    id="new-achternaam"
                    value={newChild1.achternaam}
                    onChange={(e) => setNewChild1({ ...newChild1, achternaam: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#154273]"
                    placeholder=""
                  />
                </div>

                {/* Geboortedatum */}
                <div className="md:col-span-3">
                  <label htmlFor="new-geboortedatum" className="block text-sm font-bold mb-2 text-gray-900">
                    Geboortedatum
                  </label>
                  <input
                    type="date"
                    id="new-geboortedatum"
                    value={newChild1.geboortedatum}
                    onChange={(e) => setNewChild1({ ...newChild1, geboortedatum: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#154273]"
                    placeholder="dd-mm-jjjj"
                    required
                    max={new Date().toISOString().split('T')[0]}
                  />
                </div>
              </div>

              {/* Add child button */}
              <button
                onClick={addChild1}
                disabled={!newChild1.voornamen || !newChild1.achternaam || !newChild1.geboortedatum || (child1ValidationResult !== null && !child1ValidationResult.isValid)}
                className="inline-flex items-center gap-2 bg-white text-[#154273] font-sans text-base font-bold px-5 py-3 rounded border-2 border-[#154273] hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-[#154273] focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Kind toevoegen
              </button>
            </div>
          )}

          {/* Question 2: Partner 2 has children */}
          <fieldset className="mb-8">
            <legend className="text-lg font-bold mb-4 text-gray-900">
              Heeft uw partner {partner2Name || 'Partner 2'} kinderen uit een ander huwelijk?
            </legend>

            <div className="space-y-3">
              {/* Ja option */}
              <div className="flex items-center">
                <input
                  type="radio"
                  id="partner2-children-ja"
                  name="partner2Children"
                  value="ja"
                  checked={partner2HasChildren === true}
                  onChange={() => setPartner2HasChildren(true)}
                  className="w-5 h-5 text-[#154273] border-gray-300 focus:ring-2 focus:ring-[#154273] focus:ring-offset-2 cursor-pointer"
                />
                <label 
                  htmlFor="partner2-children-ja" 
                  className="ml-3 text-base text-gray-900 cursor-pointer"
                >
                  Ja
                </label>
              </div>

              {/* Nee option */}
              <div className="flex items-center">
                <input
                  type="radio"
                  id="partner2-children-nee"
                  name="partner2Children"
                  value="nee"
                  checked={partner2HasChildren === false}
                  onChange={() => setPartner2HasChildren(false)}
                  className="w-5 h-5 text-[#154273] border-gray-300 focus:ring-2 focus:ring-[#154273] focus:ring-offset-2 cursor-pointer"
                />
                <label 
                  htmlFor="partner2-children-nee" 
                  className="ml-3 text-base text-gray-900 cursor-pointer"
                >
                  Nee
                </label>
              </div>
            </div>
          </fieldset>

          {/* Conditional children form for Partner 2 */}
          {partner2HasChildren === true && (
            <div className="mb-8">
              {/* Real-time validation feedback - inline bij formulier */}
              {child2ValidationResult && !child2ValidationResult.isValid && (
                <div className="mb-4 p-4 bg-red-50 border-l-4 border-red-600 rounded" role="alert">
                  <div className="flex items-start">
                    <svg className="w-5 h-5 text-red-600 mr-2 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    <div>
                      <h3 className="text-sm font-bold text-red-900 mb-1">Controleer de invoer</h3>
                      <ul className="list-disc list-inside text-sm text-red-800">
                        {formatValidationErrors(child2ValidationResult).map((error, idx) => (
                          <li key={idx}>{error}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Real-time warnings feedback */}
              {child2ValidationResult && child2ValidationResult.isValid && child2ValidationResult.warnings.length > 0 && (
                <div className="mb-4 p-4 bg-yellow-50 border-l-4 border-yellow-600 rounded" role="alert">
                  <div className="flex items-start">
                    <svg className="w-5 h-5 text-yellow-600 mr-2 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    <div>
                      <h3 className="text-sm font-bold text-yellow-900 mb-1">Let op</h3>
                      <ul className="list-disc list-inside text-sm text-yellow-800">
                        {formatValidationWarnings(child2ValidationResult).map((warning, idx) => (
                          <li key={idx}>{warning}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Existing children list */}
              {partner2Children.map((child) => (
                <div key={child.id} className="grid grid-cols-1 md:grid-cols-12 gap-4 mb-4">
                  {/* Voornamen */}
                  <div className="md:col-span-4">
                    <label className="block text-sm font-bold mb-2 text-gray-900">
                      Voornamen
                    </label>
                    <input
                      type="text"
                      value={child.voornamen}
                      disabled
                      className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#154273] bg-gray-50"
                    />
                  </div>

                  {/* Achternaam */}
                  <div className="md:col-span-4">
                    <label className="block text-sm font-bold mb-2 text-gray-900">
                      Achternaam
                    </label>
                    <input
                      type="text"
                      value={child.achternaam}
                      disabled
                      className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#154273] bg-gray-50"
                    />
                  </div>

                  {/* Geboortedatum */}
                  <div className="md:col-span-3">
                    <label className="block text-sm font-bold mb-2 text-gray-900">
                      Geboortedatum
                    </label>
                    <input
                      type="text"
                      value={child.geboortedatum}
                      disabled
                      className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#154273] bg-gray-50"
                    />
                  </div>

                  {/* Delete button */}
                  <div className="md:col-span-1 flex items-end">
                    <button
                      onClick={() => removeChild2(child.id)}
                      className="w-full md:w-auto p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded focus:outline-none focus:ring-2 focus:ring-red-600 focus:ring-offset-2"
                      aria-label="Verwijder kind"
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}

              {/* New child form */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4 mb-4">
                {/* Voornamen */}
                <div className="md:col-span-4">
                  <label htmlFor="new-voornamen-p2" className="block text-sm font-bold mb-2 text-gray-900">
                    Voornamen
                  </label>
                  <input
                    type="text"
                    id="new-voornamen-p2"
                    value={newChild2.voornamen}
                    onChange={(e) => setNewChild2({ ...newChild2, voornamen: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#154273]"
                    placeholder=""
                  />
                </div>

                {/* Achternaam */}
                <div className="md:col-span-4">
                  <label htmlFor="new-achternaam-p2" className="block text-sm font-bold mb-2 text-gray-900">
                    Achternaam
                  </label>
                  <input
                    type="text"
                    id="new-achternaam-p2"
                    value={newChild2.achternaam}
                    onChange={(e) => setNewChild2({ ...newChild2, achternaam: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#154273]"
                    placeholder=""
                  />
                </div>

                {/* Geboortedatum */}
                <div className="md:col-span-3">
                  <label htmlFor="new-geboortedatum-p2" className="block text-sm font-bold mb-2 text-gray-900">
                    Geboortedatum
                  </label>
                  <input
                    type="date"
                    id="new-geboortedatum-p2"
                    value={newChild2.geboortedatum}
                    onChange={(e) => setNewChild2({ ...newChild2, geboortedatum: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#154273]"
                    placeholder="dd-mm-jjjj"
                    required
                    max={new Date().toISOString().split('T')[0]}
                  />
                </div>
              </div>

              {/* Add child button */}
              <button
                onClick={addChild2}
                disabled={!newChild2.voornamen || !newChild2.achternaam || !newChild2.geboortedatum || (child2ValidationResult !== null && !child2ValidationResult.isValid)}
                className="inline-flex items-center gap-2 bg-white text-[#154273] font-sans text-base font-bold px-5 py-3 rounded border-2 border-[#154273] hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-[#154273] focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Kind toevoegen
              </button>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex flex-col gap-4">
            {/* General validation errors (for continue button) */}
            {validationErrors.length > 0 && partner1HasChildren !== true && partner2HasChildren !== true && (
              <div className="p-4 bg-red-50 border-l-4 border-red-600 rounded" role="alert">
                <div className="flex items-start">
                  <svg className="w-5 h-5 text-red-600 mr-2 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <h3 className="text-sm font-bold text-red-900 mb-1">Controleer uw invoer</h3>
                    <ul className="list-disc list-inside text-sm text-red-800">
                      {validationErrors.map((error, idx) => (
                        <li key={idx}>{error}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}
            
            <button
              onClick={handleContinue}
              disabled={isSaving}
              className="inline-flex items-center justify-center gap-2 bg-[#154273] text-white font-sans text-base font-bold px-6 py-3 rounded hover:bg-[#1a5a99] focus:outline-none focus:ring-2 focus:ring-[#154273] focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? 'Opslaan...' : 'Volgende stap'}
              {!isSaving && (
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
              )}
            </button>
          </div>
        </article>
      </main>
    </div>
  );
}

