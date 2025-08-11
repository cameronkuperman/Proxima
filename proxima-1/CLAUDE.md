# Seimeo-1: AI-Powered Health Intelligence Platform

## Project Overview
Seimeo-1 is a next-generation health technology platform that combines 3D body visualization, advanced AI reasoning, and intelligent photo analysis to provide instant, accurate health insights. Think of it as your personal health AI that helps you understand symptoms before deciding if you need to see a doctor.

## Core Value Proposition
**"Point. Describe. Understand."** - Get instant AI-powered health insights through intuitive 3D body mapping and photo analysis.

## Key Features

### 1. 3D Body Mapping (BioDigital API Integration)
- Interactive 3D human model for precise symptom location
- Click on exact body areas to trigger targeted symptom forms
- Context-aware questioning based on selected region

### 2. Dual Analysis Modes
- **Quick Scan**: Instant results using fast AI models
  - Potential diagnoses
  - Recommended next steps
  - Warning signs to watch for
- **Deep Dive**: Comprehensive analysis using advanced reasoning models (O3-level)
  - Follow-up questions for better accuracy
  - Chain-of-thought reasoning
  - More detailed insights and recommendations

### 3. Photo Analysis
- **Single Photo Analysis**: Immediate assessment of visible symptoms
- **Time-Series Tracking**: Upload multiple photos over time
  - Track symptom progression
  - Identify changes and patterns
  - Get trend-based insights

### 4. Doctor Reports
- Generate professional medical reports from chat histories
- Formatted for healthcare providers
- Comprehensive symptom documentation

## Target Audience
- Primary: Individuals seeking quick health insights or second opinions
- Secondary: People tracking chronic conditions over time
- Tertiary: Patients preparing for doctor visits

## Trust & Credibility
- Medical Advisors: Dr. Paul Kuperman & Dr. Edward Botse-Baidoo
- Powered by leading AI models from:
  - OpenAI
  - Anthropic
  - Google
  - xAI

## Design Philosophy
Inspired by Linear and Stripe - clean, modern, and trustworthy with smooth animations and a focus on clarity. Dark/light mode with geometric elements and subtle depth.

## Website Structure
```
/
├── Hero Section (Animated tagline + main value prop)
├── How It Works (3-step process visualization)
├── Features (3D mapping, photo analysis, AI modes)
├── AI Partners (Logo garden of AI providers)
├── Medical Advisors 
├── Testimonials
├── Pricing (if applicable)
└── Footer with CTA
```

## Technical Stack
- Next.js 14+ with App Router
- Tailwind CSS for styling
- Framer Motion for animations
- BioDigital Human API for 3D models
- AI integrations via respective APIs

## Brand Personality
- **Trustworthy**: Medical-grade accuracy with human touch
- **Innovative**: Cutting-edge AI meets intuitive design  
- **Accessible**: Complex health analysis made simple
- **Empowering**: Put health insights in users' hands

## Key Differentiators
1. **3D Precision**: Click exactly where it hurts
2. **Multi-Modal AI**: Combining text, visual, and temporal analysis
3. **Reasoning Transparency**: See how AI reaches conclusions
4. **Time-Series Intelligence**: Track changes over days/weeks/months
5. **Doctor-Ready Reports**: Bridge between self-care and professional care

## Messaging Guidelines
- Lead with user benefits, not technology
- Emphasize speed and accuracy
- Build trust through transparency
- Show, don't just tell (demos, examples)
- Keep medical claims responsible and accurate

## Future Roadmap Hints
- Wearable device integration
- Telemedicine connections
- Family health tracking
- Prescription interaction checking
- Mental health modules

---
*This document serves as the source of truth for Seimeo-1's product vision and implementation guidelines.*

# Important Implementation Instructions

## Backend API Guidelines

**NEVER modify API request/response structures without understanding the backend implementation.**

### Critical Rules:
1. The backend API is fully documented in `BACKEND_API_DOCS.md` - always refer to this
2. Quick Scan is working correctly - use it as a reference implementation
3. Deep Dive uses the same structure as Quick Scan (nested `form_data` object)
4. The continue endpoint expects `answer` NOT `user_answer`
5. If API returns empty/blank responses, the issue is likely on the backend side, not the request format
6. Always check existing working code (like Quick Scan) before modifying API calls

### API Structure Reference:
- Quick Scan sends: `{ body_part, form_data: { symptoms, painLevel, ... }, user_id }`
- Deep Dive Start sends: `{ body_part, form_data: { symptoms, ... }, user_id, model }`
- Deep Dive Continue sends: `{ session_id, answer, question_number }`
- Deep Dive Complete sends: `{ session_id, final_answer }`

### Photo Analysis API Guidelines:
**CRITICAL: The backend photo analysis API has specific requirements:**

1. **Authentication**: Backend expects `user_id` in request body/FormData, NOT from auth headers
2. **Session Creation**: Backend returns `session_id` not `id`. Frontend normalizes to `id` in usePhotoAnalysis hook
3. **Photo Upload**: 
   - Call backend directly at `${API_URL}/api/photo-analysis/upload`
   - Send `user_id` and `session_id` in FormData
   - Do NOT use local `/api/photo-upload` endpoint for backend calls
4. **GET Endpoints**: For fetching sessions, use Supabase directly (existing implementation)
5. **POST Endpoints**: For uploads/analysis, use backend API with user_id in body

**WORKING Photo Upload Implementation:**
```javascript
// In usePhotoAnalysis.ts
const formData = new FormData();
photos.forEach(photo => formData.append('photos', photo));
formData.append('user_id', userId);  // Required by backend
formData.append('session_id', sessionId);

const response = await fetch(`${API_URL}/api/photo-analysis/upload`, {
  method: 'POST',
  body: formData
});
```

**Session ID Handling:**
- Backend returns `session_id` in response
- Frontend hook normalizes to `id` for consistency
- Always use `session.id` in frontend, it maps to backend's `session_id`

### Continue Tracking / Follow-up Photos API:
**CRITICAL: Follow-up endpoint has different requirements than initial upload:**

1. **NO user_id needed** - Backend gets it from session record
2. **Endpoint**: `POST /api/photo-analysis/session/{sessionId}/follow-up`
3. **FormData structure**:
   ```javascript
   const formData = new FormData();
   photos.forEach(photo => formData.append('photos', photo));  // Max 5 files
   formData.append('auto_compare', 'true');  // or 'false' - string required
   if (notes) formData.append('notes', notes);
   if (comparePhotoIds) formData.append('compare_with_photo_ids', JSON.stringify(photoIds));
   ```

4. **Common Errors**:
   - 400: More than 5 photos uploaded
   - 404: Session ID doesn't exist
   - 500: Database/API issues

5. **UI Rules**:
   - "View Progression Analysis" button only shows for follow-up analyses
   - Available only in continue tracking mode
   - Shows comparison with previous photos when auto_compare is true

### When Backend Returns Empty Responses:
1. Add logging but DO NOT change request structure
2. Implement fallback questions on frontend
3. The backend might be having model issues - try different models
4. Check Railway logs for actual backend errors

## General Development Rules

Do what has been asked; nothing more, nothing less.
NEVER create files unless they're absolutely necessary for achieving your goal.
ALWAYS prefer editing an existing file to creating a new one.
NEVER proactively create documentation files (*.md) or README files unless explicitly requested.