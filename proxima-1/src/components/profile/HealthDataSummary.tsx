'use client';

import { motion } from 'framer-motion';
import { useState } from 'react';

interface HealthDataItem {
  label: string;
  count: number;
  icon: string;
  lastUpdated: string;
}

interface HealthDataSummaryProps {
  onConfigureClick?: () => void;
}

export default function HealthDataSummary({ onConfigureClick }: HealthDataSummaryProps) {
  const [healthData] = useState<HealthDataItem[]>([
    {
      label: 'Chronic Conditions',
      count: 2,
      icon: '🏥',
      lastUpdated: '2 days ago'
    },
    {
      label: 'Current Medications',
      count: 4,
      icon: '💊',
      lastUpdated: '1 week ago'
    },
    {
      label: 'Allergies',
      count: 3,
      icon: '⚠️',
      lastUpdated: '1 month ago'
    },
    {
      label: 'Family History',
      count: 5,
      icon: '👥',
      lastUpdated: '2 weeks ago'
    }
  ]);


  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="backdrop-blur-[20px] bg-white/[0.03] border border-white/[0.05] rounded-xl p-6"
    >
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-white">Configured Health Data</h3>
          <p className="text-sm text-gray-400 mt-1">
            This data helps our AI provide more accurate insights
          </p>
        </div>
        <button
          onClick={onConfigureClick}
          className="px-4 py-2 text-sm text-white bg-white/[0.05] hover:bg-white/[0.08] border border-white/[0.08] hover:border-white/[0.15] rounded-lg transition-all"
        >
          Configure Health Data
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {healthData.map((item, index) => (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 + index * 0.05 }}
            className="bg-white/[0.02] border border-white/[0.05] rounded-lg p-4 hover:bg-white/[0.03] hover:border-white/[0.08] transition-all cursor-pointer"
          >
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg">{item.icon}</span>
                  <p className="text-sm text-gray-400">{item.label}</p>
                </div>
                <p className="text-2xl font-semibold text-white">{item.count}</p>
                <p className="text-xs text-gray-500 mt-1">Updated {item.lastUpdated}</p>
              </div>
              <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Privacy Notice */}
      <div className="mt-6 p-4 bg-purple-500/5 border border-purple-500/10 rounded-lg">
        <div className="flex gap-3">
          <svg className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          <div>
            <p className="text-sm text-purple-300 font-medium">Your data is secure</p>
            <p className="text-xs text-gray-400 mt-1">
              All health information is encrypted and HIPAA compliant. We never share your data.
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}