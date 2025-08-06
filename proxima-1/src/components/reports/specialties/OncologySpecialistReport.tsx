'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield,
  AlertTriangle,
  Clock,
  TrendingUp,
  Target,
  Calendar,
  TestTube,
  Zap,
  ChevronRight,
  AlertCircle,
  Activity,
  User,
  FileText,
  BarChart3,
  Timer,
  Gauge,
  Info,
  Phone,
  Users,
  Heart
} from 'lucide-react';
import { extractSpecialtyData } from '@/utils/specialtyDetector';

interface OncologySpecialistReportProps {
  report: any;
}

// Urgency color mapping
const getUrgencyColor = (urgency: string) => {
  if (urgency?.toLowerCase().includes('urgent')) return 'red';
  if (urgency?.toLowerCase().includes('high')) return 'orange';
  if (urgency?.toLowerCase().includes('moderate')) return 'yellow';
  return 'gray';
};

// Red flag severity
const getRedFlagSeverity = (count: number) => {
  if (count >= 4) return { color: 'red', label: 'Critical', icon: '🚨' };
  if (count >= 2) return { color: 'orange', label: 'High', icon: '⚠️' };
  if (count >= 1) return { color: 'yellow', label: 'Moderate', icon: '⚡' };
  return { color: 'green', label: 'Low', icon: '✓' };
};

export const OncologySpecialistReport: React.FC<OncologySpecialistReportProps> = ({ report }) => {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(['urgency', 'symptoms', 'differential', 'workup'])
  );
  
  const data = extractSpecialtyData(report, 'oncology');
  const reportData = report.report_data || {};
  
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

  // Calculate total red flags
  const redFlagCount = data.executive_summary?.red_flags?.length || 
                       data.symptom_analysis?.constitutional_symptoms ? 
                       Object.values(data.symptom_analysis.constitutional_symptoms).filter(v => v).length : 0;

  // Urgency Timeline Component
  const UrgencyTimeline = () => {
    const timelineSteps = [
      { label: 'Initial Assessment', days: 0, status: 'complete' },
      { label: 'Imaging', days: 7, status: 'pending' },
      { label: 'Biopsy', days: 10, status: 'pending' },
      { label: 'Diagnosis', days: 14, status: 'pending' },
      { label: 'Treatment Plan', days: 21, status: 'pending' }
    ];

    return (
      <div className="relative">
        <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-300" />
        {timelineSteps.map((step, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="relative flex items-center gap-4 mb-4"
          >
            <div className={`w-8 h-8 rounded-full flex items-center justify-center z-10 ${
              step.status === 'complete' ? 'bg-green-600' : 'bg-gray-400'
            }`}>
              {step.status === 'complete' ? (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring" }}
                >
                  ✓
                </motion.div>
              ) : (
                <div className="w-2 h-2 bg-white rounded-full" />
              )}
            </div>
            <div className="flex-1">
              <p className="font-medium text-gray-900">{step.label}</p>
              <p className="text-sm text-gray-500">Day {step.days}</p>
            </div>
          </motion.div>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Critical Header with Urgency Indicator */}
      <motion.div 
        className="bg-gradient-to-r from-purple-600 to-violet-600 rounded-2xl p-8 text-white relative overflow-hidden"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {/* Animated Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: 'radial-gradient(circle at 20% 50%, white 2px, transparent 2px)',
            backgroundSize: '30px 30px'
          }} />
        </div>
        
        <div className="relative z-10 flex items-center gap-6">
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 200 }}
            className="p-6 bg-white/20 backdrop-blur rounded-2xl"
          >
            <Shield className="w-16 h-16 text-white" />
          </motion.div>
          <div className="flex-1">
            <h1 className="text-3xl font-bold mb-2">Oncology Consultation Report</h1>
            <p className="text-white/80">
              Comprehensive oncologic evaluation for concerning symptoms
            </p>
            <div className="flex items-center gap-4 mt-3 text-sm">
              <span className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                {new Date(report.generated_at).toLocaleDateString()}
              </span>
              <span className="flex items-center gap-2">
                <Shield className="w-4 h-4" />
                Oncology Assessment
              </span>
            </div>
          </div>
          
          {/* Urgency Badge */}
          {data.clinical_urgency_scale && (
            <div className="bg-white/20 backdrop-blur rounded-xl p-4 text-center">
              <div className="text-3xl font-bold">{getRedFlagSeverity(redFlagCount).icon}</div>
              <p className="text-sm mt-1">Urgency Level</p>
              <p className="text-xl font-bold">{data.clinical_urgency_scale.overall_urgency || 'High'}</p>
            </div>
          )}
        </div>
      </motion.div>

      {/* Critical Urgency Alert */}
      {(data.executive_summary?.urgency_indicators || data.executive_summary?.red_flags) && (
        <motion.div 
          className={`border-2 rounded-xl p-6 ${
            redFlagCount >= 4 ? 'bg-red-50 border-red-300' :
            redFlagCount >= 2 ? 'bg-orange-50 border-orange-300' :
            'bg-yellow-50 border-yellow-300'
          }`}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
        >
          <div className="flex items-start gap-3">
            <AlertTriangle className={`w-6 h-6 flex-shrink-0 mt-1 ${
              redFlagCount >= 4 ? 'text-red-600' :
              redFlagCount >= 2 ? 'text-orange-600' :
              'text-yellow-600'
            }`} />
            <div className="flex-1">
              <h3 className={`text-lg font-semibold mb-2 ${
                redFlagCount >= 4 ? 'text-red-900' :
                redFlagCount >= 2 ? 'text-orange-900' :
                'text-yellow-900'
              }`}>
                Clinical Red Flags - Immediate Evaluation Required
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {(data.executive_summary?.red_flags || data.executive_summary?.urgency_indicators || []).map((flag: string, idx: number) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 + idx * 0.05 }}
                    className="flex items-center gap-2"
                  >
                    <div className={`w-2 h-2 rounded-full ${
                      redFlagCount >= 4 ? 'bg-red-600' :
                      redFlagCount >= 2 ? 'bg-orange-600' :
                      'bg-yellow-600'
                    }`} />
                    <span className={
                      redFlagCount >= 4 ? 'text-red-800' :
                      redFlagCount >= 2 ? 'text-orange-800' :
                      'text-yellow-800'
                    }>{flag}</span>
                  </motion.div>
                ))}
              </div>
              {data.clinical_urgency_scale?.time_to_diagnosis && (
                <div className="mt-4 p-3 bg-white/50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Target Time to Diagnosis:</span>
                    <span className="font-bold text-lg">{data.clinical_urgency_scale.time_to_diagnosis}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}

      {/* Symptom Analysis Dashboard */}
      {data.symptom_analysis && (
        <motion.div 
          className="bg-white rounded-xl shadow-lg p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
              <Activity className="w-6 h-6 text-purple-600" />
              Symptom Analysis
            </h2>
            <button
              onClick={() => toggleSection('symptoms')}
              className="text-gray-500 hover:text-gray-700"
            >
              {expandedSections.has('symptoms') ? '−' : '+'}
            </button>
          </div>
          
          <AnimatePresence>
            {expandedSections.has('symptoms') && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="space-y-6"
              >
                {/* Constitutional Symptoms */}
                {data.symptom_analysis.constitutional_symptoms && (
                  <div className="bg-gradient-to-r from-red-50 to-pink-50 rounded-lg p-4">
                    <h3 className="font-semibold text-red-900 mb-4 flex items-center gap-2">
                      <Gauge className="w-5 h-5" />
                      Constitutional Symptoms (B Symptoms)
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {/* Weight Loss */}
                      {data.symptom_analysis.constitutional_symptoms.weight_loss && (
                        <div className="bg-white rounded-lg p-3">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-gray-600">Weight Loss</span>
                            <TrendingUp className="w-4 h-4 text-red-600" />
                          </div>
                          <p className="text-2xl font-bold text-red-700">
                            {data.symptom_analysis.constitutional_symptoms.weight_loss.amount}
                          </p>
                          <p className="text-xs text-gray-500">
                            Over {data.symptom_analysis.constitutional_symptoms.weight_loss.duration}
                          </p>
                          {data.symptom_analysis.constitutional_symptoms.weight_loss.intentional === false && (
                            <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded mt-2 inline-block">
                              Unintentional
                            </span>
                          )}
                        </div>
                      )}

                      {/* Night Sweats */}
                      {data.symptom_analysis.constitutional_symptoms.night_sweats && (
                        <div className="bg-white rounded-lg p-3">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-gray-600">Night Sweats</span>
                            <Activity className="w-4 h-4 text-orange-600" />
                          </div>
                          <p className="text-lg font-bold text-orange-700">
                            {data.symptom_analysis.constitutional_symptoms.night_sweats.frequency}
                          </p>
                          <p className="text-xs text-gray-500">
                            {data.symptom_analysis.constitutional_symptoms.night_sweats.severity}
                          </p>
                        </div>
                      )}

                      {/* Fever */}
                      {data.symptom_analysis.constitutional_symptoms.fever && (
                        <div className="bg-white rounded-lg p-3">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-gray-600">Fever</span>
                            <Timer className="w-4 h-4 text-yellow-600" />
                          </div>
                          <p className="text-lg font-bold text-yellow-700">
                            {data.symptom_analysis.constitutional_symptoms.fever.max_temp}
                          </p>
                          <p className="text-xs text-gray-500">
                            {data.symptom_analysis.constitutional_symptoms.fever.pattern}
                          </p>
                        </div>
                      )}

                      {/* Fatigue */}
                      {data.symptom_analysis.constitutional_symptoms.fatigue && (
                        <div className="bg-white rounded-lg p-3">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-gray-600">Fatigue</span>
                            <Clock className="w-4 h-4 text-purple-600" />
                          </div>
                          <p className="text-lg font-bold text-purple-700">
                            {data.symptom_analysis.constitutional_symptoms.fatigue.severity}
                          </p>
                          <p className="text-xs text-gray-500">
                            {data.symptom_analysis.constitutional_symptoms.fatigue.progression}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Localized Symptoms */}
                {data.symptom_analysis.localized_symptoms && (
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4">
                    <h3 className="font-semibold text-blue-900 mb-3">Localized Symptoms</h3>
                    
                    {/* Lymphadenopathy */}
                    {data.symptom_analysis.localized_symptoms.lymphadenopathy && (
                      <div className="mb-4">
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Lymphadenopathy</h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                          <div className="bg-white rounded px-3 py-2">
                            <p className="text-xs text-gray-500">Locations</p>
                            <p className="text-sm font-medium">
                              {data.symptom_analysis.localized_symptoms.lymphadenopathy.locations?.join(', ')}
                            </p>
                          </div>
                          <div className="bg-white rounded px-3 py-2">
                            <p className="text-xs text-gray-500">Size</p>
                            <p className="text-sm font-medium">
                              {data.symptom_analysis.localized_symptoms.lymphadenopathy.size}
                            </p>
                          </div>
                          <div className="bg-white rounded px-3 py-2 md:col-span-2">
                            <p className="text-xs text-gray-500">Characteristics</p>
                            <p className="text-sm font-medium">
                              {data.symptom_analysis.localized_symptoms.lymphadenopathy.characteristics}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Differential Diagnosis */}
      {data.differential_diagnosis && (
        <motion.div 
          className="bg-white rounded-xl shadow-lg p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
              <Target className="w-6 h-6 text-purple-600" />
              Differential Diagnosis
            </h2>
            <button
              onClick={() => toggleSection('differential')}
              className="text-gray-500 hover:text-gray-700"
            >
              {expandedSections.has('differential') ? '−' : '+'}
            </button>
          </div>

          <AnimatePresence>
            {expandedSections.has('differential') && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="space-y-4"
              >
                {/* Hematologic Malignancies */}
                {data.differential_diagnosis.hematologic && (
                  <div className="border-l-4 border-red-500 pl-4">
                    <h3 className="font-semibold text-red-900 mb-3">Hematologic Malignancies</h3>
                    <div className="space-y-2">
                      {data.differential_diagnosis.hematologic.map((dx: any, idx: number) => (
                        <motion.div
                          key={idx}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.1 }}
                          className="bg-red-50 rounded-lg p-3"
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-medium text-gray-900">{dx.diagnosis}</p>
                              <p className="text-sm text-gray-600 mt-1">{dx.supporting}</p>
                            </div>
                            <span className={`text-xs px-2 py-1 rounded ${
                              dx.probability === 'High' ? 'bg-red-600 text-white' :
                              dx.probability === 'Moderate' ? 'bg-yellow-600 text-white' :
                              'bg-gray-400 text-white'
                            }`}>
                              {dx.probability}
                            </span>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Solid Tumors */}
                {data.differential_diagnosis.solid_tumors && (
                  <div className="border-l-4 border-purple-500 pl-4">
                    <h3 className="font-semibold text-purple-900 mb-3">Solid Tumors</h3>
                    <div className="space-y-2">
                      {data.differential_diagnosis.solid_tumors.map((dx: any, idx: number) => (
                        <div key={idx} className="bg-purple-50 rounded-lg p-3">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-medium text-gray-900">{dx.diagnosis}</p>
                              <p className="text-sm text-gray-600 mt-1">{dx.supporting}</p>
                            </div>
                            <span className={`text-xs px-2 py-1 rounded ${
                              dx.probability === 'High' ? 'bg-purple-600 text-white' :
                              dx.probability === 'Moderate' ? 'bg-yellow-600 text-white' :
                              'bg-gray-400 text-white'
                            }`}>
                              {dx.probability}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Infectious */}
                {data.differential_diagnosis.infectious && (
                  <div className="border-l-4 border-green-500 pl-4">
                    <h3 className="font-semibold text-green-900 mb-3">Infectious Causes</h3>
                    <div className="space-y-2">
                      {data.differential_diagnosis.infectious.map((dx: any, idx: number) => (
                        <div key={idx} className="bg-green-50 rounded-lg p-3">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-medium text-gray-900">{dx.diagnosis}</p>
                              <p className="text-sm text-gray-600 mt-1">{dx.supporting}</p>
                            </div>
                            <span className="text-xs bg-green-600 text-white px-2 py-1 rounded">
                              Rule Out
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Staging Workup & Timeline */}
      {(data.staging_workup || data.diagnostic_priorities) && (
        <motion.div 
          className="bg-white rounded-xl shadow-lg p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
              <TestTube className="w-6 h-6 text-purple-600" />
              Diagnostic Workup & Timeline
            </h2>
            <button
              onClick={() => toggleSection('workup')}
              className="text-gray-500 hover:text-gray-700"
            >
              {expandedSections.has('workup') ? '−' : '+'}
            </button>
          </div>

          <AnimatePresence>
            {expandedSections.has('workup') && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="grid grid-cols-1 md:grid-cols-2 gap-6"
              >
                {/* Timeline */}
                <div>
                  <h3 className="font-semibold text-gray-900 mb-4">Expected Timeline</h3>
                  <UrgencyTimeline />
                </div>

                {/* Immediate Tests */}
                <div>
                  <h3 className="font-semibold text-gray-900 mb-4">Immediate Priorities</h3>
                  <div className="space-y-3">
                    {data.diagnostic_priorities?.immediate?.map((test: any, idx: number) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        className="bg-gradient-to-r from-red-50 to-pink-50 rounded-lg p-3"
                      >
                        <div className="flex items-start gap-3">
                          <Zap className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="font-medium text-gray-900">{test.test}</p>
                            <p className="text-sm text-gray-600">{test.rationale}</p>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>

                  {/* Tissue Diagnosis */}
                  {data.diagnostic_priorities?.tissue_diagnosis && (
                    <div className="mt-4 bg-purple-50 rounded-lg p-4">
                      <h4 className="font-medium text-purple-900 mb-2 flex items-center gap-2">
                        <Target className="w-4 h-4" />
                        Tissue Diagnosis
                      </h4>
                      {data.diagnostic_priorities.tissue_diagnosis.map((item: any, idx: number) => (
                        <div key={idx} className="mt-2">
                          <p className="text-sm font-medium">{item.procedure}</p>
                          <p className="text-xs text-gray-600">{item.urgency}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Referral & Support Services */}
      {data.referral_recommendations && (
        <motion.div 
          className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl p-6 text-white"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Users className="w-6 h-6" />
            Referral & Support Services
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Oncology Referral */}
            {data.referral_recommendations.oncology && (
              <div className="bg-white/10 backdrop-blur rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">Oncology Consultation</span>
                  <span className="text-xs bg-red-600 text-white px-2 py-1 rounded">
                    {data.referral_recommendations.oncology.urgency}
                  </span>
                </div>
                <p className="text-sm text-white/80">
                  {data.referral_recommendations.oncology.type}
                </p>
              </div>
            )}

            {/* Support Services */}
            {data.referral_recommendations.supportive_services?.map((service: any, idx: number) => (
              <div key={idx} className="bg-white/10 backdrop-blur rounded-lg p-4">
                <p className="font-medium mb-1">{service.service}</p>
                <p className="text-sm text-white/80">{service.reason}</p>
              </div>
            ))}
          </div>

          {/* Patient Resources */}
          {data.patient_counseling?.support_resources && (
            <div className="mt-4 pt-4 border-t border-white/20">
              <p className="text-sm font-medium mb-2">Available Resources:</p>
              <div className="flex flex-wrap gap-2">
                {data.patient_counseling.support_resources.map((resource: string, idx: number) => (
                  <span key={idx} className="text-xs bg-white/20 px-3 py-1 rounded-full">
                    {resource}
                  </span>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      )}

      {/* Next Steps & Contact Information */}
      <motion.div 
        className="bg-gray-900 rounded-xl p-6 text-white"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Phone className="w-6 h-6" />
          Immediate Next Steps
        </h3>
        {data.patient_counseling?.next_steps && (
          <ol className="space-y-3">
            {data.patient_counseling.next_steps.map((step: string, idx: number) => (
              <motion.li
                key={idx}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.7 + idx * 0.1 }}
                className="flex items-start gap-3"
              >
                <span className="flex-shrink-0 w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center text-xs font-bold">
                  {idx + 1}
                </span>
                <span className="text-white/90">{step}</span>
              </motion.li>
            ))}
          </ol>
        )}
        
        <div className="mt-6 p-4 bg-white/10 backdrop-blur rounded-lg">
          <p className="text-sm text-white/70 mb-2">For questions or urgent concerns:</p>
          <p className="font-semibold flex items-center gap-2">
            <Phone className="w-4 h-4" />
            Contact your healthcare provider immediately
          </p>
        </div>
      </motion.div>
    </div>
  );
};