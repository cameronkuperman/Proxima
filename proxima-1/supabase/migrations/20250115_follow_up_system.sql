-- Follow-Up System Migration
-- This migration creates the complete follow-up tracking system for Seimeo-1

-- 1. Main follow_ups table (separate from assessments)
CREATE TABLE IF NOT EXISTS follow_ups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  
  -- Link to original assessment (polymorphic - can reference any assessment type)
  original_assessment_id UUID NOT NULL, -- No foreign key since it references multiple tables
  original_assessment_type VARCHAR(50) NOT NULL CHECK (original_assessment_type IN ('quick_scan', 'deep_dive', 'general', 'general_deep')),
  previous_follow_up_id UUID REFERENCES follow_ups(id),
  
  -- Follow-up metadata
  follow_up_number INTEGER NOT NULL DEFAULT 1,
  days_since_original INTEGER NOT NULL,
  days_since_previous INTEGER,
  
  -- Form data
  body_part VARCHAR(100),
  form_type VARCHAR(50) DEFAULT 'standard',
  form_questions JSONB NOT NULL,
  form_responses JSONB NOT NULL,
  
  -- Progression tracking
  overall_trend VARCHAR(20) CHECK (overall_trend IN ('much_better', 'somewhat_better', 'stable', 'somewhat_worse', 'much_worse')),
  severity_score INTEGER CHECK (severity_score >= 1 AND severity_score <= 10),
  improvement_score INTEGER CHECK (improvement_score >= -5 AND improvement_score <= 5),
  
  -- Change tracking
  symptoms_current TEXT[],
  symptoms_added TEXT[],
  symptoms_resolved TEXT[],
  symptoms_persisting TEXT[],
  
  -- Treatment tracking
  treatments_tried JSONB DEFAULT '[]'::jsonb,
  treatment_effectiveness JSONB DEFAULT '{}'::jsonb,
  
  -- AI Analysis
  ai_response JSONB,
  ai_model VARCHAR(50),
  analysis_type VARCHAR(20) DEFAULT 'follow_up',
  
  -- Risk flags
  red_flags JSONB DEFAULT '[]'::jsonb,
  urgency_level VARCHAR(20) DEFAULT 'routine' CHECK (urgency_level IN ('routine', 'soon', 'urgent', 'emergency')),
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Assessment chains to group related assessments and follow-ups
CREATE TABLE IF NOT EXISTS assessment_chains (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  
  -- Chain metadata
  chain_name VARCHAR(200),
  initial_assessment_id UUID NOT NULL, -- No foreign key since it references multiple tables
  initial_assessment_type VARCHAR(50) NOT NULL CHECK (initial_assessment_type IN ('quick_scan', 'deep_dive', 'general', 'general_deep')),
  
  -- Chain status
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'resolved', 'monitoring', 'archived')),
  resolution_date TIMESTAMP WITH TIME ZONE,
  resolution_notes TEXT,
  
  -- Statistics
  total_follow_ups INTEGER DEFAULT 0,
  last_follow_up_date TIMESTAMP WITH TIME ZONE,
  next_follow_up_suggested TIMESTAMP WITH TIME ZONE,
  
  -- Configuration
  follow_up_frequency VARCHAR(20),
  auto_reminder BOOLEAN DEFAULT false,
  
  -- Metadata
  tags TEXT[],
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Follow-up templates
CREATE TABLE IF NOT EXISTS follow_up_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  
  -- Categorization
  body_part VARCHAR(50),
  condition_type VARCHAR(50),
  severity_level VARCHAR(20),
  
  -- Question sets
  core_questions JSONB NOT NULL DEFAULT '[]'::jsonb,
  progression_questions JSONB NOT NULL DEFAULT '[]'::jsonb,
  contextual_questions JSONB DEFAULT '[]'::jsonb,
  safety_questions JSONB DEFAULT '[]'::jsonb,
  
  -- Adaptive rules
  question_selection_rules JSONB DEFAULT '{}'::jsonb,
  max_questions INTEGER DEFAULT 8,
  
  -- Metadata
  is_active BOOLEAN DEFAULT true,
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Progression snapshots for visualization
CREATE TABLE IF NOT EXISTS progression_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chain_id UUID REFERENCES assessment_chains(id) NOT NULL,
  
  -- Snapshot data
  snapshot_date DATE NOT NULL,
  severity_average DECIMAL(3,2),
  symptom_count INTEGER,
  functional_impact_score INTEGER,
  quality_of_life_score INTEGER,
  
  -- Aggregated data
  best_day_severity INTEGER,
  worst_day_severity INTEGER,
  treatment_adherence_percentage INTEGER,
  
  -- Trends
  weekly_trend VARCHAR(20),
  monthly_trend VARCHAR(20),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE(chain_id, snapshot_date)
);

-- 5. Follow-up sessions for deep dive tracking
CREATE TABLE IF NOT EXISTS follow_up_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chain_id UUID REFERENCES assessment_chains(id),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  
  -- Session data
  assessment_type VARCHAR(50) NOT NULL,
  phase VARCHAR(50) NOT NULL,
  responses_so_far JSONB DEFAULT '{}'::jsonb,
  current_question_number INTEGER DEFAULT 0,
  
  -- Status
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'abandoned')),
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP WITH TIME ZONE
);

-- 6. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_follow_ups_user ON follow_ups(user_id);
CREATE INDEX IF NOT EXISTS idx_follow_ups_original ON follow_ups(original_assessment_id, original_assessment_type);
CREATE INDEX IF NOT EXISTS idx_follow_ups_previous ON follow_ups(previous_follow_up_id);
CREATE INDEX IF NOT EXISTS idx_follow_ups_created ON follow_ups(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_follow_ups_trend ON follow_ups(overall_trend);

CREATE INDEX IF NOT EXISTS idx_chains_user ON assessment_chains(user_id);
CREATE INDEX IF NOT EXISTS idx_chains_status ON assessment_chains(status);
CREATE INDEX IF NOT EXISTS idx_chains_initial ON assessment_chains(initial_assessment_id, initial_assessment_type);

CREATE INDEX IF NOT EXISTS idx_snapshots_chain ON progression_snapshots(chain_id);
CREATE INDEX IF NOT EXISTS idx_snapshots_date ON progression_snapshots(snapshot_date DESC);

CREATE INDEX IF NOT EXISTS idx_sessions_chain ON follow_up_sessions(chain_id);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON follow_up_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_status ON follow_up_sessions(status);

-- 7. Enable RLS
ALTER TABLE follow_ups ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessment_chains ENABLE ROW LEVEL SECURITY;
ALTER TABLE follow_up_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE progression_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE follow_up_sessions ENABLE ROW LEVEL SECURITY;

-- 8. RLS Policies for follow_ups
CREATE POLICY "Users can view own follow-ups" ON follow_ups
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own follow-ups" ON follow_ups
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own follow-ups" ON follow_ups
  FOR UPDATE USING (auth.uid() = user_id);

-- 9. RLS Policies for assessment_chains
CREATE POLICY "Users can view own chains" ON assessment_chains
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own chains" ON assessment_chains
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own chains" ON assessment_chains
  FOR UPDATE USING (auth.uid() = user_id);

-- 10. RLS Policies for templates (read-only)
CREATE POLICY "Everyone can view active templates" ON follow_up_templates
  FOR SELECT USING (is_active = true);

-- 11. RLS Policies for progression_snapshots
CREATE POLICY "Users can view own snapshots" ON progression_snapshots
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM assessment_chains 
      WHERE assessment_chains.id = progression_snapshots.chain_id 
      AND assessment_chains.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create own snapshots" ON progression_snapshots
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM assessment_chains 
      WHERE assessment_chains.id = progression_snapshots.chain_id 
      AND assessment_chains.user_id = auth.uid()
    )
  );

-- 12. RLS Policies for follow_up_sessions
CREATE POLICY "Users can view own sessions" ON follow_up_sessions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own sessions" ON follow_up_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own sessions" ON follow_up_sessions
  FOR UPDATE USING (auth.uid() = user_id);

-- 13. Helper function to get follow-up chain
CREATE OR REPLACE FUNCTION get_follow_up_chain(assessment_id UUID, assessment_type VARCHAR)
RETURNS TABLE (
  chain_id UUID,
  follow_ups JSON,
  trend_summary JSON
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ac.id as chain_id,
    COALESCE(
      json_agg(
        json_build_object(
          'id', fu.id,
          'created_at', fu.created_at,
          'follow_up_number', fu.follow_up_number,
          'overall_trend', fu.overall_trend,
          'severity_score', fu.severity_score,
          'days_since_original', fu.days_since_original
        ) ORDER BY fu.follow_up_number
      ) FILTER (WHERE fu.id IS NOT NULL),
      '[]'::json
    ) as follow_ups,
    json_build_object(
      'total_follow_ups', ac.total_follow_ups,
      'status', ac.status,
      'last_follow_up', ac.last_follow_up_date
    ) as trend_summary
  FROM assessment_chains ac
  LEFT JOIN follow_ups fu ON fu.original_assessment_id = ac.initial_assessment_id 
    AND fu.original_assessment_type = ac.initial_assessment_type
  WHERE ac.initial_assessment_id = assessment_id 
    AND ac.initial_assessment_type = assessment_type
  GROUP BY ac.id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 14. Function to calculate progression metrics
CREATE OR REPLACE FUNCTION calculate_progression_metrics(chain_id_param UUID)
RETURNS TABLE (
  avg_severity DECIMAL,
  trend_direction VARCHAR,
  improvement_percentage DECIMAL
) AS $$
DECLARE
  initial_severity INTEGER;
  latest_severity INTEGER;
  avg_severity_val DECIMAL;
  assessment_type VARCHAR;
  assessment_id UUID;
BEGIN
  -- Get chain info
  SELECT ac.initial_assessment_type, ac.initial_assessment_id 
  INTO assessment_type, assessment_id
  FROM assessment_chains ac
  WHERE ac.id = chain_id_param;
  
  -- Get initial severity based on assessment type
  CASE assessment_type
    WHEN 'quick_scan' THEN
      SELECT (ai_response->>'severity_score')::INTEGER INTO initial_severity
      FROM quick_scans WHERE id = assessment_id;
    WHEN 'deep_dive' THEN
      SELECT (final_analysis->>'severity_score')::INTEGER INTO initial_severity
      FROM deep_dive_sessions WHERE id = assessment_id;
    WHEN 'general' THEN
      SELECT (analysis_result->>'severity_score')::INTEGER INTO initial_severity
      FROM general_assessments WHERE id = assessment_id;
    WHEN 'general_deep' THEN
      SELECT (final_analysis->>'severity_score')::INTEGER INTO initial_severity
      FROM general_deepdive_sessions WHERE id = assessment_id;
  END CASE;
  
  -- Get latest severity
  SELECT fu.severity_score INTO latest_severity
  FROM follow_ups fu
  WHERE fu.original_assessment_id = assessment_id
    AND fu.original_assessment_type = assessment_type
  ORDER BY fu.created_at DESC
  LIMIT 1;
  
  -- Calculate average
  SELECT AVG(fu.severity_score) INTO avg_severity_val
  FROM follow_ups fu
  WHERE fu.original_assessment_id = assessment_id
    AND fu.original_assessment_type = assessment_type;
  
  RETURN QUERY
  SELECT 
    avg_severity_val,
    CASE 
      WHEN latest_severity < initial_severity THEN 'improving'
      WHEN latest_severity > initial_severity THEN 'worsening'
      ELSE 'stable'
    END as trend_direction,
    CASE 
      WHEN initial_severity > 0 THEN 
        ((initial_severity - latest_severity)::DECIMAL / initial_severity) * 100
      ELSE 0
    END as improvement_percentage;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 15. Trigger to update chain stats
CREATE OR REPLACE FUNCTION update_chain_stats()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE assessment_chains
  SET 
    total_follow_ups = total_follow_ups + 1,
    last_follow_up_date = NEW.created_at,
    updated_at = CURRENT_TIMESTAMP
  WHERE initial_assessment_id = NEW.original_assessment_id
    AND initial_assessment_type = NEW.original_assessment_type;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER after_follow_up_insert
AFTER INSERT ON follow_ups
FOR EACH ROW
EXECUTE FUNCTION update_chain_stats();

-- Note: Default templates will be added by the 20250115_update_follow_up_templates.sql migration
-- which includes much better, more comprehensive questions

-- Migration complete
COMMENT ON TABLE follow_ups IS 'Stores all follow-up assessments for tracking health progression over time';
COMMENT ON TABLE assessment_chains IS 'Groups related assessments and follow-ups into trackable chains';
COMMENT ON TABLE follow_up_templates IS 'Predefined question templates for different follow-up types';
COMMENT ON TABLE progression_snapshots IS 'Aggregated data points for visualizing health progression';
COMMENT ON TABLE follow_up_sessions IS 'Tracks multi-phase deep dive follow-up sessions';