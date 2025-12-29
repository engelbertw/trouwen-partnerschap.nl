-- Migration: Add address fields to partner table
-- Adds adres, postcode, and plaats (woonplaats) fields for partner address information

ALTER TABLE ihw.partner
  ADD COLUMN IF NOT EXISTS adres text,
  ADD COLUMN IF NOT EXISTS postcode text,
  ADD COLUMN IF NOT EXISTS plaats text;

COMMENT ON COLUMN ihw.partner.adres IS 'Straatnaam en huisnummer';
COMMENT ON COLUMN ihw.partner.postcode IS 'Postcode (formaat: 1234AB)';
COMMENT ON COLUMN ihw.partner.plaats IS 'Woonplaats';

