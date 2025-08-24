'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { 
  ArrowLeft, 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  Calendar,
  Clock,
  ChevronRight,
  AlertCircle,
  CheckCircle2
} from 'lucide-react'
import { motion } from 'framer-motion'
import { format, formatDistanceToNow } from 'date-fns'
import { Line, LineChart, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

interface ChainData {
  chain_id: string
  follow_ups: Array<{
    id: string
    follow_up_number: number
    created_at: string
    days_since_original: number
    severity_score: number
    overall_trend: string
    confidence?: number
  }>
  confidence_progression: number[]
  assessment_progression: string[]
  total_days_tracked: number
  peak_confidence: number
  latest_assessment: string
}

export default function FollowUpChainPage() {
  const params = useParams()
  const router = useRouter()
  const chainId = params.id as string
  
  const [loading, setLoading] = useState(true)
  const [chainData, setChainData] = useState<ChainData | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // In production, fetch from backend
    // For now, using mock data
    setTimeout(() => {
      setChainData({
        chain_id: chainId,
        follow_ups: [
          {
            id: '1',
            follow_up_number: 1,
            created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
            days_since_original: 7,
            severity_score: 5,
            overall_trend: 'somewhat_better',
            confidence: 75
          },
          {
            id: '2',
            follow_up_number: 2,
            created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
            days_since_original: 14,
            severity_score: 3,
            overall_trend: 'much_better',
            confidence: 85
          }
        ],
        confidence_progression: [60, 75, 85],
        assessment_progression: ['Tension headache', 'Migraine', 'Migraine with stress triggers'],
        total_days_tracked: 14,
        peak_confidence: 85,
        latest_assessment: 'Migraine with stress triggers'
      })
      setLoading(false)
    }, 1000)
  }, [chainId])

  if (loading) {
    return (
      <div className="container mx-auto p-6 max-w-6xl">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading progression timeline...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error || !chainData) {
    return (
      <div className="container mx-auto p-6 max-w-6xl">
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-500 mt-0.5" />
          <p className="text-sm">{error || 'Failed to load progression timeline'}</p>
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

  // Prepare chart data
  const chartData = [
    { name: 'Initial', confidence: chainData.confidence_progression[0], day: 0 },
    ...chainData.follow_ups.map((fu, i) => ({
      name: `Follow-up ${fu.follow_up_number}`,
      confidence: chainData.confidence_progression[i + 1],
      day: fu.days_since_original
    }))
  ]

  const getTrendIcon = (trend: string) => {
    if (trend.includes('better')) return <TrendingUp className="h-4 w-4" />
    if (trend.includes('worse')) return <TrendingDown className="h-4 w-4" />
    return <Activity className="h-4 w-4" />
  }

  const getTrendColor = (trend: string) => {
    if (trend.includes('better')) return 'text-green-500'
    if (trend.includes('worse')) return 'text-red-500'
    return 'text-yellow-500'
  }

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
            <h1 className="text-3xl font-bold mb-2">Health Progression Timeline</h1>
            <p className="text-muted-foreground">
              Tracking your condition over {chainData.total_days_tracked} days
            </p>
          </div>
          
          <span className="inline-flex items-center gap-1 px-4 py-2 rounded-full text-lg font-medium border border-white/[0.1] text-white">
            {chainData.peak_confidence}% Confidence
          </span>
        </div>
      </div>

      {/* Summary Card */}
      <div className="mb-6 p-6 bg-white/[0.03] rounded-lg border border-white/[0.05]">
        <h3 className="text-lg font-semibold mb-4">Assessment Evolution</h3>
        <div>
          <div className="flex items-center justify-between">
            {chainData.assessment_progression.map((assessment, i) => (
              <div key={i} className="flex items-center">
                <div className="text-center">
                  <div className={`text-sm font-medium ${i === chainData.assessment_progression.length - 1 ? 'text-primary' : 'text-muted-foreground'}`}>
                    {assessment}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {chainData.confidence_progression[i]}% confidence
                  </div>
                </div>
                {i < chainData.assessment_progression.length - 1 && (
                  <ChevronRight className="h-4 w-4 mx-4 text-muted-foreground" />
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </div>

      {/* Confidence Chart */}
      <div className="mb-6 p-6 bg-white/[0.03] rounded-lg border border-white/[0.05]">
        <h3 className="text-lg font-semibold mb-4">Diagnostic Confidence Over Time</h3>
        <div>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis 
                dataKey="name" 
                stroke="#666"
                tick={{ fill: '#999' }}
              />
              <YAxis 
                stroke="#666"
                tick={{ fill: '#999' }}
                domain={[0, 100]}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1a1a1a', 
                  border: '1px solid #333',
                  borderRadius: '8px'
                }}
              />
              <Line 
                type="monotone" 
                dataKey="confidence" 
                stroke="#8b5cf6" 
                strokeWidth={2}
                dot={{ fill: '#8b5cf6', r: 6 }}
                activeDot={{ r: 8 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </div>

      {/* Timeline */}
      <div className="p-6 bg-white/[0.03] rounded-lg border border-white/[0.05]">
        <h3 className="text-lg font-semibold mb-4">Follow-Up Timeline</h3>
        <div>
          <div className="space-y-4">
            {/* Initial Assessment */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-start gap-4 p-4 rounded-lg bg-secondary/30"
            >
              <div className="flex-shrink-0">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                  <Activity className="h-5 w-5 text-primary" />
                </div>
              </div>
              <div className="flex-grow">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-medium">Initial Assessment</h4>
                  <Badge variant="secondary" className="text-xs">
                    {chainData.assessment_progression[0]}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  {chainData.total_days_tracked} days ago
                </p>
                <div className="mt-2 text-sm">
                  Initial confidence: {chainData.confidence_progression[0]}%
                </div>
              </div>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => router.push('/history/original-assessment-id')}
              >
                View
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </motion.div>

            {/* Follow-ups */}
            {chainData.follow_ups.map((followUp, i) => (
              <motion.div
                key={followUp.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className="flex items-start gap-4 p-4 rounded-lg bg-secondary/30"
              >
                <div className="flex-shrink-0">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    followUp.overall_trend.includes('better') ? 'bg-green-500/20' :
                    followUp.overall_trend.includes('worse') ? 'bg-red-500/20' :
                    'bg-yellow-500/20'
                  }`}>
                    <span className={getTrendColor(followUp.overall_trend)}>
                      {getTrendIcon(followUp.overall_trend)}
                    </span>
                  </div>
                </div>
                <div className="flex-grow">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium">Follow-up #{followUp.follow_up_number}</h4>
                    <Badge variant="outline" className="text-xs">
                      {followUp.overall_trend.replace('_', ' ')}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {formatDistanceToNow(new Date(followUp.created_at), { addSuffix: true })}
                    {' • '}
                    Day {followUp.days_since_original}
                  </p>
                  <div className="mt-2 grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Severity:</span>{' '}
                      <span className="font-medium">{followUp.severity_score}/10</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Confidence:</span>{' '}
                      <span className="font-medium">{followUp.confidence || chainData.confidence_progression[i + 1]}%</span>
                    </div>
                  </div>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => router.push(`/follow-up/results/${followUp.id}`)}
                >
                  View
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </div>

      {/* Next Follow-Up Suggestion */}
      <div className="mt-6 p-6 bg-white/[0.03] rounded-lg border border-white/[0.05]">
        <div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Clock className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium">Next Follow-Up</p>
                <p className="text-sm text-muted-foreground">
                  Recommended in 7 days to continue tracking progress
                </p>
              </div>
            </div>
            <Button onClick={() => router.push(`/follow-up/general/assessment-id`)}>
              Schedule Follow-Up
              <Calendar className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </CardContent>
      </div>
    </div>
  )
}