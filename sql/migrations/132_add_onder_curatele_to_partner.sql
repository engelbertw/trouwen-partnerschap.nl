-- Migration: Add onder_curatele field to partner table
-- Date: 2025-12-28
-- Description: Adds boolean field to track if a partner is under guardianship (curatele)

ALTER TABLE ihw.partner
ADD COLUMN IF NOT EXISTS onder_curatele boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN ihw.partner.onder_curatele IS 'Indicates if this partner is under guardianship (curatele)';

