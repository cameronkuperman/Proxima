-- Quick Scan Tables for Proxima-1

-- Create quick_scans table
CREATE TABLE quick_scans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  body_part TEXT NOT NULL,
  form_data JSONB NOT NULL,
  analysis_result JSONB NOT NULL,
  confidence_score INTEGER CHECK (confidence_score BETWEEN 0 AND 100),
  urgency_level TEXT CHECK (urgency_level IN ('low', 'medium', 'high')),
  llm_summary TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  escalated_to_oracle BOOLEAN DEFAULT FALSE,
  oracle_conversation_id UUID REFERENCES conversations(id),
  physician_report_generated BOOLEAN DEFAULT FALSE,
  
  INDEX idx_user_scans (user_id, created_at DESC),
  INDEX idx_body_part (body_part, created_at DESC)
);

-- Create symptom_tracking table for line graphs
CREATE TABLE symptom_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  quick_scan_id UUID REFERENCES quick_scans(id),
  symptom_name TEXT NOT NULL,
  body_part TEXT NOT NULL,
  severity INTEGER CHECK (severity BETWEEN 1 AND 10),
  occurrence_date DATE DEFAULT CURRENT_DATE,
  
  INDEX idx_user_symptoms (user_id, symptom_name, occurrence_date),
  UNIQUE(user_id, symptom_name, body_part, occurrence_date)
);

-- Query to get symptom history for line graph
-- Usage: SELECT * FROM get_symptom_history($1, $2);
CREATE OR REPLACE FUNCTION get_symptom_history(p_user_id TEXT, p_symptom_name TEXT)
RETURNS TABLE (
  occurrence_date DATE,
  severity INTEGER,
  symptom_name TEXT,
  body_part TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    st.occurrence_date,
    st.severity,
    st.symptom_name,
    st.body_part
  FROM symptom_tracking st
  WHERE st.user_id = p_user_id
    AND st.symptom_name = p_symptom_name
    AND st.occurrence_date >= CURRENT_DATE - INTERVAL '30 days'
  ORDER BY st.occurrence_date ASC;
END;
$$ LANGUAGE plpgsql;

-- Query to get all user's tracked symptoms
-- Usage: SELECT * FROM get_user_symptoms($1);
CREATE OR REPLACE FUNCTION get_user_symptoms(p_user_id TEXT)
RETURNS TABLE (
  symptom_name TEXT,
  body_part TEXT,
  occurrence_count BIGINT,
  last_occurrence DATE
) AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT 
    st.symptom_name,
    st.body_part,
    COUNT(*) as occurrence_count,
    MAX(st.occurrence_date) as last_occurrence
  FROM symptom_tracking st
  WHERE st.user_id = p_user_id
  GROUP BY st.symptom_name, st.body_part
  ORDER BY last_occurrence DESC;
END;
$$ LANGUAGE plpgsql;