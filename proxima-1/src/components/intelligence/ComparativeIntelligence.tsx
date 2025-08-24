'use client';

import { motion } from 'framer-motion';
import { useState } from 'react';
import { ComparativeIntelligenceData } from '@/lib/mock-health-data';
import { Users, TrendingUp, Lightbulb, Shield, ChevronDown, ChevronUp } from 'lucide-react';

interface ComparativeIntelligenceProps {
  data: ComparativeIntelligenceData;
}

export default function ComparativeIntelligence({ data }: ComparativeIntelligenceProps) {
  const [expandedPattern, setExpandedPattern] = useState<number | null>(0);
  
  const getSuccessColor = (rate: number) => {
    if (rate >= 70) return 'text-green-400';
    if (rate >= 50) return 'text-yellow-400';
    return 'text-orange-400';
  };
  
  const getSuccessBadge = (rate: number) => {
    if (rate >= 70) return 'bg-green-500/20 border-green-500/30';
    if (rate >= 50) return 'bg-yellow-500/20 border-yellow-500/30';
    return 'bg-orange-500/20 border-orange-500/30';
  };

  return (
    <div className="backdrop-blur-[20px] bg-white/[0.03] border border-white/[0.05] rounded-xl p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-white">Comparative Intelligence</h3>
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-purple-400" />
          <span className="text-sm text-purple-400">{data.similarUsers.toLocaleString()} similar users</span>
        </div>
      </div>
      
      {/* Top Recommendation */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6 p-4 bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-lg"
      >
        <div className="flex items-start gap-3">
          <div className="p-2 bg-purple-500/20 rounded-lg">
            <Lightbulb className="w-5 h-5 text-purple-400" />
          </div>
          <div className="flex-1">
            <h4 className="text-sm font-medium text-white mb-1">Top Recommendation</h4>
            <p className="text-xs text-gray-300">{data.topRecommendation}</p>
          </div>
        </div>
      </motion.div>
      
      {/* Patterns */}
      <div className="space-y-4">
        {data.patterns.map((pattern, patternIndex) => (
          <motion.div
            key={patternIndex}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: patternIndex * 0.1 }}
            className="border border-white/[0.05] rounded-lg overflow-hidden"
          >
            {/* Pattern Header */}
            <button
              onClick={() => setExpandedPattern(expandedPattern === patternIndex ? null : patternIndex)}
              className="w-full p-4 bg-white/[0.02] hover:bg-white/[0.03] transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1 text-left">
                  <h4 className="text-sm font-medium text-white mb-1">{pattern.pattern}</h4>
                  <div className="flex items-center gap-3 text-xs text-gray-400">
                    <span className="flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      {pattern.affectedUsers.toLocaleString()} users affected
                    </span>
                    <span className="text-purple-400">
                      {pattern.successfulInterventions.length} interventions available
                    </span>
                  </div>
                </div>
                {expandedPattern === patternIndex ? (
                  <ChevronUp className="w-5 h-5 text-gray-400" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-400" />
                )}
              </div>
            </button>
            
            {/* Expanded Content */}
            {expandedPattern === patternIndex && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                className="p-4 border-t border-white/[0.05] space-y-3"
              >
                <p className="text-xs text-gray-400 mb-4">
                  Based on {pattern.affectedUsers.toLocaleString()} users with similar patterns, here's what worked:
                </p>
                
                {pattern.successfulInterventions.map((intervention, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="p-3 bg-white/[0.02] rounded-lg border border-white/[0.05]"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h5 className="text-sm font-medium text-white">{intervention.action}</h5>
                      <div className={`px-2 py-1 rounded-full border ${getSuccessBadge(intervention.successRate)}`}>
                        <span className={`text-xs font-medium ${getSuccessColor(intervention.successRate)}`}>
                          {intervention.successRate}% success
                        </span>
                      </div>
                    </div>
                    
                    <p className="text-xs text-gray-400 mb-2">{intervention.description}</p>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <Users className="w-3 h-3" />
                        <span>Tried by {intervention.triedBy} users</span>
                      </div>
                      
                      {/* Success Rate Bar */}
                      <div className="w-24">
                        <div className="h-1 bg-white/[0.05] rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${intervention.successRate}%` }}
                            transition={{ delay: 0.5 + index * 0.1, duration: 0.5 }}
                            className={`h-full rounded-full ${
                              intervention.successRate >= 70 
                                ? 'bg-green-500' 
                                : intervention.successRate >= 50 
                                ? 'bg-yellow-500' 
                                : 'bg-orange-500'
                            }`}
                          />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
                
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full mt-3 px-4 py-2 bg-purple-500/20 hover:bg-purple-500/30 
                    text-purple-400 rounded-lg transition-all text-sm font-medium"
                >
                  Try Top Intervention
                </motion.button>
              </motion.div>
            )}
          </motion.div>
        ))}
      </div>
      
      {/* Privacy Notice */}
      <div className="mt-6 p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
        <div className="flex items-start gap-2">
          <Shield className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-xs text-blue-400 font-medium mb-1">Privacy First</p>
            <p className="text-xs text-gray-400">
              All comparisons are based on anonymous, aggregated data. No personal information is shared. 
              These are patterns, not medical advice.
            </p>
          </div>
        </div>
      </div>
      
      {/* Stats Summary */}
      <div className="mt-6 grid grid-cols-3 gap-4">
        <div className="text-center">
          <p className="text-2xl font-bold text-purple-400">
            {data.patterns.reduce((sum, p) => sum + p.affectedUsers, 0).toLocaleString()}
          </p>
          <p className="text-xs text-gray-400">Total Users Analyzed</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-green-400">
            {Math.round(
              data.patterns.reduce((sum, p) => 
                sum + p.successfulInterventions.reduce((s, i) => s + i.successRate, 0) / p.successfulInterventions.length, 0
              ) / data.patterns.length
            )}%
          </p>
          <p className="text-xs text-gray-400">Avg Success Rate</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-pink-400">
            {data.patterns.reduce((sum, p) => sum + p.successfulInterventions.length, 0)}
          </p>
          <p className="text-xs text-gray-400">Total Interventions</p>
        </div>
      </div>
    </div>
  );
}