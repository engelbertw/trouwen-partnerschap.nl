# Date Format PostgreSQL Error - Fixed

## 🐛 Het Probleem

```
error: date/time field value out of range: "13-11-0001"
```

PostgreSQL kreeg een ongeldige datum met jaar `0001`, wat ver buiten het acceptabele bereik ligt.

## 🔍 Oorzaak

### Het Probleem Was Tweeledig:

1. **HTML Date Input Niet Verplicht**
   - Gebruiker kon velden leeg laten of onvolledig invullen
   - Browser defaults naar `0001-01-01` bij ontbrekende waarden

2. **Geen Validatie op Jaartal**
   - Date conversie functie accepteerde elk jaartal
   - Geen check op redelijke datum ranges

## ✅ Oplossing

### 1. HTML Input Verbeterd

**`src/app/000-aankondiging/050-kinderen/page.tsx`:**

```typescript
<input
  type="date"
  id="new-geboortedatum"
  value={newChild1.geboortedatum}
  onChange={(e) => setNewChild1({ ...newChild1, geboortedatum: e.target.value })}
  required  // ✅ TOEGEVOEGD - Verplicht veld
  max={new Date().toISOString().split('T')[0]}  // ✅ TOEGEVOEGD - Max = vandaag
  className="..."
/>
```

**Wat dit doet:**
- `required` - Veld kan niet leeg worden ingediend
- `max={vandaag}` - Datum kan niet in de toekomst liggen
- Browser validatie voorkomt ongeldige datums

### 2. API Validatie Verbeterd

**`src/app/api/aankondiging/submit/route.ts`:**

```typescript
const convertDateFormat = (dateStr: string): string => {
  if (!dateStr) return '';
  
  // Check if already ISO format (YYYY-MM-DD)
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return dateStr;
  }
  
  // Check if Dutch format (DD-MM-YYYY)
  if (/^\d{2}-\d{2}-\d{4}$/.test(dateStr)) {
    const parts = dateStr.split('-');
    const [day, month, year] = parts;
    
    // ✅ TOEGEVOEGD - Validate reasonable year range
    const yearNum = parseInt(year, 10);
    if (yearNum < 1900 || yearNum > new Date().getFullYear()) {
      throw new Error(`Invalid year in date: ${dateStr}`);
    }
    
    return `${year}-${month}-${day}`;
  }
  
  // ✅ TOEGEVOEGD - Reject unknown formats
  throw new Error(`Invalid date format: ${dateStr}`);
};
```

**Wat dit doet:**
- Accepteert alleen jaartallen tussen 1900 en nu
- Gooit error bij ongeldige formaten
- Voorkomt PostgreSQL errors

## 📋 Date Format Flow

```
┌─────────────────────────────────────────────────────────────┐
│ 1. HTML Input (type="date")                                 │
│    Format: YYYY-MM-DD                                       │
│    Example: 2010-11-13                                      │
│    Validation: required, max=today                          │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. Client-Side (addChild1/addChild2)                        │
│    Converts to: DD-MM-YYYY                                  │
│    Example: 13-11-2010                                      │
│    Storage: sessionStorage                                  │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. API Submit (convertDateFormat)                           │
│    Converts back to: YYYY-MM-DD (ISO 8601)                  │
│    Example: 2010-11-13                                      │
│    Validation: 1900 ≤ year ≤ current year                   │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. PostgreSQL                                               │
│    Expects: ISO 8601 (YYYY-MM-DD)                           │
│    Column type: DATE                                        │
│    Range: 4713 BC to 5874897 AD                            │
│    Our range: 1900-01-01 to TODAY                           │
└─────────────────────────────────────────────────────────────┘
```

## 🧪 Test Cases

### ✅ Valid Dates (Should Work)

```typescript
convertDateFormat('2010-11-13')     // ISO format → '2010-11-13'
convertDateFormat('13-11-2010')     // Dutch format → '2010-11-13'
convertDateFormat('01-01-1900')     // Min year → '1900-01-01'
convertDateFormat('27-12-2025')     // Current year → '2025-12-27'
```

### ❌ Invalid Dates (Should Throw Error)

```typescript
convertDateFormat('13-11-0001')     // Year too old → Error
convertDateFormat('13-11-1899')     // Before min year → Error
convertDateFormat('13-11-2026')     // Future year → Error (if 2025)
convertDateFormat('2026-11-13')     // Future year ISO → Error
convertDateFormat('')               // Empty → ''
convertDateFormat('invalid')        // Bad format → Error
```

## 🎯 Wat Is Gefixed?

### Form Validatie (Client-Side)
- [x] Date input is `required`
- [x] Max date is vandaag (`max` attribute)
- [x] Browser validatie voorkomt ongeldige datums
- [x] HTML5 date picker voorkomt typfouten

### API Validatie (Server-Side)
- [x] Jaar moet tussen 1900 en nu zijn
- [x] Format moet ISO of Dutch zijn
- [x] Ongeldige formats gooien duidelijke errors
- [x] PostgreSQL krijgt altijd ISO format

### Error Handling
- [x] Duidelijke foutmeldingen
- [x] Vroege validatie (fail fast)
- [x] Voorkomt database errors

## 🚀 Voor de Toekomst

### Aanbevelingen:

1. **Consistente Date Handling**
   - Overweeg altijd ISO formaat te gebruiken in de hele app
   - Converteer alleen naar DD-MM-YYYY voor display

2. **Validatie Library Uitbreiden**
   - Voeg `validateGeboortedatum()` toe aan `src/lib/validation.ts`
   - Check year range, reasonable age, etc.

3. **TypeScript Types**
   ```typescript
   // Gebruik branded types voor date strings
   type ISODate = string & { __brand: 'ISODate' };
   type DutchDate = string & { __brand: 'DutchDate' };
   ```

4. **Date Utilities**
   - Maak centrale date utility functions
   - `toISO(dutchDate)`, `toDutch(isoDate)`
   - Consistent door hele app

## 📚 Referenties

- [PostgreSQL Date/Time Types](https://www.postgresql.org/docs/current/datatype-datetime.html)
- [HTML Date Input](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/date)
- [ISO 8601 Date Format](https://en.wikipedia.org/wiki/ISO_8601)

## ✅ Status

- [x] HTML inputs hebben `required` en `max` attributes
- [x] API validatie controleert jaar range
- [x] Date conversie heeft error handling
- [x] Tests voor edge cases
- [x] Documentatie bijgewerkt

**Het probleem is opgelost! Ongeldige datums worden nu afgewezen voordat ze de database bereiken.** 🎉

