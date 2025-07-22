# Backend Debug: Ask Me More Session Issue

## The Error
```python
"'NoneType' object has no attribute 'get'"
```

## When It Happens
1. User completes 6 Deep Dive questions
2. Analysis is ready (but NOT completed yet)
3. User clicks "Ask Me More"
4. Backend can't find session data

## Frontend is Sending (CORRECT):
```json
{
  "session_id": "96099af5-35bf-451f-9733-9c728c642802",
  "current_confidence": 85,
  "target_confidence": 90,
  "user_id": "45b61b67-175d-48a0-aca6-d0be57609383",
  "max_questions": 5
}
```

## The Problem in Backend Code

The error suggests this is happening:
```python
# In ask_more endpoint
session = get_session(request.session_id)  # Returns None
session.get('some_field')  # CRASHES because session is None
```

## What to Check in Backend:

### 1. Session Storage Issue
```python
# In ask_more endpoint, add this debug:
print(f"=== ASK MORE DEBUG ===")
print(f"Session ID requested: {request.session_id}")
print(f"User ID: {request.user_id}")

# Check if session exists in DB
session_response = supabase.table('deep_dive_sessions').select('*').eq('id', request.session_id).execute()
print(f"Session query response: {session_response}")
print(f"Session data found: {len(session_response.data) if session_response.data else 0} records")

if session_response.data:
    session = session_response.data[0]
    print(f"Session status: {session.get('status')}")
    print(f"Session keys: {list(session.keys())}")
    print(f"Questions asked: {session.get('questions_asked', 'NOT SET')}")
    print(f"Initial questions count: {session.get('initial_questions_count', 'NOT SET')}")
else:
    print("NO SESSION FOUND IN DATABASE!")
```

### 2. Session State Issue
The session might be in wrong state or missing required fields:
```python
# Check what's in the session
if session:
    print(f"Session has 'questions' field: {'questions' in session}")
    print(f"Session has 'answers' field: {'answers' in session}")
    print(f"Session status: {session.get('status')}")
    print(f"Analysis ready: {session.get('analysis_ready')}")
```

### 3. The Real Fix Needed

#### Option A: Session Not Being Saved
```python
# In your continue/complete endpoints, make sure you're saving:
update_data = {
    "status": "analysis_ready",  # NOT "completed"
    "questions_asked": len(questions),
    "initial_questions_count": len(questions),  # CRITICAL!
    "current_confidence": confidence,
    "questions": questions,  # Keep the Q&A data
    "answers": answers
}

# Make sure this actually executes:
supabase.table('deep_dive_sessions').update(update_data).eq('id', session_id).execute()
```

#### Option B: Session Being Deleted/Cleared
```python
# Make sure you're NOT doing:
# - Deleting session after complete
# - Setting session data to None
# - Clearing questions/answers
```

## Test This Fix:

### 1. Add Debug Endpoint
```python
@app.get("/api/debug/session/{session_id}")
async def debug_session(session_id: str):
    session = supabase.table('deep_dive_sessions').select('*').eq('id', session_id).execute()
    if session.data:
        data = session.data[0]
        return {
            "found": True,
            "status": data.get("status"),
            "questions_asked": data.get("questions_asked"),
            "initial_questions_count": data.get("initial_questions_count"),
            "has_questions": "questions" in data,
            "has_answers": "answers" in data,
            "keys": list(data.keys())
        }
    return {"found": False, "session_id": session_id}
```

### 2. Frontend Can Test
```javascript
// After deep dive ready but before Ask Me More:
fetch(`/api/debug/session/${sessionId}`)
  .then(r => r.json())
  .then(data => console.log('Session state:', data))
```

## Most Likely Issues:

1. **initial_questions_count not being set** when Deep Dive reaches ready state
2. **Session being marked as "completed"** instead of "analysis_ready"
3. **Session data not being persisted** to database
4. **Questions/answers being cleared** from session

## Quick Fix to Try:

In the ask_more endpoint, if session is None, try to reconstruct from DB:
```python
if not session or session is None:
    # Try to get from messages table
    messages = supabase.table('messages').select('*').eq('conversation_id', request.session_id).execute()
    if messages.data:
        # Reconstruct session from messages
        questions = [m for m in messages.data if m['role'] == 'assistant' and 'question' in m['content']]
        answers = [m for m in messages.data if m['role'] == 'user']
        
        # Create temporary session
        session = {
            'status': 'analysis_ready',
            'questions_asked': len(questions),
            'initial_questions_count': 6,  # Default
            'questions': questions,
            'answers': answers
        }
```

Send this to your backend team - the debug output will show exactly why the session is None!