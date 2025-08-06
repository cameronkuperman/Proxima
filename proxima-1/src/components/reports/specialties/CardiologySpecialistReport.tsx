'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Heart,
  Activity,
  AlertTriangle,
  Gauge,
  TrendingUp,
  Shield,
  Clock,
  Pill,
  TestTube,
  ChevronRight,
  AlertCircle,
  CheckCircle,
  Info,
  Stethoscope,
  Calendar,
  FileText,
  Zap,
  Target,
  BarChart3
} from 'lucide-react';
import { extractSpecialtyData } from '@/utils/specialtyDetector';

interface CardiologySpecialistReportProps {
  report: any;
}

// Risk level color mapping
const getRiskColor = (level: string) => {
  const lowerLevel = level?.toLowerCase() || '';
  if (lowerLevel.includes('low')) return 'text-green-600 bg-green-50 border-green-200';
  if (lowerLevel.includes('moderate') || lowerLevel.includes('intermediate')) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
  if (lowerLevel.includes('high')) return 'text-red-600 bg-red-50 border-red-200';
  return 'text-gray-600 bg-gray-50 border-gray-200';
};

// Score severity mapping
const getScoreSeverity = (score: number, scale: string) => {
  if (scale === 'HEART') {
    if (score <= 3) return { color: 'green', label: 'Low Risk', percentage: (score / 10) * 100 };
    if (score <= 6) return { color: 'yellow', label: 'Moderate Risk', percentage: (score / 10) * 100 };
    return { color: 'red', label: 'High Risk', percentage: (score / 10) * 100 };
  }
  if (scale === 'CHA2DS2-VASc') {
    if (score === 0) return { color: 'green', label: 'Low Risk', percentage: 0 };
    if (score === 1) return { color: 'yellow', label: 'Moderate Risk', percentage: 33 };
    return { color: 'red', label: 'High Risk', percentage: Math.min((score / 9) * 100, 100) };
  }
  return { color: 'gray', label: 'Unknown', percentage: 50 };
};

export const CardiologySpecialistReport: React.FC<CardiologySpecialistReportProps> = ({ report }) => {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['summary', 'assessment', 'scales', 'recommendations']));
  
  const data = extractSpecialtyData(report, 'cardiology');
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

  // Animated number component
  const AnimatedNumber = ({ value, suffix = '' }: { value: number; suffix?: string }) => (
    <motion.span
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: "spring", stiffness: 100 }}
      className="text-3xl font-bold"
    >
      {value}{suffix}
    </motion.span>
  );

  // Risk Gauge Component
  const RiskGauge = ({ label, value, maxValue, risk }: any) => {
    const percentage = (value / maxValue) * 100;
    const rotation = (percentage * 180) / 100 - 90;
    
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
            stroke={risk === 'high' ? '#dc2626' : risk === 'moderate' ? '#f59e0b' : '#10b981'}
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
          <span className="text-xs text-gray-500">{label}</span>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header with ECG Animation */}
      <motion.div 
        className="bg-gradient-to-r from-red-600 to-pink-600 rounded-2xl p-8 text-white relative overflow-hidden"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {/* ECG Wave Animation */}
        <div className="absolute inset-0 opacity-20">
          <svg className="w-full h-full">
            <motion.path
              d="M 0 50 Q 50 30, 100 50 T 200 50 L 250 50 L 260 20 L 270 80 L 280 50 L 350 50 Q 400 30, 450 50 T 550 50"
              stroke="white"
              strokeWidth="2"
              fill="none"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            />
          </svg>
        </div>
        
        <div className="relative z-10 flex items-center gap-6">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200 }}
            className="p-6 bg-white/20 backdrop-blur rounded-2xl"
          >
            <Heart className="w-16 h-16 text-white" />
          </motion.div>
          <div>
            <h1 className="text-3xl font-bold mb-2">Cardiology Consultation Report</h1>
            <p className="text-white/80">
              Comprehensive cardiovascular assessment and recommendations
            </p>
            <div className="flex items-center gap-4 mt-3 text-sm">
              <span className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                {new Date(report.generated_at).toLocaleDateString()}
              </span>
              <span className="flex items-center gap-2">
                <Stethoscope className="w-4 h-4" />
                Cardiology Specialist
              </span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Critical Alerts */}
      {data.executive_summary?.urgency_indicators && data.executive_summary.urgency_indicators.length > 0 && (
        <motion.div 
          className="bg-red-50 border-2 border-red-200 rounded-xl p-6"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
        >
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-6 h-6 text-red-600 flex-shrink-0 mt-1" />
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-red-900 mb-2">Urgent Clinical Indicators</h3>
              <div className="space-y-2">
                {data.executive_summary.urgency_indicators.map((indicator: string, idx: number) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 + idx * 0.1 }}
                    className="flex items-center gap-2"
                  >
                    <ChevronRight className="w-4 h-4 text-red-500" />
                    <span className="text-red-800">{indicator}</span>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Clinical Risk Scores Dashboard */}
      {data.scales && Object.keys(data.scales).length > 0 && (
        <motion.div 
          className="bg-white rounded-xl shadow-lg p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
              <Gauge className="w-6 h-6 text-red-600" />
              Clinical Risk Scores
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
                className="grid grid-cols-1 md:grid-cols-3 gap-6"
              >
                {/* HEART Score */}
                {data.scales.HEART_Score && (
                  <div className="bg-gradient-to-br from-red-50 to-pink-50 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <Activity className="w-5 h-5 text-red-600" />
                      HEART Score
                    </h3>
                    <div className="flex justify-center mb-3">
                      <RiskGauge 
                        label="HEART" 
                        value={data.scales.HEART_Score.total_score}
                        maxValue={10}
                        risk={data.scales.HEART_Score.risk_category?.toLowerCase()}
                      />
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Risk Category:</span>
                        <span className={`font-semibold ${
                          data.scales.HEART_Score.risk_category?.includes('Low') ? 'text-green-600' :
                          data.scales.HEART_Score.risk_category?.includes('Moderate') ? 'text-yellow-600' :
                          'text-red-600'
                        }`}>{data.scales.HEART_Score.risk_category}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">MACE Risk:</span>
                        <span className="font-semibold">{data.scales.HEART_Score.mace_risk}</span>
                      </div>
                      <div className="pt-2 border-t border-red-100">
                        <p className="text-xs text-gray-600">{data.scales.HEART_Score.recommendation}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* CHA2DS2-VASc Score */}
                {data.scales.CHA2DS2_VASc && (
                  <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <Shield className="w-5 h-5 text-purple-600" />
                      CHA₂DS₂-VASc
                    </h3>
                    <div className="flex justify-center mb-3">
                      <RiskGauge 
                        label="Score" 
                        value={data.scales.CHA2DS2_VASc.total_score}
                        maxValue={9}
                        risk={data.scales.CHA2DS2_VASc.annual_stroke_risk > 5 ? 'high' : 
                              data.scales.CHA2DS2_VASc.annual_stroke_risk > 2 ? 'moderate' : 'low'}
                      />
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Stroke Risk:</span>
                        <span className="font-semibold text-purple-600">{data.scales.CHA2DS2_VASc.annual_stroke_risk}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Anticoagulation:</span>
                        <span className="font-semibold text-xs">{data.scales.CHA2DS2_VASc.anticoagulation}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Framingham Risk */}
                {data.scales.Framingham_Risk && (
                  <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-blue-600" />
                      Framingham Risk
                    </h3>
                    <div className="text-center mb-3">
                      <AnimatedNumber value={parseInt(data.scales.Framingham_Risk.ten_year_risk)} suffix="%" />
                      <p className="text-sm text-gray-600 mt-1">10-Year CVD Risk</p>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Category:</span>
                        <span className={`font-semibold ${
                          data.scales.Framingham_Risk.risk_category?.includes('Low') ? 'text-green-600' :
                          data.scales.Framingham_Risk.risk_category?.includes('Intermediate') ? 'text-yellow-600' :
                          'text-red-600'
                        }`}>{data.scales.Framingham_Risk.risk_category}</span>
                      </div>
                      <div className="pt-2 border-t border-blue-100">
                        <p className="text-xs text-gray-600">{data.scales.Framingham_Risk.statin_benefit}</p>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Cardiac Assessment Details */}
      {data.assessment && (
        <motion.div 
          className="bg-white rounded-xl shadow-lg p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
              <Heart className="w-6 h-6 text-red-600" />
              Cardiac Assessment
            </h2>
            <button
              onClick={() => toggleSection('assessment')}
              className="text-gray-500 hover:text-gray-700"
            >
              {expandedSections.has('assessment') ? '−' : '+'}
            </button>
          </div>

          <AnimatePresence>
            {expandedSections.has('assessment') && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="space-y-6"
              >
                {/* Chest Pain Characteristics */}
                {data.assessment.chest_pain_characteristics && (
                  <div className="bg-red-50 rounded-lg p-4">
                    <h3 className="font-semibold text-red-900 mb-3 flex items-center gap-2">
                      <AlertCircle className="w-5 h-5" />
                      Chest Pain Analysis
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      <div className="bg-white rounded-lg p-3">
                        <p className="text-xs text-gray-500 mb-1">Quality</p>
                        <p className="font-medium text-gray-900">{data.assessment.chest_pain_characteristics.quality}</p>
                      </div>
                      <div className="bg-white rounded-lg p-3">
                        <p className="text-xs text-gray-500 mb-1">Location</p>
                        <p className="font-medium text-gray-900">{data.assessment.chest_pain_characteristics.location}</p>
                      </div>
                      <div className="bg-white rounded-lg p-3">
                        <p className="text-xs text-gray-500 mb-1">Duration</p>
                        <p className="font-medium text-gray-900">{data.assessment.chest_pain_characteristics.duration}</p>
                      </div>
                      <div className="bg-white rounded-lg p-3">
                        <p className="text-xs text-gray-500 mb-1">Radiation</p>
                        <p className="font-medium text-gray-900">{data.assessment.chest_pain_characteristics.radiation}</p>
                      </div>
                      <div className="bg-white rounded-lg p-3 md:col-span-2">
                        <p className="text-xs text-gray-500 mb-1">Triggers</p>
                        <p className="font-medium text-gray-900">
                          {data.assessment.chest_pain_characteristics.triggers?.join(', ')}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Risk Factors */}
                {data.assessment.cardiac_risk_factors && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-orange-50 rounded-lg p-4">
                      <h4 className="font-semibold text-orange-900 mb-3">Modifiable Risk Factors</h4>
                      <div className="space-y-2">
                        {data.assessment.cardiac_risk_factors.modifiable?.map((factor: string, idx: number) => (
                          <div key={idx} className="flex items-start gap-2">
                            <ChevronRight className="w-4 h-4 text-orange-600 flex-shrink-0 mt-0.5" />
                            <span className="text-sm text-gray-700">{factor}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="font-semibold text-gray-900 mb-3">Non-Modifiable Risk Factors</h4>
                      <div className="space-y-2">
                        {data.assessment.cardiac_risk_factors.non_modifiable?.map((factor: string, idx: number) => (
                          <div key={idx} className="flex items-start gap-2">
                            <ChevronRight className="w-4 h-4 text-gray-600 flex-shrink-0 mt-0.5" />
                            <span className="text-sm text-gray-700">{factor}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Functional Capacity */}
                {data.assessment.functional_capacity && (
                  <div className="bg-blue-50 rounded-lg p-4">
                    <h4 className="font-semibold text-blue-900 mb-3">Functional Capacity</h4>
                    <div className="flex items-center gap-4">
                      <div className="flex-1">
                        <div className="flex justify-between mb-2">
                          <span className="text-sm text-gray-600">METs Level</span>
                          <span className="font-semibold">{data.assessment.functional_capacity.mets}</span>
                        </div>
                        <div className="bg-gray-200 rounded-full h-2">
                          <motion.div 
                            className="bg-blue-600 h-2 rounded-full"
                            initial={{ width: 0 }}
                            animate={{ width: `${(parseInt(data.assessment.functional_capacity.mets) / 12) * 100}%` }}
                            transition={{ duration: 1, ease: "easeOut" }}
                          />
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-500">Limitation</p>
                        <p className="text-sm font-medium">{data.assessment.functional_capacity.limitation}</p>
                      </div>
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
            <TestTube className="w-6 h-6 text-red-600" />
            Diagnostic Recommendations
          </h2>

          <div className="space-y-4">
            {/* Immediate Tests */}
            {data.diagnostic_recommendations.immediate && (
              <div className="border-l-4 border-red-500 pl-4">
                <h3 className="font-semibold text-red-900 mb-3 flex items-center gap-2">
                  <Zap className="w-5 h-5" />
                  Immediate Tests Required
                </h3>
                <div className="space-y-2">
                  {data.diagnostic_recommendations.immediate.map((test: any, idx: number) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.5 + idx * 0.1 }}
                      className="bg-red-50 rounded-lg p-3"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium text-gray-900">{test.test}</p>
                          <p className="text-sm text-gray-600 mt-1">{test.rationale}</p>
                        </div>
                        <span className="text-xs bg-red-600 text-white px-2 py-1 rounded">
                          {test.urgency}
                        </span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* Short-term Tests */}
            {data.diagnostic_recommendations.short_term && (
              <div className="border-l-4 border-yellow-500 pl-4">
                <h3 className="font-semibold text-yellow-900 mb-3 flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Short-term Follow-up
                </h3>
                <div className="space-y-2">
                  {data.diagnostic_recommendations.short_term.map((test: any, idx: number) => (
                    <div key={idx} className="bg-yellow-50 rounded-lg p-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium text-gray-900">{test.test}</p>
                          <p className="text-sm text-gray-600 mt-1">{test.rationale}</p>
                        </div>
                        <span className="text-xs bg-yellow-600 text-white px-2 py-1 rounded">
                          {test.timeframe}
                        </span>
                      </div>
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
            <Pill className="w-6 h-6 text-red-600" />
            Treatment Plan
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Medical Optimization */}
            {data.treatment_recommendations.medical_optimization && (
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-4">
                <h3 className="font-semibold text-green-900 mb-3">Medical Optimization</h3>
                <div className="space-y-3">
                  {Object.entries(data.treatment_recommendations.medical_optimization).map(([drug, recommendation]) => (
                    <div key={drug} className="bg-white rounded-lg p-3">
                      <p className="text-xs text-gray-500 mb-1">{drug.replace(/_/g, ' ').toUpperCase()}</p>
                      <p className="text-sm font-medium text-gray-900">{recommendation as string}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Lifestyle Modifications */}
            {data.treatment_recommendations.lifestyle_modifications && (
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-4">
                <h3 className="font-semibold text-blue-900 mb-3">Lifestyle Modifications</h3>
                <div className="space-y-2">
                  {data.treatment_recommendations.lifestyle_modifications.map((mod: string, idx: number) => (
                    <div key={idx} className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-gray-700">{mod}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Follow-up Plan */}
          {data.treatment_recommendations.follow_up && (
            <div className="mt-6 bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-gray-600" />
                Follow-up Schedule
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {Object.entries(data.treatment_recommendations.follow_up).map(([specialty, timing]) => (
                  <div key={specialty} className="flex justify-between items-center bg-white rounded-lg p-3">
                    <span className="text-sm font-medium text-gray-700">
                      {specialty.charAt(0).toUpperCase() + specialty.slice(1)}
                    </span>
                    <span className="text-sm text-gray-900 font-semibold">{timing as string}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      )}

      {/* Risk Stratification Summary */}
      {reportData.risk_stratification && (
        <motion.div 
          className="bg-gradient-to-r from-gray-900 to-gray-700 rounded-xl p-6 text-white"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Target className="w-6 h-6" />
            Clinical Risk Stratification
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white/10 backdrop-blur rounded-lg p-3">
              <p className="text-white/70 text-sm mb-1">Clinical Impression</p>
              <p className="font-semibold">{reportData.risk_stratification.clinical_impression}</p>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-lg p-3">
              <p className="text-white/70 text-sm mb-1">Disposition</p>
              <p className="font-semibold">{reportData.risk_stratification.disposition}</p>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-lg p-3">
              <p className="text-white/70 text-sm mb-1">Confidence</p>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-white/20 rounded-full h-2">
                  <motion.div 
                    className="bg-white h-2 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${(report.confidence_score || 85)}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                  />
                </div>
                <span className="text-sm font-semibold">{report.confidence_score || 85}%</span>
              </div>
            </div>
          </div>
          {reportData.risk_stratification.reasoning && (
            <div className="mt-4 bg-white/10 backdrop-blur rounded-lg p-3">
              <p className="text-white/70 text-sm mb-1">Clinical Reasoning</p>
              <p className="text-sm">{reportData.risk_stratification.reasoning}</p>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
};