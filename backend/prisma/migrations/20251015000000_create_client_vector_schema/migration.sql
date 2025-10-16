-- Create client_vectors schema to organize client-specific vector tables
-- This schema will contain all client vector tables to keep them separate from main tables

-- Enable pgvector extension if not already enabled
CREATE EXTENSION IF NOT EXISTS vector;

-- Create dedicated schema for client vector tables
CREATE SCHEMA IF NOT EXISTS client_vectors;

-- Grant necessary permissions (adjust based on your database user)
GRANT USAGE ON SCHEMA client_vectors TO PUBLIC;
GRANT CREATE ON SCHEMA client_vectors TO PUBLIC;

-- Add comment to explain the schema purpose
COMMENT ON SCHEMA client_vectors IS 'Schema containing vector tables for each client. Each client gets their own chunks table named client_{userId}_chunks';

-- Note: Individual client vector tables will be created dynamically when clients register
-- Table structure for each client will be:
-- 
-- CREATE TABLE client_vectors.client_{userId}_chunks (
--   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
--   document_id TEXT NOT NULL,
--   chunk_text TEXT NOT NULL,
--   embedding vector(1536),
--   metadata JSONB DEFAULT '{}',
--   created_at TIMESTAMP DEFAULT NOW(),
--   updated_at TIMESTAMP DEFAULT NOW()
-- );
-- 
-- With indexes:
-- - ivfflat index on embedding for fast similarity search
-- - B-tree index on document_id for fast document-based queries
-- - GIN index on metadata->'chunk_index' for chunk ordering queries
-- 
-- Note: chunk_index is stored in metadata JSONB field, not as separate column

