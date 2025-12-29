import { NextRequest, NextResponse } from 'next/server';
import {
  validateKind,
  validatePartner,
  validateHuwelijksdatum,
  validateDocument,
  type ValidationResult,
  type KindData,
  type PartnerData,
} from '@/lib/validation';

/**
 * POST /api/validate
 * 
 * Validatie API endpoint voor real-time kwaliteitscontroles
 * 
 * Ondersteunde validatietypen:
 * - kind: Valideer kind data
 * - partner: Valideer partner data
 * - huwelijksdatum: Valideer huwelijksdatum
 * - document: Valideer geüpload document
 * 
 * @example
 * ```json
 * {
 *   "type": "kind",
 *   "data": {
 *     "kind": {
 *       "voornamen": "Emma",
 *       "achternaam": "Janssen",
 *       "geboortedatum": "15-03-2010"
 *     },
 *     "ouder": {
 *       "voornamen": "Maria",
 *       "achternaam": "Janssen",
 *       "geboortedatum": "23-05-1990"
 *     }
 *   }
 * }
 * ```
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, data } = body;

    if (!type || !data) {
      return NextResponse.json(
        {
          success: false,
          error: 'Type en data zijn verplicht',
        },
        { status: 400 }
      );
    }

    let validationResult: ValidationResult;

    switch (type) {
      case 'kind': {
        const { kind, ouder } = data as {
          kind: KindData;
          ouder: PartnerData;
        };

        if (!kind || !ouder) {
          return NextResponse.json(
            {
              success: false,
              error: 'Kind en ouder data zijn verplicht',
            },
            { status: 400 }
          );
        }

        validationResult = validateKind(kind, ouder);
        break;
      }

      case 'partner': {
        const { partner, huwelijksdatum } = data as {
          partner: PartnerData;
          huwelijksdatum?: string;
        };

        if (!partner) {
          return NextResponse.json(
            {
              success: false,
              error: 'Partner data is verplicht',
            },
            { status: 400 }
          );
        }

        validationResult = validatePartner(partner, huwelijksdatum);
        break;
      }

      case 'huwelijksdatum': {
        const { huwelijksdatum } = data as { huwelijksdatum: string };

        if (!huwelijksdatum) {
          return NextResponse.json(
            {
              success: false,
              error: 'Huwelijksdatum is verplicht',
            },
            { status: 400 }
          );
        }

        validationResult = validateHuwelijksdatum(huwelijksdatum);
        break;
      }

      case 'document': {
        // For document validation, the client should send file metadata
        const { fileName, fileSize, fileType } = data as {
          fileName: string;
          fileSize: number;
          fileType: string;
        };

        if (!fileName || !fileSize || !fileType) {
          return NextResponse.json(
            {
              success: false,
              error: 'Bestandsinformatie is incompleet',
            },
            { status: 400 }
          );
        }

        // Create a mock File object for validation
        const mockFile = new File([], fileName, { type: fileType });
        Object.defineProperty(mockFile, 'size', { value: fileSize });

        validationResult = validateDocument(mockFile);
        break;
      }

      default:
        return NextResponse.json(
          {
            success: false,
            error: `Onbekend validatietype: ${type}`,
          },
          { status: 400 }
        );
    }

    // Log validation result (in production, log to database)
    console.log(`[Validatie] Type: ${type}, Valid: ${validationResult.isValid}`, {
      errors: validationResult.errors.length,
      warnings: validationResult.warnings.length,
    });

    return NextResponse.json({
      success: true,
      validation: {
        isValid: validationResult.isValid,
        errors: validationResult.errors,
        warnings: validationResult.warnings,
      },
    });
  } catch (error) {
    console.error('[Validatie API] Error:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Er is een fout opgetreden bij de validatie',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/validate/rules
 * 
 * Haal validatieregels op voor transparantie
 * 
 * Query parameters:
 * - categorie: Filter op categorie (kind, partner, datum, document, algemeen)
 * - actief: Filter op actieve regels (true/false)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const categorie = searchParams.get('categorie');
    const actiefParam = searchParams.get('actief');

    // In production, query the database
    // For now, return documentation about validation rules
    const rules = {
      kind: [
        {
          code: 'KIND_VOORNAMEN_VEREIST',
          beschrijving: 'Voornamen van het kind zijn verplicht',
          prioriteit: 1,
        },
        {
          code: 'KIND_ACHTERNAAM_VEREIST',
          beschrijving: 'Achternaam van het kind is verplicht',
          prioriteit: 1,
        },
        {
          code: 'KIND_GEBOORTEDATUM_VEREIST',
          beschrijving: 'Geboortedatum van het kind is verplicht',
          prioriteit: 1,
        },
        {
          code: 'KIND_JONGER_DAN_OUDER',
          beschrijving: 'Kind moet jonger zijn dan de ouder',
          prioriteit: 1,
        },
        {
          code: 'OUDER_MIN_LEEFTIJD_BIJ_GEBOORTE',
          beschrijving: 'Ouder moet minimaal 12 jaar oud zijn geweest bij geboorte van het kind',
          prioriteit: 1,
        },
        {
          code: 'KIND_ACHTERNAAM_OVEREENKOMST',
          beschrijving: 'Achternaam van kind moet overeenkomen met achternaam van minimaal één ouder',
          prioriteit: 2,
        },
      ],
      partner: [
        {
          code: 'PARTNER_MIN_LEEFTIJD_HUWELIJK',
          beschrijving: 'Partner moet minimaal 18 jaar oud zijn om te trouwen',
          prioriteit: 1,
        },
        {
          code: 'PARTNER_BSN_FORMAAT',
          beschrijving: 'BSN moet bestaan uit 8 of 9 cijfers',
          prioriteit: 1,
        },
        {
          code: 'PARTNER_BSN_ELFPROEF',
          beschrijving: 'BSN moet voldoen aan de 11-proef',
          prioriteit: 1,
        },
        {
          code: 'PARTNER_EMAIL_FORMAAT',
          beschrijving: 'Email moet een geldig formaat hebben',
          prioriteit: 1,
        },
      ],
      datum: [
        {
          code: 'HUWELIJK_DATUM_TOEKOMST',
          beschrijving: 'Huwelijksdatum moet in de toekomst liggen',
          prioriteit: 1,
        },
        {
          code: 'HUWELIJK_MIN_AANKONDIGING',
          beschrijving: 'Huwelijk moet minimaal 14 dagen van tevoren worden aangekondigd',
          prioriteit: 1,
        },
      ],
      document: [
        {
          code: 'DOCUMENT_BESTANDSTYPE',
          beschrijving: 'Document moet PDF, JPG, JPEG of PNG zijn',
          prioriteit: 1,
        },
        {
          code: 'DOCUMENT_MAX_GROOTTE',
          beschrijving: 'Document mag maximaal 10MB groot zijn',
          prioriteit: 1,
        },
      ],
    };

    // Filter by category if provided
    const filteredRules = categorie
      ? { [categorie]: rules[categorie as keyof typeof rules] || [] }
      : rules;

    return NextResponse.json({
      success: true,
      rules: filteredRules,
      metadata: {
        versie: '1.0',
        bron: 'Burgerlijk Wetboek en AVG vereisten',
        laatstGewijzigd: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('[Validatie Rules API] Error:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Er is een fout opgetreden bij het ophalen van validatieregels',
      },
      { status: 500 }
    );
  }
}

