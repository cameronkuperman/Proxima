'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Brain, Heart, Activity, Gauge, Info, AlertCircle, TrendingUp, AlertTriangle } from 'lucide-react';
import { ClinicalScale } from '@/types/reports';

interface ClinicalScalesProps {
  scales: Record<string, ClinicalScale>;
  specialty: string;
  className?: string;
}

// Scale configurations
const scaleConfigs = {
  // Neurology scales
  MIDAS: {
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
  HIT6_Estimate: {
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
  ICHD3_Classification: {
    name: 'ICHD-3 Classification',
    description: 'International Classification of Headache Disorders',
    icon: Brain,
    custom: true
  },
  Cognitive_Screen: {
    name: 'Cognitive Screen',
    description: 'Cognitive Function Assessment',
    icon: Brain,
    custom: true
  },
  
  // Cardiology scales
  CHA2DS2_VASc: {
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
  NYHA_Classification: {
    name: 'NYHA Classification',
    description: 'Heart Failure Functional Classification',
    icon: Heart,
    grades: {
      'I': { label: 'No limitation', color: 'green' },
      'II': { label: 'Slight limitation', color: 'yellow' },
      'III': { label: 'Marked limitation', color: 'orange' },
      'IV': { label: 'Severe limitation', color: 'red' }
    }
  },
  CCS_Angina_Grade: {
    name: 'CCS Angina Grade',
    description: 'Canadian Cardiovascular Society Angina Grade',
    icon: Heart,
    grades: {
      'I': { label: 'Ordinary activity does not cause angina', color: 'green' },
      'II': { label: 'Slight limitation of ordinary activity', color: 'yellow' },
      'III': { label: 'Marked limitation of ordinary activity', color: 'orange' },
      'IV': { label: 'Inability to carry on any activity without discomfort', color: 'red' }
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
  PHQ9: {
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
  GAD7: {
    name: 'GAD-7',
    description: 'Anxiety Severity',
    icon: Brain,
    ranges: [
      { min: 0, max: 4, label: 'Minimal anxiety', color: 'green' },
      { min: 5, max: 9, label: 'Mild anxiety', color: 'yellow' },
      { min: 10, max: 14, label: 'Moderate anxiety', color: 'orange' },
      { min: 15, max: 21, label: 'Severe anxiety', color: 'red' }
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
  },
  Columbia_SSR: {
    name: 'Columbia Suicide Risk',
    description: 'Suicide Risk Assessment',
    icon: Brain,
    custom: true
  },
  MADRS: {
    name: 'MADRS',
    description: 'Montgomery-Åsberg Depression Rating Scale',
    icon: Brain,
    ranges: [
      { min: 0, max: 6, label: 'Normal', color: 'green' },
      { min: 7, max: 19, label: 'Mild depression', color: 'yellow' },
      { min: 20, max: 34, label: 'Moderate depression', color: 'orange' },
      { min: 35, max: 60, label: 'Severe depression', color: 'red' }
    ]
  },
  
  // Dermatology scales
  PASI: {
    name: 'PASI',
    description: 'Psoriasis Area and Severity Index',
    icon: Activity,
    ranges: [
      { min: 0, max: 5, label: 'Mild', color: 'green' },
      { min: 5, max: 10, label: 'Moderate', color: 'yellow' },
      { min: 10, max: 20, label: 'Severe', color: 'orange' },
      { min: 20, max: 72, label: 'Very severe', color: 'red' }
    ]
  },
  DLQI: {
    name: 'DLQI',
    description: 'Dermatology Life Quality Index',
    icon: Activity,
    ranges: [
      { min: 0, max: 1, label: 'No effect', color: 'green' },
      { min: 2, max: 5, label: 'Small effect', color: 'yellow' },
      { min: 6, max: 10, label: 'Moderate effect', color: 'orange' },
      { min: 11, max: 20, label: 'Very large effect', color: 'red' },
      { min: 21, max: 30, label: 'Extremely large effect', color: 'red' }
    ]
  },
  IGA: {
    name: 'IGA',
    description: 'Investigator Global Assessment',
    icon: Activity,
    grades: {
      '0': { label: 'Clear', color: 'green' },
      '1': { label: 'Almost clear', color: 'green' },
      '2': { label: 'Mild', color: 'yellow' },
      '3': { label: 'Moderate', color: 'orange' },
      '4': { label: 'Severe', color: 'red' }
    }
  },
  
  // Gastroenterology scales
  Rome_IV_Assessment: {
    name: 'Rome IV',
    description: 'Functional GI Disorder Criteria',
    icon: Activity,
    custom: true
  },
  Bristol_Stool_Pattern: {
    name: 'Bristol Stool Scale',
    description: 'Stool Consistency Classification',
    icon: Activity,
    grades: {
      '1': { label: 'Separate hard lumps', color: 'red' },
      '2': { label: 'Lumpy and sausage-like', color: 'orange' },
      '3': { label: 'Sausage with cracks', color: 'yellow' },
      '4': { label: 'Smooth soft sausage', color: 'green' },
      '5': { label: 'Soft blobs', color: 'green' },
      '6': { label: 'Fluffy pieces', color: 'yellow' },
      '7': { label: 'Watery', color: 'red' }
    }
  },
  IBS_SSS: {
    name: 'IBS-SSS',
    description: 'IBS Symptom Severity Score',
    icon: Activity,
    ranges: [
      { min: 0, max: 175, label: 'Mild', color: 'green' },
      { min: 175, max: 300, label: 'Moderate', color: 'yellow' },
      { min: 300, max: 500, label: 'Severe', color: 'red' }
    ]
  },
  GERD_Assessment: {
    name: 'GERD Assessment',
    description: 'Gastroesophageal Reflux Disease Assessment',
    icon: Activity,
    custom: true
  },
  
  // Endocrinology scales
  FINDRISC: {
    name: 'FINDRISC',
    description: 'Type 2 Diabetes Risk Score',
    icon: Activity,
    ranges: [
      { min: 0, max: 6, label: 'Low risk', color: 'green' },
      { min: 7, max: 11, label: 'Slightly elevated', color: 'yellow' },
      { min: 12, max: 14, label: 'Moderate risk', color: 'orange' },
      { min: 15, max: 20, label: 'High risk', color: 'red' },
      { min: 21, max: 26, label: 'Very high risk', color: 'red' }
    ]
  },
  Thyroid_Symptom_Score: {
    name: 'Thyroid Symptom Score',
    description: 'Thyroid Function Assessment',
    icon: Activity,
    custom: true
  },
  Metabolic_Syndrome_Components: {
    name: 'Metabolic Syndrome',
    description: 'Metabolic Syndrome Component Assessment',
    icon: Activity,
    custom: true
  },
  
  // Pulmonology scales
  mMRC_Dyspnea: {
    name: 'mMRC Dyspnea Scale',
    description: 'Modified Medical Research Council Dyspnea Scale',
    icon: Activity,
    grades: {
      '0': { label: 'Breathless only with strenuous exercise', color: 'green' },
      '1': { label: 'Short of breath when hurrying or on slight hill', color: 'yellow' },
      '2': { label: 'Walks slower than peers, stops for breath', color: 'orange' },
      '3': { label: 'Stops for breath after 100 yards', color: 'red' },
      '4': { label: 'Too breathless to leave house', color: 'red' }
    }
  },
  CAT_Score: {
    name: 'CAT Score',
    description: 'COPD Assessment Test',
    icon: Activity,
    ranges: [
      { min: 0, max: 10, label: 'Low impact', color: 'green' },
      { min: 11, max: 20, label: 'Medium impact', color: 'yellow' },
      { min: 21, max: 30, label: 'High impact', color: 'orange' },
      { min: 31, max: 40, label: 'Very high impact', color: 'red' }
    ]
  },
  ACT_Score: {
    name: 'ACT Score',
    description: 'Asthma Control Test',
    icon: Activity,
    ranges: [
      { min: 20, max: 25, label: 'Well controlled', color: 'green' },
      { min: 16, max: 19, label: 'Not well controlled', color: 'yellow' },
      { min: 5, max: 15, label: 'Very poorly controlled', color: 'red' }
    ]
  },
  STOP_BANG: {
    name: 'STOP-BANG',
    description: 'Sleep Apnea Risk Assessment',
    icon: Activity,
    ranges: [
      { min: 0, max: 2, label: 'Low risk', color: 'green' },
      { min: 3, max: 4, label: 'Intermediate risk', color: 'yellow' },
      { min: 5, max: 8, label: 'High risk', color: 'red' }
    ]
  }
};

export const ClinicalScales: React.FC<ClinicalScalesProps> = ({ 
  scales, 
  specialty,
  className = '' 
}) => {
  const getScaleColor = (scaleName: string, scale: ClinicalScale) => {
    const config = scaleConfigs[scaleName as keyof typeof scaleConfigs];
    if (!config) return 'gray';

    if (scale.grade && 'grades' in config && config.grades) {
      return (config.grades as any)[scale.grade]?.color || 'gray';
    }

    if (scale.score !== undefined && 'ranges' in config && config.ranges) {
      const range = config.ranges.find(r => scale.score! >= r.min && scale.score! <= r.max);
      return range?.color || 'gray';
    }

    if (scale.calculated !== undefined && 'interpretation' in config && config.interpretation) {
      const level = Math.min(scale.calculated, Object.keys(config.interpretation).length - 1);
      return (config.interpretation as any)[level]?.color || 'gray';
    }

    return 'gray';
  };

  const renderScale = (scaleName: string, scale: ClinicalScale) => {
    const config = scaleConfigs[scaleName as keyof typeof scaleConfigs];
    if (!config) {
      // Handle unknown scales with a generic display
      return (
        <motion.div
          key={scaleName}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="rounded-xl border-2 p-6 bg-gray-50 border-gray-200 text-gray-900"
        >
          <div className="flex items-start justify-between mb-4">
            <div>
              <h4 className="font-bold text-lg flex items-center gap-2">
                <Gauge className="w-5 h-5 text-gray-600" />
                {scaleName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </h4>
              <p className="text-sm opacity-80 mt-1">Clinical Assessment Scale</p>
            </div>
            
            {/* Display any available score/value */}
            <div className="text-right">
              {scale.score !== undefined && (
                <div className="text-3xl font-bold">{scale.score}</div>
              )}
              {scale.calculated !== undefined && (
                <div className="text-3xl font-bold">{scale.calculated}</div>
              )}
              {scale.severity && (
                <div className="text-lg font-semibold capitalize">{scale.severity}</div>
              )}
            </div>
          </div>
          
          {scale.interpretation && (
            <p className="text-sm mb-2">{scale.interpretation}</p>
          )}
          
          {scale.confidence !== undefined && (
            <p className="text-sm text-gray-600">
              Confidence: {Math.round(scale.confidence * 100)}%
            </p>
          )}
        </motion.div>
      );
    }

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
        className={`rounded-xl border-2 p-6 ${colorClasses[color as keyof typeof colorClasses] || colorClasses.gray}`}
      >
        <div className="flex items-start justify-between mb-4">
          <div>
            <h4 className="font-bold text-lg flex items-center gap-2">
              <Icon className={`w-5 h-5 ${iconColorClasses[color as keyof typeof iconColorClasses] || iconColorClasses.gray}`} />
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
            {scale.severity && (
              <div className="text-lg font-semibold capitalize">{scale.severity}</div>
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

        {/* Confidence and Reasoning */}
        {(scale.confidence !== undefined || scale.reasoning) && (
          <div className="mb-4 space-y-2">
            {scale.confidence !== undefined && (
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Confidence:</span>
                <span className={`text-sm font-bold ${
                  scale.confidence >= 0.8 ? 'text-green-600' :
                  scale.confidence >= 0.6 ? 'text-yellow-600' :
                  'text-red-600'
                }`}>
                  {Math.round(scale.confidence * 100)}%
                  {scale.confidence_level && ` (${scale.confidence_level})`}
                </span>
              </div>
            )}
            {scale.reasoning && (
              <p className="text-xs text-gray-600 italic">{scale.reasoning}</p>
            )}
          </div>
        )}

        {/* Visual scale representation */}
        {'ranges' in config && config.ranges && scale.score !== undefined && (
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
              <span>{(config as any).ranges[config.ranges.length - 1].max}</span>
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

        {/* Additional scale-specific information */}
        {scale.annual_stroke_risk && (
          <div className="mt-2 p-2 bg-red-50 rounded-md">
            <p className="text-sm font-medium text-red-900">Annual Stroke Risk: {scale.annual_stroke_risk}</p>
          </div>
        )}
        
        {scale.treatment_recommendation && (
          <div className="mt-2 p-2 bg-blue-50 rounded-md">
            <p className="text-sm text-blue-900">{scale.treatment_recommendation}</p>
          </div>
        )}
        
        {scale.risk_level && (
          <div className="mt-2">
            <span className={`text-sm font-medium px-2 py-1 rounded-full ${
              scale.risk_level.toLowerCase().includes('low') ? 'bg-green-100 text-green-800' :
              scale.risk_level.toLowerCase().includes('moderate') ? 'bg-yellow-100 text-yellow-800' :
              'bg-red-100 text-red-800'
            }`}>
              Risk Level: {scale.risk_level}
            </span>
          </div>
        )}
        
        {scale.suicide_risk && (
          <div className="mt-2 p-2 bg-red-100 border border-red-300 rounded-md">
            <p className="text-sm font-bold text-red-900 flex items-center gap-1">
              <AlertCircle className="w-4 h-4" />
              Suicide Risk: {scale.suicide_risk}
            </p>
            {scale.protective_factors && scale.protective_factors.length > 0 && (
              <div className="mt-1">
                <p className="text-xs font-medium text-red-800">Protective Factors:</p>
                <ul className="text-xs text-red-700 list-disc list-inside">
                  {scale.protective_factors.map((factor, idx) => (
                    <li key={idx}>{factor}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
        
        {/* Missing data notice */}
        {scale.missing_data && scale.missing_data.length > 0 && (
          <div className="mt-2 p-2 bg-yellow-50 rounded-md">
            <p className="text-xs font-medium text-yellow-800 mb-1">Data needed for better accuracy:</p>
            <ul className="text-xs text-yellow-700 list-disc list-inside">
              {scale.missing_data.map((item, idx) => (
                <li key={idx}>{item}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Recommendations based on score */}
        {'interpretation' in config && config.interpretation && scale.calculated !== undefined && (
          <div className="mt-4 pt-4 border-t border-current border-opacity-20">
            {(config.interpretation as any)[Math.min(scale.calculated, Object.keys(config.interpretation).length - 1)]?.recommendation && (
              <p className="text-sm flex items-start gap-2">
                <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
                {(config.interpretation as any)[Math.min(scale.calculated, Object.keys(config.interpretation).length - 1)].recommendation}
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