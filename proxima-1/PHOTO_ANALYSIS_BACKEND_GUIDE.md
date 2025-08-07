# Photo Analysis Backend Integration Guide

## Overview
This guide provides comprehensive information for backend developers to implement all photo analysis features including core functionality, sensitive content handling, follow-up tracking, and reminder systems.

## Table of Contents
1. [API Endpoints Overview](#api-endpoints-overview)
2. [Database Schema Requirements](#database-schema-requirements)
3. [Core Photo Analysis](#core-photo-analysis)
4. [Sensitive Content Handling](#sensitive-content-handling)
5. [Follow-up & Reminder System](#follow-up--reminder-system)
6. [Report Integration](#report-integration)
7. [Error Handling](#error-handling)
8. [Security Considerations](#security-considerations)

## API Endpoints Overview

### Core Photo Analysis Endpoints
- `POST /api/photo-analysis/sessions` - Create new photo session
- `POST /api/photo-analysis/upload` - Upload photos with categorization
- `POST /api/photo-analysis/analyze` - Analyze uploaded photos
- `GET /api/photo-analysis/sessions` - Get user's photo sessions
- `POST /api/photo-analysis/categorize` - Categorize single photo

### Follow-up & Timeline Endpoints
- `POST /api/photo-analysis/session/{session_id}/follow-up` - Add follow-up photos
- `GET /api/photo-analysis/session/{session_id}/timeline` - Get session timeline

### Reminder Endpoints
- `POST /api/photo-analysis/reminders/configure` - Configure reminder
- `POST /api/photo-analysis/monitoring/suggest` - Get AI monitoring suggestions
- `PATCH /api/photo-analysis/reminders/{reminder_id}` - Update reminder
- `DELETE /api/photo-analysis/reminders/{reminder_id}` - Delete reminder

### Export & Reporting Endpoints
- `POST /api/photo-analysis/session/{session_id}/export` - Export session
- `POST /api/photo-analysis/reports/photo-analysis` - Generate photo analysis report

## Database Schema Requirements

### Core Tables

#### photo_sessions
```sql
CREATE TABLE photo_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id),
    condition_name VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_photo_at TIMESTAMP,
    is_sensitive BOOLEAN DEFAULT FALSE,
    latest_summary TEXT,
    thumbnail_url TEXT
);

CREATE INDEX idx_photo_sessions_user_id ON photo_sessions(user_id);
CREATE INDEX idx_photo_sessions_created_at ON photo_sessions(created_at);
```

#### photo_uploads
```sql
CREATE TABLE photo_uploads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES photo_sessions(id),
    user_id UUID NOT NULL REFERENCES users(id),
    file_path TEXT,
    category VARCHAR(50) NOT NULL CHECK (category IN ('medical_normal', 'medical_sensitive', 'medical_gore', 'unclear', 'non_medical', 'inappropriate')),
    stored BOOLEAN DEFAULT TRUE,
    preview_url TEXT,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    temporary_data TEXT, -- For sensitive photos
    expires_at TIMESTAMP
);

CREATE INDEX idx_photo_uploads_session_id ON photo_uploads(session_id);
CREATE INDEX idx_photo_uploads_category ON photo_uploads(category);
CREATE INDEX idx_photo_uploads_temporary_data ON photo_uploads(uploaded_at) WHERE temporary_data IS NOT NULL;
```

#### photo_analyses
```sql
CREATE TABLE photo_analyses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES photo_sessions(id),
    photo_ids UUID[] NOT NULL,
    primary_assessment TEXT NOT NULL,
    confidence NUMERIC(3,0) CHECK (confidence >= 0 AND confidence <= 100),
    visual_observations TEXT[],
    differential_diagnosis TEXT[],
    recommendations TEXT[],
    red_flags TEXT[],
    trackable_metrics JSONB,
    comparison_data JSONB,
    analyzed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP
);

CREATE INDEX idx_photo_analyses_session_id ON photo_analyses(session_id);
CREATE INDEX idx_photo_analyses_analyzed_at ON photo_analyses(analyzed_at);
```

#### photo_reminders
```sql
CREATE TABLE photo_reminders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES photo_sessions(id),
    analysis_id UUID REFERENCES photo_analyses(id),
    user_id UUID NOT NULL REFERENCES users(id),
    enabled BOOLEAN DEFAULT TRUE,
    interval_days INTEGER NOT NULL,
    reminder_method VARCHAR(20) NOT NULL CHECK (reminder_method IN ('email', 'sms', 'in_app', 'none')),
    reminder_text TEXT,
    contact_email VARCHAR(255),
    contact_phone VARCHAR(50),
    next_reminder_date TIMESTAMP NOT NULL,
    last_reminder_sent TIMESTAMP,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed')),
    ai_reasoning TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_photo_reminders_user_id ON photo_reminders(user_id);
CREATE INDEX idx_photo_reminders_next_reminder ON photo_reminders(next_reminder_date) WHERE status = 'active';
```

## Core Photo Analysis

### 1. Create Photo Session
```python
@app.post("/api/photo-analysis/sessions")
async def create_photo_session(request: CreateSessionRequest):
    # Validate user_id
    if not request.user_id:
        raise HTTPException(400, "user_id is required")
    
    # Create session
    session = {
        "id": str(uuid.uuid4()),
        "user_id": request.user_id,
        "condition_name": request.condition_name,
        "description": request.description,
        "created_at": datetime.utcnow(),
        "photo_count": 0,
        "analysis_count": 0,
        "is_sensitive": False
    }
    
    # Insert into database
    db.execute("""
        INSERT INTO photo_sessions (id, user_id, condition_name, description)
        VALUES (%(id)s, %(user_id)s, %(condition_name)s, %(description)s)
    """, session)
    
    return {"session_id": session["id"], **session}
```

### 2. Upload Photos with Categorization
```python
@app.post("/api/photo-analysis/upload")
async def upload_photos(
    photos: List[UploadFile],
    session_id: str = Form(...),
    user_id: str = Form(...)
):
    uploaded_photos = []
    requires_action = None
    
    for photo in photos[:5]:  # Max 5 photos
        # Validate file
        if photo.size > 10 * 1024 * 1024:
            raise HTTPException(413, "File too large (max 10MB)")
        
        if photo.content_type not in ALLOWED_TYPES:
            raise HTTPException(400, f"Invalid file type: {photo.content_type}")
        
        # Categorize photo using AI
        category = await categorize_photo_with_ai(photo)
        
        # Handle based on category
        if category == "medical_sensitive":
            # Store temporarily in database
            photo_data = base64.b64encode(await photo.read()).decode()
            photo_id = str(uuid.uuid4())
            
            db.execute("""
                INSERT INTO photo_uploads 
                (id, session_id, user_id, category, stored, temporary_data, expires_at)
                VALUES (%(id)s, %(session_id)s, %(user_id)s, %(category)s, FALSE, %(data)s, %(expires)s)
            """, {
                "id": photo_id,
                "session_id": session_id,
                "user_id": user_id,
                "category": category,
                "data": photo_data,
                "expires": datetime.utcnow() + timedelta(hours=24)
            })
            
            uploaded_photos.append({
                "id": photo_id,
                "category": category,
                "stored": False,
                "preview_url": None
            })
            
            requires_action = {
                "type": "sensitive_modal",
                "affected_photos": [photo_id],
                "message": "Sensitive content detected. Photos will be analyzed temporarily without permanent storage."
            }
        
        elif category in ["medical_normal", "medical_gore"]:
            # Store normally
            file_path = await store_photo_securely(photo, user_id)
            preview_url = generate_secure_url(file_path)
            photo_id = str(uuid.uuid4())
            
            db.execute("""
                INSERT INTO photo_uploads 
                (id, session_id, user_id, file_path, category, preview_url)
                VALUES (%(id)s, %(session_id)s, %(user_id)s, %(path)s, %(category)s, %(url)s)
            """, {
                "id": photo_id,
                "session_id": session_id,
                "user_id": user_id,
                "path": file_path,
                "category": category,
                "url": preview_url
            })
            
            uploaded_photos.append({
                "id": photo_id,
                "category": category,
                "stored": True,
                "preview_url": preview_url
            })
    
    # Update session
    db.execute("""
        UPDATE photo_sessions 
        SET last_photo_at = CURRENT_TIMESTAMP,
            is_sensitive = is_sensitive OR %(has_sensitive)s
        WHERE id = %(session_id)s
    """, {
        "session_id": session_id,
        "has_sensitive": any(p["category"] == "medical_sensitive" for p in uploaded_photos)
    })
    
    return {
        "session_id": session_id,
        "uploaded_photos": uploaded_photos,
        "requires_action": requires_action
    }
```

### 3. Analyze Photos
```python
@app.post("/api/photo-analysis/analyze")
async def analyze_photos(request: AnalyzeRequest):
    photos_data = []
    
    # Retrieve photo data
    for photo_id in request.photo_ids:
        photo = db.fetchone("""
            SELECT id, file_path, temporary_data, category 
            FROM photo_uploads 
            WHERE id = %(id)s AND session_id = %(session_id)s
        """, {"id": photo_id, "session_id": request.session_id})
        
        if not photo:
            raise HTTPException(404, f"Photo {photo_id} not found")
        
        # Get photo data
        if photo["temporary_data"]:
            # Sensitive photo stored temporarily
            photo_data = base64.b64decode(photo["temporary_data"])
        else:
            # Normal photo from file storage
            photo_data = await read_photo_from_storage(photo["file_path"])
        
        photos_data.append(photo_data)
    
    # Perform AI analysis
    analysis_result = await perform_medical_analysis(
        photos_data,
        context=request.context,
        comparison_ids=request.comparison_photo_ids
    )
    
    # Save analysis
    analysis_id = str(uuid.uuid4())
    expires_at = datetime.utcnow() + timedelta(hours=24) if request.temporary_analysis else None
    
    db.execute("""
        INSERT INTO photo_analyses 
        (id, session_id, photo_ids, primary_assessment, confidence, 
         visual_observations, differential_diagnosis, recommendations, 
         red_flags, trackable_metrics, comparison_data, expires_at)
        VALUES (%(id)s, %(session_id)s, %(photo_ids)s, %(assessment)s, 
                %(confidence)s, %(observations)s, %(differential)s, 
                %(recommendations)s, %(red_flags)s, %(metrics)s, 
                %(comparison)s, %(expires)s)
    """, {
        "id": analysis_id,
        "session_id": request.session_id,
        "photo_ids": request.photo_ids,
        "assessment": analysis_result["primary_assessment"],
        "confidence": analysis_result["confidence"],
        "observations": analysis_result["visual_observations"],
        "differential": analysis_result["differential_diagnosis"],
        "recommendations": analysis_result["recommendations"],
        "red_flags": analysis_result["red_flags"],
        "metrics": json.dumps(analysis_result.get("trackable_metrics", [])),
        "comparison": json.dumps(analysis_result.get("comparison")),
        "expires": expires_at
    })
    
    # Update session summary
    db.execute("""
        UPDATE photo_sessions 
        SET latest_summary = %(summary)s,
            analysis_count = analysis_count + 1
        WHERE id = %(session_id)s
    """, {
        "session_id": request.session_id,
        "summary": analysis_result["primary_assessment"]
    })
    
    return {
        "analysis_id": analysis_id,
        "analysis": analysis_result,
        "comparison": analysis_result.get("comparison"),
        "expires_at": expires_at.isoformat() if expires_at else None
    }
```

## Sensitive Content Handling

### Photo Categorization AI
```python
async def categorize_photo_with_ai(photo: UploadFile) -> str:
    """Use Gemini 2.5 Pro to categorize medical photos"""
    
    prompt = """
    Categorize this medical photo into ONE of these categories:
    
    1. medical_normal - Standard medical conditions safe for storage (rashes, cuts, bruises, etc. NOT in intimate areas)
    2. medical_sensitive - Medical conditions in intimate/private areas (genital, anal, breast)
    3. medical_gore - Severe but legitimate medical content (deep wounds, surgery, severe trauma)
    4. unclear - Too blurry or obstructed to analyze properly
    5. non_medical - Not medical content
    6. inappropriate - Illegal or inappropriate content
    
    Respond with ONLY the category name, nothing else.
    """
    
    try:
        # Use Gemini 2.5 Pro for categorization
        result = await gemini_client.analyze_image(
            photo_data=await photo.read(),
            prompt=prompt,
            model="gemini-2.5-pro"
        )
        
        category = result.strip().lower()
        
        # Validate category
        valid_categories = ['medical_normal', 'medical_sensitive', 'medical_gore', 'unclear', 'non_medical', 'inappropriate']
        if category not in valid_categories:
            return 'unclear'
        
        return category
        
    except Exception as e:
        logger.error(f"Categorization error: {e}")
        return 'unclear'
```

### Temporary Photo Cleanup Job
```python
async def cleanup_temporary_photos():
    """Run every hour to clean up expired temporary photos"""
    
    # Delete expired temporary data
    deleted = db.execute("""
        UPDATE photo_uploads 
        SET temporary_data = NULL 
        WHERE temporary_data IS NOT NULL 
        AND expires_at < CURRENT_TIMESTAMP
        RETURNING id
    """)
    
    # Delete expired analyses
    db.execute("""
        DELETE FROM photo_analyses 
        WHERE expires_at IS NOT NULL 
        AND expires_at < CURRENT_TIMESTAMP
    """)
    
    logger.info(f"Cleaned up {len(deleted)} temporary photos")
```

## Follow-up & Reminder System

### Add Follow-up Photos
```python
@app.post("/api/photo-analysis/session/{session_id}/follow-up")
async def add_follow_up_photos(
    session_id: str,
    photos: List[UploadFile],
    auto_compare: bool = Form(True),
    notes: Optional[str] = Form(None),
    compare_with_photo_ids: Optional[str] = Form(None)
):
    # Get session
    session = db.fetchone("""
        SELECT * FROM photo_sessions WHERE id = %(id)s
    """, {"id": session_id})
    
    if not session:
        raise HTTPException(404, "Session not found")
    
    # Upload photos (reuse existing upload logic)
    upload_result = await upload_photos(
        photos=photos,
        session_id=session_id,
        user_id=session["user_id"]
    )
    
    comparison_results = None
    follow_up_suggestion = None
    
    if auto_compare:
        # Get previous photos for comparison
        if compare_with_photo_ids:
            compare_ids = json.loads(compare_with_photo_ids)
        else:
            # Get most recent photos
            previous = db.fetchall("""
                SELECT id FROM photo_uploads 
                WHERE session_id = %(session_id)s 
                AND id NOT IN %(new_ids)s
                ORDER BY uploaded_at DESC 
                LIMIT 2
            """, {
                "session_id": session_id,
                "new_ids": tuple(p["id"] for p in upload_result["uploaded_photos"])
            })
            compare_ids = [p["id"] for p in previous]
        
        if compare_ids:
            # Perform comparison analysis
            analysis = await analyze_photos({
                "session_id": session_id,
                "photo_ids": [p["id"] for p in upload_result["uploaded_photos"]],
                "context": notes or "Follow-up photos for tracking progress",
                "comparison_photo_ids": compare_ids
            })
            
            # Calculate days since last photo
            last_photo = db.fetchone("""
                SELECT MAX(uploaded_at) as last_date 
                FROM photo_uploads 
                WHERE session_id = %(session_id)s 
                AND id IN %(compare_ids)s
            """, {"session_id": session_id, "compare_ids": tuple(compare_ids)})
            
            days_since_last = (datetime.utcnow() - last_photo["last_date"]).days
            
            comparison_results = {
                "compared_with": compare_ids,
                "days_since_last": days_since_last,
                "analysis": analysis["comparison"]
            }
            
            # Get AI suggestion for follow-up interval
            follow_up_suggestion = await get_follow_up_suggestion(
                condition=session["condition_name"],
                trend=analysis["comparison"]["trend"],
                metrics=analysis["analysis"].get("trackable_metrics", [])
            )
    
    return {
        "uploaded_photos": upload_result["uploaded_photos"],
        "comparison_results": comparison_results,
        "follow_up_suggestion": follow_up_suggestion
    }
```

### Configure Reminders
```python
@app.post("/api/photo-analysis/reminders/configure")
async def configure_reminder(request: ReminderConfigRequest):
    # Validate session and analysis exist
    session = db.fetchone("""
        SELECT user_id FROM photo_sessions WHERE id = %(session_id)s
    """, {"session_id": request.session_id})
    
    if not session:
        raise HTTPException(404, "Session not found")
    
    # Calculate next reminder date
    next_reminder = datetime.utcnow() + timedelta(days=request.interval_days)
    
    # Create or update reminder
    reminder_id = str(uuid.uuid4())
    
    db.execute("""
        INSERT INTO photo_reminders 
        (id, session_id, analysis_id, user_id, enabled, interval_days, 
         reminder_method, reminder_text, contact_email, contact_phone, 
         next_reminder_date, ai_reasoning)
        VALUES (%(id)s, %(session_id)s, %(analysis_id)s, %(user_id)s, 
                %(enabled)s, %(interval_days)s, %(method)s, %(text)s, 
                %(email)s, %(phone)s, %(next_date)s, %(reasoning)s)
        ON CONFLICT (session_id) DO UPDATE SET
            enabled = EXCLUDED.enabled,
            interval_days = EXCLUDED.interval_days,
            reminder_method = EXCLUDED.reminder_method,
            reminder_text = EXCLUDED.reminder_text,
            contact_email = EXCLUDED.contact_email,
            contact_phone = EXCLUDED.contact_phone,
            next_reminder_date = EXCLUDED.next_reminder_date,
            updated_at = CURRENT_TIMESTAMP
    """, {
        "id": reminder_id,
        "session_id": request.session_id,
        "analysis_id": request.analysis_id,
        "user_id": session["user_id"],
        "enabled": request.enabled,
        "interval_days": request.interval_days,
        "method": request.reminder_method,
        "text": request.reminder_text,
        "email": request.contact_info.get("email"),
        "phone": request.contact_info.get("phone"),
        "next_date": next_reminder,
        "reasoning": request.ai_reasoning
    })
    
    return {
        "reminder_id": reminder_id,
        "session_id": request.session_id,
        "next_reminder_date": next_reminder.isoformat(),
        "interval_days": request.interval_days,
        "method": request.reminder_method,
        "status": "active",
        "ai_reasoning": request.ai_reasoning,
        "can_modify": True
    }
```

### Reminder Processing Job
```python
async def process_reminders():
    """Run daily to send reminders"""
    
    due_reminders = db.fetchall("""
        SELECT r.*, s.condition_name, u.email, u.phone
        FROM photo_reminders r
        JOIN photo_sessions s ON r.session_id = s.id
        JOIN users u ON r.user_id = u.id
        WHERE r.enabled = TRUE 
        AND r.status = 'active'
        AND r.next_reminder_date <= CURRENT_TIMESTAMP
    """)
    
    for reminder in due_reminders:
        try:
            # Send reminder based on method
            if reminder["reminder_method"] == "email":
                await send_email_reminder(
                    to=reminder["contact_email"] or reminder["email"],
                    condition=reminder["condition_name"],
                    message=reminder["reminder_text"]
                )
            elif reminder["reminder_method"] == "sms":
                await send_sms_reminder(
                    to=reminder["contact_phone"] or reminder["phone"],
                    message=reminder["reminder_text"]
                )
            elif reminder["reminder_method"] == "in_app":
                await create_in_app_notification(
                    user_id=reminder["user_id"],
                    type="photo_follow_up",
                    session_id=reminder["session_id"],
                    message=reminder["reminder_text"]
                )
            
            # Update next reminder date
            db.execute("""
                UPDATE photo_reminders 
                SET next_reminder_date = CURRENT_TIMESTAMP + INTERVAL '%s days',
                    last_reminder_sent = CURRENT_TIMESTAMP
                WHERE id = %(id)s
            """, reminder["interval_days"], {"id": reminder["id"]})
            
        except Exception as e:
            logger.error(f"Failed to send reminder {reminder['id']}: {e}")
```

## Report Integration

### Generate Photo Analysis Report
```python
@app.post("/api/photo-analysis/reports/photo-analysis")
async def generate_photo_report(request: PhotoReportRequest):
    # Get sessions with analyses
    sessions = db.fetchall("""
        SELECT 
            s.*,
            COUNT(DISTINCT p.id) as photo_count,
            COUNT(DISTINCT a.id) as analysis_count
        FROM photo_sessions s
        LEFT JOIN photo_uploads p ON s.id = p.session_id
        LEFT JOIN photo_analyses a ON s.id = a.session_id
        WHERE s.user_id = %(user_id)s
        AND s.id = ANY(%(session_ids)s)
        GROUP BY s.id
    """, {
        "user_id": request.user_id,
        "session_ids": request.session_ids
    })
    
    # Get analyses for each session
    for session in sessions:
        analyses = db.fetchall("""
            SELECT 
                a.*,
                array_agg(p.preview_url) as photo_urls
            FROM photo_analyses a
            LEFT JOIN photo_uploads p ON p.id = ANY(a.photo_ids)
            WHERE a.session_id = %(session_id)s
            AND (%(time_start)s IS NULL OR a.analyzed_at >= %(time_start)s)
            AND (%(time_end)s IS NULL OR a.analyzed_at <= %(time_end)s)
            GROUP BY a.id
            ORDER BY a.analyzed_at
        """, {
            "session_id": session["id"],
            "time_start": request.time_range.get("start"),
            "time_end": request.time_range.get("end")
        })
        
        session["analyses"] = analyses
    
    # Generate report
    report_data = {
        "type": "photo_analysis",
        "generated_at": datetime.utcnow(),
        "sessions": sessions,
        "include_visual_timeline": request.include_visual_timeline,
        "include_tracking_data": request.include_tracking_data
    }
    
    # Create PDF or return JSON
    if request.format == "pdf":
        pdf_url = await generate_photo_report_pdf(report_data)
        return {"report_url": pdf_url}
    else:
        return report_data
```

### Include Photo Data in Other Reports
When generating specialist or comprehensive reports, include photo analysis data:

```python
# In specialist report generation
if photo_session_ids:
    photo_data = db.fetchall("""
        SELECT 
            s.condition_name,
            a.primary_assessment,
            a.visual_observations,
            a.analyzed_at,
            a.comparison_data
        FROM photo_sessions s
        JOIN photo_analyses a ON s.id = a.session_id
        WHERE s.id = ANY(%(session_ids)s)
        AND s.is_sensitive = FALSE  -- Respect privacy
        ORDER BY a.analyzed_at
    """, {"session_ids": photo_session_ids})
    
    report_data["visual_assessments"] = photo_data
```

## Error Handling

### Retry Logic for AI Calls
```python
async def perform_medical_analysis_with_retry(photos, context, max_retries=3):
    """Perform analysis with automatic retry and fallback"""
    
    models = [
        "google/gemini-2.5-pro",
        "google/gemini-2.0-flash-exp:free"
    ]
    
    for model in models:
        for attempt in range(max_retries):
            try:
                result = await call_ai_model(
                    model=model,
                    photos=photos,
                    context=context,
                    timeout=30
                )
                
                # Validate result
                if validate_analysis_result(result):
                    return result
                    
            except Exception as e:
                logger.warning(f"Attempt {attempt + 1} failed with {model}: {e}")
                
                if attempt < max_retries - 1:
                    # Exponential backoff
                    await asyncio.sleep(2 ** attempt)
                    continue
    
    raise HTTPException(500, "Analysis failed after all retries")
```

### Common Error Responses
```python
# File size error
if file.size > 10 * 1024 * 1024:
    return JSONResponse(
        status_code=413,
        content={"detail": "File too large (max 10MB)"}
    )

# Invalid file type
if file.content_type not in ALLOWED_TYPES:
    return JSONResponse(
        status_code=400,
        content={"detail": f"Invalid file type. Allowed: {', '.join(ALLOWED_TYPES)}"}
    )

# Sensitive photo without data
if photo["category"] == "medical_sensitive" and not photo["temporary_data"]:
    return JSONResponse(
        status_code=400,
        content={"detail": "Cannot analyze photo without data"}
    )
```

## Security Considerations

### 1. Photo Storage Security
```python
async def store_photo_securely(photo: UploadFile, user_id: str) -> str:
    """Store photo with encryption"""
    
    # Generate secure filename
    file_id = str(uuid.uuid4())
    extension = photo.filename.split('.')[-1]
    filename = f"{user_id}/{file_id}.{extension}"
    
    # Encrypt before storage
    photo_data = await photo.read()
    encrypted_data = encrypt_data(photo_data, user_specific_key(user_id))
    
    # Store in secure location
    await secure_storage.upload(
        path=filename,
        data=encrypted_data,
        metadata={
            "user_id": user_id,
            "uploaded_at": datetime.utcnow().isoformat(),
            "content_type": photo.content_type
        }
    )
    
    return filename
```

### 2. Access Control
```python
@app.middleware("http")
async def verify_photo_access(request: Request, call_next):
    """Ensure users can only access their own photos"""
    
    if request.url.path.startswith("/api/photo-analysis/"):
        # Extract user_id from auth token
        user_id = get_user_id_from_token(request.headers.get("Authorization"))
        
        # For session-specific endpoints, verify ownership
        if "session_id" in request.path_params:
            session = db.fetchone("""
                SELECT user_id FROM photo_sessions 
                WHERE id = %(session_id)s
            """, {"session_id": request.path_params["session_id"]})
            
            if not session or session["user_id"] != user_id:
                return JSONResponse(
                    status_code=403,
                    content={"detail": "Access denied"}
                )
    
    return await call_next(request)
```

### 3. Secure URL Generation
```python
def generate_secure_url(file_path: str, expires_in: int = 3600) -> str:
    """Generate time-limited signed URL for photo access"""
    
    timestamp = int(time.time())
    expires_at = timestamp + expires_in
    
    # Create signature
    signature = hmac.new(
        settings.URL_SIGNING_KEY.encode(),
        f"{file_path}:{expires_at}".encode(),
        hashlib.sha256
    ).hexdigest()
    
    return f"{settings.CDN_URL}/photos/{file_path}?expires={expires_at}&signature={signature}"
```

## Testing Checklist

### Core Functionality
- [ ] Create photo session
- [ ] Upload multiple photos
- [ ] Categorization works correctly
- [ ] Analysis generates proper results
- [ ] Session list shows correct data

### Sensitive Content
- [ ] Sensitive photos trigger modal
- [ ] Temporary storage works
- [ ] 24-hour cleanup runs
- [ ] Analysis works without permanent storage

### Follow-up System
- [ ] Follow-up photos upload correctly
- [ ] Auto-comparison works
- [ ] Timeline view shows progression
- [ ] Trend detection is accurate

### Reminders
- [ ] Reminder configuration saves
- [ ] Email reminders send
- [ ] SMS reminders send
- [ ] In-app notifications appear
- [ ] Reminder intervals work correctly

### Reports
- [ ] Photo sessions appear in reports
- [ ] Sensitive photos excluded appropriately
- [ ] Timeline visualization works
- [ ] Export formats work correctly

### Error Handling
- [ ] Large files rejected gracefully
- [ ] Invalid formats handled
- [ ] AI failures retry properly
- [ ] Network errors handled

## Performance Optimization

### 1. Image Processing
- Resize images before AI analysis to reduce processing time
- Use WebP format for preview URLs to reduce bandwidth
- Implement progressive loading for photo galleries

### 2. Database Optimization
- Add appropriate indexes (see schema section)
- Use materialized views for session summaries
- Implement pagination for photo lists

### 3. Caching Strategy
- Cache AI categorization results by image hash
- Cache analysis results for 24 hours
- Use Redis for temporary photo data instead of database

## Monitoring & Logging

### Key Metrics to Track
- Photo upload success rate
- AI categorization accuracy
- Analysis processing time
- Reminder delivery rate
- Storage usage per user

### Important Log Points
```python
logger.info(f"Photo uploaded: user={user_id}, session={session_id}, category={category}")
logger.info(f"Analysis completed: session={session_id}, confidence={confidence}%")
logger.warning(f"Sensitive content detected: session={session_id}, photos={photo_ids}")
logger.info(f"Reminder sent: user={user_id}, method={method}, session={session_id}")
logger.error(f"AI analysis failed: session={session_id}, error={error}")
```

## Compliance & Privacy

### Healthcare Privacy Compliance
- Encrypt all photo data at rest and in transit
- Implement audit logs for all photo access
- Ensure proper security agreements with cloud storage providers
- Regular security assessments

### Privacy Features
- Automatic deletion of temporary data
- User-controlled data retention
- Clear consent for sensitive content
- Right to deletion implementation

This guide should provide everything needed to implement the photo analysis backend. Remember to adapt the code examples to your specific framework and infrastructure.