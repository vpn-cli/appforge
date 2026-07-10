-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Table: apps
CREATE TABLE apps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL, -- Decoupled from auth.users to support Clerk string IDs
  name TEXT NOT NULL,
  config JSONB DEFAULT '{}'::jsonb,
  published_config JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Disabled for Clerk compatibility. 
-- Security is exclusively managed by Next.js Server Actions checking auth() context.

-- Table: validation_logs
CREATE TABLE validation_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  app_id UUID NOT NULL REFERENCES apps(id) ON DELETE CASCADE,
  error_count INTEGER DEFAULT 0,
  warning_count INTEGER DEFAULT 0,
  details JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Disabled for Clerk compatibility.

-- Table: app_schemas
CREATE TABLE app_schemas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  app_id UUID NOT NULL REFERENCES apps(id) ON DELETE CASCADE,
  table_name TEXT NOT NULL,
  schema_definition JSONB DEFAULT '{}'::jsonb,
  UNIQUE(app_id, table_name)
);

-- RLS Disabled for Clerk compatibility.
-- Set up trigger for updated_at
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_apps_modtime
BEFORE UPDATE ON apps
FOR EACH ROW EXECUTE FUNCTION update_modified_column();
