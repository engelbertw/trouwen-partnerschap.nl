-- =====================================================
-- Multi-Tenancy Migration: Add gemeente_oin to ALL Tables
-- File: sql/016_add_gemeente_oin_to_tables.sql
-- =====================================================

\echo '🔒 Adding gemeente_oin to all tables for data isolation...'

-- =====================================================
-- TABLE: dossier
-- =====================================================
\echo '  → dossier'

ALTER TABLE ihw.dossier 
  ADD COLUMN IF NOT EXISTS gemeente_oin text;

-- Set default gemeente (Amsterdam) for existing records
UPDATE ihw.dossier 
  SET gemeente_oin = '00000001002564440000'
  WHERE gemeente_oin IS NULL;

ALTER TABLE ihw.dossier 
  ALTER COLUMN gemeente_oin SET NOT NULL;

ALTER TABLE ihw.dossier
  ADD CONSTRAINT fk_dossier_gemeente 
  FOREIGN KEY (gemeente_oin) REFERENCES ihw.gemeente(oin);

CREATE INDEX IF NOT EXISTS idx_dossier_gemeente_oin ON ihw.dossier(gemeente_oin);

COMMENT ON COLUMN ihw.dossier.gemeente_oin IS 
  'OIN van de gemeente die dit dossier beheert. Kan niet gewijzigd worden na creatie.';

-- =====================================================
-- TABLE: partner
-- =====================================================
\echo '  → partner'

ALTER TABLE ihw.partner 
  ADD COLUMN IF NOT EXISTS gemeente_oin text;

-- Inherit gemeente from dossier
UPDATE ihw.partner p
  SET gemeente_oin = (
    SELECT d.gemeente_oin 
    FROM ihw.dossier d 
    WHERE d.id = p.dossier_id
  )
  WHERE p.gemeente_oin IS NULL;

ALTER TABLE ihw.partner 
  ALTER COLUMN gemeente_oin SET NOT NULL;

ALTER TABLE ihw.partner
  ADD CONSTRAINT fk_partner_gemeente 
  FOREIGN KEY (gemeente_oin) REFERENCES ihw.gemeente(oin);

CREATE INDEX IF NOT EXISTS idx_partner_gemeente_oin ON ihw.partner(gemeente_oin);

-- =====================================================
-- TABLE: ceremonie
-- =====================================================
\echo '  → ceremonie'

ALTER TABLE ihw.ceremonie 
  ADD COLUMN IF NOT EXISTS gemeente_oin text;

UPDATE ihw.ceremonie c
  SET gemeente_oin = (
    SELECT d.gemeente_oin 
    FROM ihw.dossier d 
    WHERE d.id = c.dossier_id
  )
  WHERE c.gemeente_oin IS NULL;

ALTER TABLE ihw.ceremonie 
  ALTER COLUMN gemeente_oin SET NOT NULL;

ALTER TABLE ihw.ceremonie
  ADD CONSTRAINT fk_ceremonie_gemeente 
  FOREIGN KEY (gemeente_oin) REFERENCES ihw.gemeente(oin);

CREATE INDEX IF NOT EXISTS idx_ceremonie_gemeente_oin ON ihw.ceremonie(gemeente_oin);

-- =====================================================
-- TABLE: aankondiging
-- =====================================================
\echo '  → aankondiging'

ALTER TABLE ihw.aankondiging 
  ADD COLUMN IF NOT EXISTS gemeente_oin text;

UPDATE ihw.aankondiging a
  SET gemeente_oin = (
    SELECT d.gemeente_oin 
    FROM ihw.dossier d 
    WHERE d.id = a.dossier_id
  )
  WHERE a.gemeente_oin IS NULL;

ALTER TABLE ihw.aankondiging 
  ALTER COLUMN gemeente_oin SET NOT NULL;

ALTER TABLE ihw.aankondiging
  ADD CONSTRAINT fk_aankondiging_gemeente 
  FOREIGN KEY (gemeente_oin) REFERENCES ihw.gemeente(oin);

CREATE INDEX IF NOT EXISTS idx_aankondiging_gemeente_oin ON ihw.aankondiging(gemeente_oin);

-- =====================================================
-- TABLE: getuige
-- =====================================================
\echo '  → getuige'

ALTER TABLE ihw.getuige 
  ADD COLUMN IF NOT EXISTS gemeente_oin text;

UPDATE ihw.getuige g
  SET gemeente_oin = (
    SELECT d.gemeente_oin 
    FROM ihw.dossier d 
    WHERE d.id = g.dossier_id
  )
  WHERE g.gemeente_oin IS NULL;

ALTER TABLE ihw.getuige 
  ALTER COLUMN gemeente_oin SET NOT NULL;

ALTER TABLE ihw.getuige
  ADD CONSTRAINT fk_getuige_gemeente 
  FOREIGN KEY (gemeente_oin) REFERENCES ihw.gemeente(oin);

CREATE INDEX IF NOT EXISTS idx_getuige_gemeente_oin ON ihw.getuige(gemeente_oin);

-- =====================================================
-- TABLE: papier
-- =====================================================
\echo '  → papier'

ALTER TABLE ihw.papier 
  ADD COLUMN IF NOT EXISTS gemeente_oin text;

UPDATE ihw.papier p
  SET gemeente_oin = (
    SELECT d.gemeente_oin 
    FROM ihw.dossier d 
    WHERE d.id = p.dossier_id
  )
  WHERE p.gemeente_oin IS NULL;

ALTER TABLE ihw.papier 
  ALTER COLUMN gemeente_oin SET NOT NULL;

ALTER TABLE ihw.papier
  ADD CONSTRAINT fk_papier_gemeente 
  FOREIGN KEY (gemeente_oin) REFERENCES ihw.gemeente(oin);

CREATE INDEX IF NOT EXISTS idx_papier_gemeente_oin ON ihw.papier(gemeente_oin);

-- =====================================================
-- TABLE: upload
-- =====================================================
\echo '  → upload'

ALTER TABLE ihw.upload 
  ADD COLUMN IF NOT EXISTS gemeente_oin text;

UPDATE ihw.upload u
  SET gemeente_oin = (
    SELECT d.gemeente_oin 
    FROM ihw.dossier d 
    WHERE d.id = u.dossier_id
  )
  WHERE u.gemeente_oin IS NULL;

ALTER TABLE ihw.upload 
  ALTER COLUMN gemeente_oin SET NOT NULL;

ALTER TABLE ihw.upload
  ADD CONSTRAINT fk_upload_gemeente 
  FOREIGN KEY (gemeente_oin) REFERENCES ihw.gemeente(oin);

CREATE INDEX IF NOT EXISTS idx_upload_gemeente_oin ON ihw.upload(gemeente_oin);

-- =====================================================
-- TABLE: payment
-- =====================================================
\echo '  → payment'

ALTER TABLE ihw.payment 
  ADD COLUMN IF NOT EXISTS gemeente_oin text;

UPDATE ihw.payment p
  SET gemeente_oin = (
    SELECT d.gemeente_oin 
    FROM ihw.dossier d 
    WHERE d.id = p.dossier_id
  )
  WHERE p.gemeente_oin IS NULL;

ALTER TABLE ihw.payment 
  ALTER COLUMN gemeente_oin SET NOT NULL;

ALTER TABLE ihw.payment
  ADD CONSTRAINT fk_payment_gemeente 
  FOREIGN KEY (gemeente_oin) REFERENCES ihw.gemeente(oin);

CREATE INDEX IF NOT EXISTS idx_payment_gemeente_oin ON ihw.payment(gemeente_oin);

-- =====================================================
-- TABLE: refund
-- =====================================================
\echo '  → refund'

ALTER TABLE ihw.refund 
  ADD COLUMN IF NOT EXISTS gemeente_oin text;

UPDATE ihw.refund r
  SET gemeente_oin = (
    SELECT p.gemeente_oin 
    FROM ihw.payment p 
    WHERE p.id = r.payment_id
  )
  WHERE r.gemeente_oin IS NULL;

ALTER TABLE ihw.refund 
  ALTER COLUMN gemeente_oin SET NOT NULL;

ALTER TABLE ihw.refund
  ADD CONSTRAINT fk_refund_gemeente 
  FOREIGN KEY (gemeente_oin) REFERENCES ihw.gemeente(oin);

CREATE INDEX IF NOT EXISTS idx_refund_gemeente_oin ON ihw.refund(gemeente_oin);

-- =====================================================
-- TABLE: brp_export
-- =====================================================
\echo '  → brp_export'

ALTER TABLE ihw.brp_export 
  ADD COLUMN IF NOT EXISTS gemeente_oin text;

UPDATE ihw.brp_export b
  SET gemeente_oin = (
    SELECT d.gemeente_oin 
    FROM ihw.dossier d 
    WHERE d.id = b.dossier_id
  )
  WHERE b.gemeente_oin IS NULL;

ALTER TABLE ihw.brp_export 
  ALTER COLUMN gemeente_oin SET NOT NULL;

ALTER TABLE ihw.brp_export
  ADD CONSTRAINT fk_brp_export_gemeente 
  FOREIGN KEY (gemeente_oin) REFERENCES ihw.gemeente(oin);

CREATE INDEX IF NOT EXISTS idx_brp_export_gemeente_oin ON ihw.brp_export(gemeente_oin);

-- =====================================================
-- TABLE: communication
-- =====================================================
\echo '  → communication'

ALTER TABLE ihw.communication 
  ADD COLUMN IF NOT EXISTS gemeente_oin text;

UPDATE ihw.communication c
  SET gemeente_oin = (
    SELECT d.gemeente_oin 
    FROM ihw.dossier d 
    WHERE d.id = c.dossier_id
  )
  WHERE c.gemeente_oin IS NULL;

ALTER TABLE ihw.communication 
  ALTER COLUMN gemeente_oin SET NOT NULL;

ALTER TABLE ihw.communication
  ADD CONSTRAINT fk_communication_gemeente 
  FOREIGN KEY (gemeente_oin) REFERENCES ihw.gemeente(oin);

CREATE INDEX IF NOT EXISTS idx_communication_gemeente_oin ON ihw.communication(gemeente_oin);

-- =====================================================
-- TABLE: dossier_block
-- =====================================================
\echo '  → dossier_block'

ALTER TABLE ihw.dossier_block 
  ADD COLUMN IF NOT EXISTS gemeente_oin text;

UPDATE ihw.dossier_block db
  SET gemeente_oin = (
    SELECT d.gemeente_oin 
    FROM ihw.dossier d 
    WHERE d.id = db.dossier_id
  )
  WHERE db.gemeente_oin IS NULL;

ALTER TABLE ihw.dossier_block 
  ALTER COLUMN gemeente_oin SET NOT NULL;

ALTER TABLE ihw.dossier_block
  ADD CONSTRAINT fk_dossier_block_gemeente 
  FOREIGN KEY (gemeente_oin) REFERENCES ihw.gemeente(oin);

CREATE INDEX IF NOT EXISTS idx_dossier_block_gemeente_oin ON ihw.dossier_block(gemeente_oin);

-- =====================================================
-- TABLE: audit_log
-- =====================================================
\echo '  → audit_log'

ALTER TABLE ihw.audit_log 
  ADD COLUMN IF NOT EXISTS gemeente_oin text;

-- For audit logs, default to Amsterdam for all existing records
UPDATE ihw.audit_log 
  SET gemeente_oin = '00000001002564440000'
  WHERE gemeente_oin IS NULL;

ALTER TABLE ihw.audit_log 
  ALTER COLUMN gemeente_oin SET NOT NULL;

ALTER TABLE ihw.audit_log
  ADD CONSTRAINT fk_audit_log_gemeente 
  FOREIGN KEY (gemeente_oin) REFERENCES ihw.gemeente(oin);

CREATE INDEX IF NOT EXISTS idx_audit_log_gemeente_oin ON ihw.audit_log(gemeente_oin);

-- =====================================================
-- CONFIG TABLES: Add gemeente_oin for gemeente-specific config
-- =====================================================

-- Tijdslot (gemeente-specific scheduling)
\echo '  → tijdslot'

ALTER TABLE ihw.tijdslot 
  ADD COLUMN IF NOT EXISTS gemeente_oin text;

UPDATE ihw.tijdslot 
  SET gemeente_oin = '00000001002564440000'
  WHERE gemeente_oin IS NULL;

ALTER TABLE ihw.tijdslot 
  ALTER COLUMN gemeente_oin SET NOT NULL;

ALTER TABLE ihw.tijdslot
  ADD CONSTRAINT fk_tijdslot_gemeente 
  FOREIGN KEY (gemeente_oin) REFERENCES ihw.gemeente(oin);

CREATE INDEX IF NOT EXISTS idx_tijdslot_gemeente_oin ON ihw.tijdslot(gemeente_oin);

COMMENT ON COLUMN ihw.tijdslot.gemeente_oin IS 
  'Tijdsloten zijn gemeente-specifiek. Elke gemeente beheert eigen agenda.';

\echo '✅ gemeente_oin added to all tables'

