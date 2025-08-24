'use client';

import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { generateMockHealthData } from '@/lib/mock-health-data';
import HealthVelocityScore from './HealthVelocityScore';
import BodySystemsHeatmap from './BodySystemsHeatmap';
import MasterTimeline from './MasterTimeline';
import PatternDiscoveryCards from './PatternDiscoveryCards';
import PhotoProgressionSlider from './PhotoProgressionSlider';
import DoctorReadinessScore from './DoctorReadinessScore';
import ComparativeIntelligence from './ComparativeIntelligence';

export default function DataView() {
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'year' | 'all'>('month');
  const [mockData, setMockData] = useState<ReturnType<typeof generateMockHealthData> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    // Simulate data loading
    const timer = setTimeout(() => {
      setMockData(generateMockHealthData());
      setIsLoading(false);
    }, 500);
    
    return () => clearTimeout(timer);
  }, []);
  
  if (isLoading || !mockData) {
    return (
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Loading skeleton */}
        <div className="backdrop-blur-[20px] bg-white/[0.03] border border-white/[0.05] rounded-xl h-96 animate-pulse" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="backdrop-blur-[20px] bg-white/[0.03] border border-white/[0.05] rounded-xl h-64 animate-pulse" />
          <div className="backdrop-blur-[20px] bg-white/[0.03] border border-white/[0.05] rounded-xl h-64 animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="max-w-7xl mx-auto space-y-6"
    >
      {/* Time Range Selector and Weekly Brief Link */}
      <div className="flex justify-between items-center">
        <a
          href="/weekly-brief"
          className="px-4 py-2 bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 rounded-lg transition-all text-sm font-medium"
        >
          View Weekly Brief
        </a>
        
        <div className="flex gap-2 bg-white/[0.03] p-1 rounded-lg border border-white/[0.05]">
          {(['week', 'month', 'year', 'all'] as const).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
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
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <HealthVelocityScore data={mockData.healthVelocity} />
      </motion.div>
      
      {/* Body Systems Heatmap and Master Timeline */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
          <BodySystemsHeatmap data={mockData.bodySystems} />
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
        >
          <MasterTimeline data={mockData.timeline} />
        </motion.div>
      </div>
      
      {/* Pattern Discovery Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <PatternDiscoveryCards data={mockData.patternCards} />
      </motion.div>
      
      {/* Photo Progression */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <PhotoProgressionSlider data={mockData.photoProgression} />
      </motion.div>
      
      {/* Doctor Readiness and Comparative Intelligence */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.6 }}
        >
          <DoctorReadinessScore data={mockData.doctorReadiness} />
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.7 }}
        >
          <ComparativeIntelligence data={mockData.comparativeIntelligence} />
        </motion.div>
      </div>
      
      {/* Footer Note */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="text-center py-8"
      >
        <p className="text-xs text-gray-500">
          Data refreshes every hour • Last updated: Just now
        </p>
      </motion.div>
    </motion.div>
  );
}