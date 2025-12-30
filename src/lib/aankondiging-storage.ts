/**
 * @deprecated Deze file is deprecated. Gebruik database opslag via API endpoints.
 * 
 * Aankondiging Storage - Browser storage for multi-step form data
 * This provides temporary storage during the announcement form flow
 * 
 * Uses localStorage for "save and continue later" functionality
 * Uses sessionStorage for temporary form state during active session
 * 
 * ⚠️ DEPRECATED: Alle functionaliteit is gemigreerd naar database opslag.
 * Deze file wordt alleen nog gebruikt voor backwards compatibility.
 * Nieuwe code moet direct database API endpoints gebruiken:
 * - /api/dossier/create
 * - /api/dossier/[id]/aankondiging
 * - /api/dossier/[id]/partners
 * - /api/dossier/[id]/kinderen
 * - /api/dossier/[id]/curatele
 * - /api/dossier/[id]/bloedverwantschap
 * - /api/dossier/[id]/samenvatting
 * 
 * Zie DATABASE-STORAGE-MIGRATION.md voor volledige documentatie.
 */

export interface AankondigingData {
  // Step 010: Type aankondiging
  type?: 'huwelijk' | 'partnerschap';
  
  // Step 020-021: Partner 1 (from DigiD)
  partner1?: {
    voornamen: string;
    achternaam: string;
    geboortedatum: string;
    adres?: string;
    postcode?: string;
    plaats?: string;
    burgerlijkeStaat?: string;
    ouders?: string[];
    email?: string;
  };
  
  // Step 030-031: Partner 2 (from DigiD/eIDAS)
  partner2?: {
    voornamen: string;
    achternaam: string;
    geboortedatum: string;
    adres?: string;
    postcode?: string;
    plaats?: string;
    burgerlijkeStaat?: string;
    ouders?: string[];
    email?: string;
  };
  
  // Step 040: Curatele
  curatele?: {
    partner1UnderGuardianship: boolean;
    partner1Document?: File | { name: string; size: number };
    partner2UnderGuardianship: boolean;
    partner2Document?: File | { name: string; size: number };
  };
  
  // Step 050: Kinderen
  kinderen?: {
    partner1HasChildren: boolean;
    partner1Children: Array<{
      id: string;
      voornamen: string;
      achternaam: string;
      geboortedatum: string;
    }>;
    partner2HasChildren: boolean;
    partner2Children: Array<{
      id: string;
      voornamen: string;
      achternaam: string;
      geboortedatum: string;
    }>;
  };
  
  // Step 060: Bloedverwantschap
  bloedverwantschap?: {
    areBloodRelatives: boolean;
  };
}

const STORAGE_KEY = 'aankondiging_draft';
const STORAGE_TYPE: 'sessionStorage' | 'localStorage' = 'sessionStorage';

/**
 * Get the appropriate storage object
 */
function getStorage(): Storage {
  if (typeof window === 'undefined') {
    // Server-side rendering fallback
    return {
      getItem: () => null,
      setItem: () => {},
      removeItem: () => {},
      clear: () => {},
      length: 0,
      key: () => null,
    } as Storage;
  }
  return STORAGE_TYPE === 'localStorage' ? localStorage : sessionStorage;
}

/**
 * Save aankondiging data to storage
 */
export function saveAankondigingData(data: Partial<AankondigingData>): void {
  try {
    const existing = getAankondigingData();
    const merged = { ...existing, ...data };
    getStorage().setItem(STORAGE_KEY, JSON.stringify(merged));
  } catch (error) {
    console.error('Failed to save aankondiging data:', error);
  }
}

/**
 * Get aankondiging data from storage
 */
export function getAankondigingData(): AankondigingData {
  try {
    const data = getStorage().getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : {};
  } catch (error) {
    console.error('Failed to get aankondiging data:', error);
    return {};
  }
}

/**
 * Clear aankondiging data from storage
 */
export function clearAankondigingData(): void {
  try {
    getStorage().removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Failed to clear aankondiging data:', error);
  }
}

/**
 * Get specific section of aankondiging data
 */
export function getAankondigingSection<K extends keyof AankondigingData>(
  section: K
): AankondigingData[K] | undefined {
  const data = getAankondigingData();
  return data[section];
}

/**
 * Save specific section of aankondiging data
 */
export function saveAankondigingSection<K extends keyof AankondigingData>(
  section: K,
  sectionData: AankondigingData[K]
): void {
  saveAankondigingData({ [section]: sectionData } as Partial<AankondigingData>);
}

/**
 * Save for later - persists data to localStorage and returns a resume token
 * This is used for the "Opslaan en later verder" functionality
 */
export function saveForLater(): { success: boolean; token: string | null; email?: string } {
  try {
    // Get current session data
    const sessionData = getAankondigingData();
    
    // Generate a simple token (in production, this should be a secure UUID from backend)
    const token = `draft_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Save to localStorage with token
    localStorage.setItem(`aankondiging_saved_${token}`, JSON.stringify({
      data: sessionData,
      savedAt: new Date().toISOString(),
      token,
    }));
    
    // Also save the token reference
    const tokens = JSON.parse(localStorage.getItem('aankondiging_tokens') || '[]');
    tokens.push(token);
    localStorage.setItem('aankondiging_tokens', JSON.stringify(tokens));
    
    // TODO: Send email with resume link via API
    // For now, we'll just return the token
    
    return {
      success: true,
      token,
      email: 'TODO: Implement email sending',
    };
  } catch (error) {
    console.error('Failed to save for later:', error);
    return {
      success: false,
      token: null,
    };
  }
}

/**
 * Resume from saved token
 */
export function resumeFromToken(token: string): AankondigingData | null {
  try {
    const saved = localStorage.getItem(`aankondiging_saved_${token}`);
    if (!saved) {
      return null;
    }
    
    const { data } = JSON.parse(saved);
    
    // Copy to current session
    saveAankondigingData(data);
    
    return data;
  } catch (error) {
    console.error('Failed to resume from token:', error);
    return null;
  }
}

/**
 * Get all saved tokens for current user
 */
export function getSavedTokens(): string[] {
  try {
    return JSON.parse(localStorage.getItem('aankondiging_tokens') || '[]');
  } catch (error) {
    console.error('Failed to get saved tokens:', error);
    return [];
  }
}


