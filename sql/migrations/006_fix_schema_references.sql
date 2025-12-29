-- ============================================================================
-- CRITICAL FIX: Ensure functions are in ihw schema with proper references
-- ============================================================================

SET search_path TO ihw, public;

-- Drop old functions if they exist in wrong schema
DROP FUNCTION IF EXISTS public.get_zaak_sequence_name(text);
DROP FUNCTION IF EXISTS public.ensure_zaak_sequence(text);
DROP FUNCTION IF EXISTS public.generate_zaak_identificatie();

-- ============================================================================
-- 1. Helper Functions (EXPLICITLY in ihw schema)
-- ============================================================================

-- Function to get sequence name for gemeente + year
CREATE OR REPLACE FUNCTION ihw.get_zaak_sequence_name(p_gemeente_code text)
RETURNS text AS $$
BEGIN
  RETURN 'zaak_sequence_' || p_gemeente_code || '_' || to_char(CURRENT_DATE, 'YYYY');
END;
$$ LANGUAGE plpgsql;

-- Function to ensure sequence exists for gemeente + year
CREATE OR REPLACE FUNCTION ihw.ensure_zaak_sequence(p_gemeente_code text)
RETURNS void AS $$
DECLARE
  seq_name text;
BEGIN
  seq_name := ihw.get_zaak_sequence_name(p_gemeente_code);
  
  -- Check if sequence exists, create if not
  IF NOT EXISTS (
    SELECT 1 FROM pg_sequences 
    WHERE schemaname = 'ihw' AND sequencename = seq_name
  ) THEN
    EXECUTE format('CREATE SEQUENCE ihw.%I START 1', seq_name);
    RAISE NOTICE 'Created sequence: ihw.%', seq_name;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 2. Main Trigger Function (with EXPLICIT ihw schema references)
-- ============================================================================

CREATE OR REPLACE FUNCTION ihw.generate_zaak_identificatie()
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
  
  -- Ensure sequence exists for this gemeente + year (EXPLICIT schema call)
  PERFORM ihw.ensure_zaak_sequence(gemeente_code);
  
  -- Get sequence name and next value
  seq_name := ihw.get_zaak_sequence_name(gemeente_code);
  year := to_char(CURRENT_DATE, 'YYYY');
  
  -- Determine prefix based on type (if available)
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
  EXECUTE FUNCTION ihw.generate_zaak_identificatie();

-- ============================================================================
-- 4. Verification Query
-- ============================================================================

DO $$
DECLARE
  func_count int;
BEGIN
  -- Check if all functions exist in ihw schema
  SELECT COUNT(*) INTO func_count
  FROM pg_proc p
  JOIN pg_namespace n ON p.pronamespace = n.oid
  WHERE n.nspname = 'ihw' 
    AND p.proname IN ('get_zaak_sequence_name', 'ensure_zaak_sequence', 'generate_zaak_identificatie');
  
  RAISE NOTICE '';
  RAISE NOTICE '════════════════════════════════════════════════════════════';
  RAISE NOTICE '  Schema Fix Applied';
  RAISE NOTICE '════════════════════════════════════════════════════════════';
  RAISE NOTICE '';
  RAISE NOTICE 'Functions found in ihw schema: %', func_count;
  
  IF func_count = 3 THEN
    RAISE NOTICE '✅ All 3 functions correctly in ihw schema';
  ELSE
    RAISE WARNING '⚠️  Expected 3 functions, found %', func_count;
  END IF;
  
  -- Check trigger
  IF EXISTS (
    SELECT 1 FROM pg_trigger t
    JOIN pg_class c ON t.tgrelid = c.oid
    JOIN pg_namespace n ON c.relnamespace = n.oid
    WHERE n.nspname = 'ihw' 
      AND c.relname = 'dossier'
      AND t.tgname = 'set_zaak_identificatie'
  ) THEN
    RAISE NOTICE '✅ Trigger set_zaak_identificatie exists';
  ELSE
    RAISE WARNING '⚠️  Trigger not found';
  END IF;
  
  RAISE NOTICE '';
  RAISE NOTICE 'Ready to test!';
  RAISE NOTICE '';
END $$;

