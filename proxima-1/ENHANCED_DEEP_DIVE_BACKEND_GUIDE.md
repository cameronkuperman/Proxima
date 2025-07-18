# Enhanced Deep Dive Backend Implementation Guide

## Overview
This guide details the backend implementation for two new Deep Dive features:
1. **Think Harder**: Advanced AI reasoning using premium models for complex cases
2. **Ask Me More**: Continue questioning until 90%+ diagnostic confidence

## API Endpoints Required

### 1. Think Harder Endpoint

**Endpoint**: `POST /api/deep-dive/think-harder`

**Purpose**: Re-analyze a completed deep dive session using a more advanced model for enhanced insights.

**Request Body**:
```json
{
  "session_id": "string",
  "current_analysis": {
    "primaryCondition": "string",
    "likelihood": "string", 
    "differentials": [],
    "recommendations": []
  },
  "model": "gpt-4o", // Premium model for enhanced reasoning
  "user_id": "string"
}
```

**Response**:
```json
{
  "status": "success",
  "enhanced_analysis": {
    "primaryCondition": "string",
    "likelihood": "string",
    "differentials": [],
    "recommendations": [],
    "additional_insights": "string"
  },
  "enhanced_confidence": 92,
  "reasoning_snippets": [
    "Key reasoning point 1",
    "Key reasoning point 2"
  ],
  "key_insights": "Most significant new finding from enhanced analysis",
  "model_used": "gpt-4o",
  "processing_time_ms": 3500
}
```

**Implementation Logic**:
```python
async def think_harder(request):
    data = request.json()
    session_id = data.get('session_id')
    current_analysis = data.get('current_analysis')
    premium_model = data.get('model', 'gpt-4o')
    user_id = data.get('user_id')
    
    # Retrieve original session data
    session = get_deep_dive_session(session_id)
    if not session:
        raise HTTPException(404, "Session not found")
    
    # Construct enhanced prompt for premium model
    enhanced_prompt = f"""
    ENHANCED MEDICAL REASONING TASK
    
    Original Analysis:
    - Condition: {current_analysis['primaryCondition']}
    - Confidence: {session.confidence}%
    - Symptoms: {session.all_symptoms}
    - User Responses: {session.all_answers}
    
    INSTRUCTIONS:
    1. Apply advanced reasoning patterns (differential diagnosis, bayesian reasoning, pattern recognition)
    2. Look for subtle patterns missed in initial analysis
    3. Consider rare conditions if symptoms warrant
    4. Provide chain-of-thought reasoning
    5. Aim for 90%+ diagnostic confidence
    
    Enhanced analysis should include:
    - Refined primary diagnosis
    - Updated confidence score
    - Key insights that changed your assessment
    - Advanced reasoning snippets
    """
    
    # Call premium model with enhanced reasoning
    response = await call_ai_model(
        model=premium_model,
        prompt=enhanced_prompt,
        temperature=0.3,  # Lower for more consistent reasoning
        max_tokens=1500
    )
    
    # Parse and structure response
    enhanced_analysis = parse_enhanced_analysis(response)
    
    # Update session with enhanced results
    update_session_enhanced_analysis(
        session_id, 
        enhanced_analysis,
        premium_model
    )
    
    # Log enhanced analysis event
    log_analysis_event(user_id, 'think_harder', session_id, enhanced_analysis)
    
    return {
        "status": "success",
        "enhanced_analysis": enhanced_analysis,
        "enhanced_confidence": enhanced_analysis.confidence,
        "reasoning_snippets": enhanced_analysis.reasoning,
        "key_insights": enhanced_analysis.key_insights,
        "model_used": premium_model
    }
```

### 2. Ask Me More Endpoint

**Endpoint**: `POST /api/deep-dive/ask-more`

**Purpose**: Generate additional targeted questions to reach 95%+ diagnostic confidence.

**Request Body**:
```json
{
  "session_id": "string",
  "current_confidence": 78,
  "target_confidence": 95,
  "user_id": "string"
}
```

**Response**:
```json
{
  "status": "success",
  "question": "Based on your chest pain, have you noticed if it worsens when you take deep breaths or cough? This can help distinguish between muscular and respiratory causes.",
  "question_number": 4,
  "current_confidence": 78,
  "target_confidence": 95,
  "confidence_gap": 17,
  "estimated_questions_remaining": 2,
  "question_category": "differential_diagnosis"
}
```

**Implementation Logic**:
```python
async def ask_me_more(request):
    data = request.json()
    session_id = data.get('session_id')
    current_confidence = data.get('current_confidence', 0)
    target_confidence = data.get('target_confidence', 95)
    user_id = data.get('user_id')
    
    # Retrieve session data
    session = get_deep_dive_session(session_id)
    if not session:
        raise HTTPException(404, "Session not found")
    
    # Check if target confidence already reached
    if current_confidence >= target_confidence:
        return {
            "status": "success",
            "question": None,
            "message": "Target confidence already achieved"
        }
    
    # Analyze confidence gaps
    confidence_analysis = analyze_confidence_gaps(session)
    
    # Generate targeted question based on gaps
    question_prompt = f"""
    MEDICAL CONFIDENCE ENHANCEMENT
    
    Current Situation:
    - Primary Condition: {session.primary_condition}
    - Current Confidence: {current_confidence}%
    - Target: {target_confidence}%
    - Gap: {target_confidence - current_confidence}%
    
    Previous Questions Asked: {len(session.questions)}
    Previous Answers: {session.all_answers}
    
    Confidence Gap Analysis:
    - Symptom clarity: {confidence_analysis.symptom_clarity}%
    - Temporal factors: {confidence_analysis.temporal_factors}%
    - Differential diagnosis: {confidence_analysis.differential_ruled_out}%
    - Red flags assessed: {confidence_analysis.red_flags}%
    
    Generate ONE targeted question that will most effectively increase diagnostic confidence.
    Focus on the area with the lowest confidence score.
    
    Question should:
    1. Address the biggest confidence gap
    2. Help rule in/out the primary diagnosis
    3. Be specific and actionable
    4. Avoid repeating previous questions
    
    Return format:
    {{
        "question": "specific question text",
        "category": "symptom_clarity|temporal_factors|differential_diagnosis|red_flags",
        "expected_confidence_gain": 15
    }}
    """
    
    # Generate question using AI
    response = await call_ai_model(
        model='deepseek/deepseek-chat',
        prompt=question_prompt,
        temperature=0.7,
        max_tokens=300
    )
    
    question_data = parse_question_response(response)
    
    # Validate question quality
    if not is_good_question(question_data.question, session.previous_questions):
        # Fallback question generation
        question_data = generate_fallback_question(session, confidence_analysis)
    
    # Update session with new question
    update_session_with_question(session_id, question_data)
    
    # Log question generation event
    log_analysis_event(user_id, 'ask_more_question', session_id, question_data)
    
    return {
        "status": "success",
        "question": question_data.question,
        "question_number": len(session.questions) + 1,
        "current_confidence": current_confidence,
        "target_confidence": target_confidence,
        "confidence_gap": target_confidence - current_confidence,
        "estimated_questions_remaining": calculate_questions_remaining(confidence_analysis),
        "question_category": question_data.category
    }
```

## Enhanced Confidence Calculation

Update your existing confidence calculation to be more sophisticated:

```python
def calculate_enhanced_confidence(session_data, answers):
    """Enhanced confidence calculation for Ask Me More feature"""
    
    confidence_factors = {
        "symptom_specificity": 0,      # How specific/detailed are symptoms
        "temporal_clarity": 0,          # Timeline and progression clarity  
        "differential_ruled_out": 0,    # Other conditions eliminated
        "red_flags_assessed": 0,        # Critical symptoms checked
        "consistency_score": 0,         # Answer consistency
        "completeness_score": 0         # Information completeness
    }
    
    # Analyze each answer for confidence factors
    for answer in answers:
        # Symptom specificity (0-20 points)
        specificity = analyze_symptom_specificity(answer)
        confidence_factors["symptom_specificity"] += specificity
        
        # Temporal clarity (0-15 points)  
        temporal = analyze_temporal_information(answer)
        confidence_factors["temporal_clarity"] += temporal
        
        # Differential diagnosis (0-25 points)
        differential = analyze_differential_value(answer)
        confidence_factors["differential_ruled_out"] += differential
        
        # Red flags (0-20 points)
        red_flags = check_red_flag_coverage(answer)
        confidence_factors["red_flags_assessed"] += red_flags
    
    # Calculate consistency across answers
    confidence_factors["consistency_score"] = calculate_answer_consistency(answers)
    
    # Calculate information completeness
    confidence_factors["completeness_score"] = calculate_completeness(session_data)
    
    # Weighted calculation targeting 95%+ confidence
    weights = {
        "symptom_specificity": 0.20,
        "temporal_clarity": 0.15,
        "differential_ruled_out": 0.30,
        "red_flags_assessed": 0.20,
        "consistency_score": 0.10,
        "completeness_score": 0.05
    }
    
    total_confidence = sum(
        min(confidence_factors[key], 100) * weights[key]
        for key in confidence_factors
    )
    
    # Apply diminishing returns after 90%
    if total_confidence > 90:
        excess = total_confidence - 90
        total_confidence = 90 + (excess * 0.5)
    
    return min(total_confidence, 98)  # Cap at 98% (never 100% certain)

def analyze_confidence_gaps(session):
    """Identify which areas need more questions to reach 95%"""
    
    # Calculate individual factor scores
    factors = calculate_enhanced_confidence_detailed(session)
    
    # Identify the weakest areas
    gaps = {}
    for factor, score in factors.items():
        target_score = 95 * get_factor_weight(factor)
        gaps[factor] = max(0, target_score - score)
    
    return sorted(gaps.items(), key=lambda x: x[1], reverse=True)
```

## Question Generation Strategies

```python
def generate_targeted_question(session, confidence_gaps):
    """Generate questions based on confidence gaps"""
    
    primary_gap = confidence_gaps[0][0]  # Biggest gap area
    
    question_strategies = {
        "symptom_specificity": [
            "Can you describe the exact nature of the {symptom}? Is it sharp, dull, burning, or aching?",
            "Where exactly do you feel the {symptom}? Can you point to the specific area?",
            "How would you rate the intensity on a scale of 1-10? Does it fluctuate?"
        ],
        
        "temporal_clarity": [
            "When did you first notice these symptoms? Has the pattern changed?",
            "Do the symptoms follow any pattern throughout the day?",
            "Have the symptoms been getting better, worse, or staying the same?"
        ],
        
        "differential_ruled_out": [
            "Have you experienced any {alternative_symptom} that might suggest {alternative_condition}?",
            "Does the pain change when you {specific_action} that would indicate {specific_condition}?",
            "Any family history of {related_conditions}?"
        ],
        
        "red_flags_assessed": [
            "Have you experienced any {red_flag_symptom} such as {examples}?",
            "Any recent {trigger_events} that might be related?",
            "Have you noticed any {warning_signs}?"
        ]
    }
    
    # Select appropriate question template
    templates = question_strategies.get(primary_gap, question_strategies["symptom_specificity"])
    
    # Customize question for this specific case
    return customize_question_template(templates, session)
```

## Database Schema Updates

Add these fields to your deep dive sessions table:

```sql
-- Enhanced Deep Dive Sessions
ALTER TABLE deep_dive_sessions ADD COLUMN enhanced_analysis JSONB;
ALTER TABLE deep_dive_sessions ADD COLUMN enhanced_confidence INTEGER;
ALTER TABLE deep_dive_sessions ADD COLUMN enhanced_model VARCHAR(100);
ALTER TABLE deep_dive_sessions ADD COLUMN enhanced_at TIMESTAMP;
ALTER TABLE deep_dive_sessions ADD COLUMN additional_questions JSONB DEFAULT '[]';
ALTER TABLE deep_dive_sessions ADD COLUMN confidence_progression JSONB DEFAULT '[]';

-- Confidence tracking
CREATE TABLE confidence_tracking (
    id SERIAL PRIMARY KEY,
    session_id VARCHAR(100) REFERENCES deep_dive_sessions(session_id),
    question_number INTEGER,
    confidence_before INTEGER,
    confidence_after INTEGER,
    confidence_factors JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);
```

## Configuration

Add these to your backend configuration:

```python
# Enhanced Deep Dive Configuration
ENHANCED_DEEP_DIVE_CONFIG = {
    "think_harder": {
        "premium_models": [
            "gpt-4o",
            "claude-3-opus", 
            "gemini-pro-advanced"
        ],
        "max_processing_time": 30,  # seconds
        "confidence_boost_target": 10  # minimum confidence increase expected
    },
    
    "ask_me_more": {
        "target_confidence": 90,
        "max_additional_questions": 5,
        "min_confidence_gain_per_question": 5,
        "question_generation_model": "deepseek/deepseek-chat"
    },
    
    "confidence_calculation": {
        "weights": {
            "symptom_specificity": 0.20,
            "temporal_clarity": 0.15, 
            "differential_ruled_out": 0.30,
            "red_flags_assessed": 0.20,
            "consistency_score": 0.10,
            "completeness_score": 0.05
        },
        "diminishing_returns_threshold": 90,
        "max_confidence": 98
    }
}
```

## Testing

Test the enhanced features with these scenarios:

```python
# Test cases for Think Harder
def test_think_harder():
    # Case 1: Low confidence diagnosis
    session = create_test_session(confidence=65)
    result = think_harder(session.session_id, "gpt-4o")
    assert result.enhanced_confidence > 75
    
    # Case 2: Already high confidence
    session = create_test_session(confidence=90)  
    result = think_harder(session.session_id, "gpt-4o")
    assert result.enhanced_confidence >= 90

# Test cases for Ask Me More
def test_ask_me_more():
    # Case 1: Low confidence, should generate question
    session = create_test_session(confidence=70)
    result = ask_me_more(session.session_id, target=95)
    assert result.question is not None
    assert result.estimated_questions_remaining > 0
    
    # Case 2: Already at target confidence
    session = create_test_session(confidence=96)
    result = ask_me_more(session.session_id, target=95)
    assert result.question is None
```

## Error Handling

Implement robust error handling:

```python
class EnhancedDeepDiveError(Exception):
    pass

class ThinkHarderError(EnhancedDeepDiveError):
    pass

class AskMeMoreError(EnhancedDeepDiveError):
    pass

# Graceful degradation
def think_harder_with_fallback(session_id, model):
    try:
        return think_harder(session_id, model)
    except ThinkHarderError:
        # Fallback to standard model
        return think_harder(session_id, "deepseek/deepseek-chat")
    except Exception as e:
        # Return original analysis with error flag
        return {
            "status": "error",
            "message": "Enhanced analysis unavailable",
            "original_analysis_unchanged": True
        }
```

This implementation provides a robust foundation for both enhanced features while maintaining backward compatibility with your existing deep dive system.