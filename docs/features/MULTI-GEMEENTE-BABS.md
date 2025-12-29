# Multi-Gemeente BABS Support

**Datum**: 28 december 2025  
**Status**: ✅ Geïmplementeerd

## Overzicht

BABS (trouwambtenaren) kunnen nu voor **meerdere gemeenten** werken. Deze implementatie maakt het mogelijk dat:
- Een BABS ceremonies kan uitvoeren in verschillende gemeenten
- Elke gemeente zijn eigen lijst van BABS beheert
- BABS automatisch alle toegewezen ceremonies ziet, ongeacht gemeente

## Waarom Multi-Gemeente Support?

In de praktijk werken BABS vaak voor meerdere gemeenten:
- Freelance trouwambtenaren
- Beëdigde ambtenaren die ook in naburige gemeenten werken
- Regionale samenwerking tussen gemeenten
- Flexibiliteit in planning en beschikbaarheid

## Architectuur

### Database Schema

#### Nieuwe Tabel: `ihw.babs_gemeente`

Junction table die de many-to-many relatie implementeert:

```sql
CREATE TABLE ihw.babs_gemeente (
  id uuid PRIMARY KEY,
  babs_id uuid NOT NULL REFERENCES ihw.babs(id),
  gemeente_oin text NOT NULL REFERENCES ihw.gemeente(oin),
  actief boolean NOT NULL DEFAULT true,
  actief_vanaf date NOT NULL,
  actief_tot date,
  opmerkingen text,
  toegevoegd_door text NOT NULL,  -- Clerk user ID
  created_at timestamptz NOT NULL,
  updated_at timestamptz NOT NULL,
  
  UNIQUE(babs_id, gemeente_oin)
);
```

**Belangrijke velden:**
- `babs_id`: Verwijzing naar de BABS
- `gemeente_oin`: Voor welke gemeente deze BABS werkt
- `actief_vanaf` / `actief_tot`: Periode waarin BABS beschikbaar is
- `actief`: On/off switch per gemeente

### Clerk Metadata Wijziging

**Oud (voor multi-gemeente):**
```json
{
  "rol": "babs_admin",
  "babs_id": "uuid-xxx",
  "gemeente_oin": "00000001002564440000",  // ❌ Vaste gemeente
  "gemeente_naam": "Amsterdam"
}
```

**Nieuw (multi-gemeente):**
```json
{
  "rol": "babs_admin",
  "babs_id": "uuid-xxx"
  // ✅ Geen gemeente_oin! BABS kan voor meerdere gemeenten werken
}
```

### Code Wijzigingen

#### 1. `getGemeenteContext()` - Special Case voor BABS

```typescript
// src/lib/gemeente.ts

export async function getGemeenteContext() {
  // ... auth checks ...
  
  // Special case: BABS users don't need gemeente_oin
  if (rol === 'babs_admin' && babsId) {
    return {
      success: true,
      data: {
        userId,
        gemeenteOin: '', // BABS has no fixed gemeente
        gemeenteNaam: 'Multi-gemeente BABS',
        rol,
        babsId,
      },
    };
  }
  
  // ... normal gemeente users ...
}
```

#### 2. BABS Creation - Automatic Link

```typescript
// src/app/api/gemeente/lookup/babs/route.ts

await db.transaction(async (tx) => {
  // Create BABS
  const [newBabs] = await tx.insert(babs).values({...}).returning();
  
  // Create link to current gemeente
  await tx.insert(babsGemeente).values({
    babsId: newBabs.id,
    gemeenteOin: context.data.gemeenteOin,
    toegevoegdDoor: context.data.userId,
  });
  
  // Create Clerk account WITHOUT gemeente_oin
  await clerkClient().users.createUser({
    publicMetadata: {
      rol: 'babs_admin',
      babs_id: newBabs.id,
      // NO gemeente_oin!
    },
  });
});
```

#### 3. BABS List - Filter by Gemeente

```typescript
// GET /api/gemeente/lookup/babs
// Gemeente ziet alleen "hun" BABS

const babsList = await db
  .select()
  .from(babs)
  .innerJoin(babsGemeente, eq(babs.id, babsGemeente.babsId))
  .where(
    and(
      eq(babsGemeente.gemeenteOin, context.data.gemeenteOin),
      eq(babsGemeente.actief, true)
    )
  );
```

#### 4. BABS Ceremonies - All Gemeenten

```typescript
// GET /api/babs/ceremonies
// BABS ziet ceremonies van ALLE gemeenten

const ceremonies = await db
  .select()
  .from(ceremonie)
  .where(eq(ceremonie.babsId, context.data.babsId));
  // Geen filter op gemeente_oin!
```

## Gebruik

### Als Gemeente: BABS Toevoegen

1. Ga naar `/gemeente/beheer/lookup?tab=babs`
2. Klik "Nieuwe BABS"
3. Vul gegevens in inclusief email
4. Klik "Opslaan"

**Wat gebeurt er:**
- BABS wordt aangemaakt in `ihw.babs` tabel
- Link wordt gemaakt in `ihw.babs_gemeente` voor jouw gemeente
- Clerk account wordt aangemaakt ZONDER vaste gemeente
- BABS ontvangt email om wachtwoord in te stellen

### Als BABS: Ceremonies Bekijken

1. Login op `/babs/beschikbaarheid`
2. Klik "Mijn Ceremonies" (of `/babs/ceremonies`)
3. Zie **alle** ceremonies van alle gemeenten waar je voor werkt

**Voorbeeld:**
Jan Jansen werkt voor Amsterdam én Utrecht:
- Amsterdam voegt Jan toe: `babs_gemeente` entry met `gemeente_oin = Amsterdam`
- Utrecht voegt Jan ook toe: `babs_gemeente` entry met `gemeente_oin = Utrecht`
- Jan ziet ceremonies van beide gemeenten in één lijst

### Een BABS Toevoegen aan Meerdere Gemeenten

**Scenario:** Gemeente Utrecht wil BABS Jan Jansen (die al bestaat) toevoegen

**Optie A: Via API (toekomstig)**
```typescript
POST /api/gemeente/babs/link
{
  "babsId": "uuid-of-jan",
  "opmerkingen": "Jan werkt op vrijdag voor Utrecht"
}
```

**Optie B: Handmatig via database**
```sql
INSERT INTO ihw.babs_gemeente (babs_id, gemeente_oin, toegevoegd_door)
VALUES ('uuid-of-jan', '00000001002220647000', 'clerk-user-id');
```

## Migratie: Bestaande BABS

Voor bestaande BABS die al een `gemeente_oin` hebben in Clerk:

### Stap 1: Maak Links in babs_gemeente

```sql
-- Voor elke bestaande BABS, maak een link naar hun gemeente
INSERT INTO ihw.babs_gemeente (babs_id, gemeente_oin, actief_vanaf, toegevoegd_door)
SELECT 
  b.id,
  '00000001002564440000', -- Vervang met juiste OIN per BABS
  b.created_at::date,
  'migration-script'
FROM ihw.babs b
WHERE b.actief = true;
```

### Stap 2: Update Clerk Metadata

Via Clerk API of dashboard:
```javascript
// Remove gemeente_oin from BABS users
await clerkClient.users.updateUser(userId, {
  publicMetadata: {
    rol: 'babs_admin',
    babs_id: babsId,
    // Remove: gemeente_oin, gemeente_naam
  },
});
```

## Voordelen

✅ **Flexibiliteit**: BABS kan ceremonies doen in meerdere gemeenten  
✅ **Realistische workflow**: Komt overeen met de praktijk  
✅ **Eenvoudig beheer**: Elke gemeente beheert zijn eigen BABS-lijst  
✅ **Backwards compatible**: Oude implementatie blijft werken met migratie  
✅ **Schaalbaarheid**: Ondersteunt regionale samenwerking  

## Security & Multi-Tenancy

**Belangrijke waarborg:**
- BABS kan **alleen** ceremonies zien waar ze expliciet aan toegewezen zijn
- BABS kan **geen** dossiers of andere gemeente data zien
- Gemeenten zien **alleen** BABS die via `babs_gemeente` aan hen gekoppeld zijn
- Multi-tenancy blijft intact voor alle andere data

**Voorbeeld:**
```typescript
// ❌ BABS kan niet:
await db.select().from(dossier); // Geen toegang tot dossiers

// ✅ BABS kan wel:
await db.select()
  .from(ceremonie)
  .where(eq(ceremonie.babsId, babsId)); // Alleen eigen ceremonies
```

## Testing

### Test Scenario 1: BABS voor 1 Gemeente

1. Gemeente Amsterdam maakt BABS "Jan Jansen" aan
2. Jan kan inloggen op `/babs/beschikbaarheid`
3. Amsterdam wijst Jan toe aan een ceremonie
4. Jan ziet deze ceremonie in zijn lijst

### Test Scenario 2: BABS voor 2 Gemeenten

1. Amsterdam maakt BABS "Jan Jansen" aan
2. Utrecht voegt BABS "Jan Jansen" toe aan hun lijst
3. Amsterdam wijst Jan toe aan ceremonie op 15 maart
4. Utrecht wijst Jan toe aan ceremonie op 22 maart
5. Jan ziet **beide** ceremonies in zijn lijst

### Test Scenario 3: BABS Deactiveren per Gemeente

1. Amsterdam heeft BABS "Jan Jansen"
2. Utrecht heeft ook BABS "Jan Jansen"
3. Amsterdam deactiveert Jan: `UPDATE babs_gemeente SET actief = false WHERE babs_id = jan AND gemeente_oin = amsterdam`
4. Amsterdam ziet Jan niet meer in BABS lijst
5. Utrecht ziet Jan nog steeds
6. Jan ziet ceremonies van Utrecht maar niet meer van Amsterdam

## API Endpoints

### GET `/api/gemeente/lookup/babs`
Haal BABS-lijst op voor huidige gemeente.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "naam": "Jan Jansen",
      "email": "jan@example.com",
      "status": "beedigd",
      "babsGemeenteActief": true,
      "babsGemeenteVanaf": "2025-01-01",
      "babsGemeenteTot": null
    }
  ]
}
```

### POST `/api/gemeente/lookup/babs`
Maak nieuwe BABS aan (incl. link naar gemeente).

**Request:**
```json
{
  "naam": "Jan Jansen",
  "voornaam": "Jan",
  "achternaam": "Jansen",
  "email": "jan@example.com",
  "status": "beedigd",
  "createClerkAccount": true
}
```

### GET `/api/babs/ceremonies`
Haal ceremonies op voor ingelogde BABS (alle gemeenten).

**Query params:**
- `from`: YYYY-MM-DD (optioneel)
- `to`: YYYY-MM-DD (optioneel)

## Toekomstige Uitbreidingen

### 1. BABS Link API Endpoint
```typescript
POST /api/gemeente/babs/link
// Link bestaande BABS aan jouw gemeente
```

### 2. BABS Beschikbaarheid per Gemeente
```sql
ALTER TABLE ihw.babs_gemeente ADD COLUMN beschikbaarheid jsonb;
// Verschillende beschikbaarheid per gemeente
```

### 3. BABS Dashboard
- Overzicht van alle gemeenten waar BABS voor werkt
- Per-gemeente statistieken
- Communicatie met gemeenten

## Files Changed

1. ✅ `sql/migrations/100_babs_gemeente_junction.sql` - Database migratie
2. ✅ `src/db/schema.ts` - Schema definitie
3. ✅ `src/lib/gemeente.ts` - Special case voor BABS in `getGemeenteContext()`
4. ✅ `src/app/api/gemeente/lookup/babs/route.ts` - BABS CRUD met junction table
5. ✅ `docs/features/MULTI-GEMEENTE-BABS.md` - Deze documentatie

## Deployment

### Stap 1: Database Migratie
```bash
psql $DATABASE_URL -f sql/migrations/100_babs_gemeente_junction.sql
```

### Stap 2: Code Deployment
Deploy de nieuwe code (alle files hierboven).

### Stap 3: Migratie Bestaande BABS
Voer migratie script uit (zie "Migratie: Bestaande BABS" hierboven).

### Stap 4: Test
Test met bestaande en nieuwe BABS.

## Vragen?

Zie ook:
- [BABS Features](./babs/README.md)
- [BABS Beschikbaarheid](../implementation/BABS-BESCHIKBAARHEID-IMPLEMENTATION.md)
- [Multi-Tenancy](../implementation/MULTI-TENANCY-IMPLEMENTATION.md)

