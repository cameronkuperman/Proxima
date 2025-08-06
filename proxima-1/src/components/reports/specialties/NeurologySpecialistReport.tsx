'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Brain,
  Activity,
  AlertTriangle,
  Gauge,
  Calendar,
  Clock,
  Pill,
  TestTube,
  ChevronRight,
  AlertCircle,
  CheckCircle,
  Info,
  Zap,
  Target,
  Eye,
  TrendingUp,
  Sun,
  Moon,
  CloudRain,
  Wind,
  ThermometerSun,
  Sparkles
} from 'lucide-react';
import { extractSpecialtyData } from '@/utils/specialtyDetector';

interface NeurologySpecialistReportProps {
  report: any;
}

// Headache trigger icons
const triggerIcons: Record<string, any> = {
  'stress': Brain,
  'sleep': Moon,
  'food': CloudRain,
  'hormonal': Activity,
  'weather': ThermometerSun,
  'light': Sun,
  'noise': Wind,
  'default': Sparkles
};

// MIDAS Score interpretation
const getMIDASInterpretation = (score: number) => {
  if (score <= 5) return { grade: 'I', label: 'Minimal Disability', color: 'green' };
  if (score <= 10) return { grade: 'II', label: 'Mild Disability', color: 'yellow' };
  if (score <= 20) return { grade: 'III', label: 'Moderate Disability', color: 'orange' };
  return { grade: 'IV', label: 'Severe Disability', color: 'red' };
};

// HIT-6 Score interpretation
const getHIT6Interpretation = (score: number) => {
  if (score <= 49) return { label: 'Little to No Impact', color: 'green' };
  if (score <= 55) return { label: 'Some Impact', color: 'yellow' };
  if (score <= 59) return { label: 'Substantial Impact', color: 'orange' };
  return { label: 'Severe Impact', color: 'red' };
};

export const NeurologySpecialistReport: React.FC<NeurologySpecialistReportProps> = ({ report }) => {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(['summary', 'headache', 'scales', 'recommendations'])
  );
  const [selectedTrigger, setSelectedTrigger] = useState<string | null>(null);
  
  const data = extractSpecialtyData(report, 'neurology');
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

  // Animated Brain Wave Component
  const BrainWave = () => (
    <svg className="w-full h-20 opacity-20">
      <motion.path
        d="M 0 40 Q 20 20, 40 40 T 80 40 Q 100 20, 120 40 T 160 40 Q 180 20, 200 40 T 240 40 Q 260 20, 280 40 T 320 40"
        stroke="white"
        strokeWidth="2"
        fill="none"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 2, repeat: Infinity, repeatType: "reverse" }}
      />
    </svg>
  );

  // Headache Calendar Component
  const HeadacheCalendar = ({ frequency }: { frequency: string }) => {
    const daysInMonth = 30;
    const headacheDays = parseInt(frequency) || 0;
    
    return (
      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: daysInMonth }, (_, i) => {
          const hasHeadache = Math.random() < (headacheDays / daysInMonth);
          return (
            <motion.div
              key={i}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: i * 0.01 }}
              className={`w-8 h-8 rounded flex items-center justify-center text-xs ${
                hasHeadache 
                  ? 'bg-purple-600 text-white' 
                  : 'bg-gray-100 text-gray-400'
              }`}
            >
              {i + 1}
            </motion.div>
          );
        })}
      </div>
    );
  };

  // Severity Gauge Component
  const SeverityGauge = ({ value, max = 10 }: { value: number; max?: number }) => {
    const percentage = (value / max) * 100;
    const getColor = () => {
      if (percentage <= 30) return '#10b981';
      if (percentage <= 60) return '#f59e0b';
      return '#dc2626';
    };
    
    return (
      <div className="relative w-32 h-32">
        <svg className="transform -rotate-90" width="128" height="128">
          <circle
            cx="64"
            cy="64"
            r="56"
            stroke="#e5e7eb"
            strokeWidth="12"
            fill="none"
          />
          <motion.circle
            cx="64"
            cy="64"
            r="56"
            stroke={getColor()}
            strokeWidth="12"
            fill="none"
            strokeDasharray={`${percentage * 3.52} 352`}
            initial={{ strokeDasharray: "0 352" }}
            animate={{ strokeDasharray: `${percentage * 3.52} 352` }}
            transition={{ duration: 1, ease: "easeOut" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold">{value}</span>
          <span className="text-xs text-gray-500">Severity</span>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header with Brain Wave Animation */}
      <motion.div 
        className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-2xl p-8 text-white relative overflow-hidden"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {/* Brain Wave Animation */}
        <div className="absolute inset-0">
          <BrainWave />
        </div>
        
        <div className="relative z-10 flex items-center gap-6">
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 200 }}
            className="p-6 bg-white/20 backdrop-blur rounded-2xl"
          >
            <Brain className="w-16 h-16 text-white" />
          </motion.div>
          <div>
            <h1 className="text-3xl font-bold mb-2">Neurology Consultation Report</h1>
            <p className="text-white/80">
              Comprehensive neurological assessment and treatment plan
            </p>
            <div className="flex items-center gap-4 mt-3 text-sm">
              <span className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                {new Date(report.generated_at).toLocaleDateString()}
              </span>
              <span className="flex items-center gap-2">
                <Brain className="w-4 h-4" />
                Neurology Specialist
              </span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Red Flags Alert */}
      {data.findings?.red_flags_absent && (
        <motion.div 
          className="bg-green-50 border-2 border-green-200 rounded-xl p-6"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
        >
          <div className="flex items-start gap-3">
            <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-green-900 mb-2">Red Flags Assessment</h3>
              <p className="text-green-800 mb-3">No concerning red flags identified</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                {data.findings.red_flags_absent.map((flag: string, idx: number) => (
                  <div key={idx} className="flex items-center gap-2 text-sm text-green-700">
                    <CheckCircle className="w-3 h-3" />
                    <span>{flag}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {data.findings?.concerning_features && data.findings.concerning_features.length > 0 && (
        <motion.div 
          className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-6"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
        >
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-1" />
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-yellow-900 mb-2">Concerning Features</h3>
              <div className="space-y-2">
                {data.findings.concerning_features.map((feature: string, idx: number) => (
                  <div key={idx} className="flex items-center gap-2">
                    <ChevronRight className="w-4 h-4 text-yellow-500" />
                    <span className="text-yellow-800">{feature}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Clinical Scales Dashboard */}
      {(data.assessment?.clinical_scales || data.scales) && (
        <motion.div 
          className="bg-white rounded-xl shadow-lg p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
              <Gauge className="w-6 h-6 text-purple-600" />
              Clinical Assessment Scales
            </h2>
            <button
              onClick={() => toggleSection('scales')}
              className="text-gray-500 hover:text-gray-700"
            >
              {expandedSections.has('scales') ? '−' : '+'}
            </button>
          </div>
          
          <AnimatePresence>
            {expandedSections.has('scales') && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              >
                {/* MIDAS Score */}
                {(data.scales?.MIDAS_Score || data.assessment?.clinical_scales?.MIDAS_Score) && (
                  <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <Activity className="w-5 h-5 text-purple-600" />
                      MIDAS Score
                    </h3>
                    <div className="text-center mb-3">
                      <div className="text-4xl font-bold text-purple-600">
                        {data.scales?.MIDAS_Score?.total_score || data.assessment?.clinical_scales?.MIDAS_Score?.total_score}
                      </div>
                      <div className={`text-sm font-medium mt-2 ${
                        getMIDASInterpretation(data.scales?.MIDAS_Score?.total_score || 0).color === 'green' ? 'text-green-600' :
                        getMIDASInterpretation(data.scales?.MIDAS_Score?.total_score || 0).color === 'yellow' ? 'text-yellow-600' :
                        getMIDASInterpretation(data.scales?.MIDAS_Score?.total_score || 0).color === 'orange' ? 'text-orange-600' :
                        'text-red-600'
                      }`}>
                        Grade {getMIDASInterpretation(data.scales?.MIDAS_Score?.total_score || 0).grade} - {getMIDASInterpretation(data.scales?.MIDAS_Score?.total_score || 0).label}
                      </div>
                    </div>
                    {data.scales?.MIDAS_Score?.days_missed && (
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Work Days Missed:</span>
                          <span className="font-medium">{data.scales.MIDAS_Score.days_missed.work}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Household Days:</span>
                          <span className="font-medium">{data.scales.MIDAS_Score.days_missed.household}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Social Days:</span>
                          <span className="font-medium">{data.scales.MIDAS_Score.days_missed.social}</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* HIT-6 Score */}
                {(data.scales?.HIT6_Score || data.assessment?.clinical_scales?.HIT6_Score) && (
                  <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <Brain className="w-5 h-5 text-blue-600" />
                      HIT-6 Score
                    </h3>
                    <div className="text-center mb-3">
                      <div className="text-4xl font-bold text-blue-600">
                        {data.scales?.HIT6_Score?.total_score || data.assessment?.clinical_scales?.HIT6_Score?.total_score}
                      </div>
                      <div className={`text-sm font-medium mt-2 ${
                        getHIT6Interpretation(data.scales?.HIT6_Score?.total_score || 0).color === 'green' ? 'text-green-600' :
                        getHIT6Interpretation(data.scales?.HIT6_Score?.total_score || 0).color === 'yellow' ? 'text-yellow-600' :
                        getHIT6Interpretation(data.scales?.HIT6_Score?.total_score || 0).color === 'orange' ? 'text-orange-600' :
                        'text-red-600'
                      }`}>
                        {getHIT6Interpretation(data.scales?.HIT6_Score?.total_score || 0).label}
                      </div>
                    </div>
                    {data.scales?.HIT6_Score?.severity && (
                      <div className="text-center">
                        <span className="text-sm text-gray-600">Severity: </span>
                        <span className="text-sm font-medium">{data.scales.HIT6_Score.severity}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Cognitive Screen */}
                {(data.scales?.Cognitive_Screen || data.assessment?.clinical_scales?.Cognitive_Screen) && (
                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <Eye className="w-5 h-5 text-green-600" />
                      Cognitive Screen
                    </h3>
                    <div className="text-center mb-3">
                      <div className="text-4xl font-bold text-green-600">
                        {data.scales?.Cognitive_Screen?.moca_estimate || data.assessment?.clinical_scales?.Cognitive_Screen?.moca_estimate}
                        <span className="text-lg text-gray-500">/30</span>
                      </div>
                      <div className="text-sm text-gray-600 mt-2">MoCA Estimate</div>
                    </div>
                    {data.scales?.Cognitive_Screen?.domains_affected && (
                      <div>
                        <p className="text-xs text-gray-600 mb-2">Affected Domains:</p>
                        <div className="space-y-1">
                          {data.scales.Cognitive_Screen.domains_affected.map((domain: string, idx: number) => (
                            <div key={idx} className="text-xs bg-white rounded px-2 py-1">
                              {domain}
                            </div>
                          ))}
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

      {/* Headache Pattern Analysis */}
      {data.assessment?.headache_characteristics && (
        <motion.div 
          className="bg-white rounded-xl shadow-lg p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
              <Sparkles className="w-6 h-6 text-purple-600" />
              Headache Pattern Analysis
            </h2>
            <button
              onClick={() => toggleSection('headache')}
              className="text-gray-500 hover:text-gray-700"
            >
              {expandedSections.has('headache') ? '−' : '+'}
            </button>
          </div>

          <AnimatePresence>
            {expandedSections.has('headache') && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="space-y-6"
              >
                {/* Characteristics Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-purple-50 rounded-lg p-3">
                    <p className="text-xs text-gray-600 mb-1">Frequency</p>
                    <p className="font-semibold text-purple-900">
                      {data.assessment.headache_characteristics.frequency}
                    </p>
                  </div>
                  <div className="bg-purple-50 rounded-lg p-3">
                    <p className="text-xs text-gray-600 mb-1">Duration</p>
                    <p className="font-semibold text-purple-900">
                      {data.assessment.headache_characteristics.duration}
                    </p>
                  </div>
                  <div className="bg-purple-50 rounded-lg p-3">
                    <p className="text-xs text-gray-600 mb-1">Quality</p>
                    <p className="font-semibold text-purple-900">
                      {data.assessment.headache_characteristics.quality}
                    </p>
                  </div>
                  <div className="bg-purple-50 rounded-lg p-3">
                    <p className="text-xs text-gray-600 mb-1">Location</p>
                    <p className="font-semibold text-purple-900">
                      {data.assessment.headache_characteristics.location}
                    </p>
                  </div>
                </div>

                {/* Severity Gauge */}
                {data.assessment.headache_characteristics.severity && (
                  <div className="flex items-center justify-center">
                    <SeverityGauge value={parseInt(data.assessment.headache_characteristics.severity.split('/')[0])} />
                  </div>
                )}

                {/* Aura Information */}
                {data.assessment.headache_characteristics.aura && (
                  <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg p-4">
                    <h4 className="font-semibold text-indigo-900 mb-3 flex items-center gap-2">
                      <Eye className="w-5 h-5" />
                      Aura Characteristics
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div className="bg-white rounded-lg p-3">
                        <p className="text-xs text-gray-600 mb-1">Present</p>
                        <p className="font-medium">{data.assessment.headache_characteristics.aura.present ? 'Yes' : 'No'}</p>
                      </div>
                      {data.assessment.headache_characteristics.aura.type && (
                        <div className="bg-white rounded-lg p-3">
                          <p className="text-xs text-gray-600 mb-1">Type</p>
                          <p className="font-medium">{data.assessment.headache_characteristics.aura.type}</p>
                        </div>
                      )}
                      {data.assessment.headache_characteristics.aura.duration && (
                        <div className="bg-white rounded-lg p-3">
                          <p className="text-xs text-gray-600 mb-1">Duration</p>
                          <p className="font-medium">{data.assessment.headache_characteristics.aura.duration}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Triggers */}
                {data.assessment.triggers && (
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">Identified Triggers</h4>
                    <div className="flex flex-wrap gap-2">
                      {data.assessment.triggers.map((trigger: string, idx: number) => {
                        const IconComponent = triggerIcons[trigger.toLowerCase()] || triggerIcons.default;
                        return (
                          <motion.button
                            key={idx}
                            onClick={() => setSelectedTrigger(trigger)}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                              selectedTrigger === trigger
                                ? 'bg-purple-600 text-white'
                                : 'bg-purple-100 text-purple-700 hover:bg-purple-200'
                            }`}
                          >
                            <IconComponent className="w-4 h-4" />
                            <span className="text-sm font-medium">{trigger}</span>
                          </motion.button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Associated Symptoms */}
                {data.assessment.associated_symptoms && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-900 mb-3">Associated Symptoms</h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {data.assessment.associated_symptoms.map((symptom: string, idx: number) => (
                        <div key={idx} className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-purple-600 rounded-full" />
                          <span className="text-sm text-gray-700">{symptom}</span>
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

      {/* Diagnostic Recommendations */}
      {data.diagnostic_recommendations && (
        <motion.div 
          className="bg-white rounded-xl shadow-lg p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
            <TestTube className="w-6 h-6 text-purple-600" />
            Diagnostic Recommendations
          </h2>

          <div className="space-y-4">
            {/* Neuroimaging */}
            {data.diagnostic_recommendations.neuroimaging && (
              <div className="border-l-4 border-purple-500 pl-4">
                <h3 className="font-semibold text-purple-900 mb-3 flex items-center gap-2">
                  <Brain className="w-5 h-5" />
                  Neuroimaging
                </h3>
                {data.diagnostic_recommendations.neuroimaging.mri_brain && (
                  <div className="bg-purple-50 rounded-lg p-3 mb-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium text-gray-900">MRI Brain</p>
                        <p className="text-sm text-gray-600 mt-1">
                          Protocol: {data.diagnostic_recommendations.neuroimaging.mri_brain.protocol}
                        </p>
                        <p className="text-sm text-gray-600">
                          {data.diagnostic_recommendations.neuroimaging.mri_brain.rationale}
                        </p>
                      </div>
                      <span className="text-xs bg-purple-600 text-white px-2 py-1 rounded">
                        {data.diagnostic_recommendations.neuroimaging.mri_brain.urgency}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Laboratory Tests */}
            {data.diagnostic_recommendations.laboratory && (
              <div className="border-l-4 border-blue-500 pl-4">
                <h3 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
                  <TestTube className="w-5 h-5" />
                  Laboratory Tests
                </h3>
                <div className="space-y-2">
                  {data.diagnostic_recommendations.laboratory.map((test: any, idx: number) => (
                    <div key={idx} className="bg-blue-50 rounded-lg p-3">
                      <p className="font-medium text-gray-900">{test.test}</p>
                      <p className="text-sm text-gray-600 mt-1">{test.rationale}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Specialized Tests */}
            {data.diagnostic_recommendations.specialized && (
              <div className="border-l-4 border-green-500 pl-4">
                <h3 className="font-semibold text-green-900 mb-3 flex items-center gap-2">
                  <Activity className="w-5 h-5" />
                  Specialized Tests
                </h3>
                <div className="space-y-2">
                  {data.diagnostic_recommendations.specialized.map((test: any, idx: number) => (
                    <div key={idx} className="bg-green-50 rounded-lg p-3">
                      <p className="font-medium text-gray-900">{test.test}</p>
                      <p className="text-sm text-gray-600 mt-1">{test.indication}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* Treatment Recommendations */}
      {data.treatment_recommendations && (
        <motion.div 
          className="bg-white rounded-xl shadow-lg p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
            <Pill className="w-6 h-6 text-purple-600" />
            Treatment Plan
          </h2>

          <div className="space-y-6">
            {/* Acute Management */}
            {data.treatment_recommendations.acute_management && (
              <div className="bg-gradient-to-r from-red-50 to-pink-50 rounded-lg p-4">
                <h3 className="font-semibold text-red-900 mb-3 flex items-center gap-2">
                  <Zap className="w-5 h-5" />
                  Acute Management
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {data.treatment_recommendations.acute_management.abortive && (
                    <div className="bg-white rounded-lg p-3">
                      <p className="text-xs text-gray-600 mb-1">Abortive Therapy</p>
                      <ul className="space-y-1">
                        {data.treatment_recommendations.acute_management.abortive.map((med: string, idx: number) => (
                          <li key={idx} className="text-sm flex items-start gap-2">
                            <Pill className="w-3 h-3 text-red-600 flex-shrink-0 mt-0.5" />
                            <span>{med}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {data.treatment_recommendations.acute_management.rescue && (
                    <div className="bg-white rounded-lg p-3">
                      <p className="text-xs text-gray-600 mb-1">Rescue Medications</p>
                      <ul className="space-y-1">
                        {data.treatment_recommendations.acute_management.rescue.map((med: string, idx: number) => (
                          <li key={idx} className="text-sm flex items-start gap-2">
                            <Pill className="w-3 h-3 text-pink-600 flex-shrink-0 mt-0.5" />
                            <span>{med}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Preventive Therapy */}
            {data.treatment_recommendations.preventive_therapy && (
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4">
                <h3 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  Preventive Therapy
                </h3>
                <div className="space-y-3">
                  {data.treatment_recommendations.preventive_therapy.first_line && (
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-2">First-Line Options:</p>
                      <div className="space-y-2">
                        {data.treatment_recommendations.preventive_therapy.first_line.map((med: string, idx: number) => (
                          <div key={idx} className="bg-white rounded-lg p-2 text-sm">
                            {med}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {data.treatment_recommendations.preventive_therapy.cgrp_antagonists && (
                    <div className="bg-indigo-100 rounded-lg p-3">
                      <p className="text-sm font-medium text-indigo-900">CGRP Antagonists:</p>
                      <p className="text-sm text-indigo-700 mt-1">
                        {data.treatment_recommendations.preventive_therapy.cgrp_antagonists}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Non-Pharmacologic */}
            {data.treatment_recommendations.non_pharmacologic && (
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-4">
                <h3 className="font-semibold text-green-900 mb-3 flex items-center gap-2">
                  <Activity className="w-5 h-5" />
                  Non-Pharmacologic Interventions
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {data.treatment_recommendations.non_pharmacologic.map((intervention: string, idx: number) => (
                    <div key={idx} className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span className="text-sm text-gray-700">{intervention}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Medication Overuse Management */}
            {data.treatment_recommendations.medication_overuse && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h3 className="font-semibold text-yellow-900 mb-3 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5" />
                  Medication Overuse Management
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Plan:</span>
                    <span className="text-sm font-medium">{data.treatment_recommendations.medication_overuse.plan}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Bridge Therapy:</span>
                    <span className="text-sm font-medium">{data.treatment_recommendations.medication_overuse.bridge_therapy}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Prevention:</span>
                    <span className="text-sm font-medium">{data.treatment_recommendations.medication_overuse.prevention}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* Follow-up Plan */}
      {data.follow_up_plan && (
        <motion.div 
          className="bg-gradient-to-r from-gray-900 to-gray-700 rounded-xl p-6 text-white"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Calendar className="w-6 h-6" />
            Follow-up Plan
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white/10 backdrop-blur rounded-lg p-3">
              <p className="text-white/70 text-sm mb-1">Neurology Follow-up</p>
              <p className="font-semibold">{data.follow_up_plan.neurology || 'As scheduled'}</p>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-lg p-3">
              <p className="text-white/70 text-sm mb-1">Headache Diary</p>
              <p className="font-semibold">{data.follow_up_plan.headache_diary || 'Track daily'}</p>
            </div>
            {data.follow_up_plan.imaging_review && (
              <div className="bg-white/10 backdrop-blur rounded-lg p-3">
                <p className="text-white/70 text-sm mb-1">Imaging Review</p>
                <p className="font-semibold">{data.follow_up_plan.imaging_review}</p>
              </div>
            )}
            {data.follow_up_plan.medication_adjustment && (
              <div className="bg-white/10 backdrop-blur rounded-lg p-3">
                <p className="text-white/70 text-sm mb-1">Medication Adjustment</p>
                <p className="font-semibold">{data.follow_up_plan.medication_adjustment}</p>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
};