# Backend Implementation Guide: General Assessment System

## Table of Contents
1. [Overview](#overview)
2. [Database Schema](#database-schema)
3. [API Endpoints](#api-endpoints)
4. [Implementation Details](#implementation-details)
5. [System Prompts](#system-prompts)
6. [Helper Functions](#helper-functions)
7. [Error Handling](#error-handling)
8. [Testing](#testing)
9. [Model Selection](#model-selection)
10. [Integration Notes](#integration-notes)

## Overview

The General Assessment system provides three assessment types for non-body-specific health concerns:

- **Flash Assessment** (10 seconds): Quick triage from free text input
- **General Quick Scan** (30-45 seconds): Structured single-form assessment  
- **General Deep Dive** (2-5 minutes): Multi-step conversational diagnosis

### Key Principles
1. **No medical history questions** - Pull from existing Supabase data
2. **Category-specific prompts** - Tailored analysis for each health category
3. **Progressive disclosure** - Start simple, get detailed only when needed
4. **Unified timeline** - All assessments auto-populate timeline events

## Database Schema

### Tables Required

```sql
-- Flash assessments table
CREATE TABLE flash_assessments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    user_query TEXT NOT NULL,
    ai_response TEXT NOT NULL,
    main_concern TEXT,
    urgency VARCHAR(20) CHECK (urgency IN ('low', 'medium', 'high', 'emergency')),
    confidence_score INTEGER CHECK (confidence_score >= 0 AND confidence_score <= 100),
    suggested_next_action VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- General assessments table  
CREATE TABLE general_assessments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    category VARCHAR(20) NOT NULL CHECK (category IN ('energy', 'mental', 'sick', 'medication', 'multiple', 'unsure')),
    form_data JSONB NOT NULL,
    analysis_result JSONB NOT NULL,
    primary_assessment TEXT,
    confidence_score INTEGER CHECK (confidence_score >= 0 AND confidence_score <= 100),
    urgency_level VARCHAR(20) CHECK (urgency_level IN ('low', 'medium', 'high')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- General deep dive sessions table
CREATE TABLE general_deepdive_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    category VARCHAR(20) NOT NULL,
    initial_form_data JSONB NOT NULL,
    questions JSONB DEFAULT '[]'::jsonb,
    answers JSONB DEFAULT '[]'::jsonb,
    final_analysis JSONB,
    session_status VARCHAR(20) DEFAULT 'active',
    session_duration_ms INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Timeline events table
CREATE TABLE timeline_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    event_type VARCHAR(50) NOT NULL,
    event_category VARCHAR(20) NOT NULL,
    source_table VARCHAR(50) NOT NULL,
    source_id UUID NOT NULL,
    title TEXT NOT NULL,
    summary TEXT,
    icon_type VARCHAR(50),
    color_scheme VARCHAR(100),
    severity VARCHAR(20),
    confidence INTEGER,
    thread_id UUID,
    is_follow_up BOOLEAN DEFAULT FALSE,
    metadata JSONB,
    tags TEXT[],
    event_timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX idx_timeline_user_timestamp ON timeline_events(user_id, event_timestamp DESC);
CREATE INDEX idx_flash_user ON flash_assessments(user_id);
CREATE INDEX idx_general_user ON general_assessments(user_id);
CREATE INDEX idx_deepdive_user ON general_deepdive_sessions(user_id);
```

### Auto-population Triggers

```sql
-- Trigger for flash assessments
CREATE OR REPLACE FUNCTION create_flash_timeline_event()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO timeline_events (
        user_id, event_type, event_category, source_table, source_id,
        title, summary, icon_type, color_scheme, severity, confidence
    ) VALUES (
        NEW.user_id, 'flash', 'general', 'flash_assessments', NEW.id,
        'Flash Assessment: ' || COALESCE(NEW.main_concern, 'Health Check'),
        NEW.ai_response, 'Sparkles', 'from-amber-500 to-yellow-500',
        NEW.urgency, NEW.confidence_score
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER flash_timeline_trigger
AFTER INSERT ON flash_assessments
FOR EACH ROW EXECUTE FUNCTION create_flash_timeline_event();
```

## API Endpoints

### 1. Flash Assessment

**Endpoint:** `POST /api/flash-assessment`

**Request:**
```json
{
  "user_query": "I've been feeling exhausted all the time and can't focus",
  "user_id": "123e4567-e89b-12d3-a456-426614174000"
}
```

**Response:**
```json
{
  "flash_id": "abc123...",
  "response": "I understand you're dealing with persistent exhaustion and difficulty focusing. This combination often points to either sleep quality issues or stress-related fatigue...",
  "main_concern": "Chronic fatigue with cognitive symptoms",
  "urgency": "medium",
  "confidence": 75,
  "next_steps": {
    "recommended_action": "general-assessment",
    "reason": "A structured assessment can help identify whether this is sleep-related, stress-related, or potentially something else"
  }
}
```

### 2. General Assessment

**Endpoint:** `POST /api/general-assessment`

**Request:**
```json
{
  "category": "energy",
  "form_data": {
    "symptoms": "Constant fatigue, brain fog, difficulty waking up",
    "duration": "3 weeks",
    "impactLevel": 8,
    "aggravatingFactors": ["stress", "poor_sleep"],
    "triedInterventions": ["more_sleep", "caffeine"],
    "energyPattern": "Worst in morning and afternoon",
    "sleepHours": "7-8",
    "wakingUpFeeling": "Exhausted"
  },
  "user_id": "123e4567-e89b-12d3-a456-426614174000"
}
```

**Response:**
```json
{
  "assessment_id": "def456...",
  "analysis": {
    "primary_assessment": "Sleep quality disorder with daytime fatigue syndrome",
    "confidence": 82,
    "key_findings": [
      "Normal sleep duration but poor quality",
      "Morning exhaustion suggests non-restorative sleep",
      "Brain fog indicates cognitive impact"
    ],
    "possible_causes": [
      {
        "condition": "Sleep apnea",
        "likelihood": 45,
        "explanation": "Morning exhaustion despite adequate hours is a key indicator"
      },
      {
        "condition": "Chronic stress/burnout",
        "likelihood": 35,
        "explanation": "Stress as aggravating factor with cognitive symptoms"
      },
      {
        "condition": "Nutritional deficiency",
        "likelihood": 20,
        "explanation": "B12 or iron deficiency can cause these symptoms"
      }
    ],
    "recommendations": [
      "Consider sleep study to rule out sleep apnea",
      "Track energy levels hourly for 3 days",
      "Blood work: CBC, B12, ferritin, thyroid panel"
    ],
    "urgency": "medium"
  }
}
```

### 3. General Deep Dive - Start

**Endpoint:** `POST /api/general-deepdive/start`

**Request:**
```json
{
  "category": "mental",
  "form_data": {
    "symptoms": "Anxiety, racing thoughts, trouble sleeping",
    "duration": "2 months",
    "impactLevel": 7,
    "moodPattern": "Anxious most of the day",
    "triggerEvents": "Work stress, family issues",
    "concentrationLevel": 4
  },
  "user_id": "123e4567-e89b-12d3-a456-426614174000"
}
```

**Response:**
```json
{
  "session_id": "ghi789...",
  "question": "When you experience racing thoughts, are they primarily worries about future events, replaying past situations, or a mix of both?",
  "question_number": 1,
  "estimated_questions": "3-5",
  "question_type": "diagnostic",
  "status": "success"
}
```

### 4. General Deep Dive - Continue

**Endpoint:** `POST /api/general-deepdive/continue`

**Request:**
```json
{
  "session_id": "ghi789...",
  "answer": "Mostly worries about future events - what might go wrong at work, health concerns, financial worries",
  "question_number": 1
}
```

**Response (continuing):**
```json
{
  "question": "Have you noticed any physical symptoms along with your anxiety, such as chest tightness, rapid heartbeat, sweating, or stomach issues?",
  "question_number": 2,
  "is_final_question": false,
  "status": "success"
}
```

**Response (ready for analysis):**
```json
{
  "ready_for_analysis": true,
  "questions_completed": 4,
  "status": "success"
}
```

### 5. General Deep Dive - Complete

**Endpoint:** `POST /api/general-deepdive/complete`

**Request:**
```json
{
  "session_id": "ghi789...",
  "final_answer": "Yes, I get chest tightness and my heart races, especially during meetings"
}
```

**Response:**
```json
{
  "deep_dive_id": "ghi789...",
  "analysis": {
    "primary_diagnosis": "Generalized Anxiety Disorder with panic features",
    "confidence_score": 87,
    "key_findings": [
      "Future-oriented worry pattern",
      "Physical manifestations (somatic symptoms)",
      "Work-related triggers identified",
      "Sleep disruption secondary to anxiety"
    ],
    "differential_diagnoses": [
      {
        "condition": "Generalized Anxiety Disorder",
        "probability": 70,
        "supporting_evidence": ["Persistent worry", "Physical symptoms", "Sleep issues"]
      },
      {
        "condition": "Adjustment Disorder with Anxiety",
        "probability": 20,
        "supporting_evidence": ["Clear stressors identified", "Timeline matches stress onset"]
      }
    ],
    "recommendations": [
      "Consider cognitive behavioral therapy (CBT)",
      "Practice breathing exercises before meetings",
      "Evaluate caffeine intake",
      "If symptoms persist, consult mental health professional"
    ],
    "red_flags": [
      "If chest pain becomes severe or prolonged",
      "If panic attacks increase in frequency",
      "If suicidal thoughts occur"
    ]
  },
  "category": "mental",
  "confidence": 87,
  "questions_asked": 4,
  "session_duration_ms": 185000,
  "reasoning_snippets": [
    "Future-oriented worry pattern strongly suggests GAD over depression",
    "Physical symptoms indicate anxiety is affecting autonomic nervous system",
    "Work triggers are specific but anxiety appears generalized"
  ],
  "status": "success"
}
```

## Implementation Details

### Authentication & User Context

```python
async def get_user_context(user_id: str) -> dict:
    """Fetch comprehensive user medical context from Supabase"""
    
    # Query medical table
    medical_data = await supabase.table("medical").select("*").eq("id", user_id).single()
    
    # Extract relevant fields
    return {
        "demographics": {
            "age": medical_data.get("age"),
            "sex": "male" if medical_data.get("is_male") else "female",
            "height_cm": medical_data.get("height"),
            "weight_kg": medical_data.get("weight"),
            "bmi": calculate_bmi(medical_data.get("height"), medical_data.get("weight"))
        },
        "medical_history": {
            "chronic_conditions": medical_data.get("chronic_conditions", []),
            "current_medications": medical_data.get("current_medications", []),
            "allergies": medical_data.get("allergies", []),
            "family_history": medical_data.get("family_history", []),
            "surgical_history": medical_data.get("surgical_history", [])
        },
        "lifestyle": {
            "smoking": medical_data.get("smoking_status"),
            "alcohol": medical_data.get("alcohol_use"),
            "exercise": medical_data.get("exercise_frequency"),
            "diet": medical_data.get("diet_type"),
            "sleep_average": medical_data.get("average_sleep_hours")
        },
        "vitals": {
            "blood_pressure": medical_data.get("blood_pressure"),
            "resting_heart_rate": medical_data.get("resting_heart_rate"),
            "blood_type": medical_data.get("blood_type")
        }
    }
```

### Request Validation

```python
from pydantic import BaseModel, validator
from typing import Optional, Dict, Any

class FlashAssessmentRequest(BaseModel):
    user_query: str
    user_id: Optional[str] = None
    
    @validator('user_query')
    def validate_query_length(cls, v):
        if len(v) < 10:
            raise ValueError('Query too short')
        if len(v) > 1000:
            raise ValueError('Query too long')
        return v

class GeneralAssessmentRequest(BaseModel):
    category: str
    form_data: Dict[str, Any]
    user_id: Optional[str] = None
    
    @validator('category')
    def validate_category(cls, v):
        valid_categories = ['energy', 'mental', 'sick', 'physical', 'medication', 'multiple', 'unsure']
        if v not in valid_categories:
            raise ValueError(f'Invalid category. Must be one of: {valid_categories}')
        return v
```

### LLM Integration

```python
async def call_llm(system_prompt: str, model: str, temperature: float = 0.7, 
                   response_format: dict = None) -> dict:
    """Unified LLM calling function"""
    
    # Model routing based on task
    if model == "flash":
        model_name = "deepseek/deepseek-chat"
        temperature = 0.7
    elif model == "general":
        model_name = "deepseek/deepseek-chat"
        temperature = 0.6
    elif model == "deepdive":
        model_name = "deepseek/deepseek-r1-distill-llama-70b:free"
        temperature = 0.5
    else:
        model_name = model
    
    # Prepare request
    messages = [{"role": "system", "content": system_prompt}]
    
    # Add response format if specified
    kwargs = {
        "model": model_name,
        "messages": messages,
        "temperature": temperature
    }
    
    if response_format:
        kwargs["response_format"] = response_format
    
    # Make request with retry logic
    max_retries = 3
    for attempt in range(max_retries):
        try:
            response = await openrouter_client.chat.completions.create(**kwargs)
            return response.choices[0].message.content
        except Exception as e:
            if attempt == max_retries - 1:
                raise
            await asyncio.sleep(2 ** attempt)  # Exponential backoff
```

## System Prompts

### Flash Assessment Prompt

```python
def build_flash_assessment_prompt(user_medical_data: dict) -> str:
    return f"""You are a compassionate health triage assistant performing initial assessment.

User Medical Context:
Age: {user_medical_data['demographics']['age']} year old {user_medical_data['demographics']['sex']}
BMI: {user_medical_data['demographics']['bmi']}
Chronic Conditions: {', '.join(user_medical_data['medical_history']['chronic_conditions']) or 'None'}
Current Medications: {', '.join(user_medical_data['medical_history']['current_medications']) or 'None'}
Allergies: {', '.join(user_medical_data['medical_history']['allergies']) or 'None known'}

Your task:
1. Listen to the user's concern with empathy
2. Identify the main health issue clearly
3. Assess urgency appropriately (low/medium/high/emergency)
4. Recommend ONE most appropriate next step
5. Be warm and conversational, not clinical

Response format (JSON):
{{
  "response": "Your 1-2 paragraph conversational response",
  "main_concern": "Clear, concise statement of the main issue",
  "urgency": "low|medium|high|emergency",
  "confidence": 0-100,
  "next_action": "general-assessment|body-scan|see-doctor|monitor",
  "action_reason": "Brief explanation of why this action is recommended"
}}

Emergency indicators that warrant "emergency" urgency:
- Chest pain with shortness of breath
- Sudden severe headache
- Signs of stroke (FAST symptoms)
- Severe allergic reaction
- Suicidal ideation
- Severe bleeding
"""
```

### Category-Specific System Prompts

```python
CATEGORY_PROMPTS = {
    "energy": """You are analyzing energy and fatigue concerns. Consider:

Medical Context: {medical_context}

Key areas to evaluate:
- Sleep quality vs quantity (distinguish between the two)
- Circadian rhythm disruptions
- Nutritional deficiencies (B12, iron, vitamin D, thyroid)
- Medication side effects from: {medications}
- Post-viral fatigue patterns
- Chronic fatigue syndrome criteria
- Depression manifesting as fatigue
- Dehydration and electrolyte imbalance

Red flags for urgent referral:
- Sudden onset with chest pain
- Unexplained weight loss
- Night sweats with fatigue
- Extreme weakness affecting daily function
""",

    "mental": """You are analyzing mental health concerns with compassion and clinical insight.

Medical Context: {medical_context}

Key areas to evaluate:
- Mood disorders (depression, bipolar patterns)
- Anxiety spectrum disorders
- Trauma responses and PTSD
- Medication interactions from: {medications}
- Sleep-mood bidirectional relationship
- Substance use impacts
- Cognitive vs emotional symptoms
- Support system availability

Maintain a supportive, non-judgmental tone throughout.

Crisis indicators requiring immediate care:
- Suicidal ideation or plans
- Homicidal thoughts
- Severe dissociation
- Psychotic symptoms
""",

    "sick": """You are analyzing acute illness symptoms to determine severity and care needs.

Medical Context: {medical_context}

Key areas to evaluate:
- Infectious vs non-infectious causes
- Symptom onset and progression timeline
- Fever pattern and associated symptoms
- Dehydration risk factors
- Contagion considerations
- Complications risk based on: {chronic_conditions}
- Need for testing (strep, flu, COVID)

Urgent care indicators:
- High fever (>103°F) or fever with chronic conditions
- Difficulty breathing or chest pain
- Severe dehydration signs
- Altered mental status
- Persistent vomiting
""",

    "physical": """You are analyzing physical pain, injuries, and body-specific symptoms.

Medical Context: {medical_context}

Key areas to evaluate:
- Location specificity and radiation patterns
- Injury mechanism if applicable
- Pain characteristics (sharp, dull, burning, throbbing)
- Movement vs rest patterns
- Inflammatory signs (redness, warmth, swelling)
- Neurological symptoms (numbness, tingling, weakness)
- Skin changes or rashes
- Functional limitations

Red flags requiring urgent care:
- Chest pain with cardiac symptoms
- Severe abdominal pain with rigidity
- Head injury with altered consciousness
- Numbness/weakness suggesting stroke
- Severe pain with fever
- Bone deformity or inability to bear weight
""",

    "medication": """You are analyzing potential medication-related issues.

Current Medications: {medications}
Medical Conditions: {chronic_conditions}

Key areas to evaluate:
- Timeline of symptoms vs medication changes
- Known side effects of current medications
- Drug-drug interactions
- Dose-dependent effects
- Time-of-day administration impacts
- Adherence patterns
- Generic vs brand changes
- Need to contact prescriber

Critical medication issues:
- Allergic reactions (rash, swelling, breathing issues)
- Severe side effects affecting function
- Signs of toxicity
- Dangerous interactions
""",

    "multiple": """You are analyzing multiple concurrent symptoms to identify patterns.

Medical Context: {medical_context}

Key areas to evaluate:
- Systemic conditions causing multiple symptoms
- Medication cascade effects
- Autoimmune condition patterns
- Stress/anxiety physical manifestations
- Whether symptoms are related or independent
- Priority order for addressing issues
- Specialist referral needs

Pattern recognition:
- Inflammatory conditions (joint pain + fatigue + rash)
- Endocrine disorders (multiple system involvement)
- Neurological conditions (sensory + motor + cognitive)
""",

    "unsure": """You are helping someone navigate vague or unclear symptoms with validation and guidance.

Medical Context: {medical_context}

Approach:
- Validate their experience
- Help organize thoughts about symptoms
- Identify any patterns they might not see
- Suggest structured tracking methods
- Provide gentle guidance toward appropriate care
- Consider somatization of stress/anxiety
- Screen for common overlooked conditions

Focus on:
- Building symptom timeline
- Impact on daily function
- Associated life stressors
- Previous similar episodes
- What makes symptoms better/worse
"""
}
```

### Deep Dive Question Generation

```python
def generate_diagnostic_question_prompt(category: str, conversation_history: list, 
                                       user_medical_data: dict) -> str:
    return f"""You are conducting a diagnostic interview for {category} health concerns.

Medical Context:
{format_medical_data(user_medical_data)}

Conversation so far:
{format_conversation(conversation_history)}

Generate the NEXT most diagnostically valuable question. Consider:
1. What information gaps remain for accurate assessment
2. Red flags that need to be ruled out
3. Differential diagnosis requirements
4. Pattern recognition for {category} conditions

The question should:
- Be specific and clear
- Target the most important unknown
- Help differentiate between possible conditions
- Be appropriate for the user's health literacy level

Return JSON:
{{
  "question": "Your diagnostic question",
  "type": "diagnostic|clarifying|severity|timeline",
  "reasoning": "Why this question is important now"
}}
"""
```

## Helper Functions

### Response Parsing

```python
def parse_llm_response(response: str, expected_format: str) -> dict:
    """Safely parse LLM response with fallbacks"""
    try:
        # Try JSON parse first
        return json.loads(response)
    except json.JSONDecodeError:
        # Fallback to regex extraction
        if expected_format == "flash":
            return extract_flash_format(response)
        elif expected_format == "general":
            return extract_general_format(response)
        else:
            raise ValueError(f"Cannot parse response for format: {expected_format}")

def extract_flash_format(text: str) -> dict:
    """Extract flash assessment data from non-JSON response"""
    # Implementation with regex patterns
    urgency_match = re.search(r'urgency["\s:]+(\w+)', text, re.IGNORECASE)
    confidence_match = re.search(r'confidence["\s:]+(\d+)', text, re.IGNORECASE)
    
    return {
        "response": text[:500],  # First 500 chars as response
        "main_concern": "Health concern identified",
        "urgency": urgency_match.group(1) if urgency_match else "medium",
        "confidence": int(confidence_match.group(1)) if confidence_match else 75,
        "next_action": "general-assessment",
        "action_reason": "Further assessment recommended"
    }
```

### Session Management

```python
class DeepDiveSessionManager:
    def __init__(self):
        self.sessions = {}  # In production, use Redis
    
    async def create_session(self, session_id: str, user_id: str, 
                           category: str, form_data: dict) -> None:
        """Initialize a new deep dive session"""
        self.sessions[session_id] = {
            "user_id": user_id,
            "category": category,
            "form_data": form_data,
            "questions": [],
            "answers": [],
            "created_at": datetime.utcnow(),
            "status": "active"
        }
        
        # Also save to database
        await supabase.table("general_deepdive_sessions").insert({
            "id": session_id,
            "user_id": user_id,
            "category": category,
            "initial_form_data": form_data,
            "session_status": "active"
        })
    
    async def update_session(self, session_id: str, question: str, 
                           answer: str, question_number: int) -> None:
        """Update session with new Q&A pair"""
        session = self.sessions.get(session_id)
        if not session:
            # Fetch from database if not in memory
            session = await self.fetch_session_from_db(session_id)
        
        session["questions"].append({
            "number": question_number,
            "question": question,
            "timestamp": datetime.utcnow().isoformat()
        })
        
        session["answers"].append({
            "number": question_number,
            "answer": answer,
            "timestamp": datetime.utcnow().isoformat()
        })
        
        # Update database
        await supabase.table("general_deepdive_sessions").update({
            "questions": session["questions"],
            "answers": session["answers"]
        }).eq("id", session_id)
    
    def should_continue_questions(self, session: dict) -> bool:
        """Determine if more questions are needed"""
        num_questions = len(session["questions"])
        
        # Maximum 5 questions
        if num_questions >= 5:
            return False
        
        # Minimum 3 questions
        if num_questions < 3:
            return True
        
        # Check if we have enough diagnostic confidence
        # This could be more sophisticated in production
        return not self.has_sufficient_information(session)
```

### Utility Functions

```python
def format_medical_data(medical_data: dict) -> str:
    """Format medical data for LLM consumption"""
    if not medical_data:
        return "No medical history available"
    
    sections = []
    
    # Demographics
    demo = medical_data.get('demographics', {})
    if demo:
        sections.append(f"Patient: {demo.get('age', 'Unknown')} year old {demo.get('sex', 'Unknown')}, BMI: {demo.get('bmi', 'Unknown')}")
    
    # Medical history
    med_hist = medical_data.get('medical_history', {})
    if med_hist.get('chronic_conditions'):
        sections.append(f"Conditions: {', '.join(med_hist['chronic_conditions'])}")
    if med_hist.get('current_medications'):
        sections.append(f"Medications: {', '.join(med_hist['current_medications'])}")
    if med_hist.get('allergies'):
        sections.append(f"Allergies: {', '.join(med_hist['allergies'])}")
    
    # Lifestyle
    lifestyle = medical_data.get('lifestyle', {})
    if lifestyle:
        lifestyle_items = []
        if lifestyle.get('smoking'):
            lifestyle_items.append(f"Smoking: {lifestyle['smoking']}")
        if lifestyle.get('exercise'):
            lifestyle_items.append(f"Exercise: {lifestyle['exercise']}")
        if lifestyle_items:
            sections.append(f"Lifestyle: {', '.join(lifestyle_items)}")
    
    return '\n'.join(sections) if sections else "No medical history available"

def calculate_bmi(height_cm: float, weight_kg: float) -> float:
    """Calculate BMI from height and weight"""
    if not height_cm or not weight_kg:
        return None
    height_m = height_cm / 100
    return round(weight_kg / (height_m ** 2), 1)

def format_conversation(conversation: list) -> str:
    """Format Q&A conversation for context"""
    formatted = []
    for i, (q, a) in enumerate(zip(conversation.get('questions', []), 
                                   conversation.get('answers', []))):
        formatted.append(f"Q{i+1}: {q['question']}")
        formatted.append(f"A{i+1}: {a['answer']}")
    return '\n'.join(formatted)
```

## Error Handling

### Comprehensive Error Handler

```python
from fastapi import HTTPException
from fastapi.responses import JSONResponse
import logging

logger = logging.getLogger(__name__)

class HealthAssessmentError(Exception):
    """Base exception for health assessment system"""
    pass

class LLMError(HealthAssessmentError):
    """LLM-related errors"""
    pass

class ValidationError(HealthAssessmentError):
    """Input validation errors"""
    pass

async def health_assessment_exception_handler(request: Request, exc: Exception):
    """Global exception handler for health assessment endpoints"""
    
    # Log the full error
    logger.error(f"Error in {request.url.path}: {exc}", exc_info=True)
    
    # Determine error type and response
    if isinstance(exc, ValidationError):
        return JSONResponse(
            status_code=400,
            content={
                "error": "Invalid input",
                "details": str(exc),
                "status": "error"
            }
        )
    elif isinstance(exc, LLMError):
        return JSONResponse(
            status_code=503,
            content={
                "error": "AI service temporarily unavailable",
                "details": "Please try again in a moment",
                "status": "error"
            }
        )
    elif isinstance(exc, HTTPException):
        return JSONResponse(
            status_code=exc.status_code,
            content={
                "error": exc.detail,
                "status": "error"
            }
        )
    else:
        # Generic error
        return JSONResponse(
            status_code=500,
            content={
                "error": "An unexpected error occurred",
                "details": str(exc) if DEBUG else None,
                "status": "error"
            }
        )

# Endpoint-specific error handling
async def safe_llm_call(prompt: str, model: str, **kwargs):
    """Wrapper for LLM calls with error handling"""
    try:
        response = await call_llm(prompt, model, **kwargs)
        return response
    except Exception as e:
        logger.error(f"LLM call failed: {e}")
        raise LLMError(f"Failed to get AI response: {str(e)}")
```

### Validation Middleware

```python
from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware

class ValidationMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        # Pre-process validation
        if request.method == "POST" and "/api/" in request.url.path:
            try:
                body = await request.body()
                if not body:
                    return JSONResponse(
                        status_code=400,
                        content={"error": "Empty request body", "status": "error"}
                    )
            except Exception:
                return JSONResponse(
                    status_code=400,
                    content={"error": "Invalid request format", "status": "error"}
                )
        
        response = await call_next(request)
        return response
```

## Testing

### Unit Tests

```python
import pytest
from unittest.mock import patch, Mock

@pytest.fixture
def sample_medical_data():
    return {
        "demographics": {"age": 35, "sex": "female", "bmi": 24.5},
        "medical_history": {
            "chronic_conditions": ["asthma"],
            "current_medications": ["albuterol"],
            "allergies": ["penicillin"]
        }
    }

@pytest.mark.asyncio
async def test_flash_assessment_endpoint(sample_medical_data):
    """Test flash assessment endpoint"""
    with patch('fetch_user_medical_data', return_value=sample_medical_data):
        with patch('call_llm', return_value='{"response": "test", "urgency": "medium"}'):
            request_data = {
                "user_query": "I feel tired all the time",
                "user_id": "test-user-123"
            }
            
            response = await flash_assessment(request_data)
            
            assert response["urgency"] == "medium"
            assert "flash_id" in response
            assert response["status"] == "success"

@pytest.mark.asyncio
async def test_category_validation():
    """Test category validation in general assessment"""
    request_data = {
        "category": "invalid_category",
        "form_data": {"symptoms": "test"},
        "user_id": "test-user-123"
    }
    
    with pytest.raises(ValidationError) as exc:
        await general_assessment(request_data)
    
    assert "Invalid category" in str(exc.value)
```

### Integration Tests

```python
@pytest.mark.integration
async def test_complete_deep_dive_flow():
    """Test full deep dive conversation flow"""
    # Start session
    start_response = await client.post("/api/general-deepdive/start", json={
        "category": "mental",
        "form_data": {
            "symptoms": "Anxiety and panic attacks",
            "duration": "3 months",
            "impactLevel": 8
        },
        "user_id": "test-user-123"
    })
    
    assert start_response.status_code == 200
    session_id = start_response.json()["session_id"]
    
    # Answer questions
    for i in range(3):
        continue_response = await client.post("/api/general-deepdive/continue", json={
            "session_id": session_id,
            "answer": f"Test answer {i+1}",
            "question_number": i + 1
        })
        
        assert continue_response.status_code == 200
    
    # Complete analysis
    complete_response = await client.post("/api/general-deepdive/complete", json={
        "session_id": session_id
    })
    
    assert complete_response.status_code == 200
    assert "analysis" in complete_response.json()
    assert complete_response.json()["questions_asked"] >= 3
```

### Load Testing

```python
import asyncio
import aiohttp
import time

async def load_test_flash_assessment(num_requests: int = 100):
    """Load test flash assessment endpoint"""
    async with aiohttp.ClientSession() as session:
        tasks = []
        start_time = time.time()
        
        for i in range(num_requests):
            task = session.post(
                "http://localhost:8000/api/flash-assessment",
                json={
                    "user_query": f"Test query {i}",
                    "user_id": f"test-user-{i}"
                }
            )
            tasks.append(task)
        
        responses = await asyncio.gather(*tasks)
        end_time = time.time()
        
        success_count = sum(1 for r in responses if r.status == 200)
        
        print(f"Completed {num_requests} requests in {end_time - start_time:.2f}s")
        print(f"Success rate: {success_count/num_requests*100:.1f}%")
        print(f"Requests per second: {num_requests/(end_time-start_time):.1f}")
```

## Model Selection

### Recommended Models by Use Case

| Use Case | Model | Reason |
|----------|-------|---------|
| Flash Assessment | `deepseek/deepseek-chat` | Fast, conversational, good for triage |
| General Assessment | `deepseek/deepseek-chat` | Balanced performance and cost |
| Deep Dive Questions | `deepseek/deepseek-r1-distill-llama-70b:free` | Reasoning capability for diagnostic logic |
| Final Analysis | `deepseek/deepseek-r1-distill-llama-70b:free` | Complex reasoning for differential diagnosis |
| Large Context | `google/gemini-2.0-flash-exp:free` | 200k+ token context for extensive history |

### Model Fallback Strategy

```python
MODEL_FALLBACK_CHAIN = {
    "deepseek/deepseek-r1-distill-llama-70b:free": [
        "openai/gpt-4-turbo-preview",
        "anthropic/claude-3-sonnet",
        "google/gemini-pro"
    ],
    "deepseek/deepseek-chat": [
        "openai/gpt-3.5-turbo",
        "anthropic/claude-instant",
        "google/gemini-flash"
    ]
}

async def call_llm_with_fallback(prompt: str, preferred_model: str, **kwargs):
    """Call LLM with automatic fallback"""
    models_to_try = [preferred_model] + MODEL_FALLBACK_CHAIN.get(preferred_model, [])
    
    for model in models_to_try:
        try:
            return await call_llm(prompt, model, **kwargs)
        except Exception as e:
            logger.warning(f"Model {model} failed: {e}")
            if model == models_to_try[-1]:
                raise LLMError("All models failed")
            continue
```

## Integration Notes

### Frontend Integration

The frontend expects these exact response formats. Key integration points:

1. **Flash Assessment**: 
   - `next_steps.recommended_action` must be one of: `'general-assessment' | 'body-scan' | 'see-doctor' | 'monitor'`
   - Frontend routes based on this value

2. **General Assessment**:
   - `possible_causes` must include `likelihood` as a number (0-100)
   - Frontend displays these as percentage bars

3. **Deep Dive**:
   - `ready_for_analysis` triggers the completion flow
   - `is_final_question` shows different UI

### Database Considerations

1. **Timeline Events**: Auto-populate via triggers - don't insert manually
2. **Thread Management**: Deep dive sessions create thread_id for grouping
3. **Soft Deletes**: Never hard delete assessment data
4. **Audit Trail**: All assessments should log user_id and timestamp

### Performance Optimization

1. **Caching**:
   ```python
   from functools import lru_cache
   
   @lru_cache(maxsize=1000)
   async def get_cached_medical_data(user_id: str) -> dict:
       return await fetch_user_medical_data(user_id)
   ```

2. **Connection Pooling**:
   ```python
   # Supabase connection pool
   supabase_pool = ConnectionPool(min_size=5, max_size=20)
   ```

3. **Async Processing**:
   ```python
   # Process multiple operations concurrently
   medical_data, previous_assessments = await asyncio.gather(
       fetch_user_medical_data(user_id),
       fetch_recent_assessments(user_id)
   )
   ```

### Security Considerations

1. **Input Sanitization**: All user inputs must be sanitized
2. **Rate Limiting**: Implement per-user rate limits
3. **Authentication**: Verify user_id matches authenticated user
4. **Data Privacy**: Never log full medical data
5. **Encryption**: Sensitive data should be encrypted at rest

### Monitoring & Logging

```python
import structlog

logger = structlog.get_logger()

# Log assessment metrics
logger.info("assessment_completed", 
    assessment_type="flash",
    user_id=user_id,
    urgency=urgency,
    duration_ms=duration,
    model_used=model
)

# Monitor LLM performance
logger.info("llm_call",
    model=model,
    tokens_used=tokens,
    latency_ms=latency,
    success=success
)
```

## Deployment Checklist

- [ ] Database migrations run successfully
- [ ] Environment variables configured (API keys, URLs)
- [ ] Error tracking configured (Sentry, etc.)
- [ ] Monitoring dashboards set up
- [ ] Rate limiting implemented
- [ ] SSL certificates valid
- [ ] Backup strategy in place
- [ ] Load testing completed
- [ ] Security audit performed
- [ ] Documentation updated

## Support & Maintenance

### Common Issues

1. **Empty LLM Responses**: Check model availability and API limits
2. **Slow Performance**: Review database indexes and connection pooling
3. **High Error Rate**: Check logs for pattern - often indicates API issues
4. **Incorrect Categorization**: Review and update system prompts

### Contact

For backend implementation questions:
- Technical issues: [Backend Team Slack]
- Medical accuracy: [Medical Advisory Team]
- Infrastructure: [DevOps Team]

---

*Last Updated: [Current Date]*
*Version: 1.0*