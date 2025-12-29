-- ============================================================================
-- Migration: Fix geboortedatum constraints to allow current date
-- Version: 1.1
-- Description: Changes geboortedatum < CURRENT_DATE to <= CURRENT_DATE
--              to allow children born today (consistent with frontend validation)
-- ============================================================================

SET search_path TO ihw, public;

-- ============================================================================
-- Fix constraint on kind table
-- ============================================================================

-- Drop old constraint
ALTER TABLE ihw.kind 
DROP CONSTRAINT IF EXISTS chk_geboortedatum_kind;

-- Add new constraint (allow current date)
ALTER TABLE ihw.kind 
ADD CONSTRAINT chk_geboortedatum_kind CHECK (geboortedatum <= CURRENT_DATE);

COMMENT ON CONSTRAINT chk_geboortedatum_kind ON ihw.kind IS 
'Geboortedatum moet in het verleden liggen of vandaag zijn';

-- ============================================================================
-- Fix constraint on getuige table (if exists)
-- ============================================================================

-- Drop old constraint
ALTER TABLE ihw.getuige 
DROP CONSTRAINT IF EXISTS chk_geboortedatum;

-- Add new constraint (allow current date)
ALTER TABLE ihw.getuige 
ADD CONSTRAINT chk_geboortedatum CHECK (geboortedatum <= CURRENT_DATE);

COMMENT ON CONSTRAINT chk_geboortedatum ON ihw.getuige IS 
'Geboortedatum moet in het verleden liggen of vandaag zijn';

-- ============================================================================
-- Verification
-- ============================================================================

DO $$
BEGIN
    -- Verify kind constraint
    IF EXISTS (
        SELECT 1 FROM information_schema.check_constraints
        WHERE constraint_schema = 'ihw' 
        AND constraint_name = 'chk_geboortedatum_kind'
    ) THEN
        RAISE NOTICE 'SUCCESS: kind.chk_geboortedatum_kind constraint updated';
    ELSE
        RAISE EXCEPTION 'FAILED: kind.chk_geboortedatum_kind constraint not found';
    END IF;
    
    -- Verify getuige constraint
    IF EXISTS (
        SELECT 1 FROM information_schema.check_constraints
        WHERE constraint_schema = 'ihw' 
        AND constraint_name = 'chk_geboortedatum'
    ) THEN
        RAISE NOTICE 'SUCCESS: getuige.chk_geboortedatum constraint updated';
    ELSE
        RAISE EXCEPTION 'FAILED: getuige.chk_geboortedatum constraint not found';
    END IF;
END $$;

