import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { GeneratedReport } from '@/services/reportsService';
import { reportsService } from '@/services/reportsService';
import { ReportViewer } from '@/components/ReportViewer';

interface ReportViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  report: GeneratedReport | null;
}

export const ReportViewerModal: React.FC<ReportViewerModalProps> = ({ isOpen, onClose, report }) => {
  useEffect(() => {
    if (isOpen && report) {
      console.log('🔍 ReportViewerModal - Original report data:', report);
      console.log('🔍 ReportViewerModal - Report.report_data:', report.report_data);
      // Mark report as accessed
      reportsService.markReportAccessed(report.id);
    }
  }, [isOpen, report]);

  if (!isOpen || !report) return null;

  // Debug logging
  console.log('🔍 ReportViewerModal - Original report data:', report);
  console.log('🔍 ReportViewerModal - report.report_data:', report.report_data);
  console.log('🔍 ReportViewerModal - report structure:', {
    hasReportData: !!report.report_data,
    reportDataType: typeof report.report_data,
    reportDataKeys: report.report_data ? Object.keys(report.report_data) : [],
    fullReport: JSON.stringify(report, null, 2)
  });

  // Handle different report data structures
  let processedReportData;
  
  // Case 1: report_data is a string (might be JSON string from database)
  if (typeof report.report_data === 'string') {
    try {
      processedReportData = JSON.parse(report.report_data);
      console.log('🔍 Parsed report_data from string:', processedReportData);
    } catch (e) {
      console.error('Failed to parse report_data string:', e);
      processedReportData = {};
    }
  }
  // Case 2: report_data is already an object
  else if (report.report_data && typeof report.report_data === 'object') {
    processedReportData = report.report_data;
  }
  // Case 3: report_data is missing, try to construct from top-level fields
  else {
    console.warn('⚠️ report_data is missing, constructing from available fields');
    
    // Create a basic report structure based on report type
    if (report.report_type === 'annual_summary') {
      processedReportData = {
        executive_summary: {
          one_page_summary: report.executive_summary || report.summary || 'Annual health summary generated.',
          year_highlights: ['Health tracking started', 'Reports generated', 'Symptoms monitored'],
          key_findings: report.key_findings || [],
        },
        statistics: {
          total_interactions: 0,
          by_type: {},
          most_affected_areas: []
        },
        pattern_analysis: {
          correlation_patterns: {
            symptom_triggers: ['Data collection in progress']
          }
        }
      };
    } else {
      processedReportData = {
        executive_summary: {
          one_page_summary: report.executive_summary || report.summary || 'Report data is being processed.',
          chief_complaints: report.chief_complaints || [],
          key_findings: report.key_findings || [],
          patterns_identified: report.patterns_identified || [],
          action_items: report.action_items || []
        },
        patient_story: report.patient_story || null,
        medical_analysis: report.medical_analysis || null,
        action_plan: report.action_plan || null,
        pattern_analysis: report.pattern_analysis || null,
        recommendations: report.recommendations || null,
        billing_optimization: report.billing_optimization || null
      };
    }
  }

  // Convert GeneratedReport to the format expected by ReportViewer
  const reportData = {
    report_id: report.id,
    report_type: report.report_type || 'comprehensive',
    generated_at: report.created_at,
    report_data: processedReportData,
    confidence_score: report.confidence_score || report.confidence || 85,
    user_id: report.user_id,
    status: 'success' as const
  };

  console.log('🔍 ReportViewerModal - Transformed report data:', reportData);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="w-full max-w-7xl max-h-[95vh] bg-white dark:bg-gray-900 
            rounded-2xl shadow-2xl flex flex-col overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header with close button */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Medical Report</h2>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-all"
            >
              <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
            </motion.button>
          </div>

          {/* Report Content */}
          <div className="flex-1 overflow-y-auto p-6">
            <ReportViewer report={reportData} />
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};