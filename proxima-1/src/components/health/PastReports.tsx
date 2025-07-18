import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calendar,
  Filter,
  Search,
  FileText,
  TrendingUp,
  ChevronDown,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { reportsService, GeneratedReport } from '@/services/reportsService';
import { ReportCard } from './ReportCard';
import { useAuth } from '@/contexts/AuthContext';

interface PastReportsProps {
  onSelectReport: (report: GeneratedReport) => void;
}

export const PastReports: React.FC<PastReportsProps> = ({ onSelectReport }) => {
  const { user } = useAuth();
  const [reports, setReports] = useState<GeneratedReport[]>([]);
  const [groupedReports, setGroupedReports] = useState<Map<string, GeneratedReport[]>>(new Map());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedMonths, setExpandedMonths] = useState<Set<string>>(new Set());
  
  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [dateRange, setDateRange] = useState<'all' | 'month' | 'year'>('all');

  useEffect(() => {
    if (user?.id) {
      fetchReports();
    }
  }, [user, searchQuery, selectedTypes, dateRange]);

  const fetchReports = async () => {
    if (!user?.id) return;

    setIsLoading(true);
    setError(null);

    try {
      let fetchedReports = await reportsService.fetchUserReports(user.id);
      console.log('📋 PastReports - Fetched reports from backend:', fetchedReports);
      console.log('📋 PastReports - Number of reports:', fetchedReports?.length);
      
      // Apply filters
      if (searchQuery) {
        fetchedReports = fetchedReports.filter(report => 
          report.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          report.executive_summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
          report.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
        );
      }

      if (selectedTypes.length > 0) {
        fetchedReports = fetchedReports.filter(report => 
          selectedTypes.includes(report.report_type)
        );
      }

      if (dateRange !== 'all') {
        const now = new Date();
        const startDate = new Date();
        if (dateRange === 'month') {
          startDate.setMonth(now.getMonth() - 1);
        } else if (dateRange === 'year') {
          startDate.setFullYear(now.getFullYear() - 1);
        }
        fetchedReports = fetchedReports.filter(report => 
          new Date(report.created_at) >= startDate
        );
      }

      setReports(fetchedReports);
      const grouped = reportsService.groupReportsByMonth(fetchedReports);
      setGroupedReports(grouped);

      // Auto-expand first month
      if (grouped.size > 0) {
        const firstMonth = Array.from(grouped.keys())[0];
        setExpandedMonths(new Set([firstMonth]));
      }
    } catch (err) {
      setError('Failed to load your reports');
      console.error('Error fetching reports:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleMonth = (monthKey: string) => {
    setExpandedMonths(prev => {
      const newSet = new Set(prev);
      if (newSet.has(monthKey)) {
        newSet.delete(monthKey);
      } else {
        newSet.add(monthKey);
      }
      return newSet;
    });
  };

  const formatMonthLabel = (monthKey: string) => {
    const [year, month] = monthKey.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  const reportTypes = [
    { value: 'comprehensive', label: 'Comprehensive', color: 'purple' },
    { value: 'urgent_triage', label: 'Urgent', color: 'red' },
    { value: 'symptom_timeline', label: 'Timeline', color: 'blue' },
    { value: 'specialist_focused', label: 'Specialist', color: 'indigo' },
    { value: 'photo_progression', label: 'Photo Analysis', color: 'cyan' },
  ];

  if (isLoading) {
    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col items-center justify-center h-64 gap-4"
      >
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full blur-xl opacity-30 animate-pulse" />
          <Loader2 className="relative w-10 h-10 animate-spin text-purple-400" />
        </div>
        <p className="text-gray-400 text-sm">Loading your medical reports...</p>
      </motion.div>
    );
  }

  if (error) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="backdrop-blur-[20px] bg-white/[0.03] border border-red-500/20 rounded-xl p-8 text-center"
      >
        <div className="w-12 h-12 bg-red-500/20 rounded-xl mx-auto mb-4 flex items-center justify-center">
          <AlertCircle className="w-6 h-6 text-red-400" />
        </div>
        <p className="text-red-400 mb-4">{error}</p>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={fetchReports}
          className="px-6 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white 
            rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all"
        >
          Try Again
        </motion.button>
      </motion.div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <h2 className="text-2xl font-bold text-white mb-2">Your Medical Reports</h2>
        <p className="text-gray-400">
          View your past generated reports and health insights
        </p>
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="backdrop-blur-[20px] bg-white/[0.03] border border-white/[0.05] rounded-xl p-6"
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 
              text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search reports..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white/[0.03] border border-white/[0.05] rounded-lg 
                text-white placeholder-gray-500 focus:border-white/[0.1] focus:outline-none transition-all"
            />
          </div>

          {/* Type Filter */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 
              text-gray-400 w-5 h-5" />
            <select
              value={selectedTypes.join(',')}
              onChange={(e) => setSelectedTypes(e.target.value ? e.target.value.split(',') : [])}
              className="w-full pl-10 pr-4 py-2 bg-white/[0.03] border border-white/[0.05] rounded-lg 
                text-white focus:border-white/[0.1] focus:outline-none transition-all appearance-none"
            >
              <option value="" className="bg-[#0a0a0a]">All Types</option>
              {reportTypes.map(type => (
                <option key={type.value} value={type.value} className="bg-[#0a0a0a]">{type.label}</option>
              ))}
            </select>
          </div>

          {/* Date Range */}
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 
              text-gray-400 w-5 h-5" />
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value as any)}
              className="w-full pl-10 pr-4 py-2 bg-white/[0.03] border border-white/[0.05] rounded-lg 
                text-white focus:border-white/[0.1] focus:outline-none transition-all appearance-none"
            >
              <option value="all" className="bg-[#0a0a0a]">All Time</option>
              <option value="month" className="bg-[#0a0a0a]">Last Month</option>
              <option value="year" className="bg-[#0a0a0a]">Last Year</option>
            </select>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="mt-6 grid grid-cols-2 md:grid-cols-5 gap-4">
          {reportTypes.map(type => {
            const count = reports.filter(r => r.report_type === type.value).length;
            const gradients = {
              'comprehensive': 'from-purple-600/20 to-blue-600/20',
              'urgent_triage': 'from-red-600/20 to-orange-600/20',
              'symptom_timeline': 'from-blue-600/20 to-cyan-600/20',
              'specialist_focused': 'from-indigo-600/20 to-purple-600/20',
              'photo_progression': 'from-cyan-600/20 to-teal-600/20',
            };
            return (
              <motion.div 
                key={type.value} 
                whileHover={{ scale: 1.05 }}
                className={`relative text-center p-4 rounded-xl bg-gradient-to-r ${gradients[type.value as keyof typeof gradients]}
                  backdrop-blur-sm border border-white/[0.05] cursor-pointer transition-all
                  hover:border-white/[0.1] group overflow-hidden`}
              >
                {/* Shimmer effect on hover */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent 
                  -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                
                <p className="relative text-2xl font-bold text-white">{count}</p>
                <p className="relative text-sm text-gray-300">{type.label}</p>
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      {/* Timeline */}
      {reports.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="backdrop-blur-[20px] bg-white/[0.03] border border-white/[0.05] rounded-xl p-12 text-center"
        >
          <FileText className="w-12 h-12 text-gray-500 mx-auto mb-4" />
          <p className="text-gray-300 mb-2">No reports generated yet</p>
          <p className="text-sm text-gray-500">
            Click the + button to generate your first medical report
          </p>
        </motion.div>
      ) : (
        <div className="space-y-6">
          {Array.from(groupedReports.entries()).map(([monthKey, monthReports], index) => (
            <motion.div
              key={monthKey}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + index * 0.05 }}
              className="backdrop-blur-[20px] bg-white/[0.03] border border-white/[0.05] rounded-xl overflow-hidden"
            >
              {/* Month Header */}
              <button
                onClick={() => toggleMonth(monthKey)}
                className="w-full px-6 py-4 flex items-center justify-between 
                  hover:bg-white/[0.02] transition-all"
              >
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-purple-400" />
                  <h3 className="text-lg font-semibold text-white">
                    {formatMonthLabel(monthKey)}
                  </h3>
                  <span className="px-3 py-1 bg-gradient-to-r from-purple-600/20 to-blue-600/20 
                    text-purple-300 text-xs rounded-full">
                    {monthReports.length} reports
                  </span>
                </div>
                <ChevronDown
                  className={`w-5 h-5 text-gray-400 transform transition-transform ${
                    expandedMonths.has(monthKey) ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {/* Month Content */}
              <AnimatePresence>
                {expandedMonths.has(monthKey) && (
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: 'auto' }}
                    exit={{ height: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <div className="p-6 pt-0 grid grid-cols-1 md:grid-cols-2 gap-4">
                      {monthReports.map((report, reportIndex) => (
                        <ReportCard
                          key={report.id || `report-${monthKey}-${reportIndex}`}
                          report={report}
                          onClick={onSelectReport}
                        />
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};