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
  CalendarDays,
  AlertCircle
} from 'lucide-react';
import { healthInteractionsService, HealthInteraction } from '@/services/healthInteractionsService';
import { InteractionCard } from './InteractionCard';
import { useAuth } from '@/contexts/AuthContext';

interface PastInteractionsProps {
  onSelectInteraction: (interaction: HealthInteraction) => void;
}

export const PastInteractions: React.FC<PastInteractionsProps> = ({
  onSelectInteraction,
}) => {
  const { user } = useAuth();
  const [interactions, setInteractions] = useState<HealthInteraction[]>([]);
  const [groupedInteractions, setGroupedInteractions] = useState<Map<string, HealthInteraction[]>>(new Map());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedMonths, setExpandedMonths] = useState<Set<string>>(new Set());

  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [dateRange, setDateRange] = useState<'all' | 'month' | 'year'>('all');

  useEffect(() => {
    if (user?.id) {
      fetchInteractions();
    }
  }, [user, searchQuery, selectedTypes, dateRange]);

  const fetchInteractions = async () => {
    if (!user?.id) return;

    setIsLoading(true);
    setError(null);

    try {
      let startDate: Date | undefined;
      const endDate = new Date();

      switch (dateRange) {
        case 'month':
          startDate = new Date();
          startDate.setMonth(startDate.getMonth() - 1);
          break;
        case 'year':
          startDate = new Date();
          startDate.setFullYear(startDate.getFullYear() - 1);
          break;
      }

      const fetchedInteractions = await healthInteractionsService.fetchUserInteractions(
        user.id,
        {
          startDate,
          endDate,
          types: selectedTypes.length > 0 ? selectedTypes as any : undefined,
          searchQuery: searchQuery || undefined,
        }
      );

      setInteractions(fetchedInteractions);
      const grouped = healthInteractionsService.groupInteractionsByMonth(fetchedInteractions);
      setGroupedInteractions(grouped);

      // Auto-expand first month
      if (grouped.size > 0) {
        const firstMonth = Array.from(grouped.keys())[0];
        setExpandedMonths(new Set([firstMonth]));
      }
    } catch (err) {
      setError('Failed to load your health history');
      console.error('Error fetching interactions:', err);
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

  const interactionTypes = [
    { value: 'quick_scan', label: 'Quick Scans', color: 'purple' },
    { value: 'deep_dive', label: 'Deep Dives', color: 'blue' },
    { value: 'photo_session', label: 'Photo Sessions', color: 'cyan' },
    { value: 'symptom_tracking', label: 'Symptom Tracking', color: 'teal' },
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
        <p className="text-gray-400 text-sm">Loading your health history...</p>
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
          onClick={fetchInteractions}
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
        <h2 className="text-2xl font-bold text-white mb-2">Your Health Timeline</h2>
        <p className="text-gray-400">
          Click any past interaction to generate a detailed medical report
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
              placeholder="Search symptoms..."
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
              {interactionTypes.map(type => (
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
        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
          {interactionTypes.map(type => {
            const count = interactions.filter(i => i.type === type.value).length;
            const gradients = {
              'quick_scan': 'from-purple-600/20 to-pink-600/20',
              'deep_dive': 'from-blue-600/20 to-cyan-600/20',
              'photo_session': 'from-cyan-600/20 to-teal-600/20',
              'symptom_tracking': 'from-teal-600/20 to-green-600/20',
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
      {interactions.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="backdrop-blur-[20px] bg-white/[0.03] border border-white/[0.05] rounded-xl p-12 text-center"
        >
          <TrendingUp className="w-12 h-12 text-gray-500 mx-auto mb-4" />
          <p className="text-gray-300 mb-2">No health interactions found</p>
          <p className="text-sm text-gray-500">
            Start tracking your health to see your history here
          </p>
        </motion.div>
      ) : (
        <div className="space-y-6">
          {Array.from(groupedInteractions.entries()).map(([monthKey, monthInteractions], index) => (
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
                    {monthInteractions.length} entries
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
                      {monthInteractions.map((interaction) => (
                        <InteractionCard
                          key={interaction.id}
                          interaction={interaction}
                          onClick={onSelectInteraction}
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