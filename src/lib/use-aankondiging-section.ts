/**
 * Custom React Hook for aankondiging form state management
 * Provides easy integration with session storage for form data
 */

import { useState, useEffect } from 'react';
import { 
  getAankondigingSection, 
  saveAankondigingSection,
  type AankondigingData 
} from './aankondiging-storage';

export function useAankondigingSection<K extends keyof AankondigingData>(
  section: K
): [AankondigingData[K] | undefined, (data: AankondigingData[K]) => void, boolean] {
  const [data, setData] = useState<AankondigingData[K] | undefined>();
  const [isLoaded, setIsLoaded] = useState(false);

  // Load data on mount
  useEffect(() => {
    const savedData = getAankondigingSection(section);
    setData(savedData);
    setIsLoaded(true);
  }, [section]);

  // Save function
  const saveData = (newData: AankondigingData[K]) => {
    setData(newData);
    saveAankondigingSection(section, newData);
  };

  return [data, saveData, isLoaded];
}

