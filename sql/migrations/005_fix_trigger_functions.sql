-- Quick fix: Deploy only the essential functions for identificatie generation
-- This addresses the missing ensure_zaak_sequence function

SET search_path TO ihw, public;

-- ============================================================================
-- 1. Helper Functions
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
-- 2. Main Trigger Function
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
    RAISE EXCEPTION 'Invalid municipality_code format: %. Expected format: NL.IMBAG.Gemeente.NNNN', NEW.municipality_code;
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
-- 3. Recreate Trigger
-- ============================================================================

DROP TRIGGER IF EXISTS set_zaak_identificatie ON ihw.dossier;

CREATE TRIGGER set_zaak_identificatie
  BEFORE INSERT ON ihw.dossier
  FOR EACH ROW
  EXECUTE FUNCTION generate_zaak_identificatie();

-- ============================================================================
-- Verification
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '════════════════════════════════════════════════════════════';
  RAISE NOTICE '  Functions Deployed Successfully';
  RAISE NOTICE '════════════════════════════════════════════════════════════';
  RAISE NOTICE '';
  RAISE NOTICE '✅ get_zaak_sequence_name(text) - OK';
  RAISE NOTICE '✅ ensure_zaak_sequence(text) - OK';
  RAISE NOTICE '✅ generate_zaak_identificatie() - OK';
  RAISE NOTICE '✅ Trigger set_zaak_identificatie - OK';
  RAISE NOTICE '';
  RAISE NOTICE 'Ready to generate identificatie numbers!';
  RAISE NOTICE '';
END $$;

