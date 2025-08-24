# Improved Medical Visit Modal Design

## Current Problems with Standard Medical Questions
- Too formal/clinical
- Doesn't capture what actually matters to patients
- Missing emotional/practical aspects
- Doesn't help with next steps

## Redesigned Modal Structure

### Section 1: Quick Summary
```
📋 What Happened?

Who did you see?
[Primary doctor] [Specialist: ____] [Urgent care] [ER] [Telehealth]

In one sentence, what did they say?
[Free text - e.g., "It's probably just stress but they want to run tests"]

How helpful was the visit?
😞 Not helpful   😐 Somewhat   😊 Very helpful
```

### Section 2: The Verdict (Diagnosis)
```
🔍 What They Think It Is

Did they tell you what's wrong?
[Yes, definitely] [Maybe/Probably] [Still testing] [Ruled things out]

If yes/maybe, what is it?
[Text field]

How confident did they seem?
[Very sure] [Pretty confident] [Still investigating] [Not sure at all]

Did this match what you expected?
[Yes] [No - I thought it was: ____] [I had no idea]
```

### Section 3: The Plan (What Now?)
```
📝 Treatment & Next Steps

Medications:
☐ Started new medication: [____]
   → Have you filled it yet? [Yes/No/Planning to]
☐ Stopped medication: [____]
☐ Changed dose of: [____]
☐ No medication changes

Other treatments:
☐ Physical therapy
☐ Procedure scheduled: [____]
☐ Lifestyle changes: [____]
☐ Wait and see
☐ Other: [____]

Tests:
☐ Blood work → [Done/Scheduled/Need to schedule]
☐ Imaging (X-ray/MRI/CT) → [Done/Scheduled/Need to schedule]
☐ Other test: [____] → [Done/Scheduled/Need to schedule]
```

### Section 4: Follow-Up & Red Flags
```
⏰ What's Next?

When should you follow up?
[Dropdown: 1 week / 2 weeks / 1 month / 3 months / As needed / Not sure]

Were you referred anywhere?
[No] [Yes - Specialist: ____] [Yes - Already scheduled for: ____]

They said to come back immediately if:
[Text - e.g., "Fever over 101, chest pain, can't breathe"]
```

### Section 5: Your Take (Patient Perspective)
```
💭 How Do You Feel About It?

Main concern addressed?
[Yes, completely] [Partially] [Not really] [Made me more worried]

Do you understand what to do next?
[Crystal clear] [Mostly clear] [A bit confused] [Very confused]

Biggest worry right now:
[Text - e.g., "What if the medication doesn't work?"]

Questions you forgot to ask:
[Text - optional]

Anything else to remember?
[Text - e.g., "Doctor said to call if not better in 3 days"]
```

## Smart Follow-Ups Based on Modal Responses

### If medication started:
- 3 days later: "How are the new meds working? Any side effects?"
- 1 week later: "Still taking [medication]? How's it going?"

### If tests ordered:
- 2 days later: "Were you able to schedule your [test]?"
- After test date: "How did the [test] go? When will you get results?"

### If referral made:
- 1 week later: "Were you able to get an appointment with [specialist]?"

### If "confused" about next steps:
- Next day: "Would you like help understanding your treatment plan?"

### If red flags listed:
- Include in next follow-up: "You mentioned to watch for [symptoms]. Any of those happening?"

## Key Improvements

### 1. **Conversational Tone**
- "What did they say?" vs "Diagnosis given"
- "How helpful was it?" vs "Outcome of visit"

### 2. **Action Tracking**
- Not just "medication prescribed" but "have you filled it?"
- Not just "tests ordered" but "scheduled yet?"

### 3. **Emotional Component**
- How confident was the doctor?
- Did it match your expectations?
- How do YOU feel about it?

### 4. **Practical Next Steps**
- Clear checkboxes for what needs to be done
- Status tracking for each action item

### 5. **Memory Aids**
- "Questions you forgot to ask" - for next visit
- "Anything else to remember" - important details

## Implementation Example

```typescript
interface MedicalVisitModal {
  // Quick Summary
  provider: 'primary' | 'specialist' | 'urgent' | 'er' | 'telehealth';
  specialistType?: string;
  summary: string; // One sentence
  helpfulness: 1 | 2 | 3; // 😞😐😊
  
  // Diagnosis
  diagnosisGiven: 'definite' | 'probable' | 'testing' | 'ruled_out';
  diagnosis?: string;
  doctorConfidence: 'very' | 'pretty' | 'investigating' | 'unsure';
  matchedExpectation: boolean;
  expectedDiagnosis?: string;
  
  // Treatment
  medications: {
    started: Array<{name: string, filled: 'yes' | 'no' | 'will'}>,
    stopped: string[],
    adjusted: string[]
  };
  otherTreatments: string[];
  tests: Array<{
    type: string,
    status: 'done' | 'scheduled' | 'need_to_schedule'
  }>;
  
  // Follow-up
  followUpTimeline: string;
  referrals?: string;
  redFlags?: string;
  
  // Patient perspective
  concernAddressed: 'yes' | 'partially' | 'no' | 'more_worried';
  clarity: 'crystal' | 'mostly' | 'confused' | 'very_confused';
  biggestWorry?: string;
  forgotToAsk?: string;
  notes?: string;
}
```

## Benefits

1. **Captures the full story** - not just clinical facts
2. **Tracks action items** - helps ensure follow-through
3. **Emotional context** - helps AI understand patient state
4. **Practical focus** - what actually needs to happen next
5. **Memory support** - captures things to remember/ask

This design makes the medical visit modal actually useful for both the patient (tracking what to do) and the AI (understanding the full context of their care).