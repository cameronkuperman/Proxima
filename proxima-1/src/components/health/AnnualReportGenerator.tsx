import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calendar,
  CalendarDays,
  FileText,
  Loader2,
  TrendingUp,
  Activity,
  Brain,
  Camera,
  ChevronLeft,
  ChevronRight,
  X
} from 'lucide-react';
import { healthInteractionsService } from '@/services/healthInteractionsService';
import { useReportGeneration } from '@/hooks/useReportGeneration';
import { ReportViewer } from '@/components/ReportViewer';
import { useAuth } from '@/contexts/AuthContext';

interface AnnualReportGeneratorProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AnnualReportGenerator: React.FC<AnnualReportGeneratorProps> = ({
  isOpen,
  onClose,
}) => {
  const { user } = useAuth();
  const { isAnalyzing, isGenerating, report, error, generateReport, reset } = useReportGeneration();
  
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [interactionStats, setInteractionStats] = useState<any>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(false);
  const [selectedRange, setSelectedRange] = useState<'year' | 'custom'>('year');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  useEffect(() => {
    if (isOpen && user?.id) {
      fetchYearStats();
    }
  }, [isOpen, selectedYear, user]);

  const fetchYearStats = async () => {
    if (!user?.id) return;
    
    setIsLoadingStats(true);
    try {
      const startDate = new Date(selectedYear, 0, 1);
      const endDate = new Date(selectedYear, 11, 31);
      
      const interactions = await healthInteractionsService.fetchUserInteractions(
        user.id,
        { startDate, endDate }
      );

      // Calculate stats
      const stats = {
        total: interactions.length,
        quickScans: interactions.filter(i => i.type === 'quick_scan').length,
        deepDives: interactions.filter(i => i.type === 'deep_dive').length,
        photoSessions: interactions.filter(i => i.type === 'photo_session').length,
        monthlyBreakdown: calculateMonthlyBreakdown(interactions),
      };

      setInteractionStats(stats);
    } catch (err) {
      console.error('Failed to fetch year stats:', err);
    } finally {
      setIsLoadingStats(false);
    }
  };

  const calculateMonthlyBreakdown = (interactions: any[]) => {
    const months = Array(12).fill(0);
    interactions.forEach(interaction => {
      const month = new Date(interaction.timestamp).getMonth();
      months[month]++;
    });
    return months;
  };

  const handleGenerateAnnualReport = async () => {
    if (!user?.id) return;

    let startDate: Date;
    let endDate: Date;

    if (selectedRange === 'year') {
      startDate = new Date(selectedYear, 0, 1);
      endDate = new Date(selectedYear, 11, 31);
    } else {
      startDate = new Date(customStartDate);
      endDate = new Date(customEndDate);
    }

    try {
      await generateReport({
        context: {
          purpose: 'annual_checkup',
          target_audience: 'self',
          time_frame: {
            start: startDate.toISOString(),
            end: endDate.toISOString(),
          }
        },
        user_id: user.id,
      });
    } catch (err) {
      // Error handled by hook
    }
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const getAvailableYears = () => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let i = 0; i < 5; i++) {
      years.push(currentYear - i);
    }
    return years;
  };

  if (!isOpen) return null;

  // Show report viewer if report is generated
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
              <h2 className="text-2xl font-bold text-gray-900">Annual Health Report</h2>
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
          className="bg-white rounded-2xl shadow-xl max-w-4xl w-full max-h-[90vh] 
            overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-gradient-to-r from-purple-500 to-blue-500 
                  text-white rounded-lg">
                  <CalendarDays className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Generate Annual Report</h2>
                  <p className="text-gray-600">Create a comprehensive health summary</p>
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
            {/* Time Period Selection */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Select Time Period</h3>
              
              <div className="grid grid-cols-2 gap-4 mb-4">
                <button
                  onClick={() => setSelectedRange('year')}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    selectedRange === 'year'
                      ? 'border-purple-500 bg-purple-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <Calendar className={`w-6 h-6 mx-auto mb-2 ${
                    selectedRange === 'year' ? 'text-purple-600' : 'text-gray-500'
                  }`} />
                  <span className={`font-medium ${
                    selectedRange === 'year' ? 'text-purple-700' : 'text-gray-700'
                  }`}>
                    Full Year
                  </span>
                </button>
                
                <button
                  onClick={() => setSelectedRange('custom')}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    selectedRange === 'custom'
                      ? 'border-purple-500 bg-purple-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <CalendarDays className={`w-6 h-6 mx-auto mb-2 ${
                    selectedRange === 'custom' ? 'text-purple-600' : 'text-gray-500'
                  }`} />
                  <span className={`font-medium ${
                    selectedRange === 'custom' ? 'text-purple-700' : 'text-gray-700'
                  }`}>
                    Custom Range
                  </span>
                </button>
              </div>

              {selectedRange === 'year' ? (
                <div className="flex items-center justify-center gap-4">
                  <button
                    onClick={() => setSelectedYear(prev => prev - 1)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  
                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                    className="px-6 py-3 text-xl font-semibold border border-gray-300 
                      rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    {getAvailableYears().map(year => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                  
                  <button
                    onClick={() => setSelectedYear(prev => prev + 1)}
                    disabled={selectedYear >= new Date().getFullYear()}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors 
                      disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Start Date
                    </label>
                    <input
                      type="date"
                      value={customStartDate}
                      onChange={(e) => setCustomStartDate(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg 
                        focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      End Date
                    </label>
                    <input
                      type="date"
                      value={customEndDate}
                      onChange={(e) => setCustomEndDate(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg 
                        focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Year Statistics */}
            {selectedRange === 'year' && (
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  {selectedYear} Health Summary
                </h3>
                
                {isLoadingStats ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
                  </div>
                ) : interactionStats ? (
                  <>
                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                      <div className="bg-gradient-to-br from-purple-50 to-purple-100 
                        rounded-lg p-4 text-center">
                        <Activity className="w-6 h-6 text-purple-600 mx-auto mb-2" />
                        <p className="text-2xl font-bold text-purple-900">
                          {interactionStats.total}
                        </p>
                        <p className="text-sm text-purple-700">Total Sessions</p>
                      </div>
                      
                      <div className="bg-gradient-to-br from-blue-50 to-blue-100 
                        rounded-lg p-4 text-center">
                        <Brain className="w-6 h-6 text-blue-600 mx-auto mb-2" />
                        <p className="text-2xl font-bold text-blue-900">
                          {interactionStats.quickScans}
                        </p>
                        <p className="text-sm text-blue-700">Quick Scans</p>
                      </div>
                      
                      <div className="bg-gradient-to-br from-cyan-50 to-cyan-100 
                        rounded-lg p-4 text-center">
                        <FileText className="w-6 h-6 text-cyan-600 mx-auto mb-2" />
                        <p className="text-2xl font-bold text-cyan-900">
                          {interactionStats.deepDives}
                        </p>
                        <p className="text-sm text-cyan-700">Deep Dives</p>
                      </div>
                      
                      <div className="bg-gradient-to-br from-teal-50 to-teal-100 
                        rounded-lg p-4 text-center">
                        <Camera className="w-6 h-6 text-teal-600 mx-auto mb-2" />
                        <p className="text-2xl font-bold text-teal-900">
                          {interactionStats.photoSessions}
                        </p>
                        <p className="text-sm text-teal-700">Photo Sessions</p>
                      </div>
                    </div>

                    {/* Monthly Chart */}
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="text-sm font-medium text-gray-700 mb-3">
                        Monthly Activity
                      </h4>
                      <div className="flex items-end justify-between gap-1 h-24">
                        {interactionStats.monthlyBreakdown.map((count: number, idx: number) => (
                          <div
                            key={idx}
                            className="flex-1 bg-purple-500 rounded-t hover:bg-purple-600 
                              transition-colors relative group"
                            style={{
                              height: `${Math.max(5, (count / Math.max(...interactionStats.monthlyBreakdown)) * 100)}%`,
                              minHeight: count > 0 ? '4px' : '0'
                            }}
                          >
                            <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 
                              opacity-0 group-hover:opacity-100 transition-opacity bg-gray-800 
                              text-white text-xs px-2 py-1 rounded">
                              {count}
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="flex justify-between text-xs text-gray-500 mt-2">
                        <span>Jan</span>
                        <span>Jun</span>
                        <span>Dec</span>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <TrendingUp className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p>No health data found for {selectedYear}</p>
                  </div>
                )}
              </div>
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
              onClick={handleGenerateAnnualReport}
              disabled={isAnalyzing || isGenerating || 
                (selectedRange === 'custom' && (!customStartDate || !customEndDate))}
              className="w-full py-4 rounded-xl bg-gradient-to-r from-purple-600 
                to-blue-600 hover:from-purple-700 hover:to-blue-700 
                disabled:from-gray-400 disabled:to-gray-500 text-white font-medium 
                transition-all duration-200 flex items-center justify-center gap-3"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Analyzing your health data...
                </>
              ) : isGenerating ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Generating comprehensive report...
                </>
              ) : (
                <>
                  <FileText className="w-5 h-5" />
                  Generate {selectedRange === 'year' ? `${selectedYear} ` : ''}Health Report
                </>
              )}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};