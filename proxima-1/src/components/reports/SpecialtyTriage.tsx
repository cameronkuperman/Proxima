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
  Stethoscope,
  Zap,
  MessageSquare
} from 'lucide-react';
import { reportApi } from '@/lib/api/reports';
import { SpecialtyType } from '@/types/reports';
import { useEffect } from 'react';
import { Calendar, Clock, FileText, ChevronUp, ChevronDown } from 'lucide-react';

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

interface QuickScan {
  id: string;
  created_at: string;
  body_part: string;
  urgency_level: string;
  symptoms?: string[];
  summary?: string;
}

interface DeepDive {
  id: string;
  created_at: string;
  body_part: string;
  status: string;
  symptoms?: string[];
  analysis_complete?: boolean;
}

interface SpecialtyTriageProps {
  userId?: string;
  onSpecialtySelected: (specialty: SpecialtyType, triageResult: TriageResult, selectedIds: {
    quick_scan_ids: string[];
    deep_dive_ids: string[];
    general_assessment_ids: string[];
    general_deep_dive_ids: string[];
    flash_assessment_ids: string[];
  }) => void;
  initialConcern?: string;
  symptoms?: string[];
  quickScans?: QuickScan[];
  deepDives?: DeepDive[];
  flashAssessments?: any[];
  generalAssessments?: any[];
  generalDeepDives?: any[];
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
  symptoms = [],
  quickScans = [],
  deepDives = [],
  flashAssessments = [],
  generalAssessments = [],
  generalDeepDives = []
}) => {
  const [primaryConcern, setPrimaryConcern] = useState(initialConcern);
  const [selectedQuickScans, setSelectedQuickScans] = useState<string[]>(quickScans.map(scan => scan.id));
  const [selectedDeepDives, setSelectedDeepDives] = useState<string[]>(deepDives.map(dive => dive.id));
  const [selectedFlashAssessments, setSelectedFlashAssessments] = useState<string[]>(flashAssessments.map(a => a.id));
  const [selectedGeneralAssessments, setSelectedGeneralAssessments] = useState<string[]>(generalAssessments.map(a => a.id));
  const [selectedGeneralDeepDives, setSelectedGeneralDeepDives] = useState<string[]>(generalDeepDives.map(a => a.id));
  const [isLoading, setIsLoading] = useState(false);
  const [triageResult, setTriageResult] = useState<TriageResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState({ 
    quickScans: true, 
    deepDives: true,
    flashAssessments: true,
    generalAssessments: true,
    generalDeepDives: true
  });

  const runTriage = async () => {
    // Check if ANY assessments are selected
    const hasSelections = selectedQuickScans.length > 0 || 
                         selectedDeepDives.length > 0 || 
                         selectedFlashAssessments.length > 0 || 
                         selectedGeneralAssessments.length > 0 || 
                         selectedGeneralDeepDives.length > 0;
    
    if (!primaryConcern.trim() && symptoms.length === 0 && !hasSelections) {
      setError('Please describe your health concern or select previous analyses');
      return;
    }

    setIsLoading(true);
    setError(null);

    console.log('=== RUNNING SPECIALTY TRIAGE ===');
    console.log('Primary Concern:', primaryConcern);
    console.log('Symptoms:', symptoms);
    console.log('Selected Quick Scans:', selectedQuickScans);
    console.log('Selected Deep Dives:', selectedDeepDives);
    console.log('User ID:', userId);

    try {
      const triageUrl = `${process.env.NEXT_PUBLIC_ORACLE_API_URL}/api/report/specialty-triage`;
      console.log('Triage URL:', triageUrl);
      
      const requestBody: any = {
        user_id: userId
      };
      
      // Only include fields with actual selections to avoid sending empty arrays
      if (selectedQuickScans.length > 0) {
        requestBody.quick_scan_ids = selectedQuickScans;
      }
      if (selectedDeepDives.length > 0) {
        requestBody.deep_dive_ids = selectedDeepDives;
      }
      if (selectedFlashAssessments.length > 0) {
        requestBody.flash_assessment_ids = selectedFlashAssessments;
      }
      if (selectedGeneralAssessments.length > 0) {
        requestBody.general_assessment_ids = selectedGeneralAssessments;
      }
      if (selectedGeneralDeepDives.length > 0) {
        requestBody.general_deep_dive_ids = selectedGeneralDeepDives;
      }
      if (primaryConcern && primaryConcern.trim()) {
        requestBody.primary_concern = primaryConcern;
      }
      if (symptoms && symptoms.length > 0) {
        requestBody.symptoms = symptoms;
      }
      console.log('Request Body:', requestBody);

      const response = await fetch(triageUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });

      console.log('Response Status:', response.status);
      console.log('Response OK:', response.ok);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Triage Error Response:', errorText);
        throw new Error(`Failed to run triage: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log('Triage Response Data:', data);
      
      // Handle multiple response formats from backend
      let triageData = null;
      
      if (data.status === 'success' && data.triage_result) {
        // Wrapped response format
        triageData = data.triage_result;
      } else if (data.primary_specialty && data.confidence) {
        // Direct response format
        triageData = data;
      } else {
        console.error('Unexpected triage response format:', data);
        throw new Error('Invalid response format from triage service');
      }
      
      setTriageResult(triageData);
    } catch (err) {
      console.error('Triage error:', err);
      setError('Unable to analyze your symptoms. Please try again.');
      
      // Fallback: Set a default triage result for testing
      console.warn('Using fallback triage result for testing');
      setTriageResult({
        primary_specialty: 'primary-care' as SpecialtyType,
        confidence: 0.7,
        reasoning: 'Unable to determine specialty - defaulting to primary care',
        urgency: 'routine' as const,
        recommended_timing: 'Schedule at your convenience'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const toggleScan = (scanId: string, type: 'quick' | 'deep' | 'flash' | 'general' | 'generalDeep') => {
    switch (type) {
      case 'quick':
        setSelectedQuickScans(prev => 
          prev.includes(scanId) 
            ? prev.filter(id => id !== scanId)
            : [...prev, scanId]
        );
        break;
      case 'deep':
        setSelectedDeepDives(prev => 
          prev.includes(scanId) 
            ? prev.filter(id => id !== scanId)
            : [...prev, scanId]
        );
        break;
      case 'flash':
        setSelectedFlashAssessments(prev => 
          prev.includes(scanId) 
            ? prev.filter(id => id !== scanId)
            : [...prev, scanId]
        );
        break;
      case 'general':
        setSelectedGeneralAssessments(prev => 
          prev.includes(scanId) 
            ? prev.filter(id => id !== scanId)
            : [...prev, scanId]
        );
        break;
      case 'generalDeep':
        setSelectedGeneralDeepDives(prev => 
          prev.includes(scanId) 
            ? prev.filter(id => id !== scanId)
            : [...prev, scanId]
        );
        break;
    }
  };

  const toggleSection = (section: 'quickScans' | 'deepDives' | 'flashAssessments' | 'generalAssessments' | 'generalDeepDives') => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
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
                  onClick={() => {
                    console.log('=== SPECIALTY CARD BUTTON CLICKED ===');
                    console.log('Specialty:', specialty);
                    console.log('Selected Quick Scans:', selectedQuickScans);
                    console.log('Selected Deep Dives:', selectedDeepDives);
                    console.log('Triage Result:', triageResult);
                    
                    onSpecialtySelected(specialty as SpecialtyType, triageResult!, {
                      quick_scan_ids: selectedQuickScans,
                      deep_dive_ids: selectedDeepDives,
                      general_assessment_ids: selectedGeneralAssessments,
                      general_deep_dive_ids: selectedGeneralDeepDives,
                      flash_assessment_ids: selectedFlashAssessments
                    });
                  }}
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
        <div className="space-y-6">
          {/* Quick Scan Selection */}
          {quickScans.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
            >
              <button
                onClick={() => toggleSection('quickScans')}
                className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Activity className="w-5 h-5 text-blue-600" />
                  <h3 className="font-semibold text-gray-900">Select Quick Scans to Include</h3>
                  <span className="text-sm text-gray-500">({selectedQuickScans.length} selected)</span>
                </div>
                {expandedSections.quickScans ? (
                  <ChevronUp className="w-5 h-5 text-gray-500" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-500" />
                )}
              </button>
              
              <AnimatePresence>
                {expandedSections.quickScans && (
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: 'auto' }}
                    exit={{ height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="border-t border-gray-100"
                  >
                    <div className="p-4 space-y-2 max-h-64 overflow-y-auto">
                      {quickScans.map(scan => {
                        const isSelected = selectedQuickScans.includes(scan.id);
                        const urgencyColor = {
                          'low': 'bg-green-100 text-green-800',
                          'medium': 'bg-yellow-100 text-yellow-800',
                          'high': 'bg-red-100 text-red-800'
                        }[scan.urgency_level] || 'bg-gray-100 text-gray-800';
                        
                        return (
                          <label
                            key={scan.id}
                            className={`
                              flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-all
                              ${isSelected ? 'bg-blue-50 border-2 border-blue-300' : 'hover:bg-gray-50 border-2 border-transparent'}
                            `}
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleScan(scan.id, 'quick')}
                              className="mt-1 w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                            />
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <Calendar className="w-4 h-4 text-gray-500" />
                                <span className="text-sm text-gray-600">
                                  {new Date(scan.created_at).toLocaleDateString()}
                                </span>
                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${urgencyColor}`}>
                                  {scan.urgency_level}
                                </span>
                              </div>
                              <p className="font-medium text-gray-900">{scan.body_part}</p>
                              {scan.summary && (
                                <p className="text-sm text-gray-600 mt-1">{scan.summary}</p>
                              )}
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}

          {/* Deep Dive Selection */}
          {deepDives.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
            >
              <button
                onClick={() => toggleSection('deepDives')}
                className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5 text-purple-600" />
                  <h3 className="font-semibold text-gray-900">Select Deep Dives to Include</h3>
                  <span className="text-sm text-gray-500">({selectedDeepDives.length} selected)</span>
                </div>
                {expandedSections.deepDives ? (
                  <ChevronUp className="w-5 h-5 text-gray-500" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-500" />
                )}
              </button>
              
              <AnimatePresence>
                {expandedSections.deepDives && (
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: 'auto' }}
                    exit={{ height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="border-t border-gray-100"
                  >
                    <div className="p-4 space-y-2 max-h-64 overflow-y-auto">
                      {deepDives.map(dive => {
                        const isSelected = selectedDeepDives.includes(dive.id);
                        const statusColor = {
                          'completed': 'bg-green-100 text-green-800',
                          'in_progress': 'bg-yellow-100 text-yellow-800',
                          'failed': 'bg-red-100 text-red-800'
                        }[dive.status] || 'bg-gray-100 text-gray-800';
                        
                        return (
                          <label
                            key={dive.id}
                            className={`
                              flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-all
                              ${isSelected ? 'bg-purple-50 border-2 border-purple-300' : 'hover:bg-gray-50 border-2 border-transparent'}
                            `}
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleScan(dive.id, 'deep')}
                              className="mt-1 w-4 h-4 text-purple-600 rounded border-gray-300 focus:ring-purple-500"
                            />
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <Calendar className="w-4 h-4 text-gray-500" />
                                <span className="text-sm text-gray-600">
                                  {new Date(dive.created_at).toLocaleDateString()}
                                </span>
                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColor}`}>
                                  {dive.status}
                                </span>
                              </div>
                              <p className="font-medium text-gray-900">{dive.body_part}</p>
                              {dive.symptoms && dive.symptoms.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {dive.symptoms.slice(0, 3).map((symptom, idx) => (
                                    <span key={idx} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                                      {symptom}
                                    </span>
                                  ))}
                                  {dive.symptoms.length > 3 && (
                                    <span className="text-xs text-gray-500">+{dive.symptoms.length - 3} more</span>
                                  )}
                                </div>
                              )}
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}

          {/* Flash Assessments Selection */}
          {flashAssessments.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
            >
              <button
                onClick={() => toggleSection('flashAssessments')}
                className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Zap className="w-5 h-5 text-yellow-600" />
                  <h3 className="font-semibold text-gray-900">Select Flash Assessments to Include</h3>
                  <span className="text-sm text-gray-500">({selectedFlashAssessments.length} selected)</span>
                </div>
                {expandedSections.flashAssessments ? (
                  <ChevronUp className="w-5 h-5 text-gray-500" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-500" />
                )}
              </button>
              
              <AnimatePresence>
                {expandedSections.flashAssessments && (
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: 'auto' }}
                    exit={{ height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="border-t border-gray-100"
                  >
                    <div className="p-4 space-y-2 max-h-64 overflow-y-auto">
                      {flashAssessments.map(assessment => {
                        const isSelected = selectedFlashAssessments.includes(assessment.id);
                        
                        return (
                          <label
                            key={assessment.id}
                            className={`
                              flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-all
                              ${isSelected ? 'bg-yellow-50 border-2 border-yellow-300' : 'hover:bg-gray-50 border-2 border-transparent'}
                            `}
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleScan(assessment.id, 'flash')}
                              className="mt-1 w-4 h-4 text-yellow-600 rounded border-gray-300 focus:ring-yellow-500"
                            />
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <Calendar className="w-4 h-4 text-gray-500" />
                                <span className="text-sm text-gray-600">
                                  {new Date(assessment.created_at).toLocaleDateString()}
                                </span>
                              </div>
                              <p className="font-medium text-gray-900">Flash Assessment</p>
                              {assessment.assessment_summary && (
                                <p className="text-sm text-gray-600 mt-1">{assessment.assessment_summary}</p>
                              )}
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}

          {/* General Assessments Selection */}
          {generalAssessments.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
            >
              <button
                onClick={() => toggleSection('generalAssessments')}
                className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <MessageSquare className="w-5 h-5 text-green-600" />
                  <h3 className="font-semibold text-gray-900">Select General Assessments to Include</h3>
                  <span className="text-sm text-gray-500">({selectedGeneralAssessments.length} selected)</span>
                </div>
                {expandedSections.generalAssessments ? (
                  <ChevronUp className="w-5 h-5 text-gray-500" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-500" />
                )}
              </button>
              
              <AnimatePresence>
                {expandedSections.generalAssessments && (
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: 'auto' }}
                    exit={{ height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="border-t border-gray-100"
                  >
                    <div className="p-4 space-y-2 max-h-64 overflow-y-auto">
                      {generalAssessments.map(assessment => {
                        const isSelected = selectedGeneralAssessments.includes(assessment.id);
                        
                        return (
                          <label
                            key={assessment.id}
                            className={`
                              flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-all
                              ${isSelected ? 'bg-green-50 border-2 border-green-300' : 'hover:bg-gray-50 border-2 border-transparent'}
                            `}
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleScan(assessment.id, 'general')}
                              className="mt-1 w-4 h-4 text-green-600 rounded border-gray-300 focus:ring-green-500"
                            />
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <Calendar className="w-4 h-4 text-gray-500" />
                                <span className="text-sm text-gray-600">
                                  {new Date(assessment.created_at).toLocaleDateString()}
                                </span>
                              </div>
                              <p className="font-medium text-gray-900">General Health Assessment</p>
                              {assessment.summary && (
                                <p className="text-sm text-gray-600 mt-1">{assessment.summary}</p>
                              )}
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}

          {/* General Deep Dives Selection */}
          {generalDeepDives.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
            >
              <button
                onClick={() => toggleSection('generalDeepDives')}
                className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Brain className="w-5 h-5 text-indigo-600" />
                  <h3 className="font-semibold text-gray-900">Select General Deep Dives to Include</h3>
                  <span className="text-sm text-gray-500">({selectedGeneralDeepDives.length} selected)</span>
                </div>
                {expandedSections.generalDeepDives ? (
                  <ChevronUp className="w-5 h-5 text-gray-500" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-500" />
                )}
              </button>
              
              <AnimatePresence>
                {expandedSections.generalDeepDives && (
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: 'auto' }}
                    exit={{ height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="border-t border-gray-100"
                  >
                    <div className="p-4 space-y-2 max-h-64 overflow-y-auto">
                      {generalDeepDives.map(dive => {
                        const isSelected = selectedGeneralDeepDives.includes(dive.id);
                        const statusColor = {
                          'completed': 'bg-green-100 text-green-800',
                          'in_progress': 'bg-yellow-100 text-yellow-800',
                          'failed': 'bg-red-100 text-red-800'
                        }[dive.status] || 'bg-gray-100 text-gray-800';
                        
                        return (
                          <label
                            key={dive.id}
                            className={`
                              flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-all
                              ${isSelected ? 'bg-indigo-50 border-2 border-indigo-300' : 'hover:bg-gray-50 border-2 border-transparent'}
                            `}
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleScan(dive.id, 'generalDeep')}
                              className="mt-1 w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
                            />
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <Calendar className="w-4 h-4 text-gray-500" />
                                <span className="text-sm text-gray-600">
                                  {new Date(dive.created_at).toLocaleDateString()}
                                </span>
                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColor}`}>
                                  {dive.status}
                                </span>
                              </div>
                              <p className="font-medium text-gray-900">General Deep Dive</p>
                              {dive.summary && (
                                <p className="text-sm text-gray-600 mt-1">{dive.summary}</p>
                              )}
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}

          {/* Additional Context */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
          >
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Additional Information (Optional)
            </label>
            <textarea
              value={primaryConcern}
              onChange={(e) => setPrimaryConcern(e.target.value)}
              placeholder="Any other details you'd like to add about your symptoms or concerns..."
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
              disabled={isLoading || (
                selectedQuickScans.length === 0 && 
                selectedDeepDives.length === 0 && 
                selectedFlashAssessments.length === 0 &&
                selectedGeneralAssessments.length === 0 &&
                selectedGeneralDeepDives.length === 0 &&
                !primaryConcern.trim()
              )}
              className="w-full mt-6 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-medium hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Analyzing your health data...
                </>
              ) : (
                <>
                  Get Specialist Recommendation
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </motion.div>
        </div>
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
                  setSelectedQuickScans([]);
                  setSelectedDeepDives([]);
                }}
                className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
              >
                Start Over
              </button>
              <button
                onClick={() => {
                  console.log('=== PRIMARY CARE BUTTON CLICKED ===');
                  console.log('Selected Quick Scans:', selectedQuickScans);
                  console.log('Selected Deep Dives:', selectedDeepDives);
                  
                  onSpecialtySelected('primary-care' as SpecialtyType, triageResult, {
                    quick_scan_ids: selectedQuickScans,
                    deep_dive_ids: selectedDeepDives
                  });
                }}
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