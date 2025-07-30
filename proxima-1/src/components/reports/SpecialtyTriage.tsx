'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Heart,
  Brain,
  Activity,
  Palette,
  Cookie,
  Wind,
  BrainCircuit,
  AlertTriangle,
  CheckCircle,
  ArrowRight,
  Sparkles,
  Loader2,
  AlertCircle,
  Info,
  Stethoscope
} from 'lucide-react';
import { reportApi } from '@/lib/api/reports';
import { SpecialtyType } from '@/types/reports';

interface TriageResult {
  primary_specialty: SpecialtyType;
  confidence: number;
  reasoning: string;
  secondary_specialties?: Array<{
    specialty: SpecialtyType;
    confidence: number;
    reason: string;
  }>;
  urgency: 'routine' | 'urgent' | 'emergent';
  red_flags?: string[];
  recommended_timing: string;
}

interface SpecialtyTriageProps {
  userId?: string;
  onSpecialtySelected: (specialty: SpecialtyType, triageResult: TriageResult) => void;
  initialConcern?: string;
  symptoms?: string[];
}

const specialtyInfo = {
  cardiology: {
    icon: Heart,
    color: 'red',
    description: 'Heart and blood vessel conditions'
  },
  neurology: {
    icon: Brain,
    color: 'purple',
    description: 'Brain and nervous system disorders'
  },
  psychiatry: {
    icon: BrainCircuit,
    color: 'blue',
    description: 'Mental health and emotional wellbeing'
  },
  dermatology: {
    icon: Palette,
    color: 'orange',
    description: 'Skin, hair, and nail conditions'
  },
  gastroenterology: {
    icon: Cookie,
    color: 'green',
    description: 'Digestive system disorders'
  },
  pulmonology: {
    icon: Wind,
    color: 'cyan',
    description: 'Lung and breathing problems'
  },
  endocrinology: {
    icon: Activity,
    color: 'indigo',
    description: 'Hormone and metabolic disorders'
  },
  'primary-care': {
    icon: Stethoscope,
    color: 'gray',
    description: 'General health and wellness'
  }
};

const urgencyColors = {
  routine: {
    bg: 'bg-green-50',
    border: 'border-green-200',
    text: 'text-green-800',
    icon: CheckCircle,
    iconColor: 'text-green-600'
  },
  urgent: {
    bg: 'bg-yellow-50',
    border: 'border-yellow-200',
    text: 'text-yellow-800',
    icon: AlertCircle,
    iconColor: 'text-yellow-600'
  },
  emergent: {
    bg: 'bg-red-50',
    border: 'border-red-200',
    text: 'text-red-800',
    icon: AlertTriangle,
    iconColor: 'text-red-600'
  }
};

export const SpecialtyTriage: React.FC<SpecialtyTriageProps> = ({
  userId,
  onSpecialtySelected,
  initialConcern = '',
  symptoms = []
}) => {
  const [primaryConcern, setPrimaryConcern] = useState(initialConcern);
  const [isLoading, setIsLoading] = useState(false);
  const [triageResult, setTriageResult] = useState<TriageResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const runTriage = async () => {
    if (!primaryConcern.trim() && symptoms.length === 0) {
      setError('Please describe your health concern');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_ORACLE_API_URL}/api/report/specialty-triage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          primary_concern: primaryConcern,
          symptoms: symptoms.length > 0 ? symptoms : undefined,
          urgency: 'routine' // Let AI determine actual urgency
        })
      });

      if (!response.ok) {
        throw new Error('Failed to run triage');
      }

      const data = await response.json();
      
      if (data.status === 'success' && data.triage_result) {
        setTriageResult(data.triage_result);
      } else {
        throw new Error('Invalid response from triage service');
      }
    } catch (err) {
      setError('Unable to analyze your symptoms. Please try again.');
      console.error('Triage error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const SpecialtyCard = ({ 
    specialty, 
    confidence, 
    reasoning, 
    isPrimary = false 
  }: { 
    specialty: SpecialtyType | string;
    confidence: number;
    reasoning: string;
    isPrimary?: boolean;
  }) => {
    const info = specialtyInfo[specialty as keyof typeof specialtyInfo] || specialtyInfo['primary-care'];
    const Icon = info.icon;
    
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`
          relative overflow-hidden rounded-xl p-6
          ${isPrimary ? 'bg-gradient-to-br from-white to-gray-50 shadow-lg border-2' : 'bg-white shadow-sm border'}
          ${isPrimary ? `border-${info.color}-200` : 'border-gray-200'}
          hover:shadow-lg transition-all duration-300
        `}
      >
        {isPrimary && (
          <div className="absolute top-2 right-2">
            <span className="px-3 py-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-xs font-semibold rounded-full">
              Recommended
            </span>
          </div>
        )}
        
        <div className="flex items-start gap-4">
          <div className={`
            p-3 rounded-xl bg-gradient-to-br 
            ${info.color === 'red' ? 'from-red-100 to-red-50' : ''}
            ${info.color === 'purple' ? 'from-purple-100 to-purple-50' : ''}
            ${info.color === 'blue' ? 'from-blue-100 to-blue-50' : ''}
            ${info.color === 'orange' ? 'from-orange-100 to-orange-50' : ''}
            ${info.color === 'green' ? 'from-green-100 to-green-50' : ''}
            ${info.color === 'cyan' ? 'from-cyan-100 to-cyan-50' : ''}
            ${info.color === 'indigo' ? 'from-indigo-100 to-indigo-50' : ''}
            ${info.color === 'gray' ? 'from-gray-100 to-gray-50' : ''}
          `}>
            <Icon className={`w-8 h-8 text-${info.color}-600`} />
          </div>
          
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 capitalize mb-1">
              {specialty.replace('_', ' ')}
            </h3>
            <p className="text-sm text-gray-600 mb-3">{info.description}</p>
            
            <div className="space-y-3">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium text-gray-500">Match Confidence</span>
                  <span className="text-xs font-bold text-gray-700">{Math.round(confidence * 100)}%</span>
                </div>
                <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${confidence * 100}%` }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className={`h-full bg-gradient-to-r 
                      ${confidence > 0.7 ? 'from-green-500 to-green-600' : 
                        confidence > 0.4 ? 'from-yellow-500 to-yellow-600' : 
                        'from-gray-400 to-gray-500'}`}
                  />
                </div>
              </div>
              
              <p className="text-sm text-gray-700 leading-relaxed">{reasoning}</p>
              
              {isPrimary && (
                <button
                  onClick={() => onSpecialtySelected(specialty as SpecialtyType, triageResult!)}
                  className={`
                    w-full mt-4 px-4 py-3 rounded-lg font-medium
                    bg-gradient-to-r from-${info.color}-600 to-${info.color}-700
                    text-white hover:shadow-lg transform hover:-translate-y-0.5
                    transition-all duration-200 flex items-center justify-center gap-2
                  `}
                >
                  Generate {specialty} Report
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="inline-flex p-3 bg-gradient-to-br from-blue-100 to-purple-100 rounded-2xl mb-4"
        >
          <Sparkles className="w-8 h-8 text-purple-600" />
        </motion.div>
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Find the Right Specialist</h2>
        <p className="text-gray-600">
          Describe your symptoms and we'll recommend the most appropriate medical specialist
        </p>
      </div>

      {/* Input Section */}
      {!triageResult && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
        >
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Describe your main health concern
          </label>
          <textarea
            value={primaryConcern}
            onChange={(e) => setPrimaryConcern(e.target.value)}
            placeholder="Example: I've been having chest pain when walking up stairs..."
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
            rows={4}
          />
          
          {symptoms.length > 0 && (
            <div className="mt-4">
              <p className="text-sm text-gray-600 mb-2">Additional symptoms detected:</p>
              <div className="flex flex-wrap gap-2">
                {symptoms.map((symptom, idx) => (
                  <span key={idx} className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm">
                    {symptom}
                  </span>
                ))}
              </div>
            </div>
          )}
          
          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}
          
          <button
            onClick={runTriage}
            disabled={isLoading}
            className="w-full mt-6 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-medium hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Analyzing your symptoms...
              </>
            ) : (
              <>
                Get Specialist Recommendation
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </motion.div>
      )}

      {/* Triage Results */}
      {triageResult && (
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-6"
          >
            {/* Urgency Banner */}
            {triageResult.urgency !== 'routine' && (
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className={`
                  p-4 rounded-lg border-2 flex items-start gap-3
                  ${urgencyColors[triageResult.urgency].bg}
                  ${urgencyColors[triageResult.urgency].border}
                `}
              >
                {React.createElement(urgencyColors[triageResult.urgency].icon, {
                  className: `w-6 h-6 ${urgencyColors[triageResult.urgency].iconColor} flex-shrink-0`
                })}
                <div className="flex-1">
                  <h3 className={`font-semibold ${urgencyColors[triageResult.urgency].text}`}>
                    {triageResult.urgency === 'emergent' ? 'Immediate Medical Attention Recommended' :
                     triageResult.urgency === 'urgent' ? 'Prompt Medical Evaluation Recommended' :
                     'Routine Evaluation Appropriate'}
                  </h3>
                  <p className={`text-sm mt-1 ${urgencyColors[triageResult.urgency].text}`}>
                    Recommended timing: {triageResult.recommended_timing}
                  </p>
                </div>
              </motion.div>
            )}

            {/* Red Flags */}
            {triageResult.red_flags && triageResult.red_flags.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-red-50 border border-red-200 rounded-lg p-4"
              >
                <h3 className="font-semibold text-red-900 mb-2 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5" />
                  Important Warning Signs Detected
                </h3>
                <ul className="space-y-1">
                  {triageResult.red_flags.map((flag, idx) => (
                    <li key={idx} className="text-sm text-red-800 flex items-start gap-2">
                      <span className="text-red-600 mt-0.5">•</span>
                      {flag}
                    </li>
                  ))}
                </ul>
              </motion.div>
            )}

            {/* Primary Recommendation */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                Recommended Specialist
              </h3>
              <SpecialtyCard
                specialty={triageResult.primary_specialty}
                confidence={triageResult.confidence}
                reasoning={triageResult.reasoning}
                isPrimary={true}
              />
            </div>

            {/* Secondary Options */}
            {triageResult.secondary_specialties && triageResult.secondary_specialties.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Info className="w-5 h-5 text-blue-600" />
                  Alternative Specialists to Consider
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {triageResult.secondary_specialties.map((spec, idx) => (
                    <SpecialtyCard
                      key={idx}
                      specialty={spec.specialty}
                      confidence={spec.confidence}
                      reasoning={spec.reason}
                      isPrimary={false}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-4 pt-4">
              <button
                onClick={() => {
                  setTriageResult(null);
                  setPrimaryConcern('');
                }}
                className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
              >
                Start Over
              </button>
              <button
                onClick={() => onSpecialtySelected('primary-care' as SpecialtyType, triageResult)}
                className="flex-1 px-6 py-3 bg-gray-600 text-white rounded-lg font-medium hover:bg-gray-700 transition-colors"
              >
                Generate Primary Care Report Instead
              </button>
            </div>
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
};