'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Heart,
  Brain,
  Activity,
  Stethoscope,
  FileText,
  AlertCircle,
  CheckCircle,
  ChevronDown,
  ChevronRight,
  User,
  Calendar,
  Clipboard,
  TestTube,
  Pill,
  Target,
  TrendingUp,
  Shield,
  AlertTriangle,
  Info,
  Copy,
  Check,
  Zap,
  Eye,
  Palette,
  Wind,
  Cookie,
  BrainCircuit,
  Gauge,
  Clock,
  Users
} from 'lucide-react';
import { detectSpecialty, extractSpecialtyData } from '@/utils/specialtyDetector';
import { CardiologySpecialistReport } from './specialties/CardiologySpecialistReport';
import { NeurologySpecialistReport } from './specialties/NeurologySpecialistReport';
import { PsychiatrySpecialistReport } from './specialties/PsychiatrySpecialistReport';
import { OncologySpecialistReport } from './specialties/OncologySpecialistReport';
import { PrimaryCareSpecialistReport } from './specialties/PrimaryCareSpecialistReport';
import { OrthopedicsSpecialistReport } from './specialties/OrthopedicsSpecialistReport';
import { SymptomTimeline } from './SymptomTimeline';
import { ClinicalScales } from './ClinicalScales';
import { TreatmentPlan } from './TreatmentPlan';
import { ActionableSummary } from './ActionableSummary';
import { DiagnosticPriorities } from './DiagnosticPriorities';
import { CareCoordination } from './CareCoordination';
import { DataQualityNotes } from './DataQualityNotes';

interface SpecialistReportProps {
  report: any;
}

// Specialty configurations with icons and colors
const specialtyConfig = {
  cardiology: {
    icon: Heart,
    color: 'red',
    gradient: 'from-red-600 to-pink-600',
    bgLight: 'bg-red-50',
    borderColor: 'border-red-200',
    textColor: 'text-red-600',
    title: 'Cardiology Consultation Report'
  },
  neurology: {
    icon: Brain,
    color: 'purple',
    gradient: 'from-purple-600 to-indigo-600',
    bgLight: 'bg-purple-50',
    borderColor: 'border-purple-200',
    textColor: 'text-purple-600',
    title: 'Neurology Consultation Report'
  },
  psychiatry: {
    icon: BrainCircuit,
    color: 'blue',
    gradient: 'from-blue-600 to-cyan-600',
    bgLight: 'bg-blue-50',
    borderColor: 'border-blue-200',
    textColor: 'text-blue-600',
    title: 'Psychiatry Consultation Report'
  },
  dermatology: {
    icon: Palette,
    color: 'orange',
    gradient: 'from-orange-600 to-yellow-600',
    bgLight: 'bg-orange-50',
    borderColor: 'border-orange-200',
    textColor: 'text-orange-600',
    title: 'Dermatology Consultation Report'
  },
  gastroenterology: {
    icon: Cookie,
    color: 'green',
    gradient: 'from-green-600 to-emerald-600',
    bgLight: 'bg-green-50',
    borderColor: 'border-green-200',
    textColor: 'text-green-600',
    title: 'Gastroenterology Consultation Report'
  },
  endocrinology: {
    icon: Activity,
    color: 'indigo',
    gradient: 'from-indigo-600 to-purple-600',
    bgLight: 'bg-indigo-50',
    borderColor: 'border-indigo-200',
    textColor: 'text-indigo-600',
    title: 'Endocrinology Consultation Report'
  },
  pulmonology: {
    icon: Wind,
    color: 'cyan',
    gradient: 'from-cyan-600 to-blue-600',
    bgLight: 'bg-cyan-50',
    borderColor: 'border-cyan-200',
    textColor: 'text-cyan-600',
    title: 'Pulmonology Consultation Report'
  },
  'primary-care': {
    icon: Stethoscope,
    color: 'gray',
    gradient: 'from-gray-600 to-slate-600',
    bgLight: 'bg-gray-50',
    borderColor: 'border-gray-200',
    textColor: 'text-gray-600',
    title: 'Primary Care Consultation Report'
  },
  orthopedics: {
    icon: Activity,
    color: 'amber',
    gradient: 'from-amber-600 to-orange-600',
    bgLight: 'bg-amber-50',
    borderColor: 'border-amber-200',
    textColor: 'text-amber-600',
    title: 'Orthopedics Consultation Report'
  },
  rheumatology: {
    icon: Activity,
    color: 'violet',
    gradient: 'from-violet-600 to-purple-600',
    bgLight: 'bg-violet-50',
    borderColor: 'border-violet-200',
    textColor: 'text-violet-600',
    title: 'Rheumatology Consultation Report'
  },
  urology: {
    icon: Stethoscope,
    color: 'teal',
    gradient: 'from-teal-600 to-cyan-600',
    bgLight: 'bg-teal-50',
    borderColor: 'border-teal-200',
    textColor: 'text-teal-600',
    title: 'Urology Consultation Report'
  },
  nephrology: {
    icon: Activity,
    color: 'sky',
    gradient: 'from-sky-600 to-blue-600',
    bgLight: 'bg-sky-50',
    borderColor: 'border-sky-200',
    textColor: 'text-sky-600',
    title: 'Nephrology Consultation Report'
  },
  gynecology: {
    icon: Users,
    color: 'pink',
    gradient: 'from-pink-600 to-rose-600',
    bgLight: 'bg-pink-50',
    borderColor: 'border-pink-200',
    textColor: 'text-pink-600',
    title: 'Gynecology Consultation Report'
  },
  oncology: {
    icon: Shield,
    color: 'purple',
    gradient: 'from-purple-600 to-violet-600',
    bgLight: 'bg-purple-50',
    borderColor: 'border-purple-200',
    textColor: 'text-purple-600',
    title: 'Oncology Consultation Report'
  },
  'physical-therapy': {
    icon: Activity,
    color: 'emerald',
    gradient: 'from-emerald-600 to-green-600',
    bgLight: 'bg-emerald-50',
    borderColor: 'border-emerald-200',
    textColor: 'text-emerald-600',
    title: 'Physical Therapy Consultation Report'
  },
  'infectious-disease': {
    icon: AlertCircle,
    color: 'rose',
    gradient: 'from-rose-600 to-pink-600',
    bgLight: 'bg-rose-50',
    borderColor: 'border-rose-200',
    textColor: 'text-rose-600',
    title: 'Infectious Disease Consultation Report'
  },
  specialist: {
    icon: Stethoscope,
    color: 'slate',
    gradient: 'from-slate-600 to-gray-600',
    bgLight: 'bg-slate-50',
    borderColor: 'border-slate-200',
    textColor: 'text-slate-600',
    title: 'Specialist Consultation Report'
  }
};

// Mapping for specialty field names (backend uses inconsistent naming)
const specialtyFieldMap = {
  'cardiology': { assessment: 'cardiology_assessment', findings: 'cardiologist_specific_findings' },
  'neurology': { assessment: 'neurology_assessment', findings: 'neurologist_specific_findings' },
  'dermatology': { assessment: 'dermatology_assessment', findings: 'dermatologist_specific_findings' },
  'orthopedics': { assessment: 'orthopedic_assessment', findings: 'orthopedist_specific_findings' },
  'psychiatry': { assessment: 'psychiatry_assessment', findings: 'psychiatrist_specific_findings' },
  'gastroenterology': { assessment: 'gastroenterology_assessment', findings: 'gastroenterologist_specific_findings' },
  'endocrinology': { assessment: 'endocrine_assessment', findings: 'endocrinologist_specific_findings' },
  'pulmonology': { assessment: 'pulmonary_assessment', findings: 'pulmonologist_specific_findings' },
  'rheumatology': { assessment: 'rheumatologic_assessment', findings: 'rheumatologist_specific_findings' },
  'nephrology': { assessment: 'nephrology_assessment', findings: null },
  'urology': { assessment: 'urology_assessment', findings: null },
  'gynecology': { assessment: 'gynecologic_assessment', findings: null },
  'oncology': { assessment: null, findings: null }, // Uses general structure
  'physical-therapy': { assessment: null, findings: null }, // Uses general structure
  'primary-care': { special: true } // Uses different structure entirely
} as const;

export const SpecialistReport: React.FC<SpecialistReportProps> = ({ report }) => {
  console.log('=== SPECIALIST REPORT COMPONENT ===');
  console.log('Full Report:', report);
  console.log('Report Type:', report.report_type);
  console.log('Report Data:', report.report_data);
  console.log('Report Specialty from report:', report.specialty);
  console.log('Report Data Keys:', Object.keys(report.report_data || {}));
  
  // Use the new specialty detector utility
  const detectedSpecialty = detectSpecialty(report);
  console.log('Detected Specialty using utility:', detectedSpecialty);
  
  // Route to appropriate specialty component
  switch (detectedSpecialty) {
    case 'cardiology':
      return <CardiologySpecialistReport report={report} />;
    case 'neurology':
      return <NeurologySpecialistReport report={report} />;
    case 'psychiatry':
      return <PsychiatrySpecialistReport report={report} />;
    case 'oncology':
      return <OncologySpecialistReport report={report} />;
    case 'primary-care':
      return <PrimaryCareSpecialistReport report={report} />;
    case 'orthopedics':
      return <OrthopedicsSpecialistReport report={report} />;
    // TODO: Add other specialty components as they are created
    default:
      // Fall back to the generic specialist report for now
      return <GenericSpecialistReport report={report} />;
  }
};

// Generic specialist report component (the original implementation)
const GenericSpecialistReport: React.FC<SpecialistReportProps> = ({ report }) => {
  // Start with all sections expanded
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set([
    'actionable', 'summary', 'clinical', 'specialty', 'diagnostics', 
    'tests', 'treatment', 'billing', 'coordination', 'quality'
  ]));
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  
  const data = report.report_data;
  
  // Detect specialty from report data (for the generic component)
  const detectSpecialtyLegacy = () => {
    // FIRST: Check if specialty is directly in the report (but not generic "specialist")
    if (report.specialty && report.specialty !== 'specialist') {
      console.log('Found specialty in report:', report.specialty);
      return report.specialty;
    }
    
    // SECOND: Check if report_type contains the specialty (but not generic "specialist_focused")
    if (report.report_type && report.report_type !== 'specialist_focused' && report.report_type !== 'specialist') {
      console.log('Found specialty in report_type:', report.report_type);
      return report.report_type;
    }
    
    // THIRD: Check for specialty-specific assessment sections
    const specialties = Object.keys(specialtyConfig);
    for (const specialty of specialties) {
      if (data[`${specialty}_specific`]) {
        console.log(`Found ${specialty}_specific in data`);
        return specialty;
      }
      if (data[`${specialty}_assessment`]) {
        console.log(`Found ${specialty}_assessment in data`);
        return specialty;
      }
      if (data[`${specialty}_specific_findings`]) {
        console.log(`Found ${specialty}_specific_findings in data`);
        return specialty;
      }
    }
    
    // FOURTH: Check executive summary for specialist focus
    if (data?.executive_summary?.specialist_focus) {
      const focus = data.executive_summary.specialist_focus.toLowerCase();
      const found = specialties.find(s => focus.includes(s));
      if (found) {
        console.log('Found specialty in executive_summary.specialist_focus:', found);
        return found;
      }
    }
    
    // LAST RESORT: Default to specialist (generic) or primary-care
    console.warn('WARNING: Could not detect specialty, defaulting to specialist');
    console.log('Report structure:', { 
      specialty: report.specialty,
      report_type: report.report_type,
      data_keys: Object.keys(data || {}),
      specialist_focus: data?.executive_summary?.specialist_focus
    });
    // Return a safe default that exists in specialtyConfig
    return 'specialist'; // Generic specialist as safest default
  };
  
  const specialty = detectSpecialtyLegacy();
  console.log('Detected Specialty (Legacy):', specialty);
  
  // Add fallback for unknown specialties
  const config = specialtyConfig[specialty as keyof typeof specialtyConfig] || {
    icon: Stethoscope,
    color: 'gray',
    gradient: 'from-gray-600 to-slate-600',
    bgLight: 'bg-gray-50',
    borderColor: 'border-gray-200',
    textColor: 'text-gray-600',
    title: `${specialty?.charAt(0).toUpperCase() + specialty?.slice(1) || 'Medical'} Consultation Report`
  };
  const Icon = config.icon;
  
  // Get the correct field names for this specialty
  const fieldMapping = specialtyFieldMap[specialty as keyof typeof specialtyFieldMap];
  let specialtyAssessment = {};
  let specialtyFindings = {};
  
  if (fieldMapping && !('special' in fieldMapping)) {
    if (fieldMapping.assessment) {
      specialtyAssessment = data[fieldMapping.assessment] || {};
    }
    if (fieldMapping.findings) {
      specialtyFindings = data[fieldMapping.findings] || {};
    }
  } else if (specialty === 'primary-care') {
    // Primary care uses different structure
    specialtyAssessment = data.preventive_care_gaps || {};
    specialtyFindings = data.chronic_disease_assessment || {};
  } else {
    // Fallback to old naming convention
    specialtyAssessment = data[`${specialty}_assessment`] || data[`${specialty}_specific`] || {};
    specialtyFindings = data[`${specialty}_specific_findings`] || {};
  }
  
  // Combine assessment and findings for display
  const specialtyData: any = { ...specialtyAssessment, ...specialtyFindings };
  
  console.log('Specialty Assessment:', specialtyAssessment);
  console.log('Specialty Findings:', specialtyFindings);
  console.log('Combined Specialty Data:', specialtyData);
  console.log('Config:', config);
  
  const toggleSection = (section: string) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(section)) {
        newSet.delete(section);
      } else {
        newSet.add(section);
      }
      return newSet;
    });
  };

  const copyToClipboard = (text: string, codeType: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(codeType);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const Section = ({ 
    id, 
    title, 
    icon: SectionIcon, 
    children, 
    className = "" 
  }: { 
    id: string; 
    title: string; 
    icon: any; 
    children: React.ReactNode; 
    className?: string; 
  }) => {
    const isExpanded = expandedSections.has(id);
    
    return (
      <motion.div 
        className={`bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden ${className}`}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <button
          onClick={() => toggleSection(id)}
          className="w-full p-6 flex items-center justify-between hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center gap-4">
            <div className={`p-3 bg-gradient-to-r ${config.gradient} bg-opacity-10 rounded-lg`}>
              <SectionIcon className={`w-6 h-6 ${config.textColor}`} />
            </div>
            <h2 className="text-xl font-bold text-gray-900">{title}</h2>
          </div>
          {isExpanded ? (
            <ChevronDown className="w-5 h-5 text-gray-500" />
          ) : (
            <ChevronRight className="w-5 h-5 text-gray-500" />
          )}
        </button>
        
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: 'auto' }}
              exit={{ height: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <div className="p-6 pt-0 border-t border-gray-100">
                {children}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    );
  };

  // Specialty-specific component renderers
  const renderCardiologySpecific = () => {
    // Use enhanced data if available, fall back to legacy
    const assessment = data.cardiology_assessment || {};
    const findings = data.cardiology_specific_findings || {};
    const scales = assessment.clinical_scales || {};
    
    return (
      <div className="space-y-6">
        {/* Clinical Scales */}
        {Object.keys(scales).length > 0 && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Clinical Risk Scores</h3>
            <ClinicalScales scales={scales} specialty="cardiology" />
          </div>
        )}
        
        {/* Functional Capacity */}
        {assessment.functional_capacity && (
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <h4 className="font-semibold text-orange-900 mb-3">Functional Capacity Assessment</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-orange-700">Current</p>
                <p className="text-2xl font-bold text-orange-900">
                  {assessment.functional_capacity.current} {assessment.functional_capacity.units}
                </p>
              </div>
              <div>
                <p className="text-sm text-orange-700">Baseline</p>
                <p className="text-2xl font-bold text-orange-900">
                  {assessment.functional_capacity.baseline} {assessment.functional_capacity.units}
                </p>
              </div>
            </div>
            {assessment.nyha_class && (
              <p className="mt-3 text-orange-800">
                <strong>NYHA Class:</strong> {assessment.nyha_class}
              </p>
            )}
          </div>
        )}
        
        {/* Legacy risk stratification */}
        {specialtyData.risk_stratification && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Cardiovascular Risk Assessment</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {specialtyData.risk_stratification.ascvd_risk && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-600">ASCVD Risk</span>
                    <Gauge className="w-5 h-5 text-red-600" />
                  </div>
                  <p className="text-2xl font-bold text-red-700">{specialtyData.risk_stratification.ascvd_risk}</p>
                  <p className="text-xs text-gray-600 mt-1">10-year risk</p>
                </div>
              )}
              {specialtyData.risk_stratification.heart_failure_risk && (
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-600">Heart Failure Risk</span>
                    <Heart className="w-5 h-5 text-orange-600" />
                  </div>
                  <p className="text-2xl font-bold text-orange-700">{specialtyData.risk_stratification.heart_failure_risk}</p>
                </div>
              )}
              {specialtyData.risk_stratification.arrhythmia_risk && (
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-600">Arrhythmia Risk</span>
                    <Activity className="w-5 h-5 text-purple-600" />
                  </div>
                  <p className="text-2xl font-bold text-purple-700">{specialtyData.risk_stratification.arrhythmia_risk}</p>
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* ECG Interpretation */}
        {(findings.ecg_interpretation || specialtyData.ecg_interpretation) && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-semibold text-blue-900 mb-2">ECG Interpretation</h4>
            <p className="text-blue-800">{findings.ecg_interpretation || specialtyData.ecg_interpretation}</p>
          </div>
        )}
        
        {/* Hemodynamic Assessment */}
        {specialtyData.hemodynamic_assessment && (
          <div>
            <h4 className="font-semibold text-gray-900 mb-3">Hemodynamic Parameters</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {Object.entries(specialtyData.hemodynamic_assessment).map(([param, value]) => (
                <div key={param} className="bg-gray-50 rounded-lg p-3 text-center">
                  <p className="text-xs text-gray-600">{param.replace(/_/g, ' ').toUpperCase()}</p>
                  <p className="text-lg font-bold text-gray-900">{value as string}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderNeurologySpecific = () => {
    // Use enhanced data if available
    const assessment = data.neurology_assessment || {};
    const findings = data.neurology_specific_findings || {};
    const scales = assessment.clinical_scales || {};
    
    return (
      <div className="space-y-6">
        {/* Clinical Scales (MIDAS, HIT-6) */}
        {Object.keys(scales).length > 0 && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Clinical Assessment Scales</h3>
            <ClinicalScales scales={scales} specialty="neurology" />
          </div>
        )}
        
        {/* Headache Pattern */}
        {assessment.headache_pattern && (
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <h4 className="font-semibold text-purple-900 mb-3">Headache Pattern Analysis</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-purple-700">Type</p>
                <p className="font-medium text-purple-900">{assessment.headache_pattern.type}</p>
              </div>
              <div>
                <p className="text-sm text-purple-700">Frequency</p>
                <p className="font-medium text-purple-900">{assessment.headache_pattern.frequency}</p>
              </div>
              <div>
                <p className="text-sm text-purple-700">Duration</p>
                <p className="font-medium text-purple-900">{assessment.headache_pattern.duration}</p>
              </div>
              <div>
                <p className="text-sm text-purple-700">Characteristics</p>
                <p className="font-medium text-purple-900">{assessment.headache_pattern.characteristics?.join(', ')}</p>
              </div>
            </div>
          </div>
        )}
        
        {/* Red Flags */}
        {findings.red_flags && findings.red_flags.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h4 className="font-semibold text-red-900 mb-2 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Neurological Red Flags
            </h4>
            <ul className="space-y-1">
              {findings.red_flags.map((flag: string, idx: number) => (
                <li key={idx} className="text-red-800 flex items-start gap-2">
                  <span className="text-red-600 mt-0.5">•</span>
                  {flag}
                </li>
              ))}
            </ul>
          </div>
        )}
        
        {/* Legacy neurological exam */}
        {specialtyData.neurological_exam && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Neurological Examination Findings</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(specialtyData.neurological_exam).map(([exam, finding]) => (
                <div key={exam} className="flex items-start gap-3 p-3 bg-purple-50 rounded-lg">
                  <Brain className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-purple-900">{exam.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</p>
                    <p className="text-sm text-purple-700">{finding as string}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Legacy cognitive assessment */}
        {specialtyData.cognitive_assessment && (
          <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
            <h4 className="font-semibold text-indigo-900 mb-3">Cognitive Assessment</h4>
            <div className="space-y-2">
              <p className="text-indigo-800"><strong>Score:</strong> {specialtyData.cognitive_assessment.score}</p>
              <p className="text-indigo-800"><strong>Interpretation:</strong> {specialtyData.cognitive_assessment.interpretation}</p>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderPsychiatrySpecific = () => {
    const assessment = data.psychiatry_assessment || {};
    const findings = data.psychiatry_specific_findings || {};
    const scales = assessment.clinical_scales || {};
    
    return (
      <div className="space-y-6">
        {/* Clinical Scales (PHQ-9, GAD-7) */}
        {Object.keys(scales).length > 0 && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Clinical Assessment Scales</h3>
            <ClinicalScales scales={scales} specialty="psychiatry" />
          </div>
        )}
        
        {/* Risk Assessment - Enhanced */}
        {findings.risk_assessment && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h4 className="font-semibold text-red-900 mb-3 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Risk Assessment
            </h4>
            <div className="space-y-3">
              <div>
                <p className="text-red-800"><strong>Suicide Risk:</strong> {findings.risk_assessment.suicide_risk}</p>
                <p className="text-red-800"><strong>Violence Risk:</strong> {findings.risk_assessment.violence_risk}</p>
              </div>
              {findings.risk_assessment.protective_factors && findings.risk_assessment.protective_factors.length > 0 && (
                <div>
                  <p className="font-medium text-red-900 mb-1">Protective Factors:</p>
                  <ul className="space-y-1">
                    {findings.risk_assessment.protective_factors.map((factor: string, idx: number) => (
                      <li key={idx} className="text-green-700 flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                        {factor}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* Mental Status Exam - Enhanced */}
        {findings.mental_status_exam && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Mental Status Examination</h3>
            <div className="space-y-3">
              {Object.entries(findings.mental_status_exam).map(([category, assessment]) => (
                <div key={category} className="bg-blue-50 rounded-lg p-4">
                  <h4 className="font-medium text-blue-900 mb-1">
                    {category.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </h4>
                  <p className="text-blue-700">{assessment as string}</p>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Legacy mental status exam */}
        {!findings.mental_status_exam && specialtyData.mental_status_exam && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Mental Status Examination</h3>
            <div className="space-y-3">
              {Object.entries(specialtyData.mental_status_exam).map(([category, assessment]) => (
                <div key={category} className="bg-blue-50 rounded-lg p-4">
                  <h4 className="font-medium text-blue-900 mb-1">
                    {category.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </h4>
                  <p className="text-blue-700">{assessment as string}</p>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Legacy risk assessment */}
        {!findings.risk_assessment && specialtyData.risk_assessment && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h4 className="font-semibold text-red-900 mb-2 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Risk Assessment
            </h4>
            <div className="space-y-2">
              <p className="text-red-800"><strong>Suicide Risk:</strong> {specialtyData.risk_assessment.suicide_risk}</p>
              <p className="text-red-800"><strong>Violence Risk:</strong> {specialtyData.risk_assessment.violence_risk}</p>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderDermatologySpecific = () => (
    <div className="space-y-6">
      {specialtyData.lesion_description && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Lesion Analysis</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(specialtyData.lesion_description).map(([feature, value]) => (
              <div key={feature} className="flex items-center gap-3 p-3 bg-orange-50 rounded-lg">
                <Eye className="w-5 h-5 text-orange-600" />
                <div>
                  <p className="font-medium text-orange-900">{feature.replace(/_/g, ' ').toUpperCase()}</p>
                  <p className="text-orange-700">{value as string}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {specialtyData.dermoscopy_findings && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h4 className="font-semibold text-yellow-900 mb-2">Dermoscopy Findings</h4>
          <p className="text-yellow-800">{specialtyData.dermoscopy_findings}</p>
        </div>
      )}
    </div>
  );

  const renderSpecialtyContent = () => {
    switch (specialty) {
      case 'cardiology':
        return renderCardiologySpecific();
      case 'neurology':
        return renderNeurologySpecific();
      case 'psychiatry':
        return renderPsychiatrySpecific();
      case 'dermatology':
        return renderDermatologySpecific();
      default:
        // Generic specialty content
        return (
          <div className="prose max-w-none">
            <pre className="bg-gray-50 p-4 rounded-lg overflow-auto text-sm">
              {JSON.stringify(specialtyData, null, 2)}
            </pre>
          </div>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Specialist Header */}
      <div className={`bg-gradient-to-r ${config.gradient} rounded-2xl p-8 text-white`}>
        <div className="flex items-center gap-6">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200 }}
            className="p-6 bg-white/20 backdrop-blur rounded-2xl"
          >
            <Icon className="w-16 h-16 text-white" />
          </motion.div>
          <div>
            <h1 className="text-3xl font-bold mb-2">{config.title}</h1>
            <p className="text-white/80">
              Specialized medical consultation report prepared for {data?.executive_summary?.target_audience || 'healthcare provider'}
            </p>
            <div className="flex items-center gap-4 mt-3 text-sm">
              <span className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                {new Date(report.generated_at).toLocaleDateString()}
              </span>
              <span className="flex items-center gap-2">
                <User className="w-4 h-4" />
                Patient ID: {report.user_id || 'Anonymous'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Actionable Summary */}
      {(data?.diagnostic_priorities || data?.follow_up_plan || data?.executive_summary?.key_findings) && (
        <Section id="actionable" title="Priority Actions" icon={Zap}>
          <ActionableSummary 
            reportData={data} 
            specialty={specialty}
            onScheduleAppointment={() => {
              // Handle appointment scheduling
              window.open(`https://schedule.example.com/${specialty}`, '_blank');
            }}
          />
        </Section>
      )}

      {/* Executive Summary */}
      {data?.executive_summary && (
        <Section id="summary" title="Executive Summary" icon={FileText}>
          <div className="space-y-4">
            <div className={`${config.bgLight} ${config.borderColor} border rounded-lg p-6`}>
              <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                {data.executive_summary.one_page_summary}
              </p>
            </div>
            
            {data.executive_summary.chief_complaints && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Chief Complaints</h3>
                <div className="flex flex-wrap gap-2">
                  {data.executive_summary.chief_complaints.map((complaint: string, idx: number) => (
                    <span key={idx} className={`px-3 py-1 ${config.bgLight} ${config.textColor} rounded-full text-sm`}>
                      {complaint}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Section>
      )}

      {/* Clinical Summary */}
      {data?.clinical_summary && (
        <Section id="clinical" title="Clinical Summary" icon={Stethoscope}>
          <div className="space-y-6">
            {/* Chief Complaint & HPI */}
            {(data.clinical_summary.chief_complaint || data.clinical_summary.hpi) && (
              <div className="space-y-4">
                {data.clinical_summary.chief_complaint && (
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Chief Complaint</h3>
                    <p className="text-gray-700 bg-gray-50 p-4 rounded-lg">
                      {data.clinical_summary.chief_complaint}
                    </p>
                  </div>
                )}
                {data.clinical_summary.hpi && (
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">History of Present Illness</h3>
                    <p className="text-gray-700">{data.clinical_summary.hpi}</p>
                  </div>
                )}
              </div>
            )}
            
            {/* Symptom Timeline */}
            {data.clinical_summary.symptom_timeline && data.clinical_summary.symptom_timeline.length > 0 && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-4">Symptom Progression Timeline</h3>
                <SymptomTimeline 
                  timeline={data.clinical_summary.symptom_timeline}
                  patternAnalysis={data.clinical_summary.pattern_analysis}
                />
              </div>
            )}
            
            {/* Legacy fields */}
            {data.clinical_summary.presenting_complaints && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Presenting Complaints</h3>
                <p className="text-gray-700 bg-gray-50 p-4 rounded-lg">
                  {data.clinical_summary.presenting_complaints}
                </p>
              </div>
            )}
            
            {data.clinical_summary.relevant_history && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Relevant Medical History</h3>
                <p className="text-gray-700">{data.clinical_summary.relevant_history}</p>
              </div>
            )}
            
            {data.clinical_summary.examination_priorities && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Examination Priorities</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {data.clinical_summary.examination_priorities.map((priority: string, idx: number) => (
                    <div key={idx} className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                      <Target className="w-5 h-5 text-blue-600" />
                      <span className="text-blue-900">{priority}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Section>
      )}

      {/* Specialty-Specific Analysis */}
      {specialtyData && Object.keys(specialtyData).length > 0 && (
        <Section id="specialty" title={`${specialty.charAt(0).toUpperCase() + specialty.slice(1)} Specific Analysis`} icon={Icon}>
          {renderSpecialtyContent()}
        </Section>
      )}

      {/* Diagnostic Priorities - New Component */}
      {data?.diagnostic_priorities && (
        <Section id="diagnostics" title="Diagnostic Recommendations" icon={TestTube}>
          <DiagnosticPriorities
            immediate={data.diagnostic_priorities.immediate}
            shortTerm={data.diagnostic_priorities.short_term}
            contingent={data.diagnostic_priorities.contingent}
          />
        </Section>
      )}
      
      {/* Legacy Recommended Tests */}
      {!data?.diagnostic_priorities && (specialtyData.recommended_tests || data?.recommendations?.diagnostic_tests) && (
        <Section id="tests" title="Recommended Diagnostic Tests" icon={TestTube}>
          <div className="space-y-4">
            {specialtyData.recommended_tests?.immediate && (
              <div>
                <h3 className="font-semibold text-red-900 mb-3 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5" />
                  Immediate Tests Required
                </h3>
                <div className="space-y-2">
                  {specialtyData.recommended_tests.immediate.map((test: string, idx: number) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      className="flex items-center gap-3 p-3 bg-red-50 border border-red-200 rounded-lg"
                    >
                      <span className="text-red-600 font-bold">{idx + 1}.</span>
                      <span className="text-red-800">{test}</span>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
            
            {specialtyData.recommended_tests?.follow_up && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Follow-up Tests</h3>
                <div className="space-y-2">
                  {specialtyData.recommended_tests.follow_up.map((test: string, idx: number) => (
                    <div key={idx} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <TestTube className="w-5 h-5 text-gray-600" />
                      <span className="text-gray-700">{test}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Section>
      )}

      {/* Treatment Recommendations - Enhanced */}
      {(data?.treatment_recommendations || specialtyData.treatment_plan || data?.recommendations) && (
        <Section id="treatment" title="Treatment Recommendations" icon={Pill}>
          <TreatmentPlan
            specialty={specialty}
            medications={data.treatment_recommendations?.immediate_medical_therapy || []}
            immediateTherapy={data.treatment_recommendations?.immediate_medical_therapy || []}
            symptomManagement={data.treatment_recommendations?.symptom_management}
            lifestyleInterventions={data.treatment_recommendations?.lifestyle_interventions || {}}
            behavioralInterventions={data.treatment_recommendations?.behavioral_interventions}
            nonPharmacologic={data.treatment_recommendations?.non_pharmacologic}
            preventiveMeasures={data.treatment_recommendations?.preventive_measures || []}
            immediateActions={data.recommendations?.immediate_actions || []}
            monitoringPlan={data.follow_up_plan?.monitoring_parameters || []}
          />
        </Section>
      )}

      {/* Billing & Coding */}
      {data?.billing_optimization && (
        <Section id="billing" title="Billing & Insurance Codes" icon={Clipboard}>
          <div className="space-y-4">
            {data.billing_optimization.suggested_codes?.icd10 && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">ICD-10 Codes</h3>
                <div className="flex flex-wrap gap-3">
                  {data.billing_optimization.suggested_codes.icd10.map((code: string, idx: number) => (
                    <div
                      key={idx}
                      className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg"
                    >
                      <span className="font-mono text-gray-900">{code}</span>
                      <button
                        onClick={() => copyToClipboard(code, `icd-${idx}`)}
                        className="p-1 hover:bg-gray-200 rounded"
                      >
                        {copiedCode === `icd-${idx}` ? (
                          <Check className="w-4 h-4 text-green-600" />
                        ) : (
                          <Copy className="w-4 h-4 text-gray-500" />
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {data.billing_optimization.suggested_codes?.cpt && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">CPT Codes</h3>
                <div className="flex flex-wrap gap-3">
                  {data.billing_optimization.suggested_codes.cpt.map((code: string, idx: number) => (
                    <div
                      key={idx}
                      className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg"
                    >
                      <span className="font-mono text-gray-900">{code}</span>
                      <button
                        onClick={() => copyToClipboard(code, `cpt-${idx}`)}
                        className="p-1 hover:bg-gray-200 rounded"
                      >
                        {copiedCode === `cpt-${idx}` ? (
                          <Check className="w-4 h-4 text-green-600" />
                        ) : (
                          <Copy className="w-4 h-4 text-gray-500" />
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Section>
      )}

      {/* Care Coordination - New Component */}
      {data?.care_coordination && (
        <Section id="care-coordination" title="Care Coordination" icon={Users}>
          <CareCoordination
            referralUrgency={data.care_coordination.referral_urgency}
            preVisitPreparation={data.care_coordination.pre_visit_preparation}
            followUpPlan={data.care_coordination.follow_up_plan}
            recommendedReferrals={data.specialist_coordination?.recommended_referrals}
            careGaps={data.specialist_coordination?.care_gaps}
          />
        </Section>
      )}
      
      {/* Legacy Follow-up Plan */}
      {!data?.care_coordination && data?.follow_up_plan && (
        <Section id="follow-up" title="Follow-up Plan" icon={Calendar}>
          <div className="space-y-4">
            {data.follow_up_plan.timing && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Recommended Follow-up
                </h4>
                <p className="text-blue-800">{data.follow_up_plan.timing}</p>
              </div>
            )}
            
            {data.follow_up_plan.red_flags && data.follow_up_plan.red_flags.length > 0 && (
              <div>
                <h4 className="font-semibold text-red-900 mb-2">Seek Immediate Care If:</h4>
                <ul className="space-y-2">
                  {data.follow_up_plan.red_flags.map((flag: string, idx: number) => (
                    <li key={idx} className="flex items-start gap-2 text-red-800">
                      <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                      {flag}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            {data.follow_up_plan.next_steps && data.follow_up_plan.next_steps.length > 0 && (
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Next Steps</h4>
                <ol className="space-y-2">
                  {data.follow_up_plan.next_steps.map((step: string, idx: number) => (
                    <li key={idx} className="flex items-start gap-3">
                      <span className="font-bold text-gray-600">{idx + 1}.</span>
                      <span className="text-gray-700">{step}</span>
                    </li>
                  ))}
                </ol>
              </div>
            )}
          </div>
        </Section>
      )}

      {/* Data Quality Notes - New Component */}
      {data?.data_quality_notes && (
        <Section id="data-quality" title="Data Quality Assessment" icon={Info}>
          <DataQualityNotes
            completeness={data.data_quality_notes.completeness}
            consistency={data.data_quality_notes.consistency}
            gaps={data.data_quality_notes.gaps}
            confidence={report.confidence_score}
          />
        </Section>
      )}

      {/* Confidence Score */}
      {report.confidence_score && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-gray-50 rounded-lg p-4 flex items-center justify-between"
        >
          <span className="text-gray-600">Specialist Analysis Confidence</span>
          <div className="flex items-center gap-3">
            <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${report.confidence_score}%` }}
                transition={{ duration: 1, delay: 0.5 }}
                className={`h-full bg-gradient-to-r ${config.gradient}`}
              />
            </div>
            <span className="font-semibold text-gray-900">{report.confidence_score}%</span>
          </div>
        </motion.div>
      )}
    </div>
  );
};