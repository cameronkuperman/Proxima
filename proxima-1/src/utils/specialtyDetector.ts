// Utility for detecting and normalizing specialty names from report data
export type SpecialtyType = 
  | 'cardiology' 
  | 'neurology' 
  | 'psychiatry' 
  | 'dermatology' 
  | 'gastroenterology' 
  | 'endocrinology' 
  | 'pulmonology' 
  | 'primary-care' 
  | 'orthopedics' 
  | 'rheumatology' 
  | 'urology' 
  | 'nephrology' 
  | 'gynecology' 
  | 'oncology' 
  | 'physical-therapy' 
  | 'infectious-disease';

// Mapping for backend field names (inconsistent naming)
export const specialtyFieldMap = {
  'cardiology': { 
    assessment: 'cardiology_assessment', 
    findings: 'cardiologist_specific_findings',
    scales: ['HEART_Score', 'CHA2DS2_VASc', 'Framingham_Risk']
  },
  'neurology': { 
    assessment: 'neurology_assessment', 
    findings: 'neurologist_specific_findings',
    scales: ['MIDAS_Score', 'HIT6_Score', 'Cognitive_Screen']
  },
  'dermatology': { 
    assessment: 'dermatology_assessment', 
    findings: 'dermatologist_specific_findings',
    scales: []
  },
  'orthopedics': { 
    assessment: 'orthopedic_assessment', // Note: not orthopedics_assessment
    findings: 'orthopedist_specific_findings',
    scales: ['KOOS', 'Lysholm_Knee_Score', 'Oswestry_Disability_Index']
  },
  'psychiatry': { 
    assessment: 'psychiatry_assessment', 
    findings: 'psychiatrist_specific_findings',
    scales: ['PHQ9_Score', 'GAD7_Score', 'MDQ_Screen']
  },
  'gastroenterology': { 
    assessment: 'gastroenterology_assessment', 
    findings: 'gastroenterologist_specific_findings',
    scales: ['Mayo_Score_Estimate', 'Montreal_Classification', 'Harvey_Bradshaw_Estimate']
  },
  'endocrinology': { 
    assessment: 'endocrine_assessment', // Note: not endocrinology_assessment
    findings: 'endocrinologist_specific_findings',
    scales: ['Diabetes_Control', 'Metabolic_Syndrome']
  },
  'pulmonology': { 
    assessment: 'pulmonary_assessment', // Note: not pulmonology_assessment
    findings: 'pulmonologist_specific_findings',
    scales: ['CAT_Score', 'mMRC_Dyspnea', 'ACT_Score', 'GOLD_Estimate']
  },
  'rheumatology': { 
    assessment: 'rheumatologic_assessment', // Note: not rheumatology_assessment
    findings: 'rheumatologist_specific_findings',
    scales: ['DAS28_Estimate', 'CDAI', 'HAQ-DI_Estimate', 'ACR_EULAR_Criteria']
  },
  'nephrology': { 
    assessment: 'nephrology_assessment', 
    findings: null, // No specialist-specific findings field
    scales: ['CKD_Staging', 'Volume_Assessment']
  },
  'urology': { 
    assessment: 'urology_assessment', 
    findings: null,
    scales: ['IPSS', 'Bladder_Diary']
  },
  'gynecology': { 
    assessment: 'gynecologic_assessment', // Note: not gynecology_assessment
    findings: null,
    scales: ['Menstrual_Pattern', 'PCOS_Criteria', 'Bleeding_Assessment']
  },
  'oncology': { 
    assessment: null, // Uses different structure
    findings: null,
    scales: []
  },
  'physical-therapy': { 
    assessment: null, // Uses different structure
    findings: null,
    scales: []
  },
  'primary-care': { 
    special: true, // Uses completely different structure
    assessment: null,
    findings: null,
    scales: []
  },
  'infectious-disease': {
    assessment: 'infectious_disease_assessment',
    findings: 'infectious_disease_specific_findings',
    scales: []
  }
} as const;

// All possible specialty variations we might encounter
const specialtyVariations: Record<string, SpecialtyType> = {
  // Exact matches
  'cardiology': 'cardiology',
  'neurology': 'neurology',
  'psychiatry': 'psychiatry',
  'dermatology': 'dermatology',
  'gastroenterology': 'gastroenterology',
  'endocrinology': 'endocrinology',
  'pulmonology': 'pulmonology',
  'orthopedics': 'orthopedics',
  'rheumatology': 'rheumatology',
  'nephrology': 'nephrology',
  'urology': 'urology',
  'gynecology': 'gynecology',
  'oncology': 'oncology',
  
  // Hyphenated versions
  'primary-care': 'primary-care',
  'physical-therapy': 'physical-therapy',
  'infectious-disease': 'infectious-disease',
  
  // Underscore versions
  'primary_care': 'primary-care',
  'physical_therapy': 'physical-therapy',
  'infectious_disease': 'infectious-disease',
  
  // Alternative names
  'primary': 'primary-care',
  'pt': 'physical-therapy',
  'physio': 'physical-therapy',
  'infectious': 'infectious-disease',
  'hematology': 'oncology', // Group with oncology for now
  
  // Specialist focused
  'specialist_focused': null, // Will need to detect from data
  'specialist': null // Will need to detect from data
};

/**
 * Detects the specialty from report data using multiple strategies
 */
export function detectSpecialty(report: any): SpecialtyType | null {
  console.log('🔍 Detecting specialty from report:', {
    specialty: report?.specialty,
    report_type: report?.report_type,
    data_keys: Object.keys(report?.report_data || {})
  });

  const data = report?.report_data || {};
  
  // Strategy 1: Direct specialty field (most reliable)
  if (report.specialty) {
    const normalized = specialtyVariations[report.specialty.toLowerCase()];
    if (normalized) {
      console.log('✅ Found specialty from report.specialty:', normalized);
      return normalized;
    }
  }
  
  // Strategy 2: Report type field
  if (report.report_type) {
    const normalized = specialtyVariations[report.report_type.toLowerCase()];
    if (normalized) {
      console.log('✅ Found specialty from report_type:', normalized);
      return normalized;
    }
  }
  
  // Strategy 3: Check for specialty-specific assessment fields
  for (const [specialty, config] of Object.entries(specialtyFieldMap)) {
    if ('special' in config) continue; // Skip special cases
    
    if (config.assessment && data[config.assessment]) {
      console.log(`✅ Found specialty from ${config.assessment} field:`, specialty);
      return specialty as SpecialtyType;
    }
    
    if (config.findings && data[config.findings]) {
      console.log(`✅ Found specialty from ${config.findings} field:`, specialty);
      return specialty as SpecialtyType;
    }
  }
  
  // Strategy 4: Check for specialty-specific sections
  const dataKeys = Object.keys(data);
  for (const key of dataKeys) {
    // Check for patterns like "cardiology_specific" or "cardiology_assessment"
    const match = key.match(/^(\w+?)_(?:specific|assessment|findings)$/);
    if (match) {
      const potential = match[1];
      // Try to find a matching specialty
      for (const [specialty, config] of Object.entries(specialtyFieldMap)) {
        if (config.assessment?.startsWith(potential) || config.findings?.startsWith(potential)) {
          console.log(`✅ Found specialty from data key pattern ${key}:`, specialty);
          return specialty as SpecialtyType;
        }
      }
    }
  }
  
  // Strategy 5: Check executive summary for specialist focus
  if (data.executive_summary?.specialist_focus) {
    const focus = data.executive_summary.specialist_focus.toLowerCase();
    const normalized = specialtyVariations[focus];
    if (normalized) {
      console.log('✅ Found specialty from executive_summary.specialist_focus:', normalized);
      return normalized;
    }
  }
  
  // Strategy 6: Check for oncology-specific structure
  if (data.symptom_analysis && data.risk_assessment && data.diagnostic_priorities) {
    console.log('✅ Detected oncology from structure');
    return 'oncology';
  }
  
  // Strategy 7: Check for physical therapy structure
  if (data.functional_assessment && data.movement_analysis && data.treatment_plan) {
    console.log('✅ Detected physical-therapy from structure');
    return 'physical-therapy';
  }
  
  // Strategy 8: Check for primary care structure
  if (data.preventive_care_gaps && data.chronic_disease_assessment) {
    console.log('✅ Detected primary-care from structure');
    return 'primary-care';
  }
  
  console.warn('⚠️ Could not detect specialty, returning null');
  return null;
}

/**
 * Gets the correct field names for a specialty
 */
export function getSpecialtyFields(specialty: SpecialtyType) {
  return specialtyFieldMap[specialty] || {
    assessment: `${specialty}_assessment`,
    findings: `${specialty}_specific_findings`,
    scales: []
  };
}

/**
 * Extracts specialty-specific data from report
 */
export function extractSpecialtyData(report: any, specialty: SpecialtyType) {
  const data = report?.report_data || {};
  const fields = getSpecialtyFields(specialty);
  
  const result: any = {
    assessment: null,
    findings: null,
    scales: {},
    executive_summary: data.executive_summary || null,
    clinical_summary: data.clinical_summary || null,
    diagnostic_recommendations: data.diagnostic_recommendations || null,
    treatment_recommendations: data.treatment_recommendations || null,
    follow_up_plan: data.follow_up_plan || null
  };
  
  // Extract assessment data
  if (fields.assessment && data[fields.assessment]) {
    result.assessment = data[fields.assessment];
  }
  
  // Extract findings data
  if (fields.findings && data[fields.findings]) {
    result.findings = data[fields.findings];
  }
  
  // Extract clinical scales
  if (fields.scales && fields.scales.length > 0) {
    for (const scaleName of fields.scales) {
      // Check in assessment first
      if (result.assessment?.clinical_scales?.[scaleName]) {
        result.scales[scaleName] = result.assessment.clinical_scales[scaleName];
      }
      // Then check in main data
      else if (data.clinical_scales?.[scaleName]) {
        result.scales[scaleName] = data.clinical_scales[scaleName];
      }
    }
  }
  
  // Special handling for certain specialties
  if (specialty === 'primary-care') {
    result.preventive_care_gaps = data.preventive_care_gaps;
    result.chronic_disease_assessment = data.chronic_disease_assessment;
    result.health_optimization = data.health_optimization;
    result.care_plan_summary = data.care_plan_summary;
  } else if (specialty === 'oncology') {
    result.symptom_analysis = data.symptom_analysis;
    result.risk_assessment = data.risk_assessment;
    result.diagnostic_priorities = data.diagnostic_priorities;
    result.differential_diagnosis = data.differential_diagnosis;
    result.staging_workup = data.staging_workup;
  } else if (specialty === 'physical-therapy') {
    result.functional_assessment = data.functional_assessment;
    result.movement_analysis = data.movement_analysis;
    result.treatment_plan = data.treatment_plan;
    result.home_exercise_program = data.home_exercise_program;
    result.expected_outcomes = data.expected_outcomes;
  }
  
  return result;
}