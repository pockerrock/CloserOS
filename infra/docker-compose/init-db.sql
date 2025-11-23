-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Create additional extensions if needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Grant permissions on database
GRANT ALL PRIVILEGES ON DATABASE closeros_dev TO closeros;

-- Grant permissions on schema
GRANT ALL ON SCHEMA public TO closeros;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO closeros;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO closeros;

-- Grant permissions on future objects
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO closeros;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO closeros;
