'use client';

import { motion } from 'framer-motion';
import { useState } from 'react';
import { BodySystemsData, getHealthColor } from '@/lib/mock-health-data';
import { AlertCircle, TrendingUp, TrendingDown, Minus, Brain, Heart, Wind, Activity, Shield, Sparkles } from 'lucide-react';

interface BodySystemsHeatmapProps {
  data: BodySystemsData;
}

export default function BodySystemsHeatmap({ data }: BodySystemsHeatmapProps) {
  const [selectedSystem, setSelectedSystem] = useState<string | null>(null);
  
  const getTrendIcon = (trend: string) => {
    if (trend === 'improving') return <TrendingUp className="w-3 h-3" />;
    if (trend === 'declining') return <TrendingDown className="w-3 h-3" />;
    return <Minus className="w-3 h-3" />;
  };
  
  const getTrendColor = (trend: string) => {
    if (trend === 'improving') return 'text-green-400';
    if (trend === 'declining') return 'text-red-400';
    return 'text-gray-400';
  };
  
  const getSystemIcon = (system: string) => {
    switch(system) {
      case 'head': return <Brain className="w-4 h-4" />;
      case 'chest': return <Heart className="w-4 h-4" />;
      case 'digestive': return <Activity className="w-4 h-4" />;
      case 'arms': return <Shield className="w-4 h-4" />;
      case 'legs': return <Activity className="w-4 h-4" />;
      case 'skin': return <Sparkles className="w-4 h-4" />;
      case 'mental': return <Brain className="w-4 h-4" />;
      default: return <Activity className="w-4 h-4" />;
    }
  };
  
  const getSystemLabel = (system: string) => {
    const labels: Record<string, string> = {
      head: 'Neurological',
      chest: 'Cardiovascular',
      digestive: 'Gastrointestinal',
      arms: 'Musculoskeletal (Upper)',
      legs: 'Musculoskeletal (Lower)',
      skin: 'Dermatological',
      mental: 'Psychological'
    };
    return labels[system] || system;
  };

  return (
    <div className="backdrop-blur-[20px] bg-white/[0.03] border border-white/[0.05] rounded-xl p-6">
      <h3 className="text-lg font-semibold text-white mb-6">Body Systems Analysis</h3>
      
      <div className="grid grid-cols-1 gap-3">
        {Object.entries(data).map(([system, info], index) => (
          <motion.div
            key={system}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            className={`p-4 rounded-lg border cursor-pointer transition-all ${
              selectedSystem === system 
                ? 'border-purple-500/50 bg-purple-500/5' 
                : 'border-white/[0.05] bg-white/[0.02] hover:bg-white/[0.03]'
            }`}
            onClick={() => setSelectedSystem(system === selectedSystem ? null : system)}
          >
            <div className="flex items-center gap-4">
              {/* System Icon and Health Bar */}
              <div className="flex items-center gap-3 flex-1">
                <div style={{ color: getHealthColor(info.health) }}>
                  {getSystemIcon(system)}
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="text-sm font-medium text-white">{getSystemLabel(system)}</h4>
                    <div className={`flex items-center gap-1 ${getTrendColor(info.trend)}`}>
                      {getTrendIcon(info.trend)}
                      <span className="text-xs">{info.trend}</span>
                    </div>
                  </div>
                  
                  {/* Health Bar */}
                  <div className="relative">
                    <div className="h-2 bg-white/[0.05] rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${info.health}%` }}
                        transition={{ duration: 0.8, delay: index * 0.1 }}
                        className="h-full rounded-full"
                        style={{ backgroundColor: getHealthColor(info.health) }}
                      />
                    </div>
                  </div>
                  
                  {/* Issues or Status */}
                  <div className="mt-2">
                    {info.issues.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {info.issues.map((issue: string, i: number) => (
                          <span
                            key={i}
                            className="text-xs px-2 py-0.5 bg-red-500/10 text-red-400 rounded"
                          >
                            {issue}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-green-400">Optimal function</p>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Score */}
              <div className="text-right">
                <div 
                  className="text-2xl font-bold"
                  style={{ color: getHealthColor(info.health) }}
                >
                  {info.health}
                </div>
                <div className="text-xs text-gray-500">Score</div>
              </div>
            </div>
            
            {/* Expanded Details */}
            {selectedSystem === system && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                className="mt-4 pt-4 border-t border-white/[0.05]"
              >
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-gray-500">Last Assessment</span>
                    <p className="text-white">{info.lastUpdated}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Risk Level</span>
                    <p className={info.health < 60 ? 'text-red-400' : info.health < 80 ? 'text-yellow-400' : 'text-green-400'}>
                      {info.health < 60 ? 'High' : info.health < 80 ? 'Moderate' : 'Low'}
                    </p>
                  </div>
                </div>
                <p className="text-xs text-gray-400 mt-3">
                  Click to view detailed analysis and treatment recommendations for {getSystemLabel(system).toLowerCase()}.
                </p>
              </motion.div>
            )}
          </motion.div>
        ))}
      </div>
      
      {/* Summary Stats */}
      <div className="mt-6 p-4 bg-white/[0.02] rounded-lg">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-2xl font-bold text-white">
              {Math.round(Object.values(data).reduce((sum, s) => sum + s.health, 0) / Object.keys(data).length)}
            </p>
            <p className="text-xs text-gray-400">Overall Score</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-green-400">
              {Object.values(data).filter(s => s.health >= 80).length}
            </p>
            <p className="text-xs text-gray-400">Optimal Systems</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-yellow-400">
              {Object.values(data).filter(s => s.issues.length > 0).length}
            </p>
            <p className="text-xs text-gray-400">Need Attention</p>
          </div>
        </div>
      </div>
    </div>
  );
}