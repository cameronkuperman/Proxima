# Final Follow-Up System Structure

## Complete Question Flow (8 Questions Total)

### The Exact Order:
1. **Have there been any changes since last time?**
   - Much better / Somewhat better / No change / Somewhat worse / Much worse

2. **[AI Question 1]** - Condition-specific
   - Example: "Is the pain in the same location as before?"

3. **What specific changes have you noticed?** *(only shows if Q1 ≠ "No change")*
   - Free text field

4. **[AI Question 2]** - Response-based
   - Example: "What time of day is it typically worst?"

5. **Have your symptoms worsened or gotten better in severity?**
   - Much worse / Somewhat worse / About the same / Somewhat better / Much better

6. **Have you identified any new triggers or patterns?**
   - Yes → Text field appears / No / Not sure

7. **[AI Question 3]** - Progression-based
   - Example: "Have you tried anything new for relief?"

8. **Have you seen a doctor since last time?**
   - Yes → Medical modal / No

## AI Question Examples by Condition

### Headache/Migraine
- AI1: "Is the pain in the same location as before?"
- AI2: "What time of day is it typically worst?"
- AI3: "Have you tried anything new for relief?"

### Chest/Heart
- AI1: "Does it happen at rest or with activity?" [Rest/Activity/Both/Random]
- AI2: "How long do episodes typically last?"
- AI3: "Does anything reliably make it better or worse?"

### Anxiety/Mental Health
- AI1: "Are the anxious thoughts the same or different than before?"
- AI2: "How has your sleep been?" [Much worse → Much better scale]
- AI3: "What coping strategies have you been using?"

### Stomach/Digestive
- AI1: "Is the discomfort related to eating?" [Before/During/After/No connection]
- AI2: "Have you noticed any food triggers?"
- AI3: "Any changes in bowel habits?" [Yes/No + explain]

### Back/Joint/Muscle
- AI1: "Is the pain constant or does it come and go?" [Constant/Intermittent/With movement/At rest]
- AI2: "Does the pain radiate anywhere else?" [Yes/No + where]
- AI3: "What positions or activities help or hurt?"

### Skin/Rash
- AI1: "Has the affected area spread or changed size?" [Yes/No + details]
- AI2: "Any changes in color, texture, or appearance?"
- AI3: "What makes it better or worse?"

### Sleep Issues
- AI1: "What time do you typically fall asleep and wake up?"
- AI2: "How many times do you wake up during the night?" [0/1-2/3-4/5+]
- AI3: "How rested do you feel in the morning?" [Exhausted → Energized]

### Generic/Other
- AI1: "What aspect of this bothers you the most?"
- AI2: "Has anything made it noticeably better or worse?"
- AI3: "What are you most concerned about?"

## Medical Visit Modal (Optional Popup)

Only appears when user selects "Yes" to Q8:

```
📋 Medical Visit Update

Who did you see?
[Primary] [Specialist: ___] [Urgent care] [ER] [Telehealth]

What was their assessment?
[_________________________]

Did they start you on any treatments?
[_________________________]

When do you need to follow up? (optional)
[_________________________]
```

## Key Design Principles

1. **Always 8 questions** - Same for everyone, no variation by assessment type
2. **AI questions interspersed** - Better flow than all at the end
3. **Medical modal optional** - Only if they saw a doctor
4. **No 1-10 scales** - Using descriptive options instead
5. **No "life areas affected"** - Removed as requested
6. **Takes 2 minutes max** - Quick and focused

## Backend Implementation

### API Flow:
1. **GET questions** → Returns 8 questions with AI personalization
2. **POST responses** → Saves all answers including medical modal if filled
3. **AI analysis** → Processes responses to track progression

### Database Storage:
- `follow_ups` table stores all responses
- `follow_up_medical_details` stores modal data if provided
- `assessment_chains` links follow-ups to original assessment

### Question Generation:
```sql
-- Call this to get the complete 8-question set
SELECT build_follow_up_questions(
  assessment_id, 
  assessment_type,
  condition_context
);
```

## Frontend Implementation

### Component Structure:
```typescript
<FollowUpForm>
  <Question1 />  // Changes?
  <AIQuestion1 /> // Condition-specific
  <Question2 />  // Specific changes (conditional)
  <AIQuestion2 /> // Response-based
  <Question3 />  // Severity
  <Question4 />  // Triggers
  <AIQuestion3 /> // Progression-based
  <Question5 />  // Doctor visit → triggers modal
</FollowUpForm>

<MedicalVisitModal /> // Only if Q5 = Yes
```

### User Experience:
- Clean, single question per screen on mobile
- Or all questions visible with smooth scroll on desktop
- Medical modal slides up/overlays when triggered
- Submit sends all 8 responses + modal data if filled

## Summary

**Everyone gets the same flow:**
- 5 base questions (direct, no bullshit)
- 3 AI questions (personalized to their condition)
- 1 optional medical modal (4 quick fields)

**Total time: 2 minutes**
**Total questions: 8 (+ optional modal)**
**Data quality: High (structured + personalized)**