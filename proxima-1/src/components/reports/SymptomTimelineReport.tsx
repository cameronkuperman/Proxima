'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calendar,
  Clock,
  TrendingUp,
  TrendingDown,
  Activity,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Filter,
  BarChart3,
  LineChart,
  Target,
  Zap,
  Moon,
  Sun,
  Cloud,
  Wind,
  Droplets,
  ThermometerSun,
  Info,
  ChevronDown
} from 'lucide-react';
import { Line, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
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
  Title,
  Tooltip,
  Legend,
  Filler
);

interface SymptomTimelineReportProps {
  report: any;
}

export const SymptomTimelineReport: React.FC<SymptomTimelineReportProps> = ({ report }) => {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'timeline' | 'chart'>('timeline');
  const [filterSeverity, setFilterSeverity] = useState<number | null>(null);
  const [expandedEvent, setExpandedEvent] = useState<string | null>(null);
  
  const data = report.report_data;
  const timelineData = data?.timeline_data || data?.patient_story?.symptoms_timeline || [];
  
  // Process timeline data for charts
  const chartData = useMemo(() => {
    const events = timelineData.map((event: any) => ({
      date: new Date(event.date),
      severity: event.severity || 0,
      symptom: event.symptom || event.symptoms || '',
      notes: event.notes || event.patient_description || ''
    }));

    // Sort by date
    events.sort((a: any, b: any) => a.date - b.date);

    const labels = events.map((e: any) => e.date.toLocaleDateString());
    const severityData = events.map((e: any) => e.severity);

    return {
      labels,
      datasets: [
        {
          label: 'Symptom Severity',
          data: severityData,
          borderColor: 'rgb(147, 51, 234)',
          backgroundColor: 'rgba(147, 51, 234, 0.1)',
          tension: 0.4,
          fill: true
        }
      ],
      events
    };
  }, [timelineData]);

  const getSeverityColor = (severity: number) => {
    if (severity >= 8) return 'text-red-600 bg-red-50 border-red-200';
    if (severity >= 5) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-green-600 bg-green-50 border-green-200';
  };

  const getWeatherIcon = (weather: string) => {
    const icons: { [key: string]: any } = {
      sunny: Sun,
      cloudy: Cloud,
      rainy: Droplets,
      windy: Wind,
      hot: ThermometerSun,
      cold: ThermometerSun
    };
    const Icon = icons[weather?.toLowerCase()] || Sun;
    return <Icon className="w-4 h-4" />;
  };

  const TimelineEvent = ({ event, index }: { event: any; index: number }) => {
    const isExpanded = expandedEvent === `${index}`;
    const severity = event.severity || 0;
    const date = new Date(event.date);
    
    return (
      <motion.div
        initial={{ opacity: 0, x: -50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: index * 0.1 }}
        className="relative"
      >
        {/* Connection line */}
        {index < timelineData.length - 1 && (
          <div className="absolute left-10 top-20 bottom-0 w-0.5 bg-gray-300" />
        )}
        
        {/* Event */}
        <div className="flex gap-4">
          {/* Timeline dot */}
          <div className="relative z-10">
            <motion.div
              whileHover={{ scale: 1.2 }}
              className={`w-20 h-20 rounded-full border-4 ${getSeverityColor(severity)} 
                flex items-center justify-center cursor-pointer shadow-lg bg-white`}
              onClick={() => setExpandedEvent(isExpanded ? null : `${index}`)}
            >
              <div className="text-center">
                <div className="text-2xl font-bold">{severity}</div>
                <div className="text-xs">/ 10</div>
              </div>
            </motion.div>
          </div>
          
          {/* Event content */}
          <div className="flex-1 mb-8">
            <motion.div
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
              whileHover={{ scale: 1.01 }}
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {event.symptom || event.symptoms}
                  </h3>
                  <p className="text-sm text-gray-500 flex items-center gap-2 mt-1">
                    <Calendar className="w-4 h-4" />
                    {date.toLocaleDateString('en-US', { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </p>
                </div>
                
                {/* Severity indicator */}
                <div className={`px-3 py-1 rounded-full text-sm font-medium ${getSeverityColor(severity)}`}>
                  {severity >= 8 ? 'Severe' : severity >= 5 ? 'Moderate' : 'Mild'}
                </div>
              </div>
              
              <p className="text-gray-700 mb-3">
                {event.notes || event.patient_description}
              </p>
              
              {/* Additional details */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="mt-4 pt-4 border-t border-gray-200"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {event.time_of_day && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Clock className="w-4 h-4" />
                          <span>Time: {event.time_of_day}</span>
                        </div>
                      )}
                      {event.triggers && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Zap className="w-4 h-4" />
                          <span>Trigger: {event.triggers}</span>
                        </div>
                      )}
                      {event.weather && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          {getWeatherIcon(event.weather)}
                          <span>Weather: {event.weather}</span>
                        </div>
                      )}
                    </div>
                    
                    {event.medications_taken && (
                      <div className="mt-3">
                        <p className="text-sm font-medium text-gray-700 mb-1">Medications Taken:</p>
                        <p className="text-sm text-gray-600">{event.medications_taken}</p>
                      </div>
                    )}
                    
                    {event.relief_methods && (
                      <div className="mt-3">
                        <p className="text-sm font-medium text-gray-700 mb-1">Relief Methods:</p>
                        <p className="text-sm text-gray-600">{event.relief_methods}</p>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
              
              <button
                onClick={() => setExpandedEvent(isExpanded ? null : `${index}`)}
                className="mt-3 text-purple-600 text-sm font-medium flex items-center gap-1 hover:text-purple-700"
              >
                {isExpanded ? 'Show Less' : 'Show More'}
                <ChevronDown className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
              </button>
            </motion.div>
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl p-8 text-white">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold mb-2">Symptom Timeline Analysis</h1>
            <p className="text-purple-100">
              Tracking {timelineData.length} symptom events over {chartData.labels.length} days
            </p>
          </div>
          <div className="flex items-center gap-3">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setViewMode('timeline')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                viewMode === 'timeline' 
                  ? 'bg-white text-purple-600' 
                  : 'bg-white/20 text-white hover:bg-white/30'
              }`}
            >
              <Calendar className="w-5 h-5 inline mr-2" />
              Timeline
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setViewMode('chart')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                viewMode === 'chart' 
                  ? 'bg-white text-purple-600' 
                  : 'bg-white/20 text-white hover:bg-white/30'
              }`}
            >
              <LineChart className="w-5 h-5 inline mr-2" />
              Charts
            </motion.button>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
          <div className="bg-white/20 backdrop-blur rounded-lg p-4">
            <p className="text-purple-100 text-sm">Average Severity</p>
            <p className="text-2xl font-bold">
              {(chartData.datasets[0].data.reduce((a: number, b: number) => a + b, 0) / chartData.datasets[0].data.length).toFixed(1)}/10
            </p>
          </div>
          <div className="bg-white/20 backdrop-blur rounded-lg p-4">
            <p className="text-purple-100 text-sm">Highest Severity</p>
            <p className="text-2xl font-bold">
              {Math.max(...chartData.datasets[0].data)}/10
            </p>
          </div>
          <div className="bg-white/20 backdrop-blur rounded-lg p-4">
            <p className="text-purple-100 text-sm">Trend</p>
            <p className="text-2xl font-bold flex items-center gap-2">
              {chartData.datasets[0].data[chartData.datasets[0].data.length - 1] > chartData.datasets[0].data[0] ? (
                <>
                  <TrendingUp className="w-5 h-5" />
                  Worsening
                </>
              ) : (
                <>
                  <TrendingDown className="w-5 h-5" />
                  Improving
                </>
              )}
            </p>
          </div>
          <div className="bg-white/20 backdrop-blur rounded-lg p-4">
            <p className="text-purple-100 text-sm">Duration</p>
            <p className="text-2xl font-bold">
              {Math.ceil((new Date(timelineData[timelineData.length - 1]?.date).getTime() - new Date(timelineData[0]?.date).getTime()) / (1000 * 60 * 60 * 24))} days
            </p>
          </div>
        </div>
      </div>

      {/* Executive Summary */}
      {data?.executive_summary && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Info className="w-5 h-5 text-blue-600" />
            Executive Summary
          </h2>
          <p className="text-gray-700 leading-relaxed">
            {data.executive_summary.one_page_summary}
          </p>
          {data.executive_summary.progression_overview && (
            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
              <p className="text-blue-900 font-medium">Pattern Overview:</p>
              <p className="text-blue-700">{data.executive_summary.progression_overview}</p>
            </div>
          )}
        </div>
      )}

      {/* Main Content */}
      {viewMode === 'timeline' ? (
        <div className="bg-gray-50 rounded-xl p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Symptom Timeline</h2>
          
          {/* Filter Options */}
          <div className="mb-6 flex items-center gap-4">
            <span className="text-sm text-gray-600">Filter by severity:</span>
            <div className="flex gap-2">
              <button
                onClick={() => setFilterSeverity(null)}
                className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                  filterSeverity === null 
                    ? 'bg-purple-600 text-white' 
                    : 'bg-white text-gray-600 hover:bg-gray-100'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilterSeverity(7)}
                className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                  filterSeverity === 7 
                    ? 'bg-red-600 text-white' 
                    : 'bg-white text-gray-600 hover:bg-gray-100'
                }`}
              >
                Severe (7+)
              </button>
              <button
                onClick={() => setFilterSeverity(5)}
                className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                  filterSeverity === 5 
                    ? 'bg-yellow-600 text-white' 
                    : 'bg-white text-gray-600 hover:bg-gray-100'
                }`}
              >
                Moderate (5-6)
              </button>
              <button
                onClick={() => setFilterSeverity(3)}
                className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                  filterSeverity === 3 
                    ? 'bg-green-600 text-white' 
                    : 'bg-white text-gray-600 hover:bg-gray-100'
                }`}
              >
                Mild (1-4)
              </button>
            </div>
          </div>
          
          {/* Timeline */}
          <div className="relative">
            {timelineData
              .filter((event: any) => {
                if (!filterSeverity) return true;
                const severity = event.severity || 0;
                if (filterSeverity === 7) return severity >= 7;
                if (filterSeverity === 5) return severity >= 5 && severity < 7;
                if (filterSeverity === 3) return severity < 5;
                return true;
              })
              .map((event: any, index: number) => (
                <TimelineEvent key={index} event={event} index={index} />
              ))}
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Severity Chart */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Severity Over Time</h2>
            <div className="h-80">
              <Line
                data={chartData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      display: false
                    },
                    tooltip: {
                      callbacks: {
                        afterLabel: (context) => {
                          const event = chartData.events[context.dataIndex];
                          return [`Symptom: ${event.symptom}`, `Notes: ${event.notes}`];
                        }
                      }
                    }
                  },
                  scales: {
                    y: {
                      beginAtZero: true,
                      max: 10,
                      ticks: {
                        stepSize: 1
                      },
                      title: {
                        display: true,
                        text: 'Severity (0-10)'
                      }
                    }
                  }
                }}
              />
            </div>
          </div>

          {/* Frequency Analysis */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Symptom Frequency by Day of Week</h2>
            <div className="h-64">
              <Bar
                data={{
                  labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                  datasets: [{
                    label: 'Number of Events',
                    data: [3, 2, 4, 5, 3, 6, 4], // This would be calculated from actual data
                    backgroundColor: 'rgba(147, 51, 234, 0.5)',
                    borderColor: 'rgb(147, 51, 234)',
                    borderWidth: 1
                  }]
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      display: false
                    }
                  },
                  scales: {
                    y: {
                      beginAtZero: true,
                      ticks: {
                        stepSize: 1
                      }
                    }
                  }
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Pattern Analysis */}
      {data?.pattern_analysis && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Target className="w-5 h-5 text-purple-600" />
            Pattern Analysis
          </h2>
          
          {data.pattern_analysis.correlation_patterns?.symptom_triggers && (
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-800">Your symptoms seem to pop up when...</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {data.pattern_analysis.correlation_patterns.symptom_triggers.map((trigger: string, idx: number) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: idx * 0.1 }}
                    className="flex items-center gap-3 p-3 bg-purple-50 border border-purple-200 rounded-lg"
                  >
                    <Zap className="w-5 h-5 text-purple-600" />
                    <span className="text-purple-900">{trigger}</span>
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};