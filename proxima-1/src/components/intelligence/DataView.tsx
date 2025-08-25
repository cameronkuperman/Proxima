'use client';

import { motion } from 'framer-motion';
import { useState } from 'react';
import { 
  useHealthVelocity,
  useBodySystems,
  useMasterTimeline,
  usePatternDiscovery,
  useDoctorReadiness,
  useComparativeIntelligence,
  useAllIntelligenceData
} from '@/hooks/useIntelligenceData';
import HealthVelocityScore from './HealthVelocityScore';
import BodySystemsHeatmap from './BodySystemsHeatmap';
import MasterTimeline from './MasterTimeline';
import PatternDiscoveryCards from './PatternDiscoveryCards';
import DoctorReadinessScore from './DoctorReadinessScore';
import ComparativeIntelligence from './ComparativeIntelligence';
import { RefreshCw, AlertCircle } from 'lucide-react';

export default function DataView() {
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'year' | 'all'>('month');
  
  // Map timeRange to API format
  const apiTimeRange = timeRange === 'week' ? '7D' : 
                       timeRange === 'month' ? '30D' : 
                       timeRange === 'year' ? '1Y' : 'ALL';
  
  // Use the all-in-one hook for optimal loading
  const {
    data,
    isLoading,
    hasError,
    refreshAll,
    prefetchOnHover
  } = useAllIntelligenceData();
  
  // Show loading state
  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Loading skeleton with spinner */}
        <div className="backdrop-blur-[20px] bg-white/[0.03] border border-white/[0.05] rounded-xl p-8 flex flex-col items-center justify-center h-96">
          <RefreshCw className="w-8 h-8 animate-spin text-purple-400 mb-4" />
          <p className="text-gray-400">Loading intelligence data...</p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="backdrop-blur-[20px] bg-white/[0.03] border border-white/[0.05] rounded-xl h-64 animate-pulse" />
          <div className="backdrop-blur-[20px] bg-white/[0.03] border border-white/[0.05] rounded-xl h-64 animate-pulse" />
        </div>
      </div>
    );
  }
  
  // Show error state with retry option
  if (hasError && !data.healthVelocity) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="backdrop-blur-[20px] bg-white/[0.03] border border-white/[0.05] rounded-xl p-8 flex flex-col items-center justify-center">
          <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">Unable to Load Intelligence Data</h3>
          <p className="text-gray-400 mb-4 text-center">
            We're having trouble fetching your health intelligence. The data may still be generating.
          </p>
          <button
            onClick={refreshAll}
            className="px-4 py-2 bg-purple-500/20 text-purple-400 rounded-lg hover:bg-purple-500/30 flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Try Again
          </button>
        </div>
      </div>
    );
  }
  
  // Check if we have at least some data to display
  const hasData = data.healthVelocity || data.bodySystems || data.timeline || 
                  data.patterns || data.doctorReadiness || data.comparative;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="max-w-7xl mx-auto space-y-6"
    >
      {/* Time Range Selector and Weekly Brief Link */}
      <div className="flex justify-between items-center">
        <div className="flex gap-2">
          <a
            href="/weekly-brief"
            className="px-4 py-2 bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 rounded-lg transition-all text-sm font-medium"
          >
            View Weekly Brief
          </a>
          <button
            onClick={refreshAll}
            className="px-4 py-2 bg-white/[0.05] hover:bg-white/[0.08] text-gray-400 rounded-lg transition-all text-sm font-medium flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>
        
        <div className="flex gap-2 bg-white/[0.03] p-1 rounded-lg border border-white/[0.05]">
          {(['week', 'month', 'year', 'all'] as const).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              onMouseEnter={() => {
                // Prefetch data on hover for better UX
                if (range === 'month') prefetchOnHover('velocity-30d');
                if (range === 'year') prefetchOnHover('timeline-year');
              }}
              className={`px-4 py-1.5 text-sm rounded-md capitalize transition-all ${
                timeRange === range
                  ? 'bg-white/[0.08] text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {range === 'all' ? 'All Time' : range === 'week' ? 'Weekly' : range === 'month' ? 'Monthly' : 'Yearly'}
            </button>
          ))}
        </div>
      </div>
      
      {/* Health Velocity Score - Hero Section */}
      {data.healthVelocity && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <HealthVelocityScore data={data.healthVelocity} />
        </motion.div>
      )}
      
      {/* Body Systems Heatmap and Master Timeline */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {data.bodySystems && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <BodySystemsHeatmap data={data.bodySystems} />
          </motion.div>
        )}
        
        {data.timeline && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            <MasterTimeline data={data.timeline} />
          </motion.div>
        )}
      </div>
      
      {/* Pattern Discovery Cards */}
      {data.patterns && data.patterns.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <PatternDiscoveryCards data={data.patterns} />
        </motion.div>
      )}
      
      {/* Doctor Readiness and Comparative Intelligence */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {data.doctorReadiness && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
          >
            <DoctorReadinessScore data={data.doctorReadiness} />
          </motion.div>
        )}
        
        {data.comparative && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 }}
          >
            <ComparativeIntelligence data={data.comparative} />
          </motion.div>
        )}
      </div>
      
      {/* Footer Note */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7 }}
        className="text-center py-8"
      >
        <p className="text-xs text-gray-500">
          {hasData ? 'Data refreshes automatically • Intelligence generated weekly' : 'No data available yet • Check back soon'}
        </p>
      </motion.div>
    </motion.div>
  );
}