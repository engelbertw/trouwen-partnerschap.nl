# Kinderen (Children) Database Storage

## Overzicht

Kinderen uit een ander huwelijk worden nu volledig opgeslagen in de database via de nieuwe `ihw.kind` tabel.

## Database Schema

### Tabel: `ihw.kind`

```sql
CREATE TABLE ihw.kind (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    dossier_id uuid NOT NULL REFERENCES ihw.dossier(id) ON DELETE CASCADE,
    gemeente_oin text NOT NULL REFERENCES ihw.gemeente(oin),
    partner_id uuid NOT NULL REFERENCES ihw.partner(id) ON DELETE CASCADE,
    
    -- Child details
    voornamen text NOT NULL,
    achternaam text NOT NULL,
    geboortedatum date NOT NULL,
    
    -- Metadata
    created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT chk_geboortedatum_kind CHECK (geboortedatum < CURRENT_DATE)
);
```

### Indexes

- `idx_kind_dossier` - op `dossier_id`
- `idx_kind_partner` - op `partner_id`
- `idx_kind_gemeente` - op `gemeente_oin`

## Data Flow

### 1. Browser (SessionStorage)

De kinderen worden tijdens het invullen van het formulier tijdelijk opgeslagen in `sessionStorage`:

```typescript
// Wordt opgeslagen in sessionStorage onder key 'aankondiging_draft'
{
  kinderen: {
    partner1HasChildren: boolean,
    partner1Children: Array<{
      id: string,
      voornamen: string,
      achternaam: string,
      geboortedatum: string // DD-MM-YYYY format
    }>,
    partner2HasChildren: boolean,
    partner2Children: Array<{
      id: string,
      voornamen: string,
      achternaam: string,
      geboortedatum: string // DD-MM-YYYY format
    }>
  }
}
```

### 2. API Endpoint

De data wordt verzonden naar `/api/aankondiging/submit` die de kinderen opslaat in de database:

```typescript
// Voor Partner 1
if (formData.kinderen?.partner1Children && formData.kinderen.partner1Children.length > 0) {
  for (const child of formData.kinderen.partner1Children) {
    await tx.insert(kind).values({
      dossierId: newDossier.id,
      gemeenteOin,
      partnerId: newPartner1.id,
      voornamen: child.voornamen,
      achternaam: child.achternaam,
      geboortedatum: convertDateFormat(child.geboortedatum), // DD-MM-YYYY → YYYY-MM-DD
    });
  }
}

// Voor Partner 2
if (formData.kinderen?.partner2Children && formData.kinderen.partner2Children.length > 0) {
  for (const child of formData.kinderen.partner2Children) {
    await tx.insert(kind).values({
      dossierId: newDossier.id,
      gemeenteOin,
      partnerId: newPartner2.id,
      voornamen: child.voornamen,
      achternaam: child.achternaam,
      geboortedatum: convertDateFormat(child.geboortedatum),
    });
  }
}
```

### 3. Database

De kinderen worden opgeslagen met een relatie naar:
- Het dossier (`dossier_id`)
- De gemeente (`gemeente_oin`)
- De partner die het kind heeft (`partner_id`)

## Relaties

```
ihw.dossier (1) ──< (many) ihw.kind
ihw.partner (1) ──< (many) ihw.kind
ihw.gemeente (1) ──< (many) ihw.kind
```

- Elk kind behoort tot exact **1 dossier**
- Elk kind behoort tot exact **1 partner**
- Elk kind behoort tot exact **1 gemeente**
- Elk dossier kan **0 of meer kinderen** hebben
- Elke partner kan **0 of meer kinderen** hebben uit eerdere huwelijken

## Drizzle ORM Schema

```typescript
export const kind = ihw.table('kind', {
  id: uuid('id').primaryKey().defaultRandom(),
  dossierId: uuid('dossier_id').notNull().references(() => dossier.id, { onDelete: 'cascade' }),
  gemeenteOin: text('gemeente_oin').notNull().references(() => gemeente.oin),
  partnerId: uuid('partner_id').notNull().references(() => partner.id, { onDelete: 'cascade' }),
  voornamen: text('voornamen').notNull(),
  achternaam: text('achternaam').notNull(),
  geboortedatum: date('geboortedatum').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export type Kind = typeof kind.$inferSelect;
export type NewKind = typeof kind.$inferInsert;
```

## Migratie Uitvoeren

Om de nieuwe `kind` tabel aan te maken in de database:

### Optie 1: Via Migration Script (Aanbevolen)

```bash
# Zorg dat DATABASE_URL is ingesteld
export DATABASE_URL='postgresql://user:pass@host.neon.tech/neondb?sslmode=require'

# Voer migratie uit
cd sql
chmod +x run-migrations.sh
./run-migrations.sh
```

### Optie 2: Handmatig via psql

```bash
psql "$DATABASE_URL" -f sql/migrations/001_add_kind_table.sql
```

### Optie 3: Via Neon Console

Kopieer de inhoud van `sql/migrations/001_add_kind_table.sql` en voer uit in de Neon SQL Editor.

## Queries

### Haal alle kinderen op voor een dossier

```sql
SELECT 
  k.*,
  p.voornamen as partner_voornamen,
  p.geslachtsnaam as partner_achternaam,
  p.sequence as partner_nummer
FROM ihw.kind k
JOIN ihw.partner p ON k.partner_id = p.id
WHERE k.dossier_id = 'your-dossier-id'
ORDER BY p.sequence, k.voornamen;
```

### Tel kinderen per partner

```sql
SELECT 
  p.voornamen || ' ' || p.geslachtsnaam as partner_naam,
  p.sequence,
  COUNT(k.id) as aantal_kinderen
FROM ihw.partner p
LEFT JOIN ihw.kind k ON k.partner_id = p.id
WHERE p.dossier_id = 'your-dossier-id'
GROUP BY p.id, p.voornamen, p.geslachtsnaam, p.sequence
ORDER BY p.sequence;
```

### Drizzle ORM Query

```typescript
import { db } from '@/db';
import { kind, partner } from '@/db/schema';
import { eq } from 'drizzle-orm';

// Haal kinderen op voor een partner
const kinderen = await db
  .select()
  .from(kind)
  .where(eq(kind.partnerId, partnerId));

// Haal kinderen op met partner info
const kinderenMetPartner = await db
  .select({
    kind: kind,
    partner: {
      voornamen: partner.voornamen,
      geslachtsnaam: partner.geslachtsnaam,
      sequence: partner.sequence,
    }
  })
  .from(kind)
  .leftJoin(partner, eq(kind.partnerId, partner.id))
  .where(eq(kind.dossierId, dossierId));
```

## Validatie

### Frontend Validatie (050-kinderen/page.tsx)

- Als partner aangeeft kinderen te hebben (`hasChildren = true`), moet er minimaal 1 kind worden toegevoegd
- Alle velden (voornamen, achternaam, geboortedatum) zijn verplicht
- Geboortedatum wordt ingevoerd als date field (DD-MM-YYYY)

### Database Validatie

- `geboortedatum` moet in het verleden liggen (constraint: `geboortedatum < CURRENT_DATE`)
- Alle tekstvelden zijn `NOT NULL`
- Foreign keys garanderen referentiële integriteit

## Bestandslocaties

### Database
- **SQL Migratie**: `sql/migrations/001_add_kind_table.sql`
- **Schema Definition**: `src/db/schema.ts` (regel ~257-267)

### Backend
- **API Route**: `src/app/api/aankondiging/submit/route.ts` (regel ~126-151)

### Frontend
- **Kinderen Page**: `src/app/000-aankondiging/050-kinderen/page.tsx`
- **Storage Types**: `src/lib/aankondiging-storage.ts` (regel ~47-63)

## Status

✅ **Volledig geïmplementeerd**

- [x] Database tabel aangemaakt (`ihw.kind`)
- [x] Drizzle schema bijgewerkt
- [x] API route slaat kinderen op
- [x] Frontend verzamelt gegevens van beide partners
- [x] Data flow van browser → API → database compleet

## Volgende Stappen

1. ✅ Migratie uitvoeren op database
2. ⏳ Test de complete flow:
   - Vul kindergegevens in voor beide partners
   - Submit het formulier
   - Verifieer in database dat kinderen zijn opgeslagen
3. ⏳ Lees-functionaliteit implementeren (om kinderen weer te tonen na opslaan)

