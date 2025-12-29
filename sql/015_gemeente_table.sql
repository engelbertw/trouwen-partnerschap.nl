-- =====================================================
-- Multi-Tenancy Migration: Add gemeente Table
-- File: sql/015_gemeente_table.sql
-- =====================================================

\echo '🏛️  Creating gemeente table for multi-tenancy...'

-- Create gemeente table
CREATE TABLE ihw.gemeente (
  oin text PRIMARY KEY,
  naam text NOT NULL,
  gemeente_code text UNIQUE NOT NULL,
  actief boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  -- OIN must be exactly 20 digits
  CONSTRAINT chk_gemeente_oin_format CHECK (oin ~ '^\d{20}$'),
  
  -- Gemeente code must be 4 digits (CBS code)
  CONSTRAINT chk_gemeente_code_format CHECK (gemeente_code ~ '^\d{4}$')
);

-- Index on active gemeenten
CREATE INDEX idx_gemeente_actief ON ihw.gemeente(actief) WHERE actief = true;

-- Comments
COMMENT ON TABLE ihw.gemeente IS 
  'Master tabel van gemeenten. Elk dossier behoort tot één gemeente (multi-tenancy).';

COMMENT ON COLUMN ihw.gemeente.oin IS 
  'Organisatie Identificatie Nummer (20 cijfers). Uniek per Nederlandse overheidsorganisatie. Zie https://www.logius.nl/diensten/oin';

COMMENT ON COLUMN ihw.gemeente.gemeente_code IS 
  'CBS gemeentecode (4 cijfers). Bijvoorbeeld: 0363 voor Amsterdam, 0599 voor Rotterdam.';

COMMENT ON COLUMN ihw.gemeente.actief IS 
  'Of de gemeente actief is in het systeem. Inactieve gemeenten kunnen niet gebruikt worden voor nieuwe dossiers.';

-- Seed with major Dutch municipalities
INSERT INTO ihw.gemeente (oin, naam, gemeente_code) VALUES
  -- G4 (4 grote steden)
  ('00000001002564440000', 'Amsterdam', '0363'),
  ('00000001003214345000', 'Rotterdam', '0599'),
  ('00000001003609205000', 'Den Haag', '0518'),
  ('00000001002220647000', 'Utrecht', '0344'),
  
  -- G40 (andere grote gemeenten)
  ('00000001002006333000', 'Eindhoven', '0772'),
  ('00000001002006492000', 'Groningen', '0014'),
  ('00000001002006503000', 'Tilburg', '0855'),
  ('00000001002006421000', 'Almere', '0034'),
  ('00000001002006307000', 'Breda', '0758'),
  ('00000001002006376000', 'Nijmegen', '0268'),
  ('00000001002006438000', 'Apeldoorn', '0200'),
  ('00000001002006454000', 'Haarlem', '0392'),
  ('00000001002006399000', 'Enschede', '0153'),
  ('00000001002006294000', 'Zaanstad', '0479'),
  ('00000001002006410000', 'Haarlemmermeer', '0394'),
  ('00000001002006226000', 'Arnhem', '0202'),
  ('00000001002006320000', 'Amersfoort', '0307'),
  ('00000001002006465000', 's-Hertogenbosch', '0796'),
  ('00000001002006212000', 'Maastricht', '0935')
ON CONFLICT (oin) DO NOTHING;

\echo '✅ Gemeente table created with seed data'

