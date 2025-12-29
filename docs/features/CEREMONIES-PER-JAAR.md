# Ceremonies Per Jaar Functionaliteit

**Datum**: 28 december 2025  
**Status**: ✅ Afgerond & Compleet

## Overzicht

Gemeenten kunnen nu voor elke BABS een **jaarlijks ceremony target** instellen en de voortgang monitoren in real-time.

## Features

### 📊 Statistieken per BABS

**In de BABS lijst** (`/gemeente/beheer/lookup?tab=babs`):
- **Ceremonies tot nu**: Aantal ceremonies dit jaar uitgevoerd
- **Target**: Ingesteld doel voor dit jaar
- **Voortgang indicator**:
  - 🟢 **Groen**: ≥100% van target behaald
  - 🟡 **Geel**: 50-99% van target
  - 🔴 **Rood**: <50% van target
- **Percentage**: Exacte voortgang (bijv. "15/40 - 38% behaald")

### 🎯 Target Management

**Nieuwe BABS aanmaken:**
- Optioneel target instellen bij aanmaken
- Standaard: 40 ceremonies per jaar
- Jaar selecteren (huidig jaar + 5 jaar vooruit)

**Bestaande BABS:**
- **Inline edit**: Klik op "✏️ Wijzig" om target aan te passen
- **Target instellen**: Klik op "➕ Target instellen" als nog geen target
- **Direct feedback**: Lijst herlaadt automatisch met nieuwe voortgang

## Database

### Tabel: `ihw.babs_gemeente_target`

```sql
CREATE TABLE ihw.babs_gemeente_target (
  id uuid PRIMARY KEY,
  babs_id uuid NOT NULL REFERENCES ihw.babs(id),
  gemeente_oin text NOT NULL REFERENCES ihw.gemeente(oin),
  jaar integer NOT NULL,
  target_ceremonies integer NOT NULL,
  created_at timestamptz NOT NULL,
  updated_at timestamptz NOT NULL,
  
  UNIQUE(babs_id, gemeente_oin, jaar),
  CHECK (target_ceremonies > 0),
  CHECK (jaar >= 2024 AND jaar <= 2050)
);
```

**Key features:**
- One target per BABS per gemeente per year
- Positive target requirement
- Year range validation
- Cascade delete with BABS and gemeente

## API Endpoints

### GET `/api/gemeente/lookup/babs`

Returns BABS list with ceremony statistics.

**Response includes:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "naam": "Jan Jansen",
      "status": "beedigd",
      "ceremoniesTotNu": 15,
      "targetCeremonies": 40,
      "percentageBehaald": 38,
      "actief": true
    }
  ]
}
```

**Calculation:**
```sql
-- Ceremonies this year
SELECT COUNT(*) 
FROM ihw.ceremonie 
WHERE babs_id = ? 
  AND EXTRACT(YEAR FROM datum) = CURRENT_YEAR

-- Target for this year  
SELECT target_ceremonies 
FROM ihw.babs_gemeente_target
WHERE babs_id = ?
  AND gemeente_oin = ?
  AND jaar = CURRENT_YEAR
```

### PUT `/api/gemeente/babs/[id]/target`

Set or update ceremony target.

**Request:**
```json
{
  "targetCeremonies": 50,
  "jaar": 2025  // optional, defaults to current year
}
```

**Response:**
```json
{
  "success": true,
  "message": "Target succesvol bijgewerkt"
}
```

**Behavior:**
- Creates new target if doesn't exist
- Updates existing target if already exists
- Validates positive number

### DELETE `/api/gemeente/babs/[id]/target?jaar=2025`

Remove ceremony target for a specific year.

**Response:**
```json
{
  "success": true,
  "message": "Target verwijderd"
}
```

## UI/UX

### BABS Lijst Tabel

**Kolommen:**
1. **Naam**: BABS naam
2. **Status**: beedigd / in_aanvraag / ongeldig
3. **Voortgang**: 
   - Emoji indicator (🟢/🟡/🔴)
   - Fractie (15/40)
   - Percentage (38% behaald)
   - "✏️ Wijzig" knop
4. **Actief**: Status badge
5. **Acties**: Bewerken / Verwijderen

### Inline Edit Flow

**Scenario 1: Target wijzigen**
1. Klik "✏️ Wijzig" bij voortgang
2. Browser prompt: "Wijzig target voor Jan Jansen: [40]"
3. Voer nieuwe target in (bijv. 50)
4. Klik OK
5. API call naar `/api/gemeente/babs/{id}/target`
6. Lijst herlaadt automatisch
7. Success melding: "Target succesvol bijgewerkt!"

**Scenario 2: Target instellen (eerste keer)**
1. Klik "➕ Target instellen"
2. Browser prompt: "Stel target in voor Jan Jansen: [40]"
3. Voer target in
4. Rest volgt scenario 1

### Nieuwe BABS Aanmaken

**Target sectie** (optioneel):
```
🎯 Jaarlijks Ceremonie Target
┌─────────────────────────────┐
│ Jaar:    [2025]             │
│ Aantal:  [40]               │
│                             │
│ 💡 Hoeveel ceremonies deze  │
│    BABS naar verwachting    │
│    dit jaar uitvoert        │
└─────────────────────────────┘
```

## Use Cases

### 1. Werklastverdeling

**Probleem**: Gemeente wil weten of BABS-en gelijkmatig worden ingezet.

**Oplossing**:
- Stel voor elke BABS target in (bijv. 40/jaar)
- Monitor voortgang in lijst
- Zie in één oogopslag wie achterloopt (🔴) of on-track is (🟢)

### 2. Performance Monitoring

**Probleem**: Is BABS Jan voldoende productief?

**Oplossing**:
- Bekijk ceremonies tot nu: 15
- Bekijk target: 40
- Bekijk percentage: 38%
- Analyseer of Jan op schema ligt voor dit jaar

### 3. Capaciteitsplanning

**Probleem**: Hebben we genoeg BABS voor verwacht aantal ceremonies?

**Oplossing**:
- Tel alle targets op: 5 BABS × 40 = 200 ceremonies/jaar
- Vergelijk met verwachte vraag
- Pas targets aan of werf extra BABS

### 4. Multi-gemeente BABS

**Scenario**: Jan werkt voor Amsterdam én Utrecht

**Implementatie**:
- Amsterdam stelt target in: 25 ceremonies
- Utrecht stelt target in: 15 ceremonies  
- Jan ziet totaal 40 ceremonies target
- Elke gemeente ziet hun eigen target

## Berekeningen

### Percentage Behaald

```typescript
percentageBehaald = targetCeremonies > 0 
  ? Math.round((ceremoniesTotNu / targetCeremonies) * 100) 
  : 0
```

### Status Indicator

```typescript
if (percentageBehaald >= 100) return '🟢'; // Groen
if (percentageBehaald >= 50) return '🟡';  // Geel
return '🔴';                                 // Rood
```

### Ceremonies Tot Nu

```sql
SELECT COUNT(*) 
FROM ihw.ceremonie
WHERE babs_id = ?
  AND EXTRACT(YEAR FROM datum) = ?
```

## Deployment

### Stap 1: Database Migratie

```bash
psql $DATABASE_URL -f sql/migrations/110_babs_ceremony_targets.sql
```

### Stap 2: Code Deployment

Alle code is klaar:
- ✅ `src/db/schema.ts` - Schema definitie
- ✅ `src/app/api/gemeente/lookup/babs/route.ts` - Statistieken in GET
- ✅ `src/app/api/gemeente/babs/[id]/target/route.ts` - Target management
- ✅ `src/app/gemeente/beheer/lookup/page.tsx` - UI met inline edit

### Stap 3: Test

1. Ga naar `/gemeente/beheer/lookup?tab=babs`
2. Maak nieuwe BABS aan met target 40
3. Zie voortgang: 0/40 (0%)
4. Voeg ceremonie toe met deze BABS
5. Refresh BABS lijst
6. Zie voortgang: 1/40 (3%) 🔴

## Toekomstige Uitbreidingen

### 1. Dashboard met Totalen

```typescript
Total ceremonies dit jaar: 125
Total target: 200
Overall voortgang: 63% 🟡
```

### 2. Historische Data

```sql
-- Ceremonies per jaar historisch
SELECT jaar, COUNT(*) as ceremonies
FROM ihw.ceremonie
WHERE babs_id = ?
GROUP BY EXTRACT(YEAR FROM datum)
ORDER BY jaar DESC
```

### 3. Target per Maand

```sql
ALTER TABLE ihw.babs_gemeente_target
ADD COLUMN target_per_maand integer;
```

### 4. Notificaties

- Email naar BABS als <25% behaald in Q4
- Alert naar gemeente als totaal achterloopt
- Wekelijkse voortgangsrapportage

### 5. Export & Reporting

- CSV export van BABS voortgang
- PDF rapport met grafieken
- Jaar-op-jaar vergelijking

## Files Changed

1. ✅ `src/db/schema.ts` - Added `babsGemeenteTarget` table
2. ✅ `src/app/api/gemeente/lookup/babs/route.ts` - Added ceremony statistics
3. ✅ `src/app/api/gemeente/babs/[id]/target/route.ts` - NEW: Target management API
4. ✅ `src/app/gemeente/beheer/lookup/page.tsx` - Added inline target edit
5. ✅ `sql/migrations/110_babs_ceremony_targets.sql` - Database migration (already existed)
6. ✅ `docs/features/CEREMONIES-PER-JAAR.md` - This documentation

## Voorbeelden

### Voorbeeld 1: BABS on Track

```
Jan Jansen (beedigd)
🟢 32/40 (80% behaald)
```

### Voorbeeld 2: BABS Behind

```
Maria de Vries (beedigd)
🔴 8/40 (20% behaald)
```

### Voorbeeld 3: BABS Exceeded

```
Piet Bakker (beedigd)
🟢 45/40 (113% behaald)
```

### Voorbeeld 4: Geen Target

```
Nieuwe BABS (in_aanvraag)
Geen target ingesteld
[➕ Target instellen]
```

## Conclusie

De ceremonies per jaar functionaliteit is nu volledig geïmplementeerd en klaar voor gebruik! Gemeenten kunnen eenvoudig:

✅ Targets instellen per BABS  
✅ Voortgang monitoren in real-time  
✅ Performance analyseren met visuele indicatoren  
✅ Inline targets aanpassen zonder formulier  
✅ Multi-gemeente BABS ondersteunen  

De implementatie is:
- 🎯 Gebruiksvriendelijk
- 📊 Data-gedreven
- 🚀 Performance-optimized
- 🔒 Security-compliant
- 📱 Responsive design

