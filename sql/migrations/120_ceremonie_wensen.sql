-- =====================================================
-- Ceremonie Wensen (Ceremony Wishes)
-- File: sql/migrations/120_ceremonie_wensen.sql
-- =====================================================

\echo 'Migration 120: Create ceremonie_wens table'

-- ============================================================================
-- Ceremonie Wens (lookup table for ceremony wishes)
-- ============================================================================

CREATE TABLE IF NOT EXISTS ihw.ceremonie_wens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Basic info
  code text NOT NULL UNIQUE,
  naam text NOT NULL,
  omschrijving text NOT NULL,
  
  -- Pricing
  prijs_euro numeric(10, 2) NOT NULL DEFAULT 0.00,
  gratis boolean NOT NULL DEFAULT false,
  
  -- Availability
  actief boolean NOT NULL DEFAULT true,
  beschikbaar_voor_types jsonb DEFAULT '[]'::jsonb, -- Array van type_ceremonie codes waar deze wens voor beschikbaar is
  
  -- Display
  volgorde integer NOT NULL DEFAULT 0,
  icoon text, -- Optional icon name/class
  
  -- Metadata
  created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT chk_prijs_consistent CHECK (
    (gratis = true AND prijs_euro = 0) OR 
    (gratis = false AND prijs_euro >= 0)
  ),
  CONSTRAINT chk_beschikbaar_voor_types_array CHECK (jsonb_typeof(beschikbaar_voor_types) = 'array')
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_ceremonie_wens_actief 
  ON ihw.ceremonie_wens(actief) WHERE actief = true;

CREATE INDEX IF NOT EXISTS idx_ceremonie_wens_volgorde 
  ON ihw.ceremonie_wens(volgorde, naam);

-- Comments
COMMENT ON TABLE ihw.ceremonie_wens IS 
  'Lookup tabel voor standaard ceremonie wensen die burgers kunnen selecteren';

COMMENT ON COLUMN ihw.ceremonie_wens.code IS 
  'Unieke code voor identificatie (bijv. RINGEN, SPEECH, MUZIEK)';

COMMENT ON COLUMN ihw.ceremonie_wens.beschikbaar_voor_types IS 
  'Array van type_ceremonie codes waar deze wens voor beschikbaar is (leeg array = beschikbaar voor alle types)';

-- ============================================================================
-- Ceremonie Wens Selectie (many-to-many between ceremonie and wensen)
-- ============================================================================

CREATE TABLE IF NOT EXISTS ihw.ceremonie_wens_selectie (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Relations
  ceremonie_id uuid NOT NULL REFERENCES ihw.ceremonie(id) ON DELETE CASCADE,
  wens_id uuid NOT NULL REFERENCES ihw.ceremonie_wens(id) ON DELETE CASCADE,
  
  -- Custom details (if user wants to add specifics)
  notities text, -- Custom notes from the couple
  
  -- Metadata
  created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE(ceremonie_id, wens_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_ceremonie_wens_selectie_ceremonie 
  ON ihw.ceremonie_wens_selectie(ceremonie_id);

CREATE INDEX IF NOT EXISTS idx_ceremonie_wens_selectie_wens 
  ON ihw.ceremonie_wens_selectie(wens_id);

-- Comments
COMMENT ON TABLE ihw.ceremonie_wens_selectie IS 
  'Geselecteerde wensen per ceremonie (many-to-many koppeling)';

-- ============================================================================
-- Ceremonie Custom Wens (free text wishes)
-- ============================================================================

CREATE TABLE IF NOT EXISTS ihw.ceremonie_custom_wens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Relations
  ceremonie_id uuid NOT NULL REFERENCES ihw.ceremonie(id) ON DELETE CASCADE,
  
  -- Content
  wens_tekst text NOT NULL,
  
  -- Status
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'needs_clarification')),
  gemeente_notities text, -- Notes from gemeente about this custom wish
  
  -- Metadata
  created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_ceremonie_custom_wens_ceremonie 
  ON ihw.ceremonie_custom_wens(ceremonie_id);

CREATE INDEX IF NOT EXISTS idx_ceremonie_custom_wens_status 
  ON ihw.ceremonie_custom_wens(status);

-- Comments
COMMENT ON TABLE ihw.ceremonie_custom_wens IS 
  'Vrije tekst wensen van burgers die niet in de standaard lijst staan';

\echo '✅ Created ceremonie_wens tables'

