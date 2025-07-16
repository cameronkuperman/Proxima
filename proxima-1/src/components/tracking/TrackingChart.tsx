'use client'

import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Calendar } from 'lucide-react'
import { useTrackingStore } from '@/stores/useTrackingStore'

interface TrackingChartProps {
  configId: string
  isOpen: boolean
  onClose: () => void
}

export default function TrackingChart({ configId, isOpen, onClose }: TrackingChartProps) {
  const { chartData, fetchChartData } = useTrackingStore()
  const [days, setDays] = useState(30)
  const data = chartData.get(configId)

  useEffect(() => {
    if (isOpen && configId) {
      fetchChartData(configId, days)
    }
  }, [isOpen, configId, days, fetchChartData])

  if (!isOpen || !data) return null

  // Calculate chart dimensions
  const chartWidth = 400
  const chartHeight = 200
  const padding = { top: 20, right: 20, bottom: 40, left: 40 }
  const graphWidth = chartWidth - padding.left - padding.right
  const graphHeight = chartHeight - padding.top - padding.bottom

  // Create SVG path for the line
  const createPath = () => {
    if (!data.data || data.data.length === 0) return ''
    
    const yMin = data.config.y_axis_min ?? 0
    const yMax = data.config.y_axis_max ?? 10
    
    return data.data.map((point, index) => {
      const x = (index / (data.data.length - 1)) * graphWidth + padding.left
      const y = chartHeight - padding.bottom - ((point.y - yMin) / (yMax - yMin)) * graphHeight
      return `${index === 0 ? 'M' : 'L'} ${x},${y}`
    }).join(' ')
  }

  // Create area path
  const createAreaPath = () => {
    const linePath = createPath()
    if (!linePath) return ''
    
    const lastX = graphWidth + padding.left
    const bottomY = chartHeight - padding.bottom
    
    return `${linePath} L ${lastX},${bottomY} L ${padding.left},${bottomY} Z`
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        />
        
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-2xl backdrop-blur-[20px] bg-gray-900/90 border border-white/10 rounded-2xl shadow-2xl"
        >
          <div className="p-6">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="text-xl font-semibold text-white">{data.config.metric_name}</h2>
                <p className="text-sm text-gray-400 mt-1">Tracking history and trends</p>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-white/5 transition-colors"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            {/* Time range selector */}
            <div className="flex items-center gap-2 mb-6">
              <Calendar className="w-4 h-4 text-gray-400" />
              <select
                value={days}
                onChange={(e) => setDays(Number(e.target.value))}
                className="px-3 py-1 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value={7}>Last 7 days</option>
                <option value={30}>Last 30 days</option>
                <option value={90}>Last 90 days</option>
              </select>
            </div>

            {/* Chart */}
            <div className="bg-white/[0.02] rounded-xl p-4">
              <svg 
                viewBox={`0 0 ${chartWidth} ${chartHeight}`} 
                className="w-full h-auto"
                style={{ maxHeight: '300px' }}
              >
                {/* Grid lines */}
                {[0, 1, 2, 3, 4].map((i) => (
                  <line
                    key={i}
                    x1={padding.left}
                    y1={padding.top + (i * graphHeight / 4)}
                    x2={chartWidth - padding.right}
                    y2={padding.top + (i * graphHeight / 4)}
                    stroke="white"
                    strokeOpacity="0.05"
                  />
                ))}

                {/* Y-axis labels */}
                {[0, 1, 2, 3, 4].map((i) => {
                  const yMin = data.config.y_axis_min ?? 0
                  const yMax = data.config.y_axis_max ?? 10
                  const value = yMax - (i * (yMax - yMin) / 4)
                  return (
                    <text
                      key={i}
                      x={padding.left - 10}
                      y={padding.top + (i * graphHeight / 4) + 4}
                      className="text-xs fill-gray-500"
                      textAnchor="end"
                    >
                      {value}
                    </text>
                  )
                })}

                {/* Area fill */}
                <motion.path
                  d={createAreaPath()}
                  fill={`url(#gradient-${configId})`}
                  opacity="0.1"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.1 }}
                  transition={{ duration: 1 }}
                />

                {/* Line */}
                <motion.path
                  d={createPath()}
                  fill="none"
                  stroke={data.config.color || '#a855f7'}
                  strokeWidth="3"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 1, ease: "easeInOut" }}
                />

                {/* Data points */}
                {data.data.map((point, index) => {
                  const yMin = data.config.y_axis_min ?? 0
                  const yMax = data.config.y_axis_max ?? 10
                  const x = (index / (data.data.length - 1)) * graphWidth + padding.left
                  const y = chartHeight - padding.bottom - ((point.y - yMin) / (yMax - yMin)) * graphHeight
                  
                  return (
                    <g key={index}>
                      <motion.circle
                        cx={x}
                        cy={y}
                        r="4"
                        fill={data.config.color || '#a855f7'}
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: index * 0.05 }}
                      />
                      <title>
                        {`${point.y} on ${new Date(point.x).toLocaleDateString()}`}
                        {point.notes && ` - ${point.notes}`}
                      </title>
                    </g>
                  )
                })}

                {/* Gradient definition */}
                <defs>
                  <linearGradient id={`gradient-${configId}`} x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor={data.config.color || '#a855f7'} stopOpacity="0.3" />
                    <stop offset="100%" stopColor={data.config.color || '#a855f7'} stopOpacity="0" />
                  </linearGradient>
                </defs>
              </svg>

              {/* X-axis labels */}
              {data.data.length > 0 && (
                <div className="flex justify-between mt-2 px-10">
                  <span className="text-xs text-gray-500">
                    {new Date(data.data[0].x).toLocaleDateString('en', { month: 'short', day: 'numeric' })}
                  </span>
                  <span className="text-xs text-gray-500">
                    {new Date(data.data[data.data.length - 1].x).toLocaleDateString('en', { month: 'short', day: 'numeric' })}
                  </span>
                </div>
              )}
            </div>

            {/* Statistics */}
            <div className="grid grid-cols-4 gap-4 mt-6">
              <div className="text-center">
                <p className="text-xs text-gray-400">Average</p>
                <p className="text-lg font-semibold text-white">
                  {data.statistics.average.toFixed(1)}
                </p>
              </div>
              <div className="text-center">
                <p className="text-xs text-gray-400">Min</p>
                <p className="text-lg font-semibold text-white">{data.statistics.min}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-gray-400">Max</p>
                <p className="text-lg font-semibold text-white">{data.statistics.max}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-gray-400">Entries</p>
                <p className="text-lg font-semibold text-white">{data.statistics.count}</p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}