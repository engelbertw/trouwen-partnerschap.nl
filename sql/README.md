# ihuwelijk Database - PostgreSQL (Neon Compatible)

Complete database voor het digitale huwelijksproces van Gemeente Amsterdam.

**Versie**: 1.0  
**Database**: PostgreSQL 15+  
**Platform**: Neon Serverless Postgres  
**Schema**: `ihw`

---

## 📋 Inhoudsopgave

1. [Quick Start](#quick-start)
2. [Database Overzicht](#database-overzicht)
3. [Neon Setup](#neon-setup)
4. [Deployment](#deployment)
5. [Verificatie](#verificatie)
6. [Drizzle ORM Integratie](#drizzle-orm-integratie)
7. [Beheer](#beheer)
8. [Troubleshooting](#troubleshooting)

---

## 🚀 Quick Start

### 1. Neon Database aanmaken

1. Ga naar https://console.neon.tech
2. Klik **New Project**
3. Kies een naam: `ihuwelijk-prod` (of `ihuwelijk-acc`)
4. Selecteer regio: **Europe (Frankfurt)** of **Europe (London)**
5. PostgreSQL versie: **15** of hoger
6. Klik **Create Project**

### 2. Connection String ophalen

In Neon Console → **Dashboard** → **Connection Details**:

```bash
DATABASE_URL=postgresql://username:password@ep-xxx.eu-central-1.aws.neon.tech/neondb?sslmode=require
```

### 3. Database initialiseren

```bash
# Voeg DATABASE_URL toe aan .env
echo "DATABASE_URL=your_connection_string_here" >> .env

# Run alle SQL scripts in volgorde
psql "$DATABASE_URL" -f sql/000_schema.sql
psql "$DATABASE_URL" -f sql/010_enums_lookups.sql
psql "$DATABASE_URL" -f sql/020_core_tables.sql
psql "$DATABASE_URL" -f sql/030_payment_communication.sql
psql "$DATABASE_URL" -f sql/040_triggers_functions.sql
psql "$DATABASE_URL" -f sql/050_views.sql
psql "$DATABASE_URL" -f sql/060_seeds.sql
```

**Of gebruik het deploy script**:

```bash
chmod +x sql/deploy.sh
./sql/deploy.sh
```

---

## 📊 Database Overzicht

### Schema Structuur

```
ihw/                      # ihuwelijk schema
├── dossier              # Hoofd huwelijksdossier
├── dossier_block        # Voortgang per blok
├── partner              # Partners (2 per dossier)
├── aankondiging         # Huwelijksaankondiging
├── ceremonie            # Ceremonie details
├── getuige              # Getuigen (2-4)
├── papier               # Brondocumenten
├── upload               # File uploads
├── payment              # Betalingen
├── refund               # Terugbetalingen
├── brp_export           # BRP/iBurgerzaken export
├── communication        # Veilige berichten
├── tijdslot             # Agenda tijdslots
├── audit_log            # Audit trail
├── type_ceremonie       # Ceremonie types (lookup)
├── locatie              # Trouwlocaties (400+)
└── babs                 # BABS medewerkers
```

### Belangrijke Features

✅ **UUID Primary Keys** - Voor branch-safe operations  
✅ **Timestamptz** - Tijdzones correct afgehandeld  
✅ **Business Rules Triggers** - Automatische validatie  
✅ **Showstoppers** - Puntouders, BABS timing, reeds gehuwd  
✅ **Betaling** - Via worldonline provider  
✅ **BRP Integratie** - Automatische export X weken voor ceremonie  
✅ **Audit Logging** - Alle belangrijke acties gelogd  
✅ **Roles & Permissions** - loket_readonly, hb_admin, app_rw  

---

## 🔧 Neon Setup

### Environment Variables

Voeg toe aan `.env`:

```bash
# Neon Database
DATABASE_URL=postgresql://user:pass@host.neon.tech/neondb?sslmode=require

# Optioneel: Separate URLs voor pooling
DATABASE_URL_UNPOOLED=$DATABASE_URL
DATABASE_URL_POOLED=postgresql://user:pass@host-pooler.neon.tech/neondb?sslmode=require
```

### Neon Branches (Development)

Neon ondersteunt database branches voor development:

```bash
# Create development branch
neon branches create --name dev

# Get branch connection string
neon connection-string dev
```

### Pooling (Production)

Voor production, gebruik Connection Pooling:

1. In Neon Console → **Connection Details**
2. Enable **Connection Pooling**
3. Use `host-pooler.neon.tech` URL
4. Voordelen:
   - Meer concurrent connections
   - Betere performance
   - Minder latency

---

## 🚀 Deployment

### Volledige Deployment (Fresh Install)

```bash
#!/bin/bash
# deploy.sh

set -e

echo "🚀 Deploying ihuwelijk database..."

# Check DATABASE_URL
if [ -z "$DATABASE_URL" ]; then
    echo "❌ DATABASE_URL not set"
    exit 1
fi

# Run all scripts
for script in sql/0*.sql; do
    echo "📄 Running $script..."
    psql "$DATABASE_URL" -f "$script"
done

echo "✅ Deployment complete!"
```

Maak executable en run:

```bash
chmod +x sql/deploy.sh
./sql/deploy.sh
```

### Gefaseerde Deployment (Productie)

Voor productie, deploy stap voor stap met verificatie:

```bash
# 1. Schema
psql "$DATABASE_URL" -f sql/000_schema.sql
psql "$DATABASE_URL" -c "SELECT schema_name FROM information_schema.schemata WHERE schema_name IN ('ihw', 'zk');"

# 2. Enums
psql "$DATABASE_URL" -f sql/010_enums_lookups.sql
psql "$DATABASE_URL" -c "SELECT code, naam FROM ihw.type_ceremonie;"

# 3. Core tables
psql "$DATABASE_URL" -f sql/020_core_tables.sql
psql "$DATABASE_URL" -c "\dt ihw.*"

# 4. Support tables
psql "$DATABASE_URL" -f sql/030_payment_communication.sql

# 5. Business logic
psql "$DATABASE_URL" -f sql/040_triggers_functions.sql

# 6. Views
psql "$DATABASE_URL" -f sql/050_views.sql
psql "$DATABASE_URL" -c "\dv ihw.*"

# 7. Seed data
psql "$DATABASE_URL" -f sql/060_seeds.sql
```

### Rollback Procedure

Bij problemen, rollback in **omgekeerde volgorde**:

```bash
# WAARSCHUWING: Dit verwijdert alle data!

# Drop views
psql "$DATABASE_URL" -c "DROP VIEW IF EXISTS ihw.v_dossier_summary CASCADE;"
psql "$DATABASE_URL" -c "DROP VIEW IF EXISTS ihw.v_agenda_overzicht CASCADE;"
# ... alle views

# Drop functions and triggers
psql "$DATABASE_URL" -c "DROP FUNCTION IF EXISTS ihw.trg_dossier_lock() CASCADE;"
# ... alle functions

# Drop tables (CASCADE verwijdert ook FK's)
psql "$DATABASE_URL" -c "DROP TABLE IF EXISTS ihw.audit_log CASCADE;"
psql "$DATABASE_URL" -c "DROP TABLE IF EXISTS ihw.tijdslot CASCADE;"
# ... alle tables in omgekeerde volgorde van creatie

# Drop schema
psql "$DATABASE_URL" -c "DROP SCHEMA IF EXISTS ihw CASCADE;"

echo "✅ Rollback complete"
```

---

## ✅ Verificatie

### 1. Schema Check

```sql
-- Check schema exists
SELECT schema_name 
FROM information_schema.schemata 
WHERE schema_name = 'ihw';

-- Expected: ihw
```

### 2. Tables Check

```sql
-- Count tables
SELECT COUNT(*) as table_count
FROM information_schema.tables
WHERE table_schema = 'ihw';

-- Expected: ~17 tables
```

### 3. Seeds Check

```sql
-- Check ceremony types
SELECT code, naam, openstelling_weken 
FROM ihw.type_ceremonie 
ORDER BY volgorde;

-- Expected: 8 types (gratis, flash, budget, premium)

-- Check locations
SELECT COUNT(*) as location_count
FROM ihw.locatie;

-- Expected: 10 (expand to 400+ in production)

-- Check BABS
SELECT code, naam, status, beedigd_tot
FROM ihw.babs
WHERE actief = true;

-- Expected: 5 BABS
```

### 4. Time Slots Check

```sql
-- Check time slots generated
SELECT 
    l.naam as locatie,
    COUNT(*) as aantal_slots
FROM ihw.tijdslot ts
JOIN ihw.locatie l ON l.id = ts.locatie_id
GROUP BY l.naam
ORDER BY aantal_slots DESC;

-- Expected: Slots for next 2-6 weeks
```

### 5. Trigger Test

```sql
-- Test: Tijdslot overlap prevention
BEGIN;

-- Insert first slot
INSERT INTO ihw.tijdslot (locatie_id, datum, start_tijd, eind_tijd)
SELECT id, CURRENT_DATE + 30, '14:00', '16:00'
FROM ihw.locatie LIMIT 1;

-- Try overlapping slot (should FAIL)
INSERT INTO ihw.tijdslot (locatie_id, datum, start_tijd, eind_tijd)
SELECT id, CURRENT_DATE + 30, '15:00', '17:00'
FROM ihw.locatie LIMIT 1;

-- Expected: ERROR: conflicting key value violates exclusion constraint

ROLLBACK;
```

### 6. View Test

```sql
-- Test statistics view
SELECT * FROM ihw.v_statistics;

-- Expected: Row with counts (all zeros initially)
```

---

## 🔗 Drizzle ORM Integratie

### Schema Sync

Update Drizzle schema om ihw schema te gebruiken:

```typescript
// src/db/schema-ihw.ts
import { pgSchema, uuid, timestamp, text, boolean, integer } from 'drizzle-orm/pg-core';

// ihw schema
export const ihw = pgSchema('ihw');

// Example: dossier table
export const dossierTable = ihw.table('dossier', {
  id: uuid('id').primaryKey().defaultRandom(),
  status: text('status').notNull().default('draft'),
  createdBy: text('created_by').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  // ... more fields
});

// Query example
import { db } from './index';
import { dossierTable } from './schema-ihw';

const dossiers = await db.select().from(dossierTable).where(eq(dossierTable.status, 'draft'));
```

### Migration from Drizzle

```bash
# Generate migration from current schema
npx drizzle-kit generate

# Push to Neon
npx drizzle-kit push
```

---

## 🛠️ Beheer

### Neon Console

**Monitoring**:
- Dashboard → **Metrics**: CPU, Memory, Storage
- **Query Performance**: Slow query log
- **Branches**: Overzicht van database branches

**Backups**:
- Neon maakt automatisch backups
- Point-in-time restore: tot 7 dagen terug (Pro plan)
- Branch van backup maken voor restore

### Useful Queries

**Dossier Status Overview**:
```sql
SELECT status, COUNT(*) as aantal
FROM ihw.dossier
GROUP BY status
ORDER BY status;
```

**Upcoming Ceremonies**:
```sql
SELECT * FROM ihw.v_aanstaande_ceremonies
LIMIT 20;
```

**BABS Workload**:
```sql
SELECT * FROM ihw.v_babs_beschikbaarheid
WHERE ceremony_date >= CURRENT_DATE
ORDER BY babs_naam, ceremony_date;
```

**Action Required**:
```sql
SELECT * FROM ihw.v_dossiers_met_actie_vereist
WHERE prioriteit = 'Hoog'
ORDER BY ceremony_date;
```

### Maintenance

**Vacuum & Analyze** (Neon doet dit automatisch, maar kan handmatig):

```sql
VACUUM ANALYZE ihw.dossier;
VACUUM ANALYZE ihw.ceremonie;
VACUUM ANALYZE ihw.tijdslot;
```

**Index Health Check**:

```sql
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_scan as index_scans
FROM pg_stat_user_indexes
WHERE schemaname = 'ihw'
ORDER BY idx_scan DESC;
```

---

## 🚨 Troubleshooting

### Connection Issues

**Error**: `could not connect to server`

**Solutions**:
1. Check DATABASE_URL is correct
2. Verify `sslmode=require` is in connection string
3. Check Neon project is not suspended (free tier sleeps after inactivity)
4. Wake project: `psql "$DATABASE_URL" -c "SELECT 1;"`

### Permission Errors

**Error**: `permission denied for schema ihw`

**Solution**:
```sql
-- Grant permissions
GRANT USAGE ON SCHEMA ihw TO app_rw;
GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA ihw TO app_rw;
```

### Trigger Errors

**Error**: `Cannot change type_ceremonie_id after dossier is locked`

**Expected**: Dit is een showstopper - type ceremonie mag niet gewijzigd worden na lock.

**Solution**: Unlock dossier eerst (alleen hb_admin):
```sql
UPDATE ihw.dossier 
SET status = 'in_review', locked_at = NULL
WHERE id = '<dossier_id>' 
  AND pg_has_role(current_user, 'hb_admin', 'MEMBER');
```

### Slow Queries

Check met:

```sql
-- Enable pg_stat_statements
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

-- View slow queries
SELECT 
    calls,
    total_exec_time::numeric(10,2) as total_time_ms,
    mean_exec_time::numeric(10,2) as avg_time_ms,
    query
FROM pg_stat_statements
WHERE query NOT LIKE '%pg_stat_statements%'
ORDER BY total_exec_time DESC
LIMIT 10;
```

---

## 📚 Resources

### Documentation
- **Neon Docs**: https://neon.tech/docs
- **PostgreSQL 15**: https://www.postgresql.org/docs/15/
- **Drizzle ORM**: https://orm.drizzle.team

### Support
- **Neon Support**: https://neon.tech/docs/introduction/support
- **Neon Discord**: https://discord.gg/neon

### Files in this Directory

| File | Description |
|------|-------------|
| `000_schema.sql` | Schema, extensions, roles |
| `010_enums_lookups.sql` | Enums en lookup tables |
| `020_core_tables.sql` | Hoofd tabellen (dossier, partner, etc.) |
| `030_payment_communication.sql` | Payment, BRP, communicatie |
| `040_triggers_functions.sql` | Business rules, triggers |
| `050_views.sql` | Reporting views |
| `060_seeds.sql` | Initiele configuratie data |
| `deploy.sh` | Deploy script |
| `README.md` | This file |

---

## ✅ Acceptance Tests

Run deze tests na deployment:

```sql
-- Test 1: Seeds loaded
SELECT code, openstelling_weken FROM ihw.type_ceremonie;
-- Expected: 8 rows

-- Test 2: Tijdslot overlap rejected
-- (zie Verificatie sectie)

-- Test 3: Ready for payment validation
BEGIN;
INSERT INTO ihw.dossier (created_by) VALUES ('test_user') RETURNING id;
-- Save the id, then:
UPDATE ihw.dossier SET status = 'ready_for_payment' WHERE id = '<id>';
-- Expected: ERROR (blocks not complete)
ROLLBACK;

-- Test 4: Wijziging na deadline blocked
-- (requires dossier with wijzigbaar_tot in past)

-- Test 5: BABS timing validation
-- (requires ceremony with BABS < 4 months before)

-- Test 6: Aankondiging showstopper
BEGIN;
INSERT INTO ihw.dossier (created_by) VALUES ('test_user') RETURNING id AS dossier_id \gset
INSERT INTO ihw.aankondiging (dossier_id, reeds_gehuwd) 
VALUES (:'dossier_id', true);
SELECT valid, invalid_reason FROM ihw.aankondiging WHERE dossier_id = :'dossier_id';
-- Expected: valid = false, invalid_reason contains 'reeds gehuwd'
ROLLBACK;
```

---

**Database Version**: 1.0  
**Last Updated**: 2025-12-26  
**Maintained By**: ihuwelijk Development Team

