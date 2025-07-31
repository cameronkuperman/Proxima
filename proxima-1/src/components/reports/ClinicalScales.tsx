'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Brain, Heart, Activity, Gauge, Info, AlertCircle, TrendingUp } from 'lucide-react';
import { ClinicalScale } from '@/types/reports';

interface ClinicalScalesProps {
  scales: Record<string, ClinicalScale>;
  specialty: string;
  className?: string;
}

// Scale configurations
const scaleConfigs = {
  // Neurology scales
  midas_score: {
    name: 'MIDAS Score',
    description: 'Migraine Disability Assessment',
    icon: Brain,
    grades: {
      'I': { label: 'Minimal disability', color: 'green', range: '0-5' },
      'II': { label: 'Mild disability', color: 'yellow', range: '6-10' },
      'III': { label: 'Moderate disability', color: 'orange', range: '11-20' },
      'IV': { label: 'Severe disability', color: 'red', range: '21+' }
    }
  },
  hit6: {
    name: 'HIT-6',
    description: 'Headache Impact Test',
    icon: Brain,
    ranges: [
      { min: 36, max: 49, label: 'Little to no impact', color: 'green' },
      { min: 50, max: 55, label: 'Some impact', color: 'yellow' },
      { min: 56, max: 59, label: 'Substantial impact', color: 'orange' },
      { min: 60, max: 78, label: 'Severe impact', color: 'red' }
    ]
  },
  
  // Cardiology scales
  chad2ds2_vasc: {
    name: 'CHA₂DS₂-VASc',
    description: 'Stroke Risk in Atrial Fibrillation',
    icon: Heart,
    interpretation: {
      0: { risk: 'Low', color: 'green', recommendation: 'No anticoagulation needed' },
      1: { risk: 'Low-Moderate', color: 'yellow', recommendation: 'Consider anticoagulation' },
      2: { risk: 'Moderate', color: 'orange', recommendation: 'Anticoagulation recommended' },
      3: { risk: 'High', color: 'red', recommendation: 'Anticoagulation strongly recommended' }
    }
  },
  has_bled: {
    name: 'HAS-BLED',
    description: 'Bleeding Risk Score',
    icon: Heart,
    interpretation: {
      0: { risk: 'Low', color: 'green' },
      1: { risk: 'Low', color: 'green' },
      2: { risk: 'Moderate', color: 'yellow' },
      3: { risk: 'High', color: 'orange' },
      4: { risk: 'Very High', color: 'red' }
    }
  },
  
  // Psychiatry scales
  phq9: {
    name: 'PHQ-9',
    description: 'Depression Severity',
    icon: Brain,
    ranges: [
      { min: 0, max: 4, label: 'Minimal depression', color: 'green' },
      { min: 5, max: 9, label: 'Mild depression', color: 'yellow' },
      { min: 10, max: 14, label: 'Moderate depression', color: 'orange' },
      { min: 15, max: 19, label: 'Moderately severe', color: 'red' },
      { min: 20, max: 27, label: 'Severe depression', color: 'red' }
    ]
  },
  gad7: {
    name: 'GAD-7',
    description: 'Anxiety Severity',
    icon: Brain,
    ranges: [
      { min: 0, max: 4, label: 'Minimal anxiety', color: 'green' },
      { min: 5, max: 9, label: 'Mild anxiety', color: 'yellow' },
      { min: 10, max: 14, label: 'Moderate anxiety', color: 'orange' },
      { min: 15, max: 21, label: 'Severe anxiety', color: 'red' }
    ]
  }
};

export const ClinicalScales: React.FC<ClinicalScalesProps> = ({ 
  scales, 
  specialty,
  className = '' 
}) => {
  const getScaleColor = (scaleName: string, scale: ClinicalScale) => {
    const config = scaleConfigs[scaleName];
    if (!config) return 'gray';

    if (scale.grade && config.grades) {
      return config.grades[scale.grade]?.color || 'gray';
    }

    if (scale.score !== undefined && config.ranges) {
      const range = config.ranges.find(r => scale.score! >= r.min && scale.score! <= r.max);
      return range?.color || 'gray';
    }

    if (scale.calculated !== undefined && config.interpretation) {
      const level = Math.min(scale.calculated, Object.keys(config.interpretation).length - 1);
      return config.interpretation[level]?.color || 'gray';
    }

    return 'gray';
  };

  const renderScale = (scaleName: string, scale: ClinicalScale) => {
    const config = scaleConfigs[scaleName];
    if (!config) return null;

    const Icon = config.icon;
    const color = getScaleColor(scaleName, scale);
    
    const colorClasses = {
      green: 'bg-green-50 border-green-200 text-green-900',
      yellow: 'bg-yellow-50 border-yellow-200 text-yellow-900',
      orange: 'bg-orange-50 border-orange-200 text-orange-900',
      red: 'bg-red-50 border-red-200 text-red-900',
      gray: 'bg-gray-50 border-gray-200 text-gray-900'
    };

    const iconColorClasses = {
      green: 'text-green-600',
      yellow: 'text-yellow-600',
      orange: 'text-orange-600',
      red: 'text-red-600',
      gray: 'text-gray-600'
    };

    return (
      <motion.div
        key={scaleName}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`rounded-xl border-2 p-6 ${colorClasses[color]}`}
      >
        <div className="flex items-start justify-between mb-4">
          <div>
            <h4 className="font-bold text-lg flex items-center gap-2">
              <Icon className={`w-5 h-5 ${iconColorClasses[color]}`} />
              {config.name}
            </h4>
            <p className="text-sm opacity-80 mt-1">{config.description}</p>
          </div>
          
          {/* Score display */}
          <div className="text-right">
            {scale.score !== undefined && (
              <div className="text-3xl font-bold">{scale.score}</div>
            )}
            {scale.calculated !== undefined && (
              <div className="text-3xl font-bold">{scale.calculated}</div>
            )}
            {scale.grade && (
              <div className="text-2xl font-bold">Grade {scale.grade}</div>
            )}
          </div>
        </div>

        {/* Interpretation */}
        {scale.interpretation && (
          <div className="mb-4">
            <p className="font-medium text-sm mb-1">Interpretation:</p>
            <p className="text-sm">{scale.interpretation}</p>
          </div>
        )}

        {/* Visual scale representation */}
        {config.ranges && scale.score !== undefined && (
          <div className="mb-4">
            <div className="flex items-center gap-1">
              {config.ranges.map((range, idx) => {
                const isActive = scale.score! >= range.min && scale.score! <= range.max;
                return (
                  <div
                    key={idx}
                    className={`flex-1 h-2 rounded-full transition-all ${
                      isActive 
                        ? `bg-${range.color}-500` 
                        : 'bg-gray-200'
                    }`}
                  />
                );
              })}
            </div>
            <div className="flex justify-between text-xs mt-1 opacity-60">
              <span>0</span>
              <span>{config.ranges[config.ranges.length - 1].max}</span>
            </div>
          </div>
        )}

        {/* Breakdown if available */}
        {scale.breakdown && Object.keys(scale.breakdown).length > 0 && (
          <div className="mt-4 pt-4 border-t border-current border-opacity-20">
            <p className="font-medium text-sm mb-2">Score Breakdown:</p>
            <div className="space-y-1">
              {Object.entries(scale.breakdown).map(([key, value]) => (
                <div key={key} className="flex justify-between text-sm">
                  <span className="opacity-80">
                    {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}:
                  </span>
                  <span className="font-medium">{value as string}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recommendations based on score */}
        {config.interpretation && scale.calculated !== undefined && (
          <div className="mt-4 pt-4 border-t border-current border-opacity-20">
            {config.interpretation[Math.min(scale.calculated, Object.keys(config.interpretation).length - 1)]?.recommendation && (
              <p className="text-sm flex items-start gap-2">
                <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
                {config.interpretation[Math.min(scale.calculated, Object.keys(config.interpretation).length - 1)].recommendation}
              </p>
            )}
          </div>
        )}
      </motion.div>
    );
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Object.entries(scales).map(([scaleName, scale]) => 
          renderScale(scaleName, scale)
        )}
      </div>

      {/* Clinical significance note */}
      {Object.keys(scales).length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6"
        >
          <p className="text-sm text-blue-800 flex items-start gap-2">
            <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
            These clinical scales are standardized assessment tools used by healthcare professionals 
            to evaluate symptom severity and guide treatment decisions.
          </p>
        </motion.div>
      )}
    </div>
  );
};