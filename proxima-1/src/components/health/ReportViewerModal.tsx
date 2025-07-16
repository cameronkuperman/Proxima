import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Download, 
  Share2, 
  Mail, 
  FileText, 
  Calendar,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Clock,
  TrendingUp,
  Stethoscope,
  Camera
} from 'lucide-react';
import { GeneratedReport } from '@/services/reportsService';
import { reportsService } from '@/services/reportsService';

interface ReportViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  report: GeneratedReport | null;
}

export const ReportViewerModal: React.FC<ReportViewerModalProps> = ({ isOpen, onClose, report }) => {
  useEffect(() => {
    if (isOpen && report) {
      // Mark report as accessed
      reportsService.markReportAccessed(report.id);
    }
  }, [isOpen, report]);

  if (!isOpen || !report) return null;

  const getIcon = () => {
    switch (report.report_type) {
      case 'comprehensive':
        return <FileText className="w-6 h-6" />;
      case 'urgent_triage':
        return <AlertCircle className="w-6 h-6" />;
      case 'symptom_timeline':
        return <TrendingUp className="w-6 h-6" />;
      case 'specialist_focused':
        return <Stethoscope className="w-6 h-6" />;
      case 'photo_progression':
        return <Camera className="w-6 h-6" />;
      default:
        return <FileText className="w-6 h-6" />;
    }
  };

  const getTypeColor = () => {
    switch (report.report_type) {
      case 'comprehensive':
        return 'from-purple-600 to-blue-600';
      case 'urgent_triage':
        return 'from-red-600 to-orange-600';
      case 'symptom_timeline':
        return 'from-blue-600 to-cyan-600';
      case 'specialist_focused':
        return 'from-indigo-600 to-purple-600';
      case 'photo_progression':
        return 'from-cyan-600 to-teal-600';
      default:
        return 'from-gray-600 to-gray-700';
    }
  };

  const exportPDF = async () => {
    // TODO: Implement PDF export
    console.log('Exporting PDF...');
  };

  const shareReport = async () => {
    if (navigator.share) {
      await navigator.share({
        title: report.title,
        text: report.executive_summary,
      });
    }
  };

  const emailReport = () => {
    const subject = `Medical Report - ${report.title}`;
    const body = encodeURIComponent(report.executive_summary);
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

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
          className="w-full max-w-5xl max-h-[90vh] backdrop-blur-[30px] bg-[#0a0a0a]/95 
            border border-white/[0.1] rounded-2xl shadow-2xl shadow-purple-500/10 
            flex flex-col overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="relative border-b border-white/[0.05]">
            {/* Gradient background */}
            <div className={`absolute inset-0 bg-gradient-to-r ${getTypeColor()} opacity-5`} />
            
            <div className="relative p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div className={`p-3 bg-gradient-to-r ${getTypeColor()} rounded-xl 
                    shadow-lg shadow-purple-500/20`}>
                    {getIcon()}
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">{report.title}</h2>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-sm text-gray-400">
                        {report.report_type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </span>
                      <span className="text-gray-600">•</span>
                      <span className="text-sm text-gray-400">{formatDate(report.created_at)}</span>
                    </div>
                  </div>
                </div>
                
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={onClose}
                  className="p-2 hover:bg-white/[0.05] rounded-lg transition-all"
                >
                  <X className="w-5 h-5 text-gray-400 hover:text-white" />
                </motion.button>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={exportPDF}
                  className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 
                    hover:from-purple-700 hover:to-blue-700 text-white rounded-lg 
                    transition-all flex items-center gap-2 text-sm font-medium"
                >
                  <Download className="w-4 h-4" />
                  Export PDF
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={shareReport}
                  className="px-4 py-2 bg-white/[0.05] border border-white/[0.1] 
                    hover:bg-white/[0.1] hover:border-white/[0.2] text-white rounded-lg 
                    transition-all flex items-center gap-2 text-sm"
                >
                  <Share2 className="w-4 h-4" />
                  Share
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={emailReport}
                  className="px-4 py-2 bg-white/[0.05] border border-white/[0.1] 
                    hover:bg-white/[0.1] hover:border-white/[0.2] text-white rounded-lg 
                    transition-all flex items-center gap-2 text-sm"
                >
                  <Mail className="w-4 h-4" />
                  Email
                </motion.button>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {/* Urgent Warning for Triage Reports */}
            {report.report_type === 'urgent_triage' && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 p-6 bg-gradient-to-r from-red-600/20 to-orange-600/20 
                  border border-red-500/30 rounded-xl"
              >
                <div className="flex items-start gap-4">
                  <div className="p-2 bg-red-500/20 rounded-lg">
                    <AlertCircle className="w-6 h-6 text-red-400" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-red-300 mb-2">Urgent Medical Attention Required</h3>
                    <p className="text-red-200">
                      {report.report_data.triage_recommendation || 'Seek immediate medical evaluation'}
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Executive Summary */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <div className="w-1 h-5 bg-gradient-to-b from-purple-500 to-blue-500 rounded-full" />
                Executive Summary
              </h3>
              <div className="backdrop-blur-[20px] bg-white/[0.03] border border-white/[0.05] 
                rounded-xl p-6">
                <p className="text-gray-300 leading-relaxed">{report.executive_summary}</p>
              </div>
            </div>

            {/* Confidence Score */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-medium text-gray-400">Analysis Confidence</h4>
                <span className="text-sm text-gray-400">{report.confidence_score}%</span>
              </div>
              <div className="h-2 bg-white/[0.05] rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${report.confidence_score}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                  className={`h-full bg-gradient-to-r ${
                    report.confidence_score >= 80 ? 'from-green-500 to-emerald-500' :
                    report.confidence_score >= 60 ? 'from-yellow-500 to-orange-500' :
                    'from-red-500 to-orange-500'
                  }`}
                />
              </div>
            </div>

            {/* Report-specific content */}
            {report.report_data && (
              <div className="space-y-8">
                {/* Pattern Analysis */}
                {report.report_data.pattern_analysis && (
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                      <div className="w-1 h-5 bg-gradient-to-b from-purple-500 to-pink-500 rounded-full" />
                      Pattern Analysis
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {report.report_data.pattern_analysis.correlations?.map((correlation: any, index: number) => (
                        <motion.div
                          key={`correlation-${index}-${correlation.factor?.substring(0, 10)}`}
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: index * 0.1 }}
                          className="p-4 backdrop-blur-[20px] bg-white/[0.03] border border-white/[0.05] rounded-lg"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="text-white font-medium">{correlation.factor}</h4>
                            <span className="text-sm px-2 py-1 bg-purple-500/20 text-purple-300 rounded-full">
                              {correlation.strength}% correlation
                            </span>
                          </div>
                          <p className="text-sm text-gray-400">{correlation.description}</p>
                        </motion.div>
                      ))}
                      
                      {report.report_data.pattern_analysis.triggers?.map((trigger: any, index: number) => (
                        <motion.div
                          key={`trigger-${index}-${trigger.name?.substring(0, 10)}`}
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: (index + 2) * 0.1 }}
                          className="p-4 backdrop-blur-[20px] bg-orange-500/5 border border-orange-500/20 rounded-lg"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="text-white font-medium">{trigger.name}</h4>
                            <span className="text-sm px-2 py-1 bg-orange-500/20 text-orange-300 rounded-full">
                              {trigger.frequency}
                            </span>
                          </div>
                          <p className="text-sm text-gray-400">{trigger.impact}</p>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Symptom Timeline */}
                {report.report_data.symptom_timeline && (
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                      <div className="w-1 h-5 bg-gradient-to-b from-blue-500 to-cyan-500 rounded-full" />
                      Symptom Progression
                    </h3>
                    <div className="p-6 backdrop-blur-[20px] bg-white/[0.03] border border-white/[0.05] rounded-xl">
                      <div className="space-y-4">
                        {report.report_data.symptom_timeline.events?.map((event: any, index: number) => (
                          <motion.div
                            key={`timeline-${index}-${event.date}`}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="flex items-start gap-4 p-3 bg-white/[0.02] rounded-lg"
                          >
                            <div className="flex flex-col items-center">
                              <div className={`w-3 h-3 rounded-full ${
                                event.severity >= 7 ? 'bg-red-500' :
                                event.severity >= 4 ? 'bg-yellow-500' : 'bg-green-500'
                              }`} />
                              <div className="w-px h-8 bg-white/10 mt-2" />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-sm text-gray-400">{event.date}</span>
                                <span className="text-sm font-medium text-white">Severity: {event.severity}/10</span>
                              </div>
                              <p className="text-gray-300">{event.notes}</p>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Key Findings */}
                {report.report_data.key_findings && (
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                      <div className="w-1 h-5 bg-gradient-to-b from-blue-500 to-cyan-500 rounded-full" />
                      Key Findings
                    </h3>
                    <div className="space-y-3">
                      {report.report_data.key_findings.map((finding: string, index: number) => (
                        <motion.div
                          key={`finding-${index}-${finding.substring(0, 20)}`}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="flex items-start gap-3 p-4 backdrop-blur-[20px] bg-white/[0.03] 
                            border border-white/[0.05] rounded-lg"
                        >
                          <div className="w-2 h-2 bg-blue-400 rounded-full mt-1.5 flex-shrink-0" />
                          <p className="text-gray-300">{finding}</p>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Treatment Effectiveness */}
                {report.report_data.treatment_analysis && (
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                      <div className="w-1 h-5 bg-gradient-to-b from-indigo-500 to-purple-500 rounded-full" />
                      Treatment Effectiveness
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {report.report_data.treatment_analysis.interventions?.map((treatment: any, index: number) => (
                        <motion.div
                          key={`treatment-${index}-${treatment.name?.substring(0, 10)}`}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="p-4 backdrop-blur-[20px] bg-white/[0.03] border border-white/[0.05] rounded-lg"
                        >
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="text-white font-medium">{treatment.name}</h4>
                            <div className="flex items-center gap-2">
                              <div className={`w-3 h-3 rounded-full ${
                                treatment.effectiveness >= 80 ? 'bg-green-500' :
                                treatment.effectiveness >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                              }`} />
                              <span className="text-sm text-gray-400">{treatment.effectiveness}%</span>
                            </div>
                          </div>
                          <p className="text-sm text-gray-400 mb-2">{treatment.description}</p>
                          <div className="w-full h-2 bg-white/[0.05] rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${treatment.effectiveness}%` }}
                              transition={{ duration: 1, delay: index * 0.1 }}
                              className={`h-full ${
                                treatment.effectiveness >= 80 ? 'bg-gradient-to-r from-green-500 to-emerald-500' :
                                treatment.effectiveness >= 60 ? 'bg-gradient-to-r from-yellow-500 to-orange-500' :
                                'bg-gradient-to-r from-red-500 to-orange-500'
                              }`}
                            />
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Recommendations */}
                {report.report_data.recommendations && (
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                      <div className="w-1 h-5 bg-gradient-to-b from-green-500 to-emerald-500 rounded-full" />
                      Recommendations
                    </h3>
                    <div className="space-y-3">
                      {report.report_data.recommendations.map((rec: any, index: number) => (
                        <motion.div
                          key={`rec-${index}-${typeof rec === 'string' ? rec.substring(0, 20) : rec.action?.substring(0, 20)}`}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="flex items-start gap-3 p-4 backdrop-blur-[20px] bg-white/[0.03] 
                            border border-white/[0.05] rounded-lg group hover:border-white/[0.1] 
                            transition-all cursor-pointer"
                        >
                          <div className="w-6 h-6 bg-green-500/20 rounded-lg flex items-center 
                            justify-center flex-shrink-0 group-hover:bg-green-500/30 transition-all">
                            <ChevronRight className="w-4 h-4 text-green-400" />
                          </div>
                          <div className="flex-1">
                            {typeof rec === 'string' ? (
                              <p className="text-gray-300">{rec}</p>
                            ) : (
                              <>
                                <h4 className="text-white font-medium mb-1">{rec.action}</h4>
                                <p className="text-sm text-gray-400 mb-2">{rec.rationale}</p>
                                {rec.priority && (
                                  <span className={`text-xs px-2 py-1 rounded-full ${
                                    rec.priority === 'high' ? 'bg-red-500/20 text-red-300' :
                                    rec.priority === 'medium' ? 'bg-yellow-500/20 text-yellow-300' :
                                    'bg-green-500/20 text-green-300'
                                  }`}>
                                    {rec.priority} priority
                                  </span>
                                )}
                              </>
                            )}
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Red Flags (for urgent reports) */}
                {report.report_data.red_flags && report.report_data.red_flags.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                      <div className="w-1 h-5 bg-gradient-to-b from-red-500 to-orange-500 rounded-full" />
                      Warning Signs
                    </h3>
                    <div className="space-y-3">
                      {report.report_data.red_flags.map((flag: string, index: number) => (
                        <motion.div
                          key={`flag-${index}-${flag.substring(0, 20)}`}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="flex items-start gap-3 p-4 bg-red-500/10 border border-red-500/20 
                            rounded-lg"
                        >
                          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                          <p className="text-red-200">{flag}</p>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Source Data */}
            {report.source_data && (
              <div className="mt-8 pt-8 border-t border-white/[0.05]">
                <h4 className="text-sm font-medium text-gray-400 mb-3">Data Sources</h4>
                <div className="flex flex-wrap gap-2">
                  {report.source_data.quick_scan_ids?.map((id, index) => (
                    <span key={`qs-${id}-${index}`} className="px-3 py-1 bg-purple-500/10 border border-purple-500/20 
                      rounded-full text-xs text-purple-300">
                      Quick Scan
                    </span>
                  ))}
                  {report.source_data.deep_dive_ids?.map((id, index) => (
                    <span key={`dd-${id}-${index}`} className="px-3 py-1 bg-blue-500/10 border border-blue-500/20 
                      rounded-full text-xs text-blue-300">
                      Deep Dive
                    </span>
                  ))}
                  {report.source_data.photo_session_ids?.map((id, index) => (
                    <span key={`ps-${id}-${index}`} className="px-3 py-1 bg-cyan-500/10 border border-cyan-500/20 
                      rounded-full text-xs text-cyan-300">
                      Photo Session
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};