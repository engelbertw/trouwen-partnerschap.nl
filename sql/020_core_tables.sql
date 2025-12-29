-- ============================================================================
-- ihuwelijk Core Tables
-- Version: 1.0
-- Description: Main tables for digital marriage process
-- ============================================================================

SET search_path TO ihw, public;

-- ============================================================================
-- TABLE: dossier (main marriage case)
-- ============================================================================

CREATE TABLE ihw.dossier (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    status ihw.dossier_status NOT NULL DEFAULT 'draft',
    type_ceremonie_id uuid REFERENCES ihw.type_ceremonie(id),
    
    -- Metadata
    municipality_code text NOT NULL DEFAULT 'NL.IMBAG.Gemeente.0363', -- Amsterdam
    iburgerzaken_case_id text,
    
    -- Identity and tracking
    created_by text NOT NULL, -- User ID (from Clerk/DigiD)
    created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    -- Important timestamps
    ready_for_payment_at timestamptz,
    locked_at timestamptz,
    ceremony_date date,
    
    -- Flags
    is_test boolean NOT NULL DEFAULT false,
    
    CONSTRAINT chk_locked_requires_payment CHECK (
        status != 'locked' OR (ready_for_payment_at IS NOT NULL AND locked_at IS NOT NULL)
    )
);

CREATE INDEX idx_dossier_status ON ihw.dossier(status);
CREATE INDEX idx_dossier_created_by ON ihw.dossier(created_by);
CREATE INDEX idx_dossier_ceremony_date ON ihw.dossier(ceremony_date) WHERE ceremony_date IS NOT NULL;
CREATE INDEX idx_dossier_type_ceremonie ON ihw.dossier(type_ceremonie_id);
CREATE INDEX idx_dossier_iburgerzaken ON ihw.dossier(iburgerzaken_case_id) WHERE iburgerzaken_case_id IS NOT NULL;

COMMENT ON TABLE ihw.dossier IS 'Hoofd huwelijksdossier - één record per huwelijksaanvraag';
COMMENT ON COLUMN ihw.dossier.locked_at IS 'Moment waarop dossier definitief is gemaakt (niet meer wijzigbaar door burger)';
COMMENT ON COLUMN ihw.dossier.ready_for_payment_at IS 'Moment waarop dossier klaar was voor betaling';
COMMENT ON COLUMN ihw.dossier.iburgerzaken_case_id IS 'Koppeling naar iBurgerzaken zaak';

-- ============================================================================
-- TABLE: dossier_block (completion tracking per section)
-- ============================================================================

CREATE TABLE ihw.dossier_block (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    dossier_id uuid NOT NULL REFERENCES ihw.dossier(id) ON DELETE CASCADE,
    code ihw.block_code NOT NULL,
    complete boolean NOT NULL DEFAULT false,
    required boolean NOT NULL DEFAULT true,
    completed_at timestamptz,
    completed_by text,
    created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT uq_dossier_block UNIQUE(dossier_id, code),
    CONSTRAINT chk_completed_timestamp CHECK (
        (complete = false AND completed_at IS NULL) OR
        (complete = true AND completed_at IS NOT NULL)
    )
);

CREATE INDEX idx_dossier_block_dossier ON ihw.dossier_block(dossier_id);
CREATE INDEX idx_dossier_block_complete ON ihw.dossier_block(dossier_id, complete);

COMMENT ON TABLE ihw.dossier_block IS 'Completion status van elk blok binnen het dossier';
COMMENT ON COLUMN ihw.dossier_block.required IS 'Of dit blok verplicht is voor het afronden van het dossier';

-- ============================================================================
-- TABLE: partner (two partners per dossier)
-- ============================================================================

CREATE TABLE ihw.partner (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    dossier_id uuid NOT NULL REFERENCES ihw.dossier(id) ON DELETE CASCADE,
    sequence smallint NOT NULL,
    
    -- BRP gegevens
    bsn char(9),
    voornamen text,
    voorvoegsel text,
    geslachtsnaam text NOT NULL,
    geboortedatum date NOT NULL,
    geboorteplaats text NOT NULL,
    geboorteland text NOT NULL DEFAULT 'Nederland',
    
    -- Ouders (voor aankondiging check)
    ouders_onbekend boolean NOT NULL DEFAULT false,
    
    -- Naamgebruik keuze
    naamgebruik_keuze ihw.naamgebruik_keuze,
    
    -- Contact
    email text,
    telefoon text,
    
    -- Metadata
    created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT chk_sequence CHECK (sequence IN (1, 2)),
    CONSTRAINT uq_partner_sequence UNIQUE(dossier_id, sequence),
    CONSTRAINT chk_bsn_format CHECK (bsn IS NULL OR bsn ~ '^\d{9}$')
);

CREATE INDEX idx_partner_dossier ON ihw.partner(dossier_id);
CREATE INDEX idx_partner_bsn ON ihw.partner(bsn) WHERE bsn IS NOT NULL;

COMMENT ON TABLE ihw.partner IS 'Partners in het huwelijk (altijd 2 per dossier)';
COMMENT ON COLUMN ihw.partner.sequence IS '1 = eerste partner, 2 = tweede partner';
COMMENT ON COLUMN ihw.partner.ouders_onbekend IS 'Puntouders - blokkeert aankondiging (showstopper)';
COMMENT ON COLUMN ihw.partner.bsn IS 'Burgerservicenummer (nullable voor buitenlanders)';

-- ============================================================================
-- TABLE: aankondiging (marriage announcement and validation)
-- ============================================================================

CREATE TABLE ihw.aankondiging (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    dossier_id uuid NOT NULL UNIQUE REFERENCES ihw.dossier(id) ON DELETE CASCADE,
    
    -- Validation flags (showstoppers)
    reeds_gehuwd boolean NOT NULL DEFAULT false,
    partnerschap boolean NOT NULL DEFAULT false,
    omzetting boolean NOT NULL DEFAULT false,
    beiden_niet_woonachtig boolean NOT NULL DEFAULT false,
    
    -- Derived validity
    valid boolean NOT NULL DEFAULT false,
    invalid_reason text,
    
    -- Metadata
    aangemaakt_op timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    gevalideerd_op timestamptz,
    gevalideerd_door text,
    
    created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_aankondiging_dossier ON ihw.aankondiging(dossier_id);
CREATE INDEX idx_aankondiging_valid ON ihw.aankondiging(valid);

COMMENT ON TABLE ihw.aankondiging IS 'Huwelijksaankondiging met automatische validatie (showstoppers)';
COMMENT ON COLUMN ihw.aankondiging.reeds_gehuwd IS 'Een of beide partners zijn al gehuwd (showstopper)';
COMMENT ON COLUMN ihw.aankondiging.beiden_niet_woonachtig IS 'Geen van beiden woont in de gemeente (showstopper)';
COMMENT ON COLUMN ihw.aankondiging.valid IS 'Aankondiging is geldig (geen showstoppers)';

-- ============================================================================
-- TABLE: ceremonie (ceremony details)
-- ============================================================================

CREATE TABLE ihw.ceremonie (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    dossier_id uuid NOT NULL UNIQUE REFERENCES ihw.dossier(id) ON DELETE CASCADE,
    
    -- Ceremony details
    locatie_id uuid NOT NULL REFERENCES ihw.locatie(id),
    babs_id uuid REFERENCES ihw.babs(id),
    datum date NOT NULL,
    start_tijd time NOT NULL,
    eind_tijd time NOT NULL,
    
    -- Preferences (JSON for flexibility)
    wensen jsonb DEFAULT '{}'::jsonb,
    taal text DEFAULT 'nl',
    trouwboekje boolean DEFAULT false,
    speech boolean DEFAULT true,
    
    -- Wijzigbaarheid
    wijzigbaar_tot timestamptz NOT NULL,
    
    -- Metadata
    geboekt_op timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    laatste_wijziging timestamptz,
    gewijzigd_door text,
    
    created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT chk_tijd_volgorde CHECK (start_tijd < eind_tijd),
    CONSTRAINT chk_datum_toekomst CHECK (datum >= CURRENT_DATE)
);

CREATE INDEX idx_ceremonie_dossier ON ihw.ceremonie(dossier_id);
CREATE INDEX idx_ceremonie_locatie ON ihw.ceremonie(locatie_id);
CREATE INDEX idx_ceremonie_babs ON ihw.ceremonie(babs_id) WHERE babs_id IS NOT NULL;
CREATE INDEX idx_ceremonie_datum ON ihw.ceremonie(datum);
CREATE INDEX idx_ceremonie_wijzigbaar_tot ON ihw.ceremonie(wijzigbaar_tot);
CREATE INDEX idx_ceremonie_wensen_gin ON ihw.ceremonie USING gin(wensen);

COMMENT ON TABLE ihw.ceremonie IS 'Ceremony details: datum, tijd, locatie, BABS';
COMMENT ON COLUMN ihw.ceremonie.wijzigbaar_tot IS 'Uiterste datum waarop burger zelf wijzigingen kan maken';
COMMENT ON COLUMN ihw.ceremonie.wensen IS 'Extra wensen in JSON formaat (flexibel uitbreidbaar)';

-- ============================================================================
-- TABLE: getuige (witnesses)
-- ============================================================================

CREATE TABLE ihw.getuige (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    dossier_id uuid NOT NULL REFERENCES ihw.dossier(id) ON DELETE CASCADE,
    
    -- Getuige details
    is_gemeentelijke_getuige boolean NOT NULL DEFAULT false,
    voornamen text NOT NULL,
    voorvoegsel text,
    achternaam text NOT NULL,
    geboortedatum date NOT NULL,
    geboorteplaats text,
    
    -- Document (if applicable)
    document_upload_id uuid,
    document_status ihw.papier_status DEFAULT 'ontbreekt',
    
    -- Metadata
    volgorde smallint NOT NULL DEFAULT 1,
    created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT chk_geboortedatum CHECK (geboortedatum <= CURRENT_DATE),
    CONSTRAINT chk_volgorde CHECK (volgorde >= 1 AND volgorde <= 4)
);

CREATE INDEX idx_getuige_dossier ON ihw.getuige(dossier_id);
CREATE INDEX idx_getuige_gemeentelijk ON ihw.getuige(dossier_id, is_gemeentelijke_getuige);

COMMENT ON TABLE ihw.getuige IS 'Getuigen (2-4 per huwelijk, burger of gemeentelijk)';
COMMENT ON COLUMN ihw.getuige.is_gemeentelijke_getuige IS 'Gemeentelijke getuige (true) of eigen getuige (false)';
COMMENT ON COLUMN ihw.getuige.document_upload_id IS 'Verwijzing naar identiteitsbewijs upload';

-- ============================================================================
-- TABLE: papier (documents/papers required)
-- ============================================================================

CREATE TABLE ihw.papier (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    dossier_id uuid NOT NULL REFERENCES ihw.dossier(id) ON DELETE CASCADE,
    partner_id uuid REFERENCES ihw.partner(id),
    
    -- Document details
    type ihw.papier_type NOT NULL,
    status ihw.papier_status NOT NULL DEFAULT 'ontbreekt',
    omschrijving text,
    
    -- Review
    beoordeeld_door text,
    beoordeeld_op timestamptz,
    opmerking text,
    
    -- Metadata
    created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_papier_dossier ON ihw.papier(dossier_id);
CREATE INDEX idx_papier_partner ON ihw.papier(partner_id) WHERE partner_id IS NOT NULL;
CREATE INDEX idx_papier_status ON ihw.papier(dossier_id, status);

COMMENT ON TABLE ihw.papier IS 'Benodigde brondocumenten per dossier en partner';
COMMENT ON COLUMN ihw.papier.partner_id IS 'Voor welke partner is dit document (nullable voor gezamenlijke docs)';

-- ============================================================================
-- TABLE: upload (file uploads)
-- ============================================================================

CREATE TABLE ihw.upload (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    dossier_id uuid NOT NULL REFERENCES ihw.dossier(id) ON DELETE CASCADE,
    getuige_id uuid REFERENCES ihw.getuige(id),
    papier_id uuid REFERENCES ihw.papier(id),
    
    -- File details
    filename text NOT NULL,
    original_filename text NOT NULL,
    mime_type text NOT NULL,
    size_bytes bigint NOT NULL,
    storage_uri text NOT NULL,
    
    -- Metadata
    uploaded_by text NOT NULL,
    uploaded_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT chk_size_bytes CHECK (size_bytes > 0 AND size_bytes <= 52428800), -- max 50MB
    CONSTRAINT chk_one_relation CHECK (
        (getuige_id IS NOT NULL)::int + (papier_id IS NOT NULL)::int <= 1
    )
);

CREATE INDEX idx_upload_dossier ON ihw.upload(dossier_id);
CREATE INDEX idx_upload_getuige ON ihw.upload(getuige_id) WHERE getuige_id IS NOT NULL;
CREATE INDEX idx_upload_papier ON ihw.upload(papier_id) WHERE papier_id IS NOT NULL;

COMMENT ON TABLE ihw.upload IS 'Geüploade bestanden (documenten, ID bewijzen)';
COMMENT ON COLUMN ihw.upload.storage_uri IS 'Volledige URI naar bestand in object storage (S3, Azure Blob, etc.)';

-- ============================================================================
-- Grant permissions
-- ============================================================================

GRANT SELECT ON ALL TABLES IN SCHEMA ihw TO loket_readonly;
GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA ihw TO app_rw;
GRANT ALL ON ALL TABLES IN SCHEMA ihw TO hb_admin;

-- ============================================================================
-- Core tables complete
-- ============================================================================

\echo '✓ Core tables created: dossier, partner, aankondiging, ceremonie, getuige, papier, upload'
\echo ''
\echo 'Next: Run 030_constraints_indexes.sql'

