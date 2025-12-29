-- =====================================================
-- BABS Calendar Beschikbaarheid
-- File: sql/migrations/091_babs_calendar_beschikbaarheid.sql
-- =====================================================

-- ============================================================================
-- BABS Recurring Rules (Terugkerende patronen)
-- ============================================================================

CREATE TABLE IF NOT EXISTS ihw.babs_recurring_rule (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  babs_id uuid NOT NULL REFERENCES ihw.babs(id) ON DELETE CASCADE,
  
  -- Rule configuration
  rule_type text NOT NULL CHECK (rule_type IN (
    'weekly',           -- Elke week op specifieke dag
    'biweekly',        -- Om de week
    'monthly_day',     -- Elke maand op specifieke dag (bijv. de 15e)
    'monthly_weekday', -- Elke maand op specifieke weekdag (bijv. 2e zondag)
    'custom'           -- Custom RRULE string
  )),
  
  -- Frequency details
  day_of_week integer,        -- 0=zondag, 1=maandag, ..., 6=zaterdag
  day_of_month integer,       -- 1-31 voor monthly_day
  week_of_month integer,      -- 1-5 voor monthly_weekday (1=eerste, 2=tweede, etc)
  interval_weeks integer,     -- Voor biweekly: om de hoeveel weken
  
  -- Time slots
  start_time time NOT NULL,   -- Start tijd (bijv. 09:00)
  end_time time NOT NULL,     -- Eind tijd (bijv. 17:00)
  
  -- Validity period
  valid_from date NOT NULL,
  valid_until date,           -- NULL = onbeperkt
  
  -- Custom RRULE (for advanced cases)
  rrule_string text,          -- RFC 5545 RRULE format
  
  -- Metadata
  description text,           -- Beschrijving van de regel
  created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT chk_day_of_week CHECK (day_of_week IS NULL OR (day_of_week >= 0 AND day_of_week <= 6)),
  CONSTRAINT chk_day_of_month CHECK (day_of_month IS NULL OR (day_of_month >= 1 AND day_of_month <= 31)),
  CONSTRAINT chk_week_of_month CHECK (week_of_month IS NULL OR (week_of_month >= 1 AND week_of_month <= 5)),
  CONSTRAINT chk_time_order CHECK (start_time < end_time)
);

CREATE INDEX idx_babs_recurring_rule_babs_id ON ihw.babs_recurring_rule(babs_id);
CREATE INDEX idx_babs_recurring_rule_validity ON ihw.babs_recurring_rule(valid_from, valid_until);

COMMENT ON TABLE ihw.babs_recurring_rule IS 
  'Terugkerende beschikbaarheidsregels voor BABS (bijv. "elke maandag 09:00-17:00")';

COMMENT ON COLUMN ihw.babs_recurring_rule.rule_type IS 
  'Type regel: weekly, biweekly, monthly_day, monthly_weekday, custom';

COMMENT ON COLUMN ihw.babs_recurring_rule.rrule_string IS 
  'RFC 5545 RRULE format voor complexe patronen (optioneel)';

-- ============================================================================
-- BABS Blocked Dates (Geblokkeerde datums)
-- ============================================================================

CREATE TABLE IF NOT EXISTS ihw.babs_blocked_date (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  babs_id uuid NOT NULL REFERENCES ihw.babs(id) ON DELETE CASCADE,
  
  -- Date and time
  blocked_date date NOT NULL,
  all_day boolean NOT NULL DEFAULT true,
  start_time time,            -- Voor specifieke tijdslots
  end_time time,              -- Voor specifieke tijdslots
  
  -- Reason
  reason text,                -- Waarom geblokkeerd (bijv. "Vakantie", "Ziek")
  
  -- Metadata
  created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_by text,            -- User ID die blokkering aanmaakte
  
  CONSTRAINT chk_time_when_not_all_day CHECK (
    all_day = true OR (start_time IS NOT NULL AND end_time IS NOT NULL)
  ),
  CONSTRAINT chk_blocked_time_order CHECK (
    all_day = true OR start_time < end_time
  )
);

CREATE INDEX idx_babs_blocked_date_babs_id ON ihw.babs_blocked_date(babs_id);
CREATE INDEX idx_babs_blocked_date_date ON ihw.babs_blocked_date(blocked_date);
CREATE INDEX idx_babs_blocked_date_lookup ON ihw.babs_blocked_date(babs_id, blocked_date);

COMMENT ON TABLE ihw.babs_blocked_date IS 
  'Geblokkeerde datums voor BABS (vakantie, ziek, etc)';

COMMENT ON COLUMN ihw.babs_blocked_date.all_day IS 
  'Als true: hele dag geblokkeerd. Als false: specifiek tijdslot';

-- ============================================================================
-- BABS Available Slots (Computed view)
-- ============================================================================

-- View to compute available slots for a BABS on a given date
-- This combines recurring rules and subtracts blocked dates

CREATE OR REPLACE FUNCTION ihw.get_babs_available_slots(
  p_babs_id uuid,
  p_date date
) RETURNS TABLE (
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
  'Bereken beschikbare tijdslots voor een BABS op een specifieke datum';

-- ============================================================================
-- Sample Data
-- ============================================================================

-- Example: BABS available every Monday 09:00-17:00
-- (This is just an example, will be populated via UI)

