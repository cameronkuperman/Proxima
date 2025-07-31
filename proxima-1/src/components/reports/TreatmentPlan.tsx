'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Pill, 
  Heart, 
  Shield, 
  AlertCircle, 
  Info, 
  Clock,
  CheckCircle,
  Activity,
  Utensils,
  Moon,
  Brain,
  ChevronDown,
  ChevronRight,
  AlertTriangle,
  Zap
} from 'lucide-react';
import { Medication } from '@/types/reports';

interface TreatmentPlanProps {
  specialty: string;
  medications?: Medication[];
  lifestyleInterventions?: Record<string, string>;
  preventiveMeasures?: string[];
  immediateActions?: string[];
  monitoringPlan?: string[];
  className?: string;
}

const lifestyleIcons: Record<string, any> = {
  diet: Utensils,
  exercise: Activity,
  sleep: Moon,
  stress: Brain,
  smoking: Shield,
  alcohol: Shield,
  weight: Heart,
  default: Shield
};

export const TreatmentPlan: React.FC<TreatmentPlanProps> = ({
  specialty,
  medications = [],
  lifestyleInterventions = {},
  preventiveMeasures = [],
  immediateActions = [],
  monitoringPlan = [],
  className = ''
}) => {
  const [expandedMedications, setExpandedMedications] = useState<Set<number>>(new Set());
  const [expandedSections, setExpandedSections] = useState({
    medications: true,
    lifestyle: true,
    preventive: false,
    monitoring: false
  });

  const toggleMedication = (index: number) => {
    setExpandedMedications(prev => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  };

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const getLifestyleIcon = (category: string) => {
    const key = category.toLowerCase();
    return lifestyleIcons[key] || lifestyleIcons.default;
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Immediate Actions Alert */}
      {immediateActions.length > 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-red-50 border-2 border-red-200 rounded-xl p-4"
        >
          <h3 className="font-bold text-red-900 mb-3 flex items-center gap-2">
            <Zap className="w-5 h-5" />
            Immediate Actions Required
          </h3>
          <ul className="space-y-2">
            {immediateActions.map((action, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                <span className="text-red-800">{action}</span>
              </li>
            ))}
          </ul>
        </motion.div>
      )}

      {/* Medications Section */}
      {medications.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
        >
          <button
            onClick={() => toggleSection('medications')}
            className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <Pill className="w-5 h-5 text-green-600" />
              <h3 className="font-bold text-gray-900">Medication Recommendations</h3>
              <span className="text-sm text-gray-500">({medications.length})</span>
            </div>
            {expandedSections.medications ? (
              <ChevronDown className="w-5 h-5 text-gray-500" />
            ) : (
              <ChevronRight className="w-5 h-5 text-gray-500" />
            )}
          </button>

          <AnimatePresence>
            {expandedSections.medications && (
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: 'auto' }}
                exit={{ height: 0 }}
                transition={{ duration: 0.2 }}
                className="border-t border-gray-100"
              >
                <div className="p-4 space-y-3">
                  {medications.map((med, idx) => {
                    const isExpanded = expandedMedications.has(idx);
                    
                    return (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className="bg-green-50 border border-green-200 rounded-lg overflow-hidden"
                      >
                        <button
                          onClick={() => toggleMedication(idx)}
                          className="w-full p-4 text-left hover:bg-green-100 transition-colors"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h4 className="font-semibold text-green-900 flex items-center gap-2">
                                <Pill className="w-4 h-4 text-green-600" />
                                {med.medication}
                              </h4>
                              <p className="text-sm text-green-700 mt-1">{med.rationale}</p>
                            </div>
                            {isExpanded ? (
                              <ChevronDown className="w-5 h-5 text-green-600 flex-shrink-0" />
                            ) : (
                              <ChevronRight className="w-5 h-5 text-green-600 flex-shrink-0" />
                            )}
                          </div>
                        </button>

                        <AnimatePresence>
                          {isExpanded && (
                            <motion.div
                              initial={{ height: 0 }}
                              animate={{ height: 'auto' }}
                              exit={{ height: 0 }}
                              transition={{ duration: 0.2 }}
                              className="border-t border-green-200"
                            >
                              <div className="p-4 space-y-3 bg-green-50">
                                {med.instructions && (
                                  <div>
                                    <p className="text-sm font-medium text-green-900 mb-1">Instructions:</p>
                                    <p className="text-sm text-green-700">{med.instructions}</p>
                                  </div>
                                )}
                                {med.monitoring && (
                                  <div>
                                    <p className="text-sm font-medium text-green-900 mb-1 flex items-center gap-2">
                                      <AlertCircle className="w-4 h-4" />
                                      Monitoring Required:
                                    </p>
                                    <p className="text-sm text-green-700">{med.monitoring}</p>
                                  </div>
                                )}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Lifestyle Interventions */}
      {Object.keys(lifestyleInterventions).length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
        >
          <button
            onClick={() => toggleSection('lifestyle')}
            className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <Activity className="w-5 h-5 text-blue-600" />
              <h3 className="font-bold text-gray-900">Lifestyle Modifications</h3>
              <span className="text-sm text-gray-500">({Object.keys(lifestyleInterventions).length})</span>
            </div>
            {expandedSections.lifestyle ? (
              <ChevronDown className="w-5 h-5 text-gray-500" />
            ) : (
              <ChevronRight className="w-5 h-5 text-gray-500" />
            )}
          </button>

          <AnimatePresence>
            {expandedSections.lifestyle && (
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: 'auto' }}
                exit={{ height: 0 }}
                transition={{ duration: 0.2 }}
                className="border-t border-gray-100"
              >
                <div className="p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Object.entries(lifestyleInterventions).map(([category, recommendation], idx) => {
                      const Icon = getLifestyleIcon(category);
                      
                      return (
                        <motion.div
                          key={category}
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: idx * 0.05 }}
                          className="bg-blue-50 border border-blue-200 rounded-lg p-4"
                        >
                          <h4 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                            <Icon className="w-5 h-5 text-blue-600" />
                            {category.charAt(0).toUpperCase() + category.slice(1)}
                          </h4>
                          <p className="text-sm text-blue-700">{recommendation}</p>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Preventive Measures */}
      {preventiveMeasures.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
        >
          <button
            onClick={() => toggleSection('preventive')}
            className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <Shield className="w-5 h-5 text-purple-600" />
              <h3 className="font-bold text-gray-900">Preventive Measures</h3>
              <span className="text-sm text-gray-500">({preventiveMeasures.length})</span>
            </div>
            {expandedSections.preventive ? (
              <ChevronDown className="w-5 h-5 text-gray-500" />
            ) : (
              <ChevronRight className="w-5 h-5 text-gray-500" />
            )}
          </button>

          <AnimatePresence>
            {expandedSections.preventive && (
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: 'auto' }}
                exit={{ height: 0 }}
                transition={{ duration: 0.2 }}
                className="border-t border-gray-100"
              >
                <div className="p-4">
                  <ul className="space-y-2">
                    {preventiveMeasures.map((measure, idx) => (
                      <motion.li
                        key={idx}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className="flex items-start gap-3 p-3 bg-purple-50 rounded-lg"
                      >
                        <CheckCircle className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
                        <span className="text-purple-900">{measure}</span>
                      </motion.li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Monitoring Plan */}
      {monitoringPlan.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
        >
          <button
            onClick={() => toggleSection('monitoring')}
            className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-orange-600" />
              <h3 className="font-bold text-gray-900">Monitoring Plan</h3>
              <span className="text-sm text-gray-500">({monitoringPlan.length})</span>
            </div>
            {expandedSections.monitoring ? (
              <ChevronDown className="w-5 h-5 text-gray-500" />
            ) : (
              <ChevronRight className="w-5 h-5 text-gray-500" />
            )}
          </button>

          <AnimatePresence>
            {expandedSections.monitoring && (
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: 'auto' }}
                exit={{ height: 0 }}
                transition={{ duration: 0.2 }}
                className="border-t border-gray-100"
              >
                <div className="p-4">
                  <ul className="space-y-2">
                    {monitoringPlan.map((item, idx) => (
                      <motion.li
                        key={idx}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className="flex items-start gap-3 p-3 bg-orange-50 rounded-lg"
                      >
                        <Clock className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
                        <span className="text-orange-900">{item}</span>
                      </motion.li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Important Note */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="bg-gray-50 border border-gray-200 rounded-lg p-4"
      >
        <p className="text-sm text-gray-700 flex items-start gap-2">
          <Info className="w-4 h-4 text-gray-500 flex-shrink-0 mt-0.5" />
          This treatment plan is based on AI analysis of your health data. Always consult with your 
          healthcare provider before making any changes to your treatment regimen.
        </p>
      </motion.div>
    </div>
  );
};