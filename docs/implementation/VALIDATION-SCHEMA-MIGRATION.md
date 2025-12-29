# ✅ Validatie Tabellen Verplaatst naar IHW Schema

## 🎯 Probleem

De validatie tabellen stonden in het `public` schema, terwijl alle andere applicatie tabellen in het `ihw` schema staan. Dit was inconsistent en niet logisch georganiseerd.

## ✅ Oplossing

Alle validatie tabellen zijn verplaatst naar het `ihw` schema voor consistentie.

## 📝 Wijzigingen

### 1. SQL Bestanden Bijgewerkt

**`sql/070_validation_rules.sql`:**
```sql
-- ✅ NU: ihw schema
CREATE TABLE ihw.validatie_regel (...)
CREATE TABLE ihw.validatie_log (...)
CREATE FUNCTION ihw.update_validatie_regel_timestamp() ...

-- ❌ VOORHEEN: public schema
CREATE TABLE validatie_regel (...)
```

**`sql/080_validation_seeds.sql`:**
```sql
-- ✅ NU: ihw schema
INSERT INTO ihw.validatie_regel (...) VALUES (...)

-- ❌ VOORHEEN: public schema
INSERT INTO validatie_regel (...) VALUES (...)
```

### 2. Scripts Bijgewerkt

Alle referenties naar validatie tabellen zijn bijgewerkt:

- ✅ `scripts/deploy-validation.js`
- ✅ `scripts/verify-validation.js`
- ✅ `sql/deploy.sh`
- ✅ `sql/deploy-validation.sh`

Alle queries gebruiken nu `ihw.validatie_regel` en `ihw.validatie_log`.

### 3. Database Cleanup

Oude tabellen uit public schema verwijderd:
```sql
DROP TABLE IF EXISTS public.validatie_log CASCADE;
DROP TABLE IF EXISTS public.validatie_regel CASCADE;
DROP FUNCTION IF EXISTS public.update_validatie_regel_timestamp() CASCADE;
```

## 🗄️ Huidige Database Status

### IHW Schema Tabellen

```
ihw.
├── validatie_regel        (24 actieve regels)
├── validatie_log          (audit trail)
├── dossier
├── partner
├── kind
├── ceremonie
├── getuige
├── ambtenaar
├── locatie
└── ... (alle andere tabellen)
```

**Consistentie:** ✅ Alle applicatie tabellen nu in `ihw` schema!

## 📊 Verificatie

Na deployment:

```bash
# Verifieer tabellen in ihw schema
SELECT COUNT(*) FROM ihw.validatie_regel;
# Resultaat: 24

# Check public schema (moet leeg zijn)
SELECT COUNT(*) FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename LIKE 'validatie%';
# Resultaat: 0
```

## 🚀 Deployment Uitgevoerd

```bash
node scripts/deploy-validation.js
# ✅ Schema deployed to ihw
# ✅ 24 rules seeded
# ✅ Verification passed

node scripts/cleanup-old-validation.js
# ✅ Dropped public.validatie_log
# ✅ Dropped public.validatie_regel
# ✅ Dropped public.update_validatie_regel_timestamp()
```

## 🎯 Voordelen

### 1. Consistentie
- Alle applicatie tabellen in één schema (`ihw`)
- Logische organisatie
- Makkelijker te beheren

### 2. Beveiliging
- Schema-level permissions kunnen uniform toegepast worden
- Duidelijke scheiding tussen schemas

### 3. Backup & Restore
- Eenvoudiger om alleen applicatie data te backup/restore
- `pg_dump --schema=ihw` bevat alles

### 4. Queries
- Consistente query patterns
- Geen verwarring over welke tabellen in welk schema staan

### 5. Documentatie
- Duidelijker voor developers
- Schema structuur is logisch

## 📚 Schema Organisatie

### IHW Schema (`ihw`)
**Doel:** Alle applicatie-specifieke tabellen

**Bevat:**
- Core business tables (dossier, partner, kind, etc.)
- Lookup tables (type_ceremonie, locatie, etc.)
- **Validation tables** (validatie_regel, validatie_log) ← NU TOEGEVOEGD
- Configuration tables (gemeente, etc.)

### Public Schema (`public`)
**Doel:** PostgreSQL defaults en extensies

**Bevat:**
- PostgreSQL system tables
- Extensions (indien gebruikt)
- Geen applicatie tabellen meer

## 🔍 Code Impact

### Geen Breaking Changes!

De TypeScript code verwijst niet rechtstreeks naar schemas:
```typescript
// ✅ Werkt nog steeds - Drizzle ORM abstraheert schema details
import { validatieRegel } from '@/db/schema';
```

### Toekomstige Queries

Als je direct SQL schrijft, gebruik nu:
```typescript
// ✅ CORRECT
await client.query('SELECT * FROM ihw.validatie_regel WHERE actief = true');

// ❌ FOUT (bestaat niet meer)
await client.query('SELECT * FROM validatie_regel WHERE actief = true');
// Zonder schema prefix zoekt PostgreSQL eerst in search_path (meestal public)
```

## ✅ Checklist

- [x] SQL schema files bijgewerkt naar `ihw` schema
- [x] Seed files bijgewerkt naar `ihw` schema
- [x] Deployment scripts bijgewerkt
- [x] Verification scripts bijgewerkt
- [x] Tabellen gedeployed in `ihw` schema
- [x] Oude `public` tabellen opgeruimd
- [x] Verificatie uitgevoerd (24 regels actief)
- [x] Documentatie bijgewerkt

## 🎉 Resultaat

**Perfect! Alle validatie tabellen staan nu consistent in het `ihw` schema.**

### Database Structuur

```sql
-- ✅ Correct georganiseerd
\dt ihw.*

List of relations
Schema | Name              | Type  | Owner
-------|-------------------|-------|-------
ihw    | validatie_regel   | table | ...
ihw    | validatie_log     | table | ...
ihw    | dossier           | table | ...
ihw    | partner           | table | ...
... (alle andere tabellen)
```

De applicatie is nu **beter georganiseerd** en **consistenter** opgezet! 🚀

