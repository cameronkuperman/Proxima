'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FileText, 
  Heart, 
  Brain, 
  Activity, 
  AlertCircle, 
  CheckCircle,
  ChevronDown,
  ChevronRight,
  Target,
  TrendingUp,
  Shield,
  Calendar,
  User,
  Stethoscope,
  Clipboard,
  Eye,
  Copy,
  Check
} from 'lucide-react';

interface ComprehensiveReportProps {
  report: any;
}

export const ComprehensiveReport: React.FC<ComprehensiveReportProps> = ({ report }) => {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['summary']));
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  
  console.log('📋 ComprehensiveReport - Received report:', report);
  console.log('📋 ComprehensiveReport - Report.report_data:', report?.report_data);
  
  const data = report?.report_data;
  
  if (!report) {
    return (
      <div className="p-8 text-center">
        <FileText className="w-16 h-16 mx-auto mb-4 opacity-50 text-gray-400" />
        <h3 className="text-lg font-medium mb-2 text-gray-600">No Report Available</h3>
        <p className="text-sm text-gray-500">The report data could not be loaded.</p>
      </div>
    );
  }
  
  if (!data) {
    return (
      <div className="p-8 text-center">
        <FileText className="w-16 h-16 mx-auto mb-4 opacity-50 text-gray-400" />
        <h3 className="text-lg font-medium mb-2 text-gray-600">Empty Report</h3>
        <p className="text-sm text-gray-500">This report contains no data.</p>
      </div>
    );
  }
  
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

  const getSeverityColor = (level: string) => {
    switch (level?.toLowerCase()) {
      case 'high':
      case 'severe':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'moderate':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low':
      case 'mild':
        return 'text-green-600 bg-green-50 border-green-200';
      default:
        return 'text-blue-600 bg-blue-50 border-blue-200';
    }
  };

  const Section = ({ 
    id, 
    title, 
    icon: Icon, 
    children, 
    defaultExpanded = false,
    className = ""
  }: { 
    id: string; 
    title: string; 
    icon: any; 
    children: React.ReactNode; 
    defaultExpanded?: boolean;
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
            <div className="p-3 bg-gradient-to-r from-purple-100 to-blue-100 rounded-lg">
              <Icon className="w-6 h-6 text-purple-600" />
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

  return (
    <div className="space-y-6">
      {/* Executive Summary - Always visible */}
      {data?.executive_summary && (
        <Section id="summary" title="Executive Summary" icon={FileText} defaultExpanded={true}>
          <div className="space-y-6">
            {/* One Page Summary */}
            <div className="prose max-w-none">
              <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Summary</h3>
                <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {data.executive_summary.one_page_summary}
                </p>
              </div>
            </div>

            {/* Chief Complaints */}
            {data.executive_summary.chief_complaints?.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Stethoscope className="w-5 h-5 text-purple-600" />
                  Chief Complaints
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {data.executive_summary.chief_complaints.map((complaint: string, idx: number) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      className="flex items-center gap-3 p-3 bg-purple-50 border border-purple-200 rounded-lg"
                    >
                      <AlertCircle className="w-5 h-5 text-purple-600 flex-shrink-0" />
                      <span className="text-purple-900">{complaint}</span>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* Key Findings */}
            {data.executive_summary.key_findings?.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Eye className="w-5 h-5 text-blue-600" />
                  Key Findings
                </h3>
                <div className="space-y-2">
                  {data.executive_summary.key_findings.map((finding: string, idx: number) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg"
                    >
                      <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700">{finding}</span>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Section>
      )}

      {/* Patient Story */}
      {data?.patient_story && (
        <Section id="story" title="Patient Story & Timeline" icon={Calendar}>
          <div className="space-y-6">
            {/* Symptoms Timeline */}
            {data.patient_story.symptoms_timeline?.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Symptom Progression</h3>
                <div className="relative">
                  <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gray-300"></div>
                  {data.patient_story.symptoms_timeline.map((event: any, idx: number) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      className="relative flex items-start gap-4 mb-6"
                    >
                      <div className="relative z-10 w-16 h-16 bg-white border-2 border-purple-500 rounded-full flex items-center justify-center">
                        <div className="text-center">
                          <div className="text-xs font-bold text-purple-600">{event.severity}/10</div>
                        </div>
                      </div>
                      <div className="flex-1 bg-gray-50 p-4 rounded-lg">
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-semibold text-gray-900">{event.symptom}</h4>
                          <span className="text-sm text-gray-500">{event.date}</span>
                        </div>
                        <p className="text-gray-700">{event.patient_description}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* Pain Patterns */}
            {data.patient_story.pain_patterns && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-red-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-red-900 mb-2 flex items-center gap-2">
                    <Target className="w-5 h-5" />
                    Pain Locations
                  </h4>
                  <ul className="space-y-1">
                    {data.patient_story.pain_patterns.locations?.map((location: string, idx: number) => (
                      <li key={idx} className="text-red-700 flex items-center gap-2">
                        <span className="w-2 h-2 bg-red-400 rounded-full"></span>
                        {location}
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-yellow-900 mb-2 flex items-center gap-2">
                    <Activity className="w-5 h-5" />
                    Triggers
                  </h4>
                  <ul className="space-y-1">
                    {data.patient_story.pain_patterns.triggers?.map((trigger: string, idx: number) => (
                      <li key={idx} className="text-yellow-700 flex items-center gap-2">
                        <span className="w-2 h-2 bg-yellow-400 rounded-full"></span>
                        {trigger}
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div className="bg-green-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-green-900 mb-2 flex items-center gap-2">
                    <Shield className="w-5 h-5" />
                    Relievers
                  </h4>
                  <ul className="space-y-1">
                    {data.patient_story.pain_patterns.relievers?.map((reliever: string, idx: number) => (
                      <li key={idx} className="text-green-700 flex items-center gap-2">
                        <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                        {reliever}
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    Progression
                  </h4>
                  <p className="text-blue-700">{data.patient_story.pain_patterns.progression}</p>
                </div>
              </div>
            )}
          </div>
        </Section>
      )}

      {/* Medical Analysis */}
      {data?.medical_analysis && (
        <Section id="analysis" title="Medical Analysis" icon={Brain}>
          <div className="space-y-6">
            {/* Conditions Assessed */}
            {data.medical_analysis.conditions_assessed?.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Potential Conditions</h3>
                <div className="space-y-4">
                  {data.medical_analysis.conditions_assessed.map((condition: any, idx: number) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      className="border border-gray-200 rounded-lg p-4"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-semibold text-gray-900">{condition.condition}</h4>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                          condition.likelihood === 'Very likely' ? 'bg-red-100 text-red-700' :
                          condition.likelihood === 'Likely' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-green-100 text-green-700'
                        }`}>
                          {condition.likelihood}
                        </span>
                      </div>
                      
                      {condition.supporting_evidence?.length > 0 && (
                        <div className="mt-3">
                          <p className="text-sm font-medium text-gray-600 mb-2">Supporting Evidence:</p>
                          <ul className="space-y-1">
                            {condition.supporting_evidence.map((evidence: string, evidIdx: number) => (
                              <li key={evidIdx} className="text-sm text-gray-600 flex items-start gap-2">
                                <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                                {evidence}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* Risk Factors */}
            {data.medical_analysis.risk_factors?.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-orange-600" />
                  Risk Factors
                </h3>
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                  <ul className="space-y-2">
                    {data.medical_analysis.risk_factors.map((risk: string, idx: number) => (
                      <li key={idx} className="flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
                        <span className="text-orange-900">{risk}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>
        </Section>
      )}

      {/* Action Plan */}
      {data?.action_plan && (
        <Section id="action" title="Action Plan & Recommendations" icon={Clipboard}>
          <div className="space-y-6">
            {/* Immediate Actions */}
            {data.action_plan.immediate_actions?.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-red-900 mb-3 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5" />
                  Immediate Actions Required
                </h3>
                <ul className="space-y-2">
                  {data.action_plan.immediate_actions.map((action: string, idx: number) => (
                    <motion.li
                      key={idx}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      className="flex items-start gap-3"
                    >
                      <span className="text-red-600 font-bold">{idx + 1}.</span>
                      <span className="text-red-800">{action}</span>
                    </motion.li>
                  ))}
                </ul>
              </div>
            )}

            {/* Other recommendations in grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Diagnostic Tests */}
              {data.action_plan.diagnostic_tests?.length > 0 && (
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-blue-900 mb-3">Recommended Tests</h4>
                  <ul className="space-y-2">
                    {data.action_plan.diagnostic_tests.map((test: string, idx: number) => (
                      <li key={idx} className="flex items-center gap-2 text-blue-700">
                        <Stethoscope className="w-4 h-4" />
                        {test}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Lifestyle Changes */}
              {data.action_plan.lifestyle_changes?.length > 0 && (
                <div className="bg-green-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-green-900 mb-3">Lifestyle Modifications</h4>
                  <ul className="space-y-2">
                    {data.action_plan.lifestyle_changes.map((change: string, idx: number) => (
                      <li key={idx} className="flex items-center gap-2 text-green-700">
                        <Heart className="w-4 h-4" />
                        {change}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Follow-up Timeline */}
            {data.action_plan.follow_up_timeline && (
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <h4 className="font-semibold text-purple-900 mb-2 flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Follow-up Timeline
                </h4>
                <p className="text-purple-700">{data.action_plan.follow_up_timeline}</p>
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
          <span className="text-gray-600">Analysis Confidence Score</span>
          <div className="flex items-center gap-3">
            <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${report.confidence_score}%` }}
                transition={{ duration: 1, delay: 0.5 }}
                className="h-full bg-gradient-to-r from-purple-600 to-blue-600"
              />
            </div>
            <span className="font-semibold text-gray-900">{report.confidence_score}%</span>
          </div>
        </motion.div>
      )}
    </div>
  );
};