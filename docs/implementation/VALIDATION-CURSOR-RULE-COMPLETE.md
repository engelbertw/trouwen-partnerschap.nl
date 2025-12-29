# ✅ Validatie Cursor Rule Geïmplementeerd

## 🎯 Wat is er gedaan?

Een **verplichte Cursor rule** is aangemaakt die ervoor zorgt dat alle data validaties:
1. Gedocumenteerd worden in de database (`validatie_regel` tabel)
2. Geïmplementeerd worden via de centrale validatie library
3. Gelogd worden voor audit trail
4. Visueel getoond worden aan gebruikers

## 📁 Nieuwe Rule File

**Bestand**: `.cursor/rules/validation-compliance.mdc`

**Prioriteit**: 🔴 CRITICAL - Data Quality & Transparency Rule

## 🔒 Wat wordt afgedwongen?

### 1. Verplicht Gebruik Validatiesysteem
```typescript
// ✅ CORRECT
import { validateKind } from '@/lib/validation';
const result = validateKind(kindData, ouderData);

// ❌ FOUT - Eigen validatie zonder documentatie
if (age < 18) { /* VERBODEN! */ }
```

### 2. Database Documentatie Vereist
Elke nieuwe regel MOET in de database:
```sql
INSERT INTO validatie_regel (
  regel_code, beschrijving, wettelijke_basis, ...
) VALUES (...);
```

### 3. Visuele Feedback Verplicht
```typescript
// ✅ CORRECT - Rode/gele boxes
{validationErrors.length > 0 && (
  <div className="bg-red-50 border-l-4 border-red-600">
    // Error display
  </div>
)}

// ❌ FOUT - Alert gebruiken
alert('Error!'); // VERBODEN!
```

### 4. Server-side Validatie Vereist
```typescript
// ✅ CORRECT - Valideer in API route
export async function POST(request: NextRequest) {
  const result = validateEntity(data);
  if (!result.isValid) return error;
  // Nu pas database insert
}

// ❌ FOUT - Direct inserten
await db.insert(table).values(data); // VERBODEN!
```

### 5. Audit Trail Logging
```typescript
// Validatie resultaten MOETEN gelogd worden
await db.insert(validatieLog).values({
  validatieRegelId: regelId,
  resultaat: 'geslaagd' | 'gefaald',
  // ...
});
```

## 📋 Verboden Praktijken

De rule verbiedt expliciet:

❌ **Eigen validatielogica** zonder documentatie  
❌ **Alert() gebruiken** voor validatie errors  
❌ **Client-side only** validatie  
❌ **Database insert** zonder validatie  
❌ **Hardcoded foutmeldingen** (moet uit database komen)

## ✅ Verplichte Patronen

De rule schrijft voor:

### Stap 1: Database Regel
```sql
INSERT INTO validatie_regel (...) VALUES (...);
```

### Stap 2: TypeScript Implementatie
```typescript
// In src/lib/validation.ts
export function validateEntity(data): ValidationResult {
  // Implementatie
}
```

### Stap 3: UI Feedback
```typescript
// Rode box voor errors, gele box voor warnings
<div className="bg-red-50 border-l-4 border-red-600">...</div>
```

### Stap 4: Server Validatie
```typescript
// In API route
const result = validateEntity(data);
if (!result.isValid) return error;
```

### Stap 5: Tests
```typescript
// Test elke regel
describe('REGEL_CODE', () => {
  it('should validate...', () => { /* ... */ });
});
```

## 📚 Rule Integratie

De nieuwe regel is geïntegreerd in:

1. **README.md** - Toegevoegd aan rule overzicht
2. **Dependencies** - Gekoppeld aan data-flow en UI rules
3. **Quick Guide** - Sectie "Validate user input" toegevoegd
4. **Checklist** - Data Validation checklist items
5. **Critical Rules** - Toegevoegd aan verplichte regels lijst

## 🔍 Wanneer Gebruikt de AI Deze Rule?

**Altijd actief** (`alwaysApply: true`) voor alle TypeScript files in:
- `src/**/*.{ts,tsx}`
- `src/lib/**/*.ts`
- `src/app/**/*.{ts,tsx}`

De AI zal:
- ✅ Voorstellen om validatie toe te voegen bij user input
- ✅ Wijzen op ontbrekende database documentatie
- ✅ Corrigeren van alert() naar visuele feedback
- ✅ Eisen van server-side validatie
- ✅ Herinneren aan logging vereisten

## 📖 Documentatie Verwijzingen

De rule verwijst naar:
- `src/lib/validation.ts` - Validatie library
- `sql/070_validation_rules.sql` - Database schema
- `sql/080_validation_seeds.sql` - Regel definities
- `docs/VALIDATION-SYSTEM.md` - Volledige documentatie
- `src/app/000-aankondiging/050-kinderen/page.tsx` - Voorbeeld implementatie

## 🎯 Voorbeelden in Rule

De rule bevat uitgebreide voorbeelden van:
- ✅ Correcte implementaties
- ❌ Foute patronen
- 📝 Database regel syntax
- 💻 TypeScript validatie functies
- 🎨 UI feedback components
- 🔒 Server-side validatie
- ✅ Test voorbeelden
- 📊 Logging patterns

## 🚀 Resultaat

Vanaf nu zal de AI **automatisch**:
1. Validatie via het centrale systeem gebruiken
2. Nieuwe regels documenteren in database
3. Visuele feedback implementeren
4. Server-side validatie afdwingen
5. Audit trail logging toevoegen
6. Tests voorstellen voor nieuwe regels

## ✨ Transparantie voor Eindgebruikers

De rule zorgt ervoor dat elke validatie:
- **Begrijpbaar** is (Nederlandse foutmeldingen)
- **Traceerbaar** is (audit log)
- **Juridisch onderbouwd** is (wettelijke basis)
- **Consistent** is (centrale library)
- **Toegankelijk** is (WCAG compliant feedback)

## 🎊 Status

✅ **Cursor Rule Compleet**  
✅ **Geïntegreerd in README**  
✅ **Voorbeelden Gedocumenteerd**  
✅ **Altijd Actief**  
✅ **Volledige Coverage**

De AI zal nu **altijd** het validatiesysteem gebruiken en afdwingen! 🚀

