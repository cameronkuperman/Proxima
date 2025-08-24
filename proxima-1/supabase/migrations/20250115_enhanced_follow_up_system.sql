-- Enhanced Follow-Up System with AI-Generated Questions and Better Medical Tracking
-- Combines simplified base questions with AI-personalized additions

-- Clear existing templates
DELETE FROM follow_up_templates;

-- Enhanced medical visit details table
DROP TABLE IF EXISTS follow_up_medical_details;
CREATE TABLE follow_up_medical_details (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  follow_up_id UUID REFERENCES follow_ups(id),
  
  -- Visit information
  visit_type VARCHAR(50),
  visit_date DATE,
  provider_type VARCHAR(100), -- "Primary care", "Specialist - Cardiology", etc.
  
  -- What happened
  main_findings TEXT, -- "What was the main thing they told you?"
  diagnosis_given TEXT, -- "Did they give you a specific diagnosis?"
  diagnosis_clarity VARCHAR(20), -- "clear", "tentative", "ruling_out", "unknown"
  
  -- Actions taken
  medications_changed JSONB, -- {started: [], stopped: [], adjusted: []}
  tests_performed TEXT, -- "What tests did they do during the visit?"
  tests_ordered TEXT, -- "What tests do you need to get done?"
  referrals_made TEXT, -- "Were you referred to any specialists?"
  
  -- Treatment plan
  treatment_plan TEXT, -- "What's the plan going forward?"
  lifestyle_changes TEXT, -- "Any lifestyle changes recommended?"
  restrictions TEXT, -- "Any activities to avoid?"
  
  -- Follow-up
  follow_up_timeline VARCHAR(50), -- "In 2 weeks", "As needed", "If symptoms worsen"
  warning_signs TEXT, -- "What should make you seek immediate care?"
  
  -- Your perspective
  questions_answered BOOLEAN, -- "Did they answer your questions?"
  confidence_in_plan INTEGER, -- 1-5 scale
  main_concern_addressed BOOLEAN,
  notes TEXT, -- "Anything else important?"
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Base template for simplified questions
INSERT INTO follow_up_templates (name, description, core_questions, progression_questions, contextual_questions)
VALUES 
  ('Enhanced Universal Base', 'Base questions with AI enhancement capability', 
   
   -- Core Questions (Same as before but with AI injection points)
   '[
     {
       "id": "core_1",
       "q": "Have there been any changes to your symptoms since you last reported?",
       "type": "change_selector",
       "options": [
         {"value": "much_better", "label": "Yes, much better"},
         {"value": "somewhat_better", "label": "Yes, somewhat better"},
         {"value": "no_change", "label": "No significant change"},
         {"value": "somewhat_worse", "label": "Yes, somewhat worse"},
         {"value": "much_worse", "label": "Yes, much worse"},
         {"value": "completely_resolved", "label": "Symptoms completely resolved"}
       ],
       "required": true,
       "ai_enhancement_point": "after_response"
     },
     {
       "id": "core_2",
       "q": "What specific changes have you noticed?",
       "type": "structured_text",
       "prompts": {
         "improvements": "What has improved?",
         "worsening": "What has gotten worse?",
         "new": "Any new symptoms?"
       },
       "show_if": "core_1 != no_change",
       "required": false
     },
     {
       "id": "ai_inject_1",
       "note": "AI WILL INSERT 1-2 CONDITION-SPECIFIC QUESTIONS HERE",
       "examples": [
         "For headache: Has the location or type of pain changed?",
         "For chest issues: Does it happen at rest or with activity?",
         "For anxiety: Are there specific situations that trigger it?"
       ]
     },
     {
       "id": "core_3",
       "q": "How much is this affecting your daily life?",
       "type": "impact_scale",
       "options": [
         {"value": "none", "label": "Not at all"},
         {"value": "minimal", "label": "Minimal impact"},
         {"value": "moderate", "label": "Moderate impact"},
         {"value": "significant", "label": "Significant impact"},
         {"value": "severe", "label": "Severe - cant do normal activities"}
       ],
       "required": true
     }
   ]'::jsonb,
   
   -- Medical Visit Questions (Enhanced)
   '[
     {
       "id": "medical_1",
       "q": "Have you had any medical visits since your last report?",
       "type": "medical_visit_enhanced",
       "options": [
         {"value": "no", "label": "No"},
         {"value": "yes_helped", "label": "Yes, and it helped"},
         {"value": "yes_no_help", "label": "Yes, but it didn''t help much"},
         {"value": "yes_waiting", "label": "Yes, waiting for results/follow-up"},
         {"value": "scheduled", "label": "No, but I have one scheduled"}
       ],
       "modal_trigger": ["yes_helped", "yes_no_help", "yes_waiting"],
       "modal_config": {
         "title": "Tell us about your medical visit",
         "sections": [
           {
             "title": "The Visit",
             "fields": [
               {"id": "visit_type", "q": "What type of visit was it?", "type": "select", 
                "options": ["Primary care", "Specialist", "Urgent care", "Emergency", "Telehealth"]},
               {"id": "main_findings", "q": "What was the main thing they told you?", "type": "text", "required": true}
             ]
           },
           {
             "title": "Diagnosis & Tests",
             "fields": [
               {"id": "diagnosis_given", "q": "Did they give you a specific diagnosis?", "type": "text"},
               {"id": "diagnosis_clarity", "q": "How certain were they?", "type": "select",
                "options": ["Very certain", "Pretty sure", "Still figuring it out", "Ruled things out"]},
               {"id": "tests_performed", "q": "Any tests done during the visit?", "type": "text", "placeholder": "Blood work, X-ray, EKG, etc."},
               {"id": "tests_ordered", "q": "Any tests to do later?", "type": "text"}
             ]
           },
           {
             "title": "Treatment Changes",
             "fields": [
               {"id": "medications_started", "q": "New medications started?", "type": "text"},
               {"id": "medications_stopped", "q": "Medications stopped?", "type": "text"},
               {"id": "other_treatments", "q": "Other treatments recommended?", "type": "text", "placeholder": "Physical therapy, procedures, etc."},
               {"id": "lifestyle_changes", "q": "Lifestyle changes suggested?", "type": "text"}
             ]
           },
           {
             "title": "Next Steps",
             "fields": [
               {"id": "follow_up_timeline", "q": "When should you follow up?", "type": "text", "placeholder": "2 weeks, 1 month, as needed"},
               {"id": "warning_signs", "q": "What should make you seek immediate care?", "type": "text"},
               {"id": "referrals", "q": "Referred to any specialists?", "type": "text"}
             ]
           },
           {
             "title": "Your Thoughts",
             "fields": [
               {"id": "questions_answered", "q": "Did they address your main concerns?", "type": "yes_no"},
               {"id": "confidence_in_plan", "q": "How confident are you in the treatment plan?", "type": "scale_1_5"},
               {"id": "notes", "q": "Anything else important to remember?", "type": "text"}
             ]
           }
         ]
       },
       "required": true
     },
     {
       "id": "ai_inject_2", 
       "note": "AI WILL INSERT FOLLOW-UP QUESTION BASED ON MEDICAL VISIT RESPONSE",
       "examples": [
         "If new medication: Have you started taking it? Any side effects?",
         "If tests ordered: Have you scheduled the tests yet?",
         "If referral made: Were you able to get an appointment?"
       ]
     }
   ]'::jsonb,
   
   NULL -- No static contextual questions, replaced by AI
  );

-- Function to generate AI-personalized questions
CREATE OR REPLACE FUNCTION generate_ai_follow_up_questions(
  p_assessment_id UUID,
  p_assessment_type VARCHAR,
  p_follow_up_number INTEGER,
  p_last_responses JSONB DEFAULT NULL
) RETURNS JSONB AS $$
DECLARE
  ai_questions JSONB := '[]'::jsonb;
  original_data JSONB;
  condition_context TEXT;
BEGIN
  -- Get original assessment data
  CASE p_assessment_type
    WHEN 'quick_scan' THEN
      SELECT row_to_json(q.*) INTO original_data FROM quick_scans q WHERE id = p_assessment_id;
    WHEN 'deep_dive' THEN
      SELECT row_to_json(d.*) INTO original_data FROM deep_dive_sessions d WHERE id = p_assessment_id;
    WHEN 'general' THEN
      SELECT row_to_json(g.*) INTO original_data FROM general_assessments g WHERE id = p_assessment_id;
    WHEN 'general_deep' THEN
      SELECT row_to_json(g.*) INTO original_data FROM general_deepdive_sessions g WHERE id = p_assessment_id;
  END CASE;
  
  -- Extract condition context
  condition_context := COALESCE(
    original_data->>'primary_concern',
    original_data->>'body_part',
    original_data->>'category',
    'general health'
  );
  
  -- Generate condition-specific questions based on context
  -- These would actually call an AI service in production
  CASE 
    WHEN condition_context ILIKE '%headache%' OR condition_context ILIKE '%migraine%' THEN
      ai_questions := '[
        {"id": "ai_1", "q": "Has the location or pattern of your headache changed?", "type": "text"},
        {"id": "ai_2", "q": "What time of day is it worst?", "type": "time_select"},
        {"id": "ai_3", "q": "Any vision changes or sensitivity to light?", "type": "yes_no"}
      ]'::jsonb;
      
    WHEN condition_context ILIKE '%chest%' OR condition_context ILIKE '%heart%' THEN
      ai_questions := '[
        {"id": "ai_1", "q": "Does the chest discomfort occur at rest or with activity?", "type": "select", 
         "options": ["Only at rest", "Only with activity", "Both", "Random"]},
        {"id": "ai_2", "q": "How long do episodes typically last?", "type": "duration_select"},
        {"id": "ai_3", "q": "Does anything reliably make it better or worse?", "type": "text"}
      ]'::jsonb;
      
    WHEN condition_context ILIKE '%anxiety%' OR condition_context ILIKE '%stress%' THEN
      ai_questions := '[
        {"id": "ai_1", "q": "Are there specific situations that trigger your anxiety?", "type": "text"},
        {"id": "ai_2", "q": "How is your sleep quality?", "type": "scale_1_5"},
        {"id": "ai_3", "q": "Have you tried any relaxation techniques?", "type": "yes_no_what"}
      ]'::jsonb;
      
    WHEN condition_context ILIKE '%stomach%' OR condition_context ILIKE '%digest%' THEN
      ai_questions := '[
        {"id": "ai_1", "q": "Is the discomfort related to eating?", "type": "select",
         "options": ["Before meals", "During meals", "After meals", "No connection"]},
        {"id": "ai_2", "q": "Have you identified any trigger foods?", "type": "text"},
        {"id": "ai_3", "q": "Any changes in bowel habits?", "type": "yes_no_describe"}
      ]'::jsonb;
      
    ELSE
      -- Generic but personalized based on severity trends
      IF p_last_responses->>'trend' IN ('somewhat_worse', 'much_worse') THEN
        ai_questions := '[
          {"id": "ai_1", "q": "What do you think might be making things worse?", "type": "text"},
          {"id": "ai_2", "q": "Is there anything you need but don''t have access to?", "type": "text"}
        ]'::jsonb;
      ELSE
        ai_questions := '[
          {"id": "ai_1", "q": "What has been most helpful so far?", "type": "text"},
          {"id": "ai_2", "q": "What''s your biggest concern right now?", "type": "text"}
        ]'::jsonb;
      END IF;
  END CASE;
  
  -- Add follow-up specific questions if this is follow-up #3+
  IF p_follow_up_number >= 3 THEN
    ai_questions := ai_questions || '[
      {"id": "ai_long", "q": "Since this has been going on for a while, what''s your plan?", "type": "text"}
    ]'::jsonb;
  END IF;
  
  RETURN ai_questions;
END;
$$ LANGUAGE plpgsql;

-- Function to merge base questions with AI questions
CREATE OR REPLACE FUNCTION build_complete_follow_up(
  p_assessment_id UUID,
  p_assessment_type VARCHAR,
  p_follow_up_number INTEGER
) RETURNS JSONB AS $$
DECLARE
  base_questions JSONB;
  ai_questions JSONB;
  final_questions JSONB := '[]'::jsonb;
  i INTEGER;
BEGIN
  -- Get base template
  SELECT core_questions INTO base_questions
  FROM follow_up_templates
  WHERE name = 'Enhanced Universal Base';
  
  -- Get AI-generated questions
  ai_questions := generate_ai_follow_up_questions(
    p_assessment_id, 
    p_assessment_type, 
    p_follow_up_number
  );
  
  -- Merge questions intelligently
  FOR i IN 0..jsonb_array_length(base_questions)-1 LOOP
    -- Add base question
    final_questions := final_questions || jsonb_array_element(base_questions, i);
    
    -- Insert AI questions at designated injection points
    IF jsonb_array_element(base_questions, i)->>'id' = 'ai_inject_1' THEN
      -- Replace injection point with actual AI questions
      final_questions := final_questions || ai_questions;
    END IF;
  END LOOP;
  
  RETURN final_questions;
END;
$$ LANGUAGE plpgsql;

-- Example of what the AI service would generate in production
COMMENT ON FUNCTION generate_ai_follow_up_questions IS 
'In production, this would call OpenAI/Claude to generate truly personalized questions like:
- "Last time you mentioned the pain moves from your shoulder to your arm. Is this still happening?"
- "You said stress makes it worse. How have your stress levels been this week?"
- "You were trying meditation. How has that been working for you?"
- "The fatigue you mentioned - is it worse in the morning or evening?"
These would be based on the actual conversation history and symptoms.';

COMMENT ON TABLE follow_up_medical_details IS 'Comprehensive medical visit tracking with patient-friendly questions';