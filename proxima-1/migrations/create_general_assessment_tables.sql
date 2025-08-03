-- General Assessment Tables Migration
-- Run this file to create all tables needed for general health assessments

BEGIN;

-- 1. Flash Assessments (simplest, text-based)
CREATE TABLE IF NOT EXISTS flash_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  
  -- Input
  user_query TEXT NOT NULL,
  
  -- AI Response
  ai_response TEXT NOT NULL,
  main_concern TEXT,
  urgency TEXT CHECK (urgency IN ('low', 'medium', 'high', 'emergency')),
  confidence_score FLOAT,
  
  -- Recommendations
  suggested_next_action TEXT,
  should_use_general_assessment BOOLEAN DEFAULT FALSE,
  should_use_body_scan BOOLEAN DEFAULT FALSE,
  
  -- Metadata
  model_used TEXT,
  tokens_used INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. General Assessments (structured, category-based)
CREATE TABLE IF NOT EXISTS general_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  
  -- Category & Input
  category TEXT NOT NULL CHECK (category IN ('energy', 'mental', 'sick', 'medication', 'multiple', 'unsure')),
  form_data JSONB NOT NULL,
  
  -- Analysis
  analysis_result JSONB NOT NULL,
  primary_assessment TEXT,
  confidence_score FLOAT,
  urgency_level TEXT,
  
  -- Recommendations
  recommendations TEXT[],
  follow_up_needed BOOLEAN DEFAULT FALSE,
  doctor_visit_suggested BOOLEAN DEFAULT FALSE,
  
  -- Metadata
  model_used TEXT,
  processing_time_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. General Deep Dives (conversational, multi-step)
CREATE TABLE IF NOT EXISTS general_deepdive_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  
  -- Initial context
  category TEXT NOT NULL,
  initial_complaint TEXT NOT NULL,
  form_data JSONB,
  
  -- Session state
  questions JSONB[] DEFAULT '{}',
  current_step INTEGER DEFAULT 0,
  internal_state JSONB,
  status TEXT DEFAULT 'active',
  
  -- Final analysis
  final_analysis JSONB,
  final_confidence FLOAT,
  key_findings TEXT[],
  reasoning_snippets TEXT[],
  
  -- Metadata
  model_used TEXT,
  session_duration_ms INTEGER,
  total_tokens_used INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- 4. Timeline Events (auto-generated via triggers)
CREATE TABLE IF NOT EXISTS timeline_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  
  -- Event type and source
  event_type TEXT NOT NULL,
  event_category TEXT NOT NULL CHECK (event_category IN ('body', 'general', 'photo', 'chat')),
  
  -- Reference
  source_table TEXT NOT NULL,
  source_id UUID NOT NULL,
  
  -- Display data
  title TEXT NOT NULL,
  summary TEXT,
  icon_type TEXT,
  color_scheme TEXT,
  severity TEXT,
  confidence FLOAT,
  
  -- Grouping
  thread_id UUID,
  is_follow_up BOOLEAN DEFAULT FALSE,
  
  -- Metadata
  metadata JSONB,
  tags TEXT[],
  
  -- Timestamps
  event_timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- INDEXES
CREATE INDEX IF NOT EXISTS idx_flash_user ON flash_assessments(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_general_user ON general_assessments(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_general_category ON general_assessments(category, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_deepdive_user ON general_deepdive_sessions(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_timeline_user ON timeline_events(user_id, event_timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_timeline_category ON timeline_events(user_id, event_category, event_timestamp DESC);

-- AUTO-GENERATE TIMELINE EVENTS WITH TRIGGERS
CREATE OR REPLACE FUNCTION create_timeline_event() RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO timeline_events (
    user_id,
    event_type,
    event_category,
    source_table,
    source_id,
    title,
    summary,
    icon_type,
    color_scheme,
    severity,
    confidence,
    event_timestamp
  ) VALUES (
    NEW.user_id,
    CASE 
      WHEN TG_TABLE_NAME = 'flash_assessments' THEN 'flash'
      WHEN TG_TABLE_NAME = 'general_assessments' THEN 'general_quick'
      WHEN TG_TABLE_NAME = 'general_deepdive_sessions' THEN 'general_deep'
      WHEN TG_TABLE_NAME = 'quick_scans' THEN 'body_quick'
      WHEN TG_TABLE_NAME = 'deep_dive_sessions' THEN 'body_deep'
    END,
    CASE 
      WHEN TG_TABLE_NAME LIKE '%general%' OR TG_TABLE_NAME = 'flash_assessments' THEN 'general'
      ELSE 'body'
    END,
    TG_TABLE_NAME,
    NEW.id,
    CASE 
      WHEN TG_TABLE_NAME = 'flash_assessments' THEN 'Flash: ' || LEFT(NEW.user_query, 50)
      WHEN TG_TABLE_NAME = 'general_assessments' THEN 'General Assessment: ' || NEW.category
      WHEN TG_TABLE_NAME = 'general_deepdive_sessions' THEN 'Deep Dive: ' || NEW.category
      ELSE 'Health Assessment'
    END,
    CASE 
      WHEN TG_TABLE_NAME = 'flash_assessments' THEN NEW.main_concern
      WHEN TG_TABLE_NAME = 'general_assessments' THEN NEW.primary_assessment
      ELSE NULL
    END,
    CASE 
      WHEN TG_TABLE_NAME = 'flash_assessments' THEN 'sparkles'
      WHEN TG_TABLE_NAME LIKE '%deep%' THEN 'brain'
      ELSE 'zap'
    END,
    CASE 
      WHEN TG_TABLE_NAME = 'flash_assessments' THEN 'amber'
      WHEN TG_TABLE_NAME LIKE '%deep%' THEN 'indigo'
      ELSE 'emerald'
    END,
    COALESCE(NEW.urgency_level, NEW.urgency),
    NEW.confidence_score,
    NEW.created_at
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for each table
DROP TRIGGER IF EXISTS create_flash_timeline ON flash_assessments;
CREATE TRIGGER create_flash_timeline 
  AFTER INSERT ON flash_assessments 
  FOR EACH ROW EXECUTE FUNCTION create_timeline_event();

DROP TRIGGER IF EXISTS create_general_timeline ON general_assessments;
CREATE TRIGGER create_general_timeline 
  AFTER INSERT ON general_assessments 
  FOR EACH ROW EXECUTE FUNCTION create_timeline_event();

DROP TRIGGER IF EXISTS create_deepdive_timeline ON general_deepdive_sessions;
CREATE TRIGGER create_deepdive_timeline 
  AFTER INSERT ON general_deepdive_sessions 
  FOR EACH ROW EXECUTE FUNCTION create_timeline_event();

-- Also add triggers for existing body assessment tables
DROP TRIGGER IF EXISTS create_quickscan_timeline ON quick_scans;
CREATE TRIGGER create_quickscan_timeline 
  AFTER INSERT ON quick_scans 
  FOR EACH ROW EXECUTE FUNCTION create_timeline_event();

DROP TRIGGER IF EXISTS create_deepdive_body_timeline ON deep_dive_sessions;
CREATE TRIGGER create_deepdive_body_timeline 
  AFTER INSERT ON deep_dive_sessions 
  FOR EACH ROW EXECUTE FUNCTION create_timeline_event();

-- Migrate existing data to timeline
INSERT INTO timeline_events (
  user_id, event_type, event_category, source_table, source_id, 
  title, icon_type, color_scheme, confidence, event_timestamp
)
SELECT 
  user_id, 
  'body_quick',
  'body',
  'quick_scans',
  id,
  'Quick Scan: ' || body_part,
  'zap',
  'emerald',
  confidence_score,
  created_at
FROM quick_scans
WHERE NOT EXISTS (
  SELECT 1 FROM timeline_events 
  WHERE source_table = 'quick_scans' AND source_id = quick_scans.id
);

INSERT INTO timeline_events (
  user_id, event_type, event_category, source_table, source_id, 
  title, icon_type, color_scheme, confidence, event_timestamp
)
SELECT 
  user_id, 
  'body_deep',
  'body',
  'deep_dive_sessions',
  id,
  'Deep Dive: ' || body_part,
  'brain',
  'indigo',
  final_confidence,
  created_at
FROM deep_dive_sessions
WHERE status = 'completed' AND NOT EXISTS (
  SELECT 1 FROM timeline_events 
  WHERE source_table = 'deep_dive_sessions' AND source_id = deep_dive_sessions.id
);

COMMIT;

-- Verification queries
SELECT 'Flash Assessments:', COUNT(*) FROM flash_assessments;
SELECT 'General Assessments:', COUNT(*) FROM general_assessments;
SELECT 'General Deep Dives:', COUNT(*) FROM general_deepdive_sessions;
SELECT 'Timeline Events:', COUNT(*) FROM timeline_events;
SELECT 'Timeline by Category:', event_category, COUNT(*) FROM timeline_events GROUP BY event_category;