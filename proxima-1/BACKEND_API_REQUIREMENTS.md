# Backend API Requirements for Weekly Brief & Data View

## Overview
This document specifies the backend requirements for two new features:
1. **Weekly Health Brief** - A structured narrative health summary
2. **Data View Dashboard** - 6 visualization components

---

## 1. Weekly Health Brief

### Endpoint
```
POST /api/health-brief/generate
Body: { 
  user_id: string, 
  week_of?: string,  // ISO date of Monday, defaults to current week
  force_regenerate?: boolean 
}

GET /api/health-brief/{user_id}/current
Response: WeeklyHealthBrief

GET /api/health-brief/{user_id}/history
Query: { limit?: number, offset?: number }
Response: WeeklyHealthBrief[]
```

### Data Structure
```typescript
interface WeeklyHealthBrief {
  id: string;
  user_id: string;
  week_of: string;  // Monday of the week
  
  greeting: {
    title: string;         // "Week 47: The Pattern Emerges"
    subtitle: string;      // "Your body's signals are getting clearer"
    readTime: string;      // "5 min read"
    generatedAt: Date;
  };
  
  mainStory: {
    headline: string;      // "The Tuesday-Wednesday Connection"
    narrative: string;     // 500-800 word story about the week
    
    weekHighlights: Array<{
      day: string;
      event: string;
      impact: 'positive' | 'trigger' | 'symptom';
      detail: string;
    }>;
    
    inlineInsights: Array<{
      triggerText: string;
      expansion: string;
    }>;
  };
  
  discoveries: {
    primaryPattern: {
      title: string;
      description: string;
      confidence: number;  // 0-1
      evidence: string;
    };
    
    secondaryPatterns: Array<{
      pattern: string;
      frequency: string;
      actionable: boolean;
    }>;
    
    comparisonToLastWeek: {
      overall: string;     // "+15% improvement"
      wins: string[];
      challenges: string[];
    };
  };
  
  experiments: {
    title: string;
    recommendations: Array<{
      priority: 'high' | 'medium' | 'low';
      experiment: string;
      rationale: string;
      howTo: string;
      trackingMetric: string;
    }>;
    weeklyChecklist: Array<{
      id: string;
      task: string;
      completed: boolean;
    }>;
  };
  
  spotlight: {
    title: string;
    content: string;
    learnMore: {
      teaser: string;
      fullContent: string;
    };
  };
  
  weekStats: {
    symptomFreeDays: number;
    bestDay: string;
    worstDay: string;
    trendsUp: string[];
    trendsDown: string[];
    aiConsultations: number;
    photosAnalyzed: number;
  };
  
  lookingAhead: {
    prediction: string;
    watchFor: string;
    encouragement: string;
  };
  
  created_at: Date;
  last_opened_at?: Date;
}
```

### Database Schema
```sql
CREATE TABLE weekly_health_briefs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  week_of DATE NOT NULL,
  
  greeting JSONB NOT NULL,
  main_story JSONB NOT NULL,
  discoveries JSONB NOT NULL,
  experiments JSONB NOT NULL,
  spotlight JSONB NOT NULL,
  week_stats JSONB NOT NULL,
  looking_ahead JSONB NOT NULL,
  
  created_at TIMESTAMP DEFAULT NOW(),
  last_opened_at TIMESTAMP,
  
  UNIQUE(user_id, week_of)
);
```

### Generation Logic
1. Aggregate week's data (symptoms, consultations, photos)
2. Identify primary pattern/story
3. Generate narrative using GPT-4 (focus on storytelling, not bullet points)
4. Structure into defined schema
5. Cache for the week

---

## 2. Data View Components (6 Total)

### 2.1 Health Velocity Score

**Endpoint**
```
GET /api/intelligence/health-velocity/{user_id}
Query: { timeRange?: '7D' | '30D' | '90D' | '1Y' }
Response: HealthVelocityData
```

**Response Structure**
```typescript
{
  score: number;           // 0-100
  trend: 'improving' | 'declining' | 'stable';
  momentum: number;        // % change from last period
  sparkline: number[];     // Last 7 data points
  recommendations: Array<{
    action: string;
    impact: string;      // "+8 points"
    icon: string;        // Empty string
  }>;
}
```

**Calculation**: Base score from average symptom severity (inverted), tracking consistency, and intervention frequency. Momentum is week-over-week change.

---

### 2.2 Body Systems Health

**Endpoint**
```
GET /api/intelligence/body-systems/{user_id}
Response: BodySystemsData
```

**Response Structure**
```typescript
{
  head: SystemHealth;
  chest: SystemHealth;
  digestive: SystemHealth;
  arms: SystemHealth;
  legs: SystemHealth;
  skin: SystemHealth;
  mental: SystemHealth;
}

interface SystemHealth {
  health: number;      // 0-100
  issues: string[];
  trend: 'improving' | 'declining' | 'stable';
  lastUpdated: string;
}
```

**Calculation**: Score each system based on relevant symptoms. Head includes headaches/migraines, chest includes cardiovascular, etc.

---

### 2.3 Master Timeline

**Endpoint**
```
GET /api/intelligence/timeline/{user_id}
Query: { timeRange: '7D' | '30D' | '90D' | '1Y' | 'ALL' }
Response: TimelineData
```

**Response Structure**
```typescript
{
  timeRange: string;
  dataPoints: Array<{
    date: string;
    severity: number;    // 0-10
    symptom: string;
    notes?: string;
  }>;
  aiConsultations: Array<{
    id: string;
    date: string;
    type: 'quick_scan' | 'deep_dive';
    bodyPart: string;
    severity: string;
  }>;
  photoSessions: Array<{
    id: string;
    date: string;
    photoCount: number;
    improvement?: number;
    bodyPart: string;
  }>;
  doctorRecommendations: Array<{
    date: string;
    urgency: 'low' | 'medium' | 'high';
    reason: string;
  }>;
}
```

---

### 2.4 Pattern Discovery Cards

**Endpoint**
```
GET /api/intelligence/patterns/{user_id}
Query: { limit?: number, timeRange?: string }
Response: PatternCard[]
```

**Response Structure**
```typescript
interface PatternCard {
  id: string;
  type: 'correlation' | 'prediction' | 'success' | 'environmental' | 'behavioral';
  priority: 'high' | 'medium' | 'low';
  
  front: {
    icon: string;        // Empty string
    headline: string;
    confidence: number;  // 0-100
    dataPoints: number;
    actionable: boolean;
  };
  
  back: {
    fullInsight: string;
    visualization: 'timeline' | 'correlation' | 'comparison' | 'chart';
    actions: Array<{
      text: string;
      type: 'primary' | 'secondary';
    }>;
    explanation: string;
  };
}
```

**Pattern Types to Detect**:
- Correlations between symptoms
- Temporal patterns (delayed reactions)
- Successful interventions
- Environmental triggers
- Future risk predictions

---

### 2.5 Doctor Readiness Score

**Endpoint**
```
GET /api/intelligence/doctor-readiness/{user_id}
Response: DoctorReadinessData
```

**Response Structure**
```typescript
{
  score: number;         // 0-100
  missingData: string[];
  availableData: {
    symptoms: boolean;
    timeline: boolean;
    patterns: boolean;
    photos: boolean;
    aiAnalysis: boolean;
    medications: boolean;
    vitals: boolean;
  };
  reportSections: string[];
}
```

**Scoring**:
- Symptoms: 25 points
- Timeline (30 days): 20 points
- Patterns: 15 points
- Photos: 10 points
- Medications: 15 points
- Vitals: 10 points
- AI Consultations: 5 points

---

### 2.6 Comparative Intelligence

**Endpoint**
```
GET /api/intelligence/comparative/{user_id}
Query: { patternLimit?: number }
Response: ComparativeIntelligence
```

**Response Structure**
```typescript
{
  similarUsers: number;
  patterns: Array<{
    pattern: string;
    affectedUsers: number;
    successfulInterventions: Array<{
      action: string;
      successRate: number;
      triedBy: number;
      description: string;
    }>;
  }>;
  topRecommendation: string;
}
```

**Important**: All data must be anonymous aggregates. No PII.

---

## Error Responses

All endpoints should return consistent error format:
```typescript
{
  error: string;
  message: string;
  statusCode: number;
}
```

---

## Notes

- All endpoints return data for a single user
- Frontend expects exact data structures as specified
- Mock data examples available in `/src/lib/mock-health-data.ts`
- Frontend components in `/src/components/intelligence/*`