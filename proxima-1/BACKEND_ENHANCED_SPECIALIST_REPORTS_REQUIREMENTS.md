# Backend Requirements: Enhanced Specialist Reports Implementation

## Overview
This document outlines the backend requirements to support the enhanced specialist report system with detailed clinical information, specialty triage, and improved data structures.

## 1. Database Schema Updates

### A. Reports Table Enhancement
Add the following fields to the existing reports table:
```sql
-- Add confidence score
ALTER TABLE reports ADD COLUMN confidence_score DECIMAL(3,2);

-- Add report metadata
ALTER TABLE reports ADD COLUMN metadata JSONB DEFAULT '{}';

-- Add analysis_id for tracking report generation
ALTER TABLE reports ADD COLUMN analysis_id UUID;

-- Add index for faster queries
CREATE INDEX idx_reports_user_id_type ON reports(user_id, report_type);
CREATE INDEX idx_reports_analysis_id ON reports(analysis_id);
```

### B. Report Cache/Storage
Store the enhanced report data structure in the `report_data` JSONB column with the new format.

## 2. API Endpoints

### A. Specialty Triage Endpoint (Priority: HIGH)
**Endpoint:** `POST /api/report/specialty-triage`

**Request Body:**
```json
{
  "user_id": "string (optional)",
  "quick_scan_ids": ["array of quick scan IDs (optional)"],
  "deep_dive_ids": ["array of deep dive IDs (optional)"],
  "primary_concern": "string (optional)",
  "symptoms": ["array of symptoms (optional)"],
  "urgency": "routine | urgent (optional)"
}
```

**Response:**
```json
{
  "status": "success",
  "triage_result": {
    "primary_specialty": "cardiology | neurology | psychiatry | etc.",
    "confidence": 0.85,
    "reasoning": "Based on chest pain symptoms and risk factors...",
    "secondary_specialties": [
      {
        "specialty": "pulmonology",
        "confidence": 0.45,
        "reason": "Shortness of breath component"
      }
    ],
    "urgency": "routine | urgent | emergent",
    "red_flags": ["Progressive symptoms", "New onset"],
    "recommended_timing": "Within 1-2 weeks"
  }
}
```

**Implementation Requirements:**
1. Aggregate data from selected quick scans and deep dives
2. Use AI to analyze symptoms and determine appropriate specialty
3. Calculate confidence scores based on symptom-specialty matching
4. Identify red flags that indicate urgent/emergent care needed
5. Save triage results for audit trail

### B. Enhanced Specialist Report Endpoints
Update ALL specialist endpoints to return the enhanced structure:

**Endpoints to Update:**
- `POST /api/report/cardiology`
- `POST /api/report/neurology`
- `POST /api/report/psychiatry`
- `POST /api/report/dermatology`
- `POST /api/report/gastroenterology`
- `POST /api/report/endocrinology`
- `POST /api/report/pulmonology`
- `POST /api/report/primary-care` (NEW)

**Enhanced Response Structure:**
```json
{
  "report_id": "uuid",
  "report_type": "cardiology",
  "generated_at": "2024-01-01T00:00:00Z",
  "status": "success",
  "confidence_score": 85,
  "report_data": {
    // Core sections (all specialties)
    "executive_summary": {
      "one_page_summary": "string",
      "key_findings": ["array"],
      "patterns_identified": ["array"],
      "chief_complaints": ["array"],
      "action_items": ["array"],
      "specialist_focus": "cardiology",
      "target_audience": "primary care physician"
    },
    
    "clinical_summary": {
      "chief_complaint": "Chest pain on exertion",
      "hpi": "45-year-old male presents with...",
      "symptom_timeline": [
        {
          "date": "2024-01-01",
          "symptoms": "Chest tightness",
          "severity": 7,
          "context": "During morning jog",
          "duration": "15 minutes",
          "resolution": "Rest"
        }
      ],
      "pattern_analysis": {
        "frequency": "2-3 times per week",
        "triggers": ["Physical exertion", "Stress"],
        "alleviating_factors": ["Rest", "Nitroglycerin"],
        "progression": "Worsening over 3 months"
      }
    },
    
    "diagnostic_priorities": {
      "immediate": [
        {
          "test": "ECG",
          "rationale": "Rule out acute coronary syndrome",
          "timing": "Same day"
        }
      ],
      "short_term": [
        {
          "test": "Stress test",
          "rationale": "Evaluate exercise-induced ischemia",
          "timing": "Within 1 week"
        }
      ],
      "contingent": [
        {
          "test": "Cardiac catheterization",
          "condition": "Positive stress test",
          "rationale": "Define coronary anatomy",
          "timing": "As indicated"
        }
      ]
    },
    
    "treatment_recommendations": {
      "immediate_medical_therapy": [
        {
          "medication": "Aspirin 81mg",
          "rationale": "Antiplatelet therapy for CAD prevention",
          "instructions": "Take once daily with food",
          "monitoring": "Watch for bleeding"
        }
      ],
      "lifestyle_interventions": {
        "diet": "Mediterranean diet, reduce sodium",
        "exercise": "Cardiac rehabilitation program",
        "stress": "Consider stress management techniques",
        "smoking": "Smoking cessation critical"
      },
      "preventive_measures": [
        "Blood pressure monitoring",
        "Lipid management"
      ]
    },
    
    "follow_up_plan": {
      "timing": "Follow up in 2 weeks",
      "monitoring_parameters": ["Chest pain frequency", "Exercise tolerance"],
      "red_flags": ["Rest pain", "Increasing frequency", "Syncope"],
      "next_steps": ["Review test results", "Adjust medications"]
    },
    
    "data_quality_notes": {
      "completeness": "High - comprehensive symptom history",
      "consistency": "Good - timeline aligns with severity",
      "gaps": ["Family history incomplete", "Prior cardiac workup unknown"]
    },
    
    // Specialty-specific sections (varies by specialty)
    "cardiology_assessment": {
      "functional_capacity": {
        "current": 4,
        "baseline": 8,
        "units": "METs"
      },
      "nyha_class": "II",
      "risk_factors": ["Hypertension", "Dyslipidemia", "Family history"],
      "clinical_scales": {
        "chad2ds2_vasc": {
          "calculated": 2,
          "interpretation": "Moderate stroke risk",
          "breakdown": {
            "age": 0,
            "sex": 0,
            "chf": 0,
            "hypertension": 1,
            "stroke": 0,
            "vascular": 1,
            "diabetes": 0
          }
        }
      }
    },
    
    "cardiology_specific_findings": {
      "cardiac_symptoms": {
        "chest_pain": "Substernal, pressure-like",
        "dyspnea": "On exertion, NYHA II",
        "palpitations": "Occasional, no syncope"
      },
      "examination_findings": {
        "vital_signs": "BP 145/90, HR 78, regular",
        "cardiac_exam": "S1S2 normal, no murmurs",
        "peripheral": "No edema, pulses intact"
      },
      "ecg_interpretation": "NSR, nonspecific ST-T changes",
      "imaging_recommendations": ["Stress echo", "Coronary CTA if intermediate risk"]
    }
  }
}
```

## 3. AI Model Integration Requirements

### A. Specialty Triage AI Logic
1. **Input Processing:**
   - Extract symptoms from quick scans and deep dives
   - Analyze temporal patterns
   - Identify key symptom clusters

2. **Specialty Matching:**
   - Use embeddings to match symptoms to specialty profiles
   - Consider symptom severity and duration
   - Factor in patient demographics if available

3. **Confidence Calculation:**
   - Base on symptom-specialty correlation strength
   - Adjust for data completeness
   - Consider presence of pathognomonic symptoms

4. **Red Flag Detection:**
   - Maintain database of emergency symptoms by specialty
   - Check for rapid progression patterns
   - Flag life-threatening conditions

### B. Clinical Scale Calculations
Implement backend logic to calculate standard clinical scales:

#### Cardiology Scales:
- **CHA₂DS₂-VASc**: Calculate from patient data
- **HAS-BLED**: Bleeding risk assessment
- **TIMI Risk Score**: For ACS risk

#### Neurology Scales:
- **MIDAS**: Migraine disability assessment
  - Calculate from: days missed work, reduced productivity, household work affected, social activities missed
  - Grades: I (0-5), II (6-10), III (11-20), IV (21+)
- **HIT-6**: Headache impact test

#### Psychiatry Scales:
- **PHQ-9**: Depression screening (0-27 scale)
- **GAD-7**: Anxiety screening (0-21 scale)

### C. Report Generation AI Prompts

Update prompts to include:

1. **Structured Timeline Generation:**
```
Generate a symptom timeline with entries containing:
- date: when symptom occurred
- symptoms: brief description
- severity: 1-10 scale
- context: what patient was doing
- duration: how long it lasted
- resolution: what helped (if applicable)
```

2. **Pattern Analysis:**
```
Analyze symptom patterns and identify:
- frequency: how often symptoms occur
- triggers: what precipitates symptoms
- alleviating_factors: what helps
- progression: getting better/worse/stable
```

3. **Clinical Priority Setting:**
```
Categorize diagnostic tests into:
- immediate: urgent, same-day tests
- short_term: within 1-2 weeks
- contingent: only if certain conditions met
Include rationale and timing for each
```

## 4. Data Processing Requirements

### A. Quick Scan/Deep Dive Aggregation
When multiple scans/dives are selected:
1. Sort by date to establish timeline
2. Extract and deduplicate symptoms
3. Track symptom evolution over time
4. Identify worsening patterns
5. Aggregate severity scores

### B. Symptom Normalization
1. Map variations to standard terms (e.g., "chest pain" = "chest discomfort" = "chest pressure")
2. Group related symptoms
3. Maintain symptom ontology

### C. Data Quality Assessment
Calculate and include:
- **Completeness**: % of expected data points present
- **Consistency**: Check for contradictory information
- **Gaps**: List missing critical information

## 5. Performance Optimizations

### A. Caching Strategy
1. Cache triage results for 24 hours
2. Cache generated reports indefinitely
3. Implement Redis for fast retrieval

### B. Async Processing
1. Use queue for report generation
2. Send webhook/notification when complete
3. Show progress indicators

## 6. Error Handling

### A. Graceful Degradation
1. If specialty triage fails, default to primary-care
2. If scales can't be calculated, omit with explanation
3. Always return partial results rather than failing completely

### B. Validation
1. Validate all IDs exist before processing
2. Check user permissions for accessing scans/dives
3. Validate specialty parameter against allowed list

## 7. Monitoring & Analytics

### A. Track Metrics
1. Triage accuracy (when specialist confirms/changes recommendation)
2. Report generation time
3. Most common specialties by symptom
4. Scale calculation success rate

### B. Audit Trail
1. Log all triage decisions with reasoning
2. Track report access
3. Monitor for unusual patterns (e.g., excessive urgent classifications)

## 8. Migration Plan

### Phase 1: Backend Updates
1. Update database schema
2. Deploy new endpoints alongside existing
3. Implement triage logic

### Phase 2: Data Structure Migration
1. Update report generation to use new structure
2. Maintain backwards compatibility
3. Migrate existing reports (optional)

### Phase 3: Frontend Integration
1. Deploy updated frontend components
2. Enable feature flags for gradual rollout
3. Monitor for issues

## 9. Testing Requirements

### A. Unit Tests
- Triage logic for each specialty
- Scale calculations
- Timeline generation
- Pattern analysis

### B. Integration Tests
- Full report generation flow
- Multi-scan aggregation
- Error scenarios

### C. Load Tests
- Concurrent report generation
- Large scan/dive selection
- Cache performance

## 10. Security Considerations

1. Ensure all patient data is encrypted at rest
2. Audit log access to sensitive reports
3. Implement rate limiting on report generation
4. Validate all user permissions
5. Sanitize all AI-generated content

## Priority Implementation Order

1. **HIGH**: Specialty triage endpoint
2. **HIGH**: Update report data structure
3. **HIGH**: Primary care endpoint
4. **MEDIUM**: Clinical scale calculations
5. **MEDIUM**: Timeline generation
6. **MEDIUM**: Enhanced AI prompts
7. **LOW**: Analytics and monitoring
8. **LOW**: Migration of existing reports