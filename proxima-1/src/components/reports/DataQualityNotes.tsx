'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { 
  Info, 
  CheckCircle, 
  AlertCircle, 
  XCircle,
  BarChart,
  Database,
  TrendingUp
} from 'lucide-react';

interface DataQualityNotesProps {
  completeness?: string;
  consistency?: string;
  gaps?: string[];
  confidence?: number;
  dataPoints?: {
    total?: number;
    analyzed?: number;
  };
  recommendations?: string[];
  className?: string;
}

export const DataQualityNotes: React.FC<DataQualityNotesProps> = ({
  completeness,
  consistency,
  gaps = [],
  confidence,
  dataPoints,
  recommendations = [],
  className = ''
}) => {
  const hasContent = completeness || consistency || gaps.length > 0 || confidence !== undefined;

  if (!hasContent) {
    return null;
  }

  const getCompletenessIcon = (completeness: string) => {
    const lower = completeness.toLowerCase();
    if (lower.includes('excellent') || lower.includes('complete')) {
      return { icon: CheckCircle, color: 'text-green-600' };
    } else if (lower.includes('good') || lower.includes('adequate')) {
      return { icon: CheckCircle, color: 'text-blue-600' };
    } else if (lower.includes('moderate') || lower.includes('partial')) {
      return { icon: AlertCircle, color: 'text-yellow-600' };
    } else {
      return { icon: XCircle, color: 'text-red-600' };
    }
  };

  const getConsistencyColor = (consistency: string) => {
    const lower = consistency.toLowerCase();
    if (lower.includes('excellent') || lower.includes('consistent')) {
      return 'text-green-600';
    } else if (lower.includes('good') || lower.includes('mostly')) {
      return 'text-blue-600';
    } else if (lower.includes('moderate') || lower.includes('some')) {
      return 'text-yellow-600';
    } else {
      return 'text-red-600';
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 85) return 'text-green-600';
    if (confidence >= 70) return 'text-blue-600';
    if (confidence >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getConfidenceLabel = (confidence: number) => {
    if (confidence >= 85) return 'High Confidence';
    if (confidence >= 70) return 'Good Confidence';
    if (confidence >= 50) return 'Moderate Confidence';
    return 'Low Confidence';
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center gap-2 mb-4">
        <Database className="w-5 h-5 text-gray-700" />
        <h3 className="text-lg font-semibold text-gray-900">Data Quality Assessment</h3>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Completeness */}
        {completeness && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm"
          >
            <div className="flex items-start gap-3">
              {React.createElement(getCompletenessIcon(completeness).icon, {
                className: `w-5 h-5 ${getCompletenessIcon(completeness).color} flex-shrink-0`
              })}
              <div>
                <h4 className="font-medium text-gray-800 text-sm">Data Completeness</h4>
                <p className="text-sm text-gray-600 mt-1">{completeness}</p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Consistency */}
        {consistency && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm"
          >
            <div className="flex items-start gap-3">
              <BarChart className={`w-5 h-5 ${getConsistencyColor(consistency)} flex-shrink-0`} />
              <div>
                <h4 className="font-medium text-gray-800 text-sm">Data Consistency</h4>
                <p className="text-sm text-gray-600 mt-1">{consistency}</p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Confidence Score */}
        {confidence !== undefined && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm"
          >
            <div className="flex items-start gap-3">
              <TrendingUp className={`w-5 h-5 ${getConfidenceColor(confidence)} flex-shrink-0`} />
              <div>
                <h4 className="font-medium text-gray-800 text-sm">Analysis Confidence</h4>
                <p className={`text-lg font-bold ${getConfidenceColor(confidence)}`}>
                  {confidence}%
                </p>
                <p className="text-xs text-gray-600">{getConfidenceLabel(confidence)}</p>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Data Points Summary */}
      {dataPoints && (dataPoints.total || dataPoints.analyzed) && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="bg-gray-50 p-4 rounded-lg border border-gray-200"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-gray-600" />
              <span className="text-sm font-medium text-gray-700">Data Points Analyzed</span>
            </div>
            <div className="text-right">
              {dataPoints.analyzed && dataPoints.total ? (
                <>
                  <p className="text-lg font-bold text-gray-900">
                    {dataPoints.analyzed} / {dataPoints.total}
                  </p>
                  <p className="text-xs text-gray-600">
                    {Math.round((dataPoints.analyzed / dataPoints.total) * 100)}% coverage
                  </p>
                </>
              ) : (
                <p className="text-lg font-bold text-gray-900">
                  {dataPoints.analyzed || dataPoints.total || 0}
                </p>
              )}
            </div>
          </div>
        </motion.div>
      )}

      {/* Data Gaps */}
      {gaps.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-orange-600" />
            <h4 className="font-medium text-gray-800">Identified Data Gaps</h4>
          </div>
          <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
            <p className="text-sm text-orange-900 mb-2">
              The following information would improve analysis accuracy:
            </p>
            <ul className="space-y-2">
              {gaps.map((gap, idx) => (
                <motion.li
                  key={idx}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="flex items-start gap-2"
                >
                  <span className="text-orange-600 mt-0.5">•</span>
                  <span className="text-sm text-gray-700">{gap}</span>
                </motion.li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-green-600" />
            <h4 className="font-medium text-gray-800">Recommendations for Better Data</h4>
          </div>
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <ul className="space-y-2">
              {recommendations.map((rec, idx) => (
                <motion.li
                  key={idx}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="flex items-start gap-2"
                >
                  <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-gray-700">{rec}</span>
                </motion.li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* General Note */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg"
      >
        <div className="flex items-start gap-2">
          <Info className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-1">Why Data Quality Matters:</p>
            <p>
              Complete and consistent health data enables more accurate AI analysis and better 
              personalized recommendations. Regular tracking and detailed symptom reporting 
              significantly improve the quality of insights we can provide.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};