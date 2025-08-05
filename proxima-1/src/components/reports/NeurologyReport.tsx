'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Brain, AlertTriangle, ChevronDown, ChevronRight, Activity, Clock, Zap, Target, Calendar, TrendingUp, AlertCircle, ThermometerSun, Eye } from 'lucide-react';
import { EnhancedReportData } from '@/types/reports';
import { ReportHeader } from './common/ReportHeader';
import { ExecutiveSummaryCard } from './common/ExecutiveSummaryCard';
import { RedFlagsAlert } from './common/RedFlagsAlert';
import { ClinicalScales } from './ClinicalScales';
import { PatternAnalysisCard } from './common/PatternAnalysisCard';
import { ConfidenceIndicator } from './common/ConfidenceIndicator';
import { DiagnosticPriorities } from './DiagnosticPriorities';
import { TreatmentPlan } from './TreatmentPlan';
import { DataQualityNotes } from './DataQualityNotes';

interface NeurologyReportProps {
  data: EnhancedReportData;
  reportId: string;
  generatedAt: string;
  confidenceScore?: number;
  urgencyLevel?: string;
  onExport?: () => void;
  onPrint?: () => void;
}

export const NeurologyReport: React.FC<NeurologyReportProps> = ({
  data,
  reportId,
  generatedAt,
  confidenceScore,
  urgencyLevel,
  onExport,
  onPrint
}) => {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set([
    'clinical-summary',
    'assessment',
    'findings'
  ]));

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  // Extract red flags from neurology specific findings or follow-up plan
  const redFlags = data.neurology_specific_findings?.red_flags || data.follow_up_plan?.red_flags || [];

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Report Header */}
      <ReportHeader
        reportType="Neurology Specialist Report"
        reportId={reportId}
        generatedAt={generatedAt}
        confidenceScore={confidenceScore}
        urgencyLevel={urgencyLevel}
        specialty="neurology"
        onExport={onExport}
        onPrint={onPrint}
      />

      {/* Red Flags Alert */}
      {redFlags.length > 0 && (
        <RedFlagsAlert
          redFlags={redFlags}
          recommendedAction={data.follow_up_plan?.next_steps?.[0]}
          recommendedTiming={data.follow_up_plan?.timing}
          specialty="neurology"
        />
      )}

      {/* Executive Summary */}
      {data.executive_summary && (
        <ExecutiveSummaryCard
          data={data.executive_summary}
          specialty="neurology"
        />
      )}

      {/* Clinical Summary Section */}
      {data.clinical_summary && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
        >
          <button
            onClick={() => toggleSection('clinical-summary')}
            className="w-full bg-gradient-to-r from-purple-50 to-indigo-50 p-6 border-b border-purple-200 flex items-center justify-between hover:from-purple-100 hover:to-indigo-100 transition-colors"
          >
            <div className="flex items-center gap-3">
              <Brain className="w-6 h-6 text-purple-700" />
              <h2 className="text-xl font-bold text-gray-900">Clinical Summary</h2>
            </div>
            {expandedSections.has('clinical-summary') ? (
              <ChevronDown className="w-5 h-5 text-gray-500" />
            ) : (
              <ChevronRight className="w-5 h-5 text-gray-500" />
            )}
          </button>

          {expandedSections.has('clinical-summary') && (
            <div className="p-6 space-y-6">
              {/* Chief Complaint & HPI */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {data.clinical_summary.chief_complaint && (
                  <div className="bg-purple-50 rounded-lg p-4">
                    <h3 className="font-semibold text-purple-900 mb-2">Chief Complaint</h3>
                    <p className="text-gray-700">{data.clinical_summary.chief_complaint}</p>
                  </div>
                )}

                {data.clinical_summary.presenting_complaints && (
                  <div className="bg-indigo-50 rounded-lg p-4">
                    <h3 className="font-semibold text-indigo-900 mb-2">Presenting Complaints</h3>
                    <p className="text-gray-700">{data.clinical_summary.presenting_complaints}</p>
                  </div>
                )}
              </div>

              {data.clinical_summary.hpi && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-2">History of Present Illness</h3>
                  <p className="text-gray-700 whitespace-pre-wrap">{data.clinical_summary.hpi}</p>
                </div>
              )}

              {/* Symptom Timeline */}
              {data.clinical_summary.symptom_timeline && data.clinical_summary.symptom_timeline.length > 0 && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Symptom Timeline</h3>
                  <div className="space-y-3">
                    {data.clinical_summary.symptom_timeline.map((entry, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        className="relative pl-8 pb-3 border-l-2 border-purple-200 last:border-l-0"
                      >
                        <div className="absolute -left-2 top-0 w-4 h-4 bg-purple-500 rounded-full" />
                        <div className="bg-purple-50 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-purple-700">{entry.date}</span>
                            {entry.severity && (
                              <span className={`text-sm font-medium px-2 py-1 rounded-full ${
                                entry.severity >= 8 ? 'bg-red-100 text-red-700' :
                                entry.severity >= 5 ? 'bg-yellow-100 text-yellow-700' :
                                'bg-green-100 text-green-700'
                              }`}>
                                Severity: {entry.severity}/10
                              </span>
                            )}
                          </div>
                          <p className="text-gray-700 mb-1">{entry.symptoms}</p>
                          {entry.context && (
                            <p className="text-sm text-gray-600 italic">Context: {entry.context}</p>
                          )}
                          {entry.duration && (
                            <p className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                              <Clock className="w-3 h-3" />
                              Duration: {entry.duration}
                            </p>
                          )}
                          {entry.resolution && (
                            <p className="text-sm text-green-700 mt-1">Resolution: {entry.resolution}</p>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {/* Relevant History */}
              {data.clinical_summary.relevant_history && (
                <div className="bg-blue-50 rounded-lg p-4">
                  <h3 className="font-semibold text-blue-900 mb-2">Relevant Neurological History</h3>
                  <p className="text-gray-700">{data.clinical_summary.relevant_history}</p>
                </div>
              )}

              {/* Examination Priorities */}
              {data.clinical_summary.examination_priorities && data.clinical_summary.examination_priorities.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wider mb-3">
                    Neurological Examination Priorities
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {data.clinical_summary.examination_priorities.map((priority, idx) => (
                      <div key={idx} className="flex items-center gap-2 p-3 bg-indigo-50 rounded-lg">
                        <Target className="w-5 h-5 text-indigo-600" />
                        <span className="text-gray-700">{priority}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </motion.div>
      )}

      {/* Neurology Assessment */}
      {data.neurology_assessment && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
        >
          <button
            onClick={() => toggleSection('assessment')}
            className="w-full bg-gradient-to-r from-purple-50 to-indigo-50 p-6 border-b border-purple-200 flex items-center justify-between hover:from-purple-100 hover:to-indigo-100 transition-colors"
          >
            <div className="flex items-center gap-3">
              <Brain className="w-6 h-6 text-purple-700" />
              <h2 className="text-xl font-bold text-gray-900">Neurology Assessment</h2>
            </div>
            {expandedSections.has('assessment') ? (
              <ChevronDown className="w-5 h-5 text-gray-500" />
            ) : (
              <ChevronRight className="w-5 h-5 text-gray-500" />
            )}
          </button>

          {expandedSections.has('assessment') && (
            <div className="p-6 space-y-6">
              {/* Headache Pattern */}
              {data.neurology_assessment.headache_pattern && (
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-4">
                  <h3 className="font-semibold text-purple-900 mb-3 flex items-center gap-2">
                    <ThermometerSun className="w-5 h-5" />
                    Headache Pattern Analysis
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Type</p>
                      <p className="font-semibold text-gray-900">{data.neurology_assessment.headache_pattern.type}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Frequency</p>
                      <p className="font-semibold text-gray-900">{data.neurology_assessment.headache_pattern.frequency}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Duration</p>
                      <p className="font-semibold text-gray-900">{data.neurology_assessment.headache_pattern.duration}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Characteristics</p>
                      <div className="flex flex-wrap gap-1">
                        {data.neurology_assessment.headache_pattern.characteristics?.map((char, idx) => (
                          <span key={idx} className="text-xs px-2 py-1 bg-purple-100 text-purple-700 rounded-full">
                            {char}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Neurological Deficits */}
              {data.neurology_assessment.neurological_deficits && data.neurology_assessment.neurological_deficits.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-red-600" />
                    Neurological Deficits Identified
                  </h3>
                  <div className="space-y-2">
                    {data.neurology_assessment.neurological_deficits.map((deficit, idx) => (
                      <div key={idx} className="flex items-start gap-3 p-3 bg-red-50 rounded-lg border border-red-200">
                        <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                        <span className="text-gray-700">{deficit}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Clinical Scales */}
              {data.neurology_assessment.clinical_scales && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wider mb-3">
                    Neurological Assessment Scales
                  </h3>
                  <ClinicalScales
                    scales={data.neurology_assessment.clinical_scales}
                    specialty="neurology"
                  />
                </div>
              )}
            </div>
          )}
        </motion.div>
      )}

      {/* Neurology Specific Findings */}
      {data.neurology_specific_findings && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
        >
          <button
            onClick={() => toggleSection('findings')}
            className="w-full bg-gradient-to-r from-purple-50 to-indigo-50 p-6 border-b border-purple-200 flex items-center justify-between hover:from-purple-100 hover:to-indigo-100 transition-colors"
          >
            <div className="flex items-center gap-3">
              <Eye className="w-6 h-6 text-purple-700" />
              <h2 className="text-xl font-bold text-gray-900">Neurological Findings</h2>
            </div>
            {expandedSections.has('findings') ? (
              <ChevronDown className="w-5 h-5 text-gray-500" />
            ) : (
              <ChevronRight className="w-5 h-5 text-gray-500" />
            )}
          </button>

          {expandedSections.has('findings') && (
            <div className="p-6 space-y-6">
              {/* Neurological Exam */}
              {data.neurology_specific_findings.neurological_exam && Object.keys(data.neurology_specific_findings.neurological_exam).length > 0 && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Neurological Examination</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {Object.entries(data.neurology_specific_findings.neurological_exam).map(([exam, finding]) => (
                      <div key={exam} className="p-3 bg-purple-50 rounded-lg">
                        <p className="font-medium text-purple-900 capitalize mb-1">
                          {exam.replace(/_/g, ' ')}
                        </p>
                        <p className="text-gray-700 text-sm">{finding}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Differential Considerations */}
              {data.neurology_specific_findings.differential_considerations && data.neurology_specific_findings.differential_considerations.length > 0 && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Differential Diagnosis Considerations</h3>
                  <div className="space-y-2">
                    {data.neurology_specific_findings.differential_considerations.map((consideration, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        className="flex items-start gap-3 p-3 bg-indigo-50 rounded-lg"
                      >
                        <span className="flex-shrink-0 w-6 h-6 bg-indigo-200 text-indigo-700 rounded-full flex items-center justify-center text-sm font-medium">
                          {idx + 1}
                        </span>
                        <span className="text-gray-700">{consideration}</span>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </motion.div>
      )}

      {/* Pattern Analysis */}
      {data.clinical_summary?.pattern_analysis && (
        <PatternAnalysisCard
          data={data.clinical_summary.pattern_analysis}
          specialty="neurology"
        />
      )}

      {/* Diagnostic Priorities */}
      {data.diagnostic_priorities && (
        <DiagnosticPriorities data={data.diagnostic_priorities} specialty="neurology" />
      )}

      {/* Treatment Recommendations */}
      {data.treatment_recommendations && (
        <TreatmentPlan data={data.treatment_recommendations} specialty="neurology" />
      )}

      {/* Follow-up Plan */}
      {data.follow_up_plan && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
        >
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 border-b border-green-200">
            <div className="flex items-center gap-3">
              <Calendar className="w-6 h-6 text-green-700" />
              <h2 className="text-xl font-bold text-gray-900">Follow-up Plan</h2>
            </div>
          </div>
          <div className="p-6 space-y-4">
            {data.follow_up_plan.timing && (
              <div className="bg-green-50 rounded-lg p-4">
                <h3 className="font-semibold text-green-900 mb-1">Recommended Timing</h3>
                <p className="text-gray-700">{data.follow_up_plan.timing}</p>
              </div>
            )}

            {data.follow_up_plan.monitoring_parameters && data.follow_up_plan.monitoring_parameters.length > 0 && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Monitoring Parameters</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {data.follow_up_plan.monitoring_parameters.map((param, idx) => (
                    <div key={idx} className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
                      <Activity className="w-5 h-5 text-blue-600" />
                      <span className="text-gray-700">{param}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {data.follow_up_plan.next_steps && data.follow_up_plan.next_steps.length > 0 && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Next Steps</h3>
                <ol className="space-y-2">
                  {data.follow_up_plan.next_steps.map((step, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <span className="flex-shrink-0 w-6 h-6 bg-green-100 text-green-700 rounded-full flex items-center justify-center text-sm font-medium">
                        {idx + 1}
                      </span>
                      <span className="text-gray-700">{step}</span>
                    </li>
                  ))}
                </ol>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* Data Quality Notes */}
      {data.data_quality_notes && (
        <DataQualityNotes data={data.data_quality_notes} />
      )}

      {/* Confidence Indicator at bottom */}
      {confidenceScore !== undefined && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="flex justify-center pt-6"
        >
          <ConfidenceIndicator
            score={confidenceScore}
            reasoning="Based on comprehensive neurological assessment and available clinical data"
            size="lg"
          />
        </motion.div>
      )}
    </div>
  );
};