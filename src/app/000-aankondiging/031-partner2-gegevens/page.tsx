'use client';

import type { JSX } from 'react';
import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useUser } from '@clerk/nextjs';

/**
 * Partner 2 gegevens invoer pagina
 * Gebruiker kan gegevens handmatig invoeren
 * Clerk gegevens worden automatisch ingevuld waar mogelijk
 */
function Partner2GegevensContent(): JSX.Element {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dossierId = searchParams.get('dossierId');
  const { user, isLoaded: userLoaded } = useUser();
  
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [usePartner1Address, setUsePartner1Address] = useState(false);
  const [partner1Data, setPartner1Data] = useState<{
    adres: string;
    postcode: string;
    plaats: string;
  } | null>(null);

  // Helper functions for date conversion
  // Convert DD-MM-YYYY to YYYY-MM-DD (for date input)
  const convertToDateInput = (dateStr: string): string => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length === 3 && parts[0].length === 2 && parts[1].length === 2 && parts[2].length === 4) {
      // DD-MM-YYYY format
      return `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
    return dateStr; // Return as-is if format doesn't match
  };

  // Convert YYYY-MM-DD to DD-MM-YYYY (for database)
  const convertToDatabaseFormat = (dateStr: string): string => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length === 3 && parts[0].length === 4) {
      // YYYY-MM-DD format
      return `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
    return dateStr; // Return as-is if format doesn't match
  };

  // Form state
  const [formData, setFormData] = useState({
    voornamen: '',
    geslachtsnaam: '',
    geboortedatum: '', // Will store YYYY-MM-DD for date input
    geboorteplaats: '',
    geboorteland: 'Nederland',
    email: '',
    telefoon: '',
    adres: '',
    postcode: '',
    plaats: '',
  });

  // Generate test data for prototype (different from partner 1)
  const generateTestData = () => {
    const testNames = [
      { voornamen: 'Emma', geslachtsnaam: 'Jansen' },
      { voornamen: 'Lucas', geslachtsnaam: 'de Vries' },
      { voornamen: 'Sophie', geslachtsnaam: 'Bakker' },
      { voornamen: 'Noah', geslachtsnaam: 'Visser' },
      { voornamen: 'Eva', geslachtsnaam: 'Smit' },
    ];
    const testPlaces = ['Groningen', 'Tilburg', 'Almere', 'Breda', 'Nijmegen'];
    const testStreets = ['Lindenlaan', 'Beukenstraat', 'Eikenweg', 'Wilgenlaan', 'Berkstraat'];
    
    const randomName = testNames[Math.floor(Math.random() * testNames.length)];
    const randomPlace = testPlaces[Math.floor(Math.random() * testPlaces.length)];
    const randomStreet = testStreets[Math.floor(Math.random() * testStreets.length)];
    
    // Generate random date between 18 and 65 years ago
    const today = new Date();
    const minAge = 18;
    const maxAge = 65;
    const randomAge = minAge + Math.floor(Math.random() * (maxAge - minAge));
    const birthYear = today.getFullYear() - randomAge;
    const birthMonth = String(Math.floor(Math.random() * 12) + 1).padStart(2, '0');
    const birthDay = String(Math.floor(Math.random() * 28) + 1).padStart(2, '0');
    
    const houseNumber = Math.floor(Math.random() * 200) + 1;
    const postcode = `${Math.floor(Math.random() * 9000) + 1000}${String.fromCharCode(65 + Math.floor(Math.random() * 26))}${String.fromCharCode(65 + Math.floor(Math.random() * 26))}`;
    
    return {
      voornamen: randomName.voornamen,
      geslachtsnaam: randomName.geslachtsnaam,
      geboortedatum: `${birthYear}-${birthMonth}-${birthDay}`,
      geboorteplaats: randomPlace,
      geboorteland: 'Nederland',
      email: `${randomName.voornamen.toLowerCase()}.${randomName.geslachtsnaam.toLowerCase().replace(' ', '')}@example.com`,
      telefoon: `06${Math.floor(Math.random() * 90000000) + 10000000}`,
      adres: `${randomStreet} ${houseNumber}`,
      postcode: postcode,
      plaats: randomPlace,
    };
  };

  // Auto-fill from Clerk user data when available, otherwise use test data
  useEffect(() => {
    if (userLoaded) {
      const hasData = formData.voornamen || formData.geslachtsnaam;
      
      if (user && !hasData) {
        // Try to fill from Clerk first
        const clerkData: Partial<typeof formData> = {};
        
        if (user.firstName) {
          clerkData.voornamen = user.firstName;
        }
        if (user.lastName) {
          clerkData.geslachtsnaam = user.lastName;
        }
        if (user.emailAddresses && user.emailAddresses.length > 0) {
          const primaryEmail = user.emailAddresses.find(e => e.id === user.primaryEmailAddressId) || user.emailAddresses[0];
          if (primaryEmail) {
            clerkData.email = primaryEmail.emailAddress;
          }
        }
        
        // If we got some Clerk data, use it, otherwise use test data
        if (Object.keys(clerkData).length > 0) {
          setFormData(prev => ({ ...prev, ...clerkData }));
        } else {
          // No Clerk data and no existing data - use test data for prototype
          setFormData(generateTestData());
        }
      } else if (!hasData) {
        // No user and no data - use test data for prototype
        setFormData(generateTestData());
      }
    }
  }, [userLoaded, user]);

  // Check for dossierId on mount and fetch Partner 1 data
  useEffect(() => {
    if (!dossierId) {
      setError('Geen dossier ID gevonden. Start opnieuw.');
      // Redirect to start after 3 seconds
      const timeoutId = setTimeout(() => {
        router.push('/000-aankondiging/010-aankondiging');
      }, 3000);
      return () => clearTimeout(timeoutId);
    }

    // Fetch Partner 1 and Partner 2 data
    async function fetchPartnerData() {
      try {
        const response = await fetch(`/api/dossier/${dossierId}/partners`);
        const result = await response.json();
        
        if (result.success && result.data) {
          // Set Partner 1 address data for copy option
          if (result.data.partner1) {
            setPartner1Data({
              adres: result.data.partner1.adres || '',
              postcode: result.data.partner1.postcode || '',
              plaats: result.data.partner1.plaats || '',
            });
          }
          
          // Load existing Partner 2 data if available
          if (result.data.partner2) {
            const partner2 = result.data.partner2;
            setFormData({
              voornamen: partner2.voornamen || '',
              geslachtsnaam: partner2.achternaam || '',
              geboortedatum: convertToDateInput(partner2.geboortedatum || ''), // Convert DD-MM-YYYY to YYYY-MM-DD
              geboorteplaats: partner2.geboorteplaats || '',
              geboorteland: partner2.geboorteland || 'Nederland',
              email: partner2.email || '',
              telefoon: partner2.telefoon || '',
              adres: partner2.adres || '',
              postcode: partner2.postcode || '',
              plaats: partner2.plaats || '',
            });
          } else {
            // No existing Partner 2 data - auto-fill with test data for prototype
            const hasAnyData = formData.voornamen || formData.geslachtsnaam;
            if (!hasAnyData) {
              setFormData(generateTestData());
            }
          }
        } else {
          // No data at all - auto-fill with test data for prototype
          const hasAnyData = formData.voornamen || formData.geslachtsnaam;
          if (!hasAnyData) {
            setFormData(generateTestData());
          }
        }
      } catch (err) {
        console.error('Error fetching partner data:', err);
        // On error, auto-fill with test data for prototype
        const hasAnyData = formData.voornamen || formData.geslachtsnaam;
        if (!hasAnyData) {
          setFormData(generateTestData());
        }
      }
    }

    fetchPartnerData();
  }, [dossierId, router]);

  // Handle checkbox change for using Partner 1 address
  const handleUsePartner1AddressChange = (checked: boolean) => {
    setUsePartner1Address(checked);
    
    if (checked && partner1Data) {
      // Copy Partner 1 address data
      setFormData(prev => ({
        ...prev,
        adres: partner1Data.adres,
        postcode: partner1Data.postcode,
        plaats: partner1Data.plaats,
      }));
    } else if (!checked) {
      // Clear address fields when unchecked
      setFormData(prev => ({
        ...prev,
        adres: '',
        postcode: '',
        plaats: '',
      }));
    }
  };

  // Validate form data
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.voornamen.trim()) {
      errors.voornamen = 'Voornamen is verplicht';
    }

    if (!formData.geslachtsnaam.trim()) {
      errors.geslachtsnaam = 'Achternaam is verplicht';
    }

    if (!formData.geboortedatum.trim()) {
      errors.geboortedatum = 'Geboortedatum is verplicht';
    } else {
      // Validate date format (YYYY-MM-DD from date input)
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(formData.geboortedatum)) {
        errors.geboortedatum = 'Selecteer een geldige geboortedatum';
      }
    }

    if (!formData.geboorteplaats.trim()) {
      errors.geboorteplaats = 'Geboorteplaats is verplicht';
    }

    // Email validation (optional but if provided, must be valid)
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Ongeldig e-mailadres';
    }

    // Postcode validation (optional but if provided, must be valid Dutch format)
    if (formData.postcode && !/^\d{4}\s?[A-Z]{2}$/i.test(formData.postcode)) {
      errors.postcode = 'Postcode moet het formaat 1234AB hebben';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle form input changes
  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear validation error for this field when user starts typing
    if (validationErrors[field]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  // Handle postcode change and fetch address from BAG API
  const handlePostcodeChange = async (value: string) => {
    // Don't fetch if address is copied from Partner 1
    if (usePartner1Address) {
      return;
    }

    // Update postcode field
    handleInputChange('postcode', value.toUpperCase());

    // Check if postcode is complete (6 characters: 4 digits + 2 letters)
    const normalizedPostcode = value.replace(/\s/g, '').toUpperCase();
    if (normalizedPostcode.length === 6) {
      const postcodeRegex = /^[1-9][0-9]{3}[A-Z]{2}$/;
      if (postcodeRegex.test(normalizedPostcode)) {
        try {
          // Fetch address data from BAG API
          const response = await fetch(`/api/bag/postcode?postcode=${normalizedPostcode}`);
          const result = await response.json();

          if (result.success && result.data) {
            // Auto-fill address fields
            setFormData(prev => ({
              ...prev,
              postcode: result.data.postcode,
              plaats: result.data.woonplaats || prev.plaats,
              // Only update adres if it's empty or if we have a house number
              adres: prev.adres || (result.data.huisnummer 
                ? `${result.data.straatnaam} ${result.data.huisnummer}`.trim()
                : result.data.straatnaam || prev.adres),
            }));
          }
        } catch (error) {
          console.error('Error fetching BAG data:', error);
          // Don't show error to user, just silently fail
        }
      }
    }
  };

  // Save partner data to database
  const handleSave = async () => {
    if (!dossierId) {
      setError('Geen dossier ID gevonden');
      return;
    }

    if (!validateForm()) {
      setError('Controleer de ingevulde gegevens');
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const response = await fetch(`/api/dossier/${dossierId}/partners`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sequence: 2,
          voornamen: formData.voornamen.trim(),
          geslachtsnaam: formData.geslachtsnaam.trim(),
          geboortedatum: convertToDatabaseFormat(formData.geboortedatum.trim()), // Convert YYYY-MM-DD to DD-MM-YYYY
          geboorteplaats: formData.geboorteplaats.trim(),
          geboorteland: formData.geboorteland,
          email: formData.email.trim() || null,
          telefoon: formData.telefoon.trim() || null,
          adres: formData.adres.trim() || null,
          postcode: formData.postcode.trim().toUpperCase() || null,
          plaats: formData.plaats.trim() || null,
        }),
      });

      const result = await response.json();
      
      if (!result.success) {
        // Show validation errors if available
        if (result.validationErrors && Array.isArray(result.validationErrors)) {
          setError(result.validationErrors.join('. ') || result.error || 'Fout bij opslaan van gegevens');
        } else {
          // Show detailed error in development, generic in production
          const errorMessage = result.error || 'Fout bij opslaan van gegevens';
          const details = result.details ? ` (${result.details})` : '';
          setError(errorMessage + details);
        }
        console.error('Save error:', result);
        return;
      }

      setIsSaved(true);
      // Navigate to next step after short delay
      setTimeout(() => {
        router.push(`/000-aankondiging/040-curatele?dossierId=${dossierId}`);
      }, 500);
    } catch (err) {
      console.error('Error saving partner data:', err);
      const errorMessage = err instanceof Error ? err.message : 'Er ging iets mis bij het opslaan';
      setError(`Fout: ${errorMessage}. Controleer de console voor meer details.`);
    } finally {
      setIsSaving(false);
    }
  };

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
          {/* Error message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-600 rounded" role="alert">
              <div className="flex items-start">
                <svg className="w-5 h-5 text-red-600 mr-2 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <p className="text-sm text-red-800">{error}</p>
              </div>
            </div>
          )}

          {/* Loading message */}
          {isSaving && (
            <div className="mb-6 p-4 bg-blue-50 border-l-4 border-blue-600 rounded" role="status">
              <p className="text-sm text-blue-800">Gegevens worden opgeslagen...</p>
            </div>
          )}

          {/* Previous step link */}
          <Link
            href={dossierId ? `/000-aankondiging/030-partner2-login?dossierId=${dossierId}` : '/000-aankondiging/030-partner2-login'}
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
            Gegevens partner 2
          </h2>

          {/* Progress bar */}
          <div className="mb-8">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-[#154273] h-2 rounded-full transition-all duration-300"
                style={{ width: '50%' }}
                role="progressbar"
                aria-valuenow={50}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label="Voortgang: 50%"
              />
            </div>
          </div>

          {/* Instructions */}
          <div className="mb-8">
            <p className="text-base leading-relaxed text-gray-700 mb-2">
              Vul hieronder uw gegevens in. Gegevens van uw inlog worden automatisch ingevuld waar mogelijk.
            </p>
            <p className="text-sm text-gray-600">
              Velden met een * zijn verplicht.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={(e) => { e.preventDefault(); handleSave(); }} className="space-y-6 mb-8">
            {/* Voornamen */}
            <div>
              <label htmlFor="voornamen" className="block text-sm font-bold text-gray-900 mb-1">
                Voornamen <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                id="voornamen"
                value={formData.voornamen}
                onChange={(e) => handleInputChange('voornamen', e.target.value)}
                className={`w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-[#154273] focus:ring-offset-2 ${
                  validationErrors.voornamen ? 'border-red-600' : 'border-gray-300'
                }`}
                required
                aria-invalid={!!validationErrors.voornamen}
                aria-describedby={validationErrors.voornamen ? 'voornamen-error' : undefined}
              />
              {validationErrors.voornamen && (
                <p id="voornamen-error" className="mt-1 text-sm text-red-600" role="alert">
                  {validationErrors.voornamen}
                </p>
              )}
            </div>

            {/* Achternaam */}
            <div>
              <label htmlFor="geslachtsnaam" className="block text-sm font-bold text-gray-900 mb-1">
                Achternaam <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                id="geslachtsnaam"
                value={formData.geslachtsnaam}
                onChange={(e) => handleInputChange('geslachtsnaam', e.target.value)}
                className={`w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-[#154273] focus:ring-offset-2 ${
                  validationErrors.geslachtsnaam ? 'border-red-600' : 'border-gray-300'
                }`}
                required
                aria-invalid={!!validationErrors.geslachtsnaam}
                aria-describedby={validationErrors.geslachtsnaam ? 'geslachtsnaam-error' : undefined}
              />
              {validationErrors.geslachtsnaam && (
                <p id="geslachtsnaam-error" className="mt-1 text-sm text-red-600" role="alert">
                  {validationErrors.geslachtsnaam}
                </p>
              )}
            </div>

            {/* Geboortedatum */}
            <div>
              <label htmlFor="geboortedatum" className="block text-sm font-bold text-gray-900 mb-1">
                Geboortedatum <span className="text-red-600">*</span>
              </label>
              <input
                type="date"
                id="geboortedatum"
                value={formData.geboortedatum}
                onChange={(e) => handleInputChange('geboortedatum', e.target.value)}
                max={new Date().toISOString().split('T')[0]} // Cannot select future dates
                className={`w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-[#154273] focus:ring-offset-2 ${
                  validationErrors.geboortedatum ? 'border-red-600' : 'border-gray-300'
                }`}
                required
                aria-invalid={!!validationErrors.geboortedatum}
                aria-describedby={validationErrors.geboortedatum ? 'geboortedatum-error' : undefined}
              />
              {validationErrors.geboortedatum && (
                <p id="geboortedatum-error" className="mt-1 text-sm text-red-600" role="alert">
                  {validationErrors.geboortedatum}
                </p>
              )}
              <p className="mt-1 text-sm text-gray-600">Selecteer uw geboortedatum</p>
            </div>

            {/* Geboorteplaats */}
            <div>
              <label htmlFor="geboorteplaats" className="block text-sm font-bold text-gray-900 mb-1">
                Geboorteplaats <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                id="geboorteplaats"
                value={formData.geboorteplaats}
                onChange={(e) => handleInputChange('geboorteplaats', e.target.value)}
                className={`w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-[#154273] focus:ring-offset-2 ${
                  validationErrors.geboorteplaats ? 'border-red-600' : 'border-gray-300'
                }`}
                required
                aria-invalid={!!validationErrors.geboorteplaats}
                aria-describedby={validationErrors.geboorteplaats ? 'geboorteplaats-error' : undefined}
              />
              {validationErrors.geboorteplaats && (
                <p id="geboorteplaats-error" className="mt-1 text-sm text-red-600" role="alert">
                  {validationErrors.geboorteplaats}
                </p>
              )}
            </div>

            {/* Geboorteland */}
            <div>
              <label htmlFor="geboorteland" className="block text-sm font-bold text-gray-900 mb-1">
                Geboorteland <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                id="geboorteland"
                value={formData.geboorteland}
                onChange={(e) => handleInputChange('geboorteland', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#154273] focus:ring-offset-2"
                required
              />
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-bold text-gray-900 mb-1">
                E-mailadres
              </label>
              <input
                type="email"
                id="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                className={`w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-[#154273] focus:ring-offset-2 ${
                  validationErrors.email ? 'border-red-600' : 'border-gray-300'
                }`}
                aria-invalid={!!validationErrors.email}
                aria-describedby={validationErrors.email ? 'email-error' : undefined}
              />
              {validationErrors.email && (
                <p id="email-error" className="mt-1 text-sm text-red-600" role="alert">
                  {validationErrors.email}
                </p>
              )}
            </div>

            {/* Telefoon */}
            <div>
              <label htmlFor="telefoon" className="block text-sm font-bold text-gray-900 mb-1">
                Telefoonnummer
              </label>
              <input
                type="tel"
                id="telefoon"
                value={formData.telefoon}
                onChange={(e) => handleInputChange('telefoon', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#154273] focus:ring-offset-2"
              />
            </div>

            {/* Adres sectie */}
            <div className="border-t border-gray-300 pt-6 mt-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Adresgegevens</h3>
              
              {/* Option to use Partner 1 address */}
              {partner1Data && (partner1Data.adres || partner1Data.postcode || partner1Data.plaats) && (
                <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded">
                  <label className="flex items-start cursor-pointer">
                    <input
                      type="checkbox"
                      checked={usePartner1Address}
                      onChange={(e) => handleUsePartner1AddressChange(e.target.checked)}
                      className="mt-1 mr-3 w-5 h-5 text-[#154273] border-gray-300 rounded focus:ring-2 focus:ring-[#154273] focus:ring-offset-2"
                    />
                    <div className="flex-1">
                      <span className="block text-sm font-bold text-gray-900 mb-1">
                        Adresgegevens overnemen van partner 1
                      </span>
                      <span className="block text-sm text-gray-700">
                        {partner1Data.adres && (
                          <span className="block">{partner1Data.adres}</span>
                        )}
                        {partner1Data.postcode && partner1Data.plaats && (
                          <span className="block">{partner1Data.postcode} {partner1Data.plaats}</span>
                        )}
                        {!partner1Data.adres && !partner1Data.postcode && !partner1Data.plaats && (
                          <span className="text-gray-500">Partner 1 heeft nog geen adresgegevens ingevuld</span>
                        )}
                      </span>
                    </div>
                  </label>
                </div>
              )}
              
              {/* Adres */}
              <div className="mb-4">
                <label htmlFor="adres" className="block text-sm font-bold text-gray-900 mb-1">
                  Straatnaam en huisnummer
                </label>
                <input
                  type="text"
                  id="adres"
                  value={formData.adres}
                  onChange={(e) => handleInputChange('adres', e.target.value)}
                  placeholder="bijv. Kerkstraat 12"
                  disabled={usePartner1Address}
                  className={`w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#154273] focus:ring-offset-2 ${
                    usePartner1Address ? 'bg-gray-100 cursor-not-allowed' : ''
                  }`}
                />
              </div>

              {/* Postcode */}
              <div className="mb-4">
                <label htmlFor="postcode" className="block text-sm font-bold text-gray-900 mb-1">
                  Postcode
                </label>
                <input
                  type="text"
                  id="postcode"
                  value={formData.postcode}
                  onChange={(e) => handlePostcodeChange(e.target.value)}
                  onBlur={(e) => {
                    // Also try to fetch on blur if postcode is complete
                    const normalized = e.target.value.replace(/\s/g, '').toUpperCase();
                    if (normalized.length === 6 && !usePartner1Address) {
                      handlePostcodeChange(e.target.value);
                    }
                  }}
                  placeholder="1234AB"
                  maxLength={7}
                  disabled={usePartner1Address}
                  className={`w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-[#154273] focus:ring-offset-2 ${
                    validationErrors.postcode ? 'border-red-600' : 'border-gray-300'
                  } ${usePartner1Address ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                  aria-invalid={!!validationErrors.postcode}
                  aria-describedby={validationErrors.postcode ? 'postcode-error' : undefined}
                />
                {validationErrors.postcode && (
                  <p id="postcode-error" className="mt-1 text-sm text-red-600" role="alert">
                    {validationErrors.postcode}
                  </p>
                )}
                <p className="mt-1 text-sm text-gray-600">Formaat: 1234AB</p>
              </div>

              {/* Plaats (Woonplaats) */}
              <div>
                <label htmlFor="plaats" className="block text-sm font-bold text-gray-900 mb-1">
                  Woonplaats
                </label>
                <input
                  type="text"
                  id="plaats"
                  value={formData.plaats}
                  onChange={(e) => handleInputChange('plaats', e.target.value)}
                  placeholder="bijv. Amsterdam"
                  disabled={usePartner1Address}
                  className={`w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#154273] focus:ring-offset-2 ${
                    usePartner1Address ? 'bg-gray-100 cursor-not-allowed' : ''
                  }`}
                />
              </div>
            </div>
          </form>

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving || isSaved}
              className="inline-flex items-center justify-center gap-2 bg-[#154273] text-white font-sans text-base font-bold px-6 py-3 rounded hover:bg-[#1a5a99] focus:outline-none focus:ring-2 focus:ring-[#154273] focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? (
                <>
                  <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Opslaan...
                </>
              ) : isSaved ? (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Opgeslagen
                </>
              ) : (
                <>
                  Opslaan en doorgaan
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
                </>
              )}
            </button>
          </div>
        </article>
      </main>
    </div>
  );
}

/**
 * Page wrapper with Suspense boundary for useSearchParams
 */
export default function Partner2GegevensPage(): JSX.Element {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-b from-blue-50 to-blue-100 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Laden...</p>
          </div>
        </div>
      }
    >
      <Partner2GegevensContent />
    </Suspense>
  );
}

