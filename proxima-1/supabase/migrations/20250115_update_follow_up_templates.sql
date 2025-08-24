-- Update Follow-Up Templates with Better Questions
-- These questions are universal and work for all assessment types

-- First, delete the existing basic templates
DELETE FROM follow_up_templates;

-- Insert comprehensive universal follow-up templates
INSERT INTO follow_up_templates (name, description, core_questions, progression_questions, contextual_questions, safety_questions)
VALUES 
  ('Universal Follow-Up', 'Comprehensive follow-up for all assessment types', 
   
   -- Core Questions (Always asked - 4-5 questions)
   '[
     {
       "id": "core_1",
       "q": "Since your last assessment, would you say things have:",
       "type": "structured_scale",
       "options": [
         {"value": "significantly_improved", "label": "Significantly improved (75-100% better)"},
         {"value": "moderately_improved", "label": "Moderately improved (25-75% better)"},
         {"value": "slightly_improved", "label": "Slightly improved (10-25% better)"},
         {"value": "no_change", "label": "Stayed about the same"},
         {"value": "slightly_worse", "label": "Slightly worse (10-25% decline)"},
         {"value": "moderately_worse", "label": "Moderately worse (25-75% decline)"},
         {"value": "significantly_worse", "label": "Significantly worse (75-100% decline)"}
       ],
       "required": true
     },
     {
       "id": "core_2", 
       "q": "What percentage of your day is affected by your health concerns?",
       "type": "percentage_slider",
       "min": 0,
       "max": 100,
       "step": 10,
       "labels": {"0": "Not affected", "50": "Half my day", "100": "All day"},
       "required": true
     },
     {
       "id": "core_3",
       "q": "Which of these daily activities have been impacted? (Select all that apply)",
       "type": "impact_checklist",
       "categories": [
         {"id": "work", "label": "Work/School performance"},
         {"id": "social", "label": "Social activities & relationships"},
         {"id": "physical", "label": "Physical activities & exercise"},
         {"id": "sleep", "label": "Sleep quality"},
         {"id": "selfcare", "label": "Self-care & daily tasks"},
         {"id": "mood", "label": "Mood & mental wellbeing"},
         {"id": "concentration", "label": "Focus & concentration"},
         {"id": "none", "label": "No impact on daily activities"}
       ],
       "follow_up": "Rate impact level for each selected (mild/moderate/severe)",
       "required": true
     },
     {
       "id": "core_4",
       "q": "How confident are you in managing your health right now?",
       "type": "confidence_scale",
       "min": 1,
       "max": 10,
       "anchors": {
         "1": "Not at all confident",
         "5": "Somewhat confident", 
         "10": "Very confident"
       },
       "required": true
     }
   ]'::jsonb,
   
   -- Progression Questions (Change tracking - 4-5 questions)
   '[
     {
       "id": "prog_1",
       "q": "What specific changes have you noticed since last time?",
       "type": "structured_changes",
       "prompts": [
         "Physical symptoms that improved:",
         "Physical symptoms that worsened:",
         "New symptoms that appeared:",
         "Symptoms that completely resolved:"
       ],
       "allow_none": true,
       "ai_extraction": true
     },
     {
       "id": "prog_2",
       "q": "What have you tried to address your health concerns?",
       "type": "intervention_tracker",
       "categories": [
         {"id": "medication", "label": "Medications", "effectiveness": true},
         {"id": "lifestyle", "label": "Lifestyle changes", "effectiveness": true},
         {"id": "therapy", "label": "Therapy/Counseling", "effectiveness": true},
         {"id": "alternative", "label": "Alternative treatments", "effectiveness": true},
         {"id": "medical", "label": "Medical procedures", "effectiveness": true},
         {"id": "selfcare", "label": "Self-care practices", "effectiveness": true},
         {"id": "nothing", "label": "Haven''t tried anything yet"}
       ],
       "effectiveness_scale": ["Made it worse", "No effect", "Slightly helpful", "Very helpful", "Completely resolved"],
       "follow_up": "Any side effects or issues?"
     },
     {
       "id": "prog_3",
       "q": "Have you noticed any patterns or triggers?",
       "type": "pattern_identification",
       "categories": [
         {"id": "time", "label": "Time of day patterns", "examples": "Morning vs evening"},
         {"id": "activity", "label": "Activity-related", "examples": "After exercise, sitting too long"},
         {"id": "food", "label": "Food/drink related", "examples": "After meals, certain foods"},
         {"id": "stress", "label": "Stress/emotional", "examples": "Work stress, anxiety"},
         {"id": "weather", "label": "Weather/environment", "examples": "Cold, humidity, allergens"},
         {"id": "sleep", "label": "Sleep-related", "examples": "After poor sleep, oversleeping"},
         {"id": "none", "label": "No clear patterns noticed"}
       ],
       "allow_multiple": true,
       "detail_prompt": "Describe any patterns you''ve noticed"
     },
     {
       "id": "prog_4",
       "q": "Compared to when this started, where are you now?",
       "type": "journey_tracker",
       "scale": [
         {"value": 0, "label": "Fully recovered"},
         {"value": 25, "label": "Much better but not 100%"},
         {"value": 50, "label": "Halfway to recovery"},
         {"value": 75, "label": "Early improvement"},
         {"value": 100, "label": "Same as when it started"},
         {"value": 125, "label": "Worse than when it started"}
       ],
       "follow_up": "What do you think has helped or hindered your progress?"
     }
   ]'::jsonb,
   
   -- Contextual Questions (Lifestyle & environment - 3-4 questions)
   '[
     {
       "id": "context_1",
       "q": "Rate these aspects of your life over the past week:",
       "type": "life_quality_matrix",
       "factors": [
         {"id": "sleep", "label": "Sleep quality", "scale": "poor_to_excellent"},
         {"id": "stress", "label": "Stress levels", "scale": "low_to_high"},
         {"id": "energy", "label": "Energy levels", "scale": "low_to_high"},
         {"id": "appetite", "label": "Appetite", "scale": "poor_to_normal"},
         {"id": "mood", "label": "Overall mood", "scale": "poor_to_excellent"}
       ],
       "scale_type": "5_point"
     },
     {
       "id": "context_2",
       "q": "Have any life circumstances changed that might affect your health?",
       "type": "circumstance_check",
       "categories": [
         "Work/school changes",
         "Relationship changes",
         "Living situation changes",
         "Financial stress",
         "Family health issues",
         "Travel or schedule changes",
         "No significant changes"
       ],
       "follow_up": "How might this be affecting your symptoms?"
     },
     {
       "id": "context_3",
       "q": "What is your top priority for improvement right now?",
       "type": "priority_ranking",
       "options": [
         "Reduce pain/discomfort",
         "Improve energy levels",
         "Better sleep",
         "Manage stress/anxiety",
         "Increase physical function",
         "Improve focus/concentration",
         "Stabilize mood",
         "Other specific goal"
       ],
       "max_selections": 3,
       "rank_order": true
     }
   ]'::jsonb,
   
   -- Safety Questions (Red flags - 2-3 questions)
   '[
     {
       "id": "safety_1",
       "q": "Have you experienced any of these concerning symptoms?",
       "type": "red_flag_screen",
       "symptoms": [
         {"id": "chest_pain", "label": "Chest pain or pressure", "urgency": "high"},
         {"id": "breathing", "label": "Difficulty breathing", "urgency": "high"},
         {"id": "consciousness", "label": "Fainting or near-fainting", "urgency": "high"},
         {"id": "severe_pain", "label": "Severe or sudden worsening pain", "urgency": "medium"},
         {"id": "numbness", "label": "New numbness or weakness", "urgency": "medium"},
         {"id": "vision", "label": "Vision changes or loss", "urgency": "medium"},
         {"id": "fever", "label": "High fever (over 103°F/39.4°C)", "urgency": "medium"},
         {"id": "mental", "label": "Thoughts of self-harm", "urgency": "high"},
         {"id": "none", "label": "None of these", "urgency": "none"}
       ],
       "escalation_protocol": true
     },
     {
       "id": "safety_2",
       "q": "Have you sought medical care since your last assessment?",
       "type": "medical_contact",
       "options": [
         {"id": "emergency", "label": "Emergency room visit"},
         {"id": "urgent_care", "label": "Urgent care visit"},
         {"id": "doctor", "label": "Doctor appointment"},
         {"id": "specialist", "label": "Specialist consultation"},
         {"id": "telehealth", "label": "Telehealth/virtual visit"},
         {"id": "none", "label": "No medical visits"}
       ],
       "follow_up": "What was the outcome or recommendation?"
     },
     {
       "id": "safety_3",
       "q": "Do you feel you need medical attention now?",
       "type": "care_assessment",
       "options": [
         {"value": "urgent", "label": "Yes, urgently", "action": "seek_immediate_care"},
         {"value": "soon", "label": "Yes, soon (within days)", "action": "schedule_appointment"},
         {"value": "eventually", "label": "Yes, but not urgently", "action": "monitor_schedule"},
         {"value": "unsure", "label": "Not sure", "action": "provide_guidance"},
         {"value": "no", "label": "No, managing okay", "action": "continue_monitoring"}
       ],
       "guidance_trigger": true
     }
   ]'::jsonb
  );

-- Create question selection rules based on responses
CREATE TABLE IF NOT EXISTS follow_up_question_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_name VARCHAR(100),
  trigger_condition JSONB, -- Conditions that trigger this rule
  questions_to_add TEXT[], -- Question IDs to add
  questions_to_skip TEXT[], -- Question IDs to skip
  priority INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Insert intelligent question selection rules
INSERT INTO follow_up_question_rules (rule_name, trigger_condition, questions_to_add, priority)
VALUES
  ('worsening_symptoms', 
   '{"trend": ["moderately_worse", "significantly_worse"]}',
   ARRAY['safety_1', 'safety_2', 'safety_3', 'prog_2'],
   10),
   
  ('significant_improvement',
   '{"trend": ["significantly_improved", "moderately_improved"]}',
   ARRAY['prog_2', 'prog_3', 'context_3'],
   5),
   
  ('no_progress',
   '{"trend": ["no_change"], "follow_up_number": {"gte": 3}}',
   ARRAY['prog_2', 'context_2', 'safety_2'],
   7),
   
  ('high_impact',
   '{"daily_impact_percentage": {"gte": 70}}',
   ARRAY['safety_1', 'safety_3', 'context_1'],
   8);

-- Add a function to dynamically select questions based on context
CREATE OR REPLACE FUNCTION select_follow_up_questions(
  p_assessment_type VARCHAR,
  p_follow_up_number INTEGER,
  p_previous_responses JSONB,
  p_days_since_last INTEGER
) RETURNS JSONB AS $$
DECLARE
  selected_questions JSONB;
  base_template RECORD;
  question_count INTEGER;
BEGIN
  -- Get base template
  SELECT * INTO base_template 
  FROM follow_up_templates 
  WHERE name = 'Universal Follow-Up' 
  LIMIT 1;
  
  -- Start with core questions (always included)
  selected_questions := base_template.core_questions;
  
  -- Determine how many additional questions to add based on assessment type
  CASE p_assessment_type
    WHEN 'quick_scan' THEN question_count := 3; -- 4 core + 3 = 7 total
    WHEN 'general' THEN question_count := 3;     -- 4 core + 3 = 7 total  
    WHEN 'deep_dive' THEN question_count := 6;   -- 4 core + 6 = 10 total
    WHEN 'general_deep' THEN question_count := 8; -- 4 core + 8 = 12 total
    ELSE question_count := 4;
  END CASE;
  
  -- Add progression questions if follow-up number > 1
  IF p_follow_up_number > 1 THEN
    selected_questions := selected_questions || 
      jsonb_array_element(base_template.progression_questions, 0) ||
      jsonb_array_element(base_template.progression_questions, 1);
    question_count := question_count - 2;
  END IF;
  
  -- Add safety questions if concerning trend detected
  IF p_previous_responses->>'trend' IN ('moderately_worse', 'significantly_worse') THEN
    selected_questions := selected_questions || 
      jsonb_array_element(base_template.safety_questions, 0);
    question_count := question_count - 1;
  END IF;
  
  -- Add contextual questions with remaining count
  FOR i IN 0..question_count-1 LOOP
    selected_questions := selected_questions || 
      jsonb_array_element(base_template.contextual_questions, i);
  END LOOP;
  
  RETURN selected_questions;
END;
$$ LANGUAGE plpgsql;

COMMENT ON TABLE follow_up_question_rules IS 'Dynamic rules for selecting follow-up questions based on context';
COMMENT ON FUNCTION select_follow_up_questions IS 'Intelligently selects follow-up questions based on assessment type and context';