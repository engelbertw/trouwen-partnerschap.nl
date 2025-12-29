-- ============================================================================
-- ihuwelijk Enums and Lookup Types
-- Version: 1.0
-- Description: Enum types and lookup tables for ihuwelijk system
-- ============================================================================

SET search_path TO ihw, public;

-- ============================================================================
-- ENUM TYPES
-- ============================================================================

-- Dossier status
CREATE TYPE ihw.dossier_status AS ENUM (
    'draft',              -- Concept, nog niet volledig
    'in_review',          -- In behandeling door medewerker
    'ready_for_payment',  -- Klaar voor betaling
    'locked',             -- Definitief, niet meer wijzigbaar
    'cancelled'           -- Geannuleerd
);

COMMENT ON TYPE ihw.dossier_status IS 'Status van het huwelijksdossier';

-- Dossier block codes
CREATE TYPE ihw.block_code AS ENUM (
    'aankondiging',       -- Aankondiging en eerste checks
    'ceremonie',          -- Datum/tijd/locatie/BABS keuze
    'getuigen',           -- Getuigen (2-4 personen)
    'papieren',           -- Brondocumenten
    'betaling'            -- Betaling status
);

COMMENT ON TYPE ihw.block_code IS 'Type blok binnen een dossier';

-- Payment status
CREATE TYPE ihw.payment_status AS ENUM (
    'pending',    -- Nog niet betaald
    'paid',       -- Betaald
    'failed',     -- Betaling mislukt
    'refunded',   -- Terugbetaald
    'waived'      -- Kwijtgescholden/anders betaald
);

COMMENT ON TYPE ihw.payment_status IS 'Status van betaling';

-- Refund status
CREATE TYPE ihw.refund_status AS ENUM (
    'requested',  -- Terugbetaling aangevraagd
    'approved',   -- Goedgekeurd
    'processed',  -- Verwerkt
    'failed'      -- Mislukt
);

COMMENT ON TYPE ihw.refund_status IS 'Status van terugbetaling';

-- BABS status
CREATE TYPE ihw.babs_status AS ENUM (
    'beedigd',      -- Beëdigd en geldig
    'in_aanvraag',  -- Aanvraag lopend
    'ongeldig'      -- Niet (meer) geldig
);

COMMENT ON TYPE ihw.babs_status IS 'Status van BABS (Buitengewoon Ambtenaar Burgerlijke Stand)';

-- Location type
CREATE TYPE ihw.locatie_type AS ENUM (
    'stadhuis',      -- Gemeentehuis
    'stadsloket',    -- Stadsloket
    'buitenlocatie'  -- Externe locatie
);

COMMENT ON TYPE ihw.locatie_type IS 'Type ceremonie locatie';

-- Paper/document type
CREATE TYPE ihw.papier_type AS ENUM (
    'geboorteakte',
    'nationaliteitsverklaring',
    'identiteitsbewijs',
    'scheidingsbeschikking',
    'overlijdensakte',
    'trouwboekje',
    'anders'
);

COMMENT ON TYPE ihw.papier_type IS 'Type brondocument';

-- Paper status
CREATE TYPE ihw.papier_status AS ENUM (
    'ontbreekt',   -- Nog niet ingeleverd
    'ingeleverd',  -- Geüpload/ingeleverd
    'goedgekeurd', -- Akkoord bevonden
    'afgekeurd'    -- Niet goedgekeurd
);

COMMENT ON TYPE ihw.papier_status IS 'Status van brondocument';

-- BRP export status
CREATE TYPE ihw.brp_export_status AS ENUM (
    'scheduled',   -- Ingepland
    'in_progress', -- Bezig met export
    'done',        -- Succesvol afgerond
    'failed'       -- Mislukt
);

COMMENT ON TYPE ihw.brp_export_status IS 'Status van BRP/iBurgerzaken export';

-- Communication sender role
CREATE TYPE ihw.sender_role AS ENUM (
    'burger',      -- Bericht van burger
    'medewerker'   -- Bericht van medewerker
);

COMMENT ON TYPE ihw.sender_role IS 'Rol van afzender van bericht';

-- Naamgebruik keuze (conform BRP)
CREATE TYPE ihw.naamgebruik_keuze AS ENUM (
    'eigen',                -- Eigen naam
    'partner',              -- Naam partner
    'eigen_partner',        -- Eigen naam gevolgd door partner
    'partner_eigen'         -- Partner naam gevolgd door eigen
);

COMMENT ON TYPE ihw.naamgebruik_keuze IS 'Keuze voor naamgebruik na huwelijk (conform BRP)';

-- ============================================================================
-- Lookup table: Type Ceremonie
-- ============================================================================

CREATE TABLE ihw.type_ceremonie (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    code text NOT NULL UNIQUE,
    naam text NOT NULL,
    omschrijving text,
    eigen_babs_toegestaan boolean NOT NULL DEFAULT false,
    gratis boolean NOT NULL DEFAULT false,
    budget boolean NOT NULL DEFAULT false,
    openstelling_weken int NOT NULL DEFAULT 6,
    lead_time_days int NOT NULL DEFAULT 14,
    wijzigbaar_tot_days int NOT NULL DEFAULT 7,
    max_getuigen int NOT NULL DEFAULT 4,
    actief boolean NOT NULL DEFAULT true,
    volgorde int NOT NULL DEFAULT 0,
    created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT chk_openstelling_weken CHECK (openstelling_weken > 0),
    CONSTRAINT chk_lead_time_days CHECK (lead_time_days >= 0),
    CONSTRAINT chk_wijzigbaar_tot_days CHECK (wijzigbaar_tot_days >= 0),
    CONSTRAINT chk_max_getuigen CHECK (max_getuigen >= 2 AND max_getuigen <= 10)
);

CREATE INDEX idx_type_ceremonie_actief ON ihw.type_ceremonie(actief) WHERE actief = true;
CREATE INDEX idx_type_ceremonie_volgorde ON ihw.type_ceremonie(volgorde);

COMMENT ON TABLE ihw.type_ceremonie IS 'Configuratie voor verschillende types ceremonies (gratis, flash, budget, etc.)';
COMMENT ON COLUMN ihw.type_ceremonie.openstelling_weken IS 'Hoeveel weken van tevoren kan dit type ceremonie geboekt worden';
COMMENT ON COLUMN ihw.type_ceremonie.lead_time_days IS 'Minimum aantal dagen voorafgaand aan ceremonie';
COMMENT ON COLUMN ihw.type_ceremonie.wijzigbaar_tot_days IS 'Tot hoeveel dagen voor de ceremonie kan burger wijzigingen maken';
COMMENT ON COLUMN ihw.type_ceremonie.eigen_babs_toegestaan IS 'Of eigen BABS toegestaan is voor dit type';

-- ============================================================================
-- Lookup table: Locatie (stamtabel vrije locaties, 400+)
-- ============================================================================

CREATE TABLE ihw.locatie (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    code text NOT NULL UNIQUE,
    naam text NOT NULL,
    type ihw.locatie_type NOT NULL,
    adres jsonb,
    capaciteit int DEFAULT 50,
    actief boolean NOT NULL DEFAULT true,
    prijs_cents int NOT NULL DEFAULT 0,
    toelichting text,
    volgorde int NOT NULL DEFAULT 0,
    created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT chk_capaciteit CHECK (capaciteit > 0),
    CONSTRAINT chk_prijs_cents CHECK (prijs_cents >= 0)
);

CREATE INDEX idx_locatie_type ON ihw.locatie(type);
CREATE INDEX idx_locatie_actief ON ihw.locatie(actief) WHERE actief = true;
CREATE INDEX idx_locatie_volgorde ON ihw.locatie(volgorde);

COMMENT ON TABLE ihw.locatie IS 'Stamtabel voor alle mogelijk trouwlocaties (400+ locaties)';
COMMENT ON COLUMN ihw.locatie.adres IS 'JSON: {straat, huisnummer, postcode, plaats}';
COMMENT ON COLUMN ihw.locatie.prijs_cents IS 'Basisprijs in eurocenten';

-- ============================================================================
-- Lookup table: BABS (Buitengewoon Ambtenaar Burgerlijke Stand)
-- ============================================================================

CREATE TABLE ihw.babs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    code text UNIQUE,
    naam text NOT NULL,
    voornaam text,
    tussenvoegsel text,
    achternaam text NOT NULL,
    status ihw.babs_status NOT NULL DEFAULT 'in_aanvraag',
    beedigd_vanaf date,
    beedigd_tot date,
    aanvraag_datum date,
    opmerkingen text,
    actief boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT chk_beedigd_periode CHECK (
        (status = 'beedigd' AND beedigd_vanaf IS NOT NULL AND beedigd_tot IS NOT NULL)
        OR status != 'beedigd'
    ),
    CONSTRAINT chk_beedigd_volgorde CHECK (
        beedigd_vanaf IS NULL OR beedigd_tot IS NULL OR beedigd_vanaf < beedigd_tot
    )
);

CREATE INDEX idx_babs_status ON ihw.babs(status);
CREATE INDEX idx_babs_actief ON ihw.babs(actief) WHERE actief = true;
CREATE INDEX idx_babs_beedigd_tot ON ihw.babs(beedigd_tot) WHERE status = 'beedigd';

COMMENT ON TABLE ihw.babs IS 'Buitengewoon Ambtenaar Burgerlijke Stand - personen die ceremonies mogen voltrekken';
COMMENT ON COLUMN ihw.babs.status IS 'Status van de BABS (beedigd, in aanvraag, ongeldig)';
COMMENT ON COLUMN ihw.babs.beedigd_tot IS 'Datum waarop beëdiging verloopt';
COMMENT ON COLUMN ihw.babs.aanvraag_datum IS 'Datum waarop BABS-aanvraag is ingediend (min. 4 maanden voor ceremonie)';

-- ============================================================================
-- Grant permissions
-- ============================================================================

GRANT SELECT ON ALL TABLES IN SCHEMA ihw TO loket_readonly;
GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA ihw TO app_rw;
GRANT ALL ON ALL TABLES IN SCHEMA ihw TO hb_admin;

-- ============================================================================
-- Enums and lookups complete
-- ============================================================================

\echo '✓ Enums created: dossier_status, block_code, payment_status, etc.'
\echo '✓ Lookup tables: type_ceremonie, locatie, babs'
\echo ''
\echo 'Next: Run 020_core_tables.sql'

