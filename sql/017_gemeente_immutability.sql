-- =====================================================
-- Multi-Tenancy: Immutability Trigger
-- File: sql/017_gemeente_immutability.sql
-- =====================================================

\echo '🔒 Adding gemeente_oin immutability trigger...'

-- Create trigger function
CREATE OR REPLACE FUNCTION ihw.prevent_gemeente_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.gemeente_oin IS DISTINCT FROM NEW.gemeente_oin THEN
    RAISE EXCEPTION 'gemeente_oin cannot be changed after creation (attempted change from % to %)', 
      OLD.gemeente_oin, NEW.gemeente_oin;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

COMMENT ON FUNCTION ihw.prevent_gemeente_change() IS 
  'Trigger function to prevent changing gemeente_oin after record creation. Ensures data isolation integrity.';

-- Apply trigger to all tables with gemeente_oin
-- (excluding config tables that might legitimately change)

\echo '  → dossier'
CREATE TRIGGER trg_dossier_prevent_gemeente_change
  BEFORE UPDATE ON ihw.dossier
  FOR EACH ROW
  EXECUTE FUNCTION ihw.prevent_gemeente_change();

\echo '  → partner'
CREATE TRIGGER trg_partner_prevent_gemeente_change
  BEFORE UPDATE ON ihw.partner
  FOR EACH ROW
  EXECUTE FUNCTION ihw.prevent_gemeente_change();

\echo '  → ceremonie'
CREATE TRIGGER trg_ceremonie_prevent_gemeente_change
  BEFORE UPDATE ON ihw.ceremonie
  FOR EACH ROW
  EXECUTE FUNCTION ihw.prevent_gemeente_change();

\echo '  → aankondiging'
CREATE TRIGGER trg_aankondiging_prevent_gemeente_change
  BEFORE UPDATE ON ihw.aankondiging
  FOR EACH ROW
  EXECUTE FUNCTION ihw.prevent_gemeente_change();

\echo '  → getuige'
CREATE TRIGGER trg_getuige_prevent_gemeente_change
  BEFORE UPDATE ON ihw.getuige
  FOR EACH ROW
  EXECUTE FUNCTION ihw.prevent_gemeente_change();

\echo '  → papier'
CREATE TRIGGER trg_papier_prevent_gemeente_change
  BEFORE UPDATE ON ihw.papier
  FOR EACH ROW
  EXECUTE FUNCTION ihw.prevent_gemeente_change();

\echo '  → upload'
CREATE TRIGGER trg_upload_prevent_gemeente_change
  BEFORE UPDATE ON ihw.upload
  FOR EACH ROW
  EXECUTE FUNCTION ihw.prevent_gemeente_change();

\echo '  → payment'
CREATE TRIGGER trg_payment_prevent_gemeente_change
  BEFORE UPDATE ON ihw.payment
  FOR EACH ROW
  EXECUTE FUNCTION ihw.prevent_gemeente_change();

\echo '  → refund'
CREATE TRIGGER trg_refund_prevent_gemeente_change
  BEFORE UPDATE ON ihw.refund
  FOR EACH ROW
  EXECUTE FUNCTION ihw.prevent_gemeente_change();

\echo '  → brp_export'
CREATE TRIGGER trg_brp_export_prevent_gemeente_change
  BEFORE UPDATE ON ihw.brp_export
  FOR EACH ROW
  EXECUTE FUNCTION ihw.prevent_gemeente_change();

\echo '  → communication'
CREATE TRIGGER trg_communication_prevent_gemeente_change
  BEFORE UPDATE ON ihw.communication
  FOR EACH ROW
  EXECUTE FUNCTION ihw.prevent_gemeente_change();

\echo '  → dossier_block'
CREATE TRIGGER trg_dossier_block_prevent_gemeente_change
  BEFORE UPDATE ON ihw.dossier_block
  FOR EACH ROW
  EXECUTE FUNCTION ihw.prevent_gemeente_change();

\echo '  → audit_log'
CREATE TRIGGER trg_audit_log_prevent_gemeente_change
  BEFORE UPDATE ON ihw.audit_log
  FOR EACH ROW
  EXECUTE FUNCTION ihw.prevent_gemeente_change();

\echo '  → tijdslot'
CREATE TRIGGER trg_tijdslot_prevent_gemeente_change
  BEFORE UPDATE ON ihw.tijdslot
  FOR EACH ROW
  EXECUTE FUNCTION ihw.prevent_gemeente_change();

\echo '✅ Immutability triggers applied to all tables'

