Tables : 
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE files (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  original_name TEXT NOT NULL,
  stored_name TEXT NOT NULL,
  mime_type TEXT,
  size BIGINT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE transfers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  file_id UUID REFERENCES files(id) ON DELETE CASCADE,
  transfer_code VARCHAR(6) UNIQUE NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  downloads INT DEFAULT 0,
  max_downloads INT DEFAULT 1,
  is_active BOOLEAN DEFAULT true
);
