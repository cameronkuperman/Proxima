# Improved Follow-Up Questions System

## Why These Questions Are Better

The new follow-up questions are designed to capture **meaningful health progression data** that's actually useful for both patients and AI analysis. Instead of generic "rate 1-10" questions, we now have:

## Universal Question Categories

### 1. **Core Questions (Always Asked)**
- **Structured Progress Scale**: Not just "better/worse" but specific percentage ranges (75-100% better, 25-75% better, etc.)
- **Daily Impact Percentage**: Visual slider showing what % of their day is affected
- **Functional Impact Checklist**: Which specific life activities are affected and how severely
- **Self-Management Confidence**: How confident they feel managing their health

### 2. **Progression Questions (Change Tracking)**
- **Structured Symptom Changes**: Categorized into improved/worsened/new/resolved with AI extraction
- **Intervention Effectiveness Tracker**: What they tried and how well it worked (with side effects tracking)
- **Pattern Identification**: Discovering triggers (time, activity, food, stress, weather, sleep)
- **Journey Progress**: Where they are compared to when it all started (0-125% scale)

### 3. **Contextual Questions (Life Quality)**
- **Life Quality Matrix**: Rating sleep, stress, energy, appetite, mood on 5-point scales
- **Circumstance Changes**: Life events that might affect health
- **Priority Setting**: What they most want to improve (ranked)

### 4. **Safety Questions (Red Flags)**
- **Red Flag Screening**: Checks for concerning symptoms with urgency levels
- **Medical Care Tracking**: What healthcare they've accessed
- **Care Need Assessment**: Do they need help now? (with guidance triggers)

## Intelligent Question Selection

Questions are selected dynamically based on:
- **Assessment Type**: Quick (7 questions), Deep (10 questions), General Deep (12 questions)
- **Follow-up Number**: More detailed questions for later follow-ups
- **Previous Responses**: If worsening, add safety questions; if improving, focus on what's working
- **Time Since Last**: Adjusts questions based on time gaps

## Key Improvements Over Basic Questions

| Old Questions | New Questions |
|--------------|---------------|
| "Rate symptoms 1-10" | Percentage of day affected + specific activity impacts |
| "What changed?" | Structured changes with categories + AI extraction |
| "What did you try?" | Treatment tracker with effectiveness ratings + side effects |
| "Any new symptoms?" | Pattern identification + trigger discovery |
| "How do you feel?" | Life quality matrix + confidence in self-management |

## Response Types for Better UX

- **Structured Scales**: Clear labels, not just numbers
- **Percentage Sliders**: Visual representation of impact
- **Impact Checklists**: Multi-select with severity ratings
- **Pattern Categories**: Pre-defined categories with examples
- **Matrix Ratings**: Multiple factors rated simultaneously
- **Effectiveness Trackers**: Rate each intervention separately

## AI Analysis Benefits

These questions provide:
1. **Quantifiable metrics** for tracking progression
2. **Structured data** for pattern recognition
3. **Context** for understanding changes
4. **Safety signals** for urgent situations
5. **Treatment effectiveness** data
6. **Quality of life** measurements

## Rules-Based Adaptation

The system includes rules that trigger based on responses:
- **Worsening symptoms** → Add safety questions
- **No progress after 3 follow-ups** → Focus on barriers and new approaches
- **High daily impact (>70%)** → Prioritize urgent care assessment
- **Significant improvement** → Focus on what's working

## Example User Experience

Instead of:
> "Rate your pain 1-10"
> "What changed?"
> "What did you try?"

Users now get:
> "What percentage of your day is affected by your health concerns?" [Visual slider]
> "Which daily activities have been impacted?" [Checklist with severity ratings]
> "What have you tried and how effective was each?" [Structured tracker]
> "Have you noticed any patterns?" [Categories with examples]

This creates a much more comprehensive and useful health tracking experience that actually helps identify what's working, what's not, and what needs attention.