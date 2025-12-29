-- Migration: Update get_babs_available_slots to support 'workdays'
-- Description: Extends the function to handle the new 'workdays' rule type
-- Date: 2025-12-28

\echo '===================================================='
\echo 'Migration 112: Update get_babs_available_slots for workdays'
\echo '===================================================='

-- Drop the existing function
DROP FUNCTION IF EXISTS ihw.get_babs_available_slots(uuid, date);

-- Recreate with workdays support
CREATE OR REPLACE FUNCTION ihw.get_babs_available_slots(
  p_babs_id uuid,
  p_date date
)
RETURNS TABLE (
  start_time time,
  end_time time,
  source text,
  rule_id uuid
) AS $$
BEGIN
  -- Get all recurring rules that apply to this date
  RETURN QUERY
  SELECT 
    r.start_time,
    r.end_time,
    'recurring_rule'::text as source,
    r.id as rule_id
  FROM ihw.babs_recurring_rule r
  WHERE r.babs_id = p_babs_id
    AND r.valid_from <= p_date
    AND (r.valid_until IS NULL OR r.valid_until >= p_date)
    AND (
      -- Weekly rule
      (r.rule_type = 'weekly' AND EXTRACT(DOW FROM p_date)::integer = r.day_of_week)
      OR
      -- Workdays rule (Monday=1 to Friday=5)
      (r.rule_type = 'workdays' AND EXTRACT(DOW FROM p_date)::integer BETWEEN 1 AND 5)
      OR
      -- Biweekly rule (simplified - needs more logic for exact bi-weekly)
      (r.rule_type = 'biweekly' AND EXTRACT(DOW FROM p_date)::integer = r.day_of_week)
      OR
      -- Monthly by day
      (r.rule_type = 'monthly_day' AND EXTRACT(DAY FROM p_date)::integer = r.day_of_month)
      OR
      -- Monthly by weekday (simplified)
      (r.rule_type = 'monthly_weekday' AND EXTRACT(DOW FROM p_date)::integer = r.day_of_week)
    )
    -- Exclude if blocked
    AND NOT EXISTS (
      SELECT 1 FROM ihw.babs_blocked_date b
      WHERE b.babs_id = p_babs_id
        AND b.blocked_date = p_date
        AND (
          b.all_day = true
          OR (b.start_time <= r.start_time AND b.end_time >= r.end_time)
        )
    );
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION ihw.get_babs_available_slots IS 
  'Bereken beschikbare tijdslots voor een BABS op een specifieke datum, inclusief workdays support';

\echo '✅ Updated get_babs_available_slots function with workdays support'

