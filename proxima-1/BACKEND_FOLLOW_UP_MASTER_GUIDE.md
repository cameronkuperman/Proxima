# Backend Follow-Up System Master Guide

## Core Philosophy & Purpose

**Follow-ups are not just "checking in" - they're actively refining our understanding of the user's condition.**

### What Follow-Ups Actually Do:
1. **Refine Diagnosis** - Initial assessment might be 60% confident, follow-up brings it to 85%
2. **Discover Patterns** - "Your symptoms always worsen 2 days before rain" 
3. **Catch Misdiagnoses** - "Initially thought stress, but pattern suggests migraine"
4. **Track Treatment Efficacy** - "Ibuprofen helping, meditation not working"
5. **Build Temporal Story** - Connect dots over time that single assessments miss

### Key Principle:
Each follow-up makes the AI smarter about THIS specific person's condition, not just generic medical knowledge.

## The 8-Question Follow-Up Structure

### Base Questions (5):
1. **Have there been any changes since last time?**
   - Much better / Somewhat better / No change / Somewhat worse / Much worse
   
2. **What specific changes have you noticed?** 
   - Text field (only shows if Q1 ≠ "No change")
   
3. **Have your symptoms worsened or gotten better in severity?**
   - Much worse / Somewhat worse / About the same / Somewhat better / Much better
   
4. **Have you identified any new triggers or patterns?**
   - Yes (text field) / No / Not sure
   
5. **Have you seen a doctor since last time?**
   - Yes → Medical modal / No

### AI-Generated Questions (3):
**These must be SPECIFIC to the user's case, not generic templates.**


**ALL QUESTIONS ARE OPTIONAL EXCEPT AT LEAST 1 MUST BE ANSWERED**

## AI Question Generation Requirements

### Context the AI MUST Receive:
```json
{
  "original_assessment": {
    // ENTIRE original assessment including:
    "symptoms": ["headache", "nausea", "light sensitivity"],
    "body_part": "head",
    "form_data": {...all original responses...},
    "ai_response": {...original AI analysis...},
    "severity_score": 7,
    "created_at": "2024-01-15T10:00:00Z"
  },
  "previous_follow_ups": [
    // ALL previous follow-ups in chain
  ],
  Also figure out a way to add in the 
  "days_since_original": 7,
  "days_since_last": 3,
  "current_datetime": "2024-01-22T10:00:00Z",
  "user_history": {
    // Recent assessments from other conditions if relevant
  }
}
```

### Examples of GOOD vs BAD AI Questions:

❌ **BAD (Too Generic):**
- "How is your headache?"
- "Any new symptoms?"
- "Is it getting better?"

✅ **GOOD (Specific & Actionable):** (these examples are fineactual wquestions can be even more targeted as well these are defintely flawed examples. Questions can also be lveraged to bettter understand the progression and also created to maximally narrow down the condition as well)
- "You mentioned the pain moves from your temple to jaw - is this still happening?"
- "It's been 5 days since you started ibuprofen - has it helped with the morning headaches specifically?"
- "Last time you couldn't work due to the pain - are you able to work now?"
- "You suspected coffee was a trigger - what happened when you reduced intake?"

### AI Question Generation Prompt Template:
```
Generate 3 follow-up questions for this specific case:

ORIGINAL CONDITION: [headache with nausea, triggered by stress]
DAYS SINCE: [7 days]
PREVIOUS RESPONSES: [Taking ibuprofen, trying meditation]
CURRENT STATUS: [Somewhat better]

Generate questions that:
1. Reference specific details they mentioned
2. Track specific interventions they tried
3. Are answerable with their current experience
4. Help refine our understanding of their specific case

DO NOT ask generic medical questions.
DO ask about THEIR specific situation.
```

## Medical Visit Modal

**Only appears if Q5 = "Yes"**

```
📋 Medical Visit Update

Who did you see?
[Primary] [Specialist: ___] [Urgent care] [ER] [Telehealth]

What was their assessment?
[Text field - their main conclusion]

Did they start you on any treatments?
[Text field - medications, procedures, therapy]

When do you need to follow up? (optional)
[Text field - "2 weeks", "as needed", etc.]
```

### How Medical Modal Data Should Be Used:
1. **Influences next follow-up timing** - If doctor said "follow up in 2 weeks", suggest follow-up then or we ould also do nothing and just confirm this the option is up to your discretion ultrathink
2. **Generates future AI questions** - "How's the new medication working?"
3. **Updates confidence** - Professional diagnosis increases/decreases our confidence
4. **Adds to context** - "Doctor confirmed migraine" becomes part of the story

## Follow-Up Results Structure

### What Changes from Original Assessment:
Follow-up results should show **evolution**, not just repetition.

```json
{
  "assessment": {
    // Same core structure as original but refined
    "condition": "Migraine with stress triggers",  // May update from original
    "confidence": 0.85,  // Higher than original 0.60
    "severity": "moderate",
    "progression": "improving"  // NEW: wasn't in original
  },
  
  "assessment_evolution": {
    "original_assessment": "Tension headache",
    "current_assessment": "Migraine with stress triggers", 
    "confidence_change": "60% → 85%",
    "diagnosis_refined": true,
    "key_discoveries": [
      "Weather changes are a trigger",
      "Coffee makes it worse, not better",
      "Pattern matches classic migraine"
    ]
  },
  
  "progression_narrative": {
    "summary": "You're following a typical recovery pattern",
    "details": "The reduction in frequency from daily to 3x/week is expected. Most people see resolution within 2 weeks with your treatment approach.",
    "milestone": "Next milestone: pain-free days by day 10"
  },
  
  "pattern_insights": {
    "discovered_patterns": [
      "Symptoms worse 2 days before weather changes",
      "Morning symptoms improved with medication",
      "Stress from work meetings is primary trigger"
    ],
    "concerning_patterns": [],  // Or ["Increasing frequency suggests specialist needed"]
  },
  
  "treatment_efficacy": {
    "working": ["Ibuprofen for morning pain", "Dark room for recovery"],
    "not_working": ["Meditation", "Caffeine"],
    "should_try": ["Magnesium supplement", "Regular sleep schedule"]
  },
  
  "recommendations": {
    "immediate": ["Continue ibuprofen as needed"],
    "this_week": ["Start tracking triggers in journal"],
    "consider": ["Neurologist if no improvement in 1 week"],
    "next_follow_up": "4 days (sooner if worsening)"
  },
  
  "confidence_indicator": {
    "level": "high",
    "explanation": "Multiple follow-ups showing consistent pattern",
    "visual": "⚪⚪⚪⚫⚫"  // 4/5 confidence
  }
}
```

## Symptom Tracking Integration

**If user has active symptom tracking for this condition:**

```json
{
  "symptom_tracking_integration": {
    "is_tracking": true,
    "condition_match": "headache",
    "summary": {
      "past_7_days": {
        "entries": 7,
        "bad_days": 5,
        "good_days": 2,
        "average_severity": 6.2,
        "trend": "improving",
        "graph": [8, 7, 7, 6, 5, 5, 4]  // Last 7 days
      },
      "insights": "Your tracking aligns with reported improvements",
      "correlation": "Bad days correlate with work meetings schedule"
    },
    "display_in_results": true
  }
}
```

### How to Integrate:
1. Check if user has symptom tracking entries for condition
2. Calculate 7-day summary statistics
3. Include mini-graph in results
4. Correlate with follow-up responses
5. Show as evidence: "Your daily tracking confirms the improvement"

## Smart Follow-Up Timing

### Suggested Timing Logic:
```javascript
function suggestNextFollowUp(condition, trend, daysSince, doctorInput) {
  if (doctorInput) return doctorInput;  // "Doctor said 2 weeks"
  
  if (trend === 'much_worse') return '1-2 days';
  if (trend === 'somewhat_worse') return '3-4 days';
  if (trend === 'stable' && daysSince < 7) return '1 week';
  if (trend === 'stable' && daysSince >= 7) return '2 weeks';
  if (trend === 'somewhat_better') return '5-7 days';
  if (trend === 'much_better') return '2 weeks';
  if (trend === 'resolved') return 'As needed';
  
  // Condition-specific overrides
  if (condition.includes('acute')) return '2-3 days';
  if (condition.includes('chronic')) return '2-4 weeks';
}
```

## New Features to Consider

### 1. Success Criteria (Optional Q9):
"What would need to happen for you to consider this resolved?"
- Helps AI understand user's goals
- Tracks if we're moving toward their definition of success

### 2. Confidence Scoring:
Show AI's confidence in assessment:
- "High confidence - consistent pattern over 3 follow-ups"
- "Moderate confidence - some conflicting signals"
- "Low confidence - consider seeing specialist"

### 3. Pattern Alerts:
Flag concerning progressions:
- "⚠️ Worsening pattern suggests medical attention"
- "✅ Improvement pattern indicates treatment working"
- "🔄 Cycling pattern typical of this condition"

### 4. Connection Discovery:
Link symptoms across time:
- "The fatigue you mentioned is likely from poor sleep due to pain"
- "Nausea appears connected to headache intensity"

## Backend Implementation Checklist

- [ ] Pass ENTIRE original assessment to AI for question generation
- [ ] Include ALL previous follow-ups in context
- [ ] Generate truly specific questions, not templates
- [ ] At least 1 question must be answered (validation)
- [ ] Medical modal data influences future questions
- [ ] Check for symptom tracking data and integrate
- [ ] Calculate progression trends and patterns
- [ ] Update diagnosis confidence based on new data
- [ ] Suggest next follow-up timing
- [ ] Show evolution from original assessment
- [ ] Include pattern discoveries in results
- [ ] Track treatment efficacy

## API Endpoints

### GET /api/follow-up/questions/{assessment_id}
Returns 8 questions with AI personalization

### POST /api/follow-up/submit
```json
{
  "assessment_id": "uuid",
  "responses": {
    "q1": "somewhat_better",
    "q2": "Less frequent headaches",
    // ... at least 1 required
  },
  "medical_visit": {
    // Optional modal data
  }
}
```

Returns enhanced results with progression tracking

### GET /api/follow-up/chain/{assessment_id}
Returns all follow-ups for visualization

## Success Metrics

A good follow-up system will:
1. Increase diagnostic confidence over time
2. Discover patterns invisible in single assessments  
3. Track treatment efficacy accurately
4. Catch condition changes early
5. Make users feel heard and understood
6. Provide actionable insights, not just data collection

## Remember

**Follow-ups are where the magic happens.** They transform a one-time guess into an evolving understanding. Each follow-up should feel like the AI is learning about THIS person's specific case, not just asking generic medical questions.

The goal: By the 3rd follow-up, the AI should understand their condition better than a doctor who only saw them once.