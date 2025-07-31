'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Calendar, Clock, TrendingUp, AlertCircle, Activity } from 'lucide-react';
import { SymptomTimelineEntry, PatternAnalysis } from '@/types/reports';

interface SymptomTimelineProps {
  timeline: SymptomTimelineEntry[];
  patternAnalysis?: PatternAnalysis;
  className?: string;
}

export const SymptomTimeline: React.FC<SymptomTimelineProps> = ({ 
  timeline, 
  patternAnalysis,
  className = '' 
}) => {
  // Sort timeline by date
  const sortedTimeline = [...timeline].sort((a, b) => 
    new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  // Get severity color
  const getSeverityColor = (severity: number) => {
    if (severity >= 8) return 'bg-red-500';
    if (severity >= 6) return 'bg-orange-500';
    if (severity >= 4) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getSeverityTextColor = (severity: number) => {
    if (severity >= 8) return 'text-red-700';
    if (severity >= 6) return 'text-orange-700';
    if (severity >= 4) return 'text-yellow-700';
    return 'text-green-700';
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Pattern Analysis Summary */}
      {patternAnalysis && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-blue-50 border border-blue-200 rounded-lg p-4"
        >
          <h4 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Symptom Patterns Identified
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-blue-700 font-medium">Frequency</p>
              <p className="text-blue-600">{patternAnalysis.frequency}</p>
            </div>
            <div>
              <p className="text-blue-700 font-medium">Progression</p>
              <p className="text-blue-600">{patternAnalysis.progression}</p>
            </div>
            {patternAnalysis.triggers.length > 0 && (
              <div>
                <p className="text-blue-700 font-medium">Common Triggers</p>
                <ul className="text-blue-600 list-disc list-inside">
                  {patternAnalysis.triggers.map((trigger, idx) => (
                    <li key={idx}>{trigger}</li>
                  ))}
                </ul>
              </div>
            )}
            {patternAnalysis.alleviating_factors.length > 0 && (
              <div>
                <p className="text-blue-700 font-medium">What Helps</p>
                <ul className="text-blue-600 list-disc list-inside">
                  {patternAnalysis.alleviating_factors.map((factor, idx) => (
                    <li key={idx}>{factor}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* Timeline */}
      <div className="relative">
        {/* Timeline line */}
        <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gray-200" />

        {/* Timeline events */}
        <div className="space-y-6">
          {sortedTimeline.map((event, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="relative flex gap-4"
            >
              {/* Timeline dot */}
              <div className="relative z-10">
                <div className={`w-16 h-16 rounded-full ${getSeverityColor(event.severity)} bg-opacity-20 flex items-center justify-center`}>
                  <div className={`w-10 h-10 rounded-full ${getSeverityColor(event.severity)} bg-opacity-40 flex items-center justify-center`}>
                    <span className={`font-bold ${getSeverityTextColor(event.severity)}`}>
                      {event.severity}
                    </span>
                  </div>
                </div>
              </div>

              {/* Event content */}
              <div className="flex-1 bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                      <Calendar className="w-4 h-4" />
                      <span>{new Date(event.date).toLocaleDateString()}</span>
                      {event.duration && (
                        <>
                          <Clock className="w-4 h-4 ml-2" />
                          <span>{event.duration}</span>
                        </>
                      )}
                    </div>
                    <h4 className="font-semibold text-gray-900">{event.symptoms}</h4>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                    event.severity >= 8 ? 'bg-red-100 text-red-800' :
                    event.severity >= 6 ? 'bg-orange-100 text-orange-800' :
                    event.severity >= 4 ? 'bg-yellow-100 text-yellow-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    Severity: {event.severity}/10
                  </div>
                </div>

                {event.context && (
                  <div className="mb-2">
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Context:</span> {event.context}
                    </p>
                  </div>
                )}

                {event.resolution && (
                  <div className="mt-2 pt-2 border-t border-gray-100">
                    <p className="text-sm text-green-700 flex items-center gap-2">
                      <Activity className="w-4 h-4" />
                      <span className="font-medium">Resolution:</span> {event.resolution}
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Timeline Summary */}
      {sortedTimeline.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="bg-gray-50 rounded-lg p-4 mt-6"
        >
          <div className="flex items-center justify-between text-sm">
            <div>
              <p className="text-gray-600">Timeline spans</p>
              <p className="font-semibold text-gray-900">
                {Math.ceil(
                  (new Date(sortedTimeline[sortedTimeline.length - 1].date).getTime() - 
                   new Date(sortedTimeline[0].date).getTime()) / 
                  (1000 * 60 * 60 * 24)
                )} days
              </p>
            </div>
            <div>
              <p className="text-gray-600">Average severity</p>
              <p className="font-semibold text-gray-900">
                {(sortedTimeline.reduce((sum, event) => sum + event.severity, 0) / sortedTimeline.length).toFixed(1)}/10
              </p>
            </div>
            <div>
              <p className="text-gray-600">Total events</p>
              <p className="font-semibold text-gray-900">{sortedTimeline.length}</p>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};