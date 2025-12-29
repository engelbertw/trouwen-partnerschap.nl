# Geboortedatum Constraint Fix - Samenvatting

**Datum:** 27 december 2025  
**Status:** ✅ Opgelost en gedeployed

## Probleem

De validatie tijdens invoer accepteerde kinderen geboren op **vandaag**, maar de database weigerde deze door een te strikte constraint.

### Symptomen
- ❌ Database error bij opslaan: `new row violates check constraint "chk_geboortedatum_kind"`
- ✅ Frontend validatie gaf geen fouten
- 🔴 Gebruiker kon formulier niet versturen

### Root Cause

**Inconsistentie tussen frontend en database validatie:**

1. **Frontend validatie** (`src/lib/validation.ts`):
   ```typescript
   if (kindGeboortedatum > now) {
     errors.push({ message: 'De geboortedatum kan niet in de toekomst liggen' });
   }
   ```
   ➡️ **Vandaag is OK** (not greater than now = allowed)

2. **Database constraint** (oud):
   ```sql
   CONSTRAINT chk_geboortedatum_kind CHECK (geboortedatum < CURRENT_DATE)
   ```
   ➡️ **Vandaag is NIET OK** (strictly less than current date)

3. **Datum in error**: `2025-12-27` (vandaag)
   - Frontend: `2025-12-27 > 2025-12-27` = FALSE → ✅ Toegestaan
   - Database: `2025-12-27 < 2025-12-27` = FALSE → ❌ Geweigerd

## Oplossing

### 1. Database Constraint Aangepast

**Voor (strikt):**
```sql
CONSTRAINT chk_geboortedatum_kind CHECK (geboortedatum < CURRENT_DATE)
```

**Na (inclusief vandaag):**
```sql
CONSTRAINT chk_geboortedatum_kind CHECK (geboortedatum <= CURRENT_DATE)
```

### 2. Frontend Validatie Consistent Gemaakt

**Voor:**
```typescript
const now = new Date();
if (kindGeboortedatum > now) { ... }
```

**Na:**
```typescript
const now = new Date();
now.setHours(0, 0, 0, 0); // Reset to start of day for fair comparison
if (kindGeboortedatum > now) { ... }
```

### 3. Twee Tabellen Gefixed

De constraint is aangepast in:
- ✅ `ihw.kind` tabel (`chk_geboortedatum_kind`)
- ✅ `ihw.getuige` tabel (`chk_geboortedatum`)

## Deployment

### Bestanden Aangepast

1. **Database Schema:**
   - `sql/020_core_tables.sql` - Getuige constraint
   - `sql/migrations/001_add_kind_table.sql` - Kind constraint (origineel)
   - `sql/migrations/002_fix_geboortedatum_constraint.sql` - Nieuwe migratie

2. **Frontend Validatie:**
   - `src/lib/validation.ts` - Consistent gemaakt met database

3. **Migratie Script:**
   - `scripts/run-migration-constraint-fix.js` - Deployment script

### Migratie Uitgevoerd

```bash
node scripts/run-migration-constraint-fix.js
```

**Resultaat:**
```
✅ kind.chk_geboortedatum_kind: (geboortedatum <= CURRENT_DATE)
✅ getuige.chk_geboortedatum: (geboortedatum <= CURRENT_DATE)
```

## Verificatie

### Database Check
```sql
-- Controleer constraints
SELECT constraint_name, check_clause
FROM information_schema.check_constraints
WHERE constraint_schema = 'ihw' 
AND constraint_name IN ('chk_geboortedatum_kind', 'chk_geboortedatum');
```

### Test Scenario's

| Geboortedatum | Frontend | Database (oud) | Database (nieuw) |
|---------------|----------|----------------|------------------|
| Gisteren      | ✅ OK    | ✅ OK          | ✅ OK            |
| **Vandaag**   | ✅ OK    | ❌ **FOUT**    | ✅ **OK**        |
| Morgen        | ❌ FOUT  | ❌ FOUT        | ❌ FOUT          |

## Impact

- ✅ Gebruikers kunnen nu kinderen toevoegen die vandaag geboren zijn
- ✅ Frontend en database validatie zijn consistent
- ✅ Geen breaking changes voor bestaande data
- ✅ Beide tabellen (kind en getuige) zijn gefixed

## Waarom Dit Belangrijk Is

### Business Logic
- **Baby's geboren vandaag** moeten toegevoegd kunnen worden
- Gemeentelijke registraties gebeuren vaak op de geboortedag zelf
- Consistent met Burgerlijke Stand praktijk

### User Experience
- Voorkomt verwarrende foutmeldingen
- Gebruiker ziet geen frontend error, maar krijgt wel database error → BAD UX
- Nu is gedrag voorspelbaar en consistent

### Data Integriteit
- Database constraints komen overeen met frontend validatie
- Voorkomt silent failures
- AVG-compliant logging blijft werken

## Lessons Learned

### ⚠️ **ALTIJD** Validatie Consistency Checken

1. **Frontend validatie** (`src/lib/validation.ts`)
2. **Database constraints** (`sql/*.sql`)
3. **API validatie** (`src/app/api/*/route.ts`)

Alle drie moeten **exact dezelfde** logica hanteren!

### ⚠️ **Strikte** vs **Inclusieve** Vergelijkingen

```typescript
// Strikt (vandaag NOT allowed)
date < now        // SQL: < CURRENT_DATE
date > now        // SQL: > CURRENT_DATE

// Inclusief (vandaag IS allowed)
date <= now       // SQL: <= CURRENT_DATE
date >= now       // SQL: >= CURRENT_DATE
```

### ⚠️ Tijd vs Datum Vergelijkingen

```typescript
// JavaScript Date() heeft tijd component!
const now = new Date(); // 2025-12-27 14:30:15

// Voor datum vergelijkingen:
now.setHours(0, 0, 0, 0); // 2025-12-27 00:00:00

// SQL CURRENT_DATE heeft GEEN tijd component
CURRENT_DATE = '2025-12-27' (geen uur/minuut/seconde)
```

## Preventie Voor Toekomst

### Checklist Nieuwe Validaties

- [ ] Frontend validatie geïmplementeerd
- [ ] Database constraint toegevoegd
- [ ] API validatie toegevoegd
- [ ] **ALLE DRIE gebruiken EXACT dezelfde logica**
- [ ] Test edge cases (vandaag, morgen, gisteren)
- [ ] Documenteer rationale in code comments
- [ ] Voeg toe aan validatie documentatie

### Testing Protocol

```typescript
// Altijd deze drie scenarios testen:
const testCases = [
  { date: 'gisteren', shouldPass: true },
  { date: 'vandaag', shouldPass: true },    // ⚠️ KRITISCH
  { date: 'morgen', shouldPass: false },
];
```

## Referenties

- **Validation System Docs:** `docs/VALIDATION-SYSTEM.md`
- **Validation Compliance:** `.cursor/rules/validation-compliance.mdc`
- **Database Schema:** `sql/020_core_tables.sql`
- **Frontend Validatie:** `src/lib/validation.ts`

## Status Check

✅ **RESOLVED** - Deployment compleet, alle systemen consistent

---

**Conclusie:** De geboortedatum constraint is succesvol aangepast van `<` naar `<=` om kinderen geboren op de huidige datum toe te staan. Frontend en database validatie zijn nu volledig consistent.

