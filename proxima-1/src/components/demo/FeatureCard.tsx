'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { Check, Lock, Construction, ChevronRight, CheckCircle } from 'lucide-react'

interface FeatureCardProps {
  feature: {
    id: string
    title: string
    subtitle: string
    description: string
    status: 'available' | 'beta' | 'coming-soon'
    releaseDate?: string
    icon: React.ReactNode
    gradient: string
    prerequisites: string[]
  }
  index: number
  isExplored: boolean
  isUnlocked: boolean
  isCompleted: boolean
  onClick: () => void
}

export function FeatureCard({ feature, index, isExplored, isUnlocked, isCompleted, onClick }: FeatureCardProps) {
  const getStatusConfig = () => {
    if (isCompleted) {
      return {
        badge: 'Completed',
        badgeColor: 'bg-green-500/20 text-green-400 border-green-500/30',
        icon: <CheckCircle className="w-3 h-3" />,
        canInteract: true
      }
    }
    
    if (!isUnlocked) {
      return {
        badge: 'Locked',
        badgeColor: 'bg-gray-500/20 text-gray-500 border-gray-500/30',
        icon: <Lock className="w-3 h-3" />,
        canInteract: false
      }
    }
    
    const statusConfig = {
      available: {
        badge: 'Ready Now',
        badgeColor: 'bg-green-500/20 text-green-400 border-green-500/30',
        icon: null,
        canInteract: true
      },
      beta: {
        badge: 'Beta Access',
        badgeColor: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
        icon: <Construction className="w-3 h-3" />,
        canInteract: true
      },
      'coming-soon': {
        badge: 'Coming Soon',
        badgeColor: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
        icon: <Lock className="w-3 h-3" />,
        canInteract: true
      }
    }
    
    return statusConfig[feature.status]
  }

  const config = getStatusConfig()

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      onClick={onClick}
      className={`relative group ${isUnlocked ? 'cursor-pointer' : 'cursor-not-allowed'}`}
    >
      {/* Card */}
      <motion.div
        whileHover={isUnlocked ? { scale: 1.01 } : {}}
        whileTap={isUnlocked ? { scale: 0.99 } : {}}
        transition={{ type: "spring", stiffness: 400, damping: 17 }}
        className={`relative h-full p-8 rounded-2xl backdrop-blur-sm border transition-all duration-300 overflow-hidden ${
          isUnlocked 
            ? 'bg-gray-900/20 border-gray-800/50 hover:border-gray-700/50 hover:bg-gray-900/30' 
            : 'bg-gray-900/10 border-gray-800/30 opacity-50'
        }`}
      >
        {/* Gradient overlay */}
        <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} transition-opacity duration-300 ${
          isUnlocked 
            ? 'opacity-2 group-hover:opacity-5' 
            : 'opacity-1'
        }`} />
        
        {/* Status indicators */}
        {isExplored && isUnlocked && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute top-4 right-4 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center"
          >
            <Check className="w-4 h-4 text-white" />
          </motion.div>
        )}
        
        {/* Lock indicator for locked features */}
        {!isUnlocked && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute top-4 right-4 w-6 h-6 bg-gray-700/80 rounded-full flex items-center justify-center backdrop-blur-sm"
          >
            <Lock className="w-3 h-3 text-gray-400" />
          </motion.div>
        )}

        {/* Content */}
        <div className="relative z-10">
          {/* Icon */}
          <div className="text-5xl mb-4 flex items-center justify-start text-white">
            {feature.icon}
          </div>

          {/* Title and subtitle */}
          <h3 className={`text-2xl font-semibold mb-1 tracking-tight ${
            isUnlocked ? 'text-white' : 'text-gray-500'
          }`}>{feature.title}</h3>
          <p className={`mb-4 font-light ${
            isUnlocked ? 'text-gray-300' : 'text-gray-600'
          }`}>{feature.subtitle}</p>

          {/* Description */}
          <p className={`text-sm mb-6 leading-relaxed ${
            isUnlocked ? 'text-gray-400' : 'text-gray-600'
          }`}>{isUnlocked ? feature.description : 'Complete previous features to unlock'}</p>

          {/* Status Badge */}
          <div className="flex items-center justify-between">
            <div className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border ${config.badgeColor} backdrop-blur-sm`}>
              {config.icon}
              <span>{config.badge}</span>
            </div>
            
            {feature.releaseDate && (
              <span className="text-xs text-gray-500 font-light">{feature.releaseDate}</span>
            )}
          </div>

          {/* Hover indicator */}
          {isUnlocked && (
            <motion.div
              initial={{ opacity: 0, x: -5 }}
              whileHover={{ opacity: 0.7, x: 0 }}
              transition={{ duration: 0.2 }}
              className="absolute bottom-8 right-8 text-white/40"
            >
              <ChevronRight className="w-4 h-4" />
            </motion.div>
          )}
        </div>

        {/* Subtle border highlight */}
        <div className={`absolute inset-0 rounded-2xl border border-transparent group-hover:border-gray-600/30 transition-all duration-300`} />
      </motion.div>

      {/* Glow effect */}
      {isUnlocked && (
        <div className={`absolute -inset-0.5 bg-gradient-to-br ${feature.gradient} rounded-2xl blur-xl opacity-0 group-hover:opacity-10 transition-opacity duration-500`} />
      )}
    </motion.div>
  )
}