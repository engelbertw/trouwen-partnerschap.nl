-- =====================================================
-- Add talen (languages) to type_ceremonie and babs
-- File: sql/migrations/098_add_talen_type_ceremonie_babs.sql
-- =====================================================

\echo 'Migration 098: Add talen to type_ceremonie and babs'

-- Add talen to type_ceremonie (JSONB array of language codes)
ALTER TABLE ihw.type_ceremonie 
  ADD COLUMN IF NOT EXISTS talen jsonb DEFAULT '["nl"]'::jsonb;

-- Add uitgebreide_omschrijving to type_ceremonie (for long descriptions)
ALTER TABLE ihw.type_ceremonie 
  ADD COLUMN IF NOT EXISTS uitgebreide_omschrijving text;

-- Add talen to babs (JSONB array of language codes)
ALTER TABLE ihw.babs 
  ADD COLUMN IF NOT EXISTS talen jsonb DEFAULT '["nl"]'::jsonb;

-- Update existing type_ceremonie records based on naam/omschrijving
UPDATE ihw.type_ceremonie 
SET talen = CASE
  WHEN naam LIKE '%Nederlands%' AND naam LIKE '%Engels%' AND naam LIKE '%Duits%' AND naam LIKE '%Frans%' THEN '["nl", "en", "de", "fr"]'::jsonb
  WHEN naam LIKE '%Nederlands%' AND naam LIKE '%Engels%' THEN '["nl", "en"]'::jsonb
  WHEN naam LIKE '%Nederlands%' AND naam LIKE '%Engels%' AND naam LIKE '%Duits%' THEN '["nl", "en", "de"]'::jsonb
  WHEN naam LIKE '%Nederlands%' AND naam LIKE '%Engels%' AND naam LIKE '%Frans%' THEN '["nl", "en", "fr"]'::jsonb
  ELSE '["nl"]'::jsonb
END
WHERE talen IS NULL OR talen = '["nl"]'::jsonb;

-- Add constraint to ensure talen is an array
ALTER TABLE ihw.type_ceremonie
  DROP CONSTRAINT IF EXISTS chk_talen_array;
  
ALTER TABLE ihw.type_ceremonie
  ADD CONSTRAINT chk_talen_array CHECK (jsonb_typeof(talen) = 'array');

ALTER TABLE ihw.babs
  DROP CONSTRAINT IF EXISTS chk_babs_talen_array;
  
ALTER TABLE ihw.babs
  ADD CONSTRAINT chk_babs_talen_array CHECK (jsonb_typeof(talen) = 'array');

-- Add comments
COMMENT ON COLUMN ihw.type_ceremonie.talen IS 'Array van taal codes die deze ceremonie ondersteunt (bijv. ["nl", "en", "de", "fr"])';
COMMENT ON COLUMN ihw.type_ceremonie.uitgebreide_omschrijving IS 'Uitgebreide omschrijving voor burgers (bijv. "De gratis ceremonie duurt 10 minuten...")';
COMMENT ON COLUMN ihw.babs.talen IS 'Array van taal codes die deze BABS spreekt (bijv. ["nl", "en"])';

\echo '✅ Added talen to type_ceremonie and babs'

