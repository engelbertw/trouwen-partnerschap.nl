-- =====================================================
-- Add 'workdays' rule type to locatie_recurring_rule
-- File: sql/migrations/094_add_workdays_rule_type_locatie.sql
-- =====================================================

\echo 'Migration 094: Add workdays rule type to locatie_recurring_rule'

-- Drop the old constraint
ALTER TABLE ihw.locatie_recurring_rule 
  DROP CONSTRAINT IF EXISTS locatie_recurring_rule_rule_type_check;

-- Add the new constraint with 'workdays' included
ALTER TABLE ihw.locatie_recurring_rule 
  ADD CONSTRAINT locatie_recurring_rule_rule_type_check 
  CHECK (rule_type IN ('weekly', 'biweekly', 'monthly_day', 'monthly_weekday', 'workdays', 'custom'));

\echo '✅ Added workdays to locatie_recurring_rule rule_type constraint'

