-- ============================================================================
-- ihuwelijk Seed Data
-- Version: 1.0
-- Description: Initial configuration data for ihuwelijk system
-- ============================================================================

SET search_path TO ihw, public;

-- ============================================================================
-- SEED: Type Ceremonie (ceremony types)
-- ============================================================================

INSERT INTO ihw.type_ceremonie (code, naam, omschrijving, eigen_babs_toegestaan, gratis, budget, openstelling_weken, lead_time_days, wijzigbaar_tot_days, max_getuigen, volgorde)
VALUES
    -- Gratis ceremonies
    ('gratis_stadhuis', 'Gratis huwelijk stadhuis', 'Standaard gratis ceremonie op het stadhuis', false, true, false, 2, 14, 7, 4, 10),
    ('gratis_stadsloket', 'Gratis huwelijk stadsloket', 'Standaard gratis ceremonie op een stadsloket', false, true, false, 2, 14, 7, 4, 20),
    
    -- Flash ceremonies
    ('flash_15min', 'Flash ceremonie (15 minuten)', 'Korte ceremonie van 15 minuten', false, false, true, 6, 7, 3, 4, 30),
    ('flash_30min', 'Flash ceremonie (30 minuten)', 'Ceremonie van 30 minuten', false, false, true, 6, 7, 3, 4, 40),
    
    -- Budget ceremonies
    ('budget_1uur', 'Budget ceremonie (1 uur)', 'Ceremonie van 1 uur op stadhuis of stadsloket', false, false, true, 6, 14, 7, 4, 50),
    ('budget_1_5uur', 'Budget ceremonie (1,5 uur)', 'Ceremonie van 1,5 uur op stadhuis of stadsloket', false, false, true, 6, 14, 7, 4, 60),
    
    -- Premium ceremonies (eigen BABS toegestaan)
    ('premium_eigen_babs', 'Premium ceremonie (eigen BABS)', 'Ceremonie met eigen gekozen BABS', true, false, false, 6, 120, 14, 4, 70),
    ('premium_buitenlocatie', 'Premium ceremonie (buitenlocatie)', 'Ceremonie op bijzondere locatie', true, false, false, 6, 60, 14, 4, 80)
ON CONFLICT (code) DO UPDATE SET
    naam = EXCLUDED.naam,
    omschrijving = EXCLUDED.omschrijving,
    eigen_babs_toegestaan = EXCLUDED.eigen_babs_toegestaan,
    gratis = EXCLUDED.gratis,
    budget = EXCLUDED.budget,
    openstelling_weken = EXCLUDED.openstelling_weken,
    lead_time_days = EXCLUDED.lead_time_days,
    wijzigbaar_tot_days = EXCLUDED.wijzigbaar_tot_days,
    max_getuigen = EXCLUDED.max_getuigen,
    volgorde = EXCLUDED.volgorde,
    updated_at = CURRENT_TIMESTAMP;

\echo '✓ Seeded 8 ceremony types'

-- ============================================================================
-- SEED: Locaties (example locations - 400+ in production)
-- ============================================================================

INSERT INTO ihw.locatie (code, naam, type, adres, capaciteit, prijs_cents, volgorde)
VALUES
    -- Stadhuizen
    ('stadhuis_dam', 'Stadhuis Amsterdam - Trouwzaal', 'stadhuis', 
     '{"straat":"Oudezijds Voorburgwal","huisnummer":"197","postcode":"1012 EX","plaats":"Amsterdam"}'::jsonb, 
     50, 0, 10),
    ('stadhuis_graafzaal', 'Stadhuis Amsterdam - Graventeen', 'stadhuis',
     '{"straat":"Oudezijds Voorburgwal","huisnummer":"197","postcode":"1012 EX","plaats":"Amsterdam"}'::jsonb,
     30, 0, 20),
    
    -- Stadsloketten
    ('loket_west', 'Stadsloket West', 'stadsloket',
     '{"straat":"Jan van Galenstraat","huisnummer":"315","postcode":"1061 AX","plaats":"Amsterdam"}'::jsonb,
     20, 0, 100),
    ('loket_oost', 'Stadsloket Oost', 'stadsloket',
     '{"straat":"Oranje-Vrijstaatkade","huisnummer":"21","postcode":"1093 KS","plaats":"Amsterdam"}'::jsonb,
     20, 0, 110),
    ('loket_noord', 'Stadsloket Noord', 'stadsloket',
     '{"straat":"Buikslotermeerplein","huisnummer":"1201","postcode":"1025 XC","plaats":"Amsterdam"}'::jsonb,
     20, 0, 120),
    ('loket_zuid', 'Stadsloket Zuid', 'stadsloket',
     '{"straat":"Laan van Spartaan","huisnummer":"1","postcode":"1062 MA","plaats":"Amsterdam"}'::jsonb,
     20, 0, 130),
    ('loket_zuidoost', 'Stadsloket Zuidoost', 'stadsloket',
     '{"straat":"Anton de Komplein","huisnummer":"150","postcode":"1102 DR","plaats":"Amsterdam"}'::jsonb,
     20, 0, 140),
    
    -- Bijzondere locaties (voorbeeld)
    ('hermitage', 'Hermitage Amsterdam', 'buitenlocatie',
     '{"straat":"Amstel","huisnummer":"51","postcode":"1018 EJ","plaats":"Amsterdam"}'::jsonb,
     80, 150000, 200), -- €1500
    ('scheepvaartmuseum', 'Het Scheepvaartmuseum', 'buitenlocatie',
     '{"straat":"Kattenburgerplein","huisnummer":"1","postcode":"1018 KK","plaats":"Amsterdam"}'::jsonb,
     60, 125000, 210), -- €1250
    ('tropenmuseum', 'Tropenmuseum', 'buitenlocatie',
     '{"straat":"Linnaeusstraat","huisnummer":"2","postcode":"1092 CK","plaats":"Amsterdam"}'::jsonb,
     100, 175000, 220) -- €1750
ON CONFLICT (code) DO UPDATE SET
    naam = EXCLUDED.naam,
    type = EXCLUDED.type,
    adres = EXCLUDED.adres,
    capaciteit = EXCLUDED.capaciteit,
    prijs_cents = EXCLUDED.prijs_cents,
    volgorde = EXCLUDED.volgorde,
    updated_at = CURRENT_TIMESTAMP;

\echo '✓ Seeded 10 locations (expand to 400+ in production)'

-- ============================================================================
-- SEED: BABS (example BABS - gemeente employees)
-- ============================================================================

INSERT INTO ihw.babs (code, voornaam, achternaam, naam, status, beedigd_vanaf, beedigd_tot)
VALUES
    ('babs_001', 'Jan', 'de Vries', 'Jan de Vries', 'beedigd', '2020-01-01', '2026-01-01'),
    ('babs_002', 'Marie', 'van der Berg', 'Marie van der Berg', 'beedigd', '2021-06-01', '2027-06-01'),
    ('babs_003', 'Peter', 'Jansen', 'Peter Jansen', 'beedigd', '2022-03-01', '2028-03-01'),
    ('babs_004', 'Sophie', 'Bakker', 'Sophie Bakker', 'beedigd', '2023-01-01', '2029-01-01'),
    ('babs_005', 'Mohamed', 'El Amrani', 'Mohamed El Amrani', 'beedigd', '2023-06-01', '2029-06-01')
ON CONFLICT (code) DO UPDATE SET
    voornaam = EXCLUDED.voornaam,
    achternaam = EXCLUDED.achternaam,
    naam = EXCLUDED.naam,
    status = EXCLUDED.status,
    beedigd_vanaf = EXCLUDED.beedigd_vanaf,
    beedigd_tot = EXCLUDED.beedigd_tot,
    updated_at = CURRENT_TIMESTAMP;

\echo '✓ Seeded 5 BABS (gemeente employees)'

-- ============================================================================
-- SEED: Sample tijdslots (next 3 months, Monday-Friday, 9:00-16:00)
-- ============================================================================

-- Generate time slots for stadhuis (gratis locations) - 2 weeks ahead
DO $$
DECLARE
    loc_rec record;
    dagen int := 14; -- 2 weeks for gratis
    d int;
    current_date date := CURRENT_DATE;
    slot_time time;
BEGIN
    FOR loc_rec IN 
        SELECT id FROM ihw.locatie WHERE type = 'stadhuis' LIMIT 2
    LOOP
        FOR d IN 0..dagen LOOP
            -- Skip weekends
            IF EXTRACT(DOW FROM current_date + d) NOT IN (0, 6) THEN
                -- 9:00, 10:30, 12:00, 13:30, 15:00
                FOR slot_time IN 
                    SELECT t FROM (VALUES 
                        ('09:00'::time),
                        ('10:30'::time),
                        ('12:00'::time),
                        ('13:30'::time),
                        ('15:00'::time)
                    ) AS times(t)
                LOOP
                    INSERT INTO ihw.tijdslot (locatie_id, datum, start_tijd, eind_tijd, capacity, gemeente_oin)
                    VALUES (
                        loc_rec.id,
                        current_date + d,
                        slot_time,
                        slot_time + INTERVAL '1 hour',
                        1,
                        '00000001002564440000'  -- Default gemeente: Amsterdam
                    )
                    ON CONFLICT DO NOTHING;
                END LOOP;
            END IF;
        END LOOP;
    END LOOP;
END $$;

-- Generate time slots for premium locations - 6 weeks ahead
DO $$
DECLARE
    loc_rec record;
    dagen int := 42; -- 6 weeks for premium
    d int;
    current_date date := CURRENT_DATE;
    slot_time time;
BEGIN
    FOR loc_rec IN 
        SELECT id FROM ihw.locatie WHERE type = 'buitenlocatie' LIMIT 3
    LOOP
        FOR d IN 0..dagen LOOP
            -- Skip weekends
            IF EXTRACT(DOW FROM current_date + d) NOT IN (0, 6) THEN
                -- 10:00, 14:00, 16:00
                FOR slot_time IN 
                    SELECT t FROM (VALUES 
                        ('10:00'::time),
                        ('14:00'::time),
                        ('16:00'::time)
                    ) AS times(t)
                LOOP
                    INSERT INTO ihw.tijdslot (locatie_id, datum, start_tijd, eind_tijd, capacity, gemeente_oin)
                    VALUES (
                        loc_rec.id,
                        current_date + d,
                        slot_time,
                        slot_time + INTERVAL '2 hours', -- Longer slots for premium
                        1,
                        '00000001002564440000'  -- Default gemeente: Amsterdam
                    )
                    ON CONFLICT DO NOTHING;
                END LOOP;
            END IF;
        END LOOP;
    END LOOP;
END $$;

\echo '✓ Generated time slots for next 2-6 weeks (depending on location type)'

-- ============================================================================
-- Seed data complete
-- ============================================================================

\echo ''
\echo '═══════════════════════════════════════════════════════════════════'
\echo '✓ Seed data loaded successfully'
\echo '═══════════════════════════════════════════════════════════════════'
\echo ''
\echo 'Configuration:'
\echo '  - 8 ceremony types (gratis, flash, budget, premium)'
\echo '  - 10 sample locations (expand to 400+ in production)'
\echo '  - 5 BABS (gemeente employees)'
\echo '  - Time slots generated for next 2-6 weeks'
\echo ''
\echo 'Database is ready for use!'
\echo ''

