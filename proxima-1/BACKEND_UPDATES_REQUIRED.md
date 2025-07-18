# Backend Updates Required - Deep Dive Enhancements

## 1. Deep Dive Configuration Updates

Update your deep dive logic to:

```python
# Configuration
DEEP_DIVE_CONFIG = {
    "max_questions": 7,  # NEW: Limit to 7 questions max
    "target_confidence": 90,  # Updated from 95%
    "min_confidence_for_completion": 85,  # Can complete at 85% if max questions reached
}
```

## 2. Question Deduplication (CRITICAL FIX)

Add this to your Deep Dive continue endpoint:

```python
def is_duplicate_question(new_question, previous_questions):
    """Prevent asking the same question twice"""
    import difflib
    
    for prev_q in previous_questions:
        # Check similarity (adjust threshold as needed)
        similarity = difflib.SequenceMatcher(None, 
            new_question.lower().strip(), 
            prev_q.lower().strip()
        ).ratio()
        
        if similarity > 0.8:  # 80% similar = duplicate
            return True
    return False

# In your continue endpoint:
async def deep_dive_continue(request):
    # ... existing code ...
    
    # Before returning new question:
    if is_duplicate_question(generated_question, session.previous_questions):
        # Generate alternative question or complete if enough questions asked
        if len(session.previous_questions) >= 3:
            return {"ready_for_analysis": True}
        else:
            generated_question = generate_alternative_question(session)
    
    # Store question in session
    session.previous_questions.append(generated_question)
    
    return {
        "question": generated_question,
        "question_number": len(session.previous_questions),
        "ready_for_analysis": False
    }
```

## 3. Enhanced Question Tracking

Update your session storage to track questions:

```python
# Add to your session model/storage
class DeepDiveSession:
    session_id: str
    previous_questions: List[str] = []  # NEW: Track all questions asked
    previous_answers: List[str] = []
    question_count: int = 0
    max_questions_reached: bool = False
    
def update_session_with_qa(session_id, question, answer):
    session = get_session(session_id)
    session.previous_questions.append(question)
    session.previous_answers.append(answer) 
    session.question_count += 1
    session.max_questions_reached = session.question_count >= 7
    save_session(session)
```

## 4. Smart Completion Logic

Update your completion logic:

```python
def should_complete_deep_dive(session):
    """Decide if deep dive should complete"""
    current_confidence = calculate_confidence(session)
    
    # Complete if any of these conditions:
    return (
        current_confidence >= 90 or  # Target confidence reached
        session.question_count >= 7 or  # Max questions reached
        (session.question_count >= 5 and current_confidence >= 85)  # Good enough fallback
    )
```

## 5. New API Endpoints for Enhanced Features

Add these endpoints:

```python
# /api/deep-dive/think-harder
@app.post("/api/deep-dive/think-harder")
async def think_harder(request):
    # Use premium model (gpt-4o) to re-analyze
    # Return enhanced_analysis with higher confidence
    pass

# /api/deep-dive/ask-more  
@app.post("/api/deep-dive/ask-more")
async def ask_more(request):
    # Continue questioning until 90% confidence
    # Max 7 questions total, no duplicates
    pass

# /api/quick-scan/think-harder
@app.post("/api/quick-scan/think-harder") 
async def quick_scan_think_harder(request):
    # Enhanced analysis for Quick Scan results
    pass
```

## 6. Database Schema Updates

```sql
-- Track questions to prevent duplicates
ALTER TABLE deep_dive_sessions ADD COLUMN previous_questions JSONB DEFAULT '[]';
ALTER TABLE deep_dive_sessions ADD COLUMN max_questions_reached BOOLEAN DEFAULT FALSE;
ALTER TABLE deep_dive_sessions ADD COLUMN target_confidence INTEGER DEFAULT 90;
```

## Priority Actions:
1. **URGENT**: Fix question deduplication to prevent asking same question twice
2. **HIGH**: Implement 7 question limit  
3. **MEDIUM**: Add new Think Harder endpoints
4. **LOW**: Update database schema

## Quick Test:
Start a deep dive session and verify:
- ✅ No duplicate questions asked
- ✅ Stops at 7 questions max
- ✅ Completes at 90% confidence if reached earlier
- ✅ Previous questions stored and checked