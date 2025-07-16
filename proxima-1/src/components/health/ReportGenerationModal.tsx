import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  FileText, 
  Loader2,
  AlertCircle,
  Stethoscope,
  User,
  Zap,
  Clock,
  Brain,
  Camera
} from 'lucide-react';
import { HealthInteraction } from '@/services/healthInteractionsService';
import { useReportGeneration } from '@/hooks/useReportGeneration';
import { ReportViewer } from '@/components/ReportViewer';

interface ReportGenerationModalProps {
  isOpen: boolean;
  onClose: () => void;
  interaction: HealthInteraction | null;
}

export const ReportGenerationModal: React.FC<ReportGenerationModalProps> = ({
  isOpen,
  onClose,
  interaction,
}) => {
  const { isAnalyzing, isGenerating, analysis, report, error, generateReport, reset } = useReportGeneration();
  const [purpose, setPurpose] = useState<string>('symptom_specific');
  const [targetAudience, setTargetAudience] = useState<string>('self');

  const handleGenerateReport = async () => {
    if (!interaction) return;

    const availableData: any = {};
    
    // Determine which IDs to include based on interaction type
    switch (interaction.type) {
      case 'quick_scan':
        availableData.quick_scan_ids = [interaction.id];
        break;
      case 'deep_dive':
        availableData.deep_dive_ids = [interaction.id];
        break;
      case 'photo_session':
        availableData.photo_session_ids = [interaction.id];
        break;
    }

    try {
      await generateReport({
        context: {
          purpose: purpose as any,
          symptom_focus: getSymptomFocus(),
          target_audience: targetAudience as any,
          time_frame: {
            start: interaction.timestamp,
            end: interaction.timestamp,
          }
        },
        available_data: availableData,
      });
    } catch (err) {
      // Error handled by hook
    }
  };

  const getSymptomFocus = () => {
    if (!interaction) return undefined;
    
    switch (interaction.type) {
      case 'quick_scan':
        return (interaction.data as any).symptoms;
      case 'deep_dive':
        return (interaction.data as any).initial_symptoms;
      case 'photo_session':
        return (interaction.data as any).condition_name;
      default:
        return undefined;
    }
  };

  const getInteractionIcon = () => {
    switch (interaction?.type) {
      case 'quick_scan':
        return <Brain className="w-6 h-6" />;
      case 'deep_dive':
        return <FileText className="w-6 h-6" />;
      case 'photo_session':
        return <Camera className="w-6 h-6" />;
      default:
        return <FileText className="w-6 h-6" />;
    }
  };

  const getInteractionTitle = () => {
    if (!interaction) return '';
    
    switch (interaction.type) {
      case 'quick_scan':
        return 'Quick Scan Report';
      case 'deep_dive':
        return 'Deep Dive Analysis Report';
      case 'photo_session':
        return 'Photo Session Report';
      default:
        return 'Health Report';
    }
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  if (!isOpen || !interaction) return null;

  // If report is generated, show the viewer
  if (report) {
    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={handleClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-white rounded-2xl shadow-xl max-w-6xl w-full max-h-[90vh] 
              overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 
              flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">Medical Report</h2>
              <button
                onClick={handleClose}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              <ReportViewer report={report} />
            </div>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    );
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
        onClick={handleClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-white rounded-2xl shadow-xl max-w-2xl w-full"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 text-purple-600 rounded-lg">
                  {getInteractionIcon()}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">{getInteractionTitle()}</h2>
                  <p className="text-sm text-gray-600">
                    {new Date(interaction.timestamp).toLocaleDateString('en-US', {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                      hour: 'numeric',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              </div>
              <button
                onClick={handleClose}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            {/* Interaction Summary */}
            <div className="bg-purple-50 rounded-lg p-4 mb-6">
              <h3 className="font-semibold text-purple-900 mb-2">Session Summary</h3>
              <p className="text-purple-700">{getSymptomFocus()}</p>
              {interaction.type === 'quick_scan' && (
                <div className="mt-2 flex items-center gap-4 text-sm text-purple-600">
                  <span>Body Part: {(interaction.data as any).body_part}</span>
                  <span>•</span>
                  <span>Pain Level: {(interaction.data as any).pain_level}/10</span>
                </div>
              )}
            </div>

            {/* Report Configuration */}
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Report Purpose
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { value: 'symptom_specific', label: 'Symptom Analysis', icon: AlertCircle },
                    { value: 'specialist_referral', label: 'Specialist Referral', icon: Stethoscope },
                    { value: 'annual_checkup', label: 'Checkup Summary', icon: Clock },
                    { value: 'emergency', label: 'Urgent Care', icon: Zap },
                  ].map(option => (
                    <button
                      key={option.value}
                      onClick={() => setPurpose(option.value)}
                      className={`p-3 rounded-lg border-2 transition-all ${
                        purpose === option.value
                          ? 'border-purple-500 bg-purple-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <option.icon className={`w-5 h-5 mx-auto mb-1 ${
                        purpose === option.value ? 'text-purple-600' : 'text-gray-500'
                      }`} />
                      <span className={`text-sm ${
                        purpose === option.value ? 'text-purple-700 font-medium' : 'text-gray-600'
                      }`}>
                        {option.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Who is this report for?
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { value: 'self', label: 'Yourself' },
                    { value: 'primary_care', label: 'Primary Doctor' },
                    { value: 'specialist', label: 'Specialist' },
                    { value: 'emergency', label: 'Emergency Dept' },
                  ].map(option => (
                    <button
                      key={option.value}
                      onClick={() => setTargetAudience(option.value)}
                      className={`p-2 rounded-lg border transition-all ${
                        targetAudience === option.value
                          ? 'border-purple-500 bg-purple-50 text-purple-700 font-medium'
                          : 'border-gray-200 hover:border-gray-300 text-gray-600'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Analysis Result */}
            {analysis && !isGenerating && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-blue-50 rounded-lg p-4 mb-6"
              >
                <h4 className="font-semibold text-blue-900 mb-1">
                  Recommended: {analysis.recommended_type.replace(/_/g, ' ').toUpperCase()}
                </h4>
                <p className="text-sm text-blue-700">{analysis.reasoning}</p>
                <div className="mt-2 text-xs text-blue-600">
                  Confidence: {Math.round(analysis.confidence * 100)}%
                </div>
              </motion.div>
            )}

            {/* Error Message */}
            {error && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6"
              >
                <p className="text-red-700">{error}</p>
              </motion.div>
            )}

            {/* Generate Button */}
            <button
              onClick={handleGenerateReport}
              disabled={isAnalyzing || isGenerating}
              className="w-full py-3 rounded-lg bg-gradient-to-r from-purple-600 
                to-blue-600 hover:from-purple-700 hover:to-blue-700 
                disabled:from-gray-400 disabled:to-gray-500 text-white font-medium 
                transition-all duration-200 flex items-center justify-center gap-2"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Analyzing your data...
                </>
              ) : isGenerating ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Generating report...
                </>
              ) : (
                <>
                  <FileText className="w-5 h-5" />
                  Generate Report
                </>
              )}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};