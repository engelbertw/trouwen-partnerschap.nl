-- =====================================================
-- Add BABS Beschikbaarheid
-- File: sql/migrations/090_babs_beschikbaarheid.sql
-- =====================================================

-- Add beschikbaarheid field to babs table
-- This stores weekly availability as JSONB
-- Format: { "maandag": ["09:00-12:00", "14:00-17:00"], "dinsdag": [...], ... }
ALTER TABLE ihw.babs 
  ADD COLUMN IF NOT EXISTS beschikbaarheid jsonb DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS beschikbaar_vanaf date,
  ADD COLUMN IF NOT EXISTS beschikbaar_tot date,
  ADD COLUMN IF NOT EXISTS opmerking_beschikbaarheid text;

-- Add index for querying active and available BABS
CREATE INDEX IF NOT EXISTS idx_babs_beschikbaar 
  ON ihw.babs(actief, beedigd_vanaf, beedigd_tot) 
  WHERE actief = true AND status = 'beedigd';

-- Comments
COMMENT ON COLUMN ihw.babs.beschikbaarheid IS 
  'Wekelijkse beschikbaarheid als JSON: {"maandag": ["09:00-12:00"], "dinsdag": [...]}';

COMMENT ON COLUMN ihw.babs.beschikbaar_vanaf IS 
  'Datum vanaf wanneer deze BABS beschikbaar is voor nieuwe ceremonies';

COMMENT ON COLUMN ihw.babs.beschikbaar_tot IS 
  'Datum tot wanneer deze BABS beschikbaar is (optioneel, voor tijdelijke beschikbaarheid)';

COMMENT ON COLUMN ihw.babs.opmerking_beschikbaarheid IS 
  'Opmerking over beschikbaarheid (bijv. "Alleen op woensdag in december")';

