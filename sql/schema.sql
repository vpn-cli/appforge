-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Table: apps
CREATE TABLE apps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  config JSONB DEFAULT '{}'::jsonb,
  published_config JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on apps
ALTER TABLE apps ENABLE ROW LEVEL SECURITY;

-- Policies for apps
CREATE POLICY "Users can create their own apps" ON apps FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view their own apps" ON apps FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own apps" ON apps FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own apps" ON apps FOR DELETE USING (auth.uid() = user_id);


-- Table: validation_logs
CREATE TABLE validation_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  app_id UUID NOT NULL REFERENCES apps(id) ON DELETE CASCADE,
  error_count INTEGER DEFAULT 0,
  warning_count INTEGER DEFAULT 0,
  details JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on validation_logs
ALTER TABLE validation_logs ENABLE ROW LEVEL SECURITY;

-- Policies for validation_logs
CREATE POLICY "Users can view their own validation logs" ON validation_logs 
  FOR SELECT USING (EXISTS (SELECT 1 FROM apps WHERE apps.id = validation_logs.app_id AND apps.user_id = auth.uid()));

CREATE POLICY "Users can insert their own validation logs" ON validation_logs 
  FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM apps WHERE apps.id = validation_logs.app_id AND apps.user_id = auth.uid()));


-- Table: app_schemas
CREATE TABLE app_schemas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  app_id UUID NOT NULL REFERENCES apps(id) ON DELETE CASCADE,
  table_name TEXT NOT NULL,
  schema_definition JSONB DEFAULT '{}'::jsonb,
  UNIQUE(app_id, table_name)
);

-- Enable RLS on app_schemas
ALTER TABLE app_schemas ENABLE ROW LEVEL SECURITY;

-- Policies for app_schemas
CREATE POLICY "Users can view schemas for their apps" ON app_schemas 
  FOR SELECT USING (EXISTS (SELECT 1 FROM apps WHERE apps.id = app_schemas.app_id AND apps.user_id = auth.uid()));

CREATE POLICY "Users can update their own app schemas" ON app_schemas 
  FOR ALL USING (EXISTS (SELECT 1 FROM apps WHERE apps.id = app_schemas.app_id AND apps.user_id = auth.uid()));

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
