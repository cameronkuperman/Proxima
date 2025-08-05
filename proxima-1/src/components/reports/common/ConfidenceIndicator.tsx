'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Info, Shield, AlertTriangle, CheckCircle } from 'lucide-react';

interface ConfidenceIndicatorProps {
  score: number;
  reasoning?: string;
  dataQuality?: string;
  className?: string;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const ConfidenceIndicator: React.FC<ConfidenceIndicatorProps> = ({
  score,
  reasoning,
  dataQuality,
  className = '',
  showLabel = true,
  size = 'md'
}) => {
  const [showTooltip, setShowTooltip] = useState(false);

  // Normalize score to 0-100 range
  const normalizedScore = Math.max(0, Math.min(100, score * 100));

  // Determine color based on score
  const getColor = () => {
    if (normalizedScore >= 80) return '#10b981'; // green-500
    if (normalizedScore >= 50) return '#f59e0b'; // amber-500
    return '#ef4444'; // red-500
  };

  const getColorClass = () => {
    if (normalizedScore >= 80) return 'text-green-600';
    if (normalizedScore >= 50) return 'text-amber-600';
    return 'text-red-600';
  };

  const getConfidenceLevel = () => {
    if (normalizedScore >= 80) return 'High Confidence';
    if (normalizedScore >= 50) return 'Moderate Confidence';
    return 'Low Confidence';
  };

  const getIcon = () => {
    if (normalizedScore >= 80) return CheckCircle;
    if (normalizedScore >= 50) return Shield;
    return AlertTriangle;
  };

  const Icon = getIcon();

  // Size configurations
  const sizeConfig = {
    sm: { width: 80, height: 40, strokeWidth: 8, fontSize: 'text-sm' },
    md: { width: 120, height: 60, strokeWidth: 10, fontSize: 'text-base' },
    lg: { width: 160, height: 80, strokeWidth: 12, fontSize: 'text-lg' }
  };

  const config = sizeConfig[size];
  const radius = (config.width - config.strokeWidth) / 2;
  const circumference = Math.PI * radius; // Half circle
  const strokeDashoffset = circumference - (normalizedScore / 100) * circumference;

  return (
    <div 
      className={`relative inline-flex flex-col items-center ${className}`}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      {/* Semi-circular gauge */}
      <div className="relative" style={{ width: config.width, height: config.height }}>
        <svg
          width={config.width}
          height={config.height}
          viewBox={`0 0 ${config.width} ${config.height}`}
          className="transform -rotate-90"
        >
          {/* Background arc */}
          <path
            d={`M ${config.strokeWidth / 2} ${config.height} A ${radius} ${radius} 0 0 1 ${config.width - config.strokeWidth / 2} ${config.height}`}
            fill="none"
            stroke="#e5e7eb"
            strokeWidth={config.strokeWidth}
            strokeLinecap="round"
          />
          
          {/* Progress arc */}
          <motion.path
            d={`M ${config.strokeWidth / 2} ${config.height} A ${radius} ${radius} 0 0 1 ${config.width - config.strokeWidth / 2} ${config.height}`}
            fill="none"
            stroke={getColor()}
            strokeWidth={config.strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1, ease: "easeOut" }}
          />
        </svg>

        {/* Score display */}
        <div className={`absolute inset-0 flex items-end justify-center pb-2`}>
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5 }}
            className={`${config.fontSize} font-bold ${getColorClass()}`}
          >
            {Math.round(normalizedScore)}%
          </motion.div>
        </div>
      </div>

      {/* Label */}
      {showLabel && (
        <div className={`mt-2 flex items-center gap-1 ${getColorClass()}`}>
          <Icon className={size === 'sm' ? 'w-3 h-3' : 'w-4 h-4'} />
          <span className={`font-medium ${size === 'sm' ? 'text-xs' : 'text-sm'}`}>
            {getConfidenceLevel()}
          </span>
        </div>
      )}

      {/* Tooltip */}
      {(reasoning || dataQuality) && showTooltip && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute top-full mt-2 z-50 w-64 p-3 bg-gray-900 text-white rounded-lg shadow-lg"
        >
          <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-b-4 border-transparent border-b-gray-900" />
          
          <div className="space-y-2">
            <div className="flex items-start gap-2">
              <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold mb-1">Confidence Score: {Math.round(normalizedScore)}%</p>
                {reasoning && (
                  <p className="text-xs opacity-90">{reasoning}</p>
                )}
              </div>
            </div>
            
            {dataQuality && (
              <div className="pt-2 border-t border-gray-700">
                <p className="text-xs font-semibold mb-1">Data Quality Notes:</p>
                <p className="text-xs opacity-90">{dataQuality}</p>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
};