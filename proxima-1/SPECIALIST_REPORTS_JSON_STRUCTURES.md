# Specialist Reports JSON Response Structures

## Overview
This document contains the exact JSON response structures for all 15 specialist report endpoints as of January 2025. Each specialist report has unique data structures while maintaining some common patterns.

## Common Structure Pattern
All reports share this base structure:
```json
{
  "report_id": "uuid",
  "report_type": "specialty-name",
  "specialty": "specialty-name",
  "generated_at": "ISO-8601-timestamp",
  "report_data": { ... },
  "status": "success"
}
```

## Field Naming Inconsistencies to Handle
- Assessment fields: `{specialty}_assessment` (but `orthopedic_assessment` not `orthopedics_assessment`)
- Specialist findings: `{specialist}_specific_findings` (e.g., `cardiologist_specific_findings` not `cardiology_specific_findings`)
- Primary care, oncology, and physical therapy use completely different structures

## 1. Cardiology Report `/api/report/cardiology`

### Key Sections:
- `executive_summary` - Summary with key findings and urgency indicators
- `clinical_summary` - Chief complaint, HPI, risk factors
- `cardiology_assessment` - Detailed cardiac symptom evaluation
- `cardiologist_specific_findings` - Physical exam and cardiac findings
- `diagnostic_recommendations` - Tests organized by urgency
- `treatment_recommendations` - Medications and interventions
- `risk_stratification` - Clinical risk assessment
- `clinical_scales` - HEART Score, CHA2DS2-VASc, Framingham Risk

### Clinical Scales:
- **HEART Score**: Risk stratification for ACS
- **CHA2DS2-VASc**: Stroke risk in AFib
- **Framingham Risk**: 10-year cardiovascular risk

## 2. Neurology Report `/api/report/neurology`

### Key Sections:
- `neurology_assessment` - Headache characteristics, triggers, neurological symptoms
- `neurologist_specific_findings` - Focal deficits, cognitive screen, red flags
- `diagnostic_recommendations` - Neuroimaging and specialized tests
- `treatment_recommendations` - Acute and preventive therapy
- `clinical_scales` - MIDAS, HIT-6, Cognitive Screen

### Clinical Scales:
- **MIDAS Score**: Migraine disability assessment
- **HIT-6 Score**: Headache impact test
- **Cognitive Screen**: MoCA estimate

## 3. Dermatology Report `/api/report/dermatology`

### Key Sections:
- `dermatology_assessment` - Primary lesion details, skin type
- `dermatologist_specific_findings` - Dermoscopy indicated, ABCDE assessment
- `lesion_analysis` - Individual lesion assessment
- `photo_documentation` - Image analysis findings
- `surveillance_plan` - Follow-up frequency and monitoring

### Unique Features:
- ABCDE criteria evaluation
- Photo progression tracking capability
- Fitzpatrick skin type classification

## 4. Psychiatry Report `/api/report/psychiatry`

### Key Sections:
- `psychiatry_assessment` - Mood symptoms, sleep, substance use
- `mental_status_exam` - Complete MSE documentation
- `safety_assessment` - Suicide/homicide risk evaluation
- `diagnostic_formulation` - DSM-5 diagnoses with codes
- `clinical_scales` - PHQ-9, GAD-7, MDQ Screen

### Clinical Scales:
- **PHQ-9**: Depression severity
- **GAD-7**: Anxiety severity
- **MDQ Screen**: Bipolar disorder screening

## 5. Gastroenterology Report `/api/report/gastroenterology`

### Key Sections:
- `gastroenterology_assessment` - GI symptoms, constitutional symptoms
- `gastroenterologist_specific_findings` - Alarm features, differential diagnosis
- `diagnostic_recommendations` - Endoscopy, laboratory, imaging
- `clinical_scales` - Mayo Score, Montreal Classification, Harvey-Bradshaw

### Clinical Scales:
- **Mayo Score**: Ulcerative colitis activity
- **Montreal Classification**: Crohn's disease classification
- **Harvey-Bradshaw Index**: Crohn's disease activity

## 6. Endocrinology Report `/api/report/endocrinology`

### Key Sections:
- `endocrine_assessment` - Diabetes assessment, metabolic symptoms, thyroid symptoms
- `endocrinologist_specific_findings` - Medication review, lifestyle factors
- `treatment_recommendations` - Diabetes management, lifestyle interventions
- `monitoring_plan` - Glucose monitoring, lab schedule
- `clinical_scales` - Diabetes Control, Metabolic Syndrome criteria

### Clinical Scales:
- **HbA1c Category**: Diabetes control assessment
- **Metabolic Syndrome**: Criteria evaluation

## 7. Pulmonology Report `/api/report/pulmonology`

### Key Sections:
- `pulmonary_assessment` - Respiratory symptoms, functional impact
- `pulmonologist_specific_findings` - Physical exam, risk assessment
- `diagnostic_recommendations` - PFTs, imaging, laboratory
- `treatment_recommendations` - Bronchodilators, anti-inflammatory
- `clinical_scales` - CAT Score, mMRC Dyspnea, ACT Score, GOLD

### Clinical Scales:
- **CAT Score**: COPD Assessment Test
- **mMRC Dyspnea Scale**: Breathlessness scale
- **ACT Score**: Asthma Control Test
- **GOLD Classification**: COPD severity

## 8. Orthopedics Report `/api/report/orthopedics`

### Key Sections:
- `orthopedic_assessment` - Pain characteristics, mechanical symptoms
- `orthopedist_specific_findings` - Injury mechanism, red flags
- `diagnostic_recommendations` - Imaging recommendations
- `treatment_recommendations` - Conservative, injection, surgical options
- `rehabilitation_plan` - Phased recovery plan
- `clinical_scales` - KOOS, Lysholm Knee Score

### Clinical Scales:
- **KOOS**: Knee injury and Osteoarthritis Outcome Score
- **Lysholm Knee Score**: Knee function assessment

## 9. Rheumatology Report `/api/report/rheumatology`

### Key Sections:
- `rheumatologic_assessment` - Joint involvement pattern, systemic features
- `rheumatologist_specific_findings` - Disease classification and activity
- `diagnostic_recommendations` - Serologies, imaging
- `treatment_recommendations` - DMARDs, biologics
- `monitoring_plan` - Disease activity measures
- `clinical_scales` - DAS28, CDAI, HAQ-DI, ACR/EULAR Criteria

### Clinical Scales:
- **DAS28**: Disease Activity Score
- **CDAI**: Clinical Disease Activity Index
- **HAQ-DI**: Health Assessment Questionnaire
- **ACR/EULAR Criteria**: RA classification

## 10. Primary Care Report `/api/report/primary-care`

### Unique Structure:
- `clinical_summary` - Chief complaints, comprehensive ROS
- `preventive_care_gaps` - Screenings, immunizations, health maintenance
- `chronic_disease_assessment` - Existing conditions and risk factors
- `medication_reconciliation` - Current meds and adherence
- `specialist_coordination` - Referral management
- `health_optimization` - Lifestyle counseling, behavioral health
- `care_plan_summary` - Immediate, short-term, and long-term goals

### Different Focus:
- Preventive care emphasis
- Care coordination
- Health maintenance tracking

## 11. Nephrology Report `/api/report/nephrology`

### Key Sections:
- `nephrology_assessment` - Renal symptoms, BP control, volume status
- `diagnostic_recommendations` - Renal function tests, imaging
- `treatment_recommendations` - CKD management, acute issues
- `clinical_scales` - CKD Staging, Volume Assessment

### Clinical Scales:
- **CKD-EPI eGFR**: Kidney function staging
- **Albuminuria Categories**: A1-A3 classification

## 12. Urology Report `/api/report/urology`

### Key Sections:
- `urology_assessment` - LUTS characterization, pain, sexual function
- `diagnostic_recommendations` - PSA, uroflowmetry, imaging
- `treatment_recommendations` - Medical therapy, behavioral, surgical options
- `clinical_scales` - IPSS, Bladder Diary

### Clinical Scales:
- **IPSS**: International Prostate Symptom Score
- **QoL Score**: Quality of life assessment

## 13. Gynecology Report `/api/report/gynecology`

### Key Sections:
- `gynecologic_assessment` - Menstrual abnormalities, hormonal symptoms
- `diagnostic_recommendations` - Hormonal workup, imaging
- `treatment_recommendations` - Menstrual management, PCOS treatment
- `preventive_care` - Screening schedules
- `clinical_assessment` - Menstrual pattern classification, PCOS criteria

### Clinical Features:
- Rotterdam criteria for PCOS
- Menstrual pattern classification
- Fertility considerations

## 14. Oncology Report `/api/report/oncology`

### Unique Structure:
- `symptom_analysis` - Constitutional and localized symptoms
- `risk_assessment` - Personal, family, environmental factors
- `diagnostic_priorities` - Immediate tests, imaging, tissue diagnosis
- `differential_diagnosis` - Hematologic, solid tumors, infectious
- `staging_workup` - Complete staging protocol
- `referral_recommendations` - Urgent oncology referral
- `clinical_urgency_scale` - Red flag assessment

### Different Focus:
- Urgency assessment
- Comprehensive differential
- Staging protocols
- Psychosocial support

## 15. Physical Therapy Report `/api/report/physical-therapy`

### Unique Structure:
- `functional_assessment` - Primary limitations, pain with movement
- `movement_analysis` - Posture, movement patterns, muscle imbalances
- `treatment_plan` - Phased rehabilitation (Phase 1-3)
- `home_exercise_program` - Detailed exercise prescriptions
- `expected_outcomes` - Timeline-based goals
- `education_priorities` - Patient education topics
- `equipment_recommendations` - Adaptive equipment needs

### Different Focus:
- Functional limitations
- Movement quality
- Exercise prescription
- Return to activity planning

## Implementation Notes

### Handling Inconsistencies:
1. Use specialty field to determine which sections to display
2. Map inconsistent field names (e.g., `cardiologist_specific_findings` vs `neurologist_specific_findings`)
3. Handle missing sections gracefully
4. Some specialties use completely different structures (primary care, oncology, physical therapy)

### UI Considerations:
1. Each specialty needs custom section rendering
2. Clinical scales should be prominently displayed with visual indicators
3. Urgency indicators should use appropriate colors (red for urgent, yellow for moderate)
4. Treatment recommendations should be actionable and clear
5. Diagnostic recommendations should be organized by timeline/urgency

### Data Validation:
1. Check for presence of expected fields before rendering
2. Handle missing clinical scales gracefully
3. Provide fallbacks for missing data sections
4. Validate confidence scores are between 0-1