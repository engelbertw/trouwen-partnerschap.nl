-- Keycloak Database Initialization
-- This script runs on first PostgreSQL container startup

-- Create Keycloak database (already created by POSTGRES_DB, but kept for reference)
-- CREATE DATABASE keycloak;

-- Set optimal PostgreSQL settings for Keycloak
ALTER SYSTEM SET max_connections = 200;
ALTER SYSTEM SET shared_buffers = '256MB';
ALTER SYSTEM SET effective_cache_size = '1GB';
ALTER SYSTEM SET maintenance_work_mem = '64MB';
ALTER SYSTEM SET checkpoint_completion_target = 0.9;
ALTER SYSTEM SET wal_buffers = '16MB';
ALTER SYSTEM SET default_statistics_target = 100;
ALTER SYSTEM SET random_page_cost = 1.1;
ALTER SYSTEM SET effective_io_concurrency = 200;
ALTER SYSTEM SET work_mem = '4MB';
ALTER SYSTEM SET min_wal_size = '1GB';
ALTER SYSTEM SET max_wal_size = '4GB';

-- Select database
\c keycloak;

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";

-- Create audit table for BSN access (GDPR/AVG compliance)
CREATE TABLE IF NOT EXISTS bsn_audit_log (
    id SERIAL PRIMARY KEY,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    user_id VARCHAR(255) NOT NULL,
    bsn VARCHAR(9),
    action VARCHAR(50) NOT NULL, -- 'READ', 'CREATE', 'UPDATE', 'DELETE'
    actor VARCHAR(255) NOT NULL, -- Who accessed the data
    ip_address INET,
    user_agent TEXT,
    purpose TEXT, -- Legal basis for access
    result VARCHAR(20) DEFAULT 'SUCCESS', -- 'SUCCESS', 'FAILED', 'DENIED'
    CONSTRAINT bsn_format_check CHECK (bsn ~ '^\d{9}$' OR bsn IS NULL)
);

-- Index for audit queries
CREATE INDEX IF NOT EXISTS idx_bsn_audit_timestamp ON bsn_audit_log(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_bsn_audit_user_id ON bsn_audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_bsn_audit_actor ON bsn_audit_log(actor);

-- Create function for automatic audit logging
CREATE OR REPLACE FUNCTION log_bsn_access()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO bsn_audit_log (user_id, bsn, action, actor, purpose)
    VALUES (
        COALESCE(NEW.user_id, OLD.user_id),
        COALESCE(NEW.bsn, OLD.bsn),
        TG_OP,
        current_user,
        'Automated trigger'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Grant permissions to Keycloak user
GRANT ALL PRIVILEGES ON DATABASE keycloak TO keycloak;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO keycloak;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO keycloak;
GRANT USAGE ON SCHEMA public TO keycloak;

-- Create comment for documentation
COMMENT ON TABLE bsn_audit_log IS 'Audit trail for BSN access - required for AVG/GDPR compliance';
COMMENT ON COLUMN bsn_audit_log.bsn IS 'Burgerservicenummer - bijzonder persoonsgegeven';
COMMENT ON COLUMN bsn_audit_log.purpose IS 'Legal basis for processing BSN data';

\echo 'Keycloak database initialization complete'

