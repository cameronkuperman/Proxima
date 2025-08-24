# Simplified Follow-Up Questions Design

## Core Philosophy
**Direct questions that people actually want to answer** - no complex matrices or 15-point scales.

## Question Flow by Assessment Type

### Quick Scan Follow-Up (5 questions)
1. Have there been any changes to your symptoms?
2. What specific changes? (if applicable)
3. How much is this affecting your daily life?
4. Overall rating (1-10 with previous shown)
5. Have you identified any new triggers?

### General Assessment Follow-Up (6 questions)
1-4. Same core questions
5. Have you identified any new triggers?
6. What are you doing to manage symptoms?

### Deep Dive Follow-Up (9 questions)
1-4. Same core questions
5-7. All progression questions (triggers, management, barriers)
8. Have you sought medical attention?
9. What did they say? (modal if yes)

### General Deep Dive Follow-Up (10-11 questions)
- All questions
- Safety check added if symptoms worsening

## Key Design Decisions

### 1. Simple Change Tracking
Instead of complex percentages, just:
- Much better
- Somewhat better  
- No change
- Somewhat worse
- Much worse
- Completely resolved

### 2. Medical Visit Modal
When user selects "Yes" to medical visit, popup asks:
- What was the diagnosis?
- What treatment was recommended?
- Any follow-up needed?
- Any tests ordered?

### 3. Smart Conditionals
- "What changed?" only shows if there were changes
- Safety questions only appear if worsening
- Medical need question shows if no recent visit

### 4. Impact Scale
Simple 5-point scale everyone understands:
- Not at all
- Minimal impact
- Moderate impact
- Significant impact
- Severe - can't do normal activities

## Benefits Over Complex System

| Complex Version | Simplified Version |
|-----------------|-------------------|
| 7-point scale with percentages | Simple 5-option change selector |
| Life quality matrix (5 factors) | Single "daily impact" question |
| 12+ question types | 6 simple question types |
| Pattern identification with 7 categories | Simple yes/no with text follow-up |
| Treatment effectiveness matrix | Multi-select with simple rating |

## Frontend Implementation

```typescript
// Simple question renderer
const QuestionTypes = {
  'change_selector': ChangeRadioGroup,
  'structured_text': ConditionalTextAreas,
  'impact_scale': ImpactRadioGroup,
  'simple_scale': SliderWithPrevious,
  'trigger_check': YesNoWithFollowUp,
  'treatment_simple': MultiSelectWithRating,
  'medical_visit': RadioWithModal,
  'red_flag_quick': MultiSelectAlert
}

// Medical visit modal
const MedicalVisitModal = ({ onSave }) => (
  <Modal title="What did the doctor say?">
    <TextField label="Diagnosis/Assessment" />
    <TextField label="Treatment recommended" />
    <TextField label="Follow-up needed" />
    <TextField label="Tests ordered" />
  </Modal>
)
```

## User Experience

**Old flow:**
- 12-15 complex questions
- Multiple matrices and scales
- Overwhelming for quick check-ins

**New flow:**
- 5-9 focused questions
- Clear yes/no/simple choices
- Modal for details only when relevant
- Takes 2-3 minutes max

## AI Analysis Benefits

Even with simpler questions, AI still gets:
- Clear progression signal (better/worse/same)
- Specific changes described
- Daily impact level
- Trigger identification
- Treatment attempts and effectiveness
- Medical intervention data
- Barriers to improvement

This provides everything needed for intelligent analysis without overwhelming the user.

## Sample User Journey

**Quick Follow-Up:**
1. "Any changes?" → "Somewhat better"
2. "What improved?" → "Less headache, but still tired"
3. "Daily impact?" → "Minimal"
4. "Overall rating?" → "4/10 (was 6/10)"
5. "New triggers?" → "Yes - stress at work"

**Done in 90 seconds, captures everything important.**