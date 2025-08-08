'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Camera, Calendar, TrendingUp, TrendingDown, Minus, FileText, Download, Share2, Lock, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';

interface PhotoSession {
  id: string;
  condition_name: string;
  created_at: string;
  last_photo_at?: string;
  photo_count: number;
  analysis_count: number;
  is_sensitive: boolean;
  analyses: {
    date: string;
    primary_assessment: string;
    confidence: number;
    visual_observations: string[];
    red_flags: string[];
    recommendations: string[];
    trend?: 'improving' | 'worsening' | 'stable';
  }[];
}

interface PhotoAnalysisReportProps {
  sessions: PhotoSession[];
  timeRange?: { start: Date; end: Date };
  patientInfo?: {
    name: string;
    dateOfBirth?: string;
    patientId?: string;
  };
}

export default function PhotoAnalysisReport({
  sessions,
  timeRange,
  patientInfo
}: PhotoAnalysisReportProps) {
  const getTrendIcon = (trend?: string) => {
    switch (trend) {
      case 'improving':
        return <TrendingUp className="w-4 h-4 text-green-400" />;
      case 'worsening':
        return <TrendingDown className="w-4 h-4 text-red-400" />;
      case 'stable':
        return <Minus className="w-4 h-4 text-yellow-400" />;
      default:
        return null;
    }
  };

  const getTrendColor = (trend?: string) => {
    switch (trend) {
      case 'improving':
        return 'text-green-400';
      case 'worsening':
        return 'text-red-400';
      case 'stable':
        return 'text-yellow-400';
      default:
        return 'text-gray-400';
    }
  };

  const filteredSessions = sessions.filter(session => {
    if (!timeRange) return true;
    const sessionDate = new Date(session.created_at);
    return sessionDate >= timeRange.start && sessionDate <= timeRange.end;
  });

  return (
    <div className="max-w-4xl mx-auto p-8 bg-white text-gray-900 print:p-0">
      {/* Header */}
      <div className="mb-8 border-b-2 border-gray-200 pb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-r from-orange-500 to-red-500 flex items-center justify-center">
              <Camera className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Photo Analysis Report</h1>
              <p className="text-gray-600">Visual Health Tracking Summary</p>
            </div>
          </div>
          <div className="text-right text-sm text-gray-600">
            <p>Generated: {format(new Date(), 'PPP')}</p>
            {timeRange && (
              <p>Period: {format(timeRange.start, 'PP')} - {format(timeRange.end, 'PP')}</p>
            )}
          </div>
        </div>

        {/* Patient Info */}
        {patientInfo && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-600">Patient:</span> {patientInfo.name}
              </div>
              {patientInfo.dateOfBirth && (
                <div>
                  <span className="font-medium text-gray-600">DOB:</span> {patientInfo.dateOfBirth}
                </div>
              )}
              {patientInfo.patientId && (
                <div>
                  <span className="font-medium text-gray-600">ID:</span> {patientInfo.patientId}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Summary Statistics */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Summary</h2>
        <div className="grid grid-cols-4 gap-4">
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-2xl font-bold text-gray-900">{filteredSessions.length}</p>
            <p className="text-sm text-gray-600">Conditions Tracked</p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-2xl font-bold text-gray-900">
              {filteredSessions.reduce((sum, s) => sum + s.photo_count, 0)}
            </p>
            <p className="text-sm text-gray-600">Total Photos</p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-2xl font-bold text-gray-900">
              {filteredSessions.reduce((sum, s) => sum + s.analysis_count, 0)}
            </p>
            <p className="text-sm text-gray-600">Analyses Performed</p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-2xl font-bold text-gray-900">
              {filteredSessions.filter(s => s.is_sensitive).length}
            </p>
            <p className="text-sm text-gray-600">Sensitive Sessions</p>
          </div>
        </div>
      </div>

      {/* Sessions Detail */}
      <div className="space-y-8">
        {filteredSessions.map((session) => (
          <div key={session.id} className="border border-gray-200 rounded-lg overflow-hidden">
            {/* Session Header */}
            <div className="bg-gray-50 p-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    {session.condition_name}
                    {session.is_sensitive && (
                      <Lock className="w-4 h-4 text-gray-500" />
                    )}
                  </h3>
                  <p className="text-sm text-gray-600">
                    Started: {format(new Date(session.created_at), 'PPP')}
                    {session.last_photo_at && (
                      <> • Last update: {format(new Date(session.last_photo_at), 'PPP')}</>
                    )}
                  </p>
                </div>
                <div className="text-right text-sm">
                  <p className="text-gray-600">{session.photo_count} photos</p>
                  <p className="text-gray-600">{session.analysis_count} analyses</p>
                </div>
              </div>
            </div>

            {/* Analyses Timeline */}
            <div className="p-4">
              {session.analyses.length > 0 ? (
                <div className="space-y-4">
                  {session.analyses.map((analysis, index) => (
                    <div key={index} className="border-l-2 border-gray-200 pl-4 ml-2">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-3 h-3 rounded-full bg-gray-400 -ml-6" />
                        <span className="text-sm font-medium text-gray-600">
                          {format(new Date(analysis.date), 'PP')}
                        </span>
                        {analysis.trend && (
                          <span className={`flex items-center gap-1 text-sm ${getTrendColor(analysis.trend)}`}>
                            {getTrendIcon(analysis.trend)}
                            {analysis.trend}
                          </span>
                        )}
                        <span className="text-sm text-gray-500">
                          ({analysis.confidence}% confidence)
                        </span>
                      </div>
                      
                      <h4 className="font-medium text-gray-900 mb-2">
                        {analysis.primary_assessment}
                      </h4>

                      {/* Visual Observations */}
                      {analysis.visual_observations.length > 0 && (
                        <div className="mb-3">
                          <p className="text-sm font-medium text-gray-700 mb-1">Observations:</p>
                          <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                            {analysis.visual_observations.map((obs, i) => (
                              <li key={i}>{obs}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Red Flags */}
                      {analysis.red_flags.length > 0 && (
                        <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded">
                          <div className="flex items-start gap-2">
                            <AlertCircle className="w-4 h-4 text-red-500 mt-0.5" />
                            <div>
                              <p className="text-sm font-medium text-red-900 mb-1">Red Flags:</p>
                              <ul className="list-disc list-inside text-sm text-red-800 space-y-1">
                                {analysis.red_flags.map((flag, i) => (
                                  <li key={i}>{flag}</li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Recommendations */}
                      {analysis.recommendations.length > 0 && (
                        <div>
                          <p className="text-sm font-medium text-gray-700 mb-1">Recommendations:</p>
                          <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                            {analysis.recommendations.slice(0, 3).map((rec, i) => (
                              <li key={i}>{rec}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 italic">No analyses recorded for this session</p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="mt-12 pt-8 border-t-2 border-gray-200">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <div>
            <p className="font-medium">Seimeo-1 Health Intelligence Platform</p>
            <p>AI-Powered Photo Analysis Report</p>
          </div>
          <div className="text-right">
            <p>This report is for informational purposes only</p>
            <p>Always consult with healthcare professionals</p>
          </div>
        </div>
      </div>

      {/* Print Styles */}
      <style jsx>{`
        @media print {
          .no-print {
            display: none;
          }
          @page {
            margin: 0.5in;
          }
        }
      `}</style>
    </div>
  );
}