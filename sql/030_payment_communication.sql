-- ============================================================================
-- ihuwelijk Payment, Communication and BRP Tables
-- Version: 1.0
-- Description: Payment processing, communication and BRP integration
-- ============================================================================

SET search_path TO ihw, public;

-- ============================================================================
-- TABLE: payment (payment transactions)
-- ============================================================================

CREATE TABLE ihw.payment (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    dossier_id uuid NOT NULL REFERENCES ihw.dossier(id) ON DELETE CASCADE,
    
    -- Payment details
    provider text NOT NULL DEFAULT 'worldonline',
    status ihw.payment_status NOT NULL DEFAULT 'pending',
    amount_cents int NOT NULL,
    currency text NOT NULL DEFAULT 'EUR',
    
    -- External references
    external_reference text,
    external_transaction_id text,
    redirect_url text,
    
    -- Timestamps
    initiated_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    paid_at timestamptz,
    failed_at timestamptz,
    
    -- Metadata
    payment_method text, -- ideal, creditcard, etc.
    failure_reason text,
    metadata jsonb DEFAULT '{}'::jsonb,
    
    created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT chk_amount_cents CHECK (amount_cents >= 0),
    CONSTRAINT chk_paid_timestamp CHECK (
        (status = 'paid' AND paid_at IS NOT NULL) OR
        (status != 'paid' AND paid_at IS NULL)
    ),
    CONSTRAINT chk_failed_timestamp CHECK (
        (status = 'failed' AND failed_at IS NOT NULL) OR
        (status != 'failed' AND failed_at IS NULL)
    )
);

CREATE INDEX idx_payment_dossier ON ihw.payment(dossier_id);
CREATE INDEX idx_payment_status ON ihw.payment(status);
CREATE INDEX idx_payment_external_ref ON ihw.payment(external_reference) WHERE external_reference IS NOT NULL;
CREATE INDEX idx_payment_provider ON ihw.payment(provider);
CREATE UNIQUE INDEX idx_payment_one_paid_per_dossier ON ihw.payment(dossier_id) 
    WHERE status IN ('paid', 'waived');

COMMENT ON TABLE ihw.payment IS 'Payment transacties voor huwelijksdossiers';
COMMENT ON COLUMN ihw.payment.provider IS 'Betaalprovider (default: worldonline)';
COMMENT ON COLUMN ihw.payment.amount_cents IS 'Bedrag in eurocenten (€1.00 = 100 cents)';
COMMENT ON COLUMN ihw.payment.external_reference IS 'Referentie van betaalprovider';

-- ============================================================================
-- TABLE: refund (payment refunds)
-- ============================================================================

CREATE TABLE ihw.refund (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_id uuid NOT NULL REFERENCES ihw.payment(id) ON DELETE CASCADE,
    
    -- Refund details
    status ihw.refund_status NOT NULL DEFAULT 'requested',
    amount_cents int NOT NULL,
    reason text NOT NULL,
    
    -- iPortaal integration
    iportaal_token text,
    external_reference text,
    
    -- Timestamps
    requested_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    requested_by text NOT NULL,
    approved_at timestamptz,
    approved_by text,
    processed_at timestamptz,
    processed_by text,
    failed_at timestamptz,
    
    -- Metadata
    failure_reason text,
    notes text,
    
    created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT chk_refund_amount CHECK (amount_cents > 0),
    CONSTRAINT chk_approved_timestamp CHECK (
        (status IN ('approved', 'processed') AND approved_at IS NOT NULL) OR
        (status NOT IN ('approved', 'processed'))
    ),
    CONSTRAINT chk_processed_timestamp CHECK (
        (status = 'processed' AND processed_at IS NOT NULL) OR
        (status != 'processed')
    )
);

CREATE INDEX idx_refund_payment ON ihw.refund(payment_id);
CREATE INDEX idx_refund_status ON ihw.refund(status);
CREATE INDEX idx_refund_iportaal_token ON ihw.refund(iportaal_token) WHERE iportaal_token IS NOT NULL;

COMMENT ON TABLE ihw.refund IS 'Terugbetalingen van huwelijkskosten';
COMMENT ON COLUMN ihw.refund.iportaal_token IS 'Token voor koppeling met iPortaal betaalsysteem';

-- ============================================================================
-- TABLE: brp_export (BRP/iBurgerzaken integration)
-- ============================================================================

CREATE TABLE ihw.brp_export (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    dossier_id uuid NOT NULL REFERENCES ihw.dossier(id) ON DELETE CASCADE,
    
    -- Export details
    status ihw.brp_export_status NOT NULL DEFAULT 'scheduled',
    export_type text NOT NULL DEFAULT 'huwelijksakte',
    
    -- Scheduling (X weeks before ceremony)
    scheduled_at timestamptz NOT NULL,
    scheduled_for timestamptz NOT NULL,
    
    -- Processing
    locked_at timestamptz,
    started_at timestamptz,
    completed_at timestamptz,
    failed_at timestamptz,
    
    -- Results
    success boolean,
    message text,
    iburgerzaken_reference text,
    retry_count int NOT NULL DEFAULT 0,
    
    -- Metadata
    created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT chk_scheduled_times CHECK (scheduled_for >= scheduled_at),
    CONSTRAINT chk_completed_timestamp CHECK (
        (status = 'done' AND completed_at IS NOT NULL AND success = true) OR
        (status != 'done')
    ),
    CONSTRAINT chk_failed_timestamp CHECK (
        (status = 'failed' AND failed_at IS NOT NULL AND success = false) OR
        (status != 'failed')
    ),
    CONSTRAINT chk_retry_count CHECK (retry_count >= 0 AND retry_count <= 5)
);

CREATE INDEX idx_brp_export_dossier ON ihw.brp_export(dossier_id);
CREATE INDEX idx_brp_export_status ON ihw.brp_export(status);
CREATE INDEX idx_brp_export_scheduled_for ON ihw.brp_export(scheduled_for) WHERE status = 'scheduled';
CREATE INDEX idx_brp_export_iburgerzaken_ref ON ihw.brp_export(iburgerzaken_reference) 
    WHERE iburgerzaken_reference IS NOT NULL;

COMMENT ON TABLE ihw.brp_export IS 'Export naar BRP/iBurgerzaken (akte opmaken, BRP bijwerken)';
COMMENT ON COLUMN ihw.brp_export.scheduled_for IS 'Geplande export tijd (X weken voor ceremonie)';
COMMENT ON COLUMN ihw.brp_export.locked_at IS 'Tijdstip van lock (dossier moet locked zijn)';

-- ============================================================================
-- TABLE: communication (secure messages)
-- ============================================================================

CREATE TABLE ihw.communication (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    dossier_id uuid NOT NULL REFERENCES ihw.dossier(id) ON DELETE CASCADE,
    
    -- Message details
    sender_role ihw.sender_role NOT NULL,
    sender_id text NOT NULL,
    sender_naam text,
    
    -- Content
    subject text NOT NULL,
    body text NOT NULL,
    
    -- Status
    read boolean NOT NULL DEFAULT false,
    read_at timestamptz,
    read_by text,
    
    -- Thread
    reply_to_id uuid REFERENCES ihw.communication(id),
    
    -- Metadata
    created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_communication_dossier ON ihw.communication(dossier_id);
CREATE INDEX idx_communication_sender ON ihw.communication(sender_id);
CREATE INDEX idx_communication_unread ON ihw.communication(dossier_id, read) WHERE read = false;
CREATE INDEX idx_communication_reply_to ON ihw.communication(reply_to_id) WHERE reply_to_id IS NOT NULL;
CREATE INDEX idx_communication_created ON ihw.communication(dossier_id, created_at DESC);

COMMENT ON TABLE ihw.communication IS 'Veilige communicatie tussen burger en medewerker';
COMMENT ON COLUMN ihw.communication.sender_role IS 'Rol van afzender: burger of medewerker';
COMMENT ON COLUMN ihw.communication.reply_to_id IS 'Verwijzing naar bericht waar dit een antwoord op is';

-- ============================================================================
-- TABLE: tijdslot (available time slots per location)
-- ============================================================================

CREATE TABLE ihw.tijdslot (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    locatie_id uuid NOT NULL REFERENCES ihw.locatie(id) ON DELETE CASCADE,
    
    -- Slot details
    datum date NOT NULL,
    start_tijd time NOT NULL,
    eind_tijd time NOT NULL,
    capacity int NOT NULL DEFAULT 1,
    
    -- Booking status
    gereserveerd_door uuid REFERENCES ihw.dossier(id),
    blocked boolean NOT NULL DEFAULT false,
    blocked_by text,
    blocked_reason text,
    
    -- Metadata
    created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT chk_tijdslot_tijd CHECK (start_tijd < eind_tijd),
    CONSTRAINT chk_capacity CHECK (capacity > 0),
    CONSTRAINT chk_datum_toekomst CHECK (datum >= CURRENT_DATE)
);

CREATE INDEX idx_tijdslot_locatie ON ihw.tijdslot(locatie_id);
CREATE INDEX idx_tijdslot_datum ON ihw.tijdslot(datum);
CREATE INDEX idx_tijdslot_beschikbaar ON ihw.tijdslot(locatie_id, datum, blocked) 
    WHERE gereserveerd_door IS NULL AND blocked = false;
CREATE INDEX idx_tijdslot_gereserveerd ON ihw.tijdslot(gereserveerd_door) 
    WHERE gereserveerd_door IS NOT NULL;

-- Create a unique index to prevent overlapping slots
-- This is a simplified alternative to EXCLUDE constraint
CREATE UNIQUE INDEX idx_tijdslot_no_overlap 
    ON ihw.tijdslot(locatie_id, datum, start_tijd, eind_tijd);

COMMENT ON TABLE ihw.tijdslot IS 'Beschikbare tijdslots per locatie (agenda)';
COMMENT ON COLUMN ihw.tijdslot.capacity IS 'Aantal ceremonies dat tegelijk kan in deze slot';
COMMENT ON COLUMN ihw.tijdslot.blocked IS 'Slot geblokkeerd voor boekingen (onderhoud, etc.)';

-- ============================================================================
-- TABLE: audit_log (audit trail)
-- ============================================================================

CREATE TABLE ihw.audit_log (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    dossier_id uuid REFERENCES ihw.dossier(id) ON DELETE SET NULL,
    
    -- Action details
    action text NOT NULL,
    table_name text NOT NULL,
    record_id uuid,
    
    -- Actor
    actor_id text NOT NULL,
    actor_role text,
    
    -- Changes
    old_values jsonb,
    new_values jsonb,
    
    -- Metadata
    ip_address inet,
    user_agent text,
    created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_audit_dossier ON ihw.audit_log(dossier_id) WHERE dossier_id IS NOT NULL;
CREATE INDEX idx_audit_actor ON ihw.audit_log(actor_id);
CREATE INDEX idx_audit_created ON ihw.audit_log(created_at DESC);
CREATE INDEX idx_audit_table ON ihw.audit_log(table_name);

COMMENT ON TABLE ihw.audit_log IS 'Audit trail voor alle belangrijke acties';
COMMENT ON COLUMN ihw.audit_log.action IS 'Type actie: INSERT, UPDATE, DELETE, LOCK, etc.';

-- ============================================================================
-- Grant permissions
-- ============================================================================

GRANT SELECT ON ALL TABLES IN SCHEMA ihw TO loket_readonly;
GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA ihw TO app_rw;
GRANT ALL ON ALL TABLES IN SCHEMA ihw TO hb_admin;

-- ============================================================================
-- Payment, communication and support tables complete
-- ============================================================================

\echo '✓ Support tables created: payment, refund, brp_export, communication, tijdslot, audit_log'
\echo ''
\echo 'Next: Run 040_triggers_functions.sql'

