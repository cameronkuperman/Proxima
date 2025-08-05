'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
  FileText,
  Calendar,
  User,
  Download,
  Printer,
  Shield,
  AlertTriangle,
  Activity
} from 'lucide-react';

interface ReportHeaderProps {
  reportType: string;
  reportTitle: string;
  generatedAt: string;
  userId?: string;
  confidenceScore?: number;
  analysisId?: string;
  reportId: string;
  specialty?: string;
  urgencyLevel?: 'routine' | 'urgent' | 'emergent';
  onExport?: () => void;
  onPrint?: () => void;
}

const reportTypeConfig: Record<string, { icon: any; color: string; gradient: string }> = {
  cardiology: { 
    icon: Activity, 
    color: 'red',
    gradient: 'from-red-600 to-pink-600'
  },
  neurology: { 
    icon: Activity, 
    color: 'purple',
    gradient: 'from-purple-600 to-indigo-600'
  },
  psychiatry: { 
    icon: Activity, 
    color: 'blue',
    gradient: 'from-blue-600 to-cyan-600'
  },
  dermatology: { 
    icon: Activity, 
    color: 'orange',
    gradient: 'from-orange-600 to-yellow-600'
  },
  gastroenterology: { 
    icon: Activity, 
    color: 'green',
    gradient: 'from-green-600 to-emerald-600'
  },
  endocrinology: { 
    icon: Activity, 
    color: 'indigo',
    gradient: 'from-indigo-600 to-purple-600'
  },
  pulmonology: { 
    icon: Activity, 
    color: 'cyan',
    gradient: 'from-cyan-600 to-blue-600'
  },
  'primary-care': { 
    icon: Activity, 
    color: 'gray',
    gradient: 'from-gray-600 to-slate-600'
  },
  symptom_timeline: { 
    icon: Activity, 
    color: 'teal',
    gradient: 'from-teal-600 to-cyan-600'
  }
};

export const ReportHeader: React.FC<ReportHeaderProps> = ({
  reportType,
  reportTitle,
  generatedAt,
  userId,
  confidenceScore,
  analysisId,
  reportId,
  specialty,
  urgencyLevel,
  onExport,
  onPrint
}) => {
  const config = reportTypeConfig[specialty || reportType] || reportTypeConfig['primary-care'];
  const Icon = config.icon;

  const getUrgencyColor = () => {
    switch (urgencyLevel) {
      case 'emergent':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'urgent':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      default:
        return 'bg-green-100 text-green-800 border-green-300';
    }
  };

  const getConfidenceColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const handlePrint = () => {
    if (onPrint) {
      onPrint();
    } else {
      window.print();
    }
  };

  const handleExport = () => {
    if (onExport) {
      onExport();
    } else {
      // Default export implementation - save as JSON
      const reportData = {
        reportId,
        reportType,
        generatedAt,
        userId,
        confidenceScore,
        analysisId
      };
      const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${reportType}-report-${reportId}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl shadow-lg overflow-hidden mb-6"
    >
      {/* Gradient Header */}
      <div className={`bg-gradient-to-r ${config.gradient} p-6`}>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-white/20 backdrop-blur rounded-xl">
              <Icon className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white mb-1">{reportTitle}</h1>
              <div className="flex items-center gap-4 text-white/80 text-sm">
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {new Date(generatedAt).toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
                {userId && (
                  <span className="flex items-center gap-1">
                    <User className="w-4 h-4" />
                    Patient ID: {userId.slice(0, 8)}...
                  </span>
                )}
              </div>
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleExport}
              className="p-2 bg-white/20 hover:bg-white/30 backdrop-blur rounded-lg transition-colors"
              title="Export Report"
            >
              <Download className="w-5 h-5 text-white" />
            </button>
            <button
              onClick={handlePrint}
              className="p-2 bg-white/20 hover:bg-white/30 backdrop-blur rounded-lg transition-colors"
              title="Print Report"
            >
              <Printer className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>
      </div>

      {/* Info Bar */}
      <div className="bg-gray-50 px-6 py-4 border-t border-gray-100">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-6 text-sm">
            {/* Report ID */}
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-gray-500" />
              <span className="text-gray-600">Report ID:</span>
              <span className="font-mono text-gray-900">{reportId.slice(0, 12)}...</span>
            </div>
            
            {/* Analysis ID */}
            {analysisId && (
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-gray-500" />
                <span className="text-gray-600">Analysis:</span>
                <span className="font-mono text-gray-900">{analysisId.slice(0, 12)}...</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-4">
            {/* Urgency Badge */}
            {urgencyLevel && (
              <div className={`px-3 py-1 rounded-full text-sm font-medium border ${getUrgencyColor()}`}>
                {urgencyLevel === 'emergent' && <AlertTriangle className="w-4 h-4 inline mr-1" />}
                {urgencyLevel.charAt(0).toUpperCase() + urgencyLevel.slice(1)} Priority
              </div>
            )}

            {/* Confidence Score */}
            {confidenceScore !== undefined && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Confidence:</span>
                <div className="flex items-center gap-2">
                  <div className="relative w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${confidenceScore}%` }}
                      transition={{ duration: 1, ease: "easeOut" }}
                      className={`absolute top-0 left-0 h-full rounded-full ${
                        confidenceScore >= 80 ? 'bg-green-500' :
                        confidenceScore >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                      }`}
                    />
                  </div>
                  <span className={`text-sm font-semibold ${getConfidenceColor(confidenceScore)}`}>
                    {confidenceScore}%
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};