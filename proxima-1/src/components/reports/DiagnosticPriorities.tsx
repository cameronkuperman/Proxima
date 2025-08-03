'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { AlertCircle, Clock, Calendar, CheckCircle, Info, FileText } from 'lucide-react';
import { DiagnosticTest, ContingentTest } from '@/types/reports';

interface DiagnosticPrioritiesProps {
  immediate?: DiagnosticTest[];
  shortTerm?: DiagnosticTest[];
  contingent?: ContingentTest[];
  className?: string;
}

export const DiagnosticPriorities: React.FC<DiagnosticPrioritiesProps> = ({
  immediate = [],
  shortTerm = [],
  contingent = [],
  className = ''
}) => {
  const hasTests = immediate.length > 0 || shortTerm.length > 0 || contingent.length > 0;

  if (!hasTests) {
    return null;
  }

  const renderTest = (test: DiagnosticTest | ContingentTest, index: number, priority: 'immediate' | 'short-term' | 'contingent') => {
    const priorityConfig = {
      immediate: {
        icon: AlertCircle,
        bgColor: 'bg-red-50',
        borderColor: 'border-red-200',
        iconColor: 'text-red-600',
        textColor: 'text-red-900',
        labelBg: 'bg-red-100',
        labelText: 'text-red-800'
      },
      'short-term': {
        icon: Clock,
        bgColor: 'bg-yellow-50',
        borderColor: 'border-yellow-200',
        iconColor: 'text-yellow-600',
        textColor: 'text-yellow-900',
        labelBg: 'bg-yellow-100',
        labelText: 'text-yellow-800'
      },
      contingent: {
        icon: Info,
        bgColor: 'bg-blue-50',
        borderColor: 'border-blue-200',
        iconColor: 'text-blue-600',
        textColor: 'text-blue-900',
        labelBg: 'bg-blue-100',
        labelText: 'text-blue-800'
      }
    };

    const config = priorityConfig[priority];
    const Icon = config.icon;
    const isContingent = 'condition' in test;

    return (
      <motion.div
        key={`${priority}-${index}`}
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: index * 0.1 }}
        className={`p-4 rounded-lg border ${config.bgColor} ${config.borderColor}`}
      >
        <div className="flex items-start gap-3">
          <Icon className={`w-5 h-5 ${config.iconColor} flex-shrink-0 mt-0.5`} />
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h4 className={`font-semibold ${config.textColor}`}>{test.test}</h4>
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${config.labelBg} ${config.labelText}`}>
                {test.timing}
              </span>
            </div>
            
            <p className="text-sm text-gray-700 mb-2">{test.rationale}</p>
            
            {isContingent && (
              <div className="mt-2 p-2 bg-white/50 rounded-md">
                <p className="text-xs font-medium text-gray-600 flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" />
                  Only if: {(test as ContingentTest).condition}
                </p>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <div className={`space-y-6 ${className}`}>
      <div className="flex items-center gap-2 mb-4">
        <FileText className="w-5 h-5 text-gray-700" />
        <h3 className="text-lg font-semibold text-gray-900">Diagnostic Recommendations</h3>
      </div>

      {/* Immediate Tests */}
      {immediate.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600" />
            <h4 className="font-medium text-gray-800">Immediate Priority</h4>
            <span className="text-sm text-gray-500">({immediate.length})</span>
          </div>
          <div className="space-y-3">
            {immediate.map((test, idx) => renderTest(test, idx, 'immediate'))}
          </div>
        </div>
      )}

      {/* Short-term Tests */}
      {shortTerm.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-yellow-600" />
            <h4 className="font-medium text-gray-800">Short-term Follow-up</h4>
            <span className="text-sm text-gray-500">({shortTerm.length})</span>
          </div>
          <div className="space-y-3">
            {shortTerm.map((test, idx) => renderTest(test, idx, 'short-term'))}
          </div>
        </div>
      )}

      {/* Contingent Tests */}
      {contingent.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-blue-600" />
            <h4 className="font-medium text-gray-800">Conditional Testing</h4>
            <span className="text-sm text-gray-500">({contingent.length})</span>
          </div>
          <div className="space-y-3">
            {contingent.map((test, idx) => renderTest(test, idx, 'contingent'))}
          </div>
        </div>
      )}

      {/* General Note */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-lg"
      >
        <div className="flex items-start gap-2">
          <Info className="w-4 h-4 text-gray-500 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-gray-600">
            <p className="font-medium mb-1">Important Notes:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Test recommendations are based on reported symptoms and clinical guidelines</li>
              <li>Your healthcare provider may modify these recommendations based on examination</li>
              <li>Insurance coverage and availability may affect test ordering</li>
            </ul>
          </div>
        </div>
      </motion.div>
    </div>
  );
};