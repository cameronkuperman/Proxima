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
  Gauge
} from 'lucide-react';

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
  }
};

export const SpecialistReport: React.FC<SpecialistReportProps> = ({ report }) => {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['summary', 'clinical']));
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  
  const data = report.report_data;
  
  // Detect specialty from report data
  const detectSpecialty = () => {
    const specialties = Object.keys(specialtyConfig);
    for (const specialty of specialties) {
      if (data[`${specialty}_specific`]) {
        return specialty;
      }
    }
    // Fallback to checking executive summary
    if (data?.executive_summary?.specialist_focus) {
      const focus = data.executive_summary.specialist_focus.toLowerCase();
      return specialties.find(s => focus.includes(s)) || 'cardiology';
    }
    return 'cardiology'; // Default
  };
  
  const specialty = detectSpecialty();
  const config = specialtyConfig[specialty as keyof typeof specialtyConfig];
  const Icon = config.icon;
  const specialtyData = data[`${specialty}_specific`] || {};
  
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
  const renderCardiologySpecific = () => (
    <div className="space-y-6">
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
      
      {specialtyData.ecg_interpretation && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-semibold text-blue-900 mb-2">ECG Interpretation</h4>
          <p className="text-blue-800">{specialtyData.ecg_interpretation}</p>
        </div>
      )}
      
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

  const renderNeurologySpecific = () => (
    <div className="space-y-6">
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

  const renderPsychiatrySpecific = () => (
    <div className="space-y-6">
      {specialtyData.mental_status_exam && (
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
      
      {specialtyData.risk_assessment && (
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

      {/* Recommended Tests */}
      {(specialtyData.recommended_tests || data?.recommendations?.diagnostic_tests) && (
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

      {/* Treatment Recommendations */}
      {(specialtyData.treatment_plan || data?.recommendations) && (
        <Section id="treatment" title="Treatment Recommendations" icon={Pill}>
          <div className="space-y-6">
            {specialtyData.treatment_plan?.medications && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Medication Recommendations</h3>
                <div className="space-y-3">
                  {specialtyData.treatment_plan.medications.map((med: any, idx: number) => (
                    <div key={idx} className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-medium text-green-900">{med.name}</h4>
                          <p className="text-sm text-green-700 mt-1">
                            {med.dosage} • {med.frequency} • {med.duration}
                          </p>
                        </div>
                        <Pill className="w-5 h-5 text-green-600" />
                      </div>
                      {med.notes && (
                        <p className="text-sm text-gray-600 mt-2">{med.notes}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {data?.recommendations?.lifestyle_modifications && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Lifestyle Modifications</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {data.recommendations.lifestyle_modifications.map((mod: string, idx: number) => (
                    <div key={idx} className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                      <Shield className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                      <span className="text-blue-900">{mod}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
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