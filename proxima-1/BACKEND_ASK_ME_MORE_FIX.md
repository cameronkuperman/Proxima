# Backend Fix Required: Ask Me More

## Current Issue
When calling `/api/deep-dive/ask-more`, the backend returns:
```json
{
  "status": "success",
  "message": "Maximum of 6 total questions reached",
  "current_confidence": 70,
  "total_questions_asked": 6
}
```

But we WANT it to continue asking questions to reach 90%+ confidence!

## Proposed Solutions

### Option 1: Update Existing Endpoint (Recommended)
Update `/api/deep-dive/ask-more` to:
1. Ignore the 6 question limit when called explicitly
2. Continue asking questions until target_confidence is reached
3. Have a higher limit (e.g., 10-12 total questions max)

```python
# Backend should do something like:
def ask_more_questions(session_id, current_confidence, target_confidence):
    # Don't check question count limit here
    # Instead, focus on confidence target
    if current_confidence < target_confidence:
        # Generate more questions
        return {
            "question": "Additional targeted question here...",
            "current_confidence": current_confidence,
            "question_number": 7,  # Continue from where we left off
            "status": "success"
        }
```

### Option 2: Create New Endpoint
Create `/api/deep-dive/extended-questions` that:
- Bypasses normal question limits
- Specifically for reaching higher confidence
- Can ask up to 10-12 questions total

### Option 3: Add Override Parameter
Add `force_continue` parameter to existing endpoint:
```json
{
  "session_id": "xxx",
  "current_confidence": 70,
  "target_confidence": 95,
  "force_continue": true,  // Bypass limits
  "max_questions": 10
}
```

## What Frontend Needs

When Ask Me More is clicked and confidence < 90%:
1. Backend should return a new question (not just "max reached")
2. Questions should be targeted to increase confidence
3. Should work even if already asked 6 questions

## Temporary Frontend Workaround

Until backend is fixed, we could:
1. Start a new "continuation" session
2. Use Think Harder (Grok 4) instead
3. Show message explaining the limitation

## Example Expected Flow

```
User completes 6 questions → 70% confidence
User clicks "Ask Me More"
Backend returns: {
  "question": "Have you noticed any specific triggers for the pain?",
  "question_number": 7,
  "current_confidence": 70,
  "target_confidence": 90,
  "status": "success"
}
User answers...
Backend returns: {
  "question": "Does the pain occur at specific times of day?",
  "question_number": 8,
  "current_confidence": 78,
  "target_confidence": 90,
  "status": "success"
}
... continues until 90% reached
```

## Backend Code Suggestion

```python
# In ask_more endpoint:
def ask_more_questions(request):
    session = get_session(request.session_id)
    
    # Remove this check:
    # if session.question_count >= 6:
    #     return {"message": "Maximum questions reached"}
    
    # Instead:
    if request.current_confidence >= request.target_confidence:
        return {
            "status": "completed",
            "message": "Target confidence reached",
            "current_confidence": request.current_confidence
        }
    
    # Generate next question based on gaps in information
    next_question = generate_targeted_question(
        session.symptoms,
        session.answers,
        target_confidence=request.target_confidence
    )
    
    return {
        "question": next_question,
        "question_number": session.question_count + 1,
        "current_confidence": session.current_confidence,
        "status": "success"
    }
```

Let me know which approach the backend team prefers!