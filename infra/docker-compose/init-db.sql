-- This script runs when the PostgreSQL container is first initialized
-- It runs in the context of the database specified by POSTGRES_DB (closeros_dev)

-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Create additional extensions if needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- The POSTGRES_USER (closeros) already owns this database (closeros_dev)
-- Just ensure they have all necessary permissions on the public schema

GRANT ALL ON SCHEMA public TO closeros;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO closeros;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO closeros;
GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public TO closeros;

-- Grant permissions on future objects
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO closeros;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO closeros;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO closeros;
