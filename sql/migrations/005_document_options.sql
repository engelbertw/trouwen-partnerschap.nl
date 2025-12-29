-- ============================================================================
-- Document Opties (Configurable document types per gemeente)
-- ============================================================================

SET search_path TO ihw, public;

-- Create document_optie table
CREATE TABLE IF NOT EXISTS ihw.document_optie (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    gemeente_oin TEXT NOT NULL REFERENCES ihw.gemeente(oin) ON DELETE CASCADE,
    
    -- Document details
    code TEXT NOT NULL,  -- Unique code: 'trouwboekje', 'huwelijksakte', etc.
    naam TEXT NOT NULL,
    omschrijving TEXT,
    papier_type ihw.papier_type NOT NULL,
    
    -- Pricing
    prijs_cents INTEGER NOT NULL DEFAULT 0,
    gratis BOOLEAN NOT NULL DEFAULT FALSE,
    verplicht BOOLEAN NOT NULL DEFAULT FALSE,
    
    -- Status
    actief BOOLEAN NOT NULL DEFAULT TRUE,
    volgorde SMALLINT NOT NULL DEFAULT 1,
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT chk_prijs_cents CHECK (prijs_cents >= 0),
    CONSTRAINT chk_gratis_prijs CHECK (
        (gratis = TRUE AND prijs_cents = 0) OR
        (gratis = FALSE)
    ),
    CONSTRAINT uq_gemeente_code UNIQUE (gemeente_oin, code)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_document_optie_gemeente ON ihw.document_optie(gemeente_oin);
CREATE INDEX IF NOT EXISTS idx_document_optie_actief ON ihw.document_optie(gemeente_oin, actief) WHERE actief = TRUE;
CREATE INDEX IF NOT EXISTS idx_document_optie_volgorde ON ihw.document_optie(gemeente_oin, volgorde);

-- Comments
COMMENT ON TABLE ihw.document_optie IS 'Configureerbare documentopties per gemeente';
COMMENT ON COLUMN ihw.document_optie.code IS 'Unieke code voor dit type document';
COMMENT ON COLUMN ihw.document_optie.prijs_cents IS 'Prijs in eurocenten (bijv. 1710 = €17,10)';
COMMENT ON COLUMN ihw.document_optie.gratis IS 'Of dit document gratis is';
COMMENT ON COLUMN ihw.document_optie.verplicht IS 'Of dit document verplicht/standaard is';
COMMENT ON COLUMN ihw.document_optie.papier_type IS 'Koppeling naar papier_type enum';

-- ============================================================================
-- Seed default document options (per gemeente)
-- ============================================================================

-- Function to seed document options for a gemeente
CREATE OR REPLACE FUNCTION ihw.seed_default_document_options(p_gemeente_oin TEXT)
RETURNS VOID AS $$
BEGIN
    -- Only seed if no options exist yet
    IF NOT EXISTS (SELECT 1 FROM ihw.document_optie WHERE gemeente_oin = p_gemeente_oin) THEN
        INSERT INTO ihw.document_optie (gemeente_oin, code, naam, omschrijving, papier_type, prijs_cents, gratis, verplicht, volgorde)
        VALUES
            -- Standaard trouwboekje (verplicht, gratis)
            (p_gemeente_oin, 'trouwboekje', 'Trouwboekje', 'Een mooi vormgegeven boekje waarin uw huwelijk officieel wordt vastgelegd.', 'trouwboekje', 0, TRUE, TRUE, 1),
            
            -- Huwelijksakte (optioneel, €17,10)
            (p_gemeente_oin, 'huwelijksakte', 'Huwelijksakte', 'Het officiële document van uw huwelijk.', 'geboorteakte', 1710, FALSE, FALSE, 2),
            
            -- Internationale huwelijksakte (optioneel, €17,10)
            (p_gemeente_oin, 'internationale-huwelijksakte', 'Internationale huwelijksakte', 'Een officieel document voor gebruik in het buitenland, internationaal geldig en in meerdere talen.', 'nationaliteitsverklaring', 1710, FALSE, FALSE, 3),
            
            -- Extra exemplaar trouwboekje (optioneel, €24,50)
            (p_gemeente_oin, 'extra-trouwboekje', 'Extra exemplaar trouwboekje', 'Een extra exemplaar van het trouwboekje, bijvoorbeeld voor familie of als bewaarexemplaar.', 'trouwboekje', 2450, FALSE, FALSE, 4);
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Seed for existing gemeenten
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN SELECT oin FROM ihw.gemeente WHERE actief = TRUE
    LOOP
        PERFORM ihw.seed_default_document_options(r.oin);
    END LOOP;
END;
$$;

-- ============================================================================
-- Trigger to auto-seed document options for new gemeenten
-- ============================================================================

CREATE OR REPLACE FUNCTION ihw.trigger_seed_document_options()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM ihw.seed_default_document_options(NEW.oin);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_gemeente_seed_documents
    AFTER INSERT ON ihw.gemeente
    FOR EACH ROW
    EXECUTE FUNCTION ihw.trigger_seed_document_options();

-- Grant permissions
GRANT SELECT ON ihw.document_optie TO loket_readonly;
GRANT SELECT, INSERT, UPDATE, DELETE ON ihw.document_optie TO app_rw;
GRANT ALL ON ihw.document_optie TO hb_admin;

