-- Fix: Use correct column name beedigd_vanaf instead of beedigd_datum

DROP TRIGGER IF EXISTS trg_ceremonie_babs_validate ON ihw.ceremonie;

CREATE OR REPLACE FUNCTION ihw.trg_ceremonie_babs_validate()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    babs_beedigd_date DATE;
    min_aanvraag_datum DATE;
BEGIN
    -- Skip if no BABS selected
    IF NEW.babs_id IS NULL THEN
        RETURN NEW;
    END IF;

    -- Get BABS beëdigd datum (correct column name: beedigd_vanaf)
    SELECT beedigd_vanaf INTO babs_beedigd_date
    FROM ihw.babs
    WHERE id = NEW.babs_id;

    -- Check if BABS exists and is sworn in
    IF babs_beedigd_date IS NULL THEN
        -- BABS exists but not yet sworn in - allow for now (will be checked later)
        RETURN NEW;
    END IF;

    -- ⚠️ TESTING MODE: Reduced to 1 week (normally 4 months)
    min_aanvraag_datum := NEW.datum - INTERVAL '1 week';
    
    IF babs_beedigd_date > min_aanvraag_datum THEN
        RAISE EXCEPTION 'BABS aanvraag te laat: BABS moet beëdigd zijn voor % (ceremonie op %)', min_aanvraag_datum::DATE, NEW.datum::DATE
            USING ERRCODE = '23514',
                  HINT = 'BABS must be sworn in at least 1 week before ceremony (testing mode)';
    END IF;

    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_ceremonie_babs_validate
    BEFORE INSERT OR UPDATE OF datum, babs_id ON ihw.ceremonie
    FOR EACH ROW
    EXECUTE FUNCTION ihw.trg_ceremonie_babs_validate();

COMMENT ON FUNCTION ihw.trg_ceremonie_babs_validate() IS '⚠️ TESTING MODE: Validate BABS sworn in 1 week before ceremony (should be 4 months in production)';
