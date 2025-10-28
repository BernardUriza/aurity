-- =============================================================================
-- AURITY FRAMEWORK - PostgreSQL Initialization Script
-- =============================================================================
-- Sprint: SPR-2025W44
-- Version: 0.1.0
-- This script runs on database container initialization
-- =============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create application schema
CREATE SCHEMA IF NOT EXISTS aurity;

-- Set search path
SET search_path TO aurity, public;

-- Create roles table (basic RBAC)
CREATE TABLE IF NOT EXISTS roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(50) UNIQUE NOT NULL,
    permissions JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default roles
INSERT INTO roles (name, permissions) VALUES
    ('owner', '{"all": true}'::jsonb),
    ('admin', '{"read": true, "write": true, "delete": false}'::jsonb),
    ('user', '{"read": true, "write": false, "delete": false}'::jsonb)
ON CONFLICT (name) DO NOTHING;

-- Create basic health check function
CREATE OR REPLACE FUNCTION aurity.health_check()
RETURNS TABLE (
    status TEXT,
    check_timestamp TIMESTAMPTZ,
    version TEXT
) AS $$
BEGIN
    RETURN QUERY SELECT
        'healthy'::TEXT as status,
        NOW() as check_timestamp,
        '0.1.0'::TEXT as version;
END;
$$ LANGUAGE plpgsql;

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION aurity.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Grant permissions
GRANT USAGE ON SCHEMA aurity TO PUBLIC;
GRANT ALL ON ALL TABLES IN SCHEMA aurity TO PUBLIC;
GRANT ALL ON ALL SEQUENCES IN SCHEMA aurity TO PUBLIC;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA aurity TO PUBLIC;

-- Logging
\echo 'Aurity Framework database initialized successfully'
\echo 'Version: 0.1.0'
\echo 'Schema: aurity'
