# MCP Backend - Supabase Table Reference

## Overview

This document provides the essential table schemas and references for integrating with the Proxima chat system from the MCP backend. All tables use Supabase with Row Level Security (RLS) enabled.

---

## Database Tables

### 1. Conversations Table

**Table Name:** `conversations`

**Purpose:** Stores chat sessions/conversations

```sql
conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  title TEXT NOT NULL DEFAULT 'New Conversation',
  ai_provider TEXT NOT NULL DEFAULT 'openai',
  model_name TEXT NOT NULL DEFAULT 'gpt-4',
  conversation_type TEXT NOT NULL DEFAULT 'general_chat',
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_message_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  message_count INTEGER DEFAULT 0,
  total_tokens INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}'::jsonb
)
```

**Field Descriptions:**
- `id`: Unique conversation identifier
- `user_id`: References the user (links to medical/users table)
- `title`: Conversation title (auto-generated or user-defined)
- `ai_provider`: AI service used (`openai`, `claude`, `google`, `xai`)
- `model_name`: Specific model (`gpt-4`, `claude-3`, `gemini-pro`, etc.)
- `conversation_type`: Category (`general_chat`, `health_analysis`, `symptom_check`)
- `status`: Current state (`active`, `archived`, `deleted`)
- `message_count`: Auto-updated count of messages
- `total_tokens`: Running total of tokens used
- `metadata`: Flexible JSON for provider-specific data

**Indexes:**
```sql
CREATE INDEX idx_conversations_user_id ON conversations(user_id);
CREATE INDEX idx_conversations_user_updated ON conversations(user_id, updated_at DESC);
CREATE INDEX idx_conversations_status ON conversations(status);
CREATE INDEX idx_conversations_provider ON conversations(ai_provider);
```

---

### 2. Messages Table

**Table Name:** `messages`

**Purpose:** Stores individual messages within conversations

```sql
messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  content_type TEXT NOT NULL DEFAULT 'text',
  token_count INTEGER DEFAULT 0,
  model_used TEXT,
  processing_time INTEGER DEFAULT 0,
  attachments JSONB DEFAULT '[]'::jsonb,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
)
```

**Field Descriptions:**
- `id`: Unique message identifier
- `conversation_id`: Links to conversations table
- `role`: Message sender (`user`, `assistant`, `system`)
- `content`: Message text content
- `content_type`: Format (`text`, `image`, `file`, `json`)
- `token_count`: Tokens used for this message
- `model_used`: Specific model for this response
- `processing_time`: AI response time in milliseconds
- `attachments`: JSON array of attachment references
- `metadata`: JSON for model parameters, function calls, etc.

**Content Type Values:**
- `text`: Regular text message
- `image`: Image content or description
- `file`: File attachment reference
- `json`: Structured data or function results

**Indexes:**
```sql
CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX idx_messages_created_at ON messages(created_at);
CREATE INDEX idx_messages_role ON messages(role);
CREATE INDEX idx_messages_content_search ON messages USING GIN(to_tsvector('english', content));
```

---

### 3. Message Attachments Table

**Table Name:** `message_attachments`

**Purpose:** Handles file uploads and media attachments

```sql
message_attachments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  storage_path TEXT NOT NULL,
  upload_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb
)
```

**Field Descriptions:**
- `id`: Unique attachment identifier
- `message_id`: Links to messages table
- `file_name`: Original filename
- `file_type`: MIME type (`image/jpeg`, `application/pdf`, etc.)
- `file_size`: Size in bytes
- `storage_path`: Path to file in storage system
- `metadata`: Additional file information (dimensions, processing results, etc.)

**Indexes:**
```sql
CREATE INDEX idx_attachments_message_id ON message_attachments(message_id);
```

---

## Row Level Security (RLS) Policies

### Conversations Table Policies

```sql
-- Users can only access their own conversations
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
```

### Messages Table Policies

```sql
-- Users can only access messages in their conversations
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
```

### Message Attachments Table Policies

```sql
-- Users can only access attachments in their messages
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
```

---

## Database Triggers

### Auto-Update Conversation Metadata

```sql
-- Function to update conversation stats when messages change
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

-- Trigger on message insert/update
CREATE TRIGGER trigger_update_conversation_on_message
  AFTER INSERT OR UPDATE ON messages
  FOR EACH ROW
  EXECUTE FUNCTION update_conversation_timestamp();
```

### Auto-Update Timestamps

```sql
-- Function to update updated_at columns
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for auto-updating timestamps
CREATE TRIGGER trigger_conversations_updated_at
  BEFORE UPDATE ON conversations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_messages_updated_at
  BEFORE UPDATE ON messages
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

---

## MCP Integration Notes

### Function Calling Support

For MCP function calling, use the `metadata` field in messages table:

```json
{
  "function_calls": [
    {
      "name": "get_health_data",
      "parameters": {"user_id": "123", "date_range": "7d"}
    }
  ],
  "function_results": [
    {
      "function": "get_health_data",
      "result": {"anxiety_avg": 6.2, "sleep_avg": 7.1}
    }
  ],
  "model_parameters": {
    "temperature": 0.7,
    "max_tokens": 1000,
    "tools": ["health_analyzer", "symptom_checker"]
  }
}
```

### Streaming Support

For streaming responses, create message with empty content and update:

1. Insert message with `content: ''` and `metadata: {"streaming": true}`
2. Update `content` as stream chunks arrive
3. Final update: `metadata: {"streaming": false, "complete": true}`

### Attachment Handling

Image attachments should reference the `message_attachments` table:

```json
// In messages.attachments field
[
  {
    "attachment_id": "uuid-here",
    "type": "image",
    "description": "User uploaded symptom photo"
  }
]
```

### Content Types

- `text`: Standard text messages
- `image`: When AI is analyzing images
- `json`: For structured data or function results
- `file`: For document analysis

---

## Essential Queries for MCP Backend

### Get Conversation Context

```sql
-- Get recent messages for context (most recent 20)
SELECT id, role, content, metadata, created_at
FROM messages 
WHERE conversation_id = $1 
ORDER BY created_at DESC 
LIMIT 20;
```

### Get User's Active Conversations

```sql
-- Get active conversations for user
SELECT id, title, ai_provider, model_name, conversation_type, last_message_at, message_count
FROM conversations 
WHERE user_id = $1 AND status = 'active'
ORDER BY last_message_at DESC;
```

### Insert New Message

```sql
-- Insert message (conversation stats auto-update via trigger)
INSERT INTO messages (conversation_id, role, content, content_type, token_count, model_used, processing_time, metadata)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
RETURNING id, created_at;
```

### Update Streaming Message

```sql
-- Update message content during streaming
UPDATE messages 
SET content = $1, metadata = $2, updated_at = NOW()
WHERE id = $3;
```

### Get Message Attachments

```sql
-- Get attachments for a message
SELECT id, file_name, file_type, file_size, storage_path, metadata
FROM message_attachments 
WHERE message_id = $1;
```

---

## Authentication Context

### Supabase Auth Integration

- Use `auth.uid()` to get current user ID
- All RLS policies check `auth.uid()::text = user_id::text`
- MCP backend should authenticate requests using Supabase JWT tokens

### Service Role Access

For MCP backend operations that need to bypass RLS:
- Use Supabase service role key
- Set `Authorization: Bearer [service_role_key]` header
- Be careful - service role bypasses all RLS policies

---

## Important Notes

1. **Cascading Deletes**: Messages are deleted when conversations are deleted
2. **Attachments**: Linked to messages, deleted when messages are deleted
3. **Token Tracking**: Update `total_tokens` on conversations for billing
4. **Performance**: Use indexes for efficient queries on large datasets
5. **Security**: Always verify user permissions in MCP backend
6. **Metadata**: Use JSONB fields for flexible, queryable additional data

---

## Table Relationships Summary

```
conversations (1) ←→ (∞) messages (1) ←→ (∞) message_attachments
     ↑
users/medical (1) ←→ (∞) conversations
```

**Foreign Keys:**
- `messages.conversation_id` → `conversations.id`
- `message_attachments.message_id` → `messages.id`
- `conversations.user_id` → user identifier

**Constraints:**
- `messages.role` must be in ('user', 'assistant', 'system')
- All timestamps use `TIMESTAMP WITH TIME ZONE`
- UUIDs are auto-generated using `uuid_generate_v4()` 