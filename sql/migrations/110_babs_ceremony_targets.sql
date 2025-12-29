-- =====================================================
-- BABS Ceremony Targets
-- File: sql/migrations/110_babs_ceremony_targets.sql
-- =====================================================

\echo '🎯 Creating babs_gemeente_target table for ceremony targets...'

-- Create target table for BABS yearly ceremony goals per gemeente
CREATE TABLE ihw.babs_gemeente_target (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  babs_id uuid NOT NULL REFERENCES ihw.babs(id) ON DELETE CASCADE,
  gemeente_oin text NOT NULL REFERENCES ihw.gemeente(oin) ON DELETE CASCADE,
  jaar integer NOT NULL,
  target_ceremonies integer NOT NULL,
  created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  -- Een BABS kan maar één target per gemeente per jaar hebben
  CONSTRAINT uq_babs_gemeente_jaar UNIQUE(babs_id, gemeente_oin, jaar),
  
  -- Target moet positief zijn
  CONSTRAINT chk_target_positive CHECK (target_ceremonies > 0),
  
  -- Jaar moet redelijk zijn (niet in verre verleden of toekomst)
  CONSTRAINT chk_jaar_range CHECK (jaar >= 2024 AND jaar <= 2050)
);

-- Indexes voor performance
CREATE INDEX idx_babs_gemeente_target_jaar ON ihw.babs_gemeente_target(jaar);
CREATE INDEX idx_babs_gemeente_target_babs ON ihw.babs_gemeente_target(babs_id);
CREATE INDEX idx_babs_gemeente_target_gemeente ON ihw.babs_gemeente_target(gemeente_oin);
-- Composite index voor huidige jaar queries
CREATE INDEX idx_babs_gemeente_target_lookup ON ihw.babs_gemeente_target(babs_id, gemeente_oin, jaar);

-- Comments
COMMENT ON TABLE ihw.babs_gemeente_target IS 
  'Jaarlijkse ceremony targets voor BABS per gemeente. Gebruikt voor voortgangsrapportage.';

COMMENT ON COLUMN ihw.babs_gemeente_target.jaar IS 
  'Het kalenderjaar waarvoor deze target geldt (bijv. 2025)';

COMMENT ON COLUMN ihw.babs_gemeente_target.target_ceremonies IS 
  'Aantal ceremonies dat deze BABS naar verwachting dit jaar voor deze gemeente uitvoert';

-- Grant permissions
GRANT SELECT ON ihw.babs_gemeente_target TO loket_readonly;
GRANT SELECT, INSERT, UPDATE, DELETE ON ihw.babs_gemeente_target TO app_rw;
GRANT ALL ON ihw.babs_gemeente_target TO hb_admin;

\echo '✅ babs_gemeente_target table created successfully!'
\echo 'ℹ️  BABS can now have yearly ceremony targets per gemeente'

