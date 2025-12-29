-- ============================================================================
-- ihuwelijk Triggers and Business Logic Functions
-- Version: 1.0
-- Description: Business rules, showstoppers, and validation logic
-- ============================================================================

SET search_path TO ihw, public;

-- ============================================================================
-- TRIGGER: Auto-update updated_at timestamps
-- ============================================================================

CREATE OR REPLACE FUNCTION ihw.trg_update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables with updated_at
DO $$
DECLARE
    r record;
BEGIN
    FOR r IN 
        SELECT table_name 
        FROM information_schema.columns 
        WHERE table_schema = 'ihw' 
        AND column_name = 'updated_at'
    LOOP
        EXECUTE format('
            CREATE TRIGGER trg_%I_updated_at
            BEFORE UPDATE ON ihw.%I
            FOR EACH ROW
            EXECUTE FUNCTION ihw.trg_update_updated_at()
        ', r.table_name, r.table_name);
    END LOOP;
END $$;

COMMENT ON FUNCTION ihw.trg_update_updated_at() IS 'Auto-update updated_at timestamp on row modification';

-- ============================================================================
-- TRIGGER: Prevent type_ceremonie change after lock
-- ============================================================================

CREATE OR REPLACE FUNCTION ihw.trg_dossier_lock_type_ceremonie()
RETURNS TRIGGER AS $$
BEGIN
    -- If dossier is locked, prevent changing type_ceremonie_id
    IF OLD.status = 'locked' AND NEW.type_ceremonie_id IS DISTINCT FROM OLD.type_ceremonie_id THEN
        RAISE EXCEPTION 'Cannot change type_ceremonie_id after dossier is locked'
            USING ERRCODE = 'integrity_constraint_violation',
                  HINT = 'Type ceremonie cannot be modified once dossier is definitively confirmed';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_dossier_lock_type_ceremonie
    BEFORE UPDATE ON ihw.dossier
    FOR EACH ROW
    EXECUTE FUNCTION ihw.trg_dossier_lock_type_ceremonie();

COMMENT ON FUNCTION ihw.trg_dossier_lock_type_ceremonie() IS 'Prevent type_ceremonie changes after dossier lock';

-- ============================================================================
-- TRIGGER: Validate ready_for_payment status
-- ============================================================================

CREATE OR REPLACE FUNCTION ihw.trg_dossier_ready_for_payment()
RETURNS TRIGGER AS $$
DECLARE
    incomplete_blocks int;
BEGIN
    -- Check if moving to ready_for_payment status
    IF NEW.status = 'ready_for_payment' AND OLD.status != 'ready_for_payment' THEN
        -- Count incomplete required blocks
        SELECT COUNT(*) INTO incomplete_blocks
        FROM ihw.dossier_block
        WHERE dossier_id = NEW.id
          AND required = true
          AND complete = false;
        
        IF incomplete_blocks > 0 THEN
            RAISE EXCEPTION 'Cannot set status to ready_for_payment: % required block(s) incomplete', incomplete_blocks
                USING ERRCODE = 'check_violation',
                      HINT = 'All required blocks must be complete before payment';
        END IF;
        
        -- Set timestamp
        NEW.ready_for_payment_at = CURRENT_TIMESTAMP;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_dossier_ready_for_payment
    BEFORE UPDATE ON ihw.dossier
    FOR EACH ROW
    EXECUTE FUNCTION ihw.trg_dossier_ready_for_payment();

COMMENT ON FUNCTION ihw.trg_dossier_ready_for_payment() IS 'Validate all required blocks are complete before ready_for_payment';

-- ============================================================================
-- TRIGGER: Validate dossier lock
-- ============================================================================

CREATE OR REPLACE FUNCTION ihw.trg_dossier_lock()
RETURNS TRIGGER AS $$
DECLARE
    payment_rec record;
BEGIN
    -- Check if moving to locked status
    IF NEW.status = 'locked' AND OLD.status != 'locked' THEN
        -- Verify payment exists and is paid or waived
        SELECT status INTO payment_rec
        FROM ihw.payment
        WHERE dossier_id = NEW.id
          AND status IN ('paid', 'waived')
        LIMIT 1;
        
        IF NOT FOUND THEN
            RAISE EXCEPTION 'Cannot lock dossier: payment not completed'
                USING ERRCODE = 'check_violation',
                      HINT = 'Dossier must have a paid or waived payment before locking';
        END IF;
        
        -- Set lock timestamp
        NEW.locked_at = CURRENT_TIMESTAMP;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_dossier_lock
    BEFORE UPDATE ON ihw.dossier
    FOR EACH ROW
    EXECUTE FUNCTION ihw.trg_dossier_lock();

COMMENT ON FUNCTION ihw.trg_dossier_lock() IS 'Validate payment is complete before locking dossier';

-- ============================================================================
-- TRIGGER: Prevent ceremony changes after deadline (except hb_admin)
-- ============================================================================

CREATE OR REPLACE FUNCTION ihw.trg_ceremonie_wijziging_deadline()
RETURNS TRIGGER AS $$
DECLARE
    is_admin boolean;
BEGIN
    -- Check if user has hb_admin role
    is_admin := pg_has_role(current_user, 'hb_admin', 'MEMBER');
    
    -- If not admin and past deadline, block changes
    IF NOT is_admin AND CURRENT_TIMESTAMP > OLD.wijzigbaar_tot THEN
        -- Check if significant fields are being changed
        IF NEW.locatie_id IS DISTINCT FROM OLD.locatie_id OR
           NEW.datum IS DISTINCT FROM OLD.datum OR
           NEW.start_tijd IS DISTINCT FROM OLD.start_tijd OR
           NEW.babs_id IS DISTINCT FROM OLD.babs_id THEN
            RAISE EXCEPTION 'Cannot modify ceremony after wijzigbaar_tot deadline: %', OLD.wijzigbaar_tot
                USING ERRCODE = 'integrity_constraint_violation',
                      HINT = 'Citizen can no longer modify ceremony details';
        END IF;
    END IF;
    
    -- Track who made the change
    IF NEW.locatie_id IS DISTINCT FROM OLD.locatie_id OR
       NEW.datum IS DISTINCT FROM OLD.datum OR
       NEW.start_tijd IS DISTINCT FROM OLD.start_tijd THEN
        NEW.laatste_wijziging = CURRENT_TIMESTAMP;
        NEW.gewijzigd_door = current_user;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_ceremonie_wijziging_deadline
    BEFORE UPDATE ON ihw.ceremonie
    FOR EACH ROW
    EXECUTE FUNCTION ihw.trg_ceremonie_wijziging_deadline();

COMMENT ON FUNCTION ihw.trg_ceremonie_wijziging_deadline() IS 'Prevent ceremony changes after deadline (except for hb_admin)';

-- ============================================================================
-- TRIGGER: Aankondiging validation (showstoppers)
-- ============================================================================

CREATE OR REPLACE FUNCTION ihw.trg_aankondiging_validate()
RETURNS TRIGGER AS $$
DECLARE
    partner1_puntouders boolean;
    partner2_puntouders boolean;
    invalid_reasons text[] := ARRAY[]::text[];
BEGIN
    -- Check for showstoppers
    
    -- 1. Already married
    IF NEW.reeds_gehuwd = true THEN
        invalid_reasons := array_append(invalid_reasons, 'Een of beide partners zijn reeds gehuwd');
    END IF;
    
    -- 2. Neither partner lives in municipality
    IF NEW.beiden_niet_woonachtig = true THEN
        invalid_reasons := array_append(invalid_reasons, 'Geen van beide partners is woonachtig in de gemeente');
    END IF;
    
    -- 3. Check for puntouders (unknown parents)
    SELECT 
        bool_or(CASE WHEN sequence = 1 THEN ouders_onbekend ELSE false END),
        bool_or(CASE WHEN sequence = 2 THEN ouders_onbekend ELSE false END)
    INTO partner1_puntouders, partner2_puntouders
    FROM ihw.partner
    WHERE dossier_id = NEW.dossier_id;
    
    IF partner1_puntouders = true OR partner2_puntouders = true THEN
        invalid_reasons := array_append(invalid_reasons, 'Een of beide partners hebben onbekende ouders (puntouders)');
    END IF;
    
    -- Set validity and reason
    IF array_length(invalid_reasons, 1) > 0 THEN
        NEW.valid = false;
        NEW.invalid_reason = array_to_string(invalid_reasons, '; ');
    ELSE
        NEW.valid = true;
        NEW.invalid_reason = NULL;
        NEW.gevalideerd_op = CURRENT_TIMESTAMP;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_aankondiging_validate
    BEFORE INSERT OR UPDATE ON ihw.aankondiging
    FOR EACH ROW
    EXECUTE FUNCTION ihw.trg_aankondiging_validate();

COMMENT ON FUNCTION ihw.trg_aankondiging_validate() IS 'Validate aankondiging and set showstoppers';

-- ============================================================================
-- TRIGGER: BABS validation (own BABS must be sworn in 4+ months before)
-- ============================================================================

CREATE OR REPLACE FUNCTION ihw.trg_ceremonie_babs_validate()
RETURNS TRIGGER AS $$
DECLARE
    babs_rec record;
    type_rec record;
    min_aanvraag_datum date;
BEGIN
    -- Only validate if BABS is assigned
    IF NEW.babs_id IS NULL THEN
        RETURN NEW;
    END IF;
    
    -- Get BABS details
    SELECT * INTO babs_rec
    FROM ihw.babs
    WHERE id = NEW.babs_id;
    
    -- Get ceremony type details
    SELECT * INTO type_rec
    FROM ihw.type_ceremonie tc
    JOIN ihw.dossier d ON d.type_ceremonie_id = tc.id
    WHERE d.id = NEW.dossier_id;
    
    -- If this is a type that allows own BABS
    IF type_rec.eigen_babs_toegestaan = true THEN
        -- BABS must be 'beedigd'
        IF babs_rec.status != 'beedigd' THEN
            RAISE EXCEPTION 'BABS moet beëdigd zijn: % (status: %)', babs_rec.naam, babs_rec.status
                USING ERRCODE = 'check_violation',
                      HINT = 'Eigen BABS must have status beedigd';
        END IF;
        
        -- BABS must still be valid at ceremony date
        IF babs_rec.beedigd_tot < NEW.datum THEN
            RAISE EXCEPTION 'BABS beëdiging verloopt voor ceremonie: % (geldig tot %)', babs_rec.naam, babs_rec.beedigd_tot
                USING ERRCODE = 'check_violation',
                      HINT = 'BABS must be valid on ceremony date';
        END IF;
        
        -- Application must be at least 4 months before ceremony
        min_aanvraag_datum := NEW.datum - INTERVAL '4 months';
        IF babs_rec.aanvraag_datum IS NULL OR babs_rec.aanvraag_datum > min_aanvraag_datum THEN
            RAISE EXCEPTION 'BABS aanvraag te laat: moet minimaal 4 maanden voor ceremonie (%)', min_aanvraag_datum
                USING ERRCODE = 'check_violation',
                      HINT = 'BABS application must be submitted at least 4 months before ceremony';
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_ceremonie_babs_validate
    BEFORE INSERT OR UPDATE ON ihw.ceremonie
    FOR EACH ROW
    EXECUTE FUNCTION ihw.trg_ceremonie_babs_validate();

COMMENT ON FUNCTION ihw.trg_ceremonie_babs_validate() IS 'Validate BABS is properly sworn in at least 4 months before ceremony';

-- ============================================================================
-- TRIGGER: Getuigen count validation (2-4 witnesses)
-- ============================================================================

CREATE OR REPLACE FUNCTION ihw.trg_getuige_count_validate()
RETURNS TRIGGER AS $$
DECLARE
    getuige_count int;
    max_getuigen int;
BEGIN
    -- Get max witnesses from ceremony type
    SELECT tc.max_getuigen INTO max_getuigen
    FROM ihw.type_ceremonie tc
    JOIN ihw.dossier d ON d.type_ceremonie_id = tc.id
    WHERE d.id = COALESCE(NEW.dossier_id, OLD.dossier_id);
    
    -- Count witnesses for this dossier
    SELECT COUNT(*) INTO getuige_count
    FROM ihw.getuige
    WHERE dossier_id = COALESCE(NEW.dossier_id, OLD.dossier_id)
      AND (TG_OP != 'DELETE' OR id != OLD.id);
    
    -- For INSERT/UPDATE, add the new one
    IF TG_OP IN ('INSERT', 'UPDATE') THEN
        getuige_count := getuige_count + 1;
    END IF;
    
    -- Validate count
    IF getuige_count < 2 THEN
        RAISE EXCEPTION 'Minimaal 2 getuigen vereist (huidige: %)', getuige_count
            USING ERRCODE = 'check_violation';
    END IF;
    
    IF getuige_count > COALESCE(max_getuigen, 4) THEN
        RAISE EXCEPTION 'Maximaal % getuigen toegestaan (huidige: %)', max_getuigen, getuige_count
            USING ERRCODE = 'check_violation';
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Note: This trigger is informative but can be bypassed during initial data entry
-- The check should be enforced when marking the getuigen block as complete

COMMENT ON FUNCTION ihw.trg_getuige_count_validate() IS 'Validate witness count is between 2 and max_getuigen';

-- ============================================================================
-- TRIGGER: Block completion validation
-- ============================================================================

CREATE OR REPLACE FUNCTION ihw.trg_block_complete_validate()
RETURNS TRIGGER AS $$
DECLARE
    is_valid boolean := true;
    validation_message text;
BEGIN
    -- Only validate when marking block as complete
    IF NEW.complete = true AND OLD.complete = false THEN
        
        -- Validate based on block code
        CASE NEW.code
            WHEN 'aankondiging' THEN
                -- Check aankondiging is valid
                SELECT a.valid INTO is_valid
                FROM ihw.aankondiging a
                WHERE a.dossier_id = NEW.dossier_id;
                
                IF is_valid = false THEN
                    validation_message := 'Aankondiging is niet geldig (showstoppers aanwezig)';
                END IF;
                
            WHEN 'ceremonie' THEN
                -- Check ceremony details are complete
                IF NOT EXISTS (
                    SELECT 1 FROM ihw.ceremonie
                    WHERE dossier_id = NEW.dossier_id
                      AND locatie_id IS NOT NULL
                      AND datum IS NOT NULL
                ) THEN
                    is_valid := false;
                    validation_message := 'Ceremonie details zijn niet volledig';
                END IF;
                
            WHEN 'getuigen' THEN
                -- Check witness count (2-4)
                DECLARE
                    getuige_count int;
                    max_getuigen int;
                BEGIN
                    SELECT COUNT(*), tc.max_getuigen
                    INTO getuige_count, max_getuigen
                    FROM ihw.getuige g
                    JOIN ihw.dossier d ON d.id = g.dossier_id
                    JOIN ihw.type_ceremonie tc ON tc.id = d.type_ceremonie_id
                    WHERE g.dossier_id = NEW.dossier_id
                    GROUP BY tc.max_getuigen;
                    
                    IF getuige_count < 2 OR getuige_count > COALESCE(max_getuigen, 4) THEN
                        is_valid := false;
                        validation_message := format('Aantal getuigen moet tussen 2 en %s zijn (huidige: %s)', max_getuigen, getuige_count);
                    END IF;
                END;
                
            WHEN 'papieren' THEN
                -- Check all required documents are approved
                IF EXISTS (
                    SELECT 1 FROM ihw.papier
                    WHERE dossier_id = NEW.dossier_id
                      AND status IN ('ontbreekt', 'afgekeurd')
                ) THEN
                    is_valid := false;
                    validation_message := 'Niet alle documenten zijn goedgekeurd';
                END IF;
                
            WHEN 'betaling' THEN
                -- Check payment is completed
                IF NOT EXISTS (
                    SELECT 1 FROM ihw.payment
                    WHERE dossier_id = NEW.dossier_id
                      AND status IN ('paid', 'waived')
                ) THEN
                    is_valid := false;
                    validation_message := 'Betaling is niet voltooid';
                END IF;
                
            ELSE
                -- Unknown block code
                NULL;
        END CASE;
        
        -- Raise exception if validation failed
        IF is_valid = false THEN
            RAISE EXCEPTION 'Cannot complete block %: %', NEW.code, validation_message
                USING ERRCODE = 'check_violation';
        END IF;
        
        -- Set completion metadata
        NEW.completed_at = CURRENT_TIMESTAMP;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_block_complete_validate
    BEFORE UPDATE ON ihw.dossier_block
    FOR EACH ROW
    EXECUTE FUNCTION ihw.trg_block_complete_validate();

COMMENT ON FUNCTION ihw.trg_block_complete_validate() IS 'Validate block requirements before marking as complete';

-- ============================================================================
-- FUNCTION: Initialize dossier blocks
-- ============================================================================

CREATE OR REPLACE FUNCTION ihw.initialize_dossier_blocks(p_dossier_id uuid)
RETURNS void AS $$
BEGIN
    INSERT INTO ihw.dossier_block (dossier_id, code, required)
    VALUES
        (p_dossier_id, 'aankondiging', true),
        (p_dossier_id, 'ceremonie', true),
        (p_dossier_id, 'getuigen', true),
        (p_dossier_id, 'papieren', true),
        (p_dossier_id, 'betaling', true)
    ON CONFLICT (dossier_id, code) DO NOTHING;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION ihw.initialize_dossier_blocks(uuid) IS 'Initialize all required blocks for a new dossier';

-- ============================================================================
-- Triggers and functions complete
-- ============================================================================

\echo '✓ Triggers created: dossier lock, ceremony deadline, aankondiging validation, BABS validation'
\echo '✓ Business rules implemented: block validation, witness count, showstoppers'
\echo ''
\echo 'Next: Run 050_views.sql'

