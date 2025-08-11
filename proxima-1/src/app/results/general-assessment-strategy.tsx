'use client'

// Results Display Strategy for Different Assessment Types
// This module defines how results should be presented based on assessment category

export interface ResultsDisplayStrategy {
  category: string
  approach: 'care_plan' | 'diagnostic' | 'wellness'
  terminology: {
    primaryTitle: string
    secondaryTitle?: string
    actionWord: string // e.g., "Recommendations", "Care Plan", "Next Steps"
  }
  sections: string[]
  sensitivity: 'standard' | 'high' | 'wellness'
}

const resultStrategies: Record<string, ResultsDisplayStrategy> = {
  // Mental Health - High sensitivity, avoid direct diagnosis language
  mental: {
    category: 'mental',
    approach: 'care_plan',
    terminology: {
      primaryTitle: 'Mental Wellness Plan',
      secondaryTitle: 'Personalized Support Recommendations',
      actionWord: 'Support Strategies'
    },
    sections: [
      'current_state_summary',
      'self_care_recommendations',
      'professional_support_options',
      'lifestyle_modifications',
      'crisis_resources',
      'progress_tracking'
    ],
    sensitivity: 'high'
  },

  // Energy & Fatigue - Wellness focused
  energy: {
    category: 'energy',
    approach: 'wellness',
    terminology: {
      primaryTitle: 'Energy Optimization Plan',
      secondaryTitle: 'Vitality Recovery Strategies',
      actionWord: 'Energy Boosters'
    },
    sections: [
      'energy_assessment',
      'lifestyle_recommendations',
      'sleep_optimization',
      'nutrition_guidance',
      'activity_planning',
      'medical_considerations'
    ],
    sensitivity: 'standard'
  },

  // Digestive Issues - Mixed approach
  digestive: {
    category: 'digestive',
    approach: 'diagnostic',
    terminology: {
      primaryTitle: 'Digestive Health Analysis',
      secondaryTitle: 'Gut Health Recommendations',
      actionWord: 'Treatment Options'
    },
    sections: [
      'symptom_analysis',
      'potential_causes',
      'dietary_modifications',
      'lifestyle_changes',
      'medical_recommendations',
      'monitoring_plan'
    ],
    sensitivity: 'standard'
  },

  // Pain - Care plan focused
  pain: {
    category: 'pain',
    approach: 'care_plan',
    terminology: {
      primaryTitle: 'Pain Management Plan',
      secondaryTitle: 'Relief Strategies',
      actionWord: 'Management Techniques'
    },
    sections: [
      'pain_assessment',
      'immediate_relief_options',
      'long_term_strategies',
      'movement_therapy',
      'medical_interventions',
      'tracking_progress'
    ],
    sensitivity: 'standard'
  },

  // Respiratory - Diagnostic with care
  respiratory: {
    category: 'respiratory',
    approach: 'diagnostic',
    terminology: {
      primaryTitle: 'Respiratory Assessment',
      secondaryTitle: 'Breathing Improvement Plan',
      actionWord: 'Treatment Recommendations'
    },
    sections: [
      'symptom_evaluation',
      'potential_conditions',
      'immediate_actions',
      'environmental_factors',
      'medical_follow_up',
      'emergency_signs'
    ],
    sensitivity: 'standard'
  },

  // Skin & Hair - Wellness approach
  skin: {
    category: 'skin',
    approach: 'wellness',
    terminology: {
      primaryTitle: 'Skin & Hair Health Plan',
      secondaryTitle: 'Dermatological Recommendations',
      actionWord: 'Care Routine'
    },
    sections: [
      'condition_assessment',
      'skincare_routine',
      'lifestyle_factors',
      'product_recommendations',
      'medical_considerations',
      'progress_monitoring'
    ],
    sensitivity: 'standard'
  },

  // Sleep Issues - Wellness focused
  sleep: {
    category: 'sleep',
    approach: 'wellness',
    terminology: {
      primaryTitle: 'Sleep Optimization Plan',
      secondaryTitle: 'Rest & Recovery Strategy',
      actionWord: 'Sleep Solutions'
    },
    sections: [
      'sleep_assessment',
      'sleep_hygiene',
      'environmental_optimization',
      'routine_adjustments',
      'relaxation_techniques',
      'medical_evaluation'
    ],
    sensitivity: 'standard'
  },

  // Hormonal - High sensitivity
  hormonal: {
    category: 'hormonal',
    approach: 'care_plan',
    terminology: {
      primaryTitle: 'Hormonal Balance Plan',
      secondaryTitle: 'Endocrine Health Strategy',
      actionWord: 'Balance Strategies'
    },
    sections: [
      'hormonal_assessment',
      'lifestyle_interventions',
      'nutritional_support',
      'stress_management',
      'medical_consultation',
      'cycle_tracking'
    ],
    sensitivity: 'high'
  },

  // Immune System - Wellness approach
  immune: {
    category: 'immune',
    approach: 'wellness',
    terminology: {
      primaryTitle: 'Immune Support Plan',
      secondaryTitle: 'Immune System Optimization',
      actionWord: 'Immune Boosters'
    },
    sections: [
      'immune_assessment',
      'nutritional_support',
      'lifestyle_factors',
      'stress_reduction',
      'preventive_measures',
      'medical_review'
    ],
    sensitivity: 'standard'
  },

  // Weight & Appetite - High sensitivity
  weight: {
    category: 'weight',
    approach: 'wellness',
    terminology: {
      primaryTitle: 'Metabolic Health Plan',
      secondaryTitle: 'Balanced Nutrition Strategy',
      actionWord: 'Health Strategies'
    },
    sections: [
      'metabolic_assessment',
      'nutritional_guidance',
      'activity_recommendations',
      'behavioral_support',
      'medical_considerations',
      'progress_tracking'
    ],
    sensitivity: 'high'
  },

  // Cardiovascular - Diagnostic with care
  cardiovascular: {
    category: 'cardiovascular',
    approach: 'diagnostic',
    terminology: {
      primaryTitle: 'Cardiovascular Assessment',
      secondaryTitle: 'Heart Health Plan',
      actionWord: 'Heart Care'
    },
    sections: [
      'cardiac_assessment',
      'risk_factors',
      'lifestyle_modifications',
      'emergency_signs',
      'medical_urgency',
      'monitoring_plan'
    ],
    sensitivity: 'high'
  },

  // Other/General - Flexible approach
  other: {
    category: 'other',
    approach: 'care_plan',
    terminology: {
      primaryTitle: 'Health Assessment Results',
      secondaryTitle: 'Personalized Health Plan',
      actionWord: 'Recommendations'
    },
    sections: [
      'symptom_summary',
      'potential_factors',
      'self_care_options',
      'lifestyle_adjustments',
      'medical_guidance',
      'follow_up_plan'
    ],
    sensitivity: 'standard'
  }
}

// Helper function to format results based on strategy
export function formatResultsForCategory(
  category: string,
  aiResponse: any,
  mode: 'flash' | 'quick' | 'deep'
): any {
  const strategy = resultStrategies[category] || resultStrategies.other
  
  // Transform AI response based on strategy
  const formattedResult = {
    title: strategy.terminology.primaryTitle,
    subtitle: strategy.terminology.secondaryTitle,
    approach: strategy.approach,
    sensitivity: strategy.sensitivity,
    
    // Reformat sections based on strategy
    sections: strategy.sections.map(section => {
      switch(section) {
        case 'current_state_summary':
          return {
            title: 'How You're Feeling',
            content: aiResponse.symptoms || aiResponse.description,
            type: 'summary'
          }
        
        case 'self_care_recommendations':
          return {
            title: strategy.terminology.actionWord,
            content: aiResponse.recommendations || aiResponse.self_care,
            type: 'actionable'
          }
        
        case 'potential_causes':
          // Only show for non-sensitive categories
          if (strategy.sensitivity === 'high') {
            return {
              title: 'Contributing Factors',
              content: aiResponse.factors || aiResponse.causes,
              type: 'informational'
            }
          }
          return {
            title: 'Potential Causes',
            content: aiResponse.diagnosis || aiResponse.causes,
            type: 'diagnostic'
          }
        
        case 'medical_recommendations':
        case 'medical_consultation':
        case 'medical_follow_up':
          return {
            title: 'When to See a Doctor',
            content: aiResponse.medical_advice || aiResponse.doctor_visit,
            type: 'medical',
            urgency: aiResponse.urgency || 'routine'
          }
        
        case 'crisis_resources':
          // Only for mental health
          if (category === 'mental') {
            return {
              title: 'Support Resources',
              content: {
                helplines: [
                  '988 Suicide & Crisis Lifeline',
                  'Crisis Text Line: Text HOME to 741741'
                ],
                note: 'These resources are available 24/7'
              },
              type: 'resources'
            }
          }
          return null
        
        default:
          return {
            title: section.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
            content: aiResponse[section] || '',
            type: 'standard'
          }
      }
    }).filter(Boolean),
    
    // Add mode-specific enhancements
    analysisDepth: mode,
    
    // Include raw response for reference but don't display directly
    _rawResponse: aiResponse
  }
  
  return formattedResult
}

// Color schemes for different categories
export const categoryColorSchemes = {
  mental: {
    primary: 'from-violet-500 to-purple-500',
    secondary: 'from-violet-100 to-purple-100',
    accent: 'violet',
    bg: 'bg-violet-50 dark:bg-violet-950/20',
    border: 'border-violet-200 dark:border-violet-800'
  },
  energy: {
    primary: 'from-amber-500 to-orange-500',
    secondary: 'from-amber-100 to-orange-100',
    accent: 'amber',
    bg: 'bg-amber-50 dark:bg-amber-950/20',
    border: 'border-amber-200 dark:border-amber-800'
  },
  digestive: {
    primary: 'from-emerald-500 to-green-500',
    secondary: 'from-emerald-100 to-green-100',
    accent: 'emerald',
    bg: 'bg-emerald-50 dark:bg-emerald-950/20',
    border: 'border-emerald-200 dark:border-emerald-800'
  },
  pain: {
    primary: 'from-rose-500 to-red-500',
    secondary: 'from-rose-100 to-red-100',
    accent: 'rose',
    bg: 'bg-rose-50 dark:bg-rose-950/20',
    border: 'border-rose-200 dark:border-rose-800'
  },
  respiratory: {
    primary: 'from-sky-500 to-blue-500',
    secondary: 'from-sky-100 to-blue-100',
    accent: 'sky',
    bg: 'bg-sky-50 dark:bg-sky-950/20',
    border: 'border-sky-200 dark:border-sky-800'
  },
  skin: {
    primary: 'from-pink-500 to-rose-500',
    secondary: 'from-pink-100 to-rose-100',
    accent: 'pink',
    bg: 'bg-pink-50 dark:bg-pink-950/20',
    border: 'border-pink-200 dark:border-pink-800'
  },
  sleep: {
    primary: 'from-indigo-500 to-violet-500',
    secondary: 'from-indigo-100 to-violet-100',
    accent: 'indigo',
    bg: 'bg-indigo-50 dark:bg-indigo-950/20',
    border: 'border-indigo-200 dark:border-indigo-800'
  },
  hormonal: {
    primary: 'from-purple-500 to-pink-500',
    secondary: 'from-purple-100 to-pink-100',
    accent: 'purple',
    bg: 'bg-purple-50 dark:bg-purple-950/20',
    border: 'border-purple-200 dark:border-purple-800'
  },
  immune: {
    primary: 'from-teal-500 to-emerald-500',
    secondary: 'from-teal-100 to-emerald-100',
    accent: 'teal',
    bg: 'bg-teal-50 dark:bg-teal-950/20',
    border: 'border-teal-200 dark:border-teal-800'
  },
  weight: {
    primary: 'from-violet-500 to-purple-500',
    secondary: 'from-violet-100 to-purple-100',
    accent: 'violet',
    bg: 'bg-violet-50 dark:bg-violet-950/20',
    border: 'border-violet-200 dark:border-violet-800'
  },
  cardiovascular: {
    primary: 'from-red-500 to-rose-500',
    secondary: 'from-red-100 to-rose-100',
    accent: 'red',
    bg: 'bg-red-50 dark:bg-red-950/20',
    border: 'border-red-200 dark:border-red-800'
  },
  other: {
    primary: 'from-gray-500 to-slate-500',
    secondary: 'from-gray-100 to-slate-100',
    accent: 'gray',
    bg: 'bg-gray-50 dark:bg-gray-950/20',
    border: 'border-gray-200 dark:border-gray-800'
  }
}

export default resultStrategies