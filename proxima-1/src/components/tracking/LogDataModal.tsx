'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Plus, Minus } from 'lucide-react'

interface LogDataModalProps {
  configId: string
  onSave: (value: number, notes?: string) => void
  onClose: () => void
}

export default function LogDataModal({ configId, onSave, onClose }: LogDataModalProps) {
  const [value, setValue] = useState(5)
  const [notes, setNotes] = useState('')

  const handleSave = () => {
    onSave(value, notes || undefined)
  }

  const incrementValue = () => {
    if (value < 10) setValue(value + 1)
  }

  const decrementValue = () => {
    if (value > 0) setValue(value - 1)
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
                <h2 className="text-xl font-semibold text-white">Log Today's Value</h2>
                <p className="text-sm text-gray-400 mt-1">Record your symptom level</p>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-white/5 transition-colors"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-4">
                  Severity Level
                </label>
                <div className="flex items-center justify-center gap-4">
                  <button
                    onClick={decrementValue}
                    className="p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={value <= 0}
                  >
                    <Minus className="w-5 h-5 text-gray-400" />
                  </button>
                  
                  <div className="relative">
                    <div className="w-32 h-32 rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center">
                      <span className="text-5xl font-bold text-white">{value}</span>
                    </div>
                    <div className="absolute inset-0 rounded-full border-4 border-transparent" 
                         style={{
                           borderTopColor: value > 7 ? '#ef4444' : value > 4 ? '#f59e0b' : '#10b981',
                           borderRightColor: value > 7 ? '#ef4444' : value > 4 ? '#f59e0b' : '#10b981',
                           transform: `rotate(${(value / 10) * 360}deg)`,
                           transition: 'all 0.3s ease'
                         }} />
                  </div>
                  
                  <button
                    onClick={incrementValue}
                    className="p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={value >= 10}
                  >
                    <Plus className="w-5 h-5 text-gray-400" />
                  </button>
                </div>
                
                <div className="flex justify-between mt-4 px-8">
                  <span className="text-xs text-gray-500">None</span>
                  <span className="text-xs text-gray-500">Moderate</span>
                  <span className="text-xs text-gray-500">Severe</span>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Notes (Optional)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                  placeholder="Any additional details..."
                  rows={3}
                />
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
                Save Entry
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}