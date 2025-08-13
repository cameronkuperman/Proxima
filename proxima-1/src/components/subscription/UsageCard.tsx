'use client';

import { motion } from 'framer-motion';
import { Brain, Camera, FileText, HardDrive, Search, Sparkles } from 'lucide-react';

interface UsageCardProps {
  features: any;
  usage: any;
  tier: string;
}

export default function UsageCard({ features, usage, tier }: UsageCardProps) {
  
  const getUsagePercentage = (used: number, limit: number) => {
    if (limit === -1) return 0; // Unlimited
    if (limit === 0) return 100; // No access
    return Math.min((used / limit) * 100, 100);
  };
  
  const getUsageColor = (percentage: number) => {
    if (percentage >= 90) return 'bg-red-500';
    if (percentage >= 75) return 'bg-yellow-500';
    return 'bg-green-500';
  };
  
  const formatLimit = (limit: number) => {
    if (limit === -1) return 'Unlimited';
    if (limit === 0) return 'Not available';
    return limit.toString();
  };
  
  const usageItems = [
    {
      name: 'Oracle Chats',
      icon: <Brain className="w-5 h-5" />,
      used: usage.oracle_chats,
      limit: features.oracle_chats,
      color: 'from-purple-600 to-pink-600',
    },
    {
      name: 'Quick Scans',
      icon: <Search className="w-5 h-5" />,
      used: usage.quick_scans,
      limit: features.quick_scans,
      color: 'from-blue-600 to-cyan-600',
    },
    {
      name: 'Deep Dives',
      icon: <Sparkles className="w-5 h-5" />,
      used: usage.deep_dives,
      limit: features.deep_dives,
      color: 'from-purple-600 to-blue-600',
    },
    {
      name: 'Photo Analyses',
      icon: <Camera className="w-5 h-5" />,
      used: usage.photo_analyses,
      limit: features.photo_analyses,
      color: 'from-pink-600 to-purple-600',
    },
    {
      name: 'Reports',
      icon: <FileText className="w-5 h-5" />,
      used: usage.report_generations,
      limit: features.report_generations,
      color: 'from-green-600 to-emerald-600',
    },
    {
      name: 'Storage',
      icon: <HardDrive className="w-5 h-5" />,
      used: usage.storage_gb,
      limit: features.storage_gb,
      color: 'from-gray-600 to-gray-700',
      unit: 'GB',
    },
  ];
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="backdrop-blur-[20px] bg-white/[0.03] border border-white/[0.05] rounded-xl p-6"
    >
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-white">Usage This Month</h3>
        <span className="text-xs text-gray-400">
          Resets {new Date(usage.period_end).toLocaleDateString()}
        </span>
      </div>
      
      <div className="space-y-4">
        {usageItems.map((item) => {
          const percentage = getUsagePercentage(item.used, item.limit);
          const isUnlimited = item.limit === -1;
          const isUnavailable = item.limit === 0;
          
          return (
            <div key={item.name} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-lg bg-gradient-to-r ${item.color} bg-opacity-20 flex items-center justify-center text-white`}>
                    {item.icon}
                  </div>
                  <span className="text-gray-300 text-sm">{item.name}</span>
                </div>
                <span className="text-white text-sm font-medium">
                  {isUnlimited ? (
                    <span className="text-green-400">Unlimited</span>
                  ) : isUnavailable ? (
                    <span className="text-gray-500">Not available</span>
                  ) : (
                    <>
                      {item.used} / {item.limit} {item.unit || ''}
                    </>
                  )}
                </span>
              </div>
              
              {!isUnlimited && !isUnavailable && (
                <div className="relative">
                  <div className="h-2 bg-white/[0.05] rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${percentage}%` }}
                      transition={{ duration: 0.5, ease: 'easeOut' }}
                      className={`h-full ${getUsageColor(percentage)} rounded-full`}
                    />
                  </div>
                  {percentage >= 90 && (
                    <p className="text-xs text-red-400 mt-1">
                      {percentage >= 100 ? 'Limit reached' : `${100 - percentage}% remaining`}
                    </p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
      
      {tier === 'free' && (
        <div className="mt-6 pt-6 border-t border-white/[0.05]">
          <p className="text-sm text-gray-400 mb-3">
            Upgrade to increase your limits
          </p>
          <button
            onClick={() => window.location.href = '/pricing'}
            className="w-full py-2 bg-gradient-to-r from-purple-600/20 to-pink-600/20 text-purple-400 font-medium rounded-lg hover:from-purple-600/30 hover:to-pink-600/30 transition-all"
          >
            View Plans
          </button>
        </div>
      )}
    </motion.div>
  );
}