-- =====================================================
-- Add Locatie Beschikbaarheid
-- File: sql/migrations/092_locatie_beschikbaarheid.sql
-- =====================================================

-- Add beschikbaarheid fields to locatie table
-- This stores weekly availability as JSONB (similar to BABS)
-- Format: { "maandag": ["09:00-12:00", "14:00-17:00"], "dinsdag": [...], ... }
ALTER TABLE ihw.locatie 
  ADD COLUMN IF NOT EXISTS beschikbaarheid jsonb DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS beschikbaar_vanaf date,
  ADD COLUMN IF NOT EXISTS beschikbaar_tot date,
  ADD COLUMN IF NOT EXISTS opmerking_beschikbaarheid text,
  ADD COLUMN IF NOT EXISTS email text,
  ADD COLUMN IF NOT EXISTS calendar_feed_token text UNIQUE,
  ADD COLUMN IF NOT EXISTS calendar_feed_enabled boolean DEFAULT true;

-- Add index for querying active and available locaties
CREATE INDEX IF NOT EXISTS idx_locatie_beschikbaar 
  ON ihw.locatie(actief, beschikbaar_vanaf, beschikbaar_tot) 
  WHERE actief = true;

-- Comments
COMMENT ON COLUMN ihw.locatie.beschikbaarheid IS 
  'Wekelijkse beschikbaarheid als JSON: {"maandag": ["09:00-12:00"], "dinsdag": [...]}';

COMMENT ON COLUMN ihw.locatie.beschikbaar_vanaf IS 
  'Datum vanaf wanneer deze locatie beschikbaar is voor nieuwe ceremonies';

COMMENT ON COLUMN ihw.locatie.beschikbaar_tot IS 
  'Datum tot wanneer deze locatie beschikbaar is (optioneel, voor tijdelijke beschikbaarheid)';

COMMENT ON COLUMN ihw.locatie.opmerking_beschikbaarheid IS 
  'Opmerking over beschikbaarheid (bijv. "Alleen op woensdag in december")';

COMMENT ON COLUMN ihw.locatie.email IS 
  'Email adres van locatie beheerder voor notificaties';

COMMENT ON COLUMN ihw.locatie.calendar_feed_token IS 
  'Uniek token voor iCal feed synchronisatie';

COMMENT ON COLUMN ihw.locatie.calendar_feed_enabled IS 
  'Of de iCal feed ingeschakeld is voor deze locatie';

