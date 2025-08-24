'use client';

import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { HealthVelocityData } from '@/lib/mock-health-data';

interface HealthVelocityScoreProps {
  data: HealthVelocityData;
}

export default function HealthVelocityScore({ data }: HealthVelocityScoreProps) {
  const { score, trend, momentum, sparkline, recommendations } = data;
  
  // Calculate circle progress
  const circumference = 2 * Math.PI * 120; // radius = 120
  const strokeDashoffset = circumference - (score / 100) * circumference;
  
  // Get trend icon and color
  const getTrendIcon = () => {
    if (trend === 'improving') return <TrendingUp className="w-5 h-5" />;
    if (trend === 'declining') return <TrendingDown className="w-5 h-5" />;
    return <Minus className="w-5 h-5" />;
  };
  
  const getTrendColor = () => {
    if (trend === 'improving') return 'text-green-400';
    if (trend === 'declining') return 'text-red-400';
    return 'text-gray-400';
  };
  
  const getMomentumColor = () => {
    if (momentum > 0) return 'text-green-400';
    if (momentum < 0) return 'text-red-400';
    return 'text-gray-400';
  };

  return (
    <div className="backdrop-blur-[20px] bg-white/[0.03] border border-white/[0.05] rounded-xl p-8">
      <div className="flex flex-col lg:flex-row items-center lg:items-start gap-8">
        {/* Circular Progress */}
        <div className="relative">
          <svg className="w-64 h-64 transform -rotate-90">
            {/* Background circle */}
            <circle
              cx="128"
              cy="128"
              r="120"
              stroke="rgba(255, 255, 255, 0.05)"
              strokeWidth="12"
              fill="none"
            />
            {/* Progress circle */}
            <motion.circle
              cx="128"
              cy="128"
              r="120"
              stroke="url(#velocityGradient)"
              strokeWidth="12"
              fill="none"
              strokeLinecap="round"
              strokeDasharray={circumference}
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset }}
              transition={{ duration: 1.5, ease: "easeOut" }}
            />
            <defs>
              <linearGradient id="velocityGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#a855f7" />
                <stop offset="100%" stopColor="#ec4899" />
              </linearGradient>
            </defs>
          </svg>
          
          {/* Center content */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.5, duration: 0.3 }}
              className="text-center"
            >
              <div className="text-6xl font-bold text-white mb-2">
                {score}
              </div>
              <div className={`flex items-center gap-2 ${getTrendColor()}`}>
                {getTrendIcon()}
                <span className="text-sm font-medium uppercase">{trend}</span>
              </div>
              <div className={`text-sm mt-1 ${getMomentumColor()}`}>
                {momentum > 0 ? '+' : ''}{momentum}% this week
              </div>
            </motion.div>
          </div>
          
        </div>
        
        {/* Right side content */}
        <div className="flex-1 space-y-6">
          <div>
            <h2 className="text-2xl font-semibold text-white mb-2">Health Velocity Score</h2>
            <p className="text-gray-400">
              Your overall health momentum based on patterns, improvements, and consistency
            </p>
          </div>
          
          {/* Mini sparkline */}
          <div className="flex items-end gap-1 h-12">
            {sparkline.map((value, index) => (
              <motion.div
                key={index}
                initial={{ height: 0 }}
                animate={{ height: `${(value / 100) * 48}px` }}
                transition={{ delay: index * 0.1 }}
                className="w-4 bg-gradient-to-t from-purple-500/50 to-pink-500/50 rounded-t"
              />
            ))}
          </div>
          
          {/* Recommendations */}
          <div>
            <h3 className="text-sm font-medium text-gray-400 mb-3">Clinical Interventions</h3>
            <div className="space-y-2">
              {recommendations.map((rec, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.8 + index * 0.1 }}
                  className="flex items-center gap-3 p-3 bg-white/[0.02] rounded-lg hover:bg-white/[0.04] transition-colors cursor-pointer group"
                >
                  <div className="flex-1">
                    <p className="text-sm text-white font-medium">{rec.action}</p>
                  </div>
                  <span className="text-sm font-semibold text-purple-400 group-hover:text-purple-300">
                    {rec.impact}
                  </span>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}