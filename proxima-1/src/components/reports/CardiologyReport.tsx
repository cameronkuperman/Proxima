'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Heart, Activity, AlertCircle, ChevronDown, ChevronRight, Stethoscope, FileHeart, Zap, Target, Calendar, Shield, TrendingUp, AlertTriangle } from 'lucide-react';
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

interface CardiologyReportProps {
  data: EnhancedReportData;
  reportId: string;
  generatedAt: string;
  confidenceScore?: number;
  urgencyLevel?: 'routine' | 'urgent' | 'emergent';
  onExport?: () => void;
  onPrint?: () => void;
}

export const CardiologyReport: React.FC<CardiologyReportProps> = ({
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

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Report Header */}
      <ReportHeader
        reportType="Cardiology Specialist Report"
        reportTitle="Cardiology Assessment"
        reportId={reportId}
        generatedAt={generatedAt}
        confidenceScore={confidenceScore}
        urgencyLevel={urgencyLevel}
        specialty="cardiology"
        onExport={onExport}
        onPrint={onPrint}
      />

      {/* Red Flags Alert */}
      {data.follow_up_plan?.red_flags && data.follow_up_plan.red_flags.length > 0 && (
        <RedFlagsAlert
          redFlags={data.follow_up_plan.red_flags}
          recommendedAction={data.follow_up_plan?.next_steps?.[0]}
          recommendedTiming={data.follow_up_plan?.timing}
          specialty="cardiology"
        />
      )}

      {/* Executive Summary */}
      {data.executive_summary && (
        <ExecutiveSummaryCard
          data={data.executive_summary}
          specialty="cardiology"
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
            className="w-full bg-gradient-to-r from-red-50 to-pink-50 p-6 border-b border-red-200 flex items-center justify-between hover:from-red-100 hover:to-pink-100 transition-colors"
          >
            <div className="flex items-center gap-3">
              <Stethoscope className="w-6 h-6 text-red-700" />
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
                  <div className="bg-red-50 rounded-lg p-4">
                    <h3 className="font-semibold text-red-900 mb-2">Chief Complaint</h3>
                    <p className="text-gray-700">{data.clinical_summary.chief_complaint}</p>
                  </div>
                )}

                {data.clinical_summary.presenting_complaints && (
                  <div className="bg-pink-50 rounded-lg p-4">
                    <h3 className="font-semibold text-pink-900 mb-2">Presenting Complaints</h3>
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

              {/* Relevant History */}
              {data.clinical_summary.relevant_history && (
                <div className="bg-blue-50 rounded-lg p-4">
                  <h3 className="font-semibold text-blue-900 mb-2">Relevant Cardiac History</h3>
                  <p className="text-gray-700">{data.clinical_summary.relevant_history}</p>
                </div>
              )}

              {/* Examination Priorities */}
              {data.clinical_summary.examination_priorities && data.clinical_summary.examination_priorities.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wider mb-3">
                    Examination Priorities
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

      {/* Cardiology Assessment */}
      {data.cardiology_assessment && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
        >
          <button
            onClick={() => toggleSection('assessment')}
            className="w-full bg-gradient-to-r from-red-50 to-pink-50 p-6 border-b border-red-200 flex items-center justify-between hover:from-red-100 hover:to-pink-100 transition-colors"
          >
            <div className="flex items-center gap-3">
              <Heart className="w-6 h-6 text-red-700" />
              <h2 className="text-xl font-bold text-gray-900">Cardiology Assessment</h2>
            </div>
            {expandedSections.has('assessment') ? (
              <ChevronDown className="w-5 h-5 text-gray-500" />
            ) : (
              <ChevronRight className="w-5 h-5 text-gray-500" />
            )}
          </button>

          {expandedSections.has('assessment') && (
            <div className="p-6 space-y-6">
              {/* Functional Capacity */}
              {data.cardiology_assessment.functional_capacity && (
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4">
                  <h3 className="font-semibold text-blue-900 mb-3">Functional Capacity</h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center">
                      <p className="text-3xl font-bold text-blue-600">
                        {data.cardiology_assessment.functional_capacity.current}
                      </p>
                      <p className="text-sm text-gray-600">Current</p>
                    </div>
                    <div className="text-center">
                      <p className="text-3xl font-bold text-gray-400">
                        {data.cardiology_assessment.functional_capacity.baseline}
                      </p>
                      <p className="text-sm text-gray-600">Baseline</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-medium text-gray-700">
                        {data.cardiology_assessment.functional_capacity.units}
                      </p>
                      <p className="text-sm text-gray-600">Units</p>
                    </div>
                  </div>
                </div>
              )}

              {/* NYHA Classification */}
              {data.cardiology_assessment.nyha_class && (
                <div className="bg-purple-50 rounded-lg p-4">
                  <h3 className="font-semibold text-purple-900 mb-2">NYHA Classification</h3>
                  <p className="text-2xl font-bold text-purple-700">{data.cardiology_assessment.nyha_class}</p>
                </div>
              )}

              {/* Risk Factors */}
              {data.cardiology_assessment.risk_factors && data.cardiology_assessment.risk_factors.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wider mb-3">
                    Cardiovascular Risk Factors
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {data.cardiology_assessment.risk_factors.map((factor, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1.5 bg-red-100 text-red-800 rounded-full text-sm font-medium"
                      >
                        {factor}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Clinical Scales */}
              {data.cardiology_assessment.clinical_scales && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wider mb-3">
                    Clinical Risk Scores
                  </h3>
                  <ClinicalScales
                    scales={data.cardiology_assessment.clinical_scales}
                    specialty="cardiology"
                  />
                </div>
              )}
            </div>
          )}
        </motion.div>
      )}

      {/* Cardiology Specific Findings */}
      {data.cardiology_specific_findings && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
        >
          <button
            onClick={() => toggleSection('findings')}
            className="w-full bg-gradient-to-r from-red-50 to-pink-50 p-6 border-b border-red-200 flex items-center justify-between hover:from-red-100 hover:to-pink-100 transition-colors"
          >
            <div className="flex items-center gap-3">
              <FileHeart className="w-6 h-6 text-red-700" />
              <h2 className="text-xl font-bold text-gray-900">Cardiac Findings</h2>
            </div>
            {expandedSections.has('findings') ? (
              <ChevronDown className="w-5 h-5 text-gray-500" />
            ) : (
              <ChevronRight className="w-5 h-5 text-gray-500" />
            )}
          </button>

          {expandedSections.has('findings') && (
            <div className="p-6 space-y-6">
              {/* Cardiac Symptoms */}
              {data.cardiology_specific_findings.cardiac_symptoms && Object.keys(data.cardiology_specific_findings.cardiac_symptoms).length > 0 && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Cardiac Symptoms</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {Object.entries(data.cardiology_specific_findings.cardiac_symptoms).map(([symptom, description]) => (
                      <div key={symptom} className="flex items-start gap-3 p-3 bg-red-50 rounded-lg">
                        <Heart className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="font-medium text-gray-900 capitalize">
                            {symptom.replace(/_/g, ' ')}
                          </p>
                          <p className="text-sm text-gray-700">{description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Examination Findings */}
              {data.cardiology_specific_findings.examination_findings && Object.keys(data.cardiology_specific_findings.examination_findings).length > 0 && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Examination Findings</h3>
                  <div className="space-y-2">
                    {Object.entries(data.cardiology_specific_findings.examination_findings).map(([finding, value]) => (
                      <div key={finding} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                        <span className="font-medium text-gray-700 capitalize">
                          {finding.replace(/_/g, ' ')}
                        </span>
                        <span className="text-gray-900">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ECG Interpretation */}
              {data.cardiology_specific_findings.ecg_interpretation && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <Zap className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <h3 className="font-semibold text-yellow-900 mb-1">ECG Interpretation</h3>
                      <p className="text-gray-700">{data.cardiology_specific_findings.ecg_interpretation}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Imaging Recommendations */}
              {data.cardiology_specific_findings.imaging_recommendations && data.cardiology_specific_findings.imaging_recommendations.length > 0 && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Recommended Imaging Studies</h3>
                  <div className="space-y-2">
                    {data.cardiology_specific_findings.imaging_recommendations.map((imaging, idx) => (
                      <div key={idx} className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
                        <Activity className="w-5 h-5 text-blue-600" />
                        <span className="text-gray-700">{imaging}</span>
                      </div>
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
          specialty="cardiology"
        />
      )}

      {/* Risk Stratification (Legacy) */}
      {data.cardiology_specific?.risk_stratification && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
        >
          <div className="bg-gradient-to-r from-orange-50 to-red-50 p-6 border-b border-orange-200">
            <div className="flex items-center gap-3">
              <Shield className="w-6 h-6 text-orange-700" />
              <h2 className="text-xl font-bold text-gray-900">Risk Stratification</h2>
            </div>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {data.cardiology_specific.risk_stratification.ascvd_risk && (
                <div className="text-center p-4 bg-gradient-to-b from-red-50 to-red-100 rounded-lg">
                  <AlertTriangle className="w-8 h-8 text-red-600 mx-auto mb-2" />
                  <h4 className="font-semibold text-gray-900 mb-1">ASCVD Risk</h4>
                  <p className="text-2xl font-bold text-red-700">
                    {data.cardiology_specific.risk_stratification.ascvd_risk}
                  </p>
                </div>
              )}
              {data.cardiology_specific.risk_stratification.heart_failure_risk && (
                <div className="text-center p-4 bg-gradient-to-b from-purple-50 to-purple-100 rounded-lg">
                  <Heart className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                  <h4 className="font-semibold text-gray-900 mb-1">Heart Failure Risk</h4>
                  <p className="text-2xl font-bold text-purple-700">
                    {data.cardiology_specific.risk_stratification.heart_failure_risk}
                  </p>
                </div>
              )}
              {data.cardiology_specific.risk_stratification.arrhythmia_risk && (
                <div className="text-center p-4 bg-gradient-to-b from-yellow-50 to-yellow-100 rounded-lg">
                  <Zap className="w-8 h-8 text-yellow-600 mx-auto mb-2" />
                  <h4 className="font-semibold text-gray-900 mb-1">Arrhythmia Risk</h4>
                  <p className="text-2xl font-bold text-yellow-700">
                    {data.cardiology_specific.risk_stratification.arrhythmia_risk}
                  </p>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}

      {/* Diagnostic Priorities */}
      {data.diagnostic_priorities && (
        <DiagnosticPriorities 
          immediate={data.diagnostic_priorities.immediate}
          shortTerm={data.diagnostic_priorities.short_term}
          contingent={data.diagnostic_priorities.contingent}
        />
      )}

      {/* Treatment Recommendations */}
      {data.treatment_recommendations && (
        <TreatmentPlan 
          specialty="cardiology"
          immediateTherapy={data.treatment_recommendations.immediate_medical_therapy}
          lifestyleInterventions={data.treatment_recommendations.lifestyle_interventions}
          preventiveMeasures={data.treatment_recommendations.preventive_measures}
        />
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
        <DataQualityNotes 
          completeness={data.data_quality_notes.completeness}
          consistency={data.data_quality_notes.consistency}
          gaps={data.data_quality_notes.gaps}
        />
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
            reasoning="Based on comprehensive cardiac assessment and available clinical data"
            size="lg"
          />
        </motion.div>
      )}
    </div>
  );
};