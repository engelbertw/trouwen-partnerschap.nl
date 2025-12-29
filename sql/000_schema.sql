-- ============================================================================
-- ihuwelijk Database Schema Initialization
-- Version: 1.0
-- Database: PostgreSQL 15+ (Neon compatible)
-- Description: Creates the ihw schema for digital marriage process
-- ============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "btree_gist"; -- For EXCLUDE constraints

-- Create schemas
CREATE SCHEMA IF NOT EXISTS ihw;
COMMENT ON SCHEMA ihw IS 'ihuwelijk - Digital marriage process system';

-- Set search path
SET search_path TO ihw, public;

-- ============================================================================
-- Database Roles and Security
-- ============================================================================

-- Create application roles (if not exists)
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'loket_readonly') THEN
        CREATE ROLE loket_readonly NOLOGIN;
    END IF;
    
    IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'hb_admin') THEN
        CREATE ROLE hb_admin NOLOGIN;
    END IF;
    
    IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'app_rw') THEN
        CREATE ROLE app_rw NOLOGIN;
    END IF;
END
$$;

COMMENT ON ROLE loket_readonly IS 'Read-only access for loket employees';
COMMENT ON ROLE hb_admin IS 'Full access for huwelijksbureau administrators';
COMMENT ON ROLE app_rw IS 'Read-write access for application';

-- Grant schema usage
GRANT USAGE ON SCHEMA ihw TO loket_readonly, hb_admin, app_rw;

-- ============================================================================
-- Grant default permissions
-- ============================================================================

-- loket_readonly: only SELECT
ALTER DEFAULT PRIVILEGES IN SCHEMA ihw GRANT SELECT ON TABLES TO loket_readonly;

-- app_rw: SELECT, INSERT, UPDATE (no DELETE)
ALTER DEFAULT PRIVILEGES IN SCHEMA ihw GRANT SELECT, INSERT, UPDATE ON TABLES TO app_rw;
ALTER DEFAULT PRIVILEGES IN SCHEMA ihw GRANT USAGE ON SEQUENCES TO app_rw;

-- hb_admin: full control
ALTER DEFAULT PRIVILEGES IN SCHEMA ihw GRANT ALL ON TABLES TO hb_admin;
ALTER DEFAULT PRIVILEGES IN SCHEMA ihw GRANT ALL ON SEQUENCES TO hb_admin;

-- ============================================================================
-- Audit/utility functions
-- ============================================================================

CREATE OR REPLACE FUNCTION ihw.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION ihw.update_updated_at() IS 'Trigger function to automatically update updated_at timestamp';

-- ============================================================================
-- Schema initialization complete
-- ============================================================================

\echo '✓ Schema ihw created'
\echo '✓ Extensions enabled: uuid-ossp, pgcrypto, btree_gist'
\echo '✓ Roles configured: loket_readonly, hb_admin, app_rw'
\echo ''
\echo 'Next: Run 010_enums_lookups.sql'

