-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Create a function to create client-specific vector tables
CREATE OR REPLACE FUNCTION create_client_vector_table(
  client_id INTEGER,
  table_name VARCHAR(100),
  dimensions INTEGER DEFAULT 1536
) RETURNS VOID AS $$
BEGIN
  EXECUTE format('
    CREATE TABLE IF NOT EXISTS %I (
      id SERIAL PRIMARY KEY,
      content TEXT NOT NULL,
      embedding vector(%s),
      metadata JSONB,
      chunk_index INTEGER,
      source_document_id INTEGER,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )', table_name, dimensions);
    
  -- Create vector index
  EXECUTE format('
    CREATE INDEX IF NOT EXISTS %I ON %I 
    USING ivfflat (embedding vector_cosine_ops)
    WITH (lists = 100)', 
    table_name || '_embedding_idx', 
    table_name);
    
  -- Create metadata index
  EXECUTE format('
    CREATE INDEX IF NOT EXISTS %I ON %I (metadata)',
    table_name || '_metadata_idx',
    table_name);
    
  -- Create document index
  EXECUTE format('
    CREATE INDEX IF NOT EXISTS %I ON %I (source_document_id)',
    table_name || '_document_idx',
    table_name);
END;
$$ LANGUAGE plpgsql;

-- Create a function to drop client-specific vector tables
CREATE OR REPLACE FUNCTION drop_client_vector_table(table_name VARCHAR(100)) RETURNS VOID AS $$
BEGIN
  EXECUTE format('DROP TABLE IF EXISTS %I CASCADE', table_name);
END;
$$ LANGUAGE plpgsql;
