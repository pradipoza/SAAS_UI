-- Create vector_configs table
CREATE TABLE IF NOT EXISTS vector_configs (
  id SERIAL PRIMARY KEY,
  chatbot_id INTEGER REFERENCES chatbots(id) ON DELETE CASCADE,
  table_name VARCHAR(100) UNIQUE NOT NULL,
  dimensions INTEGER NOT NULL DEFAULT 1536,
  chunk_size INTEGER NOT NULL DEFAULT 1024,
  overlap_size INTEGER DEFAULT 0,
  embedding_model VARCHAR(100) DEFAULT 'text-embedding-3-small',
  distance_metric VARCHAR(50) DEFAULT 'cosine',
  index_type VARCHAR(50) DEFAULT 'ivfflat',
  custom_metadata_schema JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_vector_configs_chatbot_id ON vector_configs(chatbot_id);
CREATE INDEX IF NOT EXISTS idx_vector_configs_table_name ON vector_configs(table_name);
