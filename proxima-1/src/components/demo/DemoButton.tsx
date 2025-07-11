'use client'

import React from 'react'
import { Play } from 'lucide-react'

interface DemoButtonProps {
  variant?: 'primary' | 'secondary'
  showIcon?: boolean
  text?: string
}

export function DemoButton({ 
  variant = 'primary', 
  showIcon = false,
  text = 'Try Demo'
}: DemoButtonProps) {
  const handleClick = () => {
    // Dispatch custom event to trigger walkthrough
    window.dispatchEvent(new CustomEvent('openWalkthrough'))
  }

  return (
    <button
      onClick={handleClick}
      className={`
        px-6 py-3 rounded-lg font-medium transition-all duration-200
        ${variant === 'primary' 
          ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600' 
          : 'bg-white/10 text-white hover:bg-white/20 backdrop-blur-sm'
        }
      `}
    >
      <span className="flex items-center gap-2">
        {showIcon && <Play className="w-4 h-4" />}
        {text}
      </span>
    </button>
  )
}