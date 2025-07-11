-- ================================================
-- AI Chat Data Tables Migration
-- ================================================
-- This migration creates the core tables for storing AI chat conversations
-- Run this in your Supabase SQL editor or via CLI

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ================================================
-- CONVERSATIONS TABLE
-- ================================================
-- Stores chat sessions/conversations
CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL, -- References your users/medical table
  title TEXT NOT NULL DEFAULT 'New Conversation',
  ai_provider TEXT NOT NULL DEFAULT 'openai', -- openai, claude, google, xai
  model_name TEXT NOT NULL DEFAULT 'gpt-4', -- gpt-4, claude-3, gemini-pro, etc.
  conversation_type TEXT NOT NULL DEFAULT 'general_chat', -- health_analysis, general_chat, symptom_check
  status TEXT NOT NULL DEFAULT 'active', -- active, archived, deleted
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_message_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  message_count INTEGER DEFAULT 0,
  total_tokens INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- ================================================
-- MESSAGES TABLE
-- ================================================
-- Stores individual messages within conversations
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  content_type TEXT NOT NULL DEFAULT 'text', -- text, image, file, json
  token_count INTEGER DEFAULT 0,
  model_used TEXT, -- specific model for this message
  processing_time INTEGER DEFAULT 0, -- milliseconds
  attachments JSONB DEFAULT '[]'::jsonb,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ================================================
-- MESSAGE ATTACHMENTS TABLE (Optional)
-- ================================================
-- Stores file attachments and images
CREATE TABLE IF NOT EXISTS message_attachments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  storage_path TEXT NOT NULL,
  upload_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- ================================================
-- INDEXES FOR PERFORMANCE
-- ================================================

-- Conversations indexes
CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_user_updated ON conversations(user_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_conversations_status ON conversations(status);
CREATE INDEX IF NOT EXISTS idx_conversations_provider ON conversations(ai_provider);
CREATE INDEX IF NOT EXISTS idx_conversations_type ON conversations(conversation_type);

-- Messages indexes
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);
CREATE INDEX IF NOT EXISTS idx_messages_role ON messages(role);
CREATE INDEX IF NOT EXISTS idx_messages_content_search ON messages USING GIN(to_tsvector('english', content));

-- Message attachments indexes
CREATE INDEX IF NOT EXISTS idx_attachments_message_id ON message_attachments(message_id);

-- ================================================
-- TRIGGERS FOR AUTOMATION
-- ================================================

-- Update conversations.updated_at when messages are added/updated
CREATE OR REPLACE FUNCTION update_conversation_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE conversations 
  SET 
    updated_at = NOW(),
    last_message_at = NOW(),
    message_count = (
      SELECT COUNT(*) 
      FROM messages 
      WHERE conversation_id = NEW.conversation_id
    )
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for message insert/update
DROP TRIGGER IF EXISTS trigger_update_conversation_on_message ON messages;
CREATE TRIGGER trigger_update_conversation_on_message
  AFTER INSERT OR UPDATE ON messages
  FOR EACH ROW
  EXECUTE FUNCTION update_conversation_timestamp();

-- Update updated_at timestamp for conversations
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for conversations updated_at
DROP TRIGGER IF EXISTS trigger_conversations_updated_at ON conversations;
CREATE TRIGGER trigger_conversations_updated_at
  BEFORE UPDATE ON conversations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create trigger for messages updated_at
DROP TRIGGER IF EXISTS trigger_messages_updated_at ON messages;
CREATE TRIGGER trigger_messages_updated_at
  BEFORE UPDATE ON messages
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ================================================
-- ROW LEVEL SECURITY (RLS)
-- ================================================

-- Enable RLS on tables
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_attachments ENABLE ROW LEVEL SECURITY;

-- Conversations RLS policies
CREATE POLICY "Users can view their own conversations"
  ON conversations FOR SELECT
  USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can insert their own conversations"
  ON conversations FOR INSERT
  WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update their own conversations"
  ON conversations FOR UPDATE
  USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can delete their own conversations"
  ON conversations FOR DELETE
  USING (auth.uid()::text = user_id::text);

-- Messages RLS policies
CREATE POLICY "Users can view messages in their conversations"
  ON messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM conversations 
      WHERE conversations.id = messages.conversation_id 
      AND conversations.user_id::text = auth.uid()::text
    )
  );

CREATE POLICY "Users can insert messages in their conversations"
  ON messages FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM conversations 
      WHERE conversations.id = messages.conversation_id 
      AND conversations.user_id::text = auth.uid()::text
    )
  );

CREATE POLICY "Users can update messages in their conversations"
  ON messages FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM conversations 
      WHERE conversations.id = messages.conversation_id 
      AND conversations.user_id::text = auth.uid()::text
    )
  );

CREATE POLICY "Users can delete messages in their conversations"
  ON messages FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM conversations 
      WHERE conversations.id = messages.conversation_id 
      AND conversations.user_id::text = auth.uid()::text
    )
  );

-- Message attachments RLS policies
CREATE POLICY "Users can view attachments in their messages"
  ON message_attachments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM messages 
      JOIN conversations ON conversations.id = messages.conversation_id
      WHERE messages.id = message_attachments.message_id 
      AND conversations.user_id::text = auth.uid()::text
    )
  );

CREATE POLICY "Users can insert attachments in their messages"
  ON message_attachments FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM messages 
      JOIN conversations ON conversations.id = messages.conversation_id
      WHERE messages.id = message_attachments.message_id 
      AND conversations.user_id::text = auth.uid()::text
    )
  );

CREATE POLICY "Users can update attachments in their messages"
  ON message_attachments FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM messages 
      JOIN conversations ON conversations.id = messages.conversation_id
      WHERE messages.id = message_attachments.message_id 
      AND conversations.user_id::text = auth.uid()::text
    )
  );

CREATE POLICY "Users can delete attachments in their messages"
  ON message_attachments FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM messages 
      JOIN conversations ON conversations.id = messages.conversation_id
      WHERE messages.id = message_attachments.message_id 
      AND conversations.user_id::text = auth.uid()::text
    )
  );

-- ================================================
-- HELPER FUNCTIONS
-- ================================================

-- Function to get conversation with message count
CREATE OR REPLACE FUNCTION get_conversation_with_stats(conv_id UUID)
RETURNS TABLE(
  id UUID,
  user_id UUID,
  title TEXT,
  ai_provider TEXT,
  model_name TEXT,
  conversation_type TEXT,
  status TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE,
  last_message_at TIMESTAMP WITH TIME ZONE,
  message_count BIGINT,
  total_tokens INTEGER,
  metadata JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id,
    c.user_id,
    c.title,
    c.ai_provider,
    c.model_name,
    c.conversation_type,
    c.status,
    c.created_at,
    c.updated_at,
    c.last_message_at,
    COUNT(m.id) as message_count,
    c.total_tokens,
    c.metadata
  FROM conversations c
  LEFT JOIN messages m ON c.id = m.conversation_id
  WHERE c.id = conv_id
  GROUP BY c.id, c.user_id, c.title, c.ai_provider, c.model_name, 
           c.conversation_type, c.status, c.created_at, c.updated_at, 
           c.last_message_at, c.total_tokens, c.metadata;
END;
$$ LANGUAGE plpgsql;

-- ================================================
-- SAMPLE DATA (Optional - for testing)
-- ================================================

-- Uncomment to insert sample data for testing
/*
INSERT INTO conversations (user_id, title, ai_provider, model_name, conversation_type) 
VALUES 
  ('your-user-id-here', 'Health Check Discussion', 'openai', 'gpt-4', 'health_analysis'),
  ('your-user-id-here', 'General Chat', 'claude', 'claude-3', 'general_chat');

INSERT INTO messages (conversation_id, role, content, content_type, token_count) 
SELECT 
  c.id,
  'user',
  'Hello, I have been feeling anxious lately. Can you help me understand what might be causing this?',
  'text',
  20
FROM conversations c WHERE c.title = 'Health Check Discussion';
*/

-- ================================================
-- MIGRATION COMPLETE
-- ================================================

-- Verify tables were created
SELECT 
  table_name,
  table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('conversations', 'messages', 'message_attachments')
ORDER BY table_name;

-- Display success message
DO $$
BEGIN
  RAISE NOTICE 'Chat tables migration completed successfully!';
  RAISE NOTICE 'Created tables: conversations, messages, message_attachments';
  RAISE NOTICE 'Created indexes for performance optimization';
  RAISE NOTICE 'Enabled Row Level Security with appropriate policies';
  RAISE NOTICE 'Created triggers for automatic timestamp updates';
END $$; 