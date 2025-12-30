# Database Documentatie

**Laatst bijgewerkt:** 28 december 2025

## Overzicht

Deze documentatie beschrijft het database schema, migrations en data modellen voor de Huwelijk applicatie.

## Schema

Het database schema is gedefinieerd in:
- `src/db/schema.ts` - Drizzle ORM schema definities
- `sql/` - SQL migratie bestanden

## Belangrijke Tabellen

### Core Tables
- `dossier` - Hoofd dossier tabel
- `partner` - Partner informatie
- `kind` - Kinderen uit eerdere relaties
- `getuige` - Getuigen
- `ceremonie` - Ceremonie details
- `document` - Document selecties

### Gemeente Tables
- `gemeente` - Gemeente informatie
- `gemeente_metadata` - Gemeente-specifieke instellingen

### BABS Tables
- `babs` - Buitengewoon Ambtenaar Burgerlijke Stand
- `babs_beschikbaarheid` - Beschikbaarheid regels
- `babs_gemeente` - BABS-gemeente relaties

### Validatie Tables
- `validatie_regel` - Validatie regels
- `validatie_log` - Validatie audit log

## Migrations

Database migrations worden beheerd via:
- Drizzle migrations: `drizzle/` directory
- SQL scripts: `sql/` directory

### Migratie Commando's

```bash
# Push schema naar database
npm run db:push

# Generate migration
npm run db:generate

# Run migrations
npm run db:migrate
```

## Multi-tenancy

De database ondersteunt multi-tenancy via `gemeenteOin` kolommen. Alle data wordt automatisch gescheiden per gemeente.

## Gerelateerde Documentatie

- [API](../api/README.md) - API endpoints
- [Features](../../features/README.md) - Feature implementaties
- [Validation System](../../VALIDATION-SYSTEM.md) - Validatie systeem

