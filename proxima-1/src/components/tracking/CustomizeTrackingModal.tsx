'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Brain } from 'lucide-react'

interface CustomizeTrackingModalProps {
  suggestion: {
    id: string
    metric_name: string
    metric_description: string
    y_axis_label: string
    y_axis_type: string
    tracking_type: string
    confidence_score: number
  }
  onSave: (metricName: string, yAxisLabel: string) => void
  onClose: () => void
}

export default function CustomizeTrackingModal({ suggestion, onSave, onClose }: CustomizeTrackingModalProps) {
  const [metricName, setMetricName] = useState(suggestion.metric_name)
  const [yAxisLabel, setYAxisLabel] = useState(suggestion.y_axis_label)

  const handleSave = () => {
    onSave(metricName, yAxisLabel)
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
          className="relative w-full max-w-md backdrop-blur-[20px] bg-gray-900/90 border border-white/10 rounded-2xl shadow-2xl"
        >
          <div className="p-6">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="text-xl font-semibold text-white">Customize Tracking</h2>
                <p className="text-sm text-gray-400 mt-1">Personalize your symptom tracking</p>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-white/5 transition-colors"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Metric Name
                </label>
                <input
                  type="text"
                  value={metricName}
                  onChange={(e) => setMetricName(e.target.value)}
                  className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="e.g., Morning Headache Severity"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Y-Axis Label
                </label>
                <input
                  type="text"
                  value={yAxisLabel}
                  onChange={(e) => setYAxisLabel(e.target.value)}
                  className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="e.g., Pain Level (1-10)"
                />
              </div>
              
              <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Brain className="w-4 h-4 text-purple-400" />
                  <p className="text-sm font-medium text-purple-300">AI Suggestion Info</p>
                </div>
                <p className="text-xs text-gray-400">
                  <strong>Type:</strong> {suggestion.tracking_type}
                </p>
                <p className="text-xs text-gray-400">
                  <strong>Confidence:</strong> {(suggestion.confidence_score * 100).toFixed(0)}%
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  {suggestion.metric_description}
                </p>
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2 bg-white/5 border border-white/10 text-gray-300 rounded-lg hover:bg-white/10 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all"
              >
                Start Tracking
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}