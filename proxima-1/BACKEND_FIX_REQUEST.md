# Backend Fix Request for Think Harder & Ask Me More

## Issue 1: Ultra Think API for Deep Dive

The `/api/quick-scan/ultra-think` endpoint needs to accept BOTH `scan_id` and `deep_dive_id` parameters.

**Current frontend sends:**
```json
{
  "scan_id": "xxx-xxx-xxx",
  "deep_dive_id": "xxx-xxx-xxx",  // Same value, included for compatibility
  "user_id": "user-123"
}
```

**Expected response:**
```json
{
  "ultra_confidence": 95,
  "ultra_analysis": {
    "ultra_diagnosis": {
      "primary": "Condition Name",
      "description": "Detailed description"
    },
    "critical_insights": ["Insight 1", "Insight 2"],
    "complexity_score": 8
  },
  "confidence_progression": {
    "initial": 75,
    "ultra": 95
  },
  "key_insights": ["Key insight about the condition"]
}
```

## Issue 2: Deep Dive Ask Me More

The deep dive needs an endpoint to continue asking questions after the initial analysis is complete.

**Suggested endpoint:** `/api/deep-dive/ask-more`

**Request:**
```json
{
  "session_id": "deep-dive-session-id",
  "current_confidence": 85,
  "target_confidence": 90,
  "user_id": "user-123"
}
```

**Expected response:**
```json
{
  "question": "Additional targeted question based on previous answers",
  "question_number": 4,
  "ready_for_analysis": false
}
```

## Issue 3: Ensure Consistent ID Handling

1. Quick Scan returns `scan_id`
2. Deep Dive returns `deep_dive_id`
3. Ultra Think endpoint should accept EITHER `scan_id` OR `deep_dive_id`

## Testing Commands

Test Ultra Think:
```bash
curl -X POST https://web-production-945c4.up.railway.app/api/quick-scan/ultra-think \
  -H "Content-Type: application/json" \
  -d '{
    "scan_id": "test-scan-id",
    "deep_dive_id": "test-deep-dive-id",
    "user_id": "test-user"
  }'
```

## Frontend Debug Info

The frontend now logs:
- "Deep Dive Think Harder clicked" with full finalAnalysis object
- "Deep Dive Ultra Think request" with the request body
- "Deep Dive Think Harder API response" with the response

This will help debug what the backend is actually returning.