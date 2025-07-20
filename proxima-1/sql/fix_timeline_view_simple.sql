-- Simple fix for timeline view
-- The issue is RLS on the view. Let's recreate it with proper security

-- 1. Drop the existing view
DROP VIEW IF EXISTS user_interactions;

-- 2. Create a simpler view without complex UNION ALL issues
CREATE OR REPLACE VIEW user_interactions AS
WITH all_interactions AS (
  -- Quick Scans
  SELECT 
    id,
    user_id::text as user_id,
    'quick_scan' as interaction_type,
    created_at,
    COALESCE(body_part, 'Health Check') as title,
    COALESCE(urgency_level, 'low') as severity,
    jsonb_build_object(
      'confidence', COALESCE(confidence_score, 0),
      'urgency', COALESCE(urgency_level, 'low'),
      'body_part', body_part,
      'has_summary', llm_summary IS NOT NULL
    ) as metadata
  FROM quick_scans
  WHERE created_at IS NOT NULL

  UNION ALL

  -- Deep Dive Sessions
  SELECT 
    id,
    user_id::text,
    'deep_dive' as interaction_type,
    created_at,
    COALESCE(body_part, 'Deep Analysis') as title,
    CASE 
      WHEN final_confidence >= 80 THEN 'high'
      WHEN final_confidence >= 50 THEN 'medium'
      ELSE 'low'
    END as severity,
    jsonb_build_object(
      'status', COALESCE(status, 'unknown'),
      'model', COALESCE(model_used, 'unknown'),
      'confidence', COALESCE(final_confidence, 0),
      'body_part', body_part
    ) as metadata
  FROM deep_dive_sessions
  WHERE created_at IS NOT NULL

  UNION ALL

  -- Photo Sessions
  SELECT 
    ps.id,
    ps.user_id::text,
    'photo_analysis' as interaction_type,
    ps.created_at,
    COALESCE(ps.condition_name, 'Photo Analysis') as title,
    'medium' as severity,
    jsonb_build_object(
      'session_id', ps.id,
      'condition', ps.condition_name,
      'is_sensitive', COALESCE(ps.is_sensitive, false)
    ) as metadata
  FROM photo_sessions ps
  WHERE ps.deleted_at IS NULL 
    AND ps.created_at IS NOT NULL

  UNION ALL

  -- Medical Reports
  SELECT 
    id,
    user_id::text,
    'report' as interaction_type,
    created_at,
    CASE report_type
      WHEN 'comprehensive' THEN 'Comprehensive Health Report'
      WHEN 'urgent_triage' THEN 'Urgent Triage Report'
      ELSE 'Health Report'
    END as title,
    CASE 
      WHEN report_type = 'urgent_triage' THEN 'high'
      ELSE 'medium'
    END as severity,
    jsonb_build_object(
      'report_type', report_type,
      'confidence', COALESCE(confidence_score, 0)
    ) as metadata
  FROM medical_reports
  WHERE created_at IS NOT NULL

  UNION ALL

  -- Oracle Conversations
  SELECT 
    id,
    user_id::text,
    'oracle_chat' as interaction_type,
    created_at,
    COALESCE(title, 'Oracle Consultation') as title,
    'low' as severity,
    jsonb_build_object(
      'ai_provider', COALESCE(ai_provider, 'openai'),
      'model', COALESCE(model_name, 'gpt-4'),
      'message_count', COALESCE(message_count, 0)
    ) as metadata
  FROM conversations
  WHERE conversation_type = 'general_chat'
    AND created_at IS NOT NULL
)
SELECT * FROM all_interactions;

-- 3. Grant permissions
GRANT SELECT ON user_interactions TO authenticated;
GRANT SELECT ON user_interactions TO anon;

-- 4. Create a simple function to get timeline data with built-in auth
CREATE OR REPLACE FUNCTION get_my_timeline(
  p_limit INT DEFAULT 50,
  p_offset INT DEFAULT 0
)
RETURNS TABLE (
  id uuid,
  user_id text,
  interaction_type text,
  created_at timestamptz,
  title text,
  severity text,
  metadata jsonb
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT * FROM user_interactions
  WHERE user_id = auth.uid()::text
  ORDER BY created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_my_timeline TO authenticated;

-- 5. Test the function (replace with your user ID)
SELECT * FROM get_my_timeline(10, 0);