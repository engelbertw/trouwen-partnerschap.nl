-- =====================================================
-- Function: find_available_ceremony_slots
-- File: sql/migrations/097_find_available_ceremony_slots.sql
-- Description: Finds available time slots where both BABS and location are available
-- =====================================================

\echo 'Migration 097: Create find_available_ceremony_slots function'

-- Drop existing function if it exists
DROP FUNCTION IF EXISTS ihw.find_available_ceremony_slots(uuid, uuid, integer, date, date);

-- Create function to find available ceremony slots
CREATE OR REPLACE FUNCTION ihw.find_available_ceremony_slots(
  p_locatie_id uuid,
  p_babs_id uuid,
  p_duur_minuten integer,
  p_start_date date,
  p_end_date date
)
RETURNS TABLE (
  datum date,
  start_tijd time,
  eind_tijd time,
  locatie_naam text,
  babs_naam text
) AS $$
BEGIN
  RETURN QUERY
  WITH locatie_slots AS (
    SELECT 
      p_date::date as datum,
      slot.start_time,
      (slot.start_time + (p_duur_minuten || ' minutes')::interval)::time as eind_tijd
    FROM generate_series(p_start_date, p_end_date, '1 day'::interval) as p_date
    CROSS JOIN LATERAL (
      SELECT * FROM ihw.get_locatie_available_slots(p_locatie_id, p_date::date)
    ) slot
    WHERE (slot.start_time + (p_duur_minuten || ' minutes')::interval) <= slot.end_time
  ),
  babs_slots AS (
    SELECT 
      p_date::date as datum,
      slot.start_time,
      (slot.start_time + (p_duur_minuten || ' minutes')::interval)::time as eind_tijd
    FROM generate_series(p_start_date, p_end_date, '1 day'::interval) as p_date
    CROSS JOIN LATERAL (
      SELECT * FROM ihw.get_babs_available_slots(p_babs_id, p_date::date)
    ) slot
    WHERE (slot.start_time + (p_duur_minuten || ' minutes')::interval) <= slot.end_time
  )
  SELECT 
    ls.datum,
    ls.start_tijd,
    ls.eind_tijd,
    l.naam as locatie_naam,
    b.naam as babs_naam
  FROM locatie_slots ls
  INNER JOIN babs_slots bs ON 
    ls.datum = bs.datum AND
    ls.start_tijd = bs.start_tijd
  INNER JOIN ihw.locatie l ON l.id = p_locatie_id
  INNER JOIN ihw.babs b ON b.id = p_babs_id
  WHERE NOT EXISTS (
    -- Check of er al een ceremonie is op dit tijdstip voor de locatie
    SELECT 1 FROM ihw.ceremonie c
    WHERE c.locatie_id = p_locatie_id
      AND c.datum = ls.datum
      AND (
        (c.start_tijd <= ls.start_tijd AND c.eind_tijd > ls.start_tijd) OR
        (c.start_tijd < ls.eind_tijd AND c.eind_tijd >= ls.eind_tijd) OR
        (c.start_tijd >= ls.start_tijd AND c.eind_tijd <= ls.eind_tijd)
      )
  )
  AND NOT EXISTS (
    -- Check of er al een ceremonie is op dit tijdstip voor de BABS
    SELECT 1 FROM ihw.ceremonie c
    WHERE c.babs_id = p_babs_id
      AND c.datum = ls.datum
      AND (
        (c.start_tijd <= ls.start_tijd AND c.eind_tijd > ls.start_tijd) OR
        (c.start_tijd < ls.eind_tijd AND c.eind_tijd >= ls.eind_tijd) OR
        (c.start_tijd >= ls.start_tijd AND c.eind_tijd <= ls.eind_tijd)
      )
  )
  -- Check of BABS de vereiste talen spreekt (als p_talen parameter wordt meegegeven)
  AND (
    -- Als er geen taal filter is, accepteer alle BABS
    -- (taal matching wordt gedaan in de API laag)
    true
  )
  ORDER BY ls.datum, ls.start_tijd;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION ihw.find_available_ceremony_slots IS 
  'Vind beschikbare tijdslots waarbij zowel BABS als locatie beschikbaar zijn voor de opgegeven duur';

\echo '✅ Created find_available_ceremony_slots function'

