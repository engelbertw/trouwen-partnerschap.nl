/**
 * Validatie utilities voor kwaliteitscontroles
 * 
 * Implementeert alle validatieregels uit de database voor transparante
 * en traceerbare kwaliteitscontroles conform AVG en Burgerlijk Wetboek.
 * 
 * @see sql/070_validation_rules.sql - Database schema
 * @see sql/080_validation_seeds.sql - Validatieregels definities
 */

// ============================================================================
// Types
// ============================================================================

export type ValidationResult = {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
};

export type ValidationError = {
  field: string;
  code: string;
  message: string;
  priority: 1 | 2 | 3;
};

export type ValidationWarning = {
  field: string;
  code: string;
  message: string;
};

export type PartnerData = {
  voornamen?: string;
  achternaam?: string;
  geboortedatum?: string;
  geboorteNaam?: string;
  bsn?: string;
  email?: string;
  telefoonnummer?: string;
  postcode?: string;
};

export type KindData = {
  voornamen: string;
  achternaam: string;
  geboortedatum: string;
};

export type GetuigeData = {
  voornamen: string;
  voorvoegsel?: string;
  achternaam: string;
  geboortedatum: string;
  geboorteplaats?: string;
};

// ============================================================================
// Datum utilities
// ============================================================================

/**
 * Parse Nederlandse datum string (DD-MM-JJJJ) naar Date object
 */
export function parseDutchDate(dateString: string): Date | null {
  if (!dateString) return null;
  
  const parts = dateString.split('-');
  if (parts.length !== 3) return null;
  
  const day = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1; // Months are 0-indexed
  const year = parseInt(parts[2], 10);
  
  const date = new Date(year, month, day);
  
  // Valideer dat de datum geldig is
  if (
    date.getDate() !== day ||
    date.getMonth() !== month ||
    date.getFullYear() !== year
  ) {
    return null;
  }
  
  return date;
}

/**
 * Bereken leeftijd in jaren tussen twee datums
 */
export function calculateAge(birthDate: Date, referenceDate: Date = new Date()): number {
  const age = referenceDate.getFullYear() - birthDate.getFullYear();
  const monthDiff = referenceDate.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && referenceDate.getDate() < birthDate.getDate())) {
    return age - 1;
  }
  
  return age;
}

/**
 * Bereken verschil in dagen tussen twee datums
 */
export function daysDifference(date1: Date, date2: Date): number {
  const msPerDay = 24 * 60 * 60 * 1000;
  return Math.floor((date2.getTime() - date1.getTime()) / msPerDay);
}

// ============================================================================
// BSN Validatie (11-proef)
// ============================================================================

/**
 * Valideer BSN met 11-proef
 * @see https://nl.wikipedia.org/wiki/Burgerservicenummer#11-proef
 */
export function validateBSN(bsn: string): boolean {
  // Verwijder spaties en streepjes
  const cleaned = bsn.replace(/[\s-]/g, '');
  
  // Moet 8 of 9 cijfers zijn
  if (!/^[0-9]{8,9}$/.test(cleaned)) {
    return false;
  }
  
  // Pad met 0 als het 8 cijfers zijn
  const paddedBSN = cleaned.padStart(9, '0');
  
  // 11-proef
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    const digit = parseInt(paddedBSN[i], 10);
    const multiplier = i === 8 ? -1 : 9 - i;
    sum += digit * multiplier;
  }
  
  return sum % 11 === 0;
}

// ============================================================================
// Validatiefuncties voor Kinderen
// ============================================================================

/**
 * Valideer kind data
 * Regel codes: KIND001-KIND009
 */
export function validateKind(
  kind: KindData,
  ouderData: PartnerData
): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];
  
  // KIND001: Voornamen verplicht
  if (!kind.voornamen || kind.voornamen.trim().length === 0) {
    errors.push({
      field: 'voornamen',
      code: 'KIND_VOORNAMEN_VEREIST',
      message: 'Voer de voornamen van het kind in',
      priority: 1,
    });
  }
  
  // KIND002: Achternaam verplicht
  if (!kind.achternaam || kind.achternaam.trim().length === 0) {
    errors.push({
      field: 'achternaam',
      code: 'KIND_ACHTERNAAM_VEREIST',
      message: 'Voer de achternaam van het kind in',
      priority: 1,
    });
  }
  
  // KIND003: Geboortedatum verplicht
  if (!kind.geboortedatum || kind.geboortedatum.trim().length === 0) {
    errors.push({
      field: 'geboortedatum',
      code: 'KIND_GEBOORTEDATUM_VEREIST',
      message: 'Voer de geboortedatum van het kind in',
      priority: 1,
    });
  }
  
  // Als geboortedatum is ingevuld, doe aanvullende checks
  if (kind.geboortedatum && kind.geboortedatum.trim().length > 0) {
    // KIND004: Geboortedatum formaat
    if (!/^\d{2}-\d{2}-\d{4}$/.test(kind.geboortedatum)) {
      errors.push({
        field: 'geboortedatum',
        code: 'KIND_GEBOORTEDATUM_FORMAAT',
        message: 'Gebruik het formaat DD-MM-JJJJ (bijvoorbeeld 15-03-2010)',
        priority: 1,
      });
    } else {
      const kindGeboortedatum = parseDutchDate(kind.geboortedatum);
      
      if (!kindGeboortedatum) {
        errors.push({
          field: 'geboortedatum',
          code: 'KIND_GEBOORTEDATUM_FORMAAT',
          message: 'De ingevoerde datum is ongeldig',
          priority: 1,
        });
      } else {
        const now = new Date();
        now.setHours(0, 0, 0, 0); // Reset time to start of day for fair comparison
        
        // KIND005: Geboortedatum in verleden of vandaag
        if (kindGeboortedatum > now) {
          errors.push({
            field: 'geboortedatum',
            code: 'KIND_GEBOORTEDATUM_VERLEDEN',
            message: 'De geboortedatum kan niet in de toekomst liggen',
            priority: 1,
          });
        }
        
        // KIND008: Kind niet ouder dan 100 jaar
        const kindLeeftijd = calculateAge(kindGeboortedatum, now);
        if (kindLeeftijd > 100) {
          warnings.push({
            field: 'geboortedatum',
            code: 'KIND_MAX_LEEFTIJD',
            message: 'Controleer de geboortedatum - deze lijkt onwaarschijnlijk oud',
          });
        }
        
        // KIND006 & KIND007: Validatie tegen ouder geboortedatum
        if (ouderData.geboortedatum) {
          const ouderGeboortedatum = parseDutchDate(ouderData.geboortedatum);
          
          if (ouderGeboortedatum) {
            // KIND006: Kind moet jonger zijn dan ouder
            if (kindGeboortedatum <= ouderGeboortedatum) {
              errors.push({
                field: 'geboortedatum',
                code: 'KIND_JONGER_DAN_OUDER',
                message: 'De geboortedatum van het kind moet na de geboortedatum van de ouder liggen',
                priority: 1,
              });
            } else {
              // KIND007: Ouder minimaal 12 jaar bij geboorte kind
              const ouderLeeftijdBijGeboorte = calculateAge(ouderGeboortedatum, kindGeboortedatum);
              if (ouderLeeftijdBijGeboorte < 12) {
                errors.push({
                  field: 'geboortedatum',
                  code: 'OUDER_MIN_LEEFTIJD_BIJ_GEBOORTE',
                  message: 'De ouder moet minimaal 12 jaar oud zijn geweest bij de geboorte van het kind',
                  priority: 1,
                });
              }
            }
          }
        }
      }
    }
  }
  
  // KIND009: Achternaam komt overeen met een ouder (waarschuwing)
  if (kind.achternaam && ouderData.achternaam) {
    const kindAchternaam = kind.achternaam.toLowerCase().trim();
    const ouderAchternaam = ouderData.achternaam.toLowerCase().trim();
    const ouderGeboorteNaam = ouderData.geboorteNaam?.toLowerCase().trim() || '';
    
    if (
      kindAchternaam !== ouderAchternaam &&
      kindAchternaam !== ouderGeboorteNaam
    ) {
      warnings.push({
        field: 'achternaam',
        code: 'KIND_ACHTERNAAM_OVEREENKOMST',
        message: 'De achternaam van het kind komt niet overeen met de achternaam van de ouder. Controleer of dit correct is.',
      });
    }
  }
  
  // Algemene validaties
  validateGeneralTextFields(kind, errors);
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Valideer meerdere kinderen tegen beide partners
 */
export function validateKinderen(
  kinderen: KindData[],
  partner1: PartnerData,
  partner2: PartnerData
): ValidationResult {
  const allErrors: ValidationError[] = [];
  const allWarnings: ValidationWarning[] = [];
  
  kinderen.forEach((kind, index) => {
    // Valideer tegen beide partners
    const result1 = validateKind(kind, partner1);
    const result2 = validateKind(kind, partner2);
    
    // Neem de validatie met de minste errors (kind past beter bij die ouder)
    const result = result1.errors.length <= result2.errors.length ? result1 : result2;
    
    // Prefix errors met kind nummer
    result.errors.forEach(error => {
      allErrors.push({
        ...error,
        field: `kind_${index + 1}_${error.field}`,
      });
    });
    
    result.warnings.forEach(warning => {
      allWarnings.push({
        ...warning,
        field: `kind_${index + 1}_${warning.field}`,
      });
    });
  });
  
  return {
    isValid: allErrors.length === 0,
    errors: allErrors,
    warnings: allWarnings,
  };
}

// ============================================================================
// Validatiefuncties voor Getuigen
// ============================================================================

/**
 * Valideer getuige data
 * Regel codes: GETUIGE001-GETUIGE006
 */
export function validateGetuige(
  getuige: GetuigeData,
  huwelijksdatum?: string
): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];
  
  // GETUIGE001: Voornamen verplicht
  if (!getuige.voornamen || getuige.voornamen.trim().length === 0) {
    errors.push({
      field: 'voornamen',
      code: 'GETUIGE_VOORNAMEN_VEREIST',
      message: 'Voer de voornamen van de getuige in',
      priority: 1,
    });
  }
  
  // GETUIGE002: Achternaam verplicht
  if (!getuige.achternaam || getuige.achternaam.trim().length === 0) {
    errors.push({
      field: 'achternaam',
      code: 'GETUIGE_ACHTERNAAM_VEREIST',
      message: 'Voer de achternaam van de getuige in',
      priority: 1,
    });
  }
  
  // GETUIGE003: Geboortedatum verplicht
  if (!getuige.geboortedatum || getuige.geboortedatum.trim().length === 0) {
    errors.push({
      field: 'geboortedatum',
      code: 'GETUIGE_GEBOORTEDATUM_VEREIST',
      message: 'Voer de geboortedatum van de getuige in',
      priority: 1,
    });
  }
  
  // Als geboortedatum is ingevuld, doe aanvullende checks
  if (getuige.geboortedatum && getuige.geboortedatum.trim().length > 0) {
    // GETUIGE004: Geboortedatum formaat
    if (!/^\d{2}-\d{2}-\d{4}$/.test(getuige.geboortedatum)) {
      errors.push({
        field: 'geboortedatum',
        code: 'GETUIGE_GEBOORTEDATUM_FORMAAT',
        message: 'Gebruik het formaat DD-MM-JJJJ (bijvoorbeeld 15-03-1990)',
        priority: 1,
      });
    } else {
      const geboortedatum = parseDutchDate(getuige.geboortedatum);
      
      if (!geboortedatum) {
        errors.push({
          field: 'geboortedatum',
          code: 'GETUIGE_GEBOORTEDATUM_FORMAAT',
          message: 'De ingevoerde datum is ongeldig',
          priority: 1,
        });
      } else {
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        
        // GETUIGE005: Getuige moet minimaal 18 jaar oud zijn
        const leeftijd = calculateAge(geboortedatum, now);
        if (leeftijd < 18) {
          errors.push({
            field: 'geboortedatum',
            code: 'GETUIGE_MIN_LEEFTIJD',
            message: 'Een getuige moet minimaal 18 jaar oud zijn',
            priority: 1,
          });
        }
        
        // Als huwelijksdatum is opgegeven, check leeftijd op huwelijksdatum
        if (huwelijksdatum) {
          const huwelijkDatum = parseDutchDate(huwelijksdatum);
          if (huwelijkDatum) {
            const leeftijdBijHuwelijk = calculateAge(geboortedatum, huwelijkDatum);
            if (leeftijdBijHuwelijk < 18) {
              errors.push({
                field: 'geboortedatum',
                code: 'GETUIGE_MIN_LEEFTIJD_HUWELIJK',
                message: 'De getuige moet op de datum van de ceremonie minimaal 18 jaar oud zijn',
                priority: 1,
              });
            }
          }
        }
        
        // GETUIGE006: Leeftijd niet te oud (> 150 jaar)
        if (leeftijd > 150) {
          errors.push({
            field: 'geboortedatum',
            code: 'GETUIGE_MAX_LEEFTIJD',
            message: 'Controleer de geboortedatum - deze lijkt niet correct',
            priority: 1,
          });
        }
        
        // Waarschuwing bij hoge leeftijd
        if (leeftijd > 100) {
          warnings.push({
            field: 'geboortedatum',
            code: 'GETUIGE_HOGE_LEEFTIJD',
            message: 'Controleer de geboortedatum - deze lijkt onwaarschijnlijk oud',
          });
        }
      }
    }
  }
  
  // Algemene validaties
  validateGeneralTextFields(getuige, errors);
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Valideer meerdere getuigen
 */
export function validateGetuigen(
  getuigen: GetuigeData[],
  huwelijksdatum?: string
): ValidationResult {
  const allErrors: ValidationError[] = [];
  const allWarnings: ValidationWarning[] = [];
  
  // Check aantal getuigen
  if (getuigen.length < 2) {
    allErrors.push({
      field: 'getuigen',
      code: 'GETUIGEN_MIN_AANTAL',
      message: 'U moet minimaal 2 getuigen opgeven',
      priority: 1,
    });
  }
  
  if (getuigen.length > 4) {
    allErrors.push({
      field: 'getuigen',
      code: 'GETUIGEN_MAX_AANTAL',
      message: 'U kunt maximaal 4 getuigen opgeven',
      priority: 1,
    });
  }
  
  // Valideer elke getuige
  getuigen.forEach((getuige, index) => {
    const result = validateGetuige(getuige, huwelijksdatum);
    
    // Prefix errors met getuige nummer
    result.errors.forEach(error => {
      allErrors.push({
        ...error,
        field: `getuige_${index + 1}_${error.field}`,
      });
    });
    
    result.warnings.forEach(warning => {
      allWarnings.push({
        ...warning,
        field: `getuige_${index + 1}_${warning.field}`,
      });
    });
  });
  
  return {
    isValid: allErrors.length === 0,
    errors: allErrors,
    warnings: allWarnings,
  };
}

// ============================================================================
// Validatiefuncties voor Partners
// ============================================================================

/**
 * Valideer partner data
 * Regel codes: PARTNER001-PARTNER006
 */
export function validatePartner(
  partner: PartnerData,
  huwelijksdatum?: string
): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];
  
  // PARTNER001: Minimale leeftijd voor huwelijk
  if (partner.geboortedatum && huwelijksdatum) {
    const geboortedatum = parseDutchDate(partner.geboortedatum);
    const huwelijkDatum = parseDutchDate(huwelijksdatum);
    
    if (geboortedatum && huwelijkDatum) {
      const leeftijdBijHuwelijk = calculateAge(geboortedatum, huwelijkDatum);
      
      if (leeftijdBijHuwelijk < 18) {
        errors.push({
          field: 'geboortedatum',
          code: 'PARTNER_MIN_LEEFTIJD_HUWELIJK',
          message: 'U moet minimaal 18 jaar oud zijn om te kunnen trouwen',
          priority: 1,
        });
      }
    }
  }
  
  // PARTNER002 & PARTNER003: BSN validatie
  if (partner.bsn) {
    const bsnCleaned = partner.bsn.replace(/[\s-]/g, '');
    
    if (!/^[0-9]{8,9}$/.test(bsnCleaned)) {
      errors.push({
        field: 'bsn',
        code: 'PARTNER_BSN_FORMAAT',
        message: 'Een BSN bestaat uit 8 of 9 cijfers',
        priority: 1,
      });
    } else if (!validateBSN(partner.bsn)) {
      errors.push({
        field: 'bsn',
        code: 'PARTNER_BSN_ELFPROEF',
        message: 'Dit BSN-nummer is ongeldig (voldoet niet aan de 11-proef)',
        priority: 1,
      });
    }
  }
  
  // PARTNER004: Postcode formaat
  if (partner.postcode) {
    if (!/^[1-9][0-9]{3}\s?[A-Z]{2}$/i.test(partner.postcode)) {
      warnings.push({
        field: 'postcode',
        code: 'PARTNER_POSTCODE_FORMAAT',
        message: 'Gebruik het formaat 1234AB',
      });
    }
  }
  
  // PARTNER005: Email formaat
  if (partner.email) {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(partner.email)) {
      errors.push({
        field: 'email',
        code: 'PARTNER_EMAIL_FORMAAT',
        message: 'Voer een geldig e-mailadres in',
        priority: 1,
      });
    }
  }
  
  // PARTNER006: Telefoonnummer formaat
  if (partner.telefoonnummer) {
    const cleaned = partner.telefoonnummer.replace(/[\s-]/g, '');
    if (!/^(\+31|0)[1-9][0-9]{8}$/.test(cleaned)) {
      warnings.push({
        field: 'telefoonnummer',
        code: 'PARTNER_TELEFOON_FORMAAT',
        message: 'Voer een geldig Nederlands telefoonnummer in (10 cijfers, beginnend met 0 of +31)',
      });
    }
  }
  
  // Algemene validaties
  validateGeneralTextFields(partner, errors);
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

// ============================================================================
// Validatiefuncties voor Datums
// ============================================================================

/**
 * Valideer huwelijksdatum
 * Regel codes: DATUM001-DATUM003
 */
export function validateHuwelijksdatum(huwelijksdatum: string): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];
  
  const datum = parseDutchDate(huwelijksdatum);
  
  if (!datum) {
    errors.push({
      field: 'huwelijksdatum',
      code: 'HUWELIJK_DATUM_FORMAAT',
      message: 'Gebruik het formaat DD-MM-JJJJ',
      priority: 1,
    });
    
    return { isValid: false, errors, warnings };
  }
  
  const now = new Date();
  const daysDiff = daysDifference(now, datum);
  
  // DATUM001: Huwelijksdatum in toekomst
  if (datum <= now) {
    errors.push({
      field: 'huwelijksdatum',
      code: 'HUWELIJK_DATUM_TOEKOMST',
      message: 'De huwelijksdatum moet in de toekomst liggen',
      priority: 1,
    });
  }
  
  // DATUM003: Minimale aankondigingstermijn (14 dagen)
  if (daysDiff < 14) {
    errors.push({
      field: 'huwelijksdatum',
      code: 'HUWELIJK_MIN_AANKONDIGING',
      message: 'Een huwelijk moet minimaal 14 dagen van tevoren worden aangekondigd',
      priority: 1,
    });
  }
  
  // DATUM002: Niet te ver in toekomst (2 jaar)
  if (daysDiff > 730) { // ~2 years
    warnings.push({
      field: 'huwelijksdatum',
      code: 'HUWELIJK_DATUM_MAX_TOEKOMST',
      message: 'De huwelijksdatum mag maximaal 2 jaar in de toekomst liggen',
    });
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

// ============================================================================
// Validatiefuncties voor Documenten
// ============================================================================

/**
 * Valideer geüpload document
 * Regel codes: DOC001-DOC003
 */
export function validateDocument(
  file: File
): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];
  
  // DOC003: Bestand niet leeg
  if (file.size === 0) {
    errors.push({
      field: 'bestand',
      code: 'DOCUMENT_NIET_LEEG',
      message: 'Het bestand is leeg. Upload een geldig document',
      priority: 1,
    });
  }
  
  // DOC002: Maximum bestandsgrootte (10MB)
  const maxSize = 10 * 1024 * 1024;
  if (file.size > maxSize) {
    errors.push({
      field: 'bestand',
      code: 'DOCUMENT_MAX_GROOTTE',
      message: 'Het bestand is te groot. Maximale grootte is 10MB',
      priority: 1,
    });
  }
  
  // DOC001: Toegestane bestandstypen
  const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
  const allowedExtensions = ['.pdf', '.jpg', '.jpeg', '.png'];
  
  const hasValidType = allowedTypes.includes(file.type);
  const hasValidExtension = allowedExtensions.some(ext => 
    file.name.toLowerCase().endsWith(ext)
  );
  
  if (!hasValidType && !hasValidExtension) {
    errors.push({
      field: 'bestand',
      code: 'DOCUMENT_BESTANDSTYPE',
      message: 'Upload een PDF, JPG of PNG bestand',
      priority: 1,
    });
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

// ============================================================================
// Algemene Validaties
// ============================================================================

/**
 * Valideer algemene beveiliging en limieten
 * Regel codes: GEN001-GEN003
 */
function validateGeneralTextFields(
  data: Record<string, unknown>,
  errors: ValidationError[]
): void {
  Object.entries(data).forEach(([key, value]) => {
    if (typeof value !== 'string') return;
    
    // GEN001: XSS preventie
    if (/<script|javascript:|onerror=|onclick=/i.test(value)) {
      errors.push({
        field: key,
        code: 'ALGEMEEN_XSS_PREVENTIE',
        message: 'Ongeldige tekens gedetecteerd',
        priority: 1,
      });
    }
    
    // GEN002: SQL injection preventie
    if (/(\bDROP\b|\bDELETE\b|\bUPDATE\b|\bINSERT\b).*\b(TABLE|FROM|WHERE)\b/i.test(value)) {
      errors.push({
        field: key,
        code: 'ALGEMEEN_SQL_PREVENTIE',
        message: 'Ongeldige tekens gedetecteerd',
        priority: 1,
      });
    }
    
    // GEN003: Maximum lengte
    if (value.length > 500) {
      errors.push({
        field: key,
        code: 'ALGEMEEN_MAX_LENGTE_TEKST',
        message: 'De ingevoerde tekst is te lang (maximaal 500 tekens)',
        priority: 2,
      });
    }
  });
}

// ============================================================================
// Helper functies
// ============================================================================

/**
 * Format validatie errors voor weergave
 */
export function formatValidationErrors(result: ValidationResult): string[] {
  return result.errors.map(error => error.message);
}

/**
 * Format validatie warnings voor weergave
 */
export function formatValidationWarnings(result: ValidationResult): string[] {
  return result.warnings.map(warning => warning.message);
}

/**
 * Check of een specifieke fout aanwezig is
 */
export function hasError(result: ValidationResult, code: string): boolean {
  return result.errors.some(error => error.code === code);
}

/**
 * Check of een specifieke waarschuwing aanwezig is
 */
export function hasWarning(result: ValidationResult, code: string): boolean {
  return result.warnings.some(warning => warning.code === code);
}

