# Photo Analysis Backend Implementation Guide

## Overview
This guide covers the complete backend implementation for the Photo Analysis feature in Proxima-1, including photo categorization, storage, analysis, and tracking integration.

## Architecture Overview

```
User Upload → Categorization (Mistral) → Storage Decision → Analysis (GPT-4V) → Tracking Integration
```

## Database Schema

### 1. Photo Sessions Table
```sql
CREATE TABLE photo_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) NOT NULL,
  condition_name TEXT NOT NULL,
  description TEXT,
  is_sensitive BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_photo_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_photo_sessions_user_id ON photo_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_photo_sessions_created_at ON photo_sessions(created_at DESC);
```

### 2. Photo Uploads Table
```sql
CREATE TABLE photo_uploads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES photo_sessions(id) ON DELETE CASCADE,
  category VARCHAR(50) NOT NULL CHECK (category IN (
    'medical_normal', 'medical_sensitive', 'medical_gore', 
    'unclear', 'non_medical', 'inappropriate'
  )),
  storage_url TEXT, -- NULL for sensitive photos
  file_metadata JSONB NOT NULL DEFAULT '{}', -- size, mime_type, dimensions
  upload_metadata JSONB DEFAULT '{}', -- EXIF data, device info
  uploaded_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ -- Soft delete
);

CREATE INDEX IF NOT EXISTS idx_photo_uploads_session_id ON photo_uploads(session_id);
CREATE INDEX IF NOT EXISTS idx_photo_uploads_category ON photo_uploads(category);
```

### 3. Photo Analyses Table
```sql
CREATE TABLE photo_analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES photo_sessions(id) ON DELETE CASCADE,
  photo_ids UUID[] NOT NULL, -- Array of analyzed photos
  analysis_data JSONB NOT NULL, -- Encrypted for sensitive
  model_used VARCHAR(100) NOT NULL,
  model_response JSONB, -- Raw model response for debugging
  confidence_score FLOAT,
  is_sensitive BOOLEAN DEFAULT false,
  expires_at TIMESTAMPTZ, -- For temporary analyses
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_photo_analyses_session_id ON photo_analyses(session_id);
CREATE INDEX IF NOT EXISTS idx_photo_analyses_expires_at ON photo_analyses(expires_at) WHERE expires_at IS NOT NULL;
```

### 4. Photo Tracking Suggestions Table
```sql
CREATE TABLE photo_tracking_suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES photo_sessions(id) ON DELETE CASCADE,
  analysis_id UUID REFERENCES photo_analyses(id) ON DELETE CASCADE,
  tracking_config_id UUID REFERENCES tracking_configurations(id),
  metric_suggestions JSONB[] NOT NULL,
  auto_approved BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 5. Photo Comparisons Table
```sql
CREATE TABLE photo_comparisons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES photo_sessions(id) ON DELETE CASCADE,
  before_photo_id UUID REFERENCES photo_uploads(id),
  after_photo_id UUID REFERENCES photo_uploads(id),
  comparison_data JSONB NOT NULL, -- AI-generated comparison
  days_between INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

## AI Prompts

### Photo Categorization Prompt (Mistral Small)
```javascript
const PHOTO_CATEGORIZATION_PROMPT = `You are a medical photo categorization system. Analyze the image and categorize it into EXACTLY ONE of these categories:

CATEGORIES:
- medical_normal: Any legitimate medical condition (skin conditions, wounds, rashes, burns, infections, swelling, etc.) that is NOT in intimate/private areas
- medical_sensitive: Medical conditions involving genitalia, breasts, or intimate areas (even if legitimate medical concern)
- medical_gore: Severe trauma, surgical sites, deep wounds, exposed tissue/bone (still medical and legal)
- unclear: Photo too blurry, dark, or unclear to make medical assessment
- non_medical: Objects, food, pets, landscapes, or anything not related to human medical conditions
- inappropriate: ONLY illegal content, NOT medical gore or sensitive medical areas

IMPORTANT RULES:
1. Medical gore (surgery, trauma) is LEGAL and should be categorized as medical_gore, NOT inappropriate
2. Genitalia with medical conditions = medical_sensitive, NOT inappropriate
3. Only categorize as inappropriate if content is clearly illegal (CSAM, etc.)
4. When in doubt between categories, prefer medical categories over non-medical

Respond with ONLY this JSON format:
{
  "category": "category_name",
  "confidence": 0.95,
  "subcategory": "optional_specific_condition"
}`;
```

### Photo Analysis Prompt (GPT-4V or similar)
```javascript
const PHOTO_ANALYSIS_PROMPT = `You are an expert medical AI analyzing photos for health concerns. Provide:

1. PRIMARY ASSESSMENT: Most likely condition based on visual evidence
2. CONFIDENCE: Your confidence level (0-100%)
3. VISUAL OBSERVATIONS: What you specifically see (color, texture, size, patterns)
4. DIFFERENTIAL DIAGNOSIS: Other possible conditions
5. PROGRESSION INDICATORS: If comparing photos, note specific changes
6. RECOMMENDATIONS: Clear next steps
7. RED FLAGS: Any urgent concerns requiring immediate medical attention
8. TRACKABLE METRICS: Measurable aspects that can be tracked over time

Format your response as JSON:
{
  "primary_assessment": "string",
  "confidence": number,
  "visual_observations": ["string"],
  "differential_diagnosis": ["string"],
  "recommendations": ["string"],
  "red_flags": ["string"],
  "trackable_metrics": [
    {
      "metric_name": "string",
      "current_value": number,
      "unit": "string",
      "suggested_tracking": "daily|weekly|monthly"
    }
  ]
}

Be specific, professional, and helpful. If you can measure or estimate sizes, do so.`;
```

### Sensitive Content Analysis Prompt
```javascript
const SENSITIVE_ANALYSIS_PROMPT = `You are analyzing a medical photo from a sensitive/intimate area. Provide professional, clinical analysis while being respectful. Focus on:
1. Potential medical conditions visible
2. Severity assessment
3. Recommended actions
4. Whether medical attention is urgently needed

Maintain clinical professionalism throughout.`;
```

### Photo Comparison Prompt
```javascript
const PHOTO_COMPARISON_PROMPT = `Compare these medical photos taken at different times. Analyze:

1. SIZE CHANGES: Measure or estimate size differences
2. COLOR CHANGES: Note any color evolution
3. TEXTURE CHANGES: Surface characteristics
4. OVERALL TREND: Is it improving, worsening, or stable?
5. SPECIFIC OBSERVATIONS: Notable changes

Format as JSON:
{
  "days_between": number,
  "changes": {
    "size": { "from": number, "to": number, "unit": "string", "change": number },
    "color": { "description": "string" },
    "texture": { "description": "string" }
  },
  "trend": "improving|worsening|stable",
  "ai_summary": "string"
}`;
```

## API Endpoints

### 1. Photo Categorization Endpoint
```typescript
POST /api/photo-analysis/categorize
Content-Type: multipart/form-data

Request:
- photo: File (max 10MB)
- session_id?: string (for continuations)

Response:
{
  "category": "medical_normal" | "medical_sensitive" | "medical_gore" | "unclear" | "non_medical" | "inappropriate",
  "confidence": 0.95,
  "subcategory": "rash", // optional
  "session_context": { // if session_id provided
    "is_sensitive_session": boolean,
    "previous_photos": number
  }
}

Implementation:
async function categorizePhoto(req, res) {
  const { photo, session_id } = req.body;
  
  // Validate file
  if (!photo || photo.size > 10 * 1024 * 1024) {
    return res.status(400).json({ error: "Invalid file or file too large" });
  }
  
  // Convert to base64
  const base64 = await fileToBase64(photo);
  
  // Call Mistral for categorization
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': process.env.APP_URL,
      'X-Title': 'Proxima-1 Photo Categorization'
    },
    body: JSON.stringify({
      model: 'mistralai/mistral-small-latest',
      messages: [{
        role: 'user',
        content: [
          { type: 'text', text: PHOTO_CATEGORIZATION_PROMPT },
          { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${base64}` } }
        ]
      }],
      max_tokens: 100,
      temperature: 0.1
    })
  });
  
  const result = await response.json();
  const categorization = JSON.parse(result.choices[0].message.content);
  
  // Check session context if provided
  if (session_id) {
    const session = await getPhotoSession(session_id);
    categorization.session_context = {
      is_sensitive_session: session.is_sensitive,
      previous_photos: session.photo_count
    };
  }
  
  return res.json(categorization);
}
```

### 2. Photo Upload Endpoint
```typescript
POST /api/photo-analysis/upload
Content-Type: multipart/form-data

Request:
- photos: File[] (max 5 files, 10MB each)
- session_id?: string
- condition_name?: string (required if no session_id)
- description?: string

Response:
{
  "session_id": "uuid",
  "uploaded_photos": [{
    "id": "uuid",
    "category": "medical_normal",
    "stored": true,
    "preview_url": "signed_url" // 1 hour expiry
  }],
  "requires_action": {
    "type": "sensitive_modal" | "unclear_modal" | null,
    "affected_photos": ["photo_id"],
    "message": "string"
  }
}

Implementation:
async function uploadPhotos(req, res) {
  const { photos, session_id, condition_name, description } = req.body;
  const user_id = req.user.id;
  
  // Create or get session
  let sessionId = session_id;
  if (!sessionId) {
    const session = await createPhotoSession({
      user_id,
      condition_name,
      description
    });
    sessionId = session.id;
  }
  
  const uploadResults = [];
  const requiresAction = { type: null, affected_photos: [], message: null };
  
  for (const photo of photos) {
    // Categorize first
    const category = await categorizePhotoInternal(photo);
    
    let stored = false;
    let storage_url = null;
    
    // Handle based on category
    switch (category.category) {
      case 'medical_normal':
      case 'medical_gore':
        // Upload to Supabase Storage
        const fileName = `${user_id}/${sessionId}/${Date.now()}_${photo.name}`;
        const { data, error } = await supabase.storage
          .from('medical-photos')
          .upload(fileName, photo, {
            contentType: photo.type,
            upsert: false
          });
        
        if (!error) {
          storage_url = data.path;
          stored = true;
        }
        break;
        
      case 'medical_sensitive':
        // Don't store, but mark session as sensitive
        await markSessionSensitive(sessionId);
        requiresAction.type = 'sensitive_modal';
        requiresAction.affected_photos.push(photo.id);
        requiresAction.message = 'Sensitive content detected';
        break;
        
      case 'unclear':
        requiresAction.type = 'unclear_modal';
        requiresAction.affected_photos.push(photo.id);
        break;
        
      case 'inappropriate':
        return res.status(400).json({
          error: 'Inappropriate content detected',
          details: 'Please upload appropriate medical photos only'
        });
    }
    
    // Save upload record
    const uploadRecord = await createPhotoUpload({
      session_id: sessionId,
      category: category.category,
      storage_url,
      file_metadata: {
        size: photo.size,
        mime_type: photo.type,
        original_name: photo.name
      }
    });
    
    uploadResults.push({
      id: uploadRecord.id,
      category: category.category,
      stored,
      preview_url: stored ? await getSignedUrl(storage_url, 3600) : null
    });
  }
  
  return res.json({
    session_id: sessionId,
    uploaded_photos: uploadResults,
    requires_action: requiresAction.type ? requiresAction : null
  });
}
```

### 3. Photo Analysis Endpoint
```typescript
POST /api/photo-analysis/analyze

Request:
{
  "session_id": "uuid",
  "photo_ids": ["uuid"],
  "context": "What would you like analyzed?",
  "comparison_photo_ids": ["uuid"], // For progress tracking
  "temporary_analysis": boolean // For sensitive photos
}

Response:
{
  "analysis_id": "uuid",
  "analysis": {
    "primary_assessment": "Contact dermatitis",
    "confidence": 85,
    "visual_observations": ["Redness", "Raised bumps", "2cm diameter"],
    "differential_diagnosis": ["Eczema", "Allergic reaction"],
    "recommendations": ["Apply topical steroids", "See dermatologist if no improvement in 5 days"],
    "red_flags": [],
    "trackable_metrics": [
      {
        "metric_name": "Rash Size",
        "current_value": 2,
        "unit": "cm",
        "suggested_tracking": "daily"
      }
    ]
  },
  "comparison": { // If comparison photos provided
    "days_between": 3,
    "changes": {
      "size": { "from": 3, "to": 2, "unit": "cm", "change": -33 },
      "color": { "description": "Less red, fading to pink" },
      "texture": { "description": "Flattening, less raised" }
    },
    "trend": "improving",
    "ai_summary": "Significant improvement noted"
  },
  "expires_at": "2024-01-20T10:00:00Z" // If temporary
}

Implementation:
async function analyzePhotos(req, res) {
  const { session_id, photo_ids, context, comparison_photo_ids, temporary_analysis } = req.body;
  
  // Get photos and session
  const session = await getPhotoSession(session_id);
  const photos = await getPhotosByIds(photo_ids);
  
  // Build analysis prompt
  const photosBase64 = await Promise.all(
    photos.map(p => p.storage_url ? getPhotoFromStorage(p.storage_url) : p.temp_data)
  );
  
  // Call GPT-4V for analysis
  const analysisResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'openai/gpt-4-vision-preview',
      messages: [{
        role: 'user',
        content: [
          { type: 'text', text: `${PHOTO_ANALYSIS_PROMPT}\n\nUser context: ${context}` },
          ...photosBase64.map(b64 => ({
            type: 'image_url',
            image_url: { url: `data:image/jpeg;base64,${b64}` }
          }))
        ]
      }],
      max_tokens: 1000,
      temperature: 0.3
    })
  });
  
  const analysis = JSON.parse(analysisResponse.choices[0].message.content);
  
  // Handle comparison if requested
  let comparison = null;
  if (comparison_photo_ids?.length > 0) {
    comparison = await generateComparison(photo_ids, comparison_photo_ids);
  }
  
  // Save analysis
  const analysisRecord = await createPhotoAnalysis({
    session_id,
    photo_ids,
    analysis_data: temporary_analysis ? await encrypt(analysis) : analysis,
    model_used: 'gpt-4-vision-preview',
    confidence_score: analysis.confidence,
    is_sensitive: session.is_sensitive || temporary_analysis,
    expires_at: temporary_analysis ? addHours(new Date(), 24) : null
  });
  
  // Generate tracking suggestions if applicable
  if (analysis.trackable_metrics && !temporary_analysis) {
    await generateTrackingSuggestions(session_id, analysisRecord.id, analysis.trackable_metrics);
  }
  
  return res.json({
    analysis_id: analysisRecord.id,
    analysis,
    comparison,
    expires_at: analysisRecord.expires_at
  });
}
```

### 4. Session Management Endpoints
```typescript
GET /api/photo-analysis/sessions
Query params: limit=20, offset=0

Response:
{
  "sessions": [{
    "id": "uuid",
    "condition_name": "Arm rash",
    "created_at": "2024-01-15T10:00:00Z",
    "last_photo_at": "2024-01-18T10:00:00Z",
    "photo_count": 5,
    "analysis_count": 2,
    "is_sensitive": false,
    "latest_summary": "Improving - reduced redness",
    "thumbnail_url": "signed_url"
  }],
  "total": 15,
  "has_more": false
}

GET /api/photo-analysis/session/:id
Response: Full session details with photos and analyses

DELETE /api/photo-analysis/session/:id
Soft deletes session and all associated data

POST /api/photo-analysis/session/:id/export
Response:
{
  "export_url": "signed_url", // 1 hour expiry
  "format": "pdf" | "json",
  "includes_photos": boolean
}
```

### 5. Tracking Integration Endpoint
```typescript
POST /api/photo-analysis/tracking/approve

Request:
{
  "analysis_id": "uuid",
  "metric_configs": [{
    "metric_name": "Rash Size",
    "y_axis_label": "Size (cm)",
    "y_axis_min": 0,
    "y_axis_max": 10,
    "initial_value": 2
  }]
}

Response:
{
  "tracking_configs": [{
    "id": "uuid",
    "metric_name": "Rash Size",
    "configuration_id": "uuid"
  }],
  "dashboard_url": "/dashboard#tracking"
}
```

## Security Considerations

### 1. File Validation
```typescript
const validatePhotoUpload = (file: File): ValidationResult => {
  const MAX_SIZE = 10 * 1024 * 1024; // 10MB
  const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/heic', 'image/heif'];
  
  if (file.size > MAX_SIZE) {
    return { valid: false, error: 'File too large (max 10MB)' };
  }
  
  if (!ALLOWED_TYPES.includes(file.type)) {
    return { valid: false, error: 'Invalid file type' };
  }
  
  // Additional magic number validation
  const magicNumbers = {
    jpeg: [0xFF, 0xD8, 0xFF],
    png: [0x89, 0x50, 0x4E, 0x47]
  };
  
  return { valid: true };
};
```

### 2. Signed URLs
```typescript
const getSignedUrl = async (path: string, expiresIn: number = 3600) => {
  const { data, error } = await supabase.storage
    .from('medical-photos')
    .createSignedUrl(path, expiresIn);
    
  if (error) throw error;
  return data.signedUrl;
};
```

### 3. Encryption for Sensitive Data
```typescript
import crypto from 'crypto';

const ENCRYPTION_KEY = process.env.PHOTO_ANALYSIS_ENCRYPTION_KEY;

const encrypt = (data: object): string => {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(
    'aes-256-gcm',
    Buffer.from(ENCRYPTION_KEY, 'hex'),
    iv
  );
  
  const encrypted = Buffer.concat([
    cipher.update(JSON.stringify(data), 'utf8'),
    cipher.final()
  ]);
  
  const authTag = cipher.getAuthTag();
  
  return Buffer.concat([iv, authTag, encrypted]).toString('base64');
};

const decrypt = (encryptedData: string): object => {
  const buffer = Buffer.from(encryptedData, 'base64');
  const iv = buffer.slice(0, 16);
  const authTag = buffer.slice(16, 32);
  const encrypted = buffer.slice(32);
  
  const decipher = crypto.createDecipheriv(
    'aes-256-gcm',
    Buffer.from(ENCRYPTION_KEY, 'hex'),
    iv
  );
  
  decipher.setAuthTag(authTag);
  
  const decrypted = Buffer.concat([
    decipher.update(encrypted),
    decipher.final()
  ]);
  
  return JSON.parse(decrypted.toString('utf8'));
};
```

## Scheduled Jobs

### 1. Cleanup Expired Analyses
```typescript
// Run every hour
async function cleanupExpiredAnalyses() {
  const expired = await supabase
    .from('photo_analyses')
    .select('id, session_id')
    .lt('expires_at', new Date().toISOString())
    .not('expires_at', 'is', null);
    
  for (const analysis of expired.data) {
    // Delete analysis data but keep record
    await supabase
      .from('photo_analyses')
      .update({ 
        analysis_data: null,
        model_response: null,
        expired: true 
      })
      .eq('id', analysis.id);
  }
}
```

### 2. Storage Cleanup
```typescript
// Run daily
async function cleanupOrphanedPhotos() {
  // Find photos not referenced in database
  const { data: dbPhotos } = await supabase
    .from('photo_uploads')
    .select('storage_url')
    .not('storage_url', 'is', null);
    
  const { data: storageFiles } = await supabase.storage
    .from('medical-photos')
    .list();
    
  const orphaned = storageFiles.filter(
    file => !dbPhotos.some(db => db.storage_url === file.name)
  );
  
  // Delete orphaned files
  if (orphaned.length > 0) {
    await supabase.storage
      .from('medical-photos')
      .remove(orphaned.map(f => f.name));
  }
}
```

## Error Handling

### Standard Error Response Format
```typescript
interface ErrorResponse {
  error: string;
  details?: string;
  code?: string;
  suggestion?: string;
}

const errorHandler = (err: any, req: Request, res: Response) => {
  console.error('Photo Analysis Error:', err);
  
  if (err.code === 'PAYLOAD_TOO_LARGE') {
    return res.status(413).json({
      error: 'File too large',
      details: 'Maximum file size is 10MB',
      suggestion: 'Try compressing the image or taking a lower resolution photo'
    });
  }
  
  if (err.code === 'INVALID_FILE_TYPE') {
    return res.status(400).json({
      error: 'Invalid file type',
      details: 'Only JPEG, PNG, and HEIC images are accepted',
      suggestion: 'Please convert your image to a supported format'
    });
  }
  
  // Generic error
  return res.status(500).json({
    error: 'Analysis failed',
    details: 'An error occurred during photo analysis',
    suggestion: 'Please try again or contact support if the issue persists'
  });
};
```

## Integration Points

### 1. With Existing Tracking System
```typescript
const integrateWithTracking = async (analysisId: string, metrics: TrackableMetric[]) => {
  for (const metric of metrics) {
    // Create tracking suggestion
    await trackingService.generateTrackingSuggestion(
      'photo_analysis',
      analysisId,
      metric
    );
  }
};
```

### 2. With Health Reports
```typescript
const includePhotoAnalysisInReport = async (userId: string, dateRange: DateRange) => {
  const photoAnalyses = await getPhotoAnalysesByDateRange(userId, dateRange);
  
  return photoAnalyses.map(analysis => ({
    type: 'photo_analysis',
    date: analysis.created_at,
    condition: analysis.session.condition_name,
    findings: analysis.analysis_data.primary_assessment,
    confidence: analysis.confidence_score,
    has_photos: !analysis.is_sensitive
  }));
};
```

## Testing Considerations

### 1. Mock Categorization for Development
```typescript
if (process.env.NODE_ENV === 'development' && process.env.MOCK_CATEGORIZATION) {
  // Return mock categorization based on filename
  const mockCategorize = (filename: string) => {
    if (filename.includes('sensitive')) return { category: 'medical_sensitive', confidence: 0.9 };
    if (filename.includes('unclear')) return { category: 'unclear', confidence: 0.5 };
    return { category: 'medical_normal', confidence: 0.95 };
  };
}
```

### 2. Test Data Generation
```sql
-- Insert test photo sessions
INSERT INTO photo_sessions (user_id, condition_name, description)
VALUES 
  ('test-user-id', 'Test Rash', 'Testing photo analysis feature'),
  ('test-user-id', 'Test Mole Tracking', 'Long-term mole monitoring');
```

## Performance Optimizations

### 1. Image Processing
- Resize images on frontend before upload (max 2048x2048)
- Convert HEIC to JPEG on frontend
- Compress images maintaining quality above 85%

### 2. Caching
```typescript
const redis = createRedisClient();

const getCachedAnalysis = async (photoHash: string) => {
  const cached = await redis.get(`analysis:${photoHash}`);
  if (cached) return JSON.parse(cached);
  return null;
};

const cacheAnalysis = async (photoHash: string, analysis: any) => {
  await redis.setex(
    `analysis:${photoHash}`,
    3600, // 1 hour
    JSON.stringify(analysis)
  );
};
```

### 3. Batch Processing
```typescript
const batchAnalyzePhotos = async (photoGroups: PhotoGroup[]) => {
  const analyses = await Promise.all(
    photoGroups.map(group => analyzePhotosInternal(group))
  );
  return analyses;
};
```

## Monitoring and Logging

### 1. Key Metrics to Track
- Photo upload success/failure rates
- Categorization distribution
- Analysis response times
- Storage usage per user
- Sensitive photo detection rate

### 2. Logging Structure
```typescript
const logPhotoAnalysis = (event: string, data: any) => {
  logger.info({
    service: 'photo_analysis',
    event,
    user_id: data.user_id,
    session_id: data.session_id,
    category: data.category,
    model_used: data.model_used,
    response_time: data.response_time,
    timestamp: new Date().toISOString()
  });
};
```

## Deployment Checklist

- [ ] Set up Supabase Storage bucket for medical photos
- [ ] Configure bucket policies for proper access control
- [ ] Set environment variables (OPENROUTER_API_KEY, ENCRYPTION_KEY)
- [ ] Run database migrations
- [ ] Set up scheduled jobs (cleanup, etc.)
- [ ] Configure monitoring and alerting
- [ ] Test categorization with various photo types
- [ ] Verify sensitive photo handling
- [ ] Load test with multiple concurrent uploads
- [ ] Security audit of file upload handling

## Future Enhancements

1. **AI Model Improvements**
   - Fine-tune models for specific conditions
   - Add specialized models for dermatology
   
2. **Advanced Features**
   - Automated measurement tools
   - 3D reconstruction from multiple angles
   - Integration with medical devices
   
3. **Collaboration**
   - Share sessions with healthcare providers
   - Multi-user sessions for caregivers