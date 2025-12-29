
# ihuwelijk Database - Complete Overview

**Versie**: 1.0  
**Datum**: 26 december 2025  
**Database**: PostgreSQL 15+ (Neon Serverless)  
**Schema**: `ihw`

---

## 📋 Executive Summary

Complete Postgres database voor het **digitale huwelijksproces** van Gemeente Amsterdam, gebouwd conform functionele eisen en optimaal geschikt voor **Neon Serverless Postgres**.

### Kernfunctionaliteiten

✅ **Dossier Management** - Volledig digitaal huwelijksdossier met 5 blokken  
✅ **Aankondiging & Validatie** - Automatische showstoppers (reeds gehuwd, puntouders)  
✅ **Ceremonie Planning** - Agenda met locaties (400+), BABS-indeling, tijdslots  
✅ **Getuigen Beheer** - 2-4 getuigen per huwelijk (burger/gemeentelijk)  
✅ **Document Management** - Upload en goedkeuring brondocumenten  
✅ **Betaling** - Via worldonline provider, inclusief terugbetalingen  
✅ **BRP Integratie** - Automatische export naar iBurgerzaken  
✅ **Communicatie** - Veilige berichten burger ↔ medewerker  
✅ **Audit Logging** - Volledige traceerbaarheid  

### Business Rules (Triggers)

🔒 **Type ceremonie niet wijzigbaar na lock**  
🔒 **Wijzigingen verboden na deadline** (behalve hb_admin)  
🔒 **Eigen BABS minimaal 4 maanden vooraf beëdigd**  
🔒 **Aankondiging showstoppers** (reeds gehuwd, puntouders, niet woonachtig)  
🔒 **Betaling verplicht voor lock**  
🔒 **Alle blokken compleet voor ready_for_payment**  
🔒 **Tijdslot overlap prevention** (EXCLUDE constraint)  

---

## 🗂️ Database Structuur

### Schema Overzicht

```
ihw/                              # ihuwelijk schema
│
├── 📄 Core Tables
│   ├── dossier                   # Hoofd huwelijksdossier
│   ├── dossier_block             # Voortgang tracking (5 blokken)
│   ├── partner                   # Partners (2 per dossier)
│   ├── aankondiging              # Huwelijksaankondiging + validatie
│   ├── ceremonie                 # Datum, tijd, locatie, BABS
│   ├── getuige                   # Getuigen (2-4)
│   ├── papier                    # Brondocumenten
│   └── upload                    # File uploads
│
├── 💰 Payment & Integration
│   ├── payment                   # Betalingen (worldonline)
│   ├── refund                    # Terugbetalingen
│   ├── brp_export                # BRP/iBurgerzaken export
│   └── communication             # Veilige berichten
│
├── 📅 Agenda & Resources
│   ├── tijdslot                  # Beschikbare tijdslots
│   ├── locatie                   # Trouwlocaties (400+)
│   ├── babs                      # BABS medewerkers
│   └── type_ceremonie            # Ceremonie types
│
├── 📊 Reporting Views
│   ├── v_dossier_summary         # Complete dossier overzicht
│   ├── v_agenda_overzicht        # Agenda met bezetting
│   ├── v_babs_beschikbaarheid    # BABS planning
│   ├── v_dossiers_met_actie_vereist  # Actie dashboard
│   ├── v_aanstaande_ceremonies   # Komende ceremonies
│   └── v_statistics              # KPI dashboard
│
└── 🔐 Security
    ├── audit_log                 # Audit trail
    └── Roles: loket_readonly, hb_admin, app_rw
```

### Datamodel Statistieken

| Category | Count | Details |
|----------|-------|---------|
| **Tables** | 17 | Core, support, lookup |
| **Views** | 6 | Reporting, management |
| **Enums** | 9 | Status types, categories |
| **Triggers** | 15+ | Business rules |
| **Indexes** | 50+ | Performance optimization |
| **Roles** | 3 | Security layers |

---

## 📦 Deliverables

### SQL Files

| File | Lines | Purpose |
|------|-------|---------|
| `000_schema.sql` | ~150 | Schema, extensions, roles |
| `010_enums_lookups.sql` | ~250 | Enums, lookup tables |
| `020_core_tables.sql` | ~400 | Main tables (dossier, partner, etc.) |
| `030_payment_communication.sql` | ~350 | Payment, BRP, communication |
| `040_triggers_functions.sql` | ~550 | Business logic triggers |
| `050_views.sql` | ~400 | Reporting views |
| `060_seeds.sql` | ~300 | Configuration data |
| `070_legacy_mapping.sql` | ~250 | Legacy compatibility |
| **Total** | **~2,400 lines** | Complete database |

### Documentation

- ✅ **README.md** - Complete deployment guide (Neon focus)
- ✅ **DATABASE-OVERVIEW.md** - This document
- ✅ **deploy.sh** - Automated deployment script
- ✅ **Inline comments** - Extensive COMMENT ON statements
- ✅ **Acceptance tests** - SQL verification queries

---

## 🔑 Key Design Decisions

### 1. UUID Primary Keys

**Rationale**: Neon serverless, branch-based development
- ✅ No sequence conflicts across branches
- ✅ Distributed system friendly
- ✅ Merge-safe (geen ID collision)
- ✅ Veilig in URLs

```sql
id uuid PRIMARY KEY DEFAULT gen_random_uuid()
```

### 2. Timestamptz Everywhere

**Rationale**: Multi-timezone support, accurate timestamps
- ✅ UTC storage, local display
- ✅ Daylight saving time aware
- ✅ International compatibility

```sql
created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP
```

### 3. Enum Types vs Lookup Tables

**Enums**: Voor stabiele, code-level constants
- `dossier_status`: draft, in_review, ready_for_payment, locked, cancelled
- `payment_status`: pending, paid, failed, refunded, waived
- `babs_status`: beedigd, in_aanvraag, ongeldig

**Lookup Tables**: Voor configureerbare referentiedata
- `type_ceremonie`: gratis, flash, budget, premium (configurabel)
- `locatie`: 400+ trouwlocaties (veranderlijk)
- `babs`: BABS medewerkers (dynamisch)

### 4. JSONB voor Flexibiliteit

**Use cases**:
- `ceremonie.wensen`: Extra wensen (uitbreidbaar zonder schema change)
- `locatie.adres`: Structured address data
- `payment.metadata`: Provider-specifieke velden
- `audit_log.old_values / new_values`: Change tracking

```sql
wensen jsonb DEFAULT '{}'::jsonb
```

### 5. Block-Based Completion

**Rationale**: Modulaire voortgang tracking

5 verplichte blokken:
1. **Aankondiging** - BRP checks, showstoppers
2. **Ceremonie** - Datum, locatie, BABS
3. **Getuigen** - 2-4 personen
4. **Papieren** - Brondocumenten
5. **Betaling** - Payment status

```sql
CREATE TABLE dossier_block (
    dossier_id uuid,
    code block_code,
    complete boolean DEFAULT false,
    required boolean DEFAULT true
);
```

### 6. Trigger-Based Business Rules

**Voordelen**:
- ✅ Data integrity at database level
- ✅ Cannot be bypassed by application
- ✅ Consistent across all clients
- ✅ Centralized business logic

**Triggers**:
- `trg_dossier_lock_type_ceremonie` - Prevent type change after lock
- `trg_ceremonie_wijziging_deadline` - Deadline enforcement
- `trg_aankondiging_validate` - Showstopper detection
- `trg_ceremonie_babs_validate` - BABS timing validation
- `trg_block_complete_validate` - Block completion checks

### 7. EXCLUDE Constraint voor Tijdslots

**Rationale**: Voorkomen van overlappende reserveringen

```sql
CONSTRAINT excl_tijdslot_overlap EXCLUDE USING gist (
    locatie_id WITH =,
    tstzrange(
        (datum + start_tijd)::timestamptz,
        (datum + eind_tijd)::timestamptz
    ) WITH &&
)
```

Garantie: Geen twee ceremonies op dezelfde locatie, overlappende tijd.

---

## 🎯 Business Rules Implementation

### Ceremonie Type Configuratie

**Per type instelbaar**:
- `openstelling_weken`: 2 (gratis) vs 6 (premium)
- `lead_time_days`: Min. dagen vooraf
- `wijzigbaar_tot_days`: Tot wanneer burger mag wijzigen
- `max_getuigen`: 4 (standaard), instelbaar
- `eigen_babs_toegestaan`: true/false

**Type voorbeelden** (seeds):
```
gratis_stadhuis        → 2 weken, gratis
flash_15min            → 6 weken, budget
premium_eigen_babs     → 6 weken, eigen BABS OK
premium_buitenlocatie  → 6 weken, speciale locaties
```

### Aankondiging Showstoppers

**Automatische validatie** (trigger):

❌ **Reeds gehuwd**: Een of beide partners zijn al gehuwd  
❌ **Beiden niet woonachtig**: Geen BRP registratie in gemeente  
❌ **Puntouders**: Partner(s) met onbekende ouders  

```sql
IF reeds_gehuwd = true OR beiden_niet_woonachtig = true OR ouders_onbekend = true THEN
    aankondiging.valid = false
    -- Block kan niet compleet
END IF
```

### BABS Timing Validation

**Eigen BABS showstopper** (trigger):

✅ Status moet `beedigd` zijn  
✅ Aanvraag minimaal **4 maanden** voor ceremonie  
✅ Beëdiging nog geldig op ceremonie datum  

```sql
min_aanvraag_datum := ceremonie.datum - INTERVAL '4 months';
IF babs.aanvraag_datum > min_aanvraag_datum THEN
    RAISE EXCEPTION 'BABS aanvraag te laat'
END IF
```

### Wijzigbaar Tot Deadline

**Burger**: Kan tot `wijzigbaar_tot` wijzigen  
**hb_admin**: Kan altijd wijzigen  

Berekening:
```sql
wijzigbaar_tot := ceremonie.datum - (type_ceremonie.wijzigbaar_tot_days || ' days')::interval
```

Default: 7 dagen voor ceremonie.

### Payment Before Lock

**Vereisten voor lock**:
1. Alle required blocks `complete = true`
2. Payment status `IN ('paid', 'waived')`
3. Dossier status `ready_for_payment`

```sql
IF status = 'locked' THEN
    -- Check payment exists
    -- Check all blocks complete
    -- Set locked_at timestamp
END IF
```

---

## 📊 Reporting & Analytics

### View: v_dossier_summary

**Complete dossier overzicht** - alle key info:
- Dossier status, timestamps
- Partners (namen)
- Ceremonie (datum, locatie, BABS)
- Block completion (incomplete/completed count)
- Payment status
- BRP export status
- Aankondiging validiteit

**Use case**: Dashboard, dossier detailpagina

### View: v_agenda_overzicht

**Agenda planning** - per locatie, datum, tijd:
- Locatie details
- Tijdslot beschikbaarheid (Beschikbaar/Gereserveerd/Geblokkeerd)
- Dossier info (als gereserveerd)
- BABS indeling
- Ceremonie type

**Use case**: Agenda beheer, BABS planning

### View: v_dossiers_met_actie_vereist

**Action dashboard** - dossiers die aandacht nodig hebben:
- Oud concept (>30 dagen)
- In review (wacht op medewerker)
- Ready for payment (wacht op betaling)
- Ceremonie binnen 2 weken
- Aankondiging ongeldig
- Afgekeurde documenten

Met **prioriteit**: Hoog/Middel/Laag

**Use case**: Medewerker werklijst

### View: v_statistics

**KPI Dashboard**:
- Dossiers per status (counts)
- Dossiers deze maand
- Ceremonies deze maand
- Gemiddelde doorlooptijd (draft → locked)
- Totaal ontvangen (€)
- Openstaande betalingen

**Use case**: Management reporting

---

## 🔐 Security & Permissions

### Roles

**loket_readonly**:
- SELECT only
- Voor loketmedewerkers (raadplegen)

**app_rw**:
- SELECT, INSERT, UPDATE
- Voor applicatie (geen DELETE)

**hb_admin**:
- ALL privileges
- Voor huwelijksbureau beheerders
- Kan voorbij deadlines wijzigen

### Row Level Security (RLS)

**Optioneel** - voor multi-tenant of privacy:

```sql
-- Example (not implemented in base schema)
ALTER TABLE ihw.dossier ENABLE ROW LEVEL SECURITY;

CREATE POLICY dossier_created_by_policy ON ihw.dossier
    FOR ALL
    USING (created_by = current_user OR pg_has_role('hb_admin', 'MEMBER'));
```

### Audit Logging

**Alle belangrijke acties**:
- Dossier creation, status changes
- Ceremony modifications
- Payment transactions
- Block completions
- Document approvals

```sql
INSERT INTO ihw.audit_log (action, table_name, record_id, actor_id, old_values, new_values)
VALUES ('UPDATE', 'dossier', dossier_id, current_user, old_json, new_json);
```

---

## 🚀 Deployment

### Neon-Specific Features

**Branches** - Database branches voor development:
```bash
neon branches create --name dev
neon branches create --name staging
```

**Pooling** - Connection pooling voor production:
```
host-pooler.neon.tech  # Gebruik dit voor app
```

**Auto-scaling** - Serverless compute:
- Min 0.25 vCPU (tijdens inactiviteit)
- Max 4 vCPU (onder load)
- Automatisch suspend na inactiviteit

**Backups** - Point-in-time restore:
- 7 dagen history (Pro plan)
- Branch van backup maken

### Deployment Steps

**1. Quick Deploy**:
```bash
export DATABASE_URL="postgresql://..."
./sql/deploy.sh
```

**2. Manual Deploy**:
```bash
psql "$DATABASE_URL" -f sql/000_schema.sql
psql "$DATABASE_URL" -f sql/010_enums_lookups.sql
# ... etc
```

**3. Verification**:
```bash
psql "$DATABASE_URL" -c "SELECT * FROM ihw.v_statistics;"
```

---

## 📈 Performance Optimization

### Indexing Strategy

**B-tree indexes**:
- All foreign keys
- Status columns (with WHERE clause for specific values)
- Date/timestamp columns
- Created_by / user tracking

**GIN indexes**:
- JSONB columns (`ceremonie.wensen`)

**GiST indexes**:
- EXCLUDE constraint (tijdslot overlap)

**Partial indexes**:
```sql
CREATE INDEX idx_payment_pending 
ON ihw.payment(status) 
WHERE status = 'pending';
```

Only indexes rows WHERE condition is true → smaller, faster.

### Query Optimization

**Views zijn niet materialized** - real-time data:
- Voor cached results: `CREATE MATERIALIZED VIEW`
- Refresh: `REFRESH MATERIALIZED VIEW v_name;`

**N+1 prevention**: Views use JOINs
- Eén query voor complete overzicht
- Geen iteratieve queries nodig

### Neon-Specific Optimizations

**Autoscaling**: Database schaalt automatisch
- Geen manual tuning nodig
- Compute past aan bij load

**Connection pooling**: Gebruik pooler URL
- More concurrent connections
- Better performance

**Storage**: Auto-expanding
- Geen disk space management
- Pay per GB used

---

## 🧪 Testing & Validation

### Acceptance Tests (SQL)

**Test 1**: Seeds loaded
```sql
SELECT code, openstelling_weken FROM ihw.type_ceremonie;
-- Expected: 8 rows
```

**Test 2**: Tijdslot overlap rejected
```sql
-- Insert two overlapping slots → should FAIL
```

**Test 3**: Ready for payment validation
```sql
-- Try to set ready_for_payment without complete blocks → should FAIL
```

**Test 4**: Wijziging na deadline blocked
```sql
-- Modify ceremony after wijzigbaar_tot → should FAIL (unless hb_admin)
```

**Test 5**: BABS timing validation
```sql
-- BABS aanvraag < 4 maanden before ceremony → should FAIL
```

**Test 6**: Aankondiging showstopper
```sql
INSERT INTO aankondiging (dossier_id, reeds_gehuwd) VALUES (..., true);
SELECT valid, invalid_reason FROM aankondiging;
-- Expected: valid = false
```

### Data Quality Checks

```sql
-- Orphaned records
SELECT COUNT(*) FROM ihw.partner WHERE dossier_id NOT IN (SELECT id FROM ihw.dossier);
-- Expected: 0

-- Invalid dates
SELECT COUNT(*) FROM ihw.ceremonie WHERE datum < CURRENT_DATE AND dossier_id IN (
    SELECT id FROM ihw.dossier WHERE status = 'draft'
);
-- Expected: 0 or low

-- Missing blocks
SELECT dossier_id, COUNT(*) as block_count
FROM ihw.dossier_block
GROUP BY dossier_id
HAVING COUNT(*) != 5;
-- Expected: 0 (all dossiers should have 5 blocks)
```

---

---

## 📚 Additional Resources

### Documentation Files

- `sql/README.md` - Complete deployment guide
- `DATABASE-OVERVIEW.md` - This document
- `sql/*.sql` - Inline comments (COMMENT ON)

### Useful Queries

**Upcoming ceremonies**:
```sql
SELECT * FROM ihw.v_aanstaande_ceremonies LIMIT 10;
```

**Dossiers needing action**:
```sql
SELECT * FROM ihw.v_dossiers_met_actie_vereist WHERE prioriteit = 'Hoog';
```

**BABS workload**:
```sql
SELECT * FROM ihw.v_babs_beschikbaarheid WHERE days_until_ceremony <= 14;
```

**Statistics dashboard**:
```sql
SELECT * FROM ihw.v_statistics;
```

### Neon Resources

- **Documentation**: https://neon.tech/docs
- **Console**: https://console.neon.tech
- **Support**: https://neon.tech/docs/introduction/support
- **Discord**: https://discord.gg/neon

---

## ✅ Completion Checklist

- [x] Schema design (ihw + zk)
- [x] Core tables (17 tables)
- [x] Enums and lookup tables (9 enums, 3 lookups)
- [x] Business logic triggers (15+ triggers)
- [x] Reporting views (6 views)
- [x] Seed data (8 types, 10 locations, 5 BABS)
- [x] Legacy mapping layer (compatibility functions)
- [x] Complete README (Neon focus)
- [x] Deployment script (deploy.sh)
- [x] Acceptance tests (6 tests)
- [x] Documentation (inline comments, COMMENT ON)
- [x] Performance optimization (50+ indexes)
- [x] Security (roles, permissions, audit logging)

---

## 📞 Support

Voor vragen over dit database design:
1. Raadpleeg `sql/README.md` voor deployment
2. Check inline comments in SQL files
3. Test met acceptance tests
4. Verify met views (`v_*`)

**Database Version**: 1.0  
**Generated**: 26 december 2025  
**Compatible**: PostgreSQL 15+, Neon Serverless  
**Schema**: ihw (production), zk (legacy)

---

**Status**: ✅ Complete - Ready for deployment to Neon Postgres

