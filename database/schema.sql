-- AITrace Datasets Database Schema

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create aitrace schema
CREATE SCHEMA IF NOT EXISTS aitrace;

-- Set search path
SET search_path TO aitrace, public;

-- Teams table
CREATE TABLE aitrace.teams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Users table
CREATE TABLE aitrace.users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'user')),
    team_id UUID NOT NULL REFERENCES aitrace.teams(id) ON DELETE CASCADE,
    must_reset_pwd BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Sessions table
CREATE TABLE aitrace.sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES aitrace.users(id) ON DELETE CASCADE,
    token VARCHAR(255) NOT NULL UNIQUE,
    expires_at TIMESTAMP NOT NULL,
    remember_me BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Schemas table
CREATE TABLE aitrace.schemas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    description VARCHAR(500),
    team_id UUID NOT NULL REFERENCES aitrace.teams(id) ON DELETE CASCADE,
    created_by UUID REFERENCES aitrace.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_by UUID REFERENCES aitrace.users(id) ON DELETE SET NULL,
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE(team_id, name)
);

-- Schema fields table
CREATE TABLE aitrace.schema_fields (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    schema_id UUID NOT NULL REFERENCES aitrace.schemas(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('boolean', 'enum', 'text', 'numeric')),
    required BOOLEAN NOT NULL DEFAULT FALSE,
    default_value TEXT,
    position INTEGER NOT NULL,
    config JSONB DEFAULT '{}',
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE(schema_id, name)
);

-- Datasets table
CREATE TABLE aitrace.datasets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    description VARCHAR(500),
    schema_id UUID NOT NULL REFERENCES aitrace.schemas(id) ON DELETE RESTRICT,
    team_id UUID NOT NULL REFERENCES aitrace.teams(id) ON DELETE CASCADE,
    created_by UUID REFERENCES aitrace.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_by UUID REFERENCES aitrace.users(id) ON DELETE SET NULL,
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE(team_id, name)
);

-- Dataset rows table
CREATE TABLE aitrace.dataset_rows (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    dataset_id UUID NOT NULL REFERENCES aitrace.datasets(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    image_hash VARCHAR(32) NOT NULL,
    data JSONB DEFAULT '{}',
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed')),
    created_by UUID REFERENCES aitrace.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_by UUID REFERENCES aitrace.users(id) ON DELETE SET NULL,
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE(dataset_id, image_hash)
);

-- Indexes for better query performance
CREATE INDEX idx_users_team_id ON aitrace.users(team_id);
CREATE INDEX idx_users_email ON aitrace.users(email);
CREATE INDEX idx_sessions_user_id ON aitrace.sessions(user_id);
CREATE INDEX idx_sessions_token ON aitrace.sessions(token);
CREATE INDEX idx_sessions_expires_at ON aitrace.sessions(expires_at);
CREATE INDEX idx_schemas_team_id ON aitrace.schemas(team_id);
CREATE INDEX idx_schema_fields_schema_id ON aitrace.schema_fields(schema_id);
CREATE INDEX idx_datasets_team_id ON aitrace.datasets(team_id);
CREATE INDEX idx_datasets_schema_id ON aitrace.datasets(schema_id);
CREATE INDEX idx_dataset_rows_dataset_id ON aitrace.dataset_rows(dataset_id);
CREATE INDEX idx_dataset_rows_status ON aitrace.dataset_rows(status);
CREATE INDEX idx_dataset_rows_image_hash ON aitrace.dataset_rows(image_hash);

-- Updated at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for updated_at
CREATE TRIGGER update_teams_updated_at BEFORE UPDATE ON aitrace.teams
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON aitrace.users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_schemas_updated_at BEFORE UPDATE ON aitrace.schemas
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_schema_fields_updated_at BEFORE UPDATE ON aitrace.schema_fields
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_datasets_updated_at BEFORE UPDATE ON aitrace.datasets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_dataset_rows_updated_at BEFORE UPDATE ON aitrace.dataset_rows
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
