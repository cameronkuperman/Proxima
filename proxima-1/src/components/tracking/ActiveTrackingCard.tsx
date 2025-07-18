'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { TrendingUp, TrendingDown, Minus, Settings } from 'lucide-react'
import { DashboardItem } from '@/services/trackingService'

interface ActiveTrackingCardProps {
  item: DashboardItem
  onLogValue: (configId: string) => void
  onViewChart: (configId: string) => void
  onCustomize?: (item: DashboardItem) => void
}

export default function ActiveTrackingCard({ item, onLogValue, onViewChart, onCustomize }: ActiveTrackingCardProps) {
  const getTrendIcon = (trend?: string) => {
    if (trend === 'increasing') return <TrendingUp className="w-5 h-5 text-red-400" />
    if (trend === 'decreasing') return <TrendingDown className="w-5 h-5 text-green-400" />
    return <Minus className="w-5 h-5 text-gray-400" />
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'No data yet'
    const date = new Date(dateString)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    if (date.toDateString() === today.toDateString()) {
      return 'Today'
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday'
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="backdrop-blur-[20px] bg-white/[0.03] border border-white/[0.05] rounded-xl p-4 hover:border-white/[0.1] transition-all"
    >
      <div className="flex justify-between items-start mb-3">
        <h3 className="font-medium text-white text-sm">{item.metric_name}</h3>
        {getTrendIcon(item.trend)}
      </div>
      
      <div className="mb-4">
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold text-white">
            {item.latest_value ?? '--'}
          </span>
          <span className="text-xs text-gray-400">
            {item.y_axis_label}
          </span>
        </div>
        <p className="text-xs text-gray-500 mt-1">
          {formatDate(item.latest_date)}
        </p>
      </div>
      
      <div className="flex gap-2">
        <button
          onClick={() => onLogValue(item.id)}
          className="flex-1 px-3 py-1.5 text-xs bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all"
        >
          Log Today
        </button>
        <button
          onClick={() => onViewChart(item.id)}
          className="flex-1 px-3 py-1.5 text-xs bg-white/[0.03] border border-white/[0.05] text-gray-300 rounded-lg hover:bg-white/[0.05] hover:border-white/[0.1] transition-all"
        >
          View Chart
        </button>
        {onCustomize && (
          <button
            onClick={() => onCustomize(item)}
            className="px-2 py-1.5 text-xs bg-white/[0.03] border border-white/[0.05] text-gray-300 rounded-lg hover:bg-white/[0.05] hover:border-white/[0.1] transition-all"
            title="Customize"
          >
            <Settings className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </motion.div>
  )
}