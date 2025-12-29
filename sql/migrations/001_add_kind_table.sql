-- ============================================================================
-- Add 'kind' table for children from previous marriages
-- Version: 1.0
-- Description: Tracks children from previous marriages for both partners
-- ============================================================================

SET search_path TO ihw, public;

-- ============================================================================
-- TABLE: kind (children from previous marriages)
-- ============================================================================

CREATE TABLE ihw.kind (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    dossier_id uuid NOT NULL REFERENCES ihw.dossier(id) ON DELETE CASCADE,
    gemeente_oin text NOT NULL REFERENCES ihw.gemeente(oin),
    partner_id uuid NOT NULL REFERENCES ihw.partner(id) ON DELETE CASCADE,
    
    -- Child details
    voornamen text NOT NULL,
    achternaam text NOT NULL,
    geboortedatum date NOT NULL,
    
    -- Metadata
    created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT chk_geboortedatum_kind CHECK (geboortedatum <= CURRENT_DATE)
);

CREATE INDEX idx_kind_dossier ON ihw.kind(dossier_id);
CREATE INDEX idx_kind_partner ON ihw.kind(partner_id);
CREATE INDEX idx_kind_gemeente ON ihw.kind(gemeente_oin);

COMMENT ON TABLE ihw.kind IS 'Kinderen uit een ander huwelijk (voor aankondiging)';
COMMENT ON COLUMN ihw.kind.partner_id IS 'Welke partner heeft dit kind uit een vorig huwelijk';
COMMENT ON COLUMN ihw.kind.geboortedatum IS 'Geboortedatum van het kind';

-- Grant permissions
GRANT SELECT ON ihw.kind TO loket_readonly;
GRANT SELECT, INSERT, UPDATE, DELETE ON ihw.kind TO app_rw;
GRANT ALL ON ihw.kind TO hb_admin;
