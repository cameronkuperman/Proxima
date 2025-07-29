# 🚀 Proxima-1 Backend Implementation Guide

A comprehensive guide to implementing AI-powered health intelligence features including insights generation, predictions, shadow patterns, and export functionality.

## 📋 Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Database Schema](#database-schema)
3. [API Endpoints](#api-endpoints)
4. [AI Integration](#ai-integration)
5. [Background Jobs](#background-jobs)
6. [Export Features](#export-features)
7. [Weekly Generation System](#weekly-generation-system)
8. [Deployment Guide](#deployment-guide)

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend (Next.js)                    │
├─────────────────────────────────────────────────────────────┤
│                         Supabase                             │
│  ┌────────────┐  ┌────────────┐  ┌─────────────────────┐   │
│  │   Tables   │  │    Auth    │  │   Edge Functions    │   │
│  └────────────┘  └────────────┘  └─────────────────────┘   │
├─────────────────────────────────────────────────────────────┤
│                    Railway Backend (API)                     │
│  ┌────────────┐  ┌────────────┐  ┌─────────────────────┐   │
│  │ Endpoints  │  │ Background │  │   AI Service        │   │
│  │            │  │   Jobs     │  │  (DeepSeek R1)      │   │
│  └────────────┘  └────────────┘  └─────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

---

## 💾 Database Schema

### 1. Health Insights Table

```sql
-- stores AI-generated insights for each story
CREATE TABLE IF NOT EXISTS public.health_insights (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    story_id UUID NOT NULL,
    insight_type VARCHAR(20) CHECK (insight_type IN ('positive', 'warning', 'neutral')),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    confidence INTEGER CHECK (confidence >= 0 AND confidence <= 100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    week_of DATE NOT NULL -- Monday of the week this was generated for
);

-- Indexes
CREATE INDEX idx_health_insights_user_week ON public.health_insights(user_id, week_of);
CREATE INDEX idx_health_insights_story ON public.health_insights(story_id);

-- RLS Policies
ALTER TABLE public.health_insights ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own insights" 
    ON public.health_insights FOR SELECT 
    USING (auth.uid() = user_id);
```

### 2. Health Predictions Table

```sql
-- stores AI-generated predictions
CREATE TABLE IF NOT EXISTS public.health_predictions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    story_id UUID NOT NULL,
    event_description TEXT NOT NULL,
    probability INTEGER CHECK (probability >= 0 AND probability <= 100),
    timeframe TEXT NOT NULL, -- e.g., "This week", "Next few days"
    preventable BOOLEAN DEFAULT false,
    reasoning TEXT, -- AI's explanation for the prediction
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    week_of DATE NOT NULL
);

-- Indexes & RLS
CREATE INDEX idx_health_predictions_user_week ON public.health_predictions(user_id, week_of);
ALTER TABLE public.health_predictions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own predictions" 
    ON public.health_predictions FOR SELECT 
    USING (auth.uid() = user_id);
```

### 3. Shadow Patterns Table

```sql
-- stores patterns that are missing from recent stories
CREATE TABLE IF NOT EXISTS public.shadow_patterns (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    pattern_name TEXT NOT NULL,
    last_seen_description TEXT NOT NULL,
    significance VARCHAR(10) CHECK (significance IN ('high', 'medium', 'low')),
    last_mentioned_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    week_of DATE NOT NULL
);

-- Indexes & RLS
CREATE INDEX idx_shadow_patterns_user_week ON public.shadow_patterns(user_id, week_of);
ALTER TABLE public.shadow_patterns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own patterns" 
    ON public.shadow_patterns FOR SELECT 
    USING (auth.uid() = user_id);
```

### 4. Strategic Moves Table

```sql
-- stores personalized health strategies
CREATE TABLE IF NOT EXISTS public.strategic_moves (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    strategy TEXT NOT NULL,
    strategy_type VARCHAR(20) CHECK (strategy_type IN ('discovery', 'pattern', 'prevention')),
    priority INTEGER DEFAULT 5, -- 1-10 scale
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    week_of DATE NOT NULL
);

-- Indexes & RLS
CREATE INDEX idx_strategic_moves_user_week ON public.strategic_moves(user_id, week_of);
ALTER TABLE public.strategic_moves ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own strategies" 
    ON public.strategic_moves FOR SELECT 
    USING (auth.uid() = user_id);
```

### 5. Export History Table

```sql

-- tracks PDF exports and doctor shares
CREATE TABLE IF NOT EXISTS public.export_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    export_type VARCHAR(20) CHECK (export_type IN ('pdf', 'doctor_share')),
    story_ids UUID[], -- array of story IDs included
    share_link TEXT, -- for doctor shares
    expires_at TIMESTAMP WITH TIME ZONE, -- for time-limited shares
    recipient_email TEXT, -- if shared with specific doctor
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Indexes & RLS
CREATE INDEX idx_export_history_user ON public.export_history(user_id);
CREATE INDEX idx_export_history_share_link ON public.export_history(share_link);
ALTER TABLE public.export_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own exports" 
    ON public.export_history FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Public can view shared exports" 
    ON public.export_history FOR SELECT 
    USING (
        share_link IS NOT NULL 
        AND (expires_at IS NULL OR expires_at > NOW())
    );
```

---

## 🔌 API Endpoints

### 1. Generate Weekly Analysis

```python
# POST /api/generate-weekly-analysis
# Generates insights, predictions, and shadow patterns for a user

@app.post("/api/generate-weekly-analysis")
async def generate_weekly_analysis(request: Request):
    """
    Generates complete weekly analysis including:
    - Key insights from the week's health story
    - Predictions for upcoming health events
    - Shadow patterns (missing data)
    - Strategic moves
    """
    data = await request.json()
    user_id = data.get('user_id')
    
    # Get the same data used for story generation
    health_data = await gather_user_health_data(user_id)
    
    # Generate story first if not exists
    story = await generate_or_get_weekly_story(user_id, health_data)
    
    # Generate insights
    insights = await generate_insights(user_id, story, health_data)
    
    # Generate predictions
    predictions = await generate_predictions(user_id, story, health_data)
    
    # Detect shadow patterns
    shadow_patterns = await detect_shadow_patterns(user_id, health_data)
    
    # Generate strategic moves
    strategies = await generate_strategies(user_id, insights, predictions, shadow_patterns)
    
    # Store all in database
    await store_weekly_analysis(user_id, story.id, {
        'insights': insights,
        'predictions': predictions,
        'shadow_patterns': shadow_patterns,
        'strategies': strategies
    })
    
    return {
        'status': 'success',
        'story_id': story.id,
        'analysis_generated': True
    }
```

### 2. Get Analysis Data

```python
# GET /api/health-analysis/{user_id}
# Retrieves the latest analysis for display

@app.get("/api/health-analysis/{user_id}")
async def get_health_analysis(user_id: str, week_of: Optional[str] = None):
    """
    Retrieves analysis data for the specified week
    """
    if not week_of:
        week_of = get_current_week_monday()
    
    insights = await get_insights(user_id, week_of)
    predictions = await get_predictions(user_id, week_of)
    shadow_patterns = await get_shadow_patterns(user_id, week_of)
    strategies = await get_strategies(user_id, week_of)
    
    return {
        'insights': insights,
        'predictions': predictions,
        'shadow_patterns': shadow_patterns,
        'strategies': strategies,
        'week_of': week_of
    }
```

### 3. Export to PDF

```python
# POST /api/export-pdf
# Generates a PDF of health stories with analysis

@app.post("/api/export-pdf")
async def export_pdf(request: Request):
    """
    Creates a professional PDF report
    """
    data = await request.json()
    user_id = data.get('user_id')
    story_ids = data.get('story_ids', [])
    include_analysis = data.get('include_analysis', True)
    
    # Gather stories and analysis
    stories = await get_stories(story_ids)
    analysis = await get_analysis_for_stories(story_ids) if include_analysis else None
    
    # Generate PDF using ReportLab or similar
    pdf_buffer = await generate_health_report_pdf(
        user_id=user_id,
        stories=stories,
        analysis=analysis,
        include_notes=True
    )
    
    # Upload to cloud storage
    pdf_url = await upload_pdf_to_storage(pdf_buffer, user_id)
    
    # Record export
    await record_export(user_id, 'pdf', story_ids)
    
    return {
        'status': 'success',
        'pdf_url': pdf_url,
        'expires_in': 3600  # 1 hour
    }
```

### 4. Share with Doctor

```python
# POST /api/share-with-doctor
# Creates a shareable link for healthcare providers

@app.post("/api/share-with-doctor")
async def share_with_doctor(request: Request):
    """
    Creates a secure, time-limited share link
    """
    data = await request.json()
    user_id = data.get('user_id')
    story_ids = data.get('story_ids', [])
    recipient_email = data.get('recipient_email')
    expires_in_days = data.get('expires_in_days', 30)
    
    # Generate unique share link
    share_token = generate_secure_token()
    share_link = f"https://proxima-1.health/shared/{share_token}"
    
    # Store share details
    expires_at = datetime.utcnow() + timedelta(days=expires_in_days)
    await create_share_record(
        user_id=user_id,
        story_ids=story_ids,
        share_link=share_link,
        expires_at=expires_at,
        recipient_email=recipient_email
    )
    
    # Optional: Send email to doctor
    if recipient_email:
        await send_share_notification(recipient_email, share_link, user_id)
    
    return {
        'status': 'success',
        'share_link': share_link,
        'expires_at': expires_at.isoformat()
    }
```

---

## 🤖 AI Integration

### DeepSeek R1 Integration

```python
# ai_service.py
import httpx
from typing import List, Dict, Any

class DeepSeekHealthAnalyzer:
    def __init__(self, api_key: str):
        self.api_key = api_key
        self.base_url = "https://api.deepseek.com/v1"
        
    async def generate_insights(self, story: str, health_data: Dict) -> List[Dict]:
        """
        Generates key insights from health story
        """
        prompt = f"""
        Based on this health story and data, generate 3-5 key insights.
        
        Health Story:
        {story}
        
        Health Data Summary:
        - Oracle chats: {health_data.get('oracle_chats', 0)}
        - Quick scans: {health_data.get('quick_scans', 0)}
        - Deep dives: {health_data.get('deep_dives', 0)}
        - Recent symptoms: {', '.join(health_data.get('recent_symptoms', []))}
        
        For each insight, provide:
        1. Type: 'positive', 'warning', or 'neutral'
        2. Title: Brief, impactful statement (max 10 words)
        3. Description: One sentence explanation
        4. Confidence: 0-100 based on data strength
        
        Focus on actionable, specific insights that help the user understand their health patterns.
        
        Return as JSON array.
        """
        
        response = await self._call_api(prompt)
        return self._parse_insights(response)
    
    async def generate_predictions(self, story: str, health_data: Dict) -> List[Dict]:
        """
        Generates health predictions
        """
        prompt = f"""
        Based on this health story and patterns, generate 2-3 health predictions.
        
        Health Story:
        {story}
        
        Health Patterns:
        {health_data.get('patterns', {})}
        
        For each prediction:
        1. Event: General health event (not specific conditions like "migraine")
           Examples: "Energy fluctuations", "Sleep quality changes", "Symptom flare-up"
        2. Probability: 0-100
        3. Timeframe: "This week", "Next few days", "Coming weekend"
        4. Preventable: true/false
        5. Reasoning: Brief explanation of why this might occur
        
        Be supportive, not alarming. Focus on patterns, not diagnoses.
        
        Return as JSON array.
        """
        
        response = await self._call_api(prompt)
        return self._parse_predictions(response)
    
    async def detect_shadow_patterns(self, current_data: Dict, historical_data: Dict) -> List[Dict]:
        """
        Identifies missing patterns from recent stories
        """
        prompt = f"""
        Compare current week's health data with historical patterns.
        
        Current Week:
        {current_data}
        
        Historical Patterns (last 4 weeks):
        {historical_data}
        
        Identify 3-4 patterns that were previously prominent but are missing this week.
        
        For each shadow pattern:
        1. Pattern name: Brief descriptor (e.g., "Exercise", "Stress mentions")
        2. Last seen: Description of when/how it appeared before
        3. Significance: 'high', 'medium', or 'low' based on pattern importance
        
        Return as JSON array.
        """
        
        response = await self._call_api(prompt)
        return self._parse_shadow_patterns(response)
    
    async def generate_strategies(self, insights: List, predictions: List, patterns: List) -> List[Dict]:
        """
        Creates personalized strategic moves
        """
        prompt = f"""
        Based on these insights, predictions, and missing patterns, suggest 5 strategic health moves.
        
        Insights: {insights}
        Predictions: {predictions}
        Shadow Patterns: {patterns}
        
        For each strategy:
        1. Strategy: Specific, actionable suggestion (one sentence)
        2. Type: 'discovery' (learn something), 'pattern' (track correlation), or 'prevention'
        3. Priority: 1-10 based on potential impact
        
        Make strategies specific and achievable. Focus on data gathering and pattern discovery.
        
        Return as JSON array.
        """
        
        response = await self._call_api(prompt)
        return self._parse_strategies(response)
    
    async def _call_api(self, prompt: str) -> str:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.base_url}/chat/completions",
                headers={"Authorization": f"Bearer {self.api_key}"},
                json={
                    "model": "deepseek-r1",
                    "messages": [{"role": "user", "content": prompt}],
                    "temperature": 0.7,
                    "response_format": {"type": "json_object"}
                }
            )
            return response.json()["choices"][0]["message"]["content"]
```

---

## ⚙️ Background Jobs

### Weekly Generation Cron Job

```python
# cron_jobs.py
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from datetime import datetime, timedelta

scheduler = AsyncIOScheduler()

@scheduler.scheduled_job('cron', day_of_week='mon', hour=9, minute=0)
async def weekly_health_analysis_job():
    """
    Runs every Monday at 9 AM UTC
    Generates health analysis for all active users
    """
    print(f"Starting weekly health analysis generation at {datetime.utcnow()}")
    
    # Get all active users
    active_users = await get_active_users()
    
    # Process in batches to avoid overload
    batch_size = 50
    for i in range(0, len(active_users), batch_size):
        batch = active_users[i:i + batch_size]
        
        # Process each user
        tasks = []
        for user in batch:
            task = generate_user_weekly_analysis(user['id'])
            tasks.append(task)
        
        # Run batch concurrently
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        # Log results
        for user, result in zip(batch, results):
            if isinstance(result, Exception):
                print(f"Failed to generate analysis for user {user['id']}: {result}")
            else:
                print(f"Successfully generated analysis for user {user['id']}")
        
        # Small delay between batches
        await asyncio.sleep(5)
    
    print(f"Completed weekly health analysis generation at {datetime.utcnow()}")

async def generate_user_weekly_analysis(user_id: str):
    """
    Generates complete analysis for a single user
    """
    try:
        # Check if story exists for this week
        week_start = get_current_week_monday()
        existing_story = await get_story_for_week(user_id, week_start)
        
        if not existing_story:
            # Generate story first
            await generate_weekly_story(user_id)
        
        # Generate analysis
        await generate_weekly_analysis({'user_id': user_id})
        
        return {'user_id': user_id, 'status': 'success'}
    except Exception as e:
        return {'user_id': user_id, 'status': 'error', 'error': str(e)}
```

### Manual Refresh Handling

```python
# refresh_handler.py
async def handle_manual_refresh(user_id: str) -> Dict:
    """
    Handles manual refresh requests with rate limiting
    """
    # Check refresh limit (10 per week)
    refresh_count = await get_user_refresh_count(user_id)
    
    if refresh_count >= 10:
        return {
            'status': 'error',
            'message': 'Weekly refresh limit reached',
            'refreshes_used': refresh_count,
            'refreshes_remaining': 0
        }
    
    # Record refresh
    await record_refresh(user_id)
    
    # Generate new analysis
    await generate_weekly_analysis({'user_id': user_id})
    
    return {
        'status': 'success',
        'refreshes_used': refresh_count + 1,
        'refreshes_remaining': 9 - refresh_count
    }
```

---

## 📤 Export Features

### PDF Generation

```python
# pdf_generator.py
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter, A4
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch

async def generate_health_report_pdf(user_id: str, stories: List, analysis: Dict, include_notes: bool):
    """
    Generates a professional health report PDF
    """
    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter)
    elements = []
    styles = getSampleStyleSheet()
    
    # Custom styles
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=24,
        textColor=colors.HexColor('#6B46C1'),
        spaceAfter=30
    )
    
    # Title page
    elements.append(Paragraph("Health Intelligence Report", title_style))
    elements.append(Spacer(1, 0.2*inch))
    
    # User info
    user_info = await get_user_info(user_id)
    elements.append(Paragraph(f"Patient: {user_info['name']}", styles['Normal']))
    elements.append(Paragraph(f"Generated: {datetime.now().strftime('%B %d, %Y')}", styles['Normal']))
    elements.append(Spacer(1, 0.5*inch))
    
    # Stories section
    for story in stories:
        elements.append(Paragraph(story['title'], styles['Heading2']))
        elements.append(Paragraph(f"Week of {story['date']}", styles['Italic']))
        elements.append(Spacer(1, 0.2*inch))
        elements.append(Paragraph(story['content'], styles['Normal']))
        
        # Include personal notes if requested
        if include_notes and story.get('note'):
            elements.append(Spacer(1, 0.2*inch))
            elements.append(Paragraph("Personal Note:", styles['Heading3']))
            elements.append(Paragraph(story['note'], styles['Italic']))
        
        elements.append(Spacer(1, 0.5*inch))
    
    # Analysis section
    if analysis:
        elements.append(Paragraph("Health Analysis", styles['Heading1']))
        
        # Key Insights
        if analysis.get('insights'):
            elements.append(Paragraph("Key Insights", styles['Heading2']))
            for insight in analysis['insights']:
                elements.append(Paragraph(f"• {insight['title']}", styles['Normal']))
                elements.append(Paragraph(f"  {insight['description']}", styles['Italic']))
                elements.append(Spacer(1, 0.1*inch))
        
        # Predictions
        if analysis.get('predictions'):
            elements.append(Paragraph("Health Outlook", styles['Heading2']))
            for pred in analysis['predictions']:
                elements.append(Paragraph(
                    f"• {pred['event']} - {pred['probability']}% likelihood {pred['timeframe'].lower()}", 
                    styles['Normal']
                ))
                elements.append(Spacer(1, 0.1*inch))
    
    # Build PDF
    doc.build(elements)
    buffer.seek(0)
    return buffer
```

### Doctor Share Page

```python
# share_handler.py
@app.get("/shared/{share_token}")
async def view_shared_report(share_token: str):
    """
    Renders the shared health report page
    """
    # Validate share token
    share_record = await get_share_record(share_token)
    
    if not share_record:
        raise HTTPException(status_code=404, detail="Share link not found")
    
    if share_record['expires_at'] and share_record['expires_at'] < datetime.utcnow():
        raise HTTPException(status_code=410, detail="Share link has expired")
    
    # Get stories and analysis
    stories = await get_stories(share_record['story_ids'])
    analysis = await get_analysis_for_stories(share_record['story_ids'])
    
    # Render professional medical view
    return templates.TemplateResponse("shared_report.html", {
        "stories": stories,
        "analysis": analysis,
        "patient_id": share_record['user_id'],
        "generated_date": datetime.utcnow()
    })
```

---

## 🕐 Weekly Generation System

### Complete Weekly Flow

```python
# weekly_generation_flow.py
async def complete_weekly_generation(user_id: str):
    """
    Complete weekly generation flow for a user
    """
    week_start = get_current_week_monday()
    
    # Step 1: Gather all health data
    health_data = await gather_health_data_for_week(user_id, week_start)
    
    # Step 2: Generate or get story
    story = await generate_or_get_story(user_id, health_data, week_start)
    
    # Step 3: Generate insights
    insights = await ai_service.generate_insights(story.content, health_data)
    await store_insights(user_id, story.id, insights, week_start)
    
    # Step 4: Generate predictions
    predictions = await ai_service.generate_predictions(story.content, health_data)
    await store_predictions(user_id, story.id, predictions, week_start)
    
    # Step 5: Detect shadow patterns
    historical_data = await get_historical_data(user_id, weeks=4)
    shadow_patterns = await ai_service.detect_shadow_patterns(health_data, historical_data)
    await store_shadow_patterns(user_id, shadow_patterns, week_start)
    
    # Step 6: Generate strategies
    strategies = await ai_service.generate_strategies(insights, predictions, shadow_patterns)
    await store_strategies(user_id, strategies, week_start)
    
    # Step 7: Send notification (optional)
    await notify_user_analysis_ready(user_id)
    
    return {
        'user_id': user_id,
        'week_of': week_start,
        'story_id': story.id,
        'insights_count': len(insights),
        'predictions_count': len(predictions),
        'patterns_count': len(shadow_patterns),
        'strategies_count': len(strategies)
    }
```

---

## 🚀 Deployment Guide

### Environment Variables

```bash
# .env
DATABASE_URL=postgresql://user:pass@host:5432/proxima
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-key
DEEPSEEK_API_KEY=your-deepseek-api-key
REDIS_URL=redis://localhost:6379
AWS_S3_BUCKET=proxima-exports
AWS_ACCESS_KEY_ID=your-aws-key
AWS_SECRET_ACCESS_KEY=your-aws-secret
```

### Railway Deployment

```yaml
# railway.toml
[build]
builder = "NIXPACKS"

[deploy]
startCommand = "uvicorn main:app --host 0.0.0.0 --port $PORT"
healthcheckPath = "/health"
healthcheckTimeout = 100

[environments.production]
PYTHON_VERSION = "3.11"
```

### Dockerfile (Alternative)

```dockerfile
FROM python:3.11-slim

WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy app
COPY . .

# Run migrations
RUN python migrate.py

# Start server
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### Required Dependencies

```txt
# requirements.txt
fastapi==0.104.1
uvicorn==0.24.0
httpx==0.25.2
supabase==2.0.3
apscheduler==3.10.4
reportlab==4.0.7
redis==5.0.1
boto3==1.29.7
pydantic==2.5.0
python-multipart==0.0.6
```

---

## 🔧 Implementation Checklist

- [ ] Run all database migrations
- [ ] Set up Supabase RLS policies
- [ ] Configure DeepSeek API access
- [ ] Deploy backend to Railway
- [ ] Set up cron job scheduler
- [ ] Configure S3 for PDF storage
- [ ] Test weekly generation flow
- [ ] Implement error monitoring
- [ ] Set up rate limiting
- [ ] Configure CORS for frontend

---

## 📊 Monitoring & Logs

```python
# monitoring.py
import logging
from datetime import datetime

class HealthAnalyticsLogger:
    def __init__(self):
        self.logger = logging.getLogger('health_analytics')
        
    async def log_generation(self, user_id: str, status: str, details: Dict):
        """Log generation events for monitoring"""
        await self.logger.info({
            'event': 'weekly_generation',
            'user_id': user_id,
            'status': status,
            'timestamp': datetime.utcnow(),
            'details': details
        })
    
    async def log_export(self, user_id: str, export_type: str):
        """Log export events"""
        await self.logger.info({
            'event': 'export',
            'user_id': user_id,
            'export_type': export_type,
            'timestamp': datetime.utcnow()
        })
```

---

## 🎯 Next Steps

1. **Deploy Database Changes**: Run all migrations in order
2. **Set Up AI Service**: Configure DeepSeek R1 integration
3. **Deploy Backend**: Push to Railway with environment variables
4. **Test Generation**: Run manual generation for test users
5. **Enable Cron**: Activate weekly generation schedule
6. **Monitor**: Set up logging and error tracking

This guide provides a complete implementation path for all backend features. Each component is designed to work together seamlessly while maintaining scalability and reliability.