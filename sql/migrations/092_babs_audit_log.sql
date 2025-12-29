-- =====================================================
-- BABS Audit Log
-- File: sql/migrations/092_babs_audit_log.sql
-- =====================================================

-- Create audit log table for BABS status changes
CREATE TABLE IF NOT EXISTS ihw.babs_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  babs_id uuid NOT NULL REFERENCES ihw.babs(id) ON DELETE CASCADE,
  
  -- Change tracking
  field_name text NOT NULL,  -- 'status', 'actief', etc.
  old_value text,
  new_value text,
  
  -- User tracking
  changed_by text NOT NULL,  -- User ID from Clerk
  changed_by_name text,      -- User friendly name
  changed_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  -- Context
  change_reason text,        -- Optional reason for change
  ip_address text,           -- For security audit
  
  CONSTRAINT chk_field_name CHECK (field_name IN (
    'status', 'actief', 'beedigdVanaf', 'beedigdTot', 
    'beschikbaarVanaf', 'beschikbaarTot', 'opmerkingBeschikbaarheid'
  ))
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_babs_audit_log_babs_id 
  ON ihw.babs_audit_log(babs_id);

CREATE INDEX IF NOT EXISTS idx_babs_audit_log_changed_at 
  ON ihw.babs_audit_log(changed_at DESC);

CREATE INDEX IF NOT EXISTS idx_babs_audit_log_field 
  ON ihw.babs_audit_log(field_name);

-- Comments
COMMENT ON TABLE ihw.babs_audit_log IS 
  'Audit trail voor BABS wijzigingen - wie heeft wat wanneer gewijzigd';

COMMENT ON COLUMN ihw.babs_audit_log.field_name IS 
  'Naam van het gewijzigde veld';

COMMENT ON COLUMN ihw.babs_audit_log.old_value IS 
  'Oude waarde (voor wijziging)';

COMMENT ON COLUMN ihw.babs_audit_log.new_value IS 
  'Nieuwe waarde (na wijziging)';

COMMENT ON COLUMN ihw.babs_audit_log.changed_by IS 
  'Clerk User ID van gebruiker die wijziging maakte';

COMMENT ON COLUMN ihw.babs_audit_log.changed_by_name IS 
  'Weergave naam van gebruiker (voor in UI)';

