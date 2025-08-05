'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText,
  AlertCircle,
  CheckCircle,
  ChevronDown,
  ChevronRight,
  Target,
  TrendingUp,
  Users,
  Lightbulb,
  Activity,
  Copy,
  Check,
  ArrowRight
} from 'lucide-react';

interface ExecutiveSummaryData {
  one_page_summary: string;
  chief_complaints?: string[];
  key_findings?: string[];
  patterns_identified?: string[];
  action_items?: string[];
  specialist_focus?: string;
  target_audience?: string;
  urgency_indicators?: string[];
}

interface ExecutiveSummaryCardProps {
  data: ExecutiveSummaryData;
  specialty?: string;
  className?: string;
}

export const ExecutiveSummaryCard: React.FC<ExecutiveSummaryCardProps> = ({
  data,
  specialty,
  className = ''
}) => {
  const [expandedSection, setExpandedSection] = useState<string | null>('summary');
  const [copiedText, setCopiedText] = useState(false);
  const [checkedActions, setCheckedActions] = useState<Set<number>>(new Set());

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(data.one_page_summary);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
  };

  const toggleActionItem = (index: number) => {
    const newChecked = new Set(checkedActions);
    if (newChecked.has(index)) {
      newChecked.delete(index);
    } else {
      newChecked.add(index);
    }
    setCheckedActions(newChecked);
  };

  const getSpecialtyColor = () => {
    const colors: Record<string, string> = {
      cardiology: 'from-red-50 to-pink-50 border-red-200',
      neurology: 'from-purple-50 to-indigo-50 border-purple-200',
      psychiatry: 'from-blue-50 to-cyan-50 border-blue-200',
      dermatology: 'from-orange-50 to-yellow-50 border-orange-200',
      gastroenterology: 'from-green-50 to-emerald-50 border-green-200',
      endocrinology: 'from-indigo-50 to-purple-50 border-indigo-200',
      pulmonology: 'from-cyan-50 to-blue-50 border-cyan-200',
      'primary-care': 'from-gray-50 to-slate-50 border-gray-200'
    };
    return colors[specialty || 'primary-care'] || colors['primary-care'];
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden ${className}`}
    >
      {/* Header */}
      <div className={`bg-gradient-to-r ${getSpecialtyColor()} p-6 border-b`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FileText className="w-6 h-6 text-gray-700" />
            <h2 className="text-xl font-bold text-gray-900">Executive Summary</h2>
          </div>
          {data.target_audience && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Users className="w-4 h-4" />
              <span>Prepared for: {data.target_audience}</span>
            </div>
          )}
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Main Summary */}
        <div>
          <button
            onClick={() => toggleSection('summary')}
            className="w-full flex items-center justify-between text-left hover:bg-gray-50 -mx-2 px-2 py-1 rounded-lg transition-colors"
          >
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Activity className="w-5 h-5 text-gray-600" />
              Clinical Overview
            </h3>
            {expandedSection === 'summary' ? (
              <ChevronDown className="w-5 h-5 text-gray-500" />
            ) : (
              <ChevronRight className="w-5 h-5 text-gray-500" />
            )}
          </button>
          
          <AnimatePresence>
            {expandedSection === 'summary' && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="mt-3 overflow-hidden"
              >
                <div className="relative bg-gray-50 rounded-lg p-4">
                  <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                    {data.one_page_summary}
                  </p>
                  <button
                    onClick={copyToClipboard}
                    className="absolute top-2 right-2 p-2 hover:bg-gray-200 rounded-lg transition-colors"
                    title="Copy summary"
                  >
                    {copiedText ? (
                      <Check className="w-4 h-4 text-green-600" />
                    ) : (
                      <Copy className="w-4 h-4 text-gray-500" />
                    )}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Chief Complaints */}
        {data.chief_complaints && data.chief_complaints.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wider mb-3">
              Chief Complaints
            </h3>
            <div className="flex flex-wrap gap-2">
              {data.chief_complaints.map((complaint, idx) => (
                <motion.span
                  key={idx}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: idx * 0.05 }}
                  className="px-3 py-1.5 bg-red-100 text-red-800 rounded-full text-sm font-medium"
                >
                  {complaint}
                </motion.span>
              ))}
            </div>
          </div>
        )}

        {/* Key Findings */}
        {data.key_findings && data.key_findings.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Lightbulb className="w-4 h-4" />
              Key Findings
            </h3>
            <div className="space-y-2">
              {data.key_findings.map((finding, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg"
                >
                  <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">{finding}</span>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Patterns Identified */}
        {data.patterns_identified && data.patterns_identified.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wider mb-3 flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Patterns & Correlations
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {data.patterns_identified.map((pattern, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="flex items-center gap-2 p-3 bg-purple-50 rounded-lg"
                >
                  <div className="w-2 h-2 bg-purple-400 rounded-full" />
                  <span className="text-gray-700 text-sm">{pattern}</span>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Urgency Indicators */}
        {data.urgency_indicators && data.urgency_indicators.length > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-yellow-900 uppercase tracking-wider mb-3 flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              Urgency Indicators
            </h3>
            <ul className="space-y-2">
              {data.urgency_indicators.map((indicator, idx) => (
                <li key={idx} className="flex items-start gap-2 text-yellow-800">
                  <span className="text-yellow-600 mt-0.5">•</span>
                  <span className="text-sm">{indicator}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Action Items */}
        {data.action_items && data.action_items.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Target className="w-4 h-4" />
              Recommended Actions
            </h3>
            <div className="space-y-2">
              {data.action_items.map((item, idx) => (
                <motion.label
                  key={idx}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="flex items-start gap-3 p-3 bg-green-50 rounded-lg cursor-pointer hover:bg-green-100 transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={checkedActions.has(idx)}
                    onChange={() => toggleActionItem(idx)}
                    className="mt-1 w-4 h-4 text-green-600 rounded border-gray-300 focus:ring-green-500"
                  />
                  <span className={`flex-1 text-gray-700 ${checkedActions.has(idx) ? 'line-through opacity-60' : ''}`}>
                    {item}
                  </span>
                  <ArrowRight className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                </motion.label>
              ))}
            </div>
            {checkedActions.size === data.action_items.length && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mt-3 text-sm text-green-600 text-center font-medium"
              >
                ✨ All action items completed!
              </motion.p>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
};