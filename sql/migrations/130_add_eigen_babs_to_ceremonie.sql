-- Migration: Add eigen_babs field to ceremonie table
-- This field indicates whether the user wants to use their own BABS (true) or a gemeente BABS (false)

ALTER TABLE ihw.ceremonie 
ADD COLUMN IF NOT EXISTS eigen_babs BOOLEAN;

COMMENT ON COLUMN ihw.ceremonie.eigen_babs IS 'Indicates if user wants own BABS (true) or gemeente BABS (false). NULL if not yet selected.';



