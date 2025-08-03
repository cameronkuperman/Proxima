# Backend Implementation Guide: General Assessment System

## Overview

This guide provides complete implementation details for adding General Assessment endpoints to the existing MCP backend. The system supports three assessment types:
- **Flash Assessment**: Quick triage from free text
- **General Assessment**: Structured category-based analysis  
- **General Deep Dive**: Multi-step conversational diagnosis

## System Architecture

```
Frontend → API Endpoints → System Prompts (with user medical data) → LLM → Response Processing → Database → Timeline Events
```

## Database Setup

Run the migration file `/migrations/create_general_assessment_tables.sql` to create:
- `flash_assessments`
- `general_assessments`
- `general_deepdive_sessions`
- `timeline_events` (with auto-population triggers)

## API Endpoints Implementation

### 1. Flash Assessment Endpoint

```python
@app.post("/api/flash-assessment")
async def flash_assessment(request: Request):
    data = await request.json()
    user_query = data.get("user_query")
    user_id = data.get("user_id")
    
    # Fetch user medical data if user_id provided
    user_medical_data = {}
    if user_id:
        user_medical_data = await fetch_user_medical_data(user_id)
    
    # Build system prompt
    system_prompt = f"""You are a compassionate health triage assistant performing initial assessment.
    
User Medical Context:
{format_medical_data(user_medical_data)}

Your task:
1. Listen to the user's concern
2. Identify the main health issue
3. Assess urgency (low/medium/high/emergency)
4. Recommend the most appropriate next step
5. Be warm and conversational, not clinical

Response format:
- Provide a conversational response (1-2 paragraphs)
- Extract the main concern clearly
- Assess urgency appropriately
- Suggest ONE clear next action

User says: {user_query}"""

    # Call LLM
    llm_response = await call_llm(
        system_prompt=system_prompt,
        model="deepseek/deepseek-chat",
        temperature=0.7,
        response_format={"type": "json_object"}
    )
    
    # Parse response
    parsed = parse_flash_response(llm_response)
    
    # Save to database
    flash_id = await save_flash_assessment(
        user_id=user_id,
        user_query=user_query,
        ai_response=parsed["response"],
        main_concern=parsed["main_concern"],
        urgency=parsed["urgency"],
        confidence_score=parsed["confidence"],
        suggested_next_action=parsed["next_action"]
    )
    
    return {
        "flash_id": flash_id,
        "response": parsed["response"],
        "main_concern": parsed["main_concern"],
        "urgency": parsed["urgency"],
        "confidence": parsed["confidence"],
        "next_steps": {
            "recommended_action": parsed["next_action"],
            "reason": parsed["action_reason"]
        }
    }
```

### 2. General Assessment Endpoint

```python
@app.post("/api/general-assessment")
async def general_assessment(request: Request):
    data = await request.json()
    category = data.get("category")
    form_data = data.get("form_data")
    user_id = data.get("user_id")
    
    # Fetch user medical data
    user_medical_data = {}
    if user_id:
        user_medical_data = await fetch_user_medical_data(user_id)
    
    # Build category-specific system prompt
    system_prompt = build_general_assessment_prompt(
        category=category,
        user_medical_data=user_medical_data
    )
    
    # Format form data for analysis
    symptoms_context = format_form_data(form_data, category)
    
    # Call LLM with structured analysis request
    analysis_prompt = f"""{system_prompt}

Patient presents with the following in the {category} category:
{symptoms_context}

Provide a comprehensive analysis including:
1. Primary assessment of the condition
2. Key findings from the provided information
3. Possible causes with likelihood percentages
4. Specific recommendations
5. Follow-up questions that would help clarify the diagnosis"""

    llm_response = await call_llm(
        system_prompt=analysis_prompt,
        model="deepseek/deepseek-chat",
        temperature=0.6,
        response_format={"type": "json_object"}
    )
    
    # Parse and structure response
    analysis = parse_general_assessment(llm_response)
    
    # Save to database
    assessment_id = await save_general_assessment(
        user_id=user_id,
        category=category,
        form_data=form_data,
        analysis_result=analysis,
        primary_assessment=analysis["primary_assessment"],
        confidence_score=analysis["confidence"],
        urgency_level=analysis["urgency"]
    )
    
    return {
        "assessment_id": assessment_id,
        "analysis": analysis
    }
```

### 3. General Deep Dive Endpoints

```python
@app.post("/api/general-deepdive/start")
async def start_general_deepdive(request: Request):
    data = await request.json()
    category = data.get("category")
    form_data = data.get("form_data")
    user_id = data.get("user_id")
    
    # Initialize session
    session_id = str(uuid.uuid4())
    
    # Fetch user medical data
    user_medical_data = {}
    if user_id:
        user_medical_data = await fetch_user_medical_data(user_id)
    
    # Create initial context
    initial_context = {
        "category": category,
        "form_data": form_data,
        "user_medical_data": user_medical_data,
        "questions_asked": [],
        "answers_received": []
    }
    
    # Generate first diagnostic question
    first_question_prompt = f"""You are conducting a deep diagnostic interview for {category} health concerns.

Medical Context:
{format_medical_data(user_medical_data)}

Initial Complaint:
{format_form_data(form_data, category)}

Generate the MOST IMPORTANT first diagnostic question to ask. This should be the question that will most help differentiate between possible conditions.

Focus on {category}-specific diagnostic criteria."""

    question_response = await call_llm(
        system_prompt=first_question_prompt,
        model="deepseek/deepseek-r1-distill-llama-70b:free",
        temperature=0.5
    )
    
    # Save session
    await create_deepdive_session(
        session_id=session_id,
        user_id=user_id,
        category=category,
        form_data=form_data,
        initial_question=question_response["question"],
        internal_state=initial_context
    )
    
    return {
        "session_id": session_id,
        "question": question_response["question"],
        "question_number": 1,
        "estimated_questions": "3-5",
        "question_type": question_response.get("type", "diagnostic"),
        "status": "success"
    }

@app.post("/api/general-deepdive/continue")
async def continue_general_deepdive(request: Request):
    data = await request.json()
    session_id = data.get("session_id")
    answer = data.get("answer")
    question_number = data.get("question_number")
    
    # Fetch session
    session = await get_deepdive_session(session_id)
    
    # Update session with answer
    session["answers_received"].append({
        "question_number": question_number,
        "answer": answer
    })
    
    # Determine if we need more questions
    if question_number >= 5 or await has_sufficient_confidence(session):
        return {
            "ready_for_analysis": True,
            "questions_completed": question_number,
            "status": "success"
        }
    
    # Generate next question based on all context
    next_question = await generate_next_question(
        session=session,
        category=session["category"],
        previous_answers=session["answers_received"]
    )
    
    # Update session
    await update_deepdive_session(
        session_id=session_id,
        new_question=next_question,
        answer=answer
    )
    
    return {
        "question": next_question["question"],
        "question_number": question_number + 1,
        "is_final_question": question_number >= 4,
        "status": "success"
    }

@app.post("/api/general-deepdive/complete")
async def complete_general_deepdive(request: Request):
    data = await request.json()
    session_id = data.get("session_id")
    final_answer = data.get("final_answer")
    
    # Fetch complete session
    session = await get_deepdive_session(session_id)
    
    if final_answer:
        session["answers_received"].append({
            "question_number": len(session["questions"]) + 1,
            "answer": final_answer
        })
    
    # Generate comprehensive analysis
    final_analysis_prompt = f"""Based on this deep dive diagnostic session for {session['category']} concerns:

Initial Presentation:
{format_form_data(session['form_data'], session['category'])}

Diagnostic Conversation:
{format_qa_session(session['questions'], session['answers_received'])}

Medical Context:
{format_medical_data(session['user_medical_data'])}

Provide a comprehensive final analysis with:
1. Primary diagnosis/assessment with confidence score
2. Key findings that led to this conclusion
3. Differential diagnoses with probabilities
4. Specific recommendations
5. Red flags to watch for
6. Your clinical reasoning process"""

    analysis = await call_llm(
        system_prompt=final_analysis_prompt,
        model="deepseek/deepseek-r1-distill-llama-70b:free",
        temperature=0.4,
        response_format={"type": "json_object"}
    )
    
    # Calculate session duration
    session_duration_ms = calculate_duration(session["created_at"])
    
    # Update session with final analysis
    await finalize_deepdive_session(
        session_id=session_id,
        final_analysis=analysis,
        session_duration_ms=session_duration_ms
    )
    
    return {
        "deep_dive_id": session_id,
        "analysis": analysis["analysis"],
        "category": session["category"],
        "confidence": analysis["confidence"],
        "questions_asked": len(session["questions"]),
        "session_duration_ms": session_duration_ms,
        "reasoning_snippets": analysis.get("reasoning_snippets", []),
        "status": "success"
    }
```

## System Prompts by Category

### Energy & Fatigue
```python
ENERGY_PROMPT = """You are analyzing energy and fatigue concerns. Consider:
- Circadian rhythm disruptions
- Sleep quality vs quantity
- Nutritional deficiencies (B12, iron, vitamin D)
- Thyroid and hormonal issues
- Chronic fatigue syndrome patterns
- Post-viral fatigue
- Medication side effects from user's current meds: {medications}
"""
```

### Mental Health
```python
MENTAL_PROMPT = """You are analyzing mental health concerns. Consider:
- Mood disorders (depression, bipolar)
- Anxiety disorders
- Stress-related conditions
- Trauma responses
- Medication interactions from: {medications}
- Sleep-mood connections
- Cognitive symptoms vs emotional symptoms
Note: Be supportive and non-judgmental in all responses.
"""
```

### Feeling Sick
```python
SICK_PROMPT = """You are analyzing acute illness symptoms. Consider:
- Infectious vs non-infectious causes
- Symptom progression timeline
- Contagion risk
- Dehydration signs
- When to seek immediate care
- User's chronic conditions that may complicate: {conditions}
"""
```

### Physical Pain/Injury
```python
PHYSICAL_PROMPT = """You are analyzing physical pain, injuries, and body-specific symptoms. Consider:
- Location specificity and radiation patterns
- Pain characteristics (sharp, dull, burning, throbbing, aching)
- Onset mechanism (injury, gradual, sudden)
- Movement vs rest patterns (worse with activity, better with rest, etc.)
- Associated symptoms (swelling, redness, numbness, weakness)
- Functional impact on daily activities
- Previous similar episodes
- User's activity level and occupation from: {medical_context}

Red flags requiring urgent evaluation:
- Chest pain with shortness of breath or arm/jaw radiation
- Severe abdominal pain with rigidity or fever
- Head injury with confusion or vision changes
- New onset weakness or numbness
- Severe pain with inability to bear weight
- Signs of infection (fever, red streaks, warmth)
"""
```

### Medication Side Effects
```python
MEDICATION_PROMPT = """You are analyzing potential medication side effects. Consider:
- User's current medications: {medications}
- Drug interactions
- Timing of symptoms vs medication schedule
- Dose-dependent effects
- Alternative medications
- When to contact prescriber
"""
```

### Multiple Issues
```python
MULTIPLE_PROMPT = """You are analyzing multiple concurrent health issues. Consider:
- Systemic conditions that cause multiple symptoms
- Medication cascades
- Stress/anxiety manifesting physically
- Autoimmune conditions
- Whether symptoms are related or separate
- Priority of addressing each issue
"""
```

### Unsure
```python
UNSURE_PROMPT = """You are helping someone who isn't sure what's wrong. Consider:
- Vague or non-specific symptoms
- Somatization of stress/anxiety
- Early-stage conditions
- Need for basic health screening
- Importance of validation and support
- Gentle guidance toward appropriate care
"""
```

## Helper Functions

```python
async def fetch_user_medical_data(user_id: str) -> dict:
    """Fetch user's medical data from Supabase"""
    medical_data = await supabase.table("medical").select("*").eq("id", user_id).single()
    
    return {
        "age": medical_data.get("age"),
        "gender": "male" if medical_data.get("is_male") else "female",
        "height": medical_data.get("height"),
        "weight": medical_data.get("weight"),
        "blood_type": medical_data.get("blood_type"),
        "chronic_conditions": medical_data.get("chronic_conditions", []),
        "current_medications": medical_data.get("current_medications", []),
        "allergies": medical_data.get("allergies", []),
        "family_history": medical_data.get("family_history", []),
        "surgical_history": medical_data.get("surgical_history", []),
        "lifestyle": {
            "smoking": medical_data.get("smoking_status"),
            "alcohol": medical_data.get("alcohol_use"),
            "exercise": medical_data.get("exercise_frequency"),
            "diet": medical_data.get("diet_type")
        }
    }

def format_medical_data(medical_data: dict) -> str:
    """Format medical data for LLM context"""
    if not medical_data:
        return "No medical history available"
    
    return f"""
Age: {medical_data.get('age', 'Unknown')}
Gender: {medical_data.get('gender', 'Unknown')}
BMI: {calculate_bmi(medical_data.get('height'), medical_data.get('weight'))}
Chronic Conditions: {', '.join(medical_data.get('chronic_conditions', [])) or 'None'}
Current Medications: {', '.join(medical_data.get('current_medications', [])) or 'None'}
Allergies: {', '.join(medical_data.get('allergies', [])) or 'None'}
Relevant Family History: {', '.join(medical_data.get('family_history', [])) or 'None'}
"""

def format_form_data(form_data: dict, category: str) -> str:
    """Format form data based on category"""
    base_info = f"""
Primary Symptoms: {form_data.get('symptoms')}
Duration: {form_data.get('duration')}
Impact Level: {form_data.get('impactLevel')}/10
Aggravating Factors: {', '.join(form_data.get('aggravatingFactors', []))}
Tried Interventions: {', '.join(form_data.get('triedInterventions', []))}
"""
    
    # Add category-specific fields
    if category == 'energy':
        base_info += f"""
Energy Pattern: {form_data.get('energyPattern')}
Sleep Hours: {form_data.get('sleepHours')}
Wake Feeling: {form_data.get('wakingUpFeeling')}
"""
    elif category == 'mental':
        base_info += f"""
Mood Pattern: {form_data.get('moodPattern')}
Triggers: {form_data.get('triggerEvents')}
Concentration: {form_data.get('concentrationLevel')}/10
"""
    elif category == 'sick':
        base_info += f"""
Temperature Feeling: {form_data.get('temperatureFeeling')}
Symptom Progression: {form_data.get('symptomProgression')}
Contagious Exposure: {'Yes' if form_data.get('contagiousExposure') else 'No'}
"""
    elif category == 'physical':
        base_info += f"""
Body Region: {form_data.get('bodyRegion')}
Issue Type: {form_data.get('issueType')}
Occurrence Pattern: {form_data.get('occurrencePattern')}
Affected Side: {form_data.get('affectedSide', 'Not specified')}
Radiating Pain: {'Yes' if form_data.get('radiatingPain') else 'No'}
Specific Movements: {form_data.get('specificMovements', 'None noted')}
"""
    elif category == 'medication':
        base_info += f"""
Symptom Timing: {form_data.get('symptomTiming')}
Recent Dose Changes: {'Yes' if form_data.get('doseChanges') else 'No'}
Time Since Started: {form_data.get('timeSinceStarted')}
"""
    elif category == 'multiple':
        base_info += f"""
Primary Concern: {form_data.get('primaryConcern')}
Secondary Concerns: {', '.join(form_data.get('secondaryConcerns', []))}
Symptom Connection: {form_data.get('symptomConnection')}
"""
    elif category == 'unsure':
        base_info += f"""
Current Activity: {form_data.get('currentActivity')}
Recent Changes: {form_data.get('recentChanges')}
"""
    
    # Add optional body location for all categories
    if form_data.get('bodyLocation'):
        location_info = form_data['bodyLocation']
        if location_info.get('regions'):
            base_info += f"""
Body Locations Affected: {', '.join(location_info['regions'])}
Location Description: {location_info.get('description', 'Not provided')}
"""
    
    return base_info
```

## Response Parsing

```python
def parse_flash_response(llm_response: str) -> dict:
    """Parse Flash Assessment LLM response"""
    # If using JSON mode
    data = json.loads(llm_response)
    
    # Extract next action
    recommended_actions = ['general-assessment', 'body-scan', 'see-doctor', 'monitor']
    next_action = data.get('next_action', 'general-assessment')
    if next_action not in recommended_actions:
        next_action = 'general-assessment'
    
    return {
        "response": data.get("response", ""),
        "main_concern": data.get("main_concern", ""),
        "urgency": data.get("urgency", "medium"),
        "confidence": data.get("confidence", 70),
        "next_action": next_action,
        "action_reason": data.get("action_reason", "")
    }

def parse_general_assessment(llm_response: str) -> dict:
    """Parse General Assessment response"""
    data = json.loads(llm_response)
    
    # Ensure all required fields
    return {
        "primary_assessment": data.get("primary_assessment"),
        "confidence": data.get("confidence", 75),
        "key_findings": data.get("key_findings", []),
        "possible_causes": data.get("possible_causes", []),
        "recommendations": data.get("recommendations", []),
        "urgency": data.get("urgency", "medium"),
        "follow_up_questions": data.get("follow_up_questions", [])
    }
```

## Error Handling

```python
@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled exception: {exc}")
    return JSONResponse(
        status_code=500,
        content={
            "error": "An internal error occurred",
            "status": "error",
            "detail": str(exc) if DEBUG else None
        }
    )
```

## Testing Endpoints

```bash
# Flash Assessment
curl -X POST http://localhost:8000/api/flash-assessment \
  -H "Content-Type: application/json" \
  -d '{
    "user_query": "I've been feeling exhausted all the time",
    "user_id": "123e4567-e89b-12d3-a456-426614174000"
  }'

# General Assessment
curl -X POST http://localhost:8000/api/general-assessment \
  -H "Content-Type: application/json" \
  -d '{
    "category": "energy",
    "form_data": {
      "symptoms": "Constant fatigue, brain fog",
      "duration": "2 weeks",
      "impactLevel": 8,
      "energyPattern": "All day",
      "sleepHours": "8-9",
      "wakingUpFeeling": "Exhausted"
    },
    "user_id": "123e4567-e89b-12d3-a456-426614174000"
  }'

# Physical Assessment
curl -X POST http://localhost:8000/api/general-assessment \
  -H "Content-Type: application/json" \
  -d '{
    "category": "physical",
    "form_data": {
      "symptoms": "Sharp pain in lower back when bending",
      "duration": "3 days",
      "impactLevel": 7,
      "bodyRegion": "back",
      "issueType": "pain",
      "occurrencePattern": "With movement",
      "aggravatingFactors": ["Physical activity", "Poor sleep"],
      "triedInterventions": ["Rest", "Over-the-counter meds"],
      "bodyLocation": {
        "regions": ["back", "legs"],
        "description": "Lower back pain radiating to left leg"
      }
    },
    "user_id": "123e4567-e89b-12d3-a456-426614174000"
  }'
```

## Important Notes

1. **Always fetch user medical data** - The system prompts need this context
2. **Use appropriate models** - Flash/General use standard models, Deep Dive uses reasoning models
3. **Respect urgency levels** - Emergency should trigger immediate action recommendations
4. **Category-specific logic** - Each category has unique diagnostic considerations
5. **Timeline events** - Will auto-populate via database triggers
6. **Error handling** - Always return structured errors with status: "error"

## Model Recommendations

- **Flash Assessment**: `deepseek/deepseek-chat` (fast, conversational)
- **General Assessment**: `deepseek/deepseek-chat` (balanced)
- **Deep Dive**: `deepseek/deepseek-r1-distill-llama-70b:free` (reasoning)
- **Large Context**: `google/gemini-2.0-flash-exp:free` (200k+ tokens)