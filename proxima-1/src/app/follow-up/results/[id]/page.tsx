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

      {/* Evolution Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="mb-6 p-6 bg-white/[0.03] rounded-lg border border-white/[0.05]">
          <div className="mb-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Brain className="h-5 w-5" />
              How Your Condition Has Evolved
            </h3>
          </div>
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

      {/* Main Content Tabs */}
      <div className="space-y-4">
        <div className="grid grid-cols-4 gap-1 p-1 bg-white/[0.03] rounded-lg">
          {['overview', 'patterns', 'treatments', 'recommendations'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-md font-medium transition-all ${
                activeTab === tab 
                  ? 'bg-white/[0.08] text-white' 
                  : 'text-gray-400 hover:text-white hover:bg-white/[0.03]'
              }`}
            >
              {tab === 'overview' && 'Overview'}
              {tab === 'patterns' && 'Patterns'}
              {tab === 'treatments' && 'Treatments'}
              {tab === 'recommendations' && 'Next Steps'}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Your Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                  <h4 className="font-medium mb-2">{result.progression_narrative.summary}</h4>
                  <p className="text-sm text-muted-foreground">{result.progression_narrative.details}</p>
                </div>
                
                {result.progression_narrative.milestone && (
                  <Alert>
                    <Calendar className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Next Milestone:</strong> {result.progression_narrative.milestone}
                    </AlertDescription>
                  </Alert>
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
        <TabsContent value="patterns" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Pattern Insights</CardTitle>
            </CardHeader>
            <CardContent>
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
        <TabsContent value="treatments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Treatment Effectiveness</CardTitle>
            </CardHeader>
            <CardContent>
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
        <TabsContent value="recommendations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recommended Actions</CardTitle>
            </CardHeader>
            <CardContent>
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
                <Alert>
                  <Clock className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Next Follow-Up:</strong> {result.recommendations.next_follow_up}
                  </AlertDescription>
                </Alert>
              </div>
            </div>
          </div>
        )}
      </Tabs>

      {/* Medical Visit Explanation if present */}
      {result.medical_visit_explained && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <Card className="mt-6 border-blue-200 dark:border-blue-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                What Your Doctor Meant
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                <p className="text-sm">{result.medical_visit_explained}</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Action Buttons */}
      <div className="flex justify-between mt-8">
        <Button variant="outline" onClick={() => router.back()}>
          View Original Assessment
        </Button>
        {chain && (
          <Button variant="outline" onClick={() => router.push(`/follow-up/chain/${result.chain_id}`)}>
            View Full Timeline
          </Button>
        )}
      </div>
    </div>
  )
}