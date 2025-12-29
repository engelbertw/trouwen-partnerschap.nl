-- =====================================================
-- Ceremony Notification Trigger for BABS
-- File: sql/migrations/094_ceremony_notification_trigger.sql
-- =====================================================

SET search_path TO ihw, public;

-- Create notification function that sends pg_notify event
-- This can be picked up by a background worker or API endpoint
CREATE OR REPLACE FUNCTION ihw.notify_babs_new_ceremony()
RETURNS trigger AS $$
BEGIN
  -- Only notify if BABS is assigned
  IF NEW.babs_id IS NOT NULL THEN
    PERFORM pg_notify(
      'babs_ceremony_assigned',
      json_build_object(
        'babs_id', NEW.babs_id,
        'ceremony_id', NEW.id,
        'dossier_id', NEW.dossier_id,
        'datum', NEW.datum,
        'start_tijd', NEW.start_tijd,
        'eind_tijd', NEW.eind_tijd,
        'locatie_id', NEW.locatie_id
      )::text
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for new ceremony assignments
DROP TRIGGER IF EXISTS notify_babs_on_ceremony_insert ON ihw.ceremonie;
CREATE TRIGGER notify_babs_on_ceremony_insert
  AFTER INSERT ON ihw.ceremonie
  FOR EACH ROW
  WHEN (NEW.babs_id IS NOT NULL)
  EXECUTE FUNCTION ihw.notify_babs_new_ceremony();

-- Also trigger on UPDATE if babs_id changes
DROP TRIGGER IF EXISTS notify_babs_on_ceremony_update ON ihw.ceremonie;
CREATE TRIGGER notify_babs_on_ceremony_update
  AFTER UPDATE ON ihw.ceremonie
  FOR EACH ROW
  WHEN (
    NEW.babs_id IS NOT NULL 
    AND (OLD.babs_id IS NULL OR OLD.babs_id != NEW.babs_id)
  )
  EXECUTE FUNCTION ihw.notify_babs_new_ceremony();

COMMENT ON FUNCTION ihw.notify_babs_new_ceremony() IS 
  'Sends pg_notify event when BABS is assigned to a ceremony';

\echo '✓ Notification triggers created for ceremony assignments'

