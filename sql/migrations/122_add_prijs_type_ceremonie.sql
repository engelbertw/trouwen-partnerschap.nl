-- =====================================================
-- Add prijs_cents to type_ceremonie table
-- File: sql/migrations/122_add_prijs_type_ceremonie.sql
-- =====================================================

\echo 'Migration 122: Add prijs_cents to type_ceremonie'

-- Add prijs_cents column
ALTER TABLE ihw.type_ceremonie 
ADD COLUMN IF NOT EXISTS prijs_cents integer NOT NULL DEFAULT 0;

-- Add constraint: gratis ceremonies must have price 0
ALTER TABLE ihw.type_ceremonie
ADD CONSTRAINT chk_prijs_gratis CHECK (
  (gratis = true AND prijs_cents = 0) OR 
  (gratis = false AND prijs_cents >= 0)
);

-- Add comment
COMMENT ON COLUMN ihw.type_ceremonie.prijs_cents IS 
  'Prijs van het ceremonie type in eurocenten (0 voor gratis ceremonies)';

-- Update existing records with example prices (these should be configured per gemeente)
-- Gratis ceremonies: 0
UPDATE ihw.type_ceremonie 
SET prijs_cents = 0 
WHERE gratis = true;

-- Budget ceremonies: 19330 cents = €193,30
UPDATE ihw.type_ceremonie 
SET prijs_cents = 19330 
WHERE budget = true AND gratis = false;

-- Standaard ceremonies: 86160 cents = €861,60 (minimum)
UPDATE ihw.type_ceremonie 
SET prijs_cents = 86160 
WHERE gratis = false AND budget = false;

