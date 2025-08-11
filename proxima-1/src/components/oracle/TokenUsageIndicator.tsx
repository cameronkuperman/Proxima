'use client';

import { motion } from 'framer-motion';

interface TokenUsageIndicatorProps {
  current: number;
  limit: number;
  percentage: number;
  isPremium: boolean;
  compressionActive?: boolean;
}

export function TokenUsageIndicator({
  current,
  limit,
  percentage,
  isPremium,
  compressionActive
}: TokenUsageIndicatorProps) {
  const safePercentage = percentage || 0;
  const isNearLimit = safePercentage > 80;
  const isAtLimit = safePercentage >= 100;

  const getColor = () => {
    if (isAtLimit) return 'from-red-500 to-red-600';
    if (isNearLimit) return 'from-amber-500 to-orange-500';
    return 'from-green-500 to-emerald-500';
  };

  const getTextColor = () => {
    if (isAtLimit) return 'text-red-400';
    if (isNearLimit) return 'text-amber-400';
    return 'text-gray-400';
  };

  return (
    <div className="flex items-center gap-3">
      {compressionActive && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex items-center gap-1.5 px-2 py-1 bg-amber-500/10 rounded-lg"
        >
          <svg className="w-3.5 h-3.5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
          </svg>
          <span className="text-xs text-amber-500">Compression Active</span>
        </motion.div>
      )}

      <div className="flex items-center gap-2">
        <div className="relative w-32 h-2 bg-white/[0.1] rounded-full overflow-hidden">
          <motion.div
            className={`absolute inset-y-0 left-0 bg-gradient-to-r ${getColor()} rounded-full`}
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(safePercentage, 100)}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />
          {isNearLimit && (
            <motion.div
              className="absolute inset-0 bg-white/20"
              animate={{ opacity: [0, 0.3, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          )}
        </div>
        
        <div className="flex flex-col">
          <span className={`text-xs ${getTextColor()}`}>
            {(current || 0).toLocaleString()} / {(limit || 100000).toLocaleString()}
          </span>
          {!isPremium && isNearLimit && !isAtLimit && (
            <span className="text-xs text-amber-400">
              Approaching limit
            </span>
          )}
        </div>
      </div>
    </div>
  );
}