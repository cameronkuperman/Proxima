'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { 
  Zap, 
  FileText, 
  Calendar,
  AlertTriangle,
  CheckCircle,
  ArrowRight,
  Clock,
  Stethoscope,
  TestTube,
  Shield,
  TrendingUp
} from 'lucide-react';
import { DiagnosticTest, ContingentTest } from '@/types/reports';

interface ActionableSummaryProps {
  reportData: any;
  specialty: string;
  onScheduleAppointment?: () => void;
  className?: string;
}

export const ActionableSummary: React.FC<ActionableSummaryProps> = ({
  reportData,
  specialty,
  onScheduleAppointment,
  className = ''
}) => {
  const urgentTests = reportData.diagnostic_priorities?.immediate || [];
  const shortTermTests = reportData.diagnostic_priorities?.short_term || [];
  const keyFindings = reportData.executive_summary?.key_findings || [];
  const redFlags = reportData.follow_up_plan?.red_flags || [];
  const nextSteps = reportData.follow_up_plan?.next_steps || [];

  const formatSpecialtyName = (spec: string) => {
    return spec.split('-').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  return (
    <div className={`grid grid-cols-1 md:grid-cols-3 gap-4 ${className}`}>
      {/* Immediate Actions Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-red-50 to-orange-50 rounded-xl p-6 border-2 border-red-200"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-red-100 rounded-lg">
            <Zap className="w-6 h-6 text-red-600" />
          </div>
          <h3 className="text-lg font-bold text-red-900">Do This First</h3>
        </div>

        {urgentTests.length > 0 ? (
          <ul className="space-y-3">
            {urgentTests.slice(0, 3).map((test: DiagnosticTest, idx: number) => (
              <li key={idx} className="flex items-start gap-2">
                <TestTube className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-red-900">{test.test}</p>
                  <p className="text-sm text-red-700">{test.timing}</p>
                </div>
              </li>
            ))}
          </ul>
        ) : reportData.treatment_recommendations?.immediate_medical_therapy?.length > 0 ? (
          <ul className="space-y-3">
            {reportData.treatment_recommendations.immediate_medical_therapy.slice(0, 2).map((med: any, idx: number) => (
              <li key={idx} className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-red-900">{med.medication}</p>
                  <p className="text-sm text-red-700">Start immediately</p>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-red-800">No immediate actions required</p>
        )}

        {urgentTests.length > 3 && (
          <p className="text-sm text-red-700 mt-3">+{urgentTests.length - 3} more urgent tests</p>
        )}
      </motion.div>

      {/* Key Findings Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border-2 border-blue-200"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-blue-100 rounded-lg">
            <FileText className="w-6 h-6 text-blue-600" />
          </div>
          <h3 className="text-lg font-bold text-blue-900">Key Findings</h3>
        </div>

        {keyFindings.length > 0 ? (
          <ul className="space-y-2">
            {keyFindings.slice(0, 3).map((finding: string, idx: number) => (
              <li key={idx} className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                <p className="text-blue-800 text-sm">{finding}</p>
              </li>
            ))}
          </ul>
        ) : redFlags.length > 0 ? (
          <div>
            <p className="text-blue-900 font-medium mb-2">Watch for these signs:</p>
            <ul className="space-y-2">
              {redFlags.slice(0, 3).map((flag: string, idx: number) => (
                <li key={idx} className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-orange-600 flex-shrink-0 mt-0.5" />
                  <p className="text-blue-800 text-sm">{flag}</p>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <p className="text-blue-800">Analysis complete - see full report for details</p>
        )}
      </motion.div>

      {/* Next Steps Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border-2 border-green-200"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-green-100 rounded-lg">
            <Calendar className="w-6 h-6 text-green-600" />
          </div>
          <h3 className="text-lg font-bold text-green-900">Next Steps</h3>
        </div>

        <div className="space-y-3">
          {reportData.follow_up_plan?.timing && (
            <div className="flex items-center gap-2 text-green-800">
              <Clock className="w-4 h-4 text-green-600" />
              <p className="font-medium">{reportData.follow_up_plan.timing}</p>
            </div>
          )}

          <button
            onClick={onScheduleAppointment}
            className="w-full px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
          >
            <Stethoscope className="w-4 h-4" />
            Schedule {formatSpecialtyName(specialty)} Visit
            <ArrowRight className="w-4 h-4" />
          </button>

          {nextSteps.length > 0 && (
            <div className="pt-2">
              <p className="text-sm text-green-700 font-medium mb-1">Before your visit:</p>
              <ul className="space-y-1">
                {nextSteps.slice(0, 2).map((step: string, idx: number) => (
                  <li key={idx} className="text-sm text-green-700">• {step}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </motion.div>

      {/* Monitoring Priority Banner */}
      {reportData.follow_up_plan?.monitoring_parameters?.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="md:col-span-3 bg-purple-50 border border-purple-200 rounded-lg p-4"
        >
          <div className="flex items-start gap-3">
            <TrendingUp className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-purple-900 mb-1">Track These Symptoms</h4>
              <div className="flex flex-wrap gap-2">
                {reportData.follow_up_plan.monitoring_parameters.map((param: string, idx: number) => (
                  <span
                    key={idx}
                    className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm"
                  >
                    {param}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};