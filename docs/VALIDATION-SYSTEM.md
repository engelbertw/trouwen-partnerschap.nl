# Kwaliteitscontrole & Validatie Systeem

## Overzicht

Dit document beschrijft het uitgebreide kwaliteitscontrolesysteem dat is geïmplementeerd voor de Huwelijk applicatie. Het systeem zorgt voor transparante, traceerbare en AVG-conforme validatie van alle ingevoerde gegevens.

## Architectuur

### 1. Database Laag
**Bestanden:**
- `sql/070_validation_rules.sql` - Schema definitie
- `sql/080_validation_seeds.sql` - Validatieregels data

**Tabellen:**
- `validatie_regel` - Documenteert alle validatieregels
- `validatie_log` - Audit trail van uitgevoerde validaties

**Voordelen:**
- Transparantie: Alle regels zijn zichtbaar voor eindgebruikers
- Traceerbaarheid: Elke validatie wordt gelogd
- AVG-compliance: Duidelijke wettelijke basis per regel
- Flexibiliteit: Regels kunnen worden aangepast zonder code changes

### 2. Applicatie Laag
**Bestand:** `src/lib/validation.ts`

**Functies:**
- `validateKind()` - Valideer kind gegevens tegen ouder
- `validatePartner()` - Valideer partner gegevens
- `validateHuwelijksdatum()` - Valideer huwelijksdatum
- `validateDocument()` - Valideer geüploade documenten
- `validateBSN()` - BSN 11-proef validatie

**Features:**
- Type-safe TypeScript interfaces
- Uitgebreide error en warning berichten in Nederlands
- Datum utilities voor Nederlandse datumformaten (DD-MM-YYYY)
- XSS en SQL injection preventie

### 3. API Laag
**Bestand:** `src/app/api/validate/route.ts`

**Endpoints:**
- `POST /api/validate` - Valideer data real-time
- `GET /api/validate/rules` - Haal validatieregels op

**Gebruik:**
```typescript
// Valideer kind
const response = await fetch('/api/validate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    type: 'kind',
    data: {
      kind: {
        voornamen: 'Emma',
        achternaam: 'Janssen',
        geboortedatum: '15-03-2010'
      },
      ouder: {
        voornamen: 'Maria',
        achternaam: 'Janssen',
        geboortedatum: '23-05-1990'
      }
    }
  })
});

const result = await response.json();
// result.validation.isValid
// result.validation.errors[]
// result.validation.warnings[]
```

### 4. UI Laag
**Voorbeeld:** `src/app/000-aankondiging/050-kinderen/page.tsx`

**Features:**
- Real-time validatie bij toevoegen van kind
- Visuele foutmeldingen (rood) en waarschuwingen (geel)
- Duidelijke, gebruikersvriendelijke berichten in Nederlands
- Toegankelijke error displays met ARIA labels

## Validatieregels

### Kinderen (KIND_*)

| Code | Beschrijving | Prioriteit | Wettelijke Basis |
|------|-------------|-----------|-----------------|
| KIND_VOORNAMEN_VEREIST | Voornamen verplicht | Kritisch (1) | Burgerlijk Wetboek Boek 1 |
| KIND_ACHTERNAAM_VEREIST | Achternaam verplicht | Kritisch (1) | Burgerlijk Wetboek Boek 1 |
| KIND_GEBOORTEDATUM_VEREIST | Geboortedatum verplicht | Kritisch (1) | Burgerlijk Wetboek Boek 1 |
| KIND_GEBOORTEDATUM_FORMAAT | Formaat DD-MM-JJJJ | Kritisch (1) | Nederlandse datum conventie |
| KIND_GEBOORTEDATUM_VERLEDEN | Moet in verleden liggen | Kritisch (1) | Logische consistentie |
| KIND_JONGER_DAN_OUDER | Kind jonger dan ouder | Kritisch (1) | Logische consistentie |
| OUDER_MIN_LEEFTIJD_BIJ_GEBOORTE | Ouder ≥12 jaar bij geboorte | Kritisch (1) | Logische consistentie |
| KIND_MAX_LEEFTIJD | Niet ouder dan 100 jaar | Belangrijk (2) | Logische consistentie |
| KIND_ACHTERNAAM_OVEREENKOMST | Achternaam van ouder | Belangrijk (2) | BW Boek 1, Titel 11 |

### Partners (PARTNER_*)

| Code | Beschrijving | Prioriteit | Wettelijke Basis |
|------|-------------|-----------|-----------------|
| PARTNER_MIN_LEEFTIJD_HUWELIJK | Minimaal 18 jaar | Kritisch (1) | BW Boek 1, Artikel 31 |
| PARTNER_BSN_FORMAAT | 8 of 9 cijfers | Kritisch (1) | Wet BSN |
| PARTNER_BSN_ELFPROEF | BSN 11-proef | Kritisch (1) | Wet BSN |
| PARTNER_EMAIL_FORMAAT | Geldig email formaat | Kritisch (1) | AVG |
| PARTNER_POSTCODE_FORMAAT | Formaat 1234AB | Belangrijk (2) | PostNL |
| PARTNER_TELEFOON_FORMAAT | Nederlands nummer | Belangrijk (2) | Telecom standaarden |

### Datums (DATUM_*)

| Code | Beschrijving | Prioriteit | Wettelijke Basis |
|------|-------------|-----------|-----------------|
| HUWELIJK_DATUM_TOEKOMST | In de toekomst | Kritisch (1) | Logische consistentie |
| HUWELIJK_MIN_AANKONDIGING | Min. 14 dagen vooruit | Kritisch (1) | BW Boek 1, Artikel 50 |
| HUWELIJK_DATUM_MAX_TOEKOMST | Max. 2 jaar vooruit | Belangrijk (2) | Gemeentelijk beleid |

### Documenten (DOC_*)

| Code | Beschrijving | Prioriteit | Wettelijke Basis |
|------|-------------|-----------|-----------------|
| DOCUMENT_BESTANDSTYPE | PDF/JPG/PNG | Kritisch (1) | Gemeentelijk beleid |
| DOCUMENT_MAX_GROOTTE | Max 10MB | Kritisch (1) | Gemeentelijk beleid |
| DOCUMENT_NIET_LEEG | Niet leeg | Kritisch (1) | Logische consistentie |

### Algemeen (ALGEMEEN_*)

| Code | Beschrijving | Prioriteit | Wettelijke Basis |
|------|-------------|-----------|-----------------|
| ALGEMEEN_XSS_PREVENTIE | Geen script tags | Kritisch (1) | AVG Beveiliging |
| ALGEMEEN_SQL_PREVENTIE | Geen SQL statements | Kritisch (1) | AVG Beveiliging |
| ALGEMEEN_MAX_LENGTE_TEKST | Max 500 tekens | Belangrijk (2) | Technische beperking |

## Prioriteiten

1. **Kritisch (1)**: Blokkeert verder gaan, moet opgelost worden
2. **Belangrijk (2)**: Waarschuwing, gebruiker kan doorgaan maar moet bevestigen
3. **Informatief (3)**: Tip, gebruiker kan direct doorgaan

## UI Implementatie Voorbeeld

```typescript
import { 
  validateKind, 
  formatValidationErrors, 
  formatValidationWarnings 
} from '@/lib/validation';

const [validationErrors, setValidationErrors] = useState<string[]>([]);
const [validationWarnings, setValidationWarnings] = useState<string[]>([]);

const handleSubmit = () => {
  setValidationErrors([]);
  setValidationWarnings([]);
  
  const result = validateKind(kindData, ouderData);
  
  if (!result.isValid) {
    setValidationErrors(formatValidationErrors(result));
    setValidationWarnings(formatValidationWarnings(result));
    return;
  }
  
  if (result.warnings.length > 0) {
    setValidationWarnings(formatValidationWarnings(result));
  }
  
  // Proceed with submission
};

// In JSX:
{validationErrors.length > 0 && (
  <div className="p-4 bg-red-50 border-l-4 border-red-600 rounded">
    <h3 className="text-sm font-bold text-red-900">Controleer uw invoer</h3>
    <ul className="list-disc list-inside text-sm text-red-800">
      {validationErrors.map((error, idx) => (
        <li key={idx}>{error}</li>
      ))}
    </ul>
  </div>
)}
```

## Database Deployment

### Stap 1: Deploy Schema
```bash
psql $DATABASE_URL -f sql/070_validation_rules.sql
```

### Stap 2: Seed Validatieregels
```bash
psql $DATABASE_URL -f sql/080_validation_seeds.sql
```

### Stap 3: Verifieer
```sql
SELECT COUNT(*) FROM validatie_regel WHERE actief = true;
-- Verwacht: ~30 regels

SELECT categorie, COUNT(*) 
FROM validatie_regel 
GROUP BY categorie;
-- kind: 9, partner: 6, datum: 3, document: 3, algemeen: 3
```

## Transparantie voor Eindgebruikers

### Validatieregels Inzien
Gebruikers kunnen alle actieve validatieregels opvragen:

```bash
GET /api/validate/rules?categorie=kind&actief=true
```

Response:
```json
{
  "success": true,
  "rules": {
    "kind": [
      {
        "code": "KIND_VOORNAMEN_VEREIST",
        "beschrijving": "Voornamen van het kind zijn verplicht",
        "prioriteit": 1
      }
    ]
  },
  "metadata": {
    "versie": "1.0",
    "bron": "Burgerlijk Wetboek en AVG vereisten"
  }
}
```

### Audit Trail
Elke validatie wordt gelogd in `validatie_log`:
- Welke regel werd toegepast
- Wat was de uitkomst
- Wanneer werd het uitgevoerd
- Door welke gebruiker (optioneel)

## AVG Compliance

1. **Transparantie**: Alle regels zijn gedocumenteerd en opvraagbaar
2. **Wettelijke Basis**: Elke regel verwijst naar relevante wetgeving
3. **Audit Trail**: Volledige logging van validaties
4. **Beveiliging**: XSS en SQL injection preventie
5. **Data Minimalisatie**: Alleen noodzakelijke velden worden gevalideerd

## Best Practices

### Voor Developers

1. **Altijd valideren**: Zowel client-side als server-side
2. **Duidelijke berichten**: Gebruik de voorgedefinieerde foutmeldingen
3. **Logging**: Log validatieresultaten voor debugging
4. **Type-safe**: Gebruik TypeScript types voor validatie functies
5. **Test coverage**: Test alle validatieregels

### Voor Eindgebruikers

1. **Direct feedback**: Validatie gebeurt bij invoer
2. **Duidelijke taal**: Foutmeldingen in begrijpelijk Nederlands
3. **Hulp beschikbaar**: Link naar uitleg van regels
4. **Toegankelijk**: WCAG 2.2 Level AA compliant
5. **Geen verrassingen**: Regels zijn vooraf inzichtelijk

## Testing

### Unit Tests Voorbeeld
```typescript
describe('validateKind', () => {
  it('should validate child is younger than parent', () => {
    const result = validateKind(
      { 
        voornamen: 'Emma', 
        achternaam: 'Janssen', 
        geboortedatum: '15-03-2010' 
      },
      { 
        voornamen: 'Maria', 
        achternaam: 'Janssen', 
        geboortedatum: '15-03-2010' // Same date - invalid!
      }
    );
    
    expect(result.isValid).toBe(false);
    expect(result.errors).toContainEqual(
      expect.objectContaining({ 
        code: 'KIND_JONGER_DAN_OUDER' 
      })
    );
  });
});
```

## Toekomstige Uitbreidingen

1. **Machine Learning**: Detecteer ongebruikelijke patronen
2. **External APIs**: Valideer postcodes tegen BAG register
3. **Multi-language**: Ondersteuning voor Engelse foutmeldingen
4. **Real-time API**: WebSocket voor direct feedback
5. **Analytics**: Dashboard met validatie statistieken

## Support

Voor vragen over het validatiesysteem:
- Documentatie: `/docs/validation.md` (dit document)
- API Reference: `GET /api/validate/rules`
- Database Schema: `sql/070_validation_rules.sql`
- Code: `src/lib/validation.ts`

