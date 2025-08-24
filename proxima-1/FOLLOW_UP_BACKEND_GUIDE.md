# Follow-Up System Backend Implementation Guide

## Overview
The follow-up system enables users to track health progression over time by creating follow-up assessments linked to their original assessments. It supports all 4 assessment types:
- Quick Scan (`quick_scans` table)
- Deep Dive (`deep_dive_sessions` table) 
- General Assessment (`general_assessments` table)
- General Deep Dive (`general_deepdive_sessions` table)

## Database Structure
- `follow_ups` - Stores all follow-up assessments (polymorphic references to any assessment type)
- `assessment_chains` - Groups related assessments (tracks assessment type)
- `follow_up_templates` - Question templates
- `progression_snapshots` - Aggregated visualization data
- `follow_up_sessions` - Multi-phase deep dive sessions

## Important: Polymorphic References
Since follow-ups can reference any of the 4 assessment types, we use:
- `original_assessment_id` - UUID of the original assessment
- `original_assessment_type` - Type: 'quick_scan', 'deep_dive', 'general', 'general_deep'

## API Endpoints

### 1. Initialize Follow-Up
**POST** `/api/follow-up/initialize`

Creates or retrieves an assessment chain and generates appropriate follow-up questions.

```python
@app.post("/api/follow-up/initialize")
async def initialize_follow_up(request: FollowUpInitRequest):
    """
    Request Body:
    {
        "original_assessment_id": "uuid",
        "original_assessment_type": "quick_scan|deep_dive|general|general_deep",
        "user_id": "uuid"
    }
    
    Response:
    {
        "chain_id": "uuid",
        "follow_up_number": 2,
        "days_since_original": 7,
        "questions": [
            {"id": "q1", "q": "Have there been any changes since last time?", "type": "change_scale"},
            {"id": "ai_1", "q": "Is the pain in the same location?", "type": "yes_no_explain"},
            {"id": "q2", "q": "What specific changes?", "type": "text", "show_if": "q1 != no_change"},
            {"id": "ai_2", "q": "What time of day is worst?", "type": "text"},
            {"id": "q3", "q": "Have symptoms worsened or gotten better?", "type": "severity_scale"},
            {"id": "q4", "q": "Any new triggers?", "type": "trigger_check"},
            {"id": "ai_3", "q": "Tried anything new for relief?", "type": "text"},
            {"id": "q5", "q": "Seen a doctor?", "type": "medical_check"}
        ],
        "previous_severity": "somewhat_worse",
        "previous_symptoms": ["headache", "fatigue"]
    }
    """
    
    # Check if chain exists for this assessment
    chain = supabase.table("assessment_chains").select("*").eq(
        "initial_assessment_id", request.original_assessment_id
    ).eq(
        "initial_assessment_type", request.original_assessment_type
    ).single().execute()
    
    if not chain.data:
        # Create new chain
        chain = supabase.table("assessment_chains").insert({
            "user_id": request.user_id,
            "initial_assessment_id": request.original_assessment_id,
            "initial_assessment_type": request.original_assessment_type,
            "status": "active",
            "chain_name": f"{request.original_assessment_type} - Started {datetime.now().strftime('%b %Y')}"
        }).execute()
    
    # Get original assessment data based on type
    table_map = {
        "quick_scan": "quick_scans",
        "deep_dive": "deep_dive_sessions",
        "general": "general_assessments",
        "general_deep": "general_deepdive_sessions"
    }
    
    original = supabase.table(table_map[request.original_assessment_type]).select("*").eq(
        "id", request.original_assessment_id
    ).single().execute()
    
    # Count existing follow-ups
    follow_ups = supabase.table("follow_ups").select("id").eq(
        "original_assessment_id", request.original_assessment_id
    ).eq(
        "original_assessment_type", request.original_assessment_type
    ).execute()
    follow_up_count = len(follow_ups.data) if follow_ups.data else 0
    
    # Generate questions based on assessment type
    questions = generate_follow_up_questions(
        assessment_type=request.original_assessment_type,
        body_part=original.data.get("body_part"),  # None for general assessments
        previous_symptoms=extract_symptoms(original.data, request.original_assessment_type),
        follow_up_number=follow_up_count + 1
    )
    
    # Calculate days since original
    original_date = datetime.fromisoformat(original.data["created_at"].replace("Z", "+00:00"))
    days_since = (datetime.now(timezone.utc) - original_date).days
    
    return {
        "chain_id": chain.data["id"],
        "follow_up_number": follow_up_count + 1,
        "days_since_original": days_since,
        "questions": questions,
        "previous_summary": original.data.get("ai_response", {}).get("summary", ""),
        "previous_severity": original.data.get("ai_response", {}).get("severity_score", 5),
        "previous_symptoms": original.data.get("symptoms", [])
    }
```

### 2. Submit Follow-Up (Quick Scan & General)
**POST** `/api/follow-up/submit`

Submits a follow-up for immediate AI analysis (used for Quick Scan and General Assessment).

```python
@app.post("/api/follow-up/submit")
async def submit_follow_up(request: FollowUpSubmitRequest):
    """
    Request Body:
    {
        "chain_id": "uuid",
        "original_assessment_id": "uuid",
        "original_assessment_type": "quick_scan|deep_dive|general|general_deep",
        "user_id": "uuid",
        "form_responses": {
            "severity_score": 6,
            "trend": "somewhat_better",
            "symptoms": ["headache", "mild_fatigue"],
            "changes": "Headache less intense, fatigue improved",
            "actions_taken": "Rest, hydration, medication",
            "new_symptoms": []
        },
        "assessment_type": "quick_scan",
        "body_part": "head"  # Optional, for quick_scan
    }
    
    Response:
    {
        "follow_up_id": "uuid",
        "analysis": {
            "summary": "Your symptoms show improvement...",
            "recommendations": ["Continue current treatment", "Monitor for changes"],
            "warning_signs": ["Sudden worsening", "New symptoms"],
            "next_follow_up": "3 days"
        },
        "trend": "improving",
        "progression_summary": {
            "improvement_percentage": 30,
            "days_tracked": 7,
            "total_follow_ups": 2
        }
    }
    """
    
    # Get original assessment based on type
    table_name = get_table_name(request.original_assessment_type)
    original = supabase.table(table_name).select("*").eq(
        "id", request.original_assessment_id
    ).single().execute()
    
    # Get previous follow-up if exists
    previous = supabase.table("follow_ups").select("*").eq(
        "original_assessment_id", request.original_assessment_id
    ).eq(
        "original_assessment_type", request.original_assessment_type
    ).order("created_at", desc=True).limit(1).execute()
    
    # Calculate temporal metrics
    original_date = datetime.fromisoformat(original.data["created_at"].replace("Z", "+00:00"))
    days_since_original = (datetime.now(timezone.utc) - original_date).days
    
    days_since_previous = None
    if previous.data:
        previous_date = datetime.fromisoformat(previous.data[0]["created_at"].replace("Z", "+00:00"))
        days_since_previous = (datetime.now(timezone.utc) - previous_date).days
    
    # Analyze symptom changes
    current_symptoms = request.form_responses.get("symptoms", [])
    if previous.data:
        previous_symptoms = previous.data[0]["symptoms_current"]
    else:
        previous_symptoms = extract_symptoms(original.data, request.original_assessment_type)
    
    symptoms_added = list(set(current_symptoms) - set(previous_symptoms))
    symptoms_resolved = list(set(previous_symptoms) - set(current_symptoms))
    symptoms_persisting = list(set(current_symptoms) & set(previous_symptoms))
    
    # Generate AI analysis
    ai_prompt = create_follow_up_prompt(
        assessment_type=request.assessment_type,
        original_data=original.data,
        current_responses=request.form_responses,
        symptom_changes={
            "added": symptoms_added,
            "resolved": symptoms_resolved,
            "persisting": symptoms_persisting
        },
        days_since_original=days_since_original
    )
    
    # Select appropriate AI model
    model = "gpt-4" if request.assessment_type in ["quick_scan", "general"] else "gpt-4-turbo"
    ai_response = await analyze_with_ai(ai_prompt, model)
    
    # Calculate overall trend
    if previous.data:
        previous_severity = previous.data[0]["severity_score"]
    else:
        previous_severity = get_severity_score(original.data, request.original_assessment_type)
    
    trend = calculate_trend(
        current_severity=request.form_responses.get("severity_score", 5),
        previous_severity=previous_severity,
        symptom_changes={"added": symptoms_added, "resolved": symptoms_resolved}
    )
    
    # Detect urgency level
    urgency = detect_urgency_level(request.form_responses, ai_response)
    
    # Store follow-up
    follow_up = supabase.table("follow_ups").insert({
        "user_id": request.user_id,
        "original_assessment_id": request.original_assessment_id,
        "original_assessment_type": request.original_assessment_type,
        "previous_follow_up_id": previous.data[0]["id"] if previous.data else None,
        "follow_up_number": (previous.data[0]["follow_up_number"] + 1) if previous.data else 1,
        "days_since_original": days_since_original,
        "days_since_previous": days_since_previous,
        "body_part": request.body_part,
        "form_type": "standard",
        "form_questions": request.questions,
        "form_responses": request.form_responses,
        "overall_trend": trend,
        "severity_score": request.form_responses.get("severity_score", 5),
        "symptoms_current": current_symptoms,
        "symptoms_added": symptoms_added,
        "symptoms_resolved": symptoms_resolved,
        "symptoms_persisting": symptoms_persisting,
        "treatments_tried": request.form_responses.get("treatments", []),
        "ai_response": ai_response,
        "ai_model": model,
        "urgency_level": urgency
    }).execute()
    
    # Update chain statistics
    supabase.table("assessment_chains").update({
        "total_follow_ups": follow_up.data["follow_up_number"],
        "last_follow_up_date": datetime.now(timezone.utc).isoformat(),
        "next_follow_up_suggested": calculate_next_follow_up_date(trend, urgency)
    }).eq("id", request.chain_id).execute()
    
    return {
        "follow_up_id": follow_up.data["id"],
        "analysis": ai_response,
        "trend": trend,
        "urgency_level": urgency,
        "progression_summary": {
            "improvement_percentage": calculate_improvement_percentage(
                original.data.get("ai_response", {}).get("severity_score", 5),
                request.form_responses.get("severity_score", 5)
            ),
            "days_tracked": days_since_original,
            "total_follow_ups": follow_up.data["follow_up_number"]
        }
    }
```

### 3. Start Deep Dive Follow-Up
**POST** `/api/follow-up/deep-dive/start`

Initiates a multi-phase deep dive follow-up session.

```python
@app.post("/api/follow-up/deep-dive/start")
async def start_deep_dive_follow_up(request: DeepDiveFollowUpStartRequest):
    """
    Request Body:
    {
        "chain_id": "uuid",
        "original_assessment_id": "uuid",
        "user_id": "uuid",
        "initial_responses": {
            "severity_score": 6,
            "symptom_changes": "Better overall but new symptom appeared",
            "specific_changes": ["Less intense pain", "New tingling sensation"]
        },
        "assessment_type": "deep_dive",
        "body_part": "head"
    }
    
    Response:
    {
        "session_id": "uuid",
        "next_questions": [
            "You mentioned a new tingling sensation. Can you describe where exactly you feel this?",
            "How often does the tingling occur throughout the day?"
        ],
        "question_number": 4,
        "phase": "adaptive_assessment",
        "total_phases": 4
    }
    """
    
    # Create follow-up session
    session = supabase.table("follow_up_sessions").insert({
        "chain_id": request.chain_id,
        "user_id": request.user_id,
        "assessment_type": request.assessment_type,
        "phase": "initial_assessment",
        "responses_so_far": request.initial_responses,
        "current_question_number": len(request.initial_responses.keys()),
        "status": "active"
    }).execute()
    
    # Get original assessment for context
    original = supabase.table("assessments").select("*").eq(
        "id", request.original_assessment_id
    ).single().execute()
    
    # Analyze initial responses to determine focus areas
    focus_areas = determine_focus_areas(
        initial_responses=request.initial_responses,
        original_symptoms=original.data.get("symptoms", []),
        body_part=request.body_part
    )
    
    # Generate adaptive questions using AI
    adaptive_questions = await generate_adaptive_questions(
        context={
            "original_assessment": original.data,
            "initial_responses": request.initial_responses,
            "focus_areas": focus_areas,
            "assessment_type": request.assessment_type
        },
        num_questions=2 if request.assessment_type == "deep_dive" else 3
    )
    
    # Update session with new phase
    supabase.table("follow_up_sessions").update({
        "phase": "adaptive_assessment",
        "current_question_number": len(request.initial_responses.keys())
    }).eq("id", session.data["id"]).execute()
    
    return {
        "session_id": session.data["id"],
        "next_questions": adaptive_questions,
        "question_number": len(request.initial_responses.keys()) + 1,
        "phase": "adaptive_assessment",
        "total_phases": 4
    }
```

### 4. Continue Deep Dive Follow-Up
**POST** `/api/follow-up/deep-dive/continue`

Continues the multi-phase deep dive follow-up.

```python
@app.post("/api/follow-up/deep-dive/continue")
async def continue_deep_dive_follow_up(request: ContinueRequest):
    """
    Request Body:
    {
        "session_id": "uuid",
        "answer": "The tingling happens mostly in the morning and evening",
        "question_number": 5
    }
    
    Response:
    {
        "next_question": "Have you tried any specific treatments for the tingling?",
        "question_number": 6,
        "phase": "treatment_assessment",
        "is_final": false
    }
    """
    
    # Get session
    session = supabase.table("follow_up_sessions").select("*").eq(
        "id", request.session_id
    ).single().execute()
    
    if not session.data or session.data["status"] != "active":
        raise HTTPException(status_code=400, detail="Invalid or inactive session")
    
    # Store answer
    responses = session.data["responses_so_far"]
    responses[f"q{request.question_number}"] = request.answer
    
    # Determine next phase based on question count and current phase
    current_phase = session.data["phase"]
    next_phase = current_phase
    next_question = None
    
    if current_phase == "adaptive_assessment" and request.question_number >= 6:
        next_phase = "treatment_assessment"
        next_question = get_treatment_questions(session.data["assessment_type"])[0]
    elif current_phase == "treatment_assessment" and request.question_number >= 9:
        next_phase = "functional_assessment"
        next_question = get_functional_questions(session.data["assessment_type"])[0]
    elif current_phase == "functional_assessment" and request.question_number >= 12:
        next_phase = "final"
        next_question = "Is there anything else you'd like to add about your current health status?"
    else:
        # Continue in current phase
        if current_phase == "adaptive_assessment":
            next_question = await generate_next_adaptive_question(session.data, request.answer)
        elif current_phase == "treatment_assessment":
            treatment_questions = get_treatment_questions(session.data["assessment_type"])
            idx = request.question_number - 7  # Adjust for phase offset
            next_question = treatment_questions[idx] if idx < len(treatment_questions) else None
        elif current_phase == "functional_assessment":
            functional_questions = get_functional_questions(session.data["assessment_type"])
            idx = request.question_number - 10  # Adjust for phase offset
            next_question = functional_questions[idx] if idx < len(functional_questions) else None
    
    # Update session
    supabase.table("follow_up_sessions").update({
        "responses_so_far": responses,
        "phase": next_phase,
        "current_question_number": request.question_number,
        "updated_at": datetime.now(timezone.utc).isoformat()
    }).eq("id", request.session_id).execute()
    
    return {
        "next_question": next_question,
        "question_number": request.question_number + 1,
        "phase": next_phase,
        "is_final": next_phase == "final"
    }
```

### 5. Complete Deep Dive Follow-Up
**POST** `/api/follow-up/deep-dive/complete`

Completes the deep dive follow-up and generates comprehensive analysis.

```python
@app.post("/api/follow-up/deep-dive/complete")
async def complete_deep_dive_follow_up(request: CompleteRequest):
    """
    Request Body:
    {
        "session_id": "uuid",
        "final_answer": "No, I think we covered everything important"
    }
    
    Response:
    {
        "follow_up_id": "uuid",
        "analysis": {
            "comprehensive_assessment": "Based on your follow-up...",
            "key_findings": ["Improvement in primary symptoms", "New symptom requires monitoring"],
            "detailed_recommendations": [...],
            "treatment_adjustments": [...],
            "follow_up_schedule": "1 week"
        },
        "progression_report": {
            "overall_trend": "improving",
            "symptom_evolution": {...},
            "treatment_effectiveness": {...}
        }
    }
    """
    
    # Get session with all responses
    session = supabase.table("follow_up_sessions").select("*").eq(
        "id", request.session_id
    ).single().execute()
    
    # Add final answer
    all_responses = session.data["responses_so_far"]
    all_responses["final"] = request.final_answer
    
    # Get chain and original assessment
    chain = supabase.table("assessment_chains").select("*").eq(
        "id", session.data["chain_id"]
    ).single().execute()
    
    original = supabase.table("assessments").select("*").eq(
        "id", chain.data["initial_assessment_id"]
    ).single().execute()
    
    # Get all previous follow-ups
    previous_follow_ups = supabase.table("follow_ups").select("*").eq(
        "original_assessment_id", chain.data["initial_assessment_id"]
    ).order("created_at").execute()
    
    # Generate comprehensive deep analysis
    analysis_prompt = create_deep_analysis_prompt(
        all_responses=all_responses,
        original_assessment=original.data,
        previous_follow_ups=previous_follow_ups.data,
        assessment_type=session.data["assessment_type"]
    )
    
    # Use advanced model for deep analysis
    model = "o1-preview" if session.data["assessment_type"] == "deep_dive" else "claude-3-opus"
    comprehensive_analysis = await analyze_with_advanced_model(analysis_prompt, model)
    
    # Extract structured data from responses
    structured_data = extract_structured_follow_up_data(all_responses)
    
    # Calculate metrics
    days_since_original = (datetime.now(timezone.utc) - datetime.fromisoformat(
        original.data["created_at"].replace("Z", "+00:00")
    )).days
    
    # Create follow-up record
    follow_up = supabase.table("follow_ups").insert({
        "user_id": session.data["user_id"],
        "original_assessment_id": chain.data["initial_assessment_id"],
        "previous_follow_up_id": previous_follow_ups.data[-1]["id"] if previous_follow_ups.data else None,
        "follow_up_number": len(previous_follow_ups.data) + 1,
        "days_since_original": days_since_original,
        "days_since_previous": calculate_days_since_previous(previous_follow_ups.data),
        "body_part": original.data.get("body_part"),
        "form_type": "deep_dive",
        "form_questions": extract_questions_from_session(session.data),
        "form_responses": all_responses,
        "overall_trend": structured_data["trend"],
        "severity_score": structured_data["severity_score"],
        "symptoms_current": structured_data["current_symptoms"],
        "symptoms_added": structured_data["symptoms_added"],
        "symptoms_resolved": structured_data["symptoms_resolved"],
        "symptoms_persisting": structured_data["symptoms_persisting"],
        "treatments_tried": structured_data["treatments"],
        "treatment_effectiveness": structured_data["treatment_effectiveness"],
        "ai_response": comprehensive_analysis,
        "ai_model": model,
        "urgency_level": detect_urgency_level(all_responses, comprehensive_analysis)
    }).execute()
    
    # Update session status
    supabase.table("follow_up_sessions").update({
        "status": "completed",
        "completed_at": datetime.now(timezone.utc).isoformat()
    }).eq("id", request.session_id).execute()
    
    # Update chain
    supabase.table("assessment_chains").update({
        "total_follow_ups": follow_up.data["follow_up_number"],
        "last_follow_up_date": datetime.now(timezone.utc).isoformat(),
        "next_follow_up_suggested": calculate_next_deep_follow_up(
            structured_data["trend"],
            comprehensive_analysis
        )
    }).eq("id", session.data["chain_id"]).execute()
    
    # Generate progression report
    progression_report = generate_progression_report(
        chain_id=session.data["chain_id"],
        original=original.data,
        follow_ups=[*previous_follow_ups.data, follow_up.data]
    )
    
    return {
        "follow_up_id": follow_up.data["id"],
        "analysis": comprehensive_analysis,
        "progression_report": progression_report
    }
```

### 6. Get Progression Timeline
**GET** `/api/follow-up/timeline/{chain_id}`

Returns complete progression timeline for visualization.

```python
@app.get("/api/follow-up/timeline/{chain_id}")
async def get_progression_timeline(chain_id: str, user_id: str = Depends(get_current_user)):
    """
    Response:
    {
        "chain_id": "uuid",
        "chain_name": "Headache tracking - Started Jan 2024",
        "status": "active",
        "initial_assessment": {
            "id": "uuid",
            "created_at": "2024-01-15T10:00:00Z",
            "body_part": "head",
            "symptoms": ["headache", "nausea"],
            "severity_score": 7
        },
        "follow_ups": [
            {
                "id": "uuid",
                "follow_up_number": 1,
                "created_at": "2024-01-18T10:00:00Z",
                "days_since_original": 3,
                "severity_score": 5,
                "overall_trend": "somewhat_better"
            }
        ],
        "metrics": {
            "overall_trend": "improving",
            "improvement_percentage": 35,
            "days_tracked": 28,
            "total_assessments": 5,
            "average_severity": 5.2
        },
        "visualization_data": {
            "severity_over_time": [
                {"date": "2024-01-15", "severity": 7, "type": "initial"},
                {"date": "2024-01-18", "severity": 5, "type": "follow_up"}
            ],
            "symptom_evolution": {
                "resolved": ["nausea"],
                "persisting": ["headache"],
                "new": ["fatigue"]
            },
            "treatment_effectiveness": {
                "medication": 4,
                "rest": 3,
                "hydration": 5
            }
        }
    }
    """
    
    # Get chain
    chain = supabase.table("assessment_chains").select("*").eq(
        "id", chain_id
    ).eq("user_id", user_id).single().execute()
    
    if not chain.data:
        raise HTTPException(status_code=404, detail="Chain not found")
    
    # Get initial assessment
    initial = supabase.table("assessments").select("*").eq(
        "id", chain.data["initial_assessment_id"]
    ).single().execute()
    
    # Get all follow-ups
    follow_ups = supabase.table("follow_ups").select("*").eq(
        "original_assessment_id", chain.data["initial_assessment_id"]
    ).order("created_at").execute()
    
    # Calculate metrics
    metrics = calculate_chain_metrics(initial.data, follow_ups.data)
    
    # Generate visualization data
    viz_data = {
        "severity_over_time": create_severity_timeline(initial.data, follow_ups.data),
        "symptom_evolution": track_symptom_evolution(initial.data, follow_ups.data),
        "treatment_effectiveness": analyze_treatment_effectiveness(follow_ups.data)
    }
    
    return {
        "chain_id": chain_id,
        "chain_name": chain.data["chain_name"],
        "status": chain.data["status"],
        "initial_assessment": {
            "id": initial.data["id"],
            "created_at": initial.data["created_at"],
            "body_part": initial.data.get("body_part"),
            "symptoms": initial.data.get("symptoms", []),
            "severity_score": initial.data.get("ai_response", {}).get("severity_score", 5)
        },
        "follow_ups": [format_follow_up_summary(f) for f in follow_ups.data],
        "metrics": metrics,
        "visualization_data": viz_data
    }
```

## Helper Functions

### Extract Data from Different Assessment Types
```python
def extract_symptoms(assessment_data: dict, assessment_type: str):
    """
    Extracts symptoms from different assessment types.
    """
    if assessment_type == "quick_scan":
        return assessment_data.get("symptoms", [])
    elif assessment_type == "deep_dive":
        return assessment_data.get("final_analysis", {}).get("symptoms", [])
    elif assessment_type == "general":
        return assessment_data.get("form_data", {}).get("symptoms", [])
    elif assessment_type == "general_deep":
        return assessment_data.get("key_findings", [])
    return []

def get_severity_score(assessment_data: dict, assessment_type: str):
    """
    Extracts severity score from different assessment types.
    """
    if assessment_type == "quick_scan":
        return assessment_data.get("ai_response", {}).get("severity_score", 5)
    elif assessment_type == "deep_dive":
        return assessment_data.get("final_analysis", {}).get("severity_score", 5)
    elif assessment_type == "general":
        return assessment_data.get("analysis_result", {}).get("severity_score", 5)
    elif assessment_type == "general_deep":
        return assessment_data.get("final_analysis", {}).get("severity_score", 5)
    return 5

def get_table_name(assessment_type: str):
    """
    Returns the correct table name for the assessment type.
    """
    table_map = {
        "quick_scan": "quick_scans",
        "deep_dive": "deep_dive_sessions",
        "general": "general_assessments",
        "general_deep": "general_deepdive_sessions"
    }
    return table_map.get(assessment_type)
```

### Generate Follow-Up Questions
```python
def generate_follow_up_questions(assessment_id: str, assessment_type: str, 
                                condition_context: str = None):
    """
    Generates the final 8-question follow-up (5 base + 3 AI interspersed).
    Same for all assessment types.
    
    Returns: 8 questions in this exact order:
    1. Have there been any changes?
    2. [AI Question 1 - Condition-specific]
    3. What specific changes? (conditional)
    4. [AI Question 2 - Response-based]
    5. Have symptoms worsened or gotten better in severity?
    6. Have you identified new triggers?
    7. [AI Question 3 - Progression-based]
    8. Have you seen a doctor? (triggers modal if yes)
    """
    
    # Use database function to build complete question set
    questions_json = supabase.rpc('build_follow_up_questions', {
        'p_assessment_id': assessment_id,
        'p_assessment_type': assessment_type,
        'p_condition_context': condition_context  # e.g., 'headache', 'chest pain', etc.
    }).execute()
    
    return questions_json.data  # Always returns exactly 8 questions

# Question Types (Simplified):
QUESTION_TYPES = {
    "change_scale": "5-option scale: Much better to Much worse",
    "text": "Free text input",
    "severity_scale": "5-option severity: Much worse to Much better",
    "trigger_check": "Yes/No/Not sure with optional text",
    "medical_check": "Yes/No - Yes triggers modal",
    "select": "Single choice from options",
    "yes_no_explain": "Yes/No with explanation field"
}

# Medical Modal Fields:
MEDICAL_MODAL = {
    "provider": "Primary/Specialist/Urgent/ER/Telehealth",
    "assessment": "What was their assessment? (text)",
    "treatments": "Did they start you on treatments? (text)",
    "follow_up": "When to follow up? (text, optional)"
}

def calculate_trend(current_severity: int, previous_severity: int, symptom_changes: dict):
    """
    Calculates overall trend based on severity and symptom changes.
    """
    severity_change = previous_severity - current_severity
    symptom_score = len(symptom_changes["resolved"]) - len(symptom_changes["added"])
    
    # Weight severity change more heavily
    combined_score = (severity_change * 2) + symptom_score
    
    if combined_score >= 4:
        return "much_better"
    elif combined_score >= 2:
        return "somewhat_better"
    elif combined_score <= -4:
        return "much_worse"
    elif combined_score <= -2:
        return "somewhat_worse"
    else:
        return "stable"

def detect_urgency_level(responses: dict, ai_analysis: dict):
    """
    Detects urgency level based on responses and AI analysis.
    """
    red_flag_keywords = [
        "chest pain", "difficulty breathing", "severe headache",
        "loss of consciousness", "severe bleeding", "suicidal",
        "numbness", "paralysis", "vision loss"
    ]
    
    # Check responses for red flags
    response_text = " ".join(str(v) for v in responses.values()).lower()
    
    for keyword in red_flag_keywords:
        if keyword in response_text:
            return "urgent"
    
    # Check AI analysis for concerns
    if ai_analysis.get("urgency") == "high":
        return "urgent"
    
    # Check severity score
    severity = responses.get("severity_score", 5)
    if severity >= 8:
        return "soon"
    elif severity >= 6:
        return "routine"
    
    return "routine"

def calculate_next_follow_up_date(trend: str, urgency: str):
    """
    Suggests next follow-up date based on trend and urgency.
    """
    if urgency == "urgent":
        return (datetime.now(timezone.utc) + timedelta(days=1)).isoformat()
    elif urgency == "soon":
        return (datetime.now(timezone.utc) + timedelta(days=3)).isoformat()
    elif trend == "much_worse":
        return (datetime.now(timezone.utc) + timedelta(days=2)).isoformat()
    elif trend == "somewhat_worse":
        return (datetime.now(timezone.utc) + timedelta(days=5)).isoformat()
    elif trend in ["much_better", "somewhat_better"]:
        return (datetime.now(timezone.utc) + timedelta(weeks=2)).isoformat()
    else:  # stable
        return (datetime.now(timezone.utc) + timedelta(weeks=1)).isoformat()
```

## Testing Endpoints

```bash
# 1. Initialize follow-up
curl -X POST http://localhost:8000/api/follow-up/initialize \
  -H "Content-Type: application/json" \
  -d '{
    "original_assessment_id": "test-assessment-id",
    "user_id": "test-user-id",
    "assessment_type": "quick_scan"
  }'

# 2. Submit quick scan follow-up
curl -X POST http://localhost:8000/api/follow-up/submit \
  -H "Content-Type: application/json" \
  -d '{
    "chain_id": "test-chain-id",
    "original_assessment_id": "test-assessment-id",
    "user_id": "test-user-id",
    "form_responses": {
      "severity_score": 6,
      "trend": "somewhat_better",
      "symptoms": ["headache"],
      "changes": "Feeling better overall"
    },
    "assessment_type": "quick_scan",
    "body_part": "head"
  }'

# 3. Start deep dive follow-up
curl -X POST http://localhost:8000/api/follow-up/deep-dive/start \
  -H "Content-Type: application/json" \
  -d '{
    "chain_id": "test-chain-id",
    "original_assessment_id": "test-assessment-id",
    "user_id": "test-user-id",
    "initial_responses": {
      "severity_score": 6,
      "symptom_changes": "Better but new symptom"
    },
    "assessment_type": "deep_dive",
    "body_part": "head"
  }'

# 4. Get progression timeline
curl -X GET "http://localhost:8000/api/follow-up/timeline/test-chain-id?user_id=test-user-id"
```

## Implementation Checklist

- [ ] Database migration executed successfully
- [ ] Initialize endpoint creates/retrieves chains
- [ ] Submit endpoint handles Quick Scan and General assessments
- [ ] Deep Dive start endpoint creates sessions
- [ ] Deep Dive continue endpoint manages phases
- [ ] Deep Dive complete endpoint generates analysis
- [ ] Timeline endpoint returns visualization data
- [ ] Question generation adapts to assessment type
- [ ] Trend calculation works correctly
- [ ] Urgency detection triggers appropriately
- [ ] AI models selected based on assessment type
- [ ] RLS policies enforce user access control
- [ ] Error handling for edge cases
- [ ] Logging for debugging
- [ ] Performance optimization for queries