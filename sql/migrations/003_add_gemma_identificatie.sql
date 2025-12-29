-- ============================================================================
-- Migration: Add GEMMA-compliant zaak identificatie
-- Version: 2.0
-- Description: Adds identificatie field for user-facing zaak numbers
--              following VNG GEMMA Zaken standard
-- ============================================================================

SET search_path TO ihw, public;

-- ============================================================================
-- 1. Add identificatie column to dossier table
-- ============================================================================

-- Add new columns
ALTER TABLE ihw.dossier 
ADD COLUMN IF NOT EXISTS identificatie text UNIQUE,
ADD COLUMN IF NOT EXISTS zaaktype_url text;

-- Add constraint for format validation (HUW-YYYY-NNNNNN)
ALTER TABLE ihw.dossier 
ADD CONSTRAINT chk_identificatie_format 
  CHECK (identificatie IS NULL OR identificatie ~ '^[A-Z]+-[0-9]{4}-[0-9]{6}$');

-- Add index for fast lookups
CREATE INDEX IF NOT EXISTS idx_dossier_identificatie ON ihw.dossier(identificatie);

-- Add comments
COMMENT ON COLUMN ihw.dossier.identificatie IS 
'GEMMA-compliant zaak identificatie (HUW-2025-000001) voor gebruikers';
COMMENT ON COLUMN ihw.dossier.zaaktype_url IS 
'URL naar zaaktype in ZTC (Zaaktypen Catalogus) volgens GEMMA standaard';

-- ============================================================================
-- 2. Create sequence for identificatie numbering
-- ============================================================================

-- Create sequence (starts fresh each year, managed by trigger)
CREATE SEQUENCE IF NOT EXISTS zaak_sequence_2025 START 1;

-- Function to get or create sequence for current year
CREATE OR REPLACE FUNCTION get_zaak_sequence_name()
RETURNS text AS $$
BEGIN
  RETURN 'zaak_sequence_' || to_char(CURRENT_DATE, 'YYYY');
END;
$$ LANGUAGE plpgsql;

-- Function to ensure sequence exists for current year
CREATE OR REPLACE FUNCTION ensure_zaak_sequence()
RETURNS void AS $$
DECLARE
  seq_name text;
BEGIN
  seq_name := get_zaak_sequence_name();
  
  -- Check if sequence exists, create if not
  IF NOT EXISTS (
    SELECT 1 FROM pg_sequences 
    WHERE schemaname = 'ihw' AND sequencename = seq_name
  ) THEN
    EXECUTE format('CREATE SEQUENCE ihw.%I START 1', seq_name);
  END IF;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 3. Function to generate GEMMA-compliant identificatie
-- ============================================================================

CREATE OR REPLACE FUNCTION generate_zaak_identificatie()
RETURNS trigger AS $$
DECLARE
  seq_name text;
  seq_val bigint;
  year text;
  prefix text;
BEGIN
  -- Only generate if identificatie is not already set
  IF NEW.identificatie IS NOT NULL THEN
    RETURN NEW;
  END IF;
  
  -- Ensure sequence exists for current year
  PERFORM ensure_zaak_sequence();
  
  -- Get sequence name and next value
  seq_name := get_zaak_sequence_name();
  year := to_char(CURRENT_DATE, 'YYYY');
  
  -- Determine prefix based on type (if available)
  -- For now, always use 'HUW' (huwelijk/marriage)
  prefix := 'HUW';
  
  -- Get next sequence value
  EXECUTE format('SELECT nextval(''ihw.%I'')', seq_name) INTO seq_val;
  
  -- Generate identificatie: HUW-2025-000001
  NEW.identificatie := prefix || '-' || year || '-' || lpad(seq_val::text, 6, '0');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 4. Create trigger to auto-generate identificatie
-- ============================================================================

DROP TRIGGER IF EXISTS set_zaak_identificatie ON ihw.dossier;

CREATE TRIGGER set_zaak_identificatie
  BEFORE INSERT ON ihw.dossier
  FOR EACH ROW
  EXECUTE FUNCTION generate_zaak_identificatie();

-- ============================================================================
-- 5. Backfill existing dossiers with identificatie
-- ============================================================================

-- Generate identificatie for existing dossiers that don't have one
DO $$
DECLARE
  dossier_rec RECORD;
  seq_val bigint;
  year text;
BEGIN
  -- Ensure sequence exists
  PERFORM ensure_zaak_sequence();
  
  -- Process each dossier without identificatie
  FOR dossier_rec IN 
    SELECT id, created_at 
    FROM ihw.dossier 
    WHERE identificatie IS NULL
    ORDER BY created_at
  LOOP
    -- Get year from creation date
    year := to_char(dossier_rec.created_at, 'YYYY');
    
    -- Get next sequence value for that year
    EXECUTE format('SELECT nextval(''ihw.zaak_sequence_%s'')', year) INTO seq_val;
    
    -- Update dossier with identificatie
    UPDATE ihw.dossier
    SET identificatie = 'HUW-' || year || '-' || lpad(seq_val::text, 6, '0')
    WHERE id = dossier_rec.id;
    
    RAISE NOTICE 'Updated dossier % with identificatie HUW-%-%', 
      dossier_rec.id, year, lpad(seq_val::text, 6, '0');
  END LOOP;
END $$;

-- ============================================================================
-- 6. Add helper functions for lookups
-- ============================================================================

-- Function to find dossier by identificatie
CREATE OR REPLACE FUNCTION find_dossier_by_identificatie(p_identificatie text)
RETURNS uuid AS $$
BEGIN
  RETURN (
    SELECT id FROM ihw.dossier 
    WHERE identificatie = upper(p_identificatie)
    LIMIT 1
  );
END;
$$ LANGUAGE plpgsql;

-- Function to find dossier by short UUID (backwards compatibility)
CREATE OR REPLACE FUNCTION find_dossier_by_short_id(short_id text)
RETURNS uuid AS $$
BEGIN
  RETURN (
    SELECT id FROM ihw.dossier 
    WHERE id::text LIKE lower(short_id) || '%'
    LIMIT 1
  );
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 7. Create view for easy access
-- ============================================================================

CREATE OR REPLACE VIEW ihw.dossier_overzicht AS
SELECT 
  d.id,
  d.identificatie as zaaknummer,
  d.identificatie,
  substring(d.id::text, 1, 8) as short_uuid,
  d.status,
  d.gemeente_oin as bronorganisatie,
  d.zaaktype_url,
  d.created_at as aanmaakdatum,
  d.ceremony_date as trouwdatum,
  p1.voornamen || ' ' || p1.geslachtsnaam as partner1_naam,
  p2.voornamen || ' ' || p2.geslachtsnaam as partner2_naam
FROM ihw.dossier d
LEFT JOIN ihw.partner p1 ON p1.dossier_id = d.id AND p1.sequence = 1
LEFT JOIN ihw.partner p2 ON p2.dossier_id = d.id AND p2.sequence = 2;

COMMENT ON VIEW ihw.dossier_overzicht IS 
'Overzicht van dossiers met GEMMA-compliant zaaknummers en partner namen';

-- ============================================================================
-- 8. Verification
-- ============================================================================

DO $$
DECLARE
  total_dossiers int;
  dossiers_with_id int;
  sample_id text;
BEGIN
  -- Count total dossiers
  SELECT COUNT(*) INTO total_dossiers FROM ihw.dossier;
  
  -- Count dossiers with identificatie
  SELECT COUNT(*) INTO dossiers_with_id 
  FROM ihw.dossier 
  WHERE identificatie IS NOT NULL;
  
  -- Get sample identificatie
  SELECT identificatie INTO sample_id 
  FROM ihw.dossier 
  WHERE identificatie IS NOT NULL 
  LIMIT 1;
  
  RAISE NOTICE '';
  RAISE NOTICE '════════════════════════════════════════════════════════════';
  RAISE NOTICE '  Migration Summary';
  RAISE NOTICE '════════════════════════════════════════════════════════════';
  RAISE NOTICE 'Total dossiers: %', total_dossiers;
  RAISE NOTICE 'Dossiers with identificatie: %', dossiers_with_id;
  RAISE NOTICE 'Sample identificatie: %', COALESCE(sample_id, 'N/A');
  RAISE NOTICE '════════════════════════════════════════════════════════════';
  RAISE NOTICE '';
  
  IF total_dossiers > 0 AND dossiers_with_id = total_dossiers THEN
    RAISE NOTICE '✅ SUCCESS: All dossiers have GEMMA-compliant identificatie';
  ELSIF total_dossiers = 0 THEN
    RAISE NOTICE '✅ SUCCESS: Migration complete (no existing dossiers)';
  ELSE
    RAISE WARNING '⚠️  WARNING: Not all dossiers have identificatie';
  END IF;
END $$;

-- ============================================================================
-- Test queries
-- ============================================================================

-- Uncomment to test:
-- SELECT * FROM ihw.dossier_overzicht LIMIT 5;
-- SELECT find_dossier_by_identificatie('HUW-2025-000001');
-- SELECT find_dossier_by_short_id('75EC5B04');

