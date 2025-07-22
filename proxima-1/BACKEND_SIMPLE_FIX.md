# Simple Backend Fix - 2 Lines of Code

## The Error
```
"Session must be in analysis_ready or completed state"
```

## The Problem
Session exists but has wrong status (probably "active" instead of "analysis_ready")

## The Fix - Add 2 Lines

Find this in your Deep Dive continue endpoint:
```python
if ready_for_analysis:
    # YOU'RE MISSING THIS:
    supabase.table('deep_dive_sessions').update({
        "status": "analysis_ready"  # ADD THIS LINE!
    }).eq('id', session_id).execute()
    
    return {
        "ready_for_analysis": True,
        # ... rest of response
    }
```

That's it. The session status isn't being updated when Deep Dive is ready for analysis.

## Quick SQL Check
Run this to confirm:
```sql
SELECT status FROM deep_dive_sessions WHERE id = 'cb6cd1f0-44f0-4177-83e9-28ba7de14145';
```

If it shows "active" instead of "analysis_ready", that's the bug.