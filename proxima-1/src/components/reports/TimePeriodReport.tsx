'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar,
  TrendingUp,
  TrendingDown,
  Activity,
  Heart,
  Brain,
  AlertCircle,
  CheckCircle,
  BarChart3,
  PieChart,
  Target,
  Zap,
  Clock,
  FileText,
  User,
  Stethoscope,
  Camera,
  ChevronDown,
  ChevronRight,
  Info,
  Download,
  ArrowUp,
  ArrowDown,
  Minus
} from 'lucide-react';
import { Line, Bar, Doughnut, Radar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  RadialLinearScale,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  RadialLinearScale,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface TimePeriodReportProps {
  report: any;
}

export const TimePeriodReport: React.FC<TimePeriodReportProps> = ({ report }) => {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['overview', 'patterns']));
  const [selectedMetric, setSelectedMetric] = useState<'symptoms' | 'severity' | 'interactions'>('symptoms');
  
  const data = report.report_data;
  const isAnnual = report.report_type === 'annual_summary';
  const period = isAnnual ? 'Year' : '30 Days';
  
  const toggleSection = (section: string) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(section)) {
        newSet.delete(section);
      } else {
        newSet.add(section);
      }
      return newSet;
    });
  };

  // Calculate metrics from data
  const metrics = useMemo(() => {
    const stats = data?.statistics || data?.health_metrics || {};
    const totalInteractions = stats.total_interactions || 0;
    const byType = stats.by_type || {};
    
    // Calculate trend
    const previousPeriod = data?.comparison?.previous_period || {};
    const trend = {
      interactions: totalInteractions > (previousPeriod.total_interactions || 0) ? 'up' : 
                   totalInteractions < (previousPeriod.total_interactions || 0) ? 'down' : 'stable',
      severity: data?.trend_analysis?.severity_trend || 'stable',
      improvement: data?.trend_analysis?.overall_improvement || 0
    };
    
    return {
      totalInteractions,
      quickScans: byType.quick_scans || 0,
      deepDives: byType.deep_dives || 0,
      photoSessions: byType.photo_sessions || 0,
      mostCommonSymptoms: stats.most_affected_areas || [],
      trend
    };
  }, [data]);

  // Process actual data from backend
  const processChartData = useMemo(() => {
    // Get actual monthly/weekly data from backend
    const monthlyData = data?.monthly_breakdown || data?.weekly_breakdown || {};
    const symptomOccurrences = data?.symptom_frequency || {};
    
    // Process symptom frequency
    const symptomLabels = Object.keys(symptomOccurrences);
    const symptomCounts = Object.values(symptomOccurrences) as number[];
    
    // Process time-based data
    const timeLabels = Object.keys(monthlyData).sort();
    const severityData = timeLabels.map(period => monthlyData[period]?.average_severity || 0);
    const interactionCounts = timeLabels.map(period => monthlyData[period]?.interaction_count || 0);
    
    return {
      symptomLabels,
      symptomCounts,
      timeLabels,
      severityData,
      interactionCounts
    };
  }, [data]);

  // Chart data using real backend data
  const symptomFrequencyData = {
    labels: processChartData.symptomLabels.slice(0, 6),
    datasets: [{
      label: 'Occurrences',
      data: processChartData.symptomCounts.slice(0, 6),
      backgroundColor: [
        'rgba(147, 51, 234, 0.8)',
        'rgba(147, 51, 234, 0.7)',
        'rgba(147, 51, 234, 0.6)',
        'rgba(147, 51, 234, 0.5)',
        'rgba(147, 51, 234, 0.4)',
        'rgba(147, 51, 234, 0.3)',
      ],
      borderWidth: 0
    }]
  };

  const severityTrendData = {
    labels: processChartData.timeLabels.length > 0 ? processChartData.timeLabels : ['No Data'],
    datasets: [{
      label: 'Average Severity',
      data: processChartData.severityData.length > 0 ? processChartData.severityData : [0],
      borderColor: 'rgb(147, 51, 234)',
      backgroundColor: 'rgba(147, 51, 234, 0.1)',
      tension: 0.4,
      fill: true
    }]
  };

  const interactionTypeData = {
    labels: ['Quick Scans', 'Deep Dives', 'Photo Sessions'],
    datasets: [{
      data: [metrics.quickScans, metrics.deepDives, metrics.photoSessions],
      backgroundColor: [
        'rgba(147, 51, 234, 0.8)',
        'rgba(59, 130, 246, 0.8)',
        'rgba(236, 72, 153, 0.8)',
      ],
      borderWidth: 0
    }]
  };

  // Body area data from actual backend
  const bodyAreaStats = data?.body_area_frequency || {};
  const bodyAreaData = {
    labels: Object.keys(bodyAreaStats).length > 0 ? Object.keys(bodyAreaStats) : ['No Data'],
    datasets: [{
      label: 'Symptom Frequency',
      data: Object.values(bodyAreaStats).length > 0 ? Object.values(bodyAreaStats) as number[] : [0],
      backgroundColor: 'rgba(147, 51, 234, 0.2)',
      borderColor: 'rgba(147, 51, 234, 1)',
      pointBackgroundColor: 'rgba(147, 51, 234, 1)',
      pointBorderColor: '#fff',
      pointHoverBackgroundColor: '#fff',
      pointHoverBorderColor: 'rgba(147, 51, 234, 1)'
    }]
  };

  // Monthly/Weekly distribution using real data
  const monthlyDistributionData = {
    labels: processChartData.timeLabels.length > 0 ? processChartData.timeLabels : ['No Data'],
    datasets: [{
      label: 'Interactions',
      data: processChartData.interactionCounts.length > 0 ? processChartData.interactionCounts : [0],
      backgroundColor: 'rgba(147, 51, 234, 0.8)',
      borderWidth: 0
    }]
  };

  const Section = ({ 
    id, 
    title, 
    icon: Icon, 
    children,
    className = ""
  }: { 
    id: string; 
    title: string; 
    icon: any; 
    children: React.ReactNode;
    className?: string;
  }) => {
    const isExpanded = expandedSections.has(id);
    
    return (
      <motion.div 
        className={`bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden ${className}`}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <button
          onClick={() => toggleSection(id)}
          className="w-full p-6 flex items-center justify-between hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-r from-purple-100 to-blue-100 rounded-lg">
              <Icon className="w-6 h-6 text-purple-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">{title}</h2>
          </div>
          {isExpanded ? (
            <ChevronDown className="w-5 h-5 text-gray-500" />
          ) : (
            <ChevronRight className="w-5 h-5 text-gray-500" />
          )}
        </button>
        
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: 'auto' }}
              exit={{ height: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <div className="p-6 pt-0 border-t border-gray-100">
                {children}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    );
  };

  const MetricCard = ({ 
    title, 
    value, 
    change, 
    icon: Icon, 
    color 
  }: { 
    title: string; 
    value: string | number; 
    change?: { type: 'up' | 'down' | 'stable'; value: string };
    icon: any;
    color: string;
  }) => (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className={`bg-${color}-50 border border-${color}-200 rounded-xl p-6`}
    >
      <div className="flex items-start justify-between mb-3">
        <Icon className={`w-8 h-8 text-${color}-600`} />
        {change && (
          <div className={`flex items-center gap-1 text-sm font-medium ${
            change.type === 'up' ? 'text-red-600' : 
            change.type === 'down' ? 'text-green-600' : 
            'text-gray-600'
          }`}>
            {change.type === 'up' ? <ArrowUp className="w-4 h-4" /> : 
             change.type === 'down' ? <ArrowDown className="w-4 h-4" /> : 
             <Minus className="w-4 h-4" />}
            {change.value}
          </div>
        )}
      </div>
      <p className="text-sm text-gray-600 mb-1">{title}</p>
      <p className={`text-2xl font-bold text-${color}-900`}>{value}</p>
    </motion.div>
  );

  return (
    <div className="space-y-6">
      {/* Period Header */}
      <div className="bg-gradient-to-r from-purple-600 via-blue-600 to-pink-600 rounded-2xl p-8 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">
              {isAnnual ? 'Annual Health Summary' : '30-Day Health Summary'}
            </h1>
            <p className="text-purple-100">
              Comprehensive analysis of your health data from {data?.time_period?.start || 'start'} to {data?.time_period?.end || 'present'}
            </p>
          </div>
          <div className="text-right">
            <div className="text-5xl font-bold">{metrics.totalInteractions}</div>
            <p className="text-purple-200">Total Health Interactions</p>
          </div>
        </div>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-8">
          <div className="bg-white/20 backdrop-blur rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <Brain className="w-6 h-6" />
              <span className="text-2xl font-bold">{metrics.quickScans}</span>
            </div>
            <p className="text-sm text-purple-100">Quick Scans</p>
          </div>
          <div className="bg-white/20 backdrop-blur rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <FileText className="w-6 h-6" />
              <span className="text-2xl font-bold">{metrics.deepDives}</span>
            </div>
            <p className="text-sm text-purple-100">Deep Dives</p>
          </div>
          <div className="bg-white/20 backdrop-blur rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <Camera className="w-6 h-6" />
              <span className="text-2xl font-bold">{metrics.photoSessions}</span>
            </div>
            <p className="text-sm text-purple-100">Photo Sessions</p>
          </div>
          <div className="bg-white/20 backdrop-blur rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              {metrics.trend.severity === 'down' ? 
                <TrendingDown className="w-6 h-6" /> : 
                <TrendingUp className="w-6 h-6" />
              }
              <span className="text-2xl font-bold">
                {metrics.trend.improvement > 0 ? '+' : ''}{metrics.trend.improvement}%
              </span>
            </div>
            <p className="text-sm text-purple-100">Overall Trend</p>
          </div>
        </div>
      </div>

      {/* Executive Summary */}
      {data?.executive_summary && (
        <Section id="overview" title="Executive Summary" icon={FileText}>
          <div className="space-y-6">
            <div className="prose max-w-none">
              <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-6 rounded-lg">
                <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {data.executive_summary.one_page_summary}
                </p>
              </div>
            </div>

            {data.executive_summary.year_highlights && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Key Highlights</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {data.executive_summary.year_highlights.map((highlight: string, idx: number) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg"
                    >
                      <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700">{highlight}</span>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Section>
      )}

      {/* Pattern Analysis - The Key Feature */}
      {data?.pattern_analysis && (
        <Section id="patterns" title="Pattern Analysis" icon={Target}>
          <div className="space-y-6">
            {data.pattern_analysis.correlation_patterns?.symptom_triggers && (
              <div className="bg-purple-50 border border-purple-200 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-purple-900 mb-4 flex items-center gap-2">
                  <Zap className="w-5 h-5" />
                  Your symptoms seem to pop up when...
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {data.pattern_analysis.correlation_patterns.symptom_triggers.map((trigger: string, idx: number) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: idx * 0.1 }}
                      className="bg-white p-4 rounded-lg shadow-sm"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center font-bold flex-shrink-0">
                          {idx + 1}
                        </div>
                        <p className="text-purple-800">{trigger}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {data.pattern_analysis.time_patterns && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Time-Based Patterns</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-orange-50 p-4 rounded-lg">
                    <h4 className="font-medium text-orange-900 mb-2">Morning Patterns</h4>
                    <p className="text-orange-700 text-sm">{data.pattern_analysis.time_patterns.morning || 'No significant patterns'}</p>
                  </div>
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-medium text-blue-900 mb-2">Afternoon Patterns</h4>
                    <p className="text-blue-700 text-sm">{data.pattern_analysis.time_patterns.afternoon || 'No significant patterns'}</p>
                  </div>
                  <div className="bg-indigo-50 p-4 rounded-lg">
                    <h4 className="font-medium text-indigo-900 mb-2">Evening Patterns</h4>
                    <p className="text-indigo-700 text-sm">{data.pattern_analysis.time_patterns.evening || 'No significant patterns'}</p>
                  </div>
                </div>
              </div>
            )}

            {data.pattern_analysis.environmental_correlations && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Environmental Correlations</h3>
                <p className="text-gray-700">{data.pattern_analysis.environmental_correlations}</p>
              </div>
            )}
          </div>
        </Section>
      )}

      {/* Visual Analytics */}
      <Section id="analytics" title="Health Analytics" icon={BarChart3}>
        <div className="space-y-6">
          {/* Chart Selector */}
          <div className="flex items-center gap-3 mb-6">
            <span className="text-sm text-gray-600">View:</span>
            <div className="flex gap-2">
              <button
                onClick={() => setSelectedMetric('symptoms')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedMetric === 'symptoms' 
                    ? 'bg-purple-600 text-white' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Symptom Frequency
              </button>
              <button
                onClick={() => setSelectedMetric('severity')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedMetric === 'severity' 
                    ? 'bg-purple-600 text-white' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Severity Trends
              </button>
              <button
                onClick={() => setSelectedMetric('interactions')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedMetric === 'interactions' 
                    ? 'bg-purple-600 text-white' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Interaction Types
              </button>
            </div>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {selectedMetric === 'symptoms' && (
              <>
                <div className="bg-gray-50 p-6 rounded-xl">
                  <h3 className="font-semibold text-gray-900 mb-4">Most Common Symptoms</h3>
                  <div className="h-64">
                    <Bar
                      data={symptomFrequencyData}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: { display: false }
                        },
                        scales: {
                          y: {
                            beginAtZero: true,
                            ticks: { stepSize: 1 }
                          }
                        }
                      }}
                    />
                  </div>
                </div>
                <div className="bg-gray-50 p-6 rounded-xl">
                  <h3 className="font-semibold text-gray-900 mb-4">Body Area Distribution</h3>
                  <div className="h-64">
                    <Radar
                      data={bodyAreaData}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        scales: {
                          r: {
                            beginAtZero: true,
                            max: 10
                          }
                        }
                      }}
                    />
                  </div>
                </div>
              </>
            )}

            {selectedMetric === 'severity' && (
              <>
                <div className="bg-gray-50 p-6 rounded-xl col-span-2">
                  <h3 className="font-semibold text-gray-900 mb-4">Severity Trend Over {period}</h3>
                  <div className="h-80">
                    <Line
                      data={severityTrendData}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: { display: false }
                        },
                        scales: {
                          y: {
                            beginAtZero: true,
                            max: 10,
                            ticks: { stepSize: 1 },
                            title: {
                              display: true,
                              text: 'Severity Score'
                            }
                          }
                        }
                      }}
                    />
                  </div>
                </div>
              </>
            )}

            {selectedMetric === 'interactions' && (
              <>
                <div className="bg-gray-50 p-6 rounded-xl">
                  <h3 className="font-semibold text-gray-900 mb-4">Interaction Breakdown</h3>
                  <div className="h-64">
                    <Doughnut
                      data={interactionTypeData}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: {
                            position: 'bottom'
                          }
                        }
                      }}
                    />
                  </div>
                </div>
                <div className="bg-gray-50 p-6 rounded-xl">
                  <h3 className="font-semibold text-gray-900 mb-4">Monthly Distribution</h3>
                  <div className="h-64">
                    <Bar
                      data={monthlyDistributionData}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: { display: false }
                        },
                        scales: {
                          y: {
                            beginAtZero: true,
                            ticks: { stepSize: 1 }
                          }
                        }
                      }}
                    />
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </Section>

      {/* Seasonal/Monthly Patterns - Annual Summary Specific */}
      {isAnnual && data?.seasonal_patterns && (
        <Section id="seasonal" title="Seasonal Patterns" icon={Calendar}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {Object.entries(data.seasonal_patterns).map(([season, pattern]: [string, any]) => (
              <div key={season} className="bg-gradient-to-br from-purple-50 to-blue-50 p-4 rounded-lg">
                <h4 className="font-semibold text-gray-900 mb-2 capitalize">{season}</h4>
                <p className="text-sm text-gray-700">{pattern.description || pattern}</p>
                {pattern.severity_average && (
                  <div className="mt-2">
                    <span className="text-xs text-gray-600">Avg Severity: </span>
                    <span className="text-sm font-bold text-purple-700">{pattern.severity_average}/10</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Year in Review - Annual Summary Specific */}
      {isAnnual && data?.year_in_review && (
        <Section id="review" title="Year in Review" icon={Calendar}>
          <div className="space-y-6">
            {/* Milestones */}
            {data.year_in_review.milestones && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Health Milestones</h3>
                <div className="space-y-3">
                  {data.year_in_review.milestones.map((milestone: any, idx: number) => (
                    <div key={idx} className="flex items-start gap-4 p-4 bg-blue-50 rounded-lg">
                      <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                        {milestone.month || idx + 1}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-blue-900">{milestone.event}</h4>
                        <p className="text-sm text-blue-700 mt-1">{milestone.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Most Effective Treatments */}
            {data.year_in_review.effective_treatments && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Most Effective Treatments</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {data.year_in_review.effective_treatments.map((treatment: any, idx: number) => (
                    <div key={idx} className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-green-900">{treatment.name}</h4>
                        <span className="text-green-700 font-bold">{treatment.effectiveness}% effective</span>
                      </div>
                      <p className="text-sm text-green-700">{treatment.notes}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Section>
      )}

      {/* Health Improvements & Concerns */}
      {(data?.improvements || data?.concerns) && (
        <Section id="progress" title="Progress & Areas of Focus" icon={TrendingUp}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {data.improvements && (
              <div>
                <h3 className="text-lg font-semibold text-green-900 mb-3 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5" />
                  Areas of Improvement
                </h3>
                <div className="space-y-2">
                  {data.improvements.map((improvement: string, idx: number) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      className="flex items-start gap-3 p-3 bg-green-50 rounded-lg"
                    >
                      <ArrowDown className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <span className="text-green-800">{improvement}</span>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {data.concerns && (
              <div>
                <h3 className="text-lg font-semibold text-orange-900 mb-3 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5" />
                  Areas Needing Attention
                </h3>
                <div className="space-y-2">
                  {data.concerns.map((concern: string, idx: number) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      className="flex items-start gap-3 p-3 bg-orange-50 rounded-lg"
                    >
                      <AlertCircle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
                      <span className="text-orange-800">{concern}</span>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Section>
      )}

      {/* Recommendations */}
      {data?.recommendations && (
        <Section id="recommendations" title="Recommendations for Next Period" icon={Target}>
          <div className="space-y-6">
            {data.recommendations.monitoring_priorities && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Monitoring Priorities</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {data.recommendations.monitoring_priorities.map((priority: string, idx: number) => (
                    <div key={idx} className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg">
                      <Target className="w-5 h-5 text-purple-600" />
                      <span className="text-purple-900">{priority}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {data.recommendations.lifestyle_modifications && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Lifestyle Modifications</h3>
                <div className="space-y-2">
                  {data.recommendations.lifestyle_modifications.map((mod: string, idx: number) => (
                    <div key={idx} className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                      <Heart className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                      <span className="text-blue-900">{mod}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {data.recommendations.preventive_measures && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-green-900 mb-3">Preventive Measures</h3>
                <ul className="space-y-2">
                  {data.recommendations.preventive_measures.map((measure: string, idx: number) => (
                    <li key={idx} className="flex items-start gap-2 text-green-800">
                      <span className="font-bold">{idx + 1}.</span>
                      {measure}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </Section>
      )}

      {/* Period Summary Stats */}
      <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl p-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div>
            <p className="text-3xl font-bold text-purple-700">{metrics.totalInteractions}</p>
            <p className="text-sm text-gray-600">Total Interactions</p>
          </div>
          <div>
            <p className="text-3xl font-bold text-blue-700">
              {Math.round((metrics.quickScans / metrics.totalInteractions) * 100)}%
            </p>
            <p className="text-sm text-gray-600">Quick Scan Rate</p>
          </div>
          <div>
            <p className="text-3xl font-bold text-green-700">
              {data?.statistics?.symptoms_resolved || '0'}
            </p>
            <p className="text-sm text-gray-600">Symptoms Resolved</p>
          </div>
          <div>
            <p className="text-3xl font-bold text-orange-700">
              {data?.statistics?.active_concerns || '0'}
            </p>
            <p className="text-sm text-gray-600">Active Concerns</p>
          </div>
        </div>
      </div>

      {/* Export Options */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex items-center justify-center gap-4 py-6"
      >
        <button className="px-6 py-3 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 flex items-center gap-2">
          <Download className="w-5 h-5" />
          Export Full {period} Report
        </button>
      </motion.div>
    </div>
  );
};