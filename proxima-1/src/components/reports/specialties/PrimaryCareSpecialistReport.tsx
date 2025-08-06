'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Stethoscope,
  Calendar,
  Shield,
  AlertCircle,
  CheckCircle,
  Activity,
  Pill,
  TestTube,
  ChevronRight,
  User,
  Heart,
  Brain,
  Target,
  TrendingUp,
  Users,
  FileText,
  Syringe,
  Eye,
  Clipboard,
  Clock,
  AlertTriangle
} from 'lucide-react';
import { extractSpecialtyData } from '@/utils/specialtyDetector';

interface PrimaryCareSpecialistReportProps {
  report: any;
}

export const PrimaryCareSpecialistReport: React.FC<PrimaryCareSpecialistReportProps> = ({ report }) => {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(['clinical', 'preventive', 'optimization', 'plan'])
  );
  
  const data = extractSpecialtyData(report, 'primary-care');
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

  // Progress Bar Component
  const ProgressBar = ({ label, value, max, color }: any) => {
    const percentage = (value / max) * 100;
    return (
      <div className="mb-3">
        <div className="flex justify-between text-sm mb-1">
          <span className="text-gray-600">{label}</span>
          <span className="font-medium">{value}/{max}</span>
        </div>
        <div className="bg-gray-200 rounded-full h-2">
          <motion.div
            className={`h-2 rounded-full bg-${color}-600`}
            initial={{ width: 0 }}
            animate={{ width: `${percentage}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
          />
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div 
        className="bg-gradient-to-r from-gray-600 to-slate-600 rounded-2xl p-8 text-white relative overflow-hidden"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: 'radial-gradient(circle at 20% 50%, white 1px, transparent 1px)',
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
            <Stethoscope className="w-16 h-16 text-white" />
          </motion.div>
          <div>
            <h1 className="text-3xl font-bold mb-2">Primary Care Consultation Report</h1>
            <p className="text-white/80">
              Comprehensive health assessment and preventive care recommendations
            </p>
            <div className="flex items-center gap-4 mt-3 text-sm">
              <span className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                {new Date(report.generated_at).toLocaleDateString()}
              </span>
              <span className="flex items-center gap-2">
                <Stethoscope className="w-4 h-4" />
                Primary Care Provider
              </span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Clinical Summary */}
      {reportData.clinical_summary && (
        <motion.div 
          className="bg-white rounded-xl shadow-lg p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
              <Clipboard className="w-6 h-6 text-gray-600" />
              Clinical Summary
            </h2>
            <button
              onClick={() => toggleSection('clinical')}
              className="text-gray-500 hover:text-gray-700"
            >
              {expandedSections.has('clinical') ? '−' : '+'}
            </button>
          </div>

          <AnimatePresence>
            {expandedSections.has('clinical') && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="space-y-4"
              >
                {/* Chief Complaints */}
                {reportData.clinical_summary.chief_complaints && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-900 mb-3">Chief Complaints</h3>
                    <div className="space-y-2">
                      {reportData.clinical_summary.chief_complaints.map((complaint: string, idx: number) => (
                        <div key={idx} className="flex items-start gap-2">
                          <ChevronRight className="w-4 h-4 text-gray-500 flex-shrink-0 mt-0.5" />
                          <span className="text-gray-700">{complaint}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* HPI */}
                {reportData.clinical_summary.hpi && (
                  <div className="bg-blue-50 rounded-lg p-4">
                    <h3 className="font-semibold text-blue-900 mb-2">History of Present Illness</h3>
                    <p className="text-gray-700">{reportData.clinical_summary.hpi}</p>
                  </div>
                )}

                {/* Review of Systems */}
                {reportData.clinical_summary.review_of_systems && (
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3">Review of Systems</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {Object.entries(reportData.clinical_summary.review_of_systems).map(([system, findings]) => {
                        const findingsArray = findings as string[];
                        if (findingsArray.length === 0) return null;
                        return (
                          <div key={system} className="bg-white border border-gray-200 rounded-lg p-3">
                            <h4 className="text-sm font-medium text-gray-700 mb-1 capitalize">
                              {system.replace(/_/g, ' ')}
                            </h4>
                            <div className="space-y-1">
                              {findingsArray.map((finding: string, idx: number) => (
                                <p key={idx} className="text-sm text-gray-600">• {finding}</p>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Preventive Care Dashboard */}
      {reportData.preventive_care_gaps && (
        <motion.div 
          className="bg-white rounded-xl shadow-lg p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
              <Shield className="w-6 h-6 text-green-600" />
              Preventive Care & Health Maintenance
            </h2>
            <button
              onClick={() => toggleSection('preventive')}
              className="text-gray-500 hover:text-gray-700"
            >
              {expandedSections.has('preventive') ? '−' : '+'}
            </button>
          </div>

          <AnimatePresence>
            {expandedSections.has('preventive') && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="space-y-4"
              >
                {/* Screening Due */}
                {reportData.preventive_care_gaps.screening_due && reportData.preventive_care_gaps.screening_due.length > 0 && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <h3 className="font-semibold text-yellow-900 mb-3 flex items-center gap-2">
                      <AlertCircle className="w-5 h-5" />
                      Screening Tests Due
                    </h3>
                    <div className="space-y-2">
                      {reportData.preventive_care_gaps.screening_due.map((test: string, idx: number) => (
                        <motion.div
                          key={idx}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.1 }}
                          className="flex items-center gap-2"
                        >
                          <Clock className="w-4 h-4 text-yellow-600" />
                          <span className="text-gray-700">{test}</span>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Immunizations */}
                {reportData.preventive_care_gaps.immunizations_needed && reportData.preventive_care_gaps.immunizations_needed.length > 0 && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h3 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
                      <Syringe className="w-5 h-5" />
                      Immunizations Needed
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {reportData.preventive_care_gaps.immunizations_needed.map((vaccine: string, idx: number) => (
                        <div key={idx} className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-blue-600 rounded-full" />
                          <span className="text-sm text-gray-700">{vaccine}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Health Maintenance */}
                {reportData.preventive_care_gaps.health_maintenance && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <h3 className="font-semibold text-green-900 mb-3 flex items-center gap-2">
                      <Activity className="w-5 h-5" />
                      Health Maintenance
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {reportData.preventive_care_gaps.health_maintenance.map((item: string, idx: number) => (
                        <div key={idx} className="bg-white rounded-lg p-3 text-center">
                          <CheckCircle className="w-6 h-6 text-green-600 mx-auto mb-2" />
                          <p className="text-sm text-gray-700">{item}</p>
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

      {/* Health Optimization */}
      {reportData.health_optimization && (
        <motion.div 
          className="bg-white rounded-xl shadow-lg p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
              <TrendingUp className="w-6 h-6 text-blue-600" />
              Health Optimization Plan
            </h2>
            <button
              onClick={() => toggleSection('optimization')}
              className="text-gray-500 hover:text-gray-700"
            >
              {expandedSections.has('optimization') ? '−' : '+'}
            </button>
          </div>

          <AnimatePresence>
            {expandedSections.has('optimization') && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="space-y-4"
              >
                {/* Lifestyle Counseling */}
                {reportData.health_optimization.lifestyle_counseling && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Object.entries(reportData.health_optimization.lifestyle_counseling).map(([category, recommendations]) => {
                      const iconMap: any = {
                        diet: '🍎',
                        exercise: '🏃',
                        sleep: '😴',
                        stress: '🧘'
                      };
                      return (
                        <div key={category} className="bg-gradient-to-r from-indigo-50 to-blue-50 rounded-lg p-4">
                          <h4 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
                            <span className="text-2xl">{iconMap[category]}</span>
                            <span className="capitalize">{category}</span>
                          </h4>
                          <ul className="space-y-1">
                            {(recommendations as string[]).map((rec: string, idx: number) => (
                              <li key={idx} className="text-sm text-gray-700">• {rec}</li>
                            ))}
                          </ul>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Behavioral Health */}
                {reportData.health_optimization.behavioral_health && (
                  <div className="bg-purple-50 rounded-lg p-4">
                    <h3 className="font-semibold text-purple-900 mb-3 flex items-center gap-2">
                      <Brain className="w-5 h-5" />
                      Behavioral Health
                    </h3>
                    <div className="space-y-2">
                      {reportData.health_optimization.behavioral_health.mood_screening && (
                        <p className="text-sm text-gray-700">
                          <span className="font-medium">Mood Screening:</span> {reportData.health_optimization.behavioral_health.mood_screening}
                        </p>
                      )}
                      {reportData.health_optimization.behavioral_health.substance_use && (
                        <p className="text-sm text-gray-700">
                          <span className="font-medium">Substance Use:</span> {reportData.health_optimization.behavioral_health.substance_use}
                        </p>
                      )}
                      {reportData.health_optimization.behavioral_health.support_resources && (
                        <div className="mt-2">
                          <p className="text-sm font-medium text-gray-700 mb-1">Support Resources:</p>
                          <div className="flex flex-wrap gap-2">
                            {reportData.health_optimization.behavioral_health.support_resources.map((resource: string, idx: number) => (
                              <span key={idx} className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">
                                {resource}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Care Plan Summary */}
      {reportData.care_plan_summary && (
        <motion.div 
          className="bg-white rounded-xl shadow-lg p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
              <Target className="w-6 h-6 text-purple-600" />
              Care Plan & Next Steps
            </h2>
            <button
              onClick={() => toggleSection('plan')}
              className="text-gray-500 hover:text-gray-700"
            >
              {expandedSections.has('plan') ? '−' : '+'}
            </button>
          </div>

          <AnimatePresence>
            {expandedSections.has('plan') && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="space-y-4"
              >
                {/* Immediate Actions */}
                {reportData.care_plan_summary.immediate_actions && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <h3 className="font-semibold text-red-900 mb-3 flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5" />
                      Immediate Actions
                    </h3>
                    <ol className="space-y-2">
                      {reportData.care_plan_summary.immediate_actions.map((action: string, idx: number) => (
                        <motion.li
                          key={idx}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.1 }}
                          className="flex items-start gap-2"
                        >
                          <span className="flex-shrink-0 w-6 h-6 bg-red-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                            {idx + 1}
                          </span>
                          <span className="text-gray-700">{action}</span>
                        </motion.li>
                      ))}
                    </ol>
                  </div>
                )}

                {/* Goals */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Short-term Goals */}
                  {reportData.care_plan_summary.short_term_goals && (
                    <div className="bg-yellow-50 rounded-lg p-4">
                      <h4 className="font-medium text-yellow-900 mb-3">Short-term Goals</h4>
                      <ul className="space-y-2">
                        {reportData.care_plan_summary.short_term_goals.map((goal: string, idx: number) => (
                          <li key={idx} className="flex items-start gap-2">
                            <Target className="w-4 h-4 text-yellow-600 flex-shrink-0 mt-0.5" />
                            <span className="text-sm text-gray-700">{goal}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Long-term Goals */}
                  {reportData.care_plan_summary.long_term_goals && (
                    <div className="bg-green-50 rounded-lg p-4">
                      <h4 className="font-medium text-green-900 mb-3">Long-term Goals</h4>
                      <ul className="space-y-2">
                        {reportData.care_plan_summary.long_term_goals.map((goal: string, idx: number) => (
                          <li key={idx} className="flex items-start gap-2">
                            <TrendingUp className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                            <span className="text-sm text-gray-700">{goal}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {/* Follow-up Schedule */}
                {reportData.care_plan_summary.follow_up_schedule && (
                  <div className="bg-gradient-to-r from-gray-900 to-gray-700 rounded-lg p-4 text-white">
                    <h3 className="font-semibold mb-3 flex items-center gap-2">
                      <Calendar className="w-5 h-5" />
                      Follow-up Schedule
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="bg-white/10 backdrop-blur rounded-lg p-3">
                        <p className="text-white/70 text-sm mb-1">Next Visit</p>
                        <p className="font-semibold">{reportData.care_plan_summary.follow_up_schedule.next_visit}</p>
                      </div>
                      <div className="bg-white/10 backdrop-blur rounded-lg p-3">
                        <p className="text-white/70 text-sm mb-1">Monitoring</p>
                        <p className="font-semibold text-sm">{reportData.care_plan_summary.follow_up_schedule.monitoring_plan}</p>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Diagnostic Plan */}
      {reportData.diagnostic_plan && (reportData.diagnostic_plan.laboratory?.length > 0 || reportData.diagnostic_plan.screening?.length > 0) && (
        <motion.div 
          className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl p-6 text-white"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
            <TestTube className="w-6 h-6" />
            Diagnostic Tests Ordered
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {reportData.diagnostic_plan.laboratory?.map((test: any, idx: number) => (
              <div key={idx} className="bg-white/10 backdrop-blur rounded-lg p-3">
                <p className="font-medium mb-1">{test.test}</p>
                <p className="text-sm text-white/80">{test.rationale}</p>
              </div>
            ))}
            {reportData.diagnostic_plan.screening?.map((test: string, idx: number) => (
              <div key={idx} className="bg-white/10 backdrop-blur rounded-lg p-3">
                <p className="font-medium flex items-center gap-2">
                  <Eye className="w-4 h-4" />
                  {test}
                </p>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
};