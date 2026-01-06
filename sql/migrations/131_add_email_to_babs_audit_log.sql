-- =====================================================
-- Add email field to BABS audit log constraint
-- File: sql/migrations/131_add_email_to_babs_audit_log.sql
-- =====================================================

-- Drop the existing constraint
ALTER TABLE ihw.babs_audit_log 
  DROP CONSTRAINT IF EXISTS chk_field_name;

-- Recreate the constraint with email added
ALTER TABLE ihw.babs_audit_log 
  ADD CONSTRAINT chk_field_name CHECK (field_name IN (
    'status', 'actief', 'beedigdVanaf', 'beedigdTot', 
    'beschikbaarVanaf', 'beschikbaarTot', 'opmerkingBeschikbaarheid', 'email'
  ));

COMMENT ON CONSTRAINT chk_field_name ON ihw.babs_audit_log IS 
  'Toegestane veldnamen voor BABS audit logging (inclusief email)';





