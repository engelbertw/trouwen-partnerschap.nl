-- Migration: Add bloedverwantschap field to aankondiging table
-- Date: 2025-12-28
-- Description: Adds boolean field to track if partners are blood relatives

ALTER TABLE ihw.aankondiging
ADD COLUMN IF NOT EXISTS bloedverwantschap boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN ihw.aankondiging.bloedverwantschap IS 'Indicates if the partners are blood relatives (parents, children, siblings, cousins)';



