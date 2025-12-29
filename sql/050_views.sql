-- ============================================================================
-- ihuwelijk Reporting Views
-- Version: 1.0
-- Description: Views for reports, dashboards and overviews
-- ============================================================================

SET search_path TO ihw, public;

-- ============================================================================
-- VIEW: Dossier summary with all key information
-- ============================================================================

CREATE OR REPLACE VIEW ihw.v_dossier_summary AS
SELECT 
    d.id as dossier_id,
    d.status as dossier_status,
    d.created_at,
    d.locked_at,
    d.ready_for_payment_at,
    
    -- Ceremony type
    tc.naam as type_ceremonie,
    tc.code as type_ceremonie_code,
    
    -- Partners
    p1.geslachtsnaam as partner1_naam,
    p1.voornamen as partner1_voornamen,
    p2.geslachtsnaam as partner2_naam,
    p2.voornamen as partner2_voornamen,
    
    -- Ceremony details
    c.datum as ceremony_date,
    c.start_tijd as ceremony_time,
    c.wijzigbaar_tot as wijzigbaar_tot,
    l.naam as locatie_naam,
    l.type as locatie_type,
    b.naam as babs_naam,
    
    -- Block completion
    COUNT(CASE WHEN db.required = true AND db.complete = false THEN 1 END) as incomplete_blocks,
    COUNT(CASE WHEN db.required = true AND db.complete = true THEN 1 END) as completed_blocks,
    
    -- Payment
    pay.status as payment_status,
    pay.amount_cents as payment_amount_cents,
    pay.paid_at,
    
    -- BRP Export
    brp.status as brp_export_status,
    brp.scheduled_for as brp_export_scheduled,
    
    -- Aankondiging
    a.valid as aankondiging_valid,
    a.invalid_reason as aankondiging_showstopper

FROM ihw.dossier d
LEFT JOIN ihw.type_ceremonie tc ON tc.id = d.type_ceremonie_id
LEFT JOIN ihw.partner p1 ON p1.dossier_id = d.id AND p1.sequence = 1
LEFT JOIN ihw.partner p2 ON p2.dossier_id = d.id AND p2.sequence = 2
LEFT JOIN ihw.ceremonie c ON c.dossier_id = d.id
LEFT JOIN ihw.locatie l ON l.id = c.locatie_id
LEFT JOIN ihw.babs b ON b.id = c.babs_id
LEFT JOIN ihw.dossier_block db ON db.dossier_id = d.id
LEFT JOIN ihw.payment pay ON pay.dossier_id = d.id AND pay.status IN ('paid', 'waived', 'pending')
LEFT JOIN ihw.brp_export brp ON brp.dossier_id = d.id AND brp.status IN ('scheduled', 'in_progress')
LEFT JOIN ihw.aankondiging a ON a.dossier_id = d.id
GROUP BY 
    d.id, d.status, d.created_at, d.locked_at, d.ready_for_payment_at,
    tc.naam, tc.code,
    p1.geslachtsnaam, p1.voornamen,
    p2.geslachtsnaam, p2.voornamen,
    c.datum, c.start_tijd, c.wijzigbaar_tot,
    l.naam, l.type,
    b.naam,
    pay.status, pay.amount_cents, pay.paid_at,
    brp.status, brp.scheduled_for,
    a.valid, a.invalid_reason;

COMMENT ON VIEW ihw.v_dossier_summary IS 'Complete overzicht van huwelijksdossiers met alle belangrijke details';

-- ============================================================================
-- VIEW: Agenda overview (per location and date)
-- ============================================================================

CREATE OR REPLACE VIEW ihw.v_agenda_overzicht AS
SELECT 
    l.id as locatie_id,
    l.naam as locatie_naam,
    l.type as locatie_type,
    
    -- Time slot details
    ts.datum,
    ts.start_tijd,
    ts.eind_tijd,
    ts.capacity,
    ts.blocked,
    ts.blocked_reason,
    
    -- Reservation
    ts.gereserveerd_door as dossier_id,
    CASE 
        WHEN ts.gereserveerd_door IS NOT NULL THEN 'Gereserveerd'
        WHEN ts.blocked = true THEN 'Geblokkeerd'
        ELSE 'Beschikbaar'
    END as status,
    
    -- Dossier details (if reserved)
    d.status as dossier_status,
    p1.geslachtsnaam as partner1_naam,
    p2.geslachtsnaam as partner2_naam,
    
    -- BABS
    c.babs_id,
    b.naam as babs_naam,
    b.status as babs_status,
    
    -- Ceremony type
    tc.naam as type_ceremonie,
    tc.code as type_ceremonie_code

FROM ihw.tijdslot ts
JOIN ihw.locatie l ON l.id = ts.locatie_id
LEFT JOIN ihw.dossier d ON d.id = ts.gereserveerd_door
LEFT JOIN ihw.partner p1 ON p1.dossier_id = d.id AND p1.sequence = 1
LEFT JOIN ihw.partner p2 ON p2.dossier_id = d.id AND p2.sequence = 2
LEFT JOIN ihw.ceremonie c ON c.dossier_id = d.id
LEFT JOIN ihw.babs b ON b.id = c.babs_id
LEFT JOIN ihw.type_ceremonie tc ON tc.id = d.type_ceremonie_id

WHERE ts.datum >= CURRENT_DATE - INTERVAL '7 days' -- Show past week and future
ORDER BY ts.datum, l.naam, ts.start_tijd;

COMMENT ON VIEW ihw.v_agenda_overzicht IS 'Agenda overzicht: locaties, tijdslots, bezetting en BABS indeling';

-- ============================================================================
-- VIEW: BABS availability schedule
-- ============================================================================

CREATE OR REPLACE VIEW ihw.v_babs_beschikbaarheid AS
SELECT 
    b.id as babs_id,
    b.naam as babs_naam,
    b.status,
    b.beedigd_tot,
    
    -- Upcoming ceremonies
    c.datum as ceremony_date,
    c.start_tijd as ceremony_time,
    l.naam as locatie_naam,
    
    -- Dossier info
    d.id as dossier_id,
    d.status as dossier_status,
    p1.geslachtsnaam as partner1_naam,
    p2.geslachtsnaam as partner2_naam,
    
    -- Days until ceremony
    c.datum - CURRENT_DATE as days_until_ceremony

FROM ihw.babs b
LEFT JOIN ihw.ceremonie c ON c.babs_id = b.id
LEFT JOIN ihw.locatie l ON l.id = c.locatie_id
LEFT JOIN ihw.dossier d ON d.id = c.dossier_id
LEFT JOIN ihw.partner p1 ON p1.dossier_id = d.id AND p1.sequence = 1
LEFT JOIN ihw.partner p2 ON p2.dossier_id = d.id AND p2.sequence = 2

WHERE b.actief = true
  AND (c.datum IS NULL OR c.datum >= CURRENT_DATE)
ORDER BY b.naam, c.datum, c.start_tijd;

COMMENT ON VIEW ihw.v_babs_beschikbaarheid IS 'BABS beschikbaarheid en toekomstige ceremonies';

-- ============================================================================
-- VIEW: Dossiers awaiting action
-- ============================================================================

CREATE OR REPLACE VIEW ihw.v_dossiers_met_actie_vereist AS
SELECT 
    d.id as dossier_id,
    d.status,
    d.created_at,
    
    -- Partners
    p1.geslachtsnaam || ', ' || p1.voornamen as partner1,
    p2.geslachtsnaam || ', ' || p2.voornamen as partner2,
    
    -- Ceremony
    c.datum as ceremony_date,
    l.naam as locatie_naam,
    
    -- Action required
    CASE 
        WHEN d.status = 'draft' AND d.created_at < CURRENT_TIMESTAMP - INTERVAL '30 days' 
            THEN 'Oud concept (>30 dagen)'
        WHEN d.status = 'in_review' 
            THEN 'Wacht op beoordeling medewerker'
        WHEN d.status = 'ready_for_payment' 
            THEN 'Wacht op betaling'
        WHEN d.status = 'locked' AND c.datum - CURRENT_DATE <= 14 
            THEN 'Ceremonie binnen 2 weken'
        WHEN a.valid = false 
            THEN 'Aankondiging ongeldig: ' || COALESCE(a.invalid_reason, 'onbekend')
        WHEN EXISTS (
            SELECT 1 FROM ihw.papier p 
            WHERE p.dossier_id = d.id AND p.status = 'afgekeurd'
        ) THEN 'Afgekeurde documenten'
        ELSE 'Geen directe actie vereist'
    END as actie_vereist,
    
    -- Priority
    CASE 
        WHEN c.datum - CURRENT_DATE <= 7 THEN 'Hoog'
        WHEN c.datum - CURRENT_DATE <= 14 THEN 'Middel'
        WHEN d.status = 'in_review' THEN 'Middel'
        ELSE 'Laag'
    END as prioriteit

FROM ihw.dossier d
LEFT JOIN ihw.partner p1 ON p1.dossier_id = d.id AND p1.sequence = 1
LEFT JOIN ihw.partner p2 ON p2.dossier_id = d.id AND p2.sequence = 2
LEFT JOIN ihw.ceremonie c ON c.dossier_id = d.id
LEFT JOIN ihw.locatie l ON l.id = c.locatie_id
LEFT JOIN ihw.aankondiging a ON a.dossier_id = d.id

WHERE d.status != 'cancelled'
  AND (
    d.status IN ('in_review', 'ready_for_payment') OR
    (d.status = 'draft' AND d.created_at < CURRENT_TIMESTAMP - INTERVAL '30 days') OR
    (d.status = 'locked' AND c.datum - CURRENT_DATE <= 14) OR
    a.valid = false OR
    EXISTS (SELECT 1 FROM ihw.papier p WHERE p.dossier_id = d.id AND p.status = 'afgekeurd')
  )
ORDER BY 
    CASE 
        WHEN c.datum - CURRENT_DATE <= 7 THEN 1
        WHEN c.datum - CURRENT_DATE <= 14 THEN 2
        WHEN d.status = 'in_review' THEN 2
        ELSE 3
    END,
    c.datum NULLS LAST,
    d.created_at;

COMMENT ON VIEW ihw.v_dossiers_met_actie_vereist IS 'Dossiers die actie van medewerker vereisen';

-- ============================================================================
-- VIEW: Upcoming ceremonies (next 30 days)
-- ============================================================================

CREATE OR REPLACE VIEW ihw.v_aanstaande_ceremonies AS
SELECT 
    c.datum,
    c.start_tijd,
    c.eind_tijd,
    
    -- Location and BABS
    l.naam as locatie,
    l.type as locatie_type,
    b.naam as babs,
    
    -- Partners
    p1.voornamen || ' ' || COALESCE(p1.voorvoegsel || ' ', '') || p1.geslachtsnaam as partner1,
    p2.voornamen || ' ' || COALESCE(p2.voorvoegsel || ' ', '') || p2.geslachtsnaam as partner2,
    
    -- Type and status
    tc.naam as type_ceremonie,
    d.status as dossier_status,
    
    -- Payment
    pay.status as payment_status,
    
    -- BRP export
    brp.status as brp_export_status,
    
    -- Metadata
    d.id as dossier_id,
    c.taal,
    c.trouwboekje,
    c.speech

FROM ihw.ceremonie c
JOIN ihw.dossier d ON d.id = c.dossier_id
JOIN ihw.locatie l ON l.id = c.locatie_id
LEFT JOIN ihw.babs b ON b.id = c.babs_id
LEFT JOIN ihw.partner p1 ON p1.dossier_id = d.id AND p1.sequence = 1
LEFT JOIN ihw.partner p2 ON p2.dossier_id = d.id AND p2.sequence = 2
LEFT JOIN ihw.type_ceremonie tc ON tc.id = d.type_ceremonie_id
LEFT JOIN ihw.payment pay ON pay.dossier_id = d.id AND pay.status IN ('paid', 'waived')
LEFT JOIN ihw.brp_export brp ON brp.dossier_id = d.id

WHERE c.datum BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '30 days'
  AND d.status NOT IN ('cancelled', 'draft')
ORDER BY c.datum, c.start_tijd;

COMMENT ON VIEW ihw.v_aanstaande_ceremonies IS 'Overzicht van aanstaande ceremonies (komende 30 dagen)';

-- ============================================================================
-- VIEW: Statistics dashboard
-- ============================================================================

CREATE OR REPLACE VIEW ihw.v_statistics AS
SELECT 
    -- Total dossiers by status
    COUNT(*) FILTER (WHERE status = 'draft') as dossiers_draft,
    COUNT(*) FILTER (WHERE status = 'in_review') as dossiers_in_review,
    COUNT(*) FILTER (WHERE status = 'ready_for_payment') as dossiers_ready_payment,
    COUNT(*) FILTER (WHERE status = 'locked') as dossiers_locked,
    COUNT(*) FILTER (WHERE status = 'cancelled') as dossiers_cancelled,
    
    -- This month
    COUNT(*) FILTER (WHERE created_at >= date_trunc('month', CURRENT_DATE)) as dossiers_deze_maand,
    
    -- Ceremonies this month
    (SELECT COUNT(*) FROM ihw.ceremonie c 
     WHERE c.datum >= date_trunc('month', CURRENT_DATE)
       AND c.datum < date_trunc('month', CURRENT_DATE) + INTERVAL '1 month'
    ) as ceremonies_deze_maand,
    
    -- Average processing time (draft to locked)
    AVG(EXTRACT(EPOCH FROM (locked_at - created_at))/86400) FILTER (WHERE locked_at IS NOT NULL) as avg_dagen_tot_definitief,
    
    -- Payment statistics
    (SELECT SUM(amount_cents) FROM ihw.payment WHERE status = 'paid') as totaal_ontvangen_cents,
    (SELECT COUNT(*) FROM ihw.payment WHERE status = 'pending') as betalingen_openstaand

FROM ihw.dossier;

COMMENT ON VIEW ihw.v_statistics IS 'Dashboard statistieken voor monitoring';

-- ============================================================================
-- Grant view permissions
-- ============================================================================

GRANT SELECT ON ALL TABLES IN SCHEMA ihw TO loket_readonly, app_rw, hb_admin;

-- ============================================================================
-- Views complete
-- ============================================================================

\echo '✓ Views created: v_dossier_summary, v_agenda_overzicht, v_babs_beschikbaarheid'
\echo '✓ Management views: v_dossiers_met_actie_vereist, v_aanstaande_ceremonies, v_statistics'
\echo ''
\echo 'Next: Run 060_seeds.sql'

