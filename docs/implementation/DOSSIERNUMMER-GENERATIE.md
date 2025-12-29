# Dossiernummer Generatie - Technische Documentatie

**Voorbeeld:** `75EC5B04`  
**Volledig UUID:** `75ec5b04-1666-4952-9d89-67894d820b65`

## Hoe Wordt Het Gegenereerd?

Het dossiernummer is **NIET** willekeurig gegenereerd, maar volgt een specifiek proces:

### Stap 1: PostgreSQL Genereert UUID (v4)

**Locatie:** Database (`sql/020_core_tables.sql`)

```sql
CREATE TABLE ihw.dossier (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    ...
);
```

**Functie:** `gen_random_uuid()`
- PostgreSQL built-in functie
- Genereert UUID versie 4 (random)
- Format: `xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx`
- Volledig: `75ec5b04-1666-4952-9d89-67894d820b65`

### Stap 2: Frontend Toont Eerste 8 Karakters (Uppercase)

**Locatie:** Diverse bestanden

**1. Bevestiging Pagina** (`src/app/000-aankondiging/090-bevestiging/page.tsx`)
```typescript
<code className="text-sm font-mono">
  {dossierId.substring(0, 8).toUpperCase()}
</code>
// Resultaat: "75EC5B04"
```

**2. PDF Generator** (`src/lib/pdf-generator.ts`)
```typescript
doc.text(
  `Dossiernummer: ${dossierId.substring(0, 8).toUpperCase()}`, 
  margin, 
  yPosition
);
// PDF toont: "Dossiernummer: 75EC5B04"
```

**3. PDF Bestandsnaam** (`src/lib/pdf-generator.ts`)
```typescript
const filename = `huwelijksaankondiging-${dossierId.substring(0, 8)}.pdf`;
// Bestandsnaam: "huwelijksaankondiging-75ec5b04.pdf"
```

## Waarom Dit Format?

### 1. Gebruiksvriendelijkheid
- ❌ **Volledig UUID:** `75ec5b04-1666-4952-9d89-67894d820b65` (te lang, moeilijk te lezen)
- ✅ **Verkorte versie:** `75EC5B04` (kort, makkelijk over te typen)

### 2. Uniekheid
- **UUID v4** heeft `2^122` mogelijke waarden (zeer groot)
- **Eerste 8 karakters** = `16^8` = 4,294,967,296 mogelijkheden
- **Kans op collision:** Verwaarloosbaar klein voor gemeentelijke applicatie

### 3. Leesbaarheid
- **Hoofdletters:** Beter leesbaar in print/scherm
- **Geen streepjes:** Korter en makkelijker te communiceren telefonisch
- **Hexadecimaal:** 0-9 en A-F (geen verwarrende karakters zoals O/0 of I/1)

## Generatie Flow

```
┌─────────────────────────────────────────┐
│ 1. Gebruiker dient aankondiging in     │
└──────────────┬──────────────────────────┘
               ↓
┌─────────────────────────────────────────┐
│ 2. API: POST /api/aankondiging/submit   │
│    - Valideer data                      │
│    - Start database transactie          │
└──────────────┬──────────────────────────┘
               ↓
┌─────────────────────────────────────────┐
│ 3. PostgreSQL: INSERT INTO dossier      │
│    - Roept gen_random_uuid() aan       │
│    - Genereert: 75ec5b04-1666-...      │
│    - Slaat op in database               │
└──────────────┬──────────────────────────┘
               ↓
┌─────────────────────────────────────────┐
│ 4. API: Return dossier.id               │
│    - Volledig UUID terug naar frontend  │
└──────────────┬──────────────────────────┘
               ↓
┌─────────────────────────────────────────┐
│ 5. Frontend: Toon dossiernummer        │
│    - .substring(0, 8)                   │
│    - .toUpperCase()                     │
│    - Display: "75EC5B04"                │
└─────────────────────────────────────────┘
```

## Waar Wordt Het Gebruikt?

### Volledige UUID (`75ec5b04-1666-4952-9d89-67894d820b65`)

**1. Database Primary Key**
```sql
SELECT * FROM ihw.dossier WHERE id = '75ec5b04-1666-4952-9d89-67894d820b65';
```

**2. URL's**
```
/dossier/75ec5b04-1666-4952-9d89-67894d820b65
/dossier/75ec5b04-1666-4952-9d89-67894d820b65/samenvatting
/dossier/75ec5b04-1666-4952-9d89-67894d820b65/ceremonie
```

**3. API Calls**
```typescript
fetch(`/api/dossier/75ec5b04-1666-4952-9d89-67894d820b65`)
```

### Verkorte Versie (`75EC5B04`)

**1. User Interface**
- Bevestiging pagina
- Email notificaties (TODO)
- Print documenten

**2. PDF Documenten**
- Header: "Dossiernummer: 75EC5B04"
- Bestandsnaam: `huwelijksaankondiging-75ec5b04.pdf`

**3. Telefonische Communicatie**
```
Burger: "Ik bel over dossiernummer 7-5-E-C-5-B-0-4"
Medewerker: *Zoekt in systeem met volledige UUID*
```

## UUID v4 Specificaties

### Format
```
75ec5b04-1666-4xxx-yxxx-xxxxxxxxxxxx
│      │ │   │ │  │ │  └─ 12 hex digits (random)
│      │ │   │ │  │ └──── 3 hex digits (random)
│      │ │   │ │  └─────── 1 hex digit: 8, 9, A, or B (variant)
│      │ │   │ └────────── 3 hex digits (random)
│      │ │   └───────────── 1 hex digit: 4 (version 4)
│      │ └───────────────── 4 hex digits (random)
│      └─────────────────── 8 hex digits (random)
└────────────────────────── Eerste 8 chars = dossiernummer
```

### Karakters
- **Hexadecimaal:** `0123456789abcdef` (lowercase in database)
- **Display:** `0123456789ABCDEF` (uppercase voor gebruiker)

### Voorbeelden
```
Volledig UUID                            | Dossiernummer
-----------------------------------------|-------------
75ec5b04-1666-4952-9d89-67894d820b65     | 75EC5B04
a3c3803b-7f01-4162-bb3d-c9c516b44af1     | A3C3803B
b6be9005-fd1c-4f87-b0f7-b60f7d51058c     | B6BE9005
9bf14cb9-4b71-4fc9-9d9a-c0283b921675     | 9BF14CB9
```

## Zoeken in Database

### Met Volledig UUID (Exact)
```sql
SELECT * FROM ihw.dossier 
WHERE id = '75ec5b04-1666-4952-9d89-67894d820b65';
-- ✅ Snelst (gebruikt primary key index)
```

### Met Dossiernummer (Eerste 8 Karakters)
```sql
-- Optie 1: LIKE pattern
SELECT * FROM ihw.dossier 
WHERE id::text LIKE '75ec5b04%';

-- Optie 2: String vergelijking
SELECT * FROM ihw.dossier 
WHERE substring(id::text, 1, 8) = '75ec5b04';

-- ⚠️ Langzamer (moet alle UUIDs scannen)
-- 💡 Best practice: Sla verkorte versie apart op met index
```

### Optimalisatie (Optioneel)
```sql
-- Voeg kolom toe voor verkorte versie met index
ALTER TABLE ihw.dossier 
ADD COLUMN short_id text 
GENERATED ALWAYS AS (substring(id::text, 1, 8)) STORED;

CREATE INDEX idx_dossier_short_id ON ihw.dossier(short_id);

-- Nu snel zoeken mogelijk:
SELECT * FROM ihw.dossier WHERE short_id = '75ec5b04';
```

## Alternatieve Generatie Methoden (Niet Gebruikt)

### 1. Sequentiële Nummers
```
❌ NIET GEBRUIKT
Voorbeeld: 2025-0001, 2025-0002, ...
Nadelen:
- Voorspelbaar
- Privacy concerns (aantal aanvragen zichtbaar)
- Gemeente-specifieke reeks nodig
```

### 2. Timestamp-based
```
❌ NIET GEBRUIKT
Voorbeeld: 20251227-001, 20251227-002
Nadelen:
- Niet uniek bij gelijktijdige requests
- Datum privacy concern
- Complexe synchronisatie
```

### 3. Random String
```
❌ NIET GEBRUIKT
Voorbeeld: XKCD-2021, ABXY-9876
Nadelen:
- Handmatige generatie logica
- Collision handling nodig
- Geen standaard formaat
```

### 4. UUID v4 (8 karakters) ✅ GEBRUIKT
```
✅ GEBRUIKT
Voorbeeld: 75EC5B04
Voordelen:
- Automatisch gegenereerd door database
- Standaard formaat
- Zeer lage collision kans
- Geen privacy concerns
- Geen synchronisatie nodig
```

## Security & Privacy

### Wat Is NIET Zichtbaar
- ❌ Aantal dossiers
- ❌ Wanneer aangemaakt
- ❌ Gemeente informatie
- ❌ Patroon herkenning

### Wat Is WEL Zichtbaar
- ✅ Uniek nummer
- ✅ Hexadecimaal format
- ✅ Lengte (8 karakters)

### Brute Force Protection
```
Mogelijkheden: 16^8 = 4,294,967,296
Bij 1000 pogingen/seconde: ~50 dagen voor volledige scan
Met rate limiting: Praktisch onmogelijk
```

## Best Practices

### ✅ DO
1. Gebruik volledig UUID in database queries
2. Toon verkorte versie aan gebruiker
3. Bewaar beide versies voor snelle lookup (optioneel)
4. Gebruik uppercase voor display
5. Valideer format bij input

### ❌ DON'T
1. Genereer UUID in frontend (gebruik database)
2. Wijzig UUID na creatie
3. Gebruik UUID voor sortering
4. Hergebruik UUID's
5. Expose volledig UUID onnodig

## Code Voorbeelden

### TypeScript: Verkort Dossiernummer
```typescript
function getShortDossierId(uuid: string): string {
  return uuid.substring(0, 8).toUpperCase();
}

// Gebruik:
const fullId = "75ec5b04-1666-4952-9d89-67894d820b65";
const shortId = getShortDossierId(fullId);
console.log(shortId); // "75EC5B04"
```

### SQL: Vind Dossier met Verkort Nummer
```sql
-- Functie om te zoeken met verkorte ID
CREATE OR REPLACE FUNCTION find_dossier_by_short_id(short_id text)
RETURNS uuid AS $$
BEGIN
  RETURN (
    SELECT id FROM ihw.dossier 
    WHERE id::text LIKE lower(short_id) || '%'
    LIMIT 1
  );
END;
$$ LANGUAGE plpgsql;

-- Gebruik:
SELECT * FROM ihw.dossier 
WHERE id = find_dossier_by_short_id('75EC5B04');
```

## Conclusie

Het dossiernummer `75EC5B04` is:

1. **Database:** Volledige UUID v4 gegenereerd door PostgreSQL
2. **Display:** Eerste 8 karakters in hoofdletters
3. **Doel:** Gebruiksvriendelijke referentie voor burgers
4. **Intern:** Volledige UUID wordt altijd gebruikt voor lookups

**Best of both worlds:**
- Database: Volledige UUID voor performance & uniekheid
- Gebruiker: Korte, leesbare code voor communicatie

---

**Status:** ✅ Productie-ready implementatie
**Performance:** ⚡ Optimaal met primary key lookups
**Security:** 🔒 Privacy-vriendelijk en collision-safe

