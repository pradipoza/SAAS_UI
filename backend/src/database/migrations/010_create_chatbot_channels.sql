-- Create chatbot_channels table for channel configurations
CREATE TABLE IF NOT EXISTS chatbot_channels (
  id SERIAL PRIMARY KEY,
  chatbot_id INTEGER REFERENCES chatbots(id) ON DELETE CASCADE,
  channel VARCHAR(50) NOT NULL,
  is_active BOOLEAN DEFAULT FALSE,
  credentials JSONB,
  settings JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_chatbot_channels_chatbot_id ON chatbot_channels(chatbot_id);
CREATE INDEX IF NOT EXISTS idx_chatbot_channels_channel ON chatbot_channels(channel);
CREATE INDEX IF NOT EXISTS idx_chatbot_channels_active ON chatbot_channels(is_active);
