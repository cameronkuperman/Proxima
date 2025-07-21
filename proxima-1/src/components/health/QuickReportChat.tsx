import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Send, 
  FileText, 
  Calendar,
  Clock,
  Target,
  Sparkles,
  ChevronDown,
  User,
  Bot,
  Loader2,
  Check,
  Brain,
  Zap,
  AlertCircle,
  Camera
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useReportGeneration } from '@/hooks/useReportGeneration';
import { healthInteractionsService, HealthInteraction, QuickScanSession, DeepDiveSession } from '@/services/healthInteractionsService';
import { reportsService, GeneratedReport } from '@/services/reportsService';
import { ReportViewerModal } from './ReportViewerModal';

interface QuickReportChatProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  options?: ReportOption[];
}

interface ReportOption {
  id: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  purpose: 'symptom_specific' | 'annual_checkup' | 'specialist_referral' | 'emergency';
}

const reportOptions: ReportOption[] = [
  {
    id: 'symptom',
    label: 'Track Specific Symptoms',
    description: 'Generate a report focused on particular symptoms or conditions',
    icon: <Target className="w-5 h-5" />,
    purpose: 'symptom_specific',
  },
  {
    id: 'annual',
    label: 'Annual Health Summary',
    description: 'Comprehensive overview of your health over the past year',
    icon: <Calendar className="w-5 h-5" />,
    purpose: 'annual_checkup',
  },
  {
    id: 'specialist',
    label: 'Specialist Referral',
    description: 'Formatted report for medical professionals',
    icon: <FileText className="w-5 h-5" />,
    purpose: 'specialist_referral',
  },
  {
    id: 'recent',
    label: 'Recent Health Events',
    description: 'Summary of your health in the last 30 days',
    icon: <Clock className="w-5 h-5" />,
    purpose: 'annual_checkup', // Changed to auto-generate like annual
  },
];

export const QuickReportChat: React.FC<QuickReportChatProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const { generateReport, isAnalyzing, isGenerating, report, error, reset } = useReportGeneration();
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      role: 'system',
      content: "I'll help you generate a medical report. What type of report would you like to create?",
      timestamp: new Date(),
      options: reportOptions,
    },
  ]);
  const [input, setInput] = useState('');
  const [selectedOption, setSelectedOption] = useState<ReportOption | null>(null);
  const [showOptions, setShowOptions] = useState(true);
  const [healthInteractions, setHealthInteractions] = useState<HealthInteraction[]>([]);
  const [selectedInteractions, setSelectedInteractions] = useState<Set<string>>(new Set());
  const [isLoadingInteractions, setIsLoadingInteractions] = useState(false);
  const [showInteractionSelection, setShowInteractionSelection] = useState(false);
  const [showReportViewer, setShowReportViewer] = useState(false);
  const [viewingReport, setViewingReport] = useState<GeneratedReport | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (report && !isGenerating) {
      // Add success message when report is generated
      const successMessage: ChatMessage = {
        id: Date.now().toString(),
        role: 'assistant',
        content: `✅ Your ${report.report_type.replace('_', ' ')} report has been generated successfully! The report includes ${
          report.report_type === 'annual_summary' ? 'your complete health overview for the year' :
          report.report_type === 'symptom_timeline' ? 'detailed tracking of your symptoms over time' :
          'comprehensive analysis and recommendations'
        }.`,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, successMessage]);
    }
  }, [report, isGenerating]);

  const handleSelectOption = async (option: ReportOption) => {
    setSelectedOption(option);
    setShowOptions(false);

    // Add user selection message
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: option.label,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMessage]);

    // For annual summary and recent events, auto-generate without selection
    if (option.id === 'annual' || option.id === 'recent') {
      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `I'll generate your ${option.label.toLowerCase()} right away by analyzing all your health data from the ${option.id === 'annual' ? 'past year' : 'last 30 days'}.`,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, assistantMessage]);

      // Auto-generate report with proper loading states
      setTimeout(async () => {
        try {
          const timeFrame = option.id === 'annual'
            ? { start: new Date(new Date().getFullYear(), 0, 1).toISOString(), end: new Date().toISOString() }
            : { start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), end: new Date().toISOString() };

          const result = await generateReport({
            user_id: user?.id,
            context: {
              purpose: 'annual_checkup',
              time_frame: timeFrame,
              target_audience: 'self',
            },
          });

          // If report generation successful, save it to reports service
          if (result?.report) {
            const reportId = result.report.report_id || `report-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            const generatedReport: GeneratedReport = {
              id: reportId,
              user_id: user?.id || 'user-123',
              report_type: result.report.report_type,
              title: option.label,
              created_at: new Date().toISOString(),
              executive_summary: result.report.report_data?.executive_summary?.one_page_summary || '',
              confidence_score: result.report.confidence_score || 85,
              source_data: {},
              report_data: result.report.report_data,
              tags: [option.id === 'annual' ? 'annual' : 'recent', 'auto-generated']
            };
            
            // Store the report for viewing
            setViewingReport(generatedReport);
          }
        } catch (err) {
          const errorMessage: ChatMessage = {
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            content: "I encountered an error generating your report. Please try again.",
            timestamp: new Date(),
          };
          setMessages(prev => [...prev, errorMessage]);
        }
      }, 100); // Small delay to show loading state
      return;
    }

    // For symptom-specific and specialist referral, show interaction selection
    setIsLoadingInteractions(true);
    setShowInteractionSelection(true);
    
    try {
      const timeFrame = { startDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) }; // Last 90 days
      
      const interactions = await healthInteractionsService.fetchUserInteractions(
        user?.id || '',
        {
          ...timeFrame,
          types: ['quick_scan', 'deep_dive', 'photo_session']
        }
      );
      
      setHealthInteractions(interactions);
      
      // Add assistant response
      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `I found ${interactions.length} health interactions from your history. Select the ones you'd like to include in your ${option.label.toLowerCase()} report:`,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Failed to fetch health interactions:', error);
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "I couldn't fetch your past health data. Let me generate a report based on the information you provide instead.",
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
      setShowInteractionSelection(false);
    } finally {
      setIsLoadingInteractions(false);
    }
  };

  const toggleInteractionSelection = (interactionId: string) => {
    setSelectedInteractions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(interactionId)) {
        newSet.delete(interactionId);
      } else {
        newSet.add(interactionId);
      }
      return newSet;
    });
  };

  const handleGenerateReport = async () => {
    if (!selectedOption || selectedInteractions.size === 0) return;

    // Add user message about selected interactions
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: `Generate report using ${selectedInteractions.size} selected health interactions`,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMessage]);
    setShowInteractionSelection(false);

    // Separate interaction IDs by type
    const quickScanIds: string[] = [];
    const deepDiveIds: string[] = [];
    const photoSessionIds: string[] = [];
    
    healthInteractions.forEach(interaction => {
      if (selectedInteractions.has(interaction.id)) {
        if (interaction.type === 'quick_scan') {
          quickScanIds.push(interaction.id);
        } else if (interaction.type === 'deep_dive') {
          deepDiveIds.push(interaction.id);
        } else if (interaction.type === 'photo_session') {
          photoSessionIds.push(interaction.id);
        }
      }
    });

    // Generate report based on context and selected interactions
    try {
      const timeFrame = selectedOption.purpose === 'annual_checkup' 
        ? { start: new Date(new Date().getFullYear(), 0, 1).toISOString(), end: new Date().toISOString() }
        : { start: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(), end: new Date().toISOString() };

      const result = await generateReport({
        user_id: user?.id,
        context: {
          purpose: selectedOption.purpose,
          time_frame: timeFrame,
          target_audience: selectedOption.purpose === 'specialist_referral' ? 'specialist' : 'self',
        },
        available_data: {
          quick_scan_ids: quickScanIds,
          deep_dive_ids: deepDiveIds,
          photo_session_ids: photoSessionIds,
        },
      });

      // If report generation successful, save it
      if (result?.report) {
        const reportId = result.report.report_id || `report-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const generatedReport: GeneratedReport = {
          id: reportId,
          user_id: user?.id || 'user-123',
          report_type: result.report.report_type,
          title: `${selectedOption.label} - ${new Date().toLocaleDateString()}`,
          created_at: new Date().toISOString(),
          executive_summary: result.report.report_data?.executive_summary?.one_page_summary || '',
          confidence_score: result.report.confidence_score || 85,
          source_data: {
            quick_scan_ids: quickScanIds,
            deep_dive_ids: deepDiveIds,
            photo_session_ids: photoSessionIds,
          },
          report_data: result.report.report_data,
          tags: [selectedOption.id, 'selected-data']
        };
        
        // Store the report for viewing
        setViewingReport(generatedReport);
      }
    } catch (err) {
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "I encountered an error generating your report. Please try again or contact support if the issue persists.",
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    }
  };

  const handleSendMessage = async () => {
    if (!input.trim() || !selectedOption) return;

    // Add user message
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMessage]);
    setInput('');

    // For now, just acknowledge the message
    const assistantMessage: ChatMessage = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: "Thank you for the additional context. This will be included in your report.",
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, assistantMessage]);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleClose = () => {
    reset();
    setMessages([messages[0]]); // Reset to initial message
    setSelectedOption(null);
    setShowOptions(true);
    setInput('');
    onClose();
  };

  // Disable body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  return (
    <>
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={handleClose}
        >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="w-full max-w-3xl h-[600px] backdrop-blur-[20px] bg-[#0a0a0a]/90 border border-white/[0.05] rounded-2xl shadow-2xl flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-white/[0.05]">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-r from-purple-600/20 to-blue-600/20 rounded-lg">
                <Sparkles className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-white">Generate Medical Report</h2>
                <p className="text-sm text-gray-400">AI-powered report generation</p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="p-2 hover:bg-white/[0.05] rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.map((message) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : ''}`}
              >
                {message.role !== 'user' && (
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 bg-gradient-to-r from-purple-600/20 to-blue-600/20 
                      rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/10">
                      <Bot className="w-5 h-5 text-purple-400" />
                    </div>
                  </div>
                )}
                
                <div className={`flex-1 ${message.role === 'user' ? 'max-w-md' : 'max-w-xl'}`}>
                  <div className={`p-4 rounded-xl ${
                    message.role === 'user' 
                      ? 'bg-gradient-to-r from-purple-600/20 to-blue-600/20 text-white ml-auto' 
                      : 'bg-white/[0.03] border border-white/[0.05] text-gray-300'
                  }`}>
                    <p className="text-sm">{message.content}</p>
                  </div>
                  
                  {/* Report Options */}
                  {message.options && showOptions && (
                    <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                      {message.options.map((option) => (
                        <motion.button
                          key={option.id}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => handleSelectOption(option)}
                          className="p-4 bg-white/[0.03] border border-white/[0.05] rounded-xl hover:border-white/[0.1] transition-all text-left group"
                        >
                          <div className="flex items-start gap-3">
                            <div className="p-2 bg-gradient-to-r from-purple-600/10 to-blue-600/10 rounded-lg group-hover:from-purple-600/20 group-hover:to-blue-600/20 transition-all">
                              {option.icon}
                            </div>
                            <div className="flex-1">
                              <h4 className="text-white font-medium mb-1">{option.label}</h4>
                              <p className="text-xs text-gray-400">{option.description}</p>
                            </div>
                          </div>
                        </motion.button>
                      ))}
                    </div>
                  )}
                </div>

                {message.role === 'user' && (
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 bg-gradient-to-r from-purple-600/20 to-pink-600/20 
                      rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/10">
                      <User className="w-5 h-5 text-purple-400" />
                    </div>
                  </div>
                )}
              </motion.div>
            ))}

            {/* Loading States */}
            {(isAnalyzing || isGenerating) && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex gap-3"
              >
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-gradient-to-r from-purple-600/20 to-blue-600/20 
                    rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/10">
                    <Loader2 className="w-5 h-5 text-purple-400 animate-spin" />
                  </div>
                </div>
                <div className="flex-1">
                  <div className="p-4 bg-white/[0.03] border border-white/[0.05] rounded-xl">
                    <p className="text-sm text-gray-300 mb-2">
                      {isAnalyzing ? 'Analyzing your health data...' : 'Generating your report...'}
                    </p>
                    <div className="space-y-2">
                      {isAnalyzing && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="text-xs text-gray-400"
                        >
                          • Reviewing your health history
                        </motion.div>
                      )}
                      {isGenerating && (
                        <>
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.5 }}
                            className="text-xs text-gray-400"
                          >
                            • Identifying patterns and trends
                          </motion.div>
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 1 }}
                            className="text-xs text-gray-400"
                          >
                            • Creating personalized insights
                          </motion.div>
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 1.5 }}
                            className="text-xs text-gray-400"
                          >
                            • Finalizing your report
                          </motion.div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Report Display */}
            {report && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 p-6 bg-gradient-to-r from-purple-600/10 to-blue-600/10 border border-purple-600/20 rounded-xl"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-white">Report Ready!</h3>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      if (viewingReport) {
                        setShowReportViewer(true);
                      }
                    }}
                    className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white text-sm rounded-lg transition-all shadow-lg shadow-purple-600/20"
                  >
                    View Full Report
                  </motion.button>
                </div>
                <p className="text-sm text-gray-300 mb-2">
                  {viewingReport?.executive_summary?.substring(0, 200) ||
                   report.report_data?.executive_summary?.one_page_summary?.substring(0, 200) ||
                   'Your report has been generated successfully.'}...
                </p>
                <div className="flex items-center gap-4 text-xs text-gray-400">
                  <span>Type: {report.report_type.replace('_', ' ')}</span>
                  <span>•</span>
                  <span>Confidence: {report.confidence_score}%</span>
                </div>
              </motion.div>
            )}

            {/* Health Interaction Selection UI */}
            {showInteractionSelection && healthInteractions.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4"
              >
                <div className="grid grid-cols-1 gap-3 max-h-96 overflow-y-auto p-4 bg-white/[0.02] border border-white/[0.05] rounded-xl">
                  {healthInteractions.map((interaction) => {
                    const isSelected = selectedInteractions.has(interaction.id);
                    const data = interaction.data as any;
                    
                    return (
                      <motion.button
                        key={interaction.id}
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                        onClick={() => toggleInteractionSelection(interaction.id)}
                        className={`relative p-4 border rounded-xl transition-all text-left ${
                          isSelected 
                            ? 'bg-gradient-to-r from-purple-600/10 to-blue-600/10 border-purple-500/30' 
                            : 'bg-white/[0.02] border-white/[0.05] hover:border-white/[0.1]'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              {interaction.type === 'quick_scan' && (
                                <div className="p-2 bg-purple-600/20 rounded-lg">
                                  <Zap className="w-4 h-4 text-purple-400" />
                                </div>
                              )}
                              {interaction.type === 'deep_dive' && (
                                <div className="p-2 bg-blue-600/20 rounded-lg">
                                  <Brain className="w-4 h-4 text-blue-400" />
                                </div>
                              )}
                              {interaction.type === 'photo_session' && (
                                <div className="p-2 bg-cyan-600/20 rounded-lg">
                                  <Camera className="w-4 h-4 text-cyan-400" />
                                </div>
                              )}
                              <div>
                                <h4 className="text-white font-medium">
                                  {interaction.type === 'quick_scan' ? 'Quick Scan' : 
                                   interaction.type === 'deep_dive' ? 'Deep Dive' : 
                                   'Photo Session'}
                                </h4>
                                <p className="text-xs text-gray-400">
                                  {new Date(interaction.timestamp).toLocaleDateString('en-US', {
                                    month: 'short',
                                    day: 'numeric',
                                    hour: 'numeric',
                                    minute: '2-digit'
                                  })}
                                </p>
                              </div>
                            </div>
                            
                            <div className="space-y-1">
                              {data.body_part && (
                                <p className="text-sm text-gray-300">
                                  <span className="text-gray-500">Body Part:</span> {data.body_part}
                                </p>
                              )}
                              {(data.symptoms || data.initial_symptoms) && (
                                <p className="text-sm text-gray-300 line-clamp-2">
                                  <span className="text-gray-500">Symptoms:</span> {data.symptoms || data.initial_symptoms}
                                </p>
                              )}
                              {data.condition_name && (
                                <p className="text-sm text-gray-300">
                                  <span className="text-gray-500">Condition:</span> {data.condition_name}
                                </p>
                              )}
                              {data.analysis?.primary_condition && (
                                <p className="text-sm text-gray-300">
                                  <span className="text-gray-500">Diagnosis:</span> {data.analysis.primary_condition}
                                  <span className="text-xs text-gray-500 ml-1">({data.analysis.confidence}% confidence)</span>
                                </p>
                              )}
                              {data.final_analysis?.diagnosis && (
                                <p className="text-sm text-gray-300">
                                  <span className="text-gray-500">Diagnosis:</span> {data.final_analysis.diagnosis}
                                  <span className="text-xs text-gray-500 ml-1">({data.final_analysis.confidence}% confidence)</span>
                                </p>
                              )}
                            </div>
                          </div>
                          
                          <div className={`ml-3 p-2 rounded-lg transition-all ${
                            isSelected ? 'bg-purple-600' : 'bg-white/[0.05]'
                          }`}>
                            {isSelected ? (
                              <Check className="w-4 h-4 text-white" />
                            ) : (
                              <div className="w-4 h-4 border border-white/20 rounded" />
                            )}
                          </div>
                        </div>
                      </motion.button>
                    );
                  })}
                </div>
                
                {selectedInteractions.size > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-4 flex items-center justify-between"
                  >
                    <p className="text-sm text-gray-400">
                      {selectedInteractions.size} interaction{selectedInteractions.size !== 1 ? 's' : ''} selected
                    </p>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleGenerateReport}
                      className="px-6 py-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-lg font-medium transition-all shadow-lg shadow-purple-600/20"
                    >
                      Generate Report
                    </motion.button>
                  </motion.div>
                )}
              </motion.div>
            )}

            {/* Loading Interactions */}
            {isLoadingInteractions && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-center py-8"
              >
                <div className="text-center">
                  <Loader2 className="w-8 h-8 text-purple-400 animate-spin mx-auto mb-3" />
                  <p className="text-sm text-gray-400">Loading your health history...</p>
                </div>
              </motion.div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          {selectedOption && !report && (
            <div className="p-6 border-t border-white/[0.05]">
              <div className="flex gap-3">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder={
                    selectedOption.purpose === 'symptom_specific' ? "Describe the symptoms you want to track..." :
                    selectedOption.purpose === 'specialist_referral' ? "Enter specialist type or leave blank for general..." :
                    "Type your response..."
                  }
                  className="flex-1 px-4 py-3 bg-white/[0.03] border border-white/[0.05] rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-white/[0.1] transition-colors"
                  disabled={isAnalyzing || isGenerating}
                />
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleSendMessage}
                  disabled={!input.trim() || isAnalyzing || isGenerating}
                  className="px-4 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:from-gray-600 disabled:to-gray-700 text-white rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="w-5 h-5" />
                </motion.button>
              </div>
            </div>
          )}
        </motion.div>
      </motion.div>
      )}
    </AnimatePresence>

    {/* Report Viewer Modal */}
    <ReportViewerModal
      isOpen={showReportViewer}
      onClose={() => setShowReportViewer(false)}
      report={viewingReport}
    />
  </>
  );
};