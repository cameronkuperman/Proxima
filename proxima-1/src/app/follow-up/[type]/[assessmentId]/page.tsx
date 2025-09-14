'use client'

import { useParams, useRouter } from 'next/navigation'
import { useFollowUp } from '@/hooks/useFollowUp'
import { FollowUpForm } from '@/components/FollowUpForm'
import { ArrowLeft, AlertCircle } from 'lucide-react'
import { useEffect } from 'react'

export default function FollowUpFormPage() {
  const params = useParams()
  const router = useRouter()
  const assessmentId = params.assessmentId as string
  const assessmentType = params.type as string
  
  const {
    loading,
    mergedQuestions,
    context,
    error,
    submitFollowUp,
    navigateToResults
  } = useFollowUp(assessmentId, assessmentType)

  // Check if enough time has passed for follow-up
  useEffect(() => {
    if (!loading && context && context.days_since_original < 1 && context.days_since_last && context.days_since_last < 1) {
      // Too soon for follow-up
    }
  }, [loading, context])

  const handleSubmit = async (responses: Record<string, any>) => {
    try {
      const result = await submitFollowUp(responses)
      
      // Store result temporarily for the results page
      if (result && result.follow_up_id) {
        localStorage.setItem(`followup_result_${result.follow_up_id}`, JSON.stringify({
          ...result,
          assessment_id: assessmentId
        }))
        navigateToResults(result.follow_up_id)
      }
    } catch (err) {
      console.error('Failed to submit follow-up:', err)
      throw err
    }
  }

  const handleCancel = () => {
    router.back()
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-gray-400">Loading follow-up questions...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-500 mt-0.5" />
          <p className="text-sm text-red-300">{error}</p>
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

  // Check if it's too soon for follow-up
  if (context && context.days_since_original === 0 && (!context.days_since_last || context.days_since_last === 0)) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-amber-500 mt-0.5" />
          <p className="text-sm text-amber-300">
            Follow-ups are available starting 1 day after your assessment. Please check back tomorrow.
          </p>
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

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <button
          onClick={() => router.back()}
          className="mb-4 px-3 py-1.5 text-gray-400 hover:text-white transition-colors flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>
        
        <h1 className="text-3xl font-bold mb-2 text-white">Health Follow-Up</h1>
        <p className="text-gray-400">
          Let's check in on how you're doing
          {context?.condition && ` with your ${context.condition}`}
        </p>
      </div>

      <FollowUpForm
        assessmentId={assessmentId}
        assessmentType={assessmentType}
        questions={mergedQuestions}
        context={context || undefined}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
      />
    </div>
  )
}