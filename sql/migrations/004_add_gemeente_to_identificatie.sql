-- ============================================================================
-- Migration: Add GEMMA-compliant zaak identificatie WITH GEMEENTE CODE
-- Version: 3.0 (UPDATED - includes municipality code)
-- Description: Adds identificatie field for user-facing zaak numbers
--              following VNG GEMMA Zaken standard
--              Format: HUW-{gemeente_code}-{year}-{sequence}
-- ============================================================================

SET search_path TO ihw, public;

-- ============================================================================
-- 1. Temporarily remove constraint to allow data regeneration
-- ============================================================================

-- Drop old constraint (will be re-added after data regeneration)
ALTER TABLE ihw.dossier DROP CONSTRAINT IF EXISTS chk_identificatie_format;

-- Update comments
COMMENT ON COLUMN ihw.dossier.identificatie IS 
'GEMMA-compliant zaak identificatie (HUW-0363-2025-000001) met gemeente code voor gebruikers';

-- ============================================================================
-- 2. Update sequence management to be per gemeente per year
-- ============================================================================

-- Function to get sequence name for gemeente + year
CREATE OR REPLACE FUNCTION get_zaak_sequence_name(p_gemeente_code text)
RETURNS text AS $$
BEGIN
  RETURN 'zaak_sequence_' || p_gemeente_code || '_' || to_char(CURRENT_DATE, 'YYYY');
END;
$$ LANGUAGE plpgsql;

-- Function to ensure sequence exists for gemeente + year
CREATE OR REPLACE FUNCTION ensure_zaak_sequence(p_gemeente_code text)
RETURNS void AS $$
DECLARE
  seq_name text;
BEGIN
  seq_name := get_zaak_sequence_name(p_gemeente_code);
  
  -- Check if sequence exists, create if not
  IF NOT EXISTS (
    SELECT 1 FROM pg_sequences 
    WHERE schemaname = 'ihw' AND sequencename = seq_name
  ) THEN
    EXECUTE format('CREATE SEQUENCE ihw.%I START 1', seq_name);
    RAISE NOTICE 'Created sequence: %', seq_name;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 3. Update trigger function to include gemeente code
-- ============================================================================

CREATE OR REPLACE FUNCTION generate_zaak_identificatie()
RETURNS trigger AS $$
DECLARE
  seq_name text;
  seq_val bigint;
  year text;
  prefix text;
  gemeente_code text;
BEGIN
  -- Only generate if identificatie is not already set
  IF NEW.identificatie IS NOT NULL THEN
    RETURN NEW;
  END IF;
  
  -- Get gemeente code from municipality_code
  gemeente_code := NEW.municipality_code;
  
  -- Validate gemeente code exists
  IF gemeente_code IS NULL THEN
    RAISE EXCEPTION 'Cannot generate identificatie: municipality_code is NULL';
  END IF;
  
  -- Extract numeric part from gemeente code (e.g., 'NL.IMBAG.Gemeente.0363' -> '0363')
  gemeente_code := substring(gemeente_code from '[0-9]+$');
  
  IF gemeente_code IS NULL OR length(gemeente_code) != 4 THEN
    RAISE EXCEPTION 'Invalid municipality_code format: %', NEW.municipality_code;
  END IF;
  
  -- Ensure sequence exists for this gemeente + year
  PERFORM ensure_zaak_sequence(gemeente_code);
  
  -- Get sequence name and next value
  seq_name := get_zaak_sequence_name(gemeente_code);
  year := to_char(CURRENT_DATE, 'YYYY');
  
  -- Determine prefix based on type (if available)
  -- For now, always use 'HUW' (huwelijk/marriage)
  prefix := 'HUW';
  
  -- Get next sequence value
  EXECUTE format('SELECT nextval(''ihw.%I'')', seq_name) INTO seq_val;
  
  -- Generate identificatie: HUW-0363-2025-000001
  NEW.identificatie := prefix || '-' || gemeente_code || '-' || year || '-' || lpad(seq_val::text, 6, '0');
  
  RAISE NOTICE 'Generated identificatie: % for gemeente %', NEW.identificatie, gemeente_code;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 4. Re-create trigger (in case it was modified)
-- ============================================================================

DROP TRIGGER IF EXISTS set_zaak_identificatie ON ihw.dossier;

CREATE TRIGGER set_zaak_identificatie
  BEFORE INSERT ON ihw.dossier
  FOR EACH ROW
  EXECUTE FUNCTION generate_zaak_identificatie();

-- ============================================================================
-- 5. Regenerate identificatie for existing dossiers WITH gemeente code
-- ============================================================================

DO $$
DECLARE
  dossier_rec RECORD;
  seq_val bigint;
  year text;
  gemeente_code text;
  new_identificatie text;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '════════════════════════════════════════════════════════════';
  RAISE NOTICE '  Regenerating Identificatie with Gemeente Code';
  RAISE NOTICE '════════════════════════════════════════════════════════════';
  RAISE NOTICE '';
  
  -- Process each dossier
  FOR dossier_rec IN 
    SELECT id, created_at, municipality_code, identificatie as old_identificatie
    FROM ihw.dossier 
    ORDER BY created_at
  LOOP
    -- Get year from creation date
    year := to_char(dossier_rec.created_at, 'YYYY');
    
    -- Extract gemeente code
    gemeente_code := substring(dossier_rec.municipality_code from '[0-9]+$');
    
    IF gemeente_code IS NULL OR length(gemeente_code) != 4 THEN
      RAISE WARNING 'Skipping dossier % - invalid municipality_code: %', 
        dossier_rec.id, dossier_rec.municipality_code;
      CONTINUE;
    END IF;
    
    -- Ensure sequence exists for this gemeente + year
    PERFORM ensure_zaak_sequence(gemeente_code);
    
    -- Get next sequence value
    EXECUTE format('SELECT nextval(''ihw.zaak_sequence_%s_%s'')', gemeente_code, year) 
      INTO seq_val;
    
    -- Generate new identificatie
    new_identificatie := 'HUW-' || gemeente_code || '-' || year || '-' || lpad(seq_val::text, 6, '0');
    
    -- Update dossier
    UPDATE ihw.dossier
    SET identificatie = new_identificatie
    WHERE id = dossier_rec.id;
    
    RAISE NOTICE 'Updated dossier %: % → %', 
      substring(dossier_rec.id::text, 1, 8),
      dossier_rec.old_identificatie,
      new_identificatie;
  END LOOP;
  
  RAISE NOTICE '';
  RAISE NOTICE '════════════════════════════════════════════════════════════';
  RAISE NOTICE '  Regeneration Complete';
  RAISE NOTICE '════════════════════════════════════════════════════════════';
  RAISE NOTICE '';
END $$;

-- ============================================================================
-- 5b. Add constraint AFTER data regeneration
-- ============================================================================

-- Now add the updated constraint for format validation (HUW-0363-2025-000001)
ALTER TABLE ihw.dossier 
ADD CONSTRAINT chk_identificatie_format 
  CHECK (identificatie IS NULL OR identificatie ~ '^[A-Z]+-[0-9]{4}-[0-9]{4}-[0-9]{6}$');

DO $$
BEGIN
  RAISE NOTICE '✅ Added constraint chk_identificatie_format with gemeente code format';
END $$;

-- ============================================================================
-- 6. Update helper functions
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

-- New function: Extract gemeente code from identificatie
CREATE OR REPLACE FUNCTION get_gemeente_from_identificatie(p_identificatie text)
RETURNS text AS $$
BEGIN
  -- Extract gemeente code from format HUW-0363-2025-000001
  RETURN substring(p_identificatie from '^[A-Z]+-([0-9]{4})-');
END;
$$ LANGUAGE plpgsql;

-- New function: Get statistics per gemeente
CREATE OR REPLACE FUNCTION get_zaak_statistics_per_gemeente()
RETURNS TABLE(
  gemeente_code text,
  gemeente_naam text,
  total_zaken bigint,
  zaken_2025 bigint,
  latest_sequence bigint
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    substring(d.municipality_code from '[0-9]+$') as gem_code,
    g.naam as gem_naam,
    COUNT(*) as tot_zaken,
    COUNT(*) FILTER (WHERE d.identificatie LIKE '%-2025-%') as zaken_2025_count,
    MAX(
      substring(d.identificatie from '[0-9]+$')::bigint
    ) as latest_seq
  FROM ihw.dossier d
  LEFT JOIN ihw.gemeente g ON g.gemeente_code = substring(d.municipality_code from '[0-9]+$')
  WHERE d.identificatie IS NOT NULL
  GROUP BY gem_code, gem_naam
  ORDER BY gem_code;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 7. Update view
-- ============================================================================

DROP VIEW IF EXISTS ihw.dossier_overzicht;

CREATE OR REPLACE VIEW ihw.dossier_overzicht AS
SELECT 
  d.id,
  d.identificatie as zaaknummer,
  d.identificatie,
  substring(d.municipality_code from '[0-9]+$') as gemeente_code,
  g.naam as gemeente_naam,
  substring(d.id::text, 1, 8) as short_uuid,
  d.status,
  d.gemeente_oin as bronorganisatie,
  d.zaaktype_url,
  d.created_at as aanmaakdatum,
  d.ceremony_date as trouwdatum,
  p1.voornamen || ' ' || p1.geslachtsnaam as partner1_naam,
  p2.voornamen || ' ' || p2.geslachtsnaam as partner2_naam
FROM ihw.dossier d
LEFT JOIN ihw.gemeente g ON g.gemeente_code = substring(d.municipality_code from '[0-9]+$')
LEFT JOIN ihw.partner p1 ON p1.dossier_id = d.id AND p1.sequence = 1
LEFT JOIN ihw.partner p2 ON p2.dossier_id = d.id AND p2.sequence = 2;

COMMENT ON VIEW ihw.dossier_overzicht IS 
'Overzicht van dossiers met GEMMA-compliant zaaknummers inclusief gemeente code';

-- ============================================================================
-- 8. Verification
-- ============================================================================

DO $$
DECLARE
  total_dossiers int;
  dossiers_with_id int;
  sample_id text;
  gemeente_stats RECORD;
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
  RAISE NOTICE '';
  RAISE NOTICE 'Statistics per gemeente:';
  RAISE NOTICE '';
  
  -- Show stats per gemeente
  FOR gemeente_stats IN 
    SELECT * FROM get_zaak_statistics_per_gemeente()
  LOOP
    RAISE NOTICE '  Gemeente %: % - % zaken total, % in 2025, sequence at %',
      gemeente_stats.gemeente_code,
      gemeente_stats.gemeente_naam,
      gemeente_stats.total_zaken,
      gemeente_stats.zaken_2025,
      gemeente_stats.latest_sequence;
  END LOOP;
  
  RAISE NOTICE '';
  RAISE NOTICE '════════════════════════════════════════════════════════════';
  RAISE NOTICE '';
  
  IF total_dossiers > 0 AND dossiers_with_id = total_dossiers THEN
    RAISE NOTICE '✅ SUCCESS: All dossiers have GEMMA-compliant identificatie with gemeente code';
  ELSIF total_dossiers = 0 THEN
    RAISE NOTICE '✅ SUCCESS: Migration complete (no existing dossiers)';
  ELSE
    RAISE WARNING '⚠️  WARNING: Not all dossiers have identificatie';
  END IF;
  
  RAISE NOTICE '';
END $$;

-- ============================================================================
-- Test queries
-- ============================================================================

-- Uncomment to test:
-- SELECT * FROM ihw.dossier_overzicht LIMIT 5;
-- SELECT * FROM get_zaak_statistics_per_gemeente();
-- SELECT find_dossier_by_identificatie('HUW-0363-2025-000001');
-- SELECT get_gemeente_from_identificatie('HUW-0363-2025-000001');

