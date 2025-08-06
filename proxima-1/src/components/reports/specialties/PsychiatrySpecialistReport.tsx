'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Brain,
  Heart,
  AlertTriangle,
  Shield,
  Calendar,
  Clock,
  Pill,
  ChevronRight,
  AlertCircle,
  CheckCircle,
  User,
  Activity,
  TrendingUp,
  Phone,
  MessageSquare,
  Sun,
  Moon,
  CloudRain,
  Gauge,
  Target,
  Users,
  FileText,
  Sparkles
} from 'lucide-react';
import { extractSpecialtyData } from '@/utils/specialtyDetector';

interface PsychiatrySpecialistReportProps {
  report: any;
}

// PHQ-9 Score interpretation
const getPHQ9Interpretation = (score: number) => {
  if (score <= 4) return { severity: 'Minimal', color: 'green', recommendation: 'Monitor' };
  if (score <= 9) return { severity: 'Mild', color: 'yellow', recommendation: 'Watchful waiting' };
  if (score <= 14) return { severity: 'Moderate', color: 'orange', recommendation: 'Treatment plan' };
  if (score <= 19) return { severity: 'Moderately Severe', color: 'red', recommendation: 'Active treatment' };
  return { severity: 'Severe', color: 'red', recommendation: 'Immediate treatment' };
};

// GAD-7 Score interpretation
const getGAD7Interpretation = (score: number) => {
  if (score <= 4) return { severity: 'Minimal', color: 'green' };
  if (score <= 9) return { severity: 'Mild', color: 'yellow' };
  if (score <= 14) return { severity: 'Moderate', color: 'orange' };
  return { severity: 'Severe', color: 'red' };
};

// Risk level visualization
const getRiskLevel = (level: string) => {
  const lowerLevel = level?.toLowerCase() || '';
  if (lowerLevel.includes('low')) return { color: 'green', icon: '✓', label: 'Low Risk' };
  if (lowerLevel.includes('moderate')) return { color: 'yellow', icon: '⚠', label: 'Moderate Risk' };
  if (lowerLevel.includes('high')) return { color: 'red', icon: '⚡', label: 'High Risk' };
  return { color: 'gray', icon: '?', label: 'Unknown' };
};

export const PsychiatrySpecialistReport: React.FC<PsychiatrySpecialistReportProps> = ({ report }) => {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(['safety', 'scales', 'mse', 'treatment'])
  );
  
  const data = extractSpecialtyData(report, 'psychiatry');
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

  // Mood Tracker Visualization
  const MoodTracker = ({ mood }: { mood: string }) => {
    const moodIcons = {
      'depressed': CloudRain,
      'anxious': Activity,
      'stable': Sun,
      'elevated': Sparkles,
      'mixed': Moon
    };
    
    const MoodIcon = moodIcons[mood?.toLowerCase() as keyof typeof moodIcons] || Sun;
    
    return (
      <div className="flex items-center justify-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200 }}
          className="relative"
        >
          <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center">
            <MoodIcon className="w-12 h-12 text-blue-600" />
          </div>
          <motion.div
            className="absolute inset-0 rounded-full border-4 border-blue-400"
            initial={{ scale: 1 }}
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            style={{ opacity: 0.3 }}
          />
        </motion.div>
      </div>
    );
  };

  // Safety Gauge Component
  const SafetyGauge = ({ riskLevel }: { riskLevel: string }) => {
    const risk = getRiskLevel(riskLevel);
    const colors = {
      green: 'from-green-400 to-green-600',
      yellow: 'from-yellow-400 to-yellow-600',
      red: 'from-red-400 to-red-600',
      gray: 'from-gray-400 to-gray-600'
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
            stroke="url(#gradient)"
            strokeWidth="12"
            fill="none"
            strokeDasharray="352"
            strokeDashoffset={risk.color === 'green' ? 264 : risk.color === 'yellow' ? 176 : risk.color === 'red' ? 88 : 176}
            initial={{ strokeDashoffset: 352 }}
            animate={{ strokeDashoffset: risk.color === 'green' ? 264 : risk.color === 'yellow' ? 176 : risk.color === 'red' ? 88 : 176 }}
            transition={{ duration: 1, ease: "easeOut" }}
          />
          <defs>
            <linearGradient id="gradient">
              <stop offset="0%" stopColor={risk.color === 'green' ? '#10b981' : risk.color === 'yellow' ? '#f59e0b' : '#dc2626'} />
              <stop offset="100%" stopColor={risk.color === 'green' ? '#059669' : risk.color === 'yellow' ? '#d97706' : '#991b1b'} />
            </linearGradient>
          </defs>
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl">{risk.icon}</span>
          <span className="text-xs text-gray-600 mt-1">{risk.label}</span>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header with Calming Gradient */}
      <motion.div 
        className="bg-gradient-to-r from-blue-600 to-cyan-600 rounded-2xl p-8 text-white relative overflow-hidden"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {/* Animated Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <motion.div
            className="absolute inset-0"
            style={{
              backgroundImage: 'radial-gradient(circle at 30% 50%, white 1px, transparent 1px)',
              backgroundSize: '40px 40px'
            }}
            animate={{
              backgroundPosition: ['0px 0px', '40px 40px']
            }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          />
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
            <h1 className="text-3xl font-bold mb-2">Psychiatry Consultation Report</h1>
            <p className="text-white/80">
              Comprehensive mental health assessment and treatment plan
            </p>
            <div className="flex items-center gap-4 mt-3 text-sm">
              <span className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                {new Date(report.generated_at).toLocaleDateString()}
              </span>
              <span className="flex items-center gap-2">
                <Brain className="w-4 h-4" />
                Psychiatry Specialist
              </span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Safety Assessment - Most Critical */}
      {(data.assessment?.safety_assessment || data.findings?.safety_assessment || reportData.safety_assessment) && (
        <motion.div 
          className={`border-2 rounded-xl p-6 ${
            (data.assessment?.safety_assessment?.risk_level || data.findings?.safety_assessment?.risk_level || reportData.safety_assessment?.risk_level || '').toLowerCase().includes('high') 
              ? 'bg-red-50 border-red-300' 
              : (data.assessment?.safety_assessment?.risk_level || data.findings?.safety_assessment?.risk_level || reportData.safety_assessment?.risk_level || '').toLowerCase().includes('moderate')
              ? 'bg-yellow-50 border-yellow-300'
              : 'bg-green-50 border-green-300'
          }`}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
        >
          <div className="flex items-start gap-3">
            <Shield className="w-6 h-6 flex-shrink-0 mt-1 text-blue-600" />
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Safety Assessment</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Suicidal Ideation */}
                <div className="bg-white rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-orange-600" />
                    Suicidal Ideation
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Current:</span>
                      <span className="font-medium">{data.assessment?.safety_assessment?.suicidal_ideation?.current || 'Denies'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Passive:</span>
                      <span className="font-medium">{data.assessment?.safety_assessment?.suicidal_ideation?.passive || 'None'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Plan:</span>
                      <span className="font-medium">{data.assessment?.safety_assessment?.suicidal_ideation?.plan || 'None'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Intent:</span>
                      <span className="font-medium">{data.assessment?.safety_assessment?.suicidal_ideation?.intent || 'None'}</span>
                    </div>
                  </div>
                </div>

                {/* Risk Level Gauge */}
                <div className="bg-white rounded-lg p-4 flex flex-col items-center justify-center">
                  <SafetyGauge riskLevel={data.assessment?.safety_assessment?.risk_level || 'low'} />
                  <p className="text-sm text-gray-600 mt-2">Overall Risk Assessment</p>
                </div>
              </div>

              {/* Protective Factors */}
              {data.assessment?.safety_assessment?.protective_factors && data.assessment.safety_assessment.protective_factors.length > 0 && (
                <div className="mt-4 bg-green-50 rounded-lg p-4">
                  <h4 className="font-medium text-green-900 mb-2 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" />
                    Protective Factors
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {data.assessment.safety_assessment.protective_factors.map((factor: string, idx: number) => (
                      <div key={idx} className="flex items-center gap-2 text-sm text-green-800">
                        <div className="w-2 h-2 bg-green-600 rounded-full" />
                        <span>{factor}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}

      {/* Clinical Scales Dashboard */}
      {(data.scales || data.assessment?.clinical_scales) && (
        <motion.div 
          className="bg-white rounded-xl shadow-lg p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
              <Gauge className="w-6 h-6 text-blue-600" />
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
                className="grid grid-cols-1 md:grid-cols-3 gap-6"
              >
                {/* PHQ-9 Score */}
                {(data.scales?.PHQ9_Score || data.assessment?.clinical_scales?.PHQ9_Score) && (
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <Heart className="w-5 h-5 text-blue-600" />
                      PHQ-9 Depression Scale
                    </h3>
                    <div className="text-center mb-3">
                      <motion.div 
                        className="text-4xl font-bold text-blue-600"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 200 }}
                      >
                        {data.scales?.PHQ9_Score?.total_score || data.assessment?.clinical_scales?.PHQ9_Score?.total_score}
                      </motion.div>
                      <div className={`text-sm font-medium mt-2 ${
                        getPHQ9Interpretation(data.scales?.PHQ9_Score?.total_score || 0).color === 'green' ? 'text-green-600' :
                        getPHQ9Interpretation(data.scales?.PHQ9_Score?.total_score || 0).color === 'yellow' ? 'text-yellow-600' :
                        getPHQ9Interpretation(data.scales?.PHQ9_Score?.total_score || 0).color === 'orange' ? 'text-orange-600' :
                        'text-red-600'
                      }`}>
                        {getPHQ9Interpretation(data.scales?.PHQ9_Score?.total_score || 0).severity} Depression
                      </div>
                    </div>
                    <div className="space-y-1 text-xs">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Functional Impact:</span>
                        <span className="font-medium">{data.scales?.PHQ9_Score?.functional_impact || 'N/A'}</span>
                      </div>
                      <div className="pt-2 border-t border-blue-100">
                        <p className="text-gray-600">
                          {getPHQ9Interpretation(data.scales?.PHQ9_Score?.total_score || 0).recommendation}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* GAD-7 Score */}
                {(data.scales?.GAD7_Score || data.assessment?.clinical_scales?.GAD7_Score) && (
                  <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <Activity className="w-5 h-5 text-purple-600" />
                      GAD-7 Anxiety Scale
                    </h3>
                    <div className="text-center mb-3">
                      <motion.div 
                        className="text-4xl font-bold text-purple-600"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 200, delay: 0.1 }}
                      >
                        {data.scales?.GAD7_Score?.total_score || data.assessment?.clinical_scales?.GAD7_Score?.total_score}
                      </motion.div>
                      <div className={`text-sm font-medium mt-2 ${
                        getGAD7Interpretation(data.scales?.GAD7_Score?.total_score || 0).color === 'green' ? 'text-green-600' :
                        getGAD7Interpretation(data.scales?.GAD7_Score?.total_score || 0).color === 'yellow' ? 'text-yellow-600' :
                        getGAD7Interpretation(data.scales?.GAD7_Score?.total_score || 0).color === 'orange' ? 'text-orange-600' :
                        'text-red-600'
                      }`}>
                        {getGAD7Interpretation(data.scales?.GAD7_Score?.total_score || 0).severity} Anxiety
                      </div>
                    </div>
                    {data.scales?.GAD7_Score?.confidence && (
                      <div className="text-center">
                        <div className="bg-gray-200 rounded-full h-2 mt-2">
                          <motion.div 
                            className="bg-purple-600 h-2 rounded-full"
                            initial={{ width: 0 }}
                            animate={{ width: `${(data.scales.GAD7_Score.confidence * 100)}%` }}
                            transition={{ duration: 1, ease: "easeOut" }}
                          />
                        </div>
                        <p className="text-xs text-gray-600 mt-1">
                          Confidence: {Math.round(data.scales.GAD7_Score.confidence * 100)}%
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* MDQ Screen */}
                {(data.scales?.MDQ_Screen || data.assessment?.clinical_scales?.MDQ_Screen) && (
                  <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-yellow-600" />
                      MDQ Bipolar Screen
                    </h3>
                    <div className="text-center mb-3">
                      <div className={`text-2xl font-bold ${
                        (data.scales?.MDQ_Screen?.result || data.assessment?.clinical_scales?.MDQ_Screen?.result) === 'Negative' 
                          ? 'text-green-600' 
                          : 'text-red-600'
                      }`}>
                        {data.scales?.MDQ_Screen?.result || data.assessment?.clinical_scales?.MDQ_Screen?.result}
                      </div>
                    </div>
                    {data.scales?.MDQ_Screen?.reasoning && (
                      <p className="text-xs text-gray-600">
                        {data.scales.MDQ_Screen.reasoning}
                      </p>
                    )}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Mental Status Examination */}
      {(data.assessment?.mental_status_exam || data.findings?.mental_status_exam || reportData.mental_status_exam) && (
        <motion.div 
          className="bg-white rounded-xl shadow-lg p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
              <Brain className="w-6 h-6 text-blue-600" />
              Mental Status Examination
            </h2>
            <button
              onClick={() => toggleSection('mse')}
              className="text-gray-500 hover:text-gray-700"
            >
              {expandedSections.has('mse') ? '−' : '+'}
            </button>
          </div>

          <AnimatePresence>
            {expandedSections.has('mse') && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="grid grid-cols-1 md:grid-cols-2 gap-4"
              >
                {Object.entries(data.assessment?.mental_status_exam || data.findings?.mental_status_exam || reportData.mental_status_exam || {}).map(([category, assessment]) => (
                  <motion.div
                    key={category}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.1 }}
                    className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-lg p-4"
                  >
                    <h4 className="font-medium text-gray-900 mb-2 capitalize">
                      {category.replace(/_/g, ' ')}
                    </h4>
                    <p className="text-sm text-gray-700">{assessment as string}</p>
                  </motion.div>
                ))}

                {/* Mood Visualization */}
                <div className="md:col-span-2 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-4 text-center">Current Mood State</h4>
                  <MoodTracker mood={data.assessment?.mental_status_exam?.mood || 'stable'} />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Treatment Recommendations */}
      {data.treatment_recommendations && (
        <motion.div 
          className="bg-white rounded-xl shadow-lg p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
              <Pill className="w-6 h-6 text-blue-600" />
              Treatment Plan
            </h2>
            <button
              onClick={() => toggleSection('treatment')}
              className="text-gray-500 hover:text-gray-700"
            >
              {expandedSections.has('treatment') ? '−' : '+'}
            </button>
          </div>

          <AnimatePresence>
            {expandedSections.has('treatment') && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="space-y-6"
              >
                {/* Pharmacotherapy */}
                {data.treatment_recommendations.pharmacotherapy && (
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-4">
                    <h3 className="font-semibold text-green-900 mb-3 flex items-center gap-2">
                      <Pill className="w-5 h-5" />
                      Pharmacotherapy
                    </h3>
                    
                    {data.treatment_recommendations.pharmacotherapy.antidepressant && (
                      <div className="mb-3 bg-white rounded-lg p-3">
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Antidepressant</h4>
                        <p className="font-medium text-gray-900">
                          {data.treatment_recommendations.pharmacotherapy.antidepressant.recommendation}
                        </p>
                        <p className="text-sm text-gray-600 mt-1">
                          {data.treatment_recommendations.pharmacotherapy.antidepressant.rationale}
                        </p>
                        {data.treatment_recommendations.pharmacotherapy.antidepressant.titration && (
                          <p className="text-xs text-blue-600 mt-2">
                            Titration: {data.treatment_recommendations.pharmacotherapy.antidepressant.titration}
                          </p>
                        )}
                      </div>
                    )}

                    {data.treatment_recommendations.pharmacotherapy.sleep && (
                      <div className="bg-white rounded-lg p-3">
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Sleep Aid</h4>
                        <p className="font-medium text-gray-900">
                          {data.treatment_recommendations.pharmacotherapy.sleep.recommendation}
                        </p>
                        <p className="text-sm text-gray-600 mt-1">
                          {data.treatment_recommendations.pharmacotherapy.sleep.alternative}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Psychotherapy */}
                {data.treatment_recommendations.psychotherapy && (
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4">
                    <h3 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
                      <MessageSquare className="w-5 h-5" />
                      Psychotherapy
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="bg-white rounded-lg p-3">
                        <p className="text-xs text-gray-600 mb-1">Modality</p>
                        <p className="font-medium">{data.treatment_recommendations.psychotherapy.modality}</p>
                      </div>
                      <div className="bg-white rounded-lg p-3">
                        <p className="text-xs text-gray-600 mb-1">Frequency</p>
                        <p className="font-medium">{data.treatment_recommendations.psychotherapy.frequency}</p>
                      </div>
                      <div className="bg-white rounded-lg p-3 md:col-span-2">
                        <p className="text-xs text-gray-600 mb-1">Focus Areas</p>
                        <p className="font-medium">{data.treatment_recommendations.psychotherapy.focus}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Lifestyle Interventions */}
                {data.treatment_recommendations.lifestyle && (
                  <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-4">
                    <h3 className="font-semibold text-purple-900 mb-3 flex items-center gap-2">
                      <Activity className="w-5 h-5" />
                      Lifestyle Interventions
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {data.treatment_recommendations.lifestyle.map((intervention: string, idx: number) => (
                        <div key={idx} className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-purple-600" />
                          <span className="text-sm text-gray-700">{intervention}</span>
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

      {/* Follow-up and Monitoring */}
      {data.follow_up_plan && (
        <motion.div 
          className="bg-gradient-to-r from-gray-900 to-gray-700 rounded-xl p-6 text-white"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Calendar className="w-6 h-6" />
            Follow-up Plan
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white/10 backdrop-blur rounded-lg p-3">
              <p className="text-white/70 text-sm mb-1">Psychiatry Follow-up</p>
              <p className="font-semibold">{data.follow_up_plan.psychiatry || '2 weeks'}</p>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-lg p-3">
              <p className="text-white/70 text-sm mb-1">Therapy Start</p>
              <p className="font-semibold">{data.follow_up_plan.therapy || 'Within 1-2 weeks'}</p>
            </div>
            {data.follow_up_plan.crisis_plan && (
              <div className="bg-red-900/30 backdrop-blur rounded-lg p-3 md:col-span-2">
                <p className="text-white/90 text-sm mb-1 flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  Crisis Resources
                </p>
                <p className="font-semibold">{data.follow_up_plan.crisis_plan}</p>
                <p className="text-xs text-white/70 mt-2">
                  National Suicide Prevention Lifeline: 988
                </p>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* Prognosis */}
      {reportData.prognosis && (
        <motion.div 
          className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl p-6 text-white"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
            <TrendingUp className="w-6 h-6" />
            Prognosis
          </h3>
          <p className="text-white/90 mb-4">{reportData.prognosis.assessment}</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {reportData.prognosis.factors_favorable && (
              <div className="bg-white/10 backdrop-blur rounded-lg p-3">
                <p className="text-sm font-medium mb-2">Favorable Factors</p>
                <ul className="space-y-1">
                  {reportData.prognosis.factors_favorable.map((factor: string, idx: number) => (
                    <li key={idx} className="text-sm text-white/80 flex items-start gap-2">
                      <CheckCircle className="w-3 h-3 text-green-400 flex-shrink-0 mt-0.5" />
                      <span>{factor}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            {reportData.prognosis.factors_unfavorable && (
              <div className="bg-white/10 backdrop-blur rounded-lg p-3">
                <p className="text-sm font-medium mb-2">Challenges</p>
                <ul className="space-y-1">
                  {reportData.prognosis.factors_unfavorable.map((factor: string, idx: number) => (
                    <li key={idx} className="text-sm text-white/80 flex items-start gap-2">
                      <AlertCircle className="w-3 h-3 text-yellow-400 flex-shrink-0 mt-0.5" />
                      <span>{factor}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
};