'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { 
  ArrowLeft, 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  Brain, 
  CheckCircle2, 
  XCircle, 
  AlertCircle,
  Calendar,
  Sparkles,
  FileText,
  Clock
} from 'lucide-react'
import { motion } from 'framer-motion'
import { useFollowUpResult } from '@/hooks/useFollowUp'

export default function FollowUpResultsPage() {
  const params = useParams()
  const router = useRouter()
  const followUpId = params.id as string
  
  const { loading, result, chain, error } = useFollowUpResult(followUpId)
  const [activeTab, setActiveTab] = useState('overview')

  if (loading) {
    return (
      <div className="container mx-auto p-6 max-w-6xl">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Analyzing your follow-up...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error || !result) {
    return (
      <div className="container mx-auto p-6 max-w-6xl">
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-500 mt-0.5" />
          <p className="text-sm">{error || 'Failed to load follow-up results'}</p>
        </div>
        <button
          onClick={() => router.back()}
          className="mt-4 px-4 py-2 bg-white/[0.05] hover:bg-white/[0.08] text-white rounded-lg transition-all flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Go Back
        </button>
      </div>
    )
  }

  const confidenceLevel = result.assessment.confidence
  const progressionTrend = result.assessment.progression

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => router.back()}
          className="mb-4 px-3 py-1.5 text-gray-400 hover:text-white transition-colors flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>
        
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Follow-Up Results</h1>
            <p className="text-muted-foreground">
              {new Date().toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${
              progressionTrend === 'improving' ? 'bg-green-500/20 text-green-400' : 
              progressionTrend === 'worsening' ? 'bg-red-500/20 text-red-400' : 
              'bg-gray-500/20 text-gray-400'
            }`}>
              {progressionTrend === 'improving' ? <TrendingUp className="h-3 w-3" /> : 
               progressionTrend === 'worsening' ? <TrendingDown className="h-3 w-3" /> :
               <Activity className="h-3 w-3" />}
              {progressionTrend}
            </span>
          </div>
        </div>
      </div>

      {/* Main Evolution Card - Photo Analysis Style */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="backdrop-blur-[20px] bg-white/[0.03] border border-white/[0.05] rounded-xl overflow-hidden mb-6"
      >
        {/* Gradient Header */}
        <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 p-6 border-b border-white/[0.05]">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <Brain className="h-6 w-6" />
                Follow-Up Analysis
              </h2>
              <p className="text-gray-400 mt-1">How Your Condition Has Evolved</p>
            </div>
            <div className="flex items-center gap-3">
              <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium ${
                progressionTrend === 'improving' ? 'bg-green-500/20 text-green-400' : 
                progressionTrend === 'worsening' ? 'bg-red-500/20 text-red-400' : 
                'bg-gray-500/20 text-gray-400'
              }`}>
                {progressionTrend === 'improving' ? <TrendingUp className="h-4 w-4" /> : 
                 progressionTrend === 'worsening' ? <TrendingDown className="h-4 w-4" /> :
                 <Activity className="h-4 w-4" />}
                {progressionTrend === 'improving' ? 'Improving' :
                 progressionTrend === 'worsening' ? 'Worsening' : 'Stable'}
              </span>
            </div>
          </div>
        </div>
        
        {/* Evolution Content */}
        <div className="p-6">
          <div className="space-y-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-secondary/30 rounded-lg">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Original Assessment</p>
                  <p className="font-medium">{result.assessment_evolution.original_assessment}</p>
                </div>
                <ArrowLeft className="h-4 w-4 rotate-180 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Current Understanding</p>
                  <p className="font-medium">{result.assessment_evolution.current_assessment}</p>
                </div>
              </div>
              
              {/* Confidence Progress */}
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium">Diagnostic Confidence</span>
                  <span className="text-sm text-gray-400">{result.assessment_evolution.confidence_change}</span>
                </div>
                <div className="w-full bg-white/[0.05] rounded-full h-2 overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-500"
                    style={{ width: `${confidenceLevel}%` }}
                  />
                </div>
                <p className="text-xs text-gray-400 mt-1">{result.confidence_indicator.explanation}</p>
              </div>
              
              {/* Key Discoveries */}
              {result.assessment_evolution.key_discoveries.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium mb-2 flex items-center gap-1">
                    <Sparkles className="h-3 w-3" />
                    Key Discoveries
                  </h4>
                  <ul className="space-y-1">
                    {result.assessment_evolution.key_discoveries.map((discovery, i) => (
                      <li key={i} className="text-sm flex items-start gap-2">
                        <CheckCircle2 className="h-3 w-3 text-green-500 mt-0.5 flex-shrink-0" />
                        <span>{discovery}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Main Content Tabs with Icons */}
      <div className="space-y-6">
        <div className="backdrop-blur-[20px] bg-white/[0.03] border border-white/[0.05] rounded-xl p-2">
          <div className="grid grid-cols-4 gap-1">
            {[
              { id: 'overview', label: 'Overview', icon: Activity },
              { id: 'patterns', label: 'Patterns', icon: Sparkles },
              { id: 'treatments', label: 'Treatments', icon: CheckCircle2 },
              { id: 'recommendations', label: 'Next Steps', icon: Calendar }
            ].map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-all ${
                    activeTab === tab.id 
                      ? 'bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-white border border-purple-500/30' 
                      : 'text-gray-400 hover:text-white hover:bg-white/[0.03]'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="backdrop-blur-[20px] bg-white/[0.03] border border-white/[0.05] rounded-xl overflow-hidden"
          >
            <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 p-4 border-b border-white/[0.05]">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Your Progress
              </h3>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                  <h4 className="font-medium mb-2">{result.progression_narrative.summary}</h4>
                  <p className="text-sm text-muted-foreground">{result.progression_narrative.details}</p>
                </div>
                
                {result.progression_narrative.milestone && (
                  <div className="flex items-start gap-2 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                    <Calendar className="h-4 w-4 text-blue-400 mt-0.5" />
                    <div className="text-sm">
                      <strong>Next Milestone:</strong> {result.progression_narrative.milestone}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-3 gap-4 mt-4">
                  <div className="text-center p-3 bg-secondary/30 rounded-lg">
                    <p className="text-2xl font-bold">{result.assessment.severity}</p>
                    <p className="text-xs text-muted-foreground">Severity</p>
                  </div>
                  <div className="text-center p-3 bg-secondary/30 rounded-lg">
                    <p className="text-2xl font-bold">{confidenceLevel}%</p>
                    <p className="text-xs text-muted-foreground">Confidence</p>
                  </div>
                  <div className="text-center p-3 bg-secondary/30 rounded-lg">
                    <p className="text-2xl font-bold capitalize">{progressionTrend}</p>
                    <p className="text-xs text-muted-foreground">Trend</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Patterns Tab */}
        {activeTab === 'patterns' && (
          <div className="space-y-4">
            <div className="bg-white/[0.03] rounded-lg border border-white/[0.05] p-6">
              <div className="mb-4">
                <h3 className="text-lg font-semibold">Pattern Insights</h3>
              </div>
              <div className="space-y-4">
                {result.pattern_insights.discovered_patterns.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium mb-3 text-green-600 dark:text-green-400">
                      Discovered Patterns
                    </h4>
                    <div className="space-y-2">
                      {result.pattern_insights.discovered_patterns.map((pattern, i) => (
                        <div key={i} className="flex items-start gap-2 p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
                          <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5" />
                          <span className="text-sm">{pattern}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {result.pattern_insights.concerning_patterns.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium mb-3 text-amber-600 dark:text-amber-400">
                      Areas of Concern
                    </h4>
                    <div className="space-y-2">
                      {result.pattern_insights.concerning_patterns.map((pattern, i) => (
                        <div key={i} className="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-950/20 rounded-lg">
                          <AlertCircle className="h-4 w-4 text-amber-500 mt-0.5" />
                          <span className="text-sm">{pattern}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Treatments Tab */}
        {activeTab === 'treatments' && (
          <div className="space-y-4">
            <div className="bg-white/[0.03] rounded-lg border border-white/[0.05] p-6">
              <div className="mb-4">
                <h3 className="text-lg font-semibold">Treatment Effectiveness</h3>
              </div>
              <div className="grid md:grid-cols-3 gap-4">
                {/* What's Working */}
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-green-600 dark:text-green-400 mb-3">
                    ✅ What's Working
                  </h4>
                  {result.treatment_efficacy.working.map((item, i) => (
                    <div key={i} className="p-2 bg-green-50 dark:bg-green-950/20 rounded text-sm">
                      {item}
                    </div>
                  ))}
                  {result.treatment_efficacy.working.length === 0 && (
                    <p className="text-sm text-muted-foreground">None identified yet</p>
                  )}
                </div>
                
                {/* Not Working */}
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-red-600 dark:text-red-400 mb-3">
                    ❌ Not Effective
                  </h4>
                  {result.treatment_efficacy.not_working.map((item, i) => (
                    <div key={i} className="p-2 bg-red-50 dark:bg-red-950/20 rounded text-sm">
                      {item}
                    </div>
                  ))}
                  {result.treatment_efficacy.not_working.length === 0 && (
                    <p className="text-sm text-muted-foreground">None identified</p>
                  )}
                </div>
                
                {/* Should Try */}
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-blue-600 dark:text-blue-400 mb-3">
                    💡 Consider Trying
                  </h4>
                  {result.treatment_efficacy.should_try.map((item, i) => (
                    <div key={i} className="p-2 bg-blue-50 dark:bg-blue-950/20 rounded text-sm">
                      {item}
                    </div>
                  ))}
                  {result.treatment_efficacy.should_try.length === 0 && (
                    <p className="text-sm text-muted-foreground">No new suggestions</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Recommendations Tab */}
        {activeTab === 'recommendations' && (
          <div className="space-y-4">
            <div className="bg-white/[0.03] rounded-lg border border-white/[0.05] p-6">
              <div className="mb-4">
                <h3 className="text-lg font-semibold">Recommended Actions</h3>
              </div>
              <div className="space-y-4">
                {/* Immediate Actions */}
                {result.recommendations.immediate.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium mb-2 text-red-600 dark:text-red-400">
                      🚨 Immediate Actions
                    </h4>
                    <ul className="space-y-2">
                      {result.recommendations.immediate.map((rec, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm">
                          <AlertCircle className="h-3 w-3 text-red-500 mt-0.5" />
                          <span>{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {/* This Week */}
                {result.recommendations.this_week.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium mb-2">
                      📅 This Week
                    </h4>
                    <ul className="space-y-2">
                      {result.recommendations.this_week.map((rec, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm">
                          <CheckCircle2 className="h-3 w-3 text-blue-500 mt-0.5" />
                          <span>{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {/* Consider */}
                {result.recommendations.consider.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium mb-2">
                      💭 Consider
                    </h4>
                    <ul className="space-y-2">
                      {result.recommendations.consider.map((rec, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm">
                          <Activity className="h-3 w-3 text-gray-500 mt-0.5" />
                          <span>{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {/* Next Follow-Up */}
                <div className="flex items-start gap-2 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                  <Clock className="h-4 w-4 text-blue-400 mt-0.5" />
                  <div className="text-sm">
                    <strong>Next Follow-Up:</strong> {result.recommendations.next_follow_up}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Medical Visit Explanation if present */}
      {result.medical_visit_explained && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <div className="mt-6 bg-white/[0.03] rounded-lg border border-blue-500/20 p-6">
            <div className="mb-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <FileText className="h-5 w-5" />
                What Your Doctor Meant
              </h3>
            </div>
            <div className="p-4 bg-blue-500/10 rounded-lg">
              <p className="text-sm">{result.medical_visit_explained}</p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Action Buttons */}
      <div className="flex justify-between mt-8">
        <button
          className="px-4 py-2 bg-white/[0.05] hover:bg-white/[0.08] text-white rounded-lg transition-all"
          onClick={() => {
            // Navigate to the original assessment results page
            const assessmentType = localStorage.getItem(`assessment_type_${followUpId}`) || 'general'
            const assessmentId = localStorage.getItem(`assessment_id_${followUpId}`)
            if (assessmentId) {
              router.push(`/results/${assessmentType}/${assessmentId}`)
            } else {
              router.back()
            }
          }}
        >
          View Original Assessment
        </button>
        {chain && (
          <button
            className="px-4 py-2 bg-white/[0.05] hover:bg-white/[0.08] text-white rounded-lg transition-all"
            onClick={() => router.push(`/follow-up/chain/${result.chain_id}`)}
          >
            View Full Timeline
          </button>
        )}
      </div>
    </div>
  )
}