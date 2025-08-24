'use client'

import { useState } from 'react'
import { ArrowRight, Calendar, TrendingUp } from 'lucide-react'
import { format, differenceInDays } from 'date-fns'

interface FollowUpButtonProps {
  assessmentId: string
  assessmentType: 'quick_scan' | 'deep_dive' | 'general' | 'general_deep'
  assessmentDate: string
  lastFollowUpDate?: string
  suggestedFollowUpDate?: string
  onFollowUpClick: () => void
  variant?: 'default' | 'card' | 'inline'
}

export function FollowUpButton({
  assessmentId,
  assessmentType,
  assessmentDate,
  lastFollowUpDate,
  suggestedFollowUpDate,
  onFollowUpClick,
  variant = 'default'
}: FollowUpButtonProps) {
  const [isHovered, setIsHovered] = useState(false)
  
  // Calculate days since assessment or last follow-up
  const referenceDate = lastFollowUpDate || assessmentDate
  const daysSince = differenceInDays(new Date(), new Date(referenceDate))
  
  // Check if follow-up is suggested
  const isFollowUpDue = suggestedFollowUpDate && new Date() >= new Date(suggestedFollowUpDate)
  
  // Don't show button if less than 1 day has passed
  if (daysSince < 1) {
    return null
  }
  
  // Format text based on context
  const getButtonText = () => {
    if (daysSince === 1) return 'Follow Up (1 day later)'
    if (daysSince < 7) return `Follow Up (${daysSince} days later)`
    if (daysSince < 30) return `Follow Up (${Math.floor(daysSince / 7)} weeks later)`
    return `Follow Up (${Math.floor(daysSince / 30)} months later)`
  }
  
  const getSubtext = () => {
    if (isFollowUpDue) return 'Follow-up recommended'
    if (lastFollowUpDate) return `Last update: ${format(new Date(lastFollowUpDate), 'MMM d')}`
    return `Started: ${format(new Date(assessmentDate), 'MMM d')}`
  }

  // Different variants for different UI contexts
  if (variant === 'card') {
    return (
      <div 
        className={`
          relative overflow-hidden rounded-lg border p-4 cursor-pointer
          transition-all duration-200 hover:shadow-md
          ${isFollowUpDue ? 'border-amber-500/50 bg-amber-50/5' : 'border-border'}
        `}
        onClick={onFollowUpClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">{getButtonText()}</span>
              {isFollowUpDue && (
                <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
                  Due
                </span>
              )}
            </div>
            <p className="text-sm text-muted-foreground mt-1">{getSubtext()}</p>
          </div>
          <ArrowRight className={`
            h-5 w-5 text-muted-foreground transition-transform duration-200
            ${isHovered ? 'translate-x-1' : ''}
          `} />
        </div>
        
        {/* Progress indicator */}
        <div className="mt-3 h-1 bg-secondary rounded-full overflow-hidden">
          <div 
            className="h-full bg-primary transition-all duration-500"
            style={{ 
              width: `${Math.min((daysSince / 14) * 100, 100)}%`,
              opacity: isFollowUpDue ? 1 : 0.6
            }}
          />
        </div>
      </div>
    )
  }
  
  if (variant === 'inline') {
    return (
      <button
        onClick={onFollowUpClick}
        className={`
          inline-flex items-center gap-2 text-sm font-medium
          text-primary hover:text-primary/80 transition-colors
          ${isFollowUpDue ? 'text-amber-600 hover:text-amber-500' : ''}
        `}
      >
        <Calendar className="h-3.5 w-3.5" />
        {getButtonText()}
        {isFollowUpDue && <span className="text-xs">(recommended)</span>}
      </button>
    )
  }
  
  // Default button variant
  return (
    <button
      onClick={onFollowUpClick}
      className={`
        group relative inline-flex items-center px-4 py-2 rounded-lg font-medium
        transition-all duration-200
        ${isFollowUpDue 
          ? 'bg-amber-500 text-white hover:bg-amber-600' 
          : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
        }
        ${isFollowUpDue ? 'border-amber-500/50' : ''}
      `}
    >
      <div className="flex items-center gap-2">
        <TrendingUp className="h-4 w-4" />
        <span>{getButtonText()}</span>
        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
      </div>
      
      {isFollowUpDue && (
        <div className="absolute -top-1 -right-1 h-2 w-2 bg-amber-500 rounded-full animate-pulse" />
      )}
    </button>
  )
}

// Wrapper component for assessment cards
export function FollowUpSection({
  assessmentId,
  assessmentType,
  assessmentDate,
  lastFollowUpDate,
  suggestedFollowUpDate,
  followUpCount = 0
}: Omit<FollowUpButtonProps, 'onFollowUpClick' | 'variant'> & { followUpCount?: number }) {
  const handleFollowUp = () => {
    // Navigate to follow-up form
    window.location.href = `/follow-up/${assessmentType}/${assessmentId}`
  }
  
  return (
    <div className="mt-4 pt-4 border-t">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h4 className="text-sm font-medium">Health Tracking</h4>
          {followUpCount > 0 && (
            <p className="text-xs text-muted-foreground mt-0.5">
              {followUpCount} follow-up{followUpCount !== 1 ? 's' : ''} completed
            </p>
          )}
        </div>
        {followUpCount > 0 && (
          <button className="text-xs text-primary hover:underline">
            View timeline
          </button>
        )}
      </div>
      
      <FollowUpButton
        assessmentId={assessmentId}
        assessmentType={assessmentType}
        assessmentDate={assessmentDate}
        lastFollowUpDate={lastFollowUpDate}
        suggestedFollowUpDate={suggestedFollowUpDate}
        onFollowUpClick={handleFollowUp}
        variant="card"
      />
    </div>
  )
}