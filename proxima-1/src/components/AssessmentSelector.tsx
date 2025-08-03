'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Activity, 
  FileText, 
  Calendar, 
  ChevronUp, 
  ChevronDown, 
  Zap, 
  Brain, 
  MessageSquare,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { FlashAssessment, GeneralAssessment } from '@/lib/timeline-client';

interface AssessmentSelectorProps {
  // Body assessments
  availableQuickScans: any[];
  availableDeepDives: any[];
  selectedQuickScans: string[];
  selectedDeepDives: string[];
  
  // General assessments
  availableFlashAssessments: FlashAssessment[];
  availableGeneralAssessments: GeneralAssessment[];
  availableGeneralDeepDives: any[];
  selectedFlashAssessments: string[];
  selectedGeneralAssessments: string[];
  selectedGeneralDeepDives: string[];
  
  // Handlers
  onToggle: (id: string, type: 'quick' | 'deep' | 'flash' | 'general' | 'generalDeep') => void;
  onToggleSection: (section: 'quickScans' | 'deepDives' | 'flashAssessments' | 'generalAssessments' | 'generalDeepDives') => void;
  expandedSections: Record<string, boolean>;
  
  loading?: boolean;
}

export const AssessmentSelector: React.FC<AssessmentSelectorProps> = ({
  availableQuickScans,
  availableDeepDives,
  selectedQuickScans,
  selectedDeepDives,
  availableFlashAssessments,
  availableGeneralAssessments,
  availableGeneralDeepDives,
  selectedFlashAssessments,
  selectedGeneralAssessments,
  selectedGeneralDeepDives,
  onToggle,
  onToggleSection,
  expandedSections,
  loading
}) => {
  const getUrgencyColor = (urgency: string) => {
    const colors = {
      'low': 'bg-green-100 text-green-800',
      'medium': 'bg-yellow-100 text-yellow-800',
      'high': 'bg-red-100 text-red-800',
      'emergency': 'bg-red-200 text-red-900'
    };
    return colors[urgency as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const totalSelected = 
    selectedQuickScans.length + 
    selectedDeepDives.length + 
    selectedFlashAssessments.length + 
    selectedGeneralAssessments.length + 
    selectedGeneralDeepDives.length;

  return (
    <div className="space-y-4">
      <div className="text-sm text-gray-600 mb-4">
        {totalSelected > 0 ? (
          <span className="font-medium text-blue-600">
            {totalSelected} assessment{totalSelected !== 1 ? 's' : ''} selected
          </span>
        ) : (
          <span>Select assessments to include in your report</span>
        )}
      </div>

      {/* Body Quick Scans */}
      {availableQuickScans.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
        >
          <button
            onClick={() => onToggleSection('quickScans')}
            className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <Activity className="w-5 h-5 text-blue-600" />
              <h3 className="font-semibold text-gray-900">Body Quick Scans</h3>
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
                  {availableQuickScans.map(scan => {
                    const isSelected = selectedQuickScans.includes(scan.id);
                    const urgencyColor = getUrgencyColor(scan.urgency_level);
                    
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
                          onChange={() => onToggle(scan.id, 'quick')}
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

      {/* Body Deep Dives */}
      {availableDeepDives.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
        >
          <button
            onClick={() => onToggleSection('deepDives')}
            className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <FileText className="w-5 h-5 text-purple-600" />
              <h3 className="font-semibold text-gray-900">Body Deep Dives</h3>
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
                  {availableDeepDives.map(dive => {
                    const isSelected = selectedDeepDives.includes(dive.id);
                    
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
                          onChange={() => onToggle(dive.id, 'deep')}
                          className="mt-1 w-4 h-4 text-purple-600 rounded border-gray-300 focus:ring-purple-500"
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Calendar className="w-4 h-4 text-gray-500" />
                            <span className="text-sm text-gray-600">
                              {new Date(dive.created_at).toLocaleDateString()}
                            </span>
                            <CheckCircle className="w-4 h-4 text-green-500" />
                            <span className="text-sm text-green-600">Complete</span>
                          </div>
                          <p className="font-medium text-gray-900">{dive.body_part}</p>
                          {dive.analysis && (
                            <p className="text-sm text-gray-600 mt-1">
                              {dive.analysis.summary || 'Deep analysis completed'}
                            </p>
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

      {/* Flash Assessments */}
      {availableFlashAssessments.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
        >
          <button
            onClick={() => onToggleSection('flashAssessments')}
            className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <Zap className="w-5 h-5 text-yellow-600" />
              <h3 className="font-semibold text-gray-900">Flash Assessments</h3>
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
                  {availableFlashAssessments.map(assessment => {
                    const isSelected = selectedFlashAssessments.includes(assessment.id);
                    const urgencyColor = getUrgencyColor(assessment.urgency);
                    
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
                          onChange={() => onToggle(assessment.id, 'flash')}
                          className="mt-1 w-4 h-4 text-yellow-600 rounded border-gray-300 focus:ring-yellow-500"
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Calendar className="w-4 h-4 text-gray-500" />
                            <span className="text-sm text-gray-600">
                              {new Date(assessment.created_at).toLocaleDateString()}
                            </span>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${urgencyColor}`}>
                              {assessment.urgency}
                            </span>
                          </div>
                          <p className="font-medium text-gray-900">{assessment.main_concern}</p>
                          <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                            {assessment.user_query}
                          </p>
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

      {/* General Assessments */}
      {availableGeneralAssessments.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
        >
          <button
            onClick={() => onToggleSection('generalAssessments')}
            className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <MessageSquare className="w-5 h-5 text-green-600" />
              <h3 className="font-semibold text-gray-900">General Assessments</h3>
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
                  {availableGeneralAssessments.map(assessment => {
                    const isSelected = selectedGeneralAssessments.includes(assessment.id);
                    const urgencyColor = getUrgencyColor(assessment.urgency_level);
                    
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
                          onChange={() => onToggle(assessment.id, 'general')}
                          className="mt-1 w-4 h-4 text-green-600 rounded border-gray-300 focus:ring-green-500"
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Calendar className="w-4 h-4 text-gray-500" />
                            <span className="text-sm text-gray-600">
                              {new Date(assessment.created_at).toLocaleDateString()}
                            </span>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${urgencyColor}`}>
                              {assessment.urgency_level}
                            </span>
                          </div>
                          <p className="font-medium text-gray-900">{assessment.category}</p>
                          <p className="text-sm text-gray-600 mt-1">
                            {assessment.primary_assessment}
                          </p>
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

      {/* General Deep Dives */}
      {availableGeneralDeepDives.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
        >
          <button
            onClick={() => onToggleSection('generalDeepDives')}
            className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <Brain className="w-5 h-5 text-indigo-600" />
              <h3 className="font-semibold text-gray-900">General Deep Dives</h3>
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
                  {availableGeneralDeepDives.map(dive => {
                    const isSelected = selectedGeneralDeepDives.includes(dive.id);
                    
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
                          onChange={() => onToggle(dive.id, 'generalDeep')}
                          className="mt-1 w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Calendar className="w-4 h-4 text-gray-500" />
                            <span className="text-sm text-gray-600">
                              {new Date(dive.created_at).toLocaleDateString()}
                            </span>
                            {dive.status === 'completed' && (
                              <>
                                <CheckCircle className="w-4 h-4 text-green-500" />
                                <span className="text-sm text-green-600">Complete</span>
                              </>
                            )}
                          </div>
                          <p className="font-medium text-gray-900">{dive.category || 'General Health Analysis'}</p>
                          {dive.final_assessment && (
                            <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                              {dive.final_assessment}
                            </p>
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

      {loading && (
        <div className="text-center py-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-sm text-gray-600 mt-2">Loading assessments...</p>
        </div>
      )}

      {!loading && 
        availableQuickScans.length === 0 && 
        availableDeepDives.length === 0 &&
        availableFlashAssessments.length === 0 &&
        availableGeneralAssessments.length === 0 &&
        availableGeneralDeepDives.length === 0 && (
        <div className="text-center py-8 bg-gray-50 rounded-lg">
          <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600">No assessments found</p>
          <p className="text-sm text-gray-500 mt-1">Complete some health assessments first</p>
        </div>
      )}
    </div>
  );
};