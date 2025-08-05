-- Add all missing interaction types to the user_interactions view
-- This includes: Flash Assessments, General Assessments, General Deep Dives
-- Also fixes Oracle Chat filtering to include 'health_analysis' type
-- Run this in Supabase SQL Editor

-- First, drop the existing view
DROP VIEW IF EXISTS user_interactions;

-- Recreate with ALL interaction types
CREATE VIEW user_interactions AS
-- Quick Scans (Body-specific)
SELECT 
  id,
  COALESCE(user_id::text, '') as user_id,
  'quick_scan' as interaction_type,
  created_at,
  COALESCE(body_part, 'Health Check') as title,
  COALESCE(urgency_level, 'low') as severity,
  jsonb_build_object(
    'confidence', COALESCE(confidence_score, 0),
    'urgency', COALESCE(urgency_level, 'low'),
    'body_part', body_part,
    'has_summary', llm_summary IS NOT NULL,
    'escalated', COALESCE(escalated_to_oracle, false)
  ) as metadata
FROM quick_scans
WHERE user_id IS NOT NULL AND created_at IS NOT NULL

UNION ALL

-- Flash Assessments (New)
SELECT 
  id,
  COALESCE(user_id::text, '') as user_id,
  'flash_assessment' as interaction_type,
  created_at,
  CASE 
    WHEN LENGTH(user_query) > 50 THEN LEFT(user_query, 50) || '...'
    ELSE user_query
  END as title,
  COALESCE(urgency, 'low') as severity,
  jsonb_build_object(
    'confidence', COALESCE(confidence_score, 0),
    'urgency', COALESCE(urgency, 'low'),
    'category', category,
    'suggested_action', suggested_next_action,
    'main_concern', main_concern,
    'should_use_general', should_use_general_assessment,
    'should_use_body', should_use_body_scan
  ) as metadata
FROM flash_assessments
WHERE user_id IS NOT NULL AND created_at IS NOT NULL

UNION ALL

-- General Assessments (New)
SELECT 
  id,
  COALESCE(user_id::text, '') as user_id,
  'general_assessment' as interaction_type,
  created_at,
  CASE category::text
    WHEN 'energy' THEN 'Energy & Fatigue Assessment'
    WHEN 'mental' THEN 'Mental Health Assessment'
    WHEN 'sick' THEN 'Feeling Sick Assessment'
    WHEN 'physical' THEN 'Physical Pain Assessment'
    WHEN 'medication' THEN 'Medication Side Effects Assessment'
    WHEN 'multiple' THEN 'Multiple Issues Assessment'
    WHEN 'unsure' THEN 'General Health Assessment'
    ELSE COALESCE(category::text, 'General') || ' Assessment'
  END as title,
  COALESCE(urgency_level, 'low') as severity,
  jsonb_build_object(
    'confidence', COALESCE(confidence_score, 0),
    'urgency', COALESCE(urgency_level, 'low'),
    'category', category::text,
    'primary_assessment', LEFT(COALESCE(primary_assessment, ''), 200),
    'doctor_suggested', COALESCE(doctor_visit_suggested, false),
    'follow_up_needed', COALESCE(follow_up_needed, false),
    'recommendations_count', COALESCE(cardinality(recommendations), 0)
  ) as metadata
FROM general_assessments
WHERE user_id IS NOT NULL AND created_at IS NOT NULL

UNION ALL

-- General Deep Dive Sessions (New)
SELECT 
  id,
  COALESCE(user_id::text, '') as user_id,
  'general_deepdive' as interaction_type,
  created_at,
  CASE category::text
    WHEN 'energy' THEN 'Energy & Fatigue Deep Analysis'
    WHEN 'mental' THEN 'Mental Health Deep Analysis'
    WHEN 'sick' THEN 'Feeling Sick Deep Analysis'
    WHEN 'physical' THEN 'Physical Pain Deep Analysis'
    WHEN 'medication' THEN 'Medication Side Effects Deep Analysis'
    WHEN 'multiple' THEN 'Multiple Issues Deep Analysis'
    WHEN 'unsure' THEN 'General Health Deep Analysis'
    ELSE COALESCE(category::text, 'General') || ' Deep Analysis'
  END as title,
  CASE 
    WHEN final_confidence >= 80 THEN 'high'
    WHEN final_confidence >= 50 THEN 'medium'
    ELSE 'low'
  END as severity,
  jsonb_build_object(
    'status', COALESCE(status, 'active'),
    'category', category::text,
    'confidence', COALESCE(final_confidence, 0),
    'questions_asked', COALESCE(cardinality(questions), 0),
    'answers_given', COALESCE(cardinality(answers), 0),
    'key_findings', COALESCE(cardinality(key_findings), 0),
    'completed', completed_at IS NOT NULL,
    'initial_complaint', LEFT(COALESCE(initial_complaint, ''), 100)
  ) as metadata
FROM general_deepdive_sessions
WHERE user_id IS NOT NULL AND created_at IS NOT NULL

UNION ALL

-- Deep Dive Sessions (Body-specific)
SELECT 
  id,
  COALESCE(user_id::text, '') as user_id,
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
    'body_part', body_part,
    'completed', completed_at IS NOT NULL
  ) as metadata
FROM deep_dive_sessions
WHERE user_id IS NOT NULL AND created_at IS NOT NULL

UNION ALL

-- Photo Sessions with Latest Analysis
SELECT * FROM (
  SELECT DISTINCT ON (ps.id)
    ps.id,
    ps.user_id::text,
    'photo_analysis' as interaction_type,
    COALESCE(pa.created_at, ps.created_at) as created_at,
    COALESCE(ps.condition_name, 'Photo Analysis') as title,
    CASE 
      WHEN pa.confidence_score >= 0.8 THEN 'high'
      WHEN pa.confidence_score >= 0.5 THEN 'medium'
      ELSE 'low'
    END as severity,
    jsonb_build_object(
      'session_id', ps.id,
      'condition', ps.condition_name,
      'is_sensitive', COALESCE(ps.is_sensitive, false),
      'has_analysis', pa.id IS NOT NULL,
      'confidence', COALESCE(pa.confidence_score, 0),
      'photo_count', (
        SELECT COUNT(*) FROM photo_uploads pu 
        WHERE pu.session_id = ps.id AND pu.deleted_at IS NULL
      )
    ) as metadata
  FROM photo_sessions ps
  LEFT JOIN photo_analyses pa ON pa.session_id = ps.id
  WHERE ps.user_id IS NOT NULL 
    AND ps.deleted_at IS NULL 
    AND ps.created_at IS NOT NULL
  ORDER BY ps.id, pa.created_at DESC
) photo_analysis_subquery

UNION ALL

-- Medical Reports
SELECT 
  id,
  COALESCE(user_id::text, '') as user_id,
  'report' as interaction_type,
  created_at,
  CASE report_type
    WHEN 'comprehensive' THEN 'Comprehensive Health Report'
    WHEN 'urgent_triage' THEN 'Urgent Triage Report'
    WHEN 'photo_progression' THEN 'Photo Progression Report'
    WHEN 'symptom_timeline' THEN 'Symptom Timeline Report'
    WHEN 'specialist_focused' THEN 'Specialist Report'
    WHEN 'annual_summary' THEN 'Annual Summary Report'
    ELSE 'Health Report'
  END as title,
  CASE 
    WHEN report_type = 'urgent_triage' THEN 'high'
    ELSE 'medium'
  END as severity,
  jsonb_build_object(
    'report_type', report_type,
    'confidence', COALESCE(confidence_score, 0),
    'model', COALESCE(model_used, 'unknown'),
    'has_summary', executive_summary IS NOT NULL,
    'executive_summary', LEFT(executive_summary, 200)
  ) as metadata
FROM medical_reports
WHERE user_id IS NOT NULL AND created_at IS NOT NULL

UNION ALL

-- Oracle Conversations (Fixed to include health_analysis type)
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
    'message_count', COALESCE(message_count, 0),
    'status', COALESCE(status, 'active'),
    'last_message', last_message_at,
    'conversation_type', conversation_type
  ) as metadata
FROM conversations
WHERE user_id IS NOT NULL 
  AND conversation_type IN ('general_chat', 'health_analysis') -- Include both types
  AND created_at IS NOT NULL

UNION ALL

-- Tracking Data Points (grouped by day)
SELECT 
  gen_random_uuid() as id,
  tdp.user_id::text,
  'tracking_log' as interaction_type,
  DATE_TRUNC('day', tdp.recorded_at) as created_at,
  COALESCE(tc.metric_name, 'Health Tracking') as title,
  'low' as severity,
  jsonb_build_object(
    'config_id', tc.id,
    'metric_name', tc.metric_name,
    'data_count', COUNT(tdp.id),
    'avg_value', ROUND(AVG(tdp.value)::numeric, 2),
    'min_value', MIN(tdp.value),
    'max_value', MAX(tdp.value),
    'has_notes', bool_or(tdp.notes IS NOT NULL)
  ) as metadata
FROM tracking_data_points tdp
JOIN tracking_configurations tc ON tc.id = tdp.configuration_id
WHERE tdp.user_id IS NOT NULL 
  AND tdp.recorded_at IS NOT NULL
  AND tc.status = 'approved'
GROUP BY DATE_TRUNC('day', tdp.recorded_at), tdp.user_id, tc.id, tc.metric_name;

-- Grant permissions
GRANT SELECT ON user_interactions TO authenticated;
GRANT SELECT ON user_interactions TO anon;

-- Add comment
COMMENT ON VIEW user_interactions IS 'Complete unified view of all user health interactions including Flash, General assessments and fixed Oracle chat filtering';

-- Create indexes if they don't exist for better performance
CREATE INDEX IF NOT EXISTS idx_flash_assessments_user_created ON flash_assessments(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_general_assessments_user_created ON general_assessments(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_general_deepdive_user_created ON general_deepdive_sessions(user_id, created_at DESC);

-- Test the view (optional - comment out for production)
-- SELECT interaction_type, COUNT(*) 
-- FROM user_interactions 
-- GROUP BY interaction_type 
-- ORDER BY COUNT(*) DESC;