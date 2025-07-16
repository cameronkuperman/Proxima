'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { Brain, Sparkles } from 'lucide-react'
import { DashboardItem } from '@/services/trackingService'

interface TrackingSuggestionCardProps {
  suggestion: DashboardItem
  onApprove: () => void
  onCustomize: (suggestion: DashboardItem) => void
}

export default function TrackingSuggestionCard({ suggestion, onApprove, onCustomize }: TrackingSuggestionCardProps) {
  const getSourceIcon = () => {
    if (suggestion.source_type === 'quick_scan') {
      return <Sparkles className="w-4 h-4 text-purple-400" />
    }
    return <Brain className="w-4 h-4 text-blue-400" />
  }

  const getSourceText = () => {
    if (suggestion.source_type === 'quick_scan') {
      return 'From Quick Scan'
    }
    return 'From Deep Dive'
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="backdrop-blur-[20px] bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-xl p-4 hover:border-purple-500/30 transition-all"
    >
      <div className="flex items-start justify-between mb-2">
        <h3 className="font-medium text-white text-sm">{suggestion.metric_name}</h3>
        <div className="flex items-center gap-1">
          {getSourceIcon()}
          <span className="text-xs text-gray-400">{getSourceText()}</span>
        </div>
      </div>
      
      <p className="text-xs text-gray-400 mb-3 line-clamp-2">
        {suggestion.description}
      </p>
      
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-500">
          Confidence: {suggestion.confidence_score ? `${(suggestion.confidence_score * 100).toFixed(0)}%` : 'N/A'}
        </span>
        <div className="flex gap-2">
          <button
            onClick={() => onCustomize(suggestion)}
            className="px-3 py-1 text-xs bg-white/[0.03] border border-white/[0.05] text-gray-300 rounded-lg hover:bg-white/[0.05] hover:border-white/[0.1] transition-all"
          >
            Customize
          </button>
          <button
            onClick={onApprove}
            className="px-3 py-1 text-xs bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all"
          >
            Start Tracking
          </button>
        </div>
      </div>
    </motion.div>
  )
}