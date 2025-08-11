# Backend API Response Structure Update

## IMPORTANT: Add these fields to all assessment responses (Quick Scan, Deep Dive, General Assessment)

Update your API responses to include these fields in this exact order:

```python
def format_assessment_response(assessment_data):
    return {
        # 1. IMMEDIATE CONTEXT
        "severity_level": "low/moderate/high/urgent",  # Based on symptoms
        "confidence_level": "low/medium/high",  # AI's confidence in assessment
        
        # 2. PLAIN ENGLISH EXPLANATION (NEW - ADD THIS!)
        "what_this_means": "Simple, non-medical explanation of what their symptoms indicate. Example: 'Your symptoms suggest your body is responding to stress, which is affecting your sleep and energy levels. This is common and usually manageable with lifestyle changes.'",
        
        # 3. DIAGNOSIS (Keep existing field)
        "potential_diagnosis": ["existing diagnosis list"],  # Keep as is
        
        # 4. IMMEDIATE ACTIONS (NEW - ADD THIS!)
        "immediate_actions": [
            "Take over-the-counter pain reliever",
            "Rest for the next 24 hours",
            "Stay hydrated - drink 8 glasses of water"
        ],
        
        # 5. LIFESTYLE RECOMMENDATIONS (Enhance existing recommendations)
        "lifestyle_recommendations": [
            "Establish regular sleep schedule",
            "Add 30 minutes of light exercise daily",
            "Reduce caffeine intake"
        ],
        
        # 6. RED FLAGS (NEW - ADD THIS!)
        "red_flags": [
            "Chest pain or difficulty breathing",
            "Fever above 103°F",
            "Symptoms rapidly worsening"
        ],
        
        # 7. TIMELINE (NEW - ADD THIS!)
        "follow_up_timeline": {
            "check_progress": "3 days",
            "see_doctor_if": "No improvement in 1 week or symptoms worsen"
        },
        
        # 8. TRACKING METRICS (NEW - ADD THIS!)
        "tracking_metrics": [
            "Daily pain level (1-10 scale)",
            "Hours of sleep per night",
            "Energy levels (morning and evening)"
        ],
        
        # 9. KEEP EXISTING FIELDS
        "recommendations": "existing recommendations",  # Keep for compatibility
        "analysis": "existing analysis",  # Keep as is
        # ... any other existing fields
    }
```

## Implementation Notes:

1. **For Mental Health Categories**: 
   - Use "what_this_means" to explain WITHOUT diagnostic labels
   - Focus on "immediate_actions" that are self-care based
   - Include crisis resources in "red_flags" if needed

2. **Severity Levels**:
   - `low`: Can self-manage, monitor
   - `moderate`: Should consider medical consultation
   - `high`: See doctor within 48 hours
   - `urgent`: Seek immediate medical attention

3. **Confidence Levels**:
   - `high`: Clear symptom pattern, typical presentation
   - `medium`: Some ambiguity, multiple possibilities
   - `low`: Unusual symptoms, needs professional evaluation

4. **AI Prompt Addition**:
Add this to your AI prompts:
```
Also provide:
1. what_this_means: A simple, non-medical explanation of what the symptoms indicate
2. immediate_actions: 3-5 specific actions they can take right now
3. red_flags: Warning signs that require immediate medical attention
4. tracking_metrics: Specific symptoms or measurements to monitor daily
5. Assess severity_level (low/moderate/high/urgent) and confidence_level (low/medium/high)
```

## Example Response:
```json
{
  "severity_level": "moderate",
  "confidence_level": "high",
  "what_this_means": "Your fatigue combined with difficulty concentrating suggests your body and mind need rest. This pattern often occurs when stress depletes your energy reserves.",
  "potential_diagnosis": ["Chronic Fatigue", "Stress-related Exhaustion"],
  "immediate_actions": [
    "Take a 20-minute rest break now",
    "Drink a glass of water",
    "Do 5 minutes of deep breathing"
  ],
  "lifestyle_recommendations": [
    "Aim for 8 hours of sleep nightly",
    "Take regular breaks during work",
    "Limit screen time before bed"
  ],
  "red_flags": [
    "Sudden severe headache",
    "Chest pain or palpitations",
    "Extreme confusion or disorientation"
  ],
  "follow_up_timeline": {
    "check_progress": "3 days",
    "see_doctor_if": "No improvement in 1 week"
  },
  "tracking_metrics": [
    "Energy level 1-10 (morning and evening)",
    "Hours of actual sleep",
    "Number of rest breaks taken"
  ]
}
```

## Backend Files to Update:
- `/api/quickscan` endpoint
- `/api/deepdive` endpoints
- `/api/general-assessment` endpoints
- Any AI prompt templates

Keep all existing fields for backward compatibility, just ADD these new ones!