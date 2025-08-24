-- Final Simplified Follow-Up Templates
-- Clean, direct questions that users actually want to answer

-- Clear any existing templates
DELETE FROM follow_up_templates;

-- Drop severity_score constraint since we're not using 1-10 anymore
ALTER TABLE follow_ups 
DROP CONSTRAINT IF EXISTS follow_ups_severity_score_check;

-- Update severity tracking to use the same scale as questions
ALTER TABLE follow_ups 
ALTER COLUMN severity_score TYPE VARCHAR(20);

-- Add constraint for new severity values
ALTER TABLE follow_ups 
ADD CONSTRAINT follow_ups_severity_trend_check 
CHECK (severity_score IN ('much_better', 'somewhat_better', 'about_same', 'somewhat_worse', 'much_worse'));

-- Medical visit details table (simplified)
DROP TABLE IF EXISTS follow_up_medical_details;
CREATE TABLE follow_up_medical_details (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  follow_up_id UUID REFERENCES follow_ups(id),
  
  -- Core fields from modal
  provider_type VARCHAR(50), -- 'primary', 'specialist', 'urgent_care', 'er', 'telehealth'
  specialist_type VARCHAR(100), -- If specialist, what kind
  assessment_summary TEXT, -- What was their assessment?
  treatments_started TEXT, -- Did they start you on any treatments?
  follow_up_timeline TEXT, -- When do you need to follow up?
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Insert the final simplified template
INSERT INTO follow_up_templates (name, description, core_questions, progression_questions)
VALUES 
  ('Final Simplified Universal', 'Direct questions for all assessment types', 
   
   -- Base Questions (5 total, everyone gets these)
   '[
     {
       "id": "q1",
       "q": "Have there been any changes since last time?",
       "type": "change_scale",
       "options": [
         {"value": "much_better", "label": "Much better"},
         {"value": "somewhat_better", "label": "Somewhat better"},
         {"value": "no_change", "label": "No significant change"},
         {"value": "somewhat_worse", "label": "Somewhat worse"},
         {"value": "much_worse", "label": "Much worse"}
       ],
       "required": true,
       "ai_inject_after": true
     },
     {
       "id": "q2",
       "q": "What specific changes have you noticed?",
       "type": "text",
       "placeholder": "Describe any changes...",
       "show_if": "q1 != no_change",
       "required": false,
       "ai_inject_after": true
     },
     {
       "id": "q3",
       "q": "Have your symptoms worsened or gotten better in severity?",
       "type": "severity_scale",
       "options": [
         {"value": "much_worse", "label": "Much worse"},
         {"value": "somewhat_worse", "label": "Somewhat worse"},
         {"value": "about_same", "label": "About the same"},
         {"value": "somewhat_better", "label": "Somewhat better"},
         {"value": "much_better", "label": "Much better"}
       ],
       "required": true
     },
     {
       "id": "q4",
       "q": "Have you identified any new triggers or patterns?",
       "type": "trigger_check",
       "options": [
         {"value": "yes", "label": "Yes"},
         {"value": "no", "label": "No"},
         {"value": "not_sure", "label": "Not sure"}
       ],
       "follow_up_field": {
         "show_if": "yes",
         "type": "text",
         "placeholder": "What triggers or patterns did you notice?"
       },
       "required": true,
       "ai_inject_after": true
     },
     {
       "id": "q5",
       "q": "Have you seen a doctor since last time?",
       "type": "medical_check",
       "options": [
         {"value": "yes", "label": "Yes", "opens_modal": true},
         {"value": "no", "label": "No"}
       ],
       "modal": {
         "title": "Medical Visit Update",
         "fields": [
           {
             "id": "provider",
             "q": "Who did you see?",
             "type": "select",
             "options": ["Primary doctor", "Specialist", "Urgent care", "ER", "Telehealth"],
             "specialist_field": {
               "show_if": "Specialist",
               "type": "text",
               "placeholder": "What kind of specialist?"
             }
           },
           {
             "id": "assessment",
             "q": "What was their assessment?",
             "type": "text",
             "placeholder": "Main takeaway from the visit..."
           },
           {
             "id": "treatments",
             "q": "Did they start you on any treatments?",
             "type": "text",
             "placeholder": "Medications, therapy, procedures, etc..."
           },
           {
             "id": "follow_up",
             "q": "When do you need to follow up? (optional)",
             "type": "text",
             "placeholder": "In 2 weeks, as needed, etc...",
             "required": false
           }
         ]
       },
       "required": true
     }
   ]'::jsonb,
   
   -- AI questions will be generated and interspersed
   NULL
  );

-- Function to generate AI questions based on condition
CREATE OR REPLACE FUNCTION generate_ai_follow_up_questions(
  p_assessment_id UUID,
  p_assessment_type VARCHAR,
  p_condition_context TEXT DEFAULT NULL
) RETURNS JSONB AS $$
DECLARE
  ai_questions JSONB := '[]'::jsonb;
  condition TEXT;
BEGIN
  -- Determine condition from original assessment
  condition := LOWER(COALESCE(p_condition_context, 'general'));
  
  -- Generate 3 AI questions based on condition type
  -- In production, this would call OpenAI/Claude API
  
  IF condition LIKE '%headache%' OR condition LIKE '%migraine%' THEN
    ai_questions := '[
      {"id": "ai_1", "q": "Is the pain in the same location as before?", "type": "yes_no_explain"},
      {"id": "ai_2", "q": "What time of day is it typically worst?", "type": "text"},
      {"id": "ai_3", "q": "Have you tried anything new for relief?", "type": "text"}
    ]'::jsonb;
    
  ELSIF condition LIKE '%chest%' OR condition LIKE '%heart%' THEN
    ai_questions := '[
      {"id": "ai_1", "q": "Does it happen at rest or with activity?", "type": "select", 
       "options": ["Only at rest", "Only with activity", "Both", "Random"]},
      {"id": "ai_2", "q": "How long do episodes typically last?", "type": "text"},
      {"id": "ai_3", "q": "Does anything reliably make it better or worse?", "type": "text"}
    ]'::jsonb;
    
  ELSIF condition LIKE '%anxiety%' OR condition LIKE '%stress%' OR condition LIKE '%mental%' THEN
    ai_questions := '[
      {"id": "ai_1", "q": "Are the anxious thoughts the same or different than before?", "type": "text"},
      {"id": "ai_2", "q": "How has your sleep been?", "type": "select",
       "options": ["Much worse", "Somewhat worse", "Same", "Somewhat better", "Much better"]},
      {"id": "ai_3", "q": "What coping strategies have you been using?", "type": "text"}
    ]'::jsonb;
    
  ELSIF condition LIKE '%stomach%' OR condition LIKE '%digest%' OR condition LIKE '%abdomen%' THEN
    ai_questions := '[
      {"id": "ai_1", "q": "Is the discomfort related to eating?", "type": "select",
       "options": ["Before meals", "During meals", "After meals", "No connection"]},
      {"id": "ai_2", "q": "Have you noticed any food triggers?", "type": "text"},
      {"id": "ai_3", "q": "Any changes in bowel habits?", "type": "yes_no_explain"}
    ]'::jsonb;
    
  ELSIF condition LIKE '%back%' OR condition LIKE '%joint%' OR condition LIKE '%muscle%' THEN
    ai_questions := '[
      {"id": "ai_1", "q": "Is the pain constant or does it come and go?", "type": "select",
       "options": ["Constant", "Comes and goes", "Only with movement", "Only at rest"]},
      {"id": "ai_2", "q": "Does the pain radiate anywhere else?", "type": "yes_no_explain"},
      {"id": "ai_3", "q": "What positions or activities help or hurt?", "type": "text"}
    ]'::jsonb;
    
  ELSIF condition LIKE '%skin%' OR condition LIKE '%rash%' OR condition LIKE '%itch%' THEN
    ai_questions := '[
      {"id": "ai_1", "q": "Has the affected area spread or changed size?", "type": "yes_no_explain"},
      {"id": "ai_2", "q": "Any changes in color, texture, or appearance?", "type": "text"},
      {"id": "ai_3", "q": "What makes it better or worse?", "type": "text"}
    ]'::jsonb;
    
  ELSIF condition LIKE '%sleep%' OR condition LIKE '%insomn%' OR condition LIKE '%tired%' THEN
    ai_questions := '[
      {"id": "ai_1", "q": "What time do you typically fall asleep and wake up?", "type": "text"},
      {"id": "ai_2", "q": "How many times do you wake up during the night?", "type": "select",
       "options": ["0", "1-2", "3-4", "5+", "Lost count"]},
      {"id": "ai_3", "q": "How rested do you feel in the morning?", "type": "select",
       "options": ["Exhausted", "Tired", "Okay", "Rested", "Energized"]}
    ]'::jsonb;
    
  ELSE
    -- Generic questions for unspecified conditions
    ai_questions := '[
      {"id": "ai_1", "q": "What aspect of this bothers you the most?", "type": "text"},
      {"id": "ai_2", "q": "Has anything made it noticeably better or worse?", "type": "text"},
      {"id": "ai_3", "q": "What are you most concerned about?", "type": "text"}
    ]'::jsonb;
  END IF;
  
  RETURN ai_questions;
END;
$$ LANGUAGE plpgsql;

-- Function to build complete question set with AI questions interspersed
CREATE OR REPLACE FUNCTION build_follow_up_questions(
  p_assessment_id UUID,
  p_assessment_type VARCHAR,
  p_condition_context TEXT DEFAULT NULL
) RETURNS JSONB AS $$
DECLARE
  base_questions JSONB;
  ai_questions JSONB;
  final_questions JSONB := '[]'::jsonb;
  ai_index INTEGER := 0;
BEGIN
  -- Get base template
  SELECT core_questions INTO base_questions
  FROM follow_up_templates
  WHERE name = 'Final Simplified Universal';
  
  -- Get AI questions
  ai_questions := generate_ai_follow_up_questions(p_assessment_id, p_assessment_type, p_condition_context);
  
  -- Build final question order with AI questions interspersed
  -- Order: Q1, AI1, Q2, AI2, Q3, Q4, AI3, Q5
  
  final_questions := final_questions || (base_questions->0); -- Q1: Changes?
  final_questions := final_questions || (ai_questions->0);   -- AI1: Condition-specific
  
  final_questions := final_questions || (base_questions->1); -- Q2: What specific changes?
  final_questions := final_questions || (ai_questions->1);   -- AI2: Based on responses
  
  final_questions := final_questions || (base_questions->2); -- Q3: Severity?
  final_questions := final_questions || (base_questions->3); -- Q4: Triggers?
  final_questions := final_questions || (ai_questions->2);   -- AI3: Progression-based
  
  final_questions := final_questions || (base_questions->4); -- Q5: Seen doctor?
  
  RETURN final_questions;
END;
$$ LANGUAGE plpgsql;

-- Comments
COMMENT ON FUNCTION generate_ai_follow_up_questions IS 
'Generates 3 condition-specific AI questions. In production, this would call OpenAI/Claude for truly personalized questions based on the users history and condition.';

COMMENT ON FUNCTION build_follow_up_questions IS 
'Builds the complete 8-question follow-up by interspersing AI questions with base questions.';

COMMENT ON TABLE follow_up_medical_details IS 
'Simplified medical visit details from the optional modal popup.';