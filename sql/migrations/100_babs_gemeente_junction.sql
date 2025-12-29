-- =====================================================
-- Multi-Gemeente BABS Support
-- File: sql/migrations/100_babs_gemeente_junction.sql
-- =====================================================

\echo '🔗 Creating babs_gemeente junction table for multi-gemeente support...'

-- Create junction table for BABS working in multiple gemeenten
CREATE TABLE ihw.babs_gemeente (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  babs_id uuid NOT NULL REFERENCES ihw.babs(id) ON DELETE CASCADE,
  gemeente_oin text NOT NULL REFERENCES ihw.gemeente(oin) ON DELETE CASCADE,
  actief boolean NOT NULL DEFAULT true,
  actief_vanaf date NOT NULL DEFAULT CURRENT_DATE,
  actief_tot date,
  opmerkingen text,
  toegevoegd_door text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  -- Een BABS kan maar één keer per gemeente toegevoegd worden
  CONSTRAINT uq_babs_gemeente UNIQUE(babs_id, gemeente_oin),
  
  -- Als actief_tot is ingevuld, moet die na actief_vanaf zijn
  CONSTRAINT chk_babs_gemeente_periode CHECK (
    actief_tot IS NULL OR actief_tot > actief_vanaf
  )
);

-- Indexes voor performance
CREATE INDEX idx_babs_gemeente_babs ON ihw.babs_gemeente(babs_id) WHERE actief = true;
CREATE INDEX idx_babs_gemeente_gemeente ON ihw.babs_gemeente(gemeente_oin) WHERE actief = true;
CREATE INDEX idx_babs_gemeente_actief_periode ON ihw.babs_gemeente(actief_vanaf, actief_tot) 
  WHERE actief = true;

-- Comments
COMMENT ON TABLE ihw.babs_gemeente IS 
  'Koppeltabel: welke BABS werkt voor welke gemeente(n). Een BABS kan voor meerdere gemeenten werken.';

COMMENT ON COLUMN ihw.babs_gemeente.actief IS 
  'Of deze BABS-gemeente koppeling actief is. Gebruik dit om een BABS tijdelijk te deactiveren voor een gemeente.';

COMMENT ON COLUMN ihw.babs_gemeente.actief_vanaf IS 
  'Vanaf welke datum deze BABS beschikbaar is voor deze gemeente.';

COMMENT ON COLUMN ihw.babs_gemeente.actief_tot IS 
  'Tot welke datum deze BABS beschikbaar is (optioneel). NULL = onbeperkt.';

COMMENT ON COLUMN ihw.babs_gemeente.toegevoegd_door IS 
  'Clerk user ID van de gemeente medewerker die deze BABS heeft toegevoegd.';

-- Grant permissions
GRANT SELECT ON ihw.babs_gemeente TO loket_readonly;
GRANT SELECT, INSERT, UPDATE ON ihw.babs_gemeente TO app_rw;
GRANT ALL ON ihw.babs_gemeente TO hb_admin;

\echo '✅ babs_gemeente junction table created successfully!'
\echo 'ℹ️  BABS can now work for multiple gemeenten'

