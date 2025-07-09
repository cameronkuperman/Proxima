'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { Check, Lock, Construction, ChevronRight } from 'lucide-react'

interface FeatureCardProps {
  feature: {
    id: string
    title: string
    subtitle: string
    description: string
    status: 'available' | 'beta' | 'coming-soon'
    releaseDate?: string
    icon: string
    gradient: string
  }
  index: number
  isExplored: boolean
  onClick: () => void
}

export function FeatureCard({ feature, index, isExplored, onClick }: FeatureCardProps) {
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

  const config = statusConfig[feature.status]

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      onClick={onClick}
      className="relative group cursor-pointer"
    >
      {/* Card */}
      <motion.div
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        transition={{ type: "spring", stiffness: 400, damping: 17 }}
        className={`relative h-full p-8 rounded-2xl glass glass-hover card-shadow card-shadow-hover overflow-hidden`}
      >
        {/* Gradient overlay */}
        <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-3 group-hover:opacity-8 transition-opacity duration-300`} />
        
        {/* Explored indicator */}
        {isExplored && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute top-4 right-4 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center"
          >
            <Check className="w-4 h-4 text-white" />
          </motion.div>
        )}

        {/* Content */}
        <div className="relative z-10">
          {/* Icon */}
          <div className="text-5xl mb-4">{feature.icon}</div>

          {/* Title and subtitle */}
          <h3 className="text-2xl font-semibold text-white mb-1 tracking-tight">{feature.title}</h3>
          <p className="text-gray-300 mb-4 font-light">{feature.subtitle}</p>

          {/* Description */}
          <p className="text-gray-400 text-sm mb-6 leading-relaxed">{feature.description}</p>

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
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            whileHover={{ opacity: 1, x: 0 }}
            className="absolute bottom-8 right-8 text-white/50"
          >
            <ChevronRight className="w-5 h-5" />
          </motion.div>
        </div>

        {/* Animated border gradient */}
        <motion.div
          className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-20 transition-opacity`}
          style={{ 
            background: `linear-gradient(45deg, transparent 30%, ${feature.gradient.includes('blue') ? '#3b82f6' : feature.gradient.includes('purple') ? '#a855f7' : '#f97316'} 50%, transparent 70%)`,
            backgroundSize: '200% 200%',
            animation: 'shimmer 3s linear infinite'
          }}
        />
      </motion.div>

      {/* Glow effect */}
      <div className={`absolute -inset-0.5 bg-gradient-to-br ${feature.gradient} rounded-2xl blur-xl opacity-0 group-hover:opacity-30 transition-opacity`} />
    </motion.div>
  )
}