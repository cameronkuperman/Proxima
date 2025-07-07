'use client';

import { motion } from 'framer-motion';
import { useState } from 'react';

interface Correlation {
  symptom1: string;
  symptom2: string;
  strength: number;
  direction: 'positive' | 'negative';
}

export default function DataView() {
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'year'>('month');
  const [correlations] = useState<Correlation[]>([
    { symptom1: 'Headache', symptom2: 'Poor Sleep', strength: 0.87, direction: 'positive' },
    { symptom1: 'Exercise', symptom2: 'Energy Levels', strength: 0.72, direction: 'positive' },
    { symptom1: 'Stress', symptom2: 'Sleep Quality', strength: 0.65, direction: 'negative' },
    { symptom1: 'Hydration', symptom2: 'Headache', strength: 0.58, direction: 'negative' }
  ]);

  const [triggers] = useState([
    { name: 'Lack of Sleep', occurrences: 23, impact: 'High' },
    { name: 'Dehydration', occurrences: 19, impact: 'Medium' },
    { name: 'Stress', occurrences: 17, impact: 'High' },
    { name: 'Weather Changes', occurrences: 12, impact: 'Low' }
  ]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="max-w-6xl mx-auto space-y-6"
    >
      {/* Time Range Selector */}
      <div className="flex justify-end">
        <div className="flex gap-2 bg-white/[0.03] p-1 rounded-lg border border-white/[0.05]">
          {(['week', 'month', 'year'] as const).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-3 py-1 text-sm rounded-md capitalize transition-all ${
                timeRange === range
                  ? 'bg-white/[0.08] text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      {/* Pattern Analysis */}
      <div className="backdrop-blur-[20px] bg-white/[0.03] border border-white/[0.05] rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-6">Pattern Analysis</h3>
        
        {/* Correlation Matrix */}
        <div className="mb-8">
          <h4 className="text-sm font-medium text-gray-400 mb-4">Symptom Correlations</h4>
          <div className="space-y-3">
            {correlations.map((corr, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="flex items-center gap-4"
              >
                <div className="flex-1 flex items-center gap-3">
                  <span className="text-sm text-white">{corr.symptom1}</span>
                  <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                      d={corr.direction === 'positive' ? "M14 5l7 7m0 0l-7 7m7-7H3" : "M17 8l4 4m0 0l-4 4m4-4H3"} 
                    />
                  </svg>
                  <span className="text-sm text-white">{corr.symptom2}</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-32 h-2 bg-white/[0.05] rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${corr.strength * 100}%` }}
                      transition={{ duration: 1, ease: "easeOut" }}
                      className={`h-full rounded-full ${
                        corr.direction === 'positive'
                          ? 'bg-gradient-to-r from-green-500 to-emerald-500'
                          : 'bg-gradient-to-r from-orange-500 to-red-500'
                      }`}
                    />
                  </div>
                  <span className="text-sm text-gray-400 w-12 text-right">
                    {(corr.strength * 100).toFixed(0)}%
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Correlation Heatmap */}
        <div className="mt-8">
          <h4 className="text-sm font-medium text-gray-400 mb-4">Correlation Heatmap</h4>
          <div className="bg-white/[0.02] rounded-lg p-4">
            <div className="grid grid-cols-5 gap-1">
              {/* Labels */}
              <div></div>
              {['Sleep', 'Stress', 'Exercise', 'Diet'].map((label) => (
                <div key={label} className="text-xs text-gray-400 text-center pb-2">{label}</div>
              ))}
              
              {/* Rows */}
              {['Headache', 'Energy', 'Mood', 'Focus'].map((rowLabel, rowIndex) => (
                <>
                  <div key={rowLabel} className="text-xs text-gray-400 pr-2 flex items-center justify-end">
                    {rowLabel}
                  </div>
                  {['Sleep', 'Stress', 'Exercise', 'Diet'].map((_, colIndex) => {
                    const intensity = Math.random();
                    const isPositive = Math.random() > 0.5;
                    return (
                      <motion.div
                        key={`${rowIndex}-${colIndex}`}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: (rowIndex * 4 + colIndex) * 0.02 }}
                        className="aspect-square rounded flex items-center justify-center text-xs font-medium cursor-pointer hover:scale-110 transition-transform"
                        style={{
                          backgroundColor: isPositive 
                            ? `rgba(34, 197, 94, ${intensity * 0.3})`
                            : `rgba(239, 68, 68, ${intensity * 0.3})`,
                          borderWidth: '1px',
                          borderColor: isPositive
                            ? `rgba(34, 197, 94, ${intensity * 0.5})`
                            : `rgba(239, 68, 68, ${intensity * 0.5})`
                        }}
                        title={`${(intensity * 100).toFixed(0)}% correlation`}
                      >
                        {intensity > 0.7 && (
                          <span className={isPositive ? 'text-green-400' : 'text-red-400'}>
                            {(intensity * 100).toFixed(0)}
                          </span>
                        )}
                      </motion.div>
                    );
                  })}
                </>
              ))}
            </div>
            <div className="flex items-center justify-center gap-8 mt-4 text-xs text-gray-500">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500/30 border border-green-500/50 rounded"></div>
                <span>Positive correlation</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-500/30 border border-red-500/50 rounded"></div>
                <span>Negative correlation</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Timeline */}
      <div className="backdrop-blur-[20px] bg-white/[0.03] border border-white/[0.05] rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-6">Health Timeline</h3>
        <div className="relative h-64 bg-white/[0.02] rounded-lg p-4">
          <div className="absolute inset-0 flex items-end justify-around p-4">
            {Array.from({ length: 7 }).map((_, i) => (
              <motion.div
                key={i}
                initial={{ height: 0 }}
                animate={{ height: `${20 + Math.random() * 60}%` }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
                className="w-8 bg-gradient-to-t from-purple-500 to-pink-500 rounded-t-lg opacity-80"
              />
            ))}
          </div>
          <div className="absolute bottom-0 left-0 right-0 flex justify-around p-2 text-xs text-gray-500">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
              <span key={day}>{day}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Actionable Insights */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Top Triggers */}
        <div className="backdrop-blur-[20px] bg-white/[0.03] border border-white/[0.05] rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Top Triggers</h3>
          <div className="space-y-3">
            {triggers.map((trigger, index) => (
              <motion.div
                key={trigger.name}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="flex items-center justify-between p-3 bg-white/[0.02] rounded-lg"
              >
                <div>
                  <p className="text-sm font-medium text-white">{trigger.name}</p>
                  <p className="text-xs text-gray-400">{trigger.occurrences} occurrences</p>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full ${
                  trigger.impact === 'High' 
                    ? 'bg-red-500/10 text-red-400'
                    : trigger.impact === 'Medium'
                    ? 'bg-yellow-500/10 text-yellow-400'
                    : 'bg-green-500/10 text-green-400'
                }`}>
                  {trigger.impact} Impact
                </span>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Optimization Opportunities */}
        <div className="backdrop-blur-[20px] bg-white/[0.03] border border-white/[0.05] rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Optimization Opportunities</h3>
          <div className="space-y-3">
            {[
              { action: 'Increase water intake', potential: '45% headache reduction' },
              { action: 'Consistent sleep schedule', potential: '62% better energy' },
              { action: '20 min daily meditation', potential: '38% stress reduction' }
            ].map((opp, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="p-3 bg-gradient-to-r from-purple-500/5 to-pink-500/5 border border-purple-500/10 rounded-lg"
              >
                <p className="text-sm font-medium text-white mb-1">{opp.action}</p>
                <p className="text-xs text-purple-400">{opp.potential}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}