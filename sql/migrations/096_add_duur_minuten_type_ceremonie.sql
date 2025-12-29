-- =====================================================
-- Add duur_minuten to type_ceremonie
-- File: sql/migrations/096_add_duur_minuten_type_ceremonie.sql
-- =====================================================

\echo 'Migration 096: Add duur_minuten to type_ceremonie'

-- Add column
ALTER TABLE ihw.type_ceremonie 
  ADD COLUMN IF NOT EXISTS duur_minuten integer DEFAULT 60;

-- Update bestaande records op basis van naam
UPDATE ihw.type_ceremonie 
SET duur_minuten = CASE
  WHEN naam LIKE '%15 minuten%' OR naam LIKE '%15 min%' THEN 15
  WHEN naam LIKE '%30 minuten%' OR naam LIKE '%30 min%' THEN 30
  WHEN naam LIKE '%1 uur%' AND naam NOT LIKE '%1,5%' AND naam NOT LIKE '%1.5%' THEN 60
  WHEN naam LIKE '%1,5 uur%' OR naam LIKE '%1.5 uur%' OR naam LIKE '%1½ uur%' THEN 90
  WHEN naam LIKE '%2 uur%' THEN 120
  ELSE 60  -- Default
END
WHERE duur_minuten IS NULL OR duur_minuten = 60;

-- Add constraint
ALTER TABLE ihw.type_ceremonie
  DROP CONSTRAINT IF EXISTS chk_duur_minuten;
  
ALTER TABLE ihw.type_ceremonie
  ADD CONSTRAINT chk_duur_minuten CHECK (duur_minuten > 0 AND duur_minuten <= 480);

-- Add comment
COMMENT ON COLUMN ihw.type_ceremonie.duur_minuten IS 'Duur van de ceremonie in minuten (15-480, stappen van 15 minuten aanbevolen)';

\echo '✅ Added duur_minuten to type_ceremonie'

