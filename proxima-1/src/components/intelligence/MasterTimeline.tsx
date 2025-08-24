'use client';

import { motion } from 'framer-motion';
import { useState } from 'react';
import { TimelineData } from '@/lib/mock-health-data';
import { Camera, Brain, Zap, AlertTriangle, Calendar, Info } from 'lucide-react';
import { format } from 'date-fns';

interface MasterTimelineProps {
  data: TimelineData;
}

export default function MasterTimeline({ data }: MasterTimelineProps) {
  const [timeRange, setTimeRange] = useState<'7D' | '30D' | '90D' | '1Y' | 'ALL'>('30D');
  const [hoveredPoint, setHoveredPoint] = useState<any>(null);
  const [hoveredEvent, setHoveredEvent] = useState<any>(null);
  
  // Filter data based on time range
  const getFilteredData = () => {
    const now = new Date();
    const ranges = {
      '7D': 7,
      '30D': 30,
      '90D': 90,
      '1Y': 365,
      'ALL': 9999
    };
    
    const daysToShow = ranges[timeRange];
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToShow);
    
    return {
      dataPoints: data.dataPoints.filter(d => new Date(d.date) >= cutoffDate),
      aiConsultations: data.aiConsultations.filter(d => new Date(d.date) >= cutoffDate),
      photoSessions: data.photoSessions.filter(d => new Date(d.date) >= cutoffDate),
      doctorRecommendations: data.doctorRecommendations.filter(d => new Date(d.date) >= cutoffDate)
    };
  };
  
  const filteredData = getFilteredData();
  const maxSeverity = 10;
  
  // Create SVG path for area chart
  const createPath = () => {
    if (filteredData.dataPoints.length === 0) return '';
    
    const width = 100;
    const height = 100;
    
    const points = filteredData.dataPoints.map((point, index) => {
      const x = (index / (filteredData.dataPoints.length - 1)) * width;
      const y = height - ((point.severity / maxSeverity) * height);
      return { x, y };
    });
    
    // Create area path
    let path = `M 0 ${height} `; // Start at bottom left
    points.forEach((point, index) => {
      if (index === 0) {
        path += `L ${point.x} ${point.y} `;
      } else {
        // Use smooth curves between points
        const prevPoint = points[index - 1];
        const cpx = (prevPoint.x + point.x) / 2;
        path += `C ${cpx} ${prevPoint.y} ${cpx} ${point.y} ${point.x} ${point.y} `;
      }
    });
    path += `L ${width} ${height} Z`; // Close the path at bottom right
    
    return path;
  };
  
  const createLinePath = () => {
    if (filteredData.dataPoints.length === 0) return '';
    
    const width = 100;
    const height = 100;
    
    const points = filteredData.dataPoints.map((point, index) => {
      const x = (index / (filteredData.dataPoints.length - 1)) * width;
      const y = height - ((point.severity / maxSeverity) * height);
      return { x, y };
    });
    
    // Create line path
    let path = `M ${points[0].x} ${points[0].y} `;
    points.slice(1).forEach((point, index) => {
      const prevPoint = points[index];
      const cpx = (prevPoint.x + point.x) / 2;
      path += `C ${cpx} ${prevPoint.y} ${cpx} ${point.y} ${point.x} ${point.y} `;
    });
    
    return path;
  };
  
  const getSeverityColor = (severity: number) => {
    if (severity <= 3) return '#00C896';
    if (severity <= 6) return '#FFB800';
    if (severity <= 8) return '#FF9500';
    return '#FF6B6B';
  };
  
  // Get date labels
  const getDateLabels = () => {
    const points = filteredData.dataPoints;
    if (points.length === 0) return [];
    
    const interval = Math.ceil(points.length / 7); // Show max 7 labels
    return points.filter((_, i) => i % interval === 0 || i === points.length - 1)
      .map(p => ({
        date: p.date,
        label: format(new Date(p.date), 'MMM d')
      }));
  };

  return (
    <div className="backdrop-blur-[20px] bg-white/[0.03] border border-white/[0.05] rounded-xl p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-white">Symptom Trajectory</h3>
        
        {/* Time Range Selector */}
        <div className="flex gap-1 bg-white/[0.03] p-1 rounded-lg border border-white/[0.05]">
          {(['7D', '30D', '90D', '1Y', 'ALL'] as const).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-3 py-1 text-xs rounded-md transition-all ${
                timeRange === range
                  ? 'bg-white/[0.08] text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {range === 'ALL' ? 'All' : range}
            </button>
          ))}
        </div>
      </div>
      
      {/* Main Chart Area */}
      <div className="relative">
        {/* Chart Container */}
        <div className="relative h-64 bg-gradient-to-b from-white/[0.02] to-transparent rounded-lg overflow-hidden">
          {/* Y-axis labels */}
          <div className="absolute left-0 top-0 bottom-0 w-12 flex flex-col justify-between py-2 text-xs text-gray-500">
            <span>High</span>
            <span>Med</span>
            <span>Low</span>
          </div>
          
          {/* Chart SVG */}
          <div className="ml-12 h-full relative">
            <svg
              className="absolute inset-0 w-full h-full"
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
            >
              {/* Gradient definition */}
              <defs>
                <linearGradient id="severityGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#FF6B6B" stopOpacity="0.3" />
                  <stop offset="50%" stopColor="#FFB800" stopOpacity="0.2" />
                  <stop offset="100%" stopColor="#00C896" stopOpacity="0.1" />
                </linearGradient>
                <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#a855f7" />
                  <stop offset="100%" stopColor="#ec4899" />
                </linearGradient>
              </defs>
              
              {/* Area fill */}
              <motion.path
                d={createPath()}
                fill="url(#severityGradient)"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 1 }}
              />
              
              {/* Line */}
              <motion.path
                d={createLinePath()}
                fill="none"
                stroke="url(#lineGradient)"
                strokeWidth="2"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 1.5, ease: "easeOut" }}
              />
              
              {/* Data points */}
              {filteredData.dataPoints.map((point, index) => {
                const x = (index / (filteredData.dataPoints.length - 1)) * 100;
                const y = 100 - ((point.severity / maxSeverity) * 100);
                
                return (
                  <motion.circle
                    key={index}
                    cx={x}
                    cy={y}
                    r="1.5"
                    fill={getSeverityColor(point.severity)}
                    initial={{ r: 0 }}
                    animate={{ r: 1.5 }}
                    transition={{ delay: index * 0.02 }}
                    className="cursor-pointer"
                    onMouseEnter={() => setHoveredPoint(point)}
                    onMouseLeave={() => setHoveredPoint(null)}
                  />
                );
              })}
            </svg>
            
            {/* Events Timeline */}
            <div className="absolute bottom-0 left-0 right-0 h-12">
              {/* AI Consultations */}
              {filteredData.aiConsultations.map((consultation, index) => {
                const x = (filteredData.dataPoints.findIndex(d => d.date === consultation.date) / (filteredData.dataPoints.length - 1)) * 100;
                if (isNaN(x)) return null;
                
                return (
                  <motion.div
                    key={consultation.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 + index * 0.05 }}
                    className="absolute"
                    style={{ left: `${x}%` }}
                    onMouseEnter={() => setHoveredEvent(consultation)}
                    onMouseLeave={() => setHoveredEvent(null)}
                  >
                    <div className={`p-1.5 rounded-full ${
                      consultation.type === 'deep_dive' 
                        ? 'bg-purple-500/20 text-purple-400' 
                        : 'bg-blue-500/20 text-blue-400'
                    }`}>
                      {consultation.type === 'deep_dive' ? <Brain className="w-3 h-3" /> : <Zap className="w-3 h-3" />}
                    </div>
                  </motion.div>
                );
              })}
              
              {/* Photo Sessions */}
              {filteredData.photoSessions.map((session, index) => {
                const x = (filteredData.dataPoints.findIndex(d => d.date === session.date) / (filteredData.dataPoints.length - 1)) * 100;
                if (isNaN(x)) return null;
                
                return (
                  <motion.div
                    key={session.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.7 + index * 0.05 }}
                    className="absolute"
                    style={{ left: `${x}%`, top: '20px' }}
                    onMouseEnter={() => setHoveredEvent(session)}
                    onMouseLeave={() => setHoveredEvent(null)}
                  >
                    <div className="p-1.5 bg-pink-500/20 text-pink-400 rounded-full">
                      <Camera className="w-3 h-3" />
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
          
          {/* X-axis labels */}
          <div className="absolute bottom-0 left-12 right-0 flex justify-between px-2 text-xs text-gray-500">
            {getDateLabels().map((label, i) => (
              <span key={i}>{label.label}</span>
            ))}
          </div>
        </div>
        
        {/* Hover tooltips */}
        {hoveredPoint && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute top-2 right-2 bg-black/90 backdrop-blur-sm rounded-lg p-3 text-xs z-10"
          >
            <p className="text-white font-medium">{format(new Date(hoveredPoint.date), 'MMM d, yyyy')}</p>
            <p className="text-gray-400 capitalize mt-1">{hoveredPoint.symptom}</p>
            <p className="text-gray-400">Severity: <span className="text-white">{hoveredPoint.severity}/10</span></p>
            {hoveredPoint.notes && <p className="text-gray-500 mt-1">{hoveredPoint.notes}</p>}
          </motion.div>
        )}
        
        {hoveredEvent && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute top-2 left-2 bg-black/90 backdrop-blur-sm rounded-lg p-3 text-xs z-10"
          >
            <p className="text-white font-medium">
              {hoveredEvent.type === 'quick_scan' ? 'Quick Scan' : 
               hoveredEvent.type === 'deep_dive' ? 'Deep Dive' : 
               hoveredEvent.photoCount ? 'Photo Analysis' : 'Event'}
            </p>
            <p className="text-gray-400">{format(new Date(hoveredEvent.date), 'MMM d, yyyy')}</p>
            {hoveredEvent.bodyPart && <p className="text-gray-400">Body Part: {hoveredEvent.bodyPart}</p>}
            {hoveredEvent.severity && <p className="text-gray-400">Severity: {hoveredEvent.severity}</p>}
          </motion.div>
        )}
      </div>
      
      {/* Legend */}
      <div className="flex flex-wrap items-center justify-center gap-4 mt-4 text-xs text-gray-500">
        <div className="flex items-center gap-1">
          <Zap className="w-3 h-3 text-blue-400" />
          <span>Quick Scan</span>
        </div>
        <div className="flex items-center gap-1">
          <Brain className="w-3 h-3 text-purple-400" />
          <span>Deep Dive</span>
        </div>
        <div className="flex items-center gap-1">
          <Camera className="w-3 h-3 text-pink-400" />
          <span>Photo Analysis</span>
        </div>
        <div className="flex items-center gap-1">
          <AlertTriangle className="w-3 h-3 text-yellow-400" />
          <span>Doctor Visit Recommended</span>
        </div>
      </div>
      
      {/* Summary Stats */}
      <div className="mt-4 p-3 bg-white/[0.02] rounded-lg grid grid-cols-4 gap-4 text-center">
        <div>
          <p className="text-lg font-bold text-white">
            {Math.round(filteredData.dataPoints.reduce((sum, p) => sum + p.severity, 0) / filteredData.dataPoints.length)}
          </p>
          <p className="text-xs text-gray-400">Avg Severity</p>
        </div>
        <div>
          <p className="text-lg font-bold text-green-400">
            {filteredData.dataPoints.filter(p => p.severity <= 3).length}
          </p>
          <p className="text-xs text-gray-400">Good Days</p>
        </div>
        <div>
          <p className="text-lg font-bold text-yellow-400">
            {filteredData.aiConsultations.length}
          </p>
          <p className="text-xs text-gray-400">AI Consults</p>
        </div>
        <div>
          <p className="text-lg font-bold text-pink-400">
            {filteredData.photoSessions.length}
          </p>
          <p className="text-xs text-gray-400">Photo Sessions</p>
        </div>
      </div>
    </div>
  );
}