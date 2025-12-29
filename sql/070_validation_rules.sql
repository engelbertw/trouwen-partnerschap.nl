-- ============================================================================
-- 070_VALIDATION_RULES.SQL
-- ============================================================================
-- Kwaliteitscontrole regels voor data validatie
-- Deze tabel documenteert alle validatieregels voor transparantie naar eindgebruikers
--
-- Doel: AVG-compliance, transparantie, en traceerbare kwaliteitscontroles
-- Schema: ihw (consistentie met andere applicatie tabellen)
-- ============================================================================

-- Validatieregels tabel
CREATE TABLE IF NOT EXISTS ihw.validatie_regel (
    id SERIAL PRIMARY KEY,
    regel_code VARCHAR(50) UNIQUE NOT NULL,
    categorie VARCHAR(50) NOT NULL, -- 'kind', 'partner', 'datum', 'document', 'algemeen'
    veld_naam VARCHAR(100) NOT NULL,
    regel_type VARCHAR(30) NOT NULL, -- 'vereist', 'formaat', 'bereik', 'relatie', 'logisch'
    beschrijving TEXT NOT NULL, -- Nederlandse beschrijving voor eindgebruikers
    technische_regel TEXT NOT NULL, -- Technische implementatie details
    foutmelding TEXT NOT NULL, -- Gebruikersvriendelijke foutmelding
    rationale TEXT, -- Waarom deze regel bestaat
    wettelijke_basis TEXT, -- Verwijzing naar relevante wetgeving (bijv. Burgerlijk Wetboek)
    prioriteit INTEGER DEFAULT 1, -- 1=kritisch, 2=belangrijk, 3=waarschuwing
    actief BOOLEAN DEFAULT TRUE,
    toegevoegd_op TIMESTAMPTZ DEFAULT NOW(),
    laatst_gewijzigd TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT validatie_regel_prioriteit_check CHECK (prioriteit IN (1, 2, 3))
);

-- Index voor snelle lookups
CREATE INDEX IF NOT EXISTS idx_validatie_regel_categorie ON ihw.validatie_regel(categorie);
CREATE INDEX IF NOT EXISTS idx_validatie_regel_actief ON ihw.validatie_regel(actief);
CREATE INDEX IF NOT EXISTS idx_validatie_regel_code ON ihw.validatie_regel(regel_code);

-- Validatie log tabel - houdt bij wanneer regels zijn toegepast
CREATE TABLE IF NOT EXISTS ihw.validatie_log (
    id SERIAL PRIMARY KEY,
    validatie_regel_id INTEGER REFERENCES ihw.validatie_regel(id),
    dossier_id INTEGER, -- Optionele referentie naar dossier
    veld_waarde TEXT, -- De waarde die gevalideerd werd (geanonimiseerd indien nodig)
    resultaat VARCHAR(20) NOT NULL, -- 'geslaagd', 'gefaald', 'waarschuwing'
    foutmelding TEXT,
    gebruiker_id VARCHAR(255), -- Clerk user ID
    ip_adres INET,
    toegepast_op TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT validatie_log_resultaat_check CHECK (resultaat IN ('geslaagd', 'gefaald', 'waarschuwing'))
);

-- Index voor rapportage en analyse
CREATE INDEX IF NOT EXISTS idx_validatie_log_regel ON ihw.validatie_log(validatie_regel_id);
CREATE INDEX IF NOT EXISTS idx_validatie_log_resultaat ON ihw.validatie_log(resultaat);
CREATE INDEX IF NOT EXISTS idx_validatie_log_datum ON ihw.validatie_log(toegepast_op);

-- Trigger voor laatst_gewijzigd
CREATE OR REPLACE FUNCTION ihw.update_validatie_regel_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.laatst_gewijzigd = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER validatie_regel_timestamp
    BEFORE UPDATE ON ihw.validatie_regel
    FOR EACH ROW
    EXECUTE FUNCTION ihw.update_validatie_regel_timestamp();

-- Comments voor documentatie
COMMENT ON TABLE ihw.validatie_regel IS 'Documenteert alle kwaliteitscontrole regels voor transparantie en AVG-compliance';
COMMENT ON COLUMN ihw.validatie_regel.regel_code IS 'Unieke code voor de regel (bijv. KIND_LEEFTIJD_MAX)';
COMMENT ON COLUMN ihw.validatie_regel.categorie IS 'Categorie van de validatie voor organisatie';
COMMENT ON COLUMN ihw.validatie_regel.beschrijving IS 'Nederlandse beschrijving die getoond kan worden aan eindgebruikers';
COMMENT ON COLUMN ihw.validatie_regel.wettelijke_basis IS 'Verwijzing naar wetgeving zoals Burgerlijk Wetboek artikel';
COMMENT ON COLUMN ihw.validatie_regel.prioriteit IS '1=Kritisch (blokkerend), 2=Belangrijk (waarschuwing), 3=Informatief';

COMMENT ON TABLE ihw.validatie_log IS 'Audit trail van uitgevoerde validaties voor transparantie en debugging';
COMMENT ON COLUMN ihw.validatie_log.resultaat IS 'Uitkomst van de validatie check';

