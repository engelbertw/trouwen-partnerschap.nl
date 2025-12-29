# BABS-Gemeente Junction Table - Migration Completed

**Datum**: 28 december 2025  
**Status**: ✅ Voltooid

## Probleem

De applicatie gaf de fout: `relation "ihw.babs_gemeente" does not exist` bij het ophalen van BABS voor een gemeente.

## Oorzaak

De `babs_gemeente` junction table was gedefinieerd in het schema en de migratie SQL bestond, maar was nog niet uitgevoerd in de database.

## Oplossing

### 1. Migratie Script Gemaakt

Nieuw script: `scripts/run-babs-gemeente-migration.js`

Dit script:
- Controleert of de `babs_gemeente` tabel al bestaat
- Voert de SQL migratie uit (`sql/migrations/100_babs_gemeente_junction.sql`)
- Verwijdert psql-specific `\echo` commando's (niet compatibel met Node.js pg client)
- Verifieert dat de tabel en alle constraints/indexes correct zijn aangemaakt

### 2. BABS Gekoppeld aan Gemeente

Nieuw script: `scripts/seed-babs-gemeente-links.js`

Dit script:
- Lijst alle beschikbare gemeenten
- Koppelt alle bestaande BABS aan de eerste gemeente (Almere in dit geval)
- Maakt entries in `babs_gemeente` tabel

**Resultaat**: 5 BABS succesvol gekoppeld aan Almere

### 3. Verificatie Scripts

**`scripts/check-babs-links.js`**: Controleert welke BABS gekoppeld zijn aan gemeenten

**`scripts/test-babs-lookup.js`**: Test de database query die de API gebruikt

## Uitgevoerde Stappen

```bash
# 1. Database migratie uitvoeren
node scripts/run-babs-gemeente-migration.js

# 2. BABS koppelen aan gemeente
node scripts/seed-babs-gemeente-links.js

# 3. Verificatie
node scripts/test-babs-lookup.js
```

## Resultaat

✅ De `babs_gemeente` tabel is aangemaakt  
✅ Alle constraints en indexes zijn correct  
✅ 5 BABS zijn gekoppeld aan gemeente Almere  
✅ De API query werkt correct  
✅ De fout is opgelost  

## Database Schema

De `ihw.babs_gemeente` tabel heeft de volgende structuur:

```sql
CREATE TABLE ihw.babs_gemeente (
  id uuid PRIMARY KEY,
  babs_id uuid NOT NULL REFERENCES ihw.babs(id),
  gemeente_oin text NOT NULL REFERENCES ihw.gemeente(oin),
  actief boolean NOT NULL DEFAULT true,
  actief_vanaf date NOT NULL,
  actief_tot date,
  opmerkingen text,
  toegevoegd_door text NOT NULL,
  created_at timestamptz NOT NULL,
  updated_at timestamptz NOT NULL,
  
  UNIQUE(babs_id, gemeente_oin)
);
```

## API Endpoints

- **GET** `/api/gemeente/lookup/babs` - Haal alle BABS op voor de huidige gemeente
- **POST** `/api/gemeente/lookup/babs` - Maak een nieuwe BABS en koppel aan gemeente

## Multi-Gemeente Support

Een BABS kan nu voor meerdere gemeenten werken:
- Elke gemeente beheert zijn eigen lijst van BABS
- Een BABS kan ceremonies uitvoeren in verschillende gemeenten
- BABS zien automatisch alle ceremonies van alle gemeenten waar ze voor werken

Zie: `docs/features/MULTI-GEMEENTE-BABS.md` voor meer informatie

## Volgende Stappen

Als er nieuwe BABS worden toegevoegd via de admin interface, worden ze automatisch gekoppeld aan de juiste gemeente via de API.

Voor bulk import van bestaande BABS naar andere gemeenten, gebruik:
```bash
node scripts/seed-babs-gemeente-links.js
```

## Scripts Overzicht

| Script | Doel |
|--------|------|
| `run-babs-gemeente-migration.js` | Voer de database migratie uit |
| `seed-babs-gemeente-links.js` | Koppel BABS aan gemeenten |
| `check-babs-links.js` | Controleer huidige koppelingen |
| `test-babs-lookup.js` | Test de lookup query |

## Troubleshooting

Als de fout nog steeds optreedt na deze fix:

1. Controleer of de migratie is uitgevoerd:
   ```bash
   node scripts/check-babs-links.js
   ```

2. Verifieer dat BABS zijn gekoppeld aan gemeenten:
   ```bash
   node scripts/test-babs-lookup.js
   ```

3. Herstart de development server:
   ```bash
   npm run dev
   ```

## Referenties

- Migratie SQL: `sql/migrations/100_babs_gemeente_junction.sql`
- Schema definitie: `src/db/schema.ts` (regel 155-166)
- API implementatie: `src/app/api/gemeente/lookup/babs/route.ts`
- Documentatie: `docs/features/MULTI-GEMEENTE-BABS.md`

