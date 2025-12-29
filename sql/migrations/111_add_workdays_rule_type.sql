-- Migration: Add 'workdays' to babs_recurring_rule rule_type constraint
-- Description: Extends the rule_type check constraint to support 'workdays' (Monday-Friday)
-- Date: 2025-12-28

\echo '===================================================='
\echo 'Migration 111: Add workdays rule type'
\echo '===================================================='

-- Drop the existing check constraint
ALTER TABLE ihw.babs_recurring_rule 
  DROP CONSTRAINT IF EXISTS babs_recurring_rule_rule_type_check;

-- Add the new constraint with 'workdays' included
ALTER TABLE ihw.babs_recurring_rule 
  ADD CONSTRAINT babs_recurring_rule_rule_type_check 
  CHECK (rule_type IN ('weekly', 'biweekly', 'monthly_day', 'monthly_weekday', 'workdays'));

\echo '✅ Added workdays to rule_type constraint'

