'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, AlertTriangle, Shield, Calendar, Activity, ChartLine, AlertCircle, Check } from 'lucide-react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions
} from 'chart.js';
import { ProgressionAnalysisResponse } from '@/types/photo-analysis';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface ProgressionAnalysisViewProps {
  sessionId: string;
  getProgressionAnalysis: (sessionId: string) => Promise<ProgressionAnalysisResponse>;
}

export default function ProgressionAnalysisView({
  sessionId,
  getProgressionAnalysis
}: ProgressionAnalysisViewProps) {
  const [progressionData, setProgressionData] = useState<ProgressionAnalysisResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchProgressionData();
  }, [sessionId]);

  const fetchProgressionData = async () => {
    try {
      setIsLoading(true);
      const data = await getProgressionAnalysis(sessionId);
      setProgressionData(data);
    } catch (err) {
      setError('Failed to load progression analysis');
      console.error('Progression analysis error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  if (error || !progressionData) {
    return (
      <div className="backdrop-blur-[20px] bg-red-500/10 border border-red-500/30 rounded-lg p-6 text-center">
        <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-2" />
        <p className="text-red-400">{error || 'No progression data available'}</p>
      </div>
    );
  }

  const { progression_metrics, visualization_data, summary, next_steps } = progressionData;

  // Prepare chart data
  const chartData = {
    labels: visualization_data.timeline.map(item => 
      new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    ),
    datasets: [
      {
        label: 'Size (mm)',
        data: visualization_data.timeline.map(item => item.metrics.size_mm || 0),
        borderColor: 'rgb(251, 146, 60)',
        backgroundColor: 'rgba(251, 146, 60, 0.1)',
        tension: 0.3,
        pointRadius: 6,
        pointHoverRadius: 8,
        pointBackgroundColor: visualization_data.timeline.map(item => 
          item.has_red_flags ? 'rgb(239, 68, 68)' : 'rgb(251, 146, 60)'
        ),
      },
      {
        label: 'Trend',
        data: visualization_data.trend_lines.map(point => point.y),
        borderColor: 'rgb(168, 85, 247)',
        backgroundColor: 'rgba(168, 85, 247, 0.1)',
        borderDash: [5, 5],
        tension: 0.3,
        pointRadius: 0,
      }
    ]
  };

  const chartOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'top',
        labels: {
          color: 'rgb(156, 163, 175)',
          usePointStyle: true,
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: 'white',
        bodyColor: 'rgb(156, 163, 175)',
        borderColor: 'rgb(75, 85, 99)',
        borderWidth: 1,
        callbacks: {
          afterLabel: (context) => {
            const index = context.dataIndex;
            const timelineItem = visualization_data.timeline[index];
            if (timelineItem.has_red_flags) {
              return `⚠️ ${timelineItem.red_flag_count} red flags`;
            }
            return '';
          }
        }
      }
    },
    scales: {
      x: {
        grid: {
          color: 'rgba(75, 85, 99, 0.2)',
        },
        ticks: {
          color: 'rgb(156, 163, 175)',
        }
      },
      y: {
        grid: {
          color: 'rgba(75, 85, 99, 0.2)',
        },
        ticks: {
          color: 'rgb(156, 163, 175)',
          callback: (value) => `${value}mm`
        }
      }
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'growing': return <TrendingUp className="w-5 h-5 text-red-400" />;
      case 'shrinking': return <TrendingDown className="w-5 h-5 text-green-400" />;
      default: return <Activity className="w-5 h-5 text-gray-400" />;
    }
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'high': return 'text-red-400 bg-red-500/20 border-red-500/30';
      case 'moderate': return 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30';
      default: return 'text-green-400 bg-green-500/20 border-green-500/30';
    }
  };

  return (
    <div className="space-y-6">
      {/* Summary Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="backdrop-blur-[20px] bg-gradient-to-r from-orange-500/10 to-red-500/10 border border-white/[0.05] rounded-xl p-6"
      >
        <h2 className="text-2xl font-bold text-white mb-3">Progression Analysis</h2>
        <p className="text-gray-300 leading-relaxed">{summary}</p>
      </motion.div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Velocity */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="backdrop-blur-[20px] bg-white/[0.03] border border-white/[0.05] rounded-xl p-5"
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-gray-400">Velocity</h3>
            {getTrendIcon(progression_metrics.velocity.overall_trend)}
          </div>
          <p className="text-2xl font-bold text-white mb-1">
            {progression_metrics.velocity.size_change_rate}
          </p>
          <p className="text-sm text-gray-400">
            {progression_metrics.velocity.acceleration} rate
          </p>
          <div className="mt-3 pt-3 border-t border-white/[0.05]">
            <p className="text-xs text-gray-500">30-day projection:</p>
            <p className="text-sm text-orange-400">{progression_metrics.velocity.projected_size_30d}</p>
          </div>
        </motion.div>

        {/* Risk Level */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="backdrop-blur-[20px] bg-white/[0.03] border border-white/[0.05] rounded-xl p-5"
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-gray-400">Risk Level</h3>
            <AlertTriangle className={`w-5 h-5 ${
              progression_metrics.risk_indicators.overall_risk_level === 'high' ? 'text-red-400' :
              progression_metrics.risk_indicators.overall_risk_level === 'moderate' ? 'text-yellow-400' :
              'text-green-400'
            }`} />
          </div>
          <div className={`inline-flex items-center px-3 py-1 rounded-full border ${getRiskColor(progression_metrics.risk_indicators.overall_risk_level)}`}>
            <span className="font-semibold uppercase">
              {progression_metrics.risk_indicators.overall_risk_level}
            </span>
          </div>
          <div className="mt-3">
            {Object.entries(progression_metrics.risk_indicators)
              .filter(([key, value]) => key !== 'overall_risk_level' && value === true)
              .map(([key]) => (
                <div key={key} className="text-xs text-red-400 mt-1">
                  • {key.replace(/_/g, ' ')}
                </div>
              ))}
          </div>
        </motion.div>

        {/* Monitoring Phase */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className="backdrop-blur-[20px] bg-white/[0.03] border border-white/[0.05] rounded-xl p-5"
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-gray-400">Phase</h3>
            <Shield className="w-5 h-5 text-blue-400" />
          </div>
          <p className="text-lg font-semibold text-white">
            {progression_metrics.velocity.monitoring_phase}
          </p>
          <div className="mt-3 space-y-1">
            <p className="text-xs text-gray-500">Total analyses:</p>
            <p className="text-sm text-gray-300">{visualization_data.timeline.length}</p>
          </div>
        </motion.div>
      </div>

      {/* Progression Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="backdrop-blur-[20px] bg-white/[0.03] border border-white/[0.05] rounded-xl p-6"
      >
        <h3 className="text-lg font-semibold text-white mb-4">Size Progression Timeline</h3>
        <div className="h-64">
          <Line data={chartData} options={chartOptions} />
        </div>
        <div className="mt-4 flex items-center gap-4 text-xs text-gray-400">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <span>Red flags detected</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-orange-500" />
            <span>Normal progression</span>
          </div>
        </div>
      </motion.div>

      {/* Clinical Thresholds */}
      <div className="backdrop-blur-[20px] bg-white/[0.03] border border-white/[0.05] rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Clinical Thresholds</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Object.entries(progression_metrics.clinical_thresholds).map(([key, value]) => (
            <div key={key} className="bg-white/[0.03] rounded-lg p-4">
              <p className="text-xs text-gray-400 mb-1">
                {key.replace(/_/g, ' ')}
              </p>
              <p className="text-lg font-semibold text-white">{value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Recommendations */}
      <div className="backdrop-blur-[20px] bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-white/[0.05] rounded-xl p-6">
        <h3 className="text-lg font-semibold text-purple-400 mb-4 flex items-center gap-2">
          <ChartLine className="w-5 h-5" />
          Recommendations
        </h3>
        <div className="space-y-3">
          {progression_metrics.recommendations.map((rec, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 + index * 0.1 }}
              className="flex items-start gap-3"
            >
              <div className="w-6 h-6 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs text-purple-400">{index + 1}</span>
              </div>
              <p className="text-gray-300">{rec}</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Next Steps */}
      <div className="backdrop-blur-[20px] bg-white/[0.03] border border-white/[0.05] rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-orange-400" />
          Next Steps
        </h3>
        <div className="space-y-2">
          {next_steps.map((step, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 + index * 0.1 }}
              className="flex items-center gap-2 text-gray-300"
            >
              <Check className="w-4 h-4 text-green-400" />
              <span>{step}</span>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}