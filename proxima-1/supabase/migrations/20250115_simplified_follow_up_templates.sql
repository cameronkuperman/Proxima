-- Simplified Follow-Up Templates - Direct and Practical
-- Based on user feedback for cleaner, more straightforward questions

-- Clear existing templates
DELETE FROM follow_up_templates;

-- Insert simplified universal follow-up template
INSERT INTO follow_up_templates (name, description, core_questions, progression_questions, contextual_questions, safety_questions)
VALUES 
  ('Simplified Universal Follow-Up', 'Direct questions for all assessment types', 
   
   -- Core Questions (Always asked - 4 questions)
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
       "required": true
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
     },
     {
       "id": "core_4",
       "q": "Overall, how would you rate your current condition?",
       "type": "simple_scale",
       "min": 1,
       "max": 10,
       "labels": {
         "1": "Completely fine",
         "5": "Managing okay",
         "10": "Very concerning"
       },
       "show_previous": true,
       "required": true
     }
   ]'::jsonb,
   
   -- Progression Questions (What changed - 3 questions)
   '[
     {
       "id": "prog_1",
       "q": "Have you identified any new triggers or patterns?",
       "type": "trigger_check",
       "options": [
         {"value": "yes", "label": "Yes, I noticed new triggers"},
         {"value": "no", "label": "No new triggers"},
         {"value": "unsure", "label": "Not sure"}
       ],
       "follow_up": {
         "if": "yes",
         "q": "What triggers did you notice?",
         "type": "text",
         "placeholder": "Describe the triggers or patterns..."
       },
       "required": true
     },
     {
       "id": "prog_2",
       "q": "What have you been doing to manage your symptoms?",
       "type": "treatment_simple",
       "options": [
         "Taking medication",
         "Rest and recovery",
         "Exercise/Physical therapy",
         "Diet changes",
         "Stress management",
         "Alternative treatments",
         "Nothing yet",
         "Other"
       ],
       "multiple": true,
       "follow_up": "How well is this working?",
       "effectiveness": ["Not helping", "Helps a little", "Helps a lot"],
       "required": false
     },
     {
       "id": "prog_3",
       "q": "Is there anything preventing you from getting better?",
       "type": "barrier_check",
       "options": [
         "Can''t afford treatment",
         "Too busy/No time",
         "Don''t know what to do",
         "Treatment not working",
         "Side effects from treatment",
         "Waiting for appointment",
         "No barriers",
         "Other"
       ],
       "multiple": true,
       "required": false
     }
   ]'::jsonb,
   
   -- Medical Contact Questions (Healthcare interaction - 2 questions)
   '[
     {
       "id": "medical_1",
       "q": "Have you had to seek medical attention since your last report?",
       "type": "medical_visit",
       "options": [
         {"value": "no", "label": "No"},
         {"value": "telehealth", "label": "Yes - Telehealth/Phone"},
         {"value": "doctor", "label": "Yes - Doctor visit"},
         {"value": "urgent_care", "label": "Yes - Urgent care"},
         {"value": "emergency", "label": "Yes - Emergency room"},
         {"value": "specialist", "label": "Yes - Specialist"}
       ],
       "follow_up_modal": {
         "if": "!= no",
         "title": "What did they say?",
         "fields": [
           {"id": "diagnosis", "label": "Diagnosis/Assessment:", "type": "text"},
           {"id": "treatment", "label": "Treatment recommended:", "type": "text"},
           {"id": "followup", "label": "Follow-up needed:", "type": "text"},
           {"id": "tests", "label": "Tests ordered:", "type": "text"}
         ]
       },
       "required": true
     },
     {
       "id": "medical_2",
       "q": "Do you feel you need medical attention now?",
       "type": "care_need",
       "options": [
         {"value": "no", "label": "No, I''m managing okay"},
         {"value": "maybe", "label": "Maybe, not sure"},
         {"value": "yes_soon", "label": "Yes, in the next few days"},
         {"value": "yes_urgent", "label": "Yes, urgently", "alert": true}
       ],
       "show_if": "medical_1 == no || prog_1.severity >= moderate",
       "required": true
     }
   ]'::jsonb,
   
   -- Quick Safety Check (1 question)
   '[
     {
       "id": "safety_1",
       "q": "Are you experiencing any of these concerning symptoms?",
       "type": "red_flag_quick",
       "options": [
         "Chest pain",
         "Difficulty breathing", 
         "Severe pain (8+ out of 10)",
         "Fainting/Dizziness",
         "High fever",
         "Thoughts of self-harm",
         "None of these"
       ],
       "multiple": true,
       "alert_if_selected": ["Chest pain", "Difficulty breathing", "Thoughts of self-harm"],
       "show_if": "core_1 IN [somewhat_worse, much_worse] OR core_4 >= 8",
       "required": true
     }
   ]'::jsonb
  );

-- Simplified question selection based on assessment type
CREATE OR REPLACE FUNCTION select_simplified_questions(
  p_assessment_type VARCHAR,
  p_follow_up_number INTEGER,
  p_previous_trend VARCHAR DEFAULT NULL
) RETURNS JSONB AS $$
DECLARE
  questions JSONB := '[]'::jsonb;
  template RECORD;
BEGIN
  -- Get the simplified template
  SELECT * INTO template 
  FROM follow_up_templates 
  WHERE name = 'Simplified Universal Follow-Up' 
  LIMIT 1;
  
  -- Always include core questions (4)
  questions := template.core_questions;
  
  -- Add questions based on assessment type
  CASE p_assessment_type
    WHEN 'quick_scan' THEN
      -- Quick scan: Just add trigger question (total: 5)
      questions := questions || template.progression_questions->0;
      
    WHEN 'general' THEN
      -- General: Add triggers and management (total: 6)
      questions := questions || template.progression_questions->0 || template.progression_questions->1;
      
    WHEN 'deep_dive' THEN
      -- Deep dive: Add all progression + medical (total: 9)
      questions := questions || template.progression_questions || template.contextual_questions->0;
      
    WHEN 'general_deep' THEN
      -- General deep: Everything (total: 10-11)
      questions := questions || template.progression_questions || template.contextual_questions;
      -- Add safety check if worsening
      IF p_previous_trend IN ('somewhat_worse', 'much_worse') THEN
        questions := questions || template.safety_questions->0;
      END IF;
  END CASE;
  
  RETURN questions;
END;
$$ LANGUAGE plpgsql;

-- Add simple tracking for medical visit details
CREATE TABLE IF NOT EXISTS follow_up_medical_details (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  follow_up_id UUID REFERENCES follow_ups(id),
  visit_type VARCHAR(50),
  diagnosis TEXT,
  treatment_recommended TEXT,
  followup_needed TEXT,
  tests_ordered TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON FUNCTION select_simplified_questions IS 'Returns simplified, direct questions based on assessment type';
COMMENT ON TABLE follow_up_medical_details IS 'Stores details from medical visits reported in follow-ups';