-- =====================================================
-- BABS Calendar Feed Integration
-- File: sql/migrations/093_babs_calendar_feed.sql
-- =====================================================

SET search_path TO ihw, public;

-- Add calendar feed token and email columns to babs table
ALTER TABLE ihw.babs 
  ADD COLUMN IF NOT EXISTS calendar_feed_token text UNIQUE,
  ADD COLUMN IF NOT EXISTS calendar_feed_enabled boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS email text;

-- Create index for efficient token lookups
CREATE INDEX IF NOT EXISTS idx_babs_calendar_token 
  ON ihw.babs(calendar_feed_token) 
  WHERE calendar_feed_token IS NOT NULL;

-- Create function to generate secure calendar tokens
CREATE OR REPLACE FUNCTION ihw.generate_calendar_token()
RETURNS text AS $$
BEGIN
  RETURN encode(gen_random_bytes(32), 'hex');
END;
$$ LANGUAGE plpgsql;

-- Comments
COMMENT ON COLUMN ihw.babs.calendar_feed_token IS 
  'Secure token for iCal feed subscription (256-bit hex)';
COMMENT ON COLUMN ihw.babs.calendar_feed_enabled IS 
  'Whether calendar feed is enabled for this BABS';
COMMENT ON COLUMN ihw.babs.email IS 
  'Email address for calendar notifications';

-- ✓ Calendar feed columns added to babs table
-- ✓ Token generation function created

