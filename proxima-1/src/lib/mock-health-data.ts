// Mock Health Data Generator for Intelligence Dashboard
import { addDays, subDays, format } from 'date-fns';

export interface HealthVelocityData {
  score: number;
  trend: 'improving' | 'declining' | 'stable';
  momentum: number;
  sparkline: number[];
  recommendations: {
    action: string;
    impact: string;
    icon: string;
  }[];
}

export interface BodySystemData {
  health: number;
  issues: string[];
  trend: 'improving' | 'declining' | 'stable';
  lastUpdated: string;
}

export interface BodySystemsData {
  head: BodySystemData;
  chest: BodySystemData;
  digestive: BodySystemData;
  arms: BodySystemData;
  legs: BodySystemData;
  skin: BodySystemData;
  mental: BodySystemData;
}

export interface TimelineDataPoint {
  date: string;
  severity: number;
  symptom: string;
  notes?: string;
}

export interface AIConsultation {
  id: string;
  date: string;
  type: 'quick_scan' | 'deep_dive';
  bodyPart: string;
  severity: string;
  outcome?: string;
}

export interface PhotoSession {
  id: string;
  date: string;
  photoCount: number;
  improvement?: number;
  bodyPart: string;
  aiNotes?: string;
}

export interface DoctorRecommendation {
  date: string;
  urgency: 'low' | 'medium' | 'high';
  reason: string;
}

export interface TimelineData {
  timeRange: '7D' | '30D' | '90D' | '1Y' | 'ALL';
  dataPoints: TimelineDataPoint[];
  aiConsultations: AIConsultation[];
  photoSessions: PhotoSession[];
  doctorRecommendations: DoctorRecommendation[];
}

export interface PatternCard {
  id: string;
  type: 'correlation' | 'prediction' | 'success' | 'environmental' | 'behavioral';
  priority: 'high' | 'medium' | 'low';
  front: {
    icon: string;
    headline: string;
    confidence: number;
    dataPoints: number;
    actionable: boolean;
  };
  back: {
    fullInsight: string;
    visualization: 'timeline' | 'correlation' | 'comparison' | 'chart';
    data?: any[];
    actions: {
      text: string;
      type: 'primary' | 'secondary';
    }[];
    explanation: string;
  };
}

export interface DoctorReadinessData {
  score: number;
  missingData: string[];
  availableData: {
    symptoms: boolean;
    timeline: boolean;
    patterns: boolean;
    photos: boolean;
    aiAnalysis: boolean;
    medications: boolean;
    vitals: boolean;
  };
  reportSections: string[];
}

export interface ComparativeIntelligenceData {
  similarUsers: number;
  patterns: {
    pattern: string;
    affectedUsers: number;
    successfulInterventions: {
      action: string;
      successRate: number;
      triedBy: number;
      description: string;
    }[];
  }[];
  topRecommendation: string;
}

// Generate realistic timeline data
function generateTimelineData(days: number): TimelineDataPoint[] {
  const data: TimelineDataPoint[] = [];
  const symptoms = ['headache', 'fatigue', 'anxiety', 'insomnia', 'digestive issues'];
  const today = new Date();
  
  for (let i = days - 1; i >= 0; i--) {
    const date = format(subDays(today, i), 'yyyy-MM-dd');
    const dayOfWeek = subDays(today, i).getDay();
    
    // Create pattern: Tuesday stress leads to Wednesday symptoms
    let severity = Math.random() * 4 + 1;
    if (dayOfWeek === 2) { // Tuesday
      severity = Math.min(severity + 2, 8); // Higher stress
    } else if (dayOfWeek === 3) { // Wednesday
      severity = Math.min(severity + 3, 9); // Symptoms appear
    }
    
    // Weekend improvement pattern
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      severity = Math.max(severity - 2, 1);
    }
    
    data.push({
      date,
      severity: Math.round(severity),
      symptom: symptoms[Math.floor(Math.random() * symptoms.length)],
      notes: dayOfWeek === 2 ? 'Stressful meeting day' : undefined
    });
  }
  
  return data;
}

// Generate AI consultations
function generateAIConsultations(days: number): AIConsultation[] {
  const consultations: AIConsultation[] = [];
  const bodyParts = ['head', 'chest', 'stomach', 'back', 'neck'];
  const today = new Date();
  
  // Generate 5-8 consultations over the period
  const consultCount = Math.floor(Math.random() * 4) + 5;
  for (let i = 0; i < consultCount; i++) {
    const daysAgo = Math.floor(Math.random() * days);
    consultations.push({
      id: `consult-${i}`,
      date: format(subDays(today, daysAgo), 'yyyy-MM-dd'),
      type: Math.random() > 0.3 ? 'quick_scan' : 'deep_dive',
      bodyPart: bodyParts[Math.floor(Math.random() * bodyParts.length)],
      severity: ['mild', 'moderate', 'severe'][Math.floor(Math.random() * 3)],
      outcome: 'Recommendations provided'
    });
  }
  
  return consultations.sort((a, b) => a.date.localeCompare(b.date));
}

// Generate photo sessions
function generatePhotoSessions(): PhotoSession[] {
  const today = new Date();
  return [
    {
      id: 'photo-1',
      date: format(subDays(today, 28), 'yyyy-MM-dd'),
      photoCount: 3,
      improvement: 0,
      bodyPart: 'skin',
      aiNotes: 'Baseline established'
    },
    {
      id: 'photo-2',
      date: format(subDays(today, 14), 'yyyy-MM-dd'),
      photoCount: 3,
      improvement: 25,
      bodyPart: 'skin',
      aiNotes: 'Mild improvement in texture'
    },
    {
      id: 'photo-3',
      date: format(subDays(today, 7), 'yyyy-MM-dd'),
      photoCount: 3,
      improvement: 35,
      bodyPart: 'skin',
      aiNotes: 'Significant reduction in inflammation'
    },
    {
      id: 'photo-4',
      date: format(subDays(today, 1), 'yyyy-MM-dd'),
      photoCount: 3,
      improvement: 42,
      bodyPart: 'skin',
      aiNotes: 'Continued improvement, skin tone normalizing'
    }
  ];
}

// Main mock data generator
export function generateMockHealthData() {
  const healthVelocity: HealthVelocityData = {
    score: 73,
    trend: 'improving',
    momentum: 12,
    sparkline: [68, 70, 69, 71, 70, 72, 73],
    recommendations: [
      { action: 'Continue morning walks', impact: '+8 points', icon: '' },
      { action: 'Add vitamin D supplement', impact: '+15 points', icon: '' },
      { action: 'Maintain sleep schedule', impact: '+10 points', icon: '' },
      { action: '5-min meditation daily', impact: '+6 points', icon: '' }
    ]
  };

  const bodySystems: BodySystemsData = {
    head: {
      health: 71,
      issues: ['tension headaches', 'occasional migraines'],
      trend: 'improving',
      lastUpdated: 'Today'
    },
    chest: {
      health: 88,
      issues: [],
      trend: 'stable',
      lastUpdated: '2 days ago'
    },
    digestive: {
      health: 62,
      issues: ['bloating', 'irregular patterns'],
      trend: 'declining',
      lastUpdated: 'Yesterday'
    },
    arms: {
      health: 90,
      issues: [],
      trend: 'stable',
      lastUpdated: '1 week ago'
    },
    legs: {
      health: 85,
      issues: ['minor joint stiffness'],
      trend: 'stable',
      lastUpdated: '3 days ago'
    },
    skin: {
      health: 76,
      issues: ['dryness', 'occasional breakouts'],
      trend: 'improving',
      lastUpdated: 'Today'
    },
    mental: {
      health: 68,
      issues: ['stress', 'anxiety'],
      trend: 'improving',
      lastUpdated: 'Today'
    }
  };

  const timeline: TimelineData = {
    timeRange: '30D',
    dataPoints: generateTimelineData(30),
    aiConsultations: generateAIConsultations(30),
    photoSessions: generatePhotoSessions(),
    doctorRecommendations: [
      {
        date: format(subDays(new Date(), 3), 'yyyy-MM-dd'),
        urgency: 'medium',
        reason: 'Persistent headache pattern requires evaluation'
      }
    ]
  };

  const patternCards: PatternCard[] = [
    {
      id: 'pattern-1',
      type: 'correlation',
      priority: 'high',
      front: {
        icon: '',
        headline: 'Your migraines have a hidden trigger',
        confidence: 87,
        dataPoints: 42,
        actionable: true
      },
      back: {
        fullInsight: 'We analyzed 6 weeks of data and found that 78% of your migraines occur 2-3 days after poor sleep. The pattern is strongest when you get less than 6 hours for 2 consecutive nights.',
        visualization: 'correlation',
        actions: [
          { text: 'Set sleep reminder', type: 'primary' },
          { text: 'Learn more', type: 'secondary' }
        ],
        explanation: 'Your trigger threshold appears to be <6 hours sleep for 2 consecutive nights. This gives you a 24-48 hour window to prevent the migraine.'
      }
    },
    {
      id: 'pattern-2',
      type: 'behavioral',
      priority: 'high',
      front: {
        icon: '',
        headline: 'Tuesday stress → Wednesday symptoms',
        confidence: 89,
        dataPoints: 24,
        actionable: true
      },
      back: {
        fullInsight: 'Every Tuesday when you have your 2pm meetings, stress hormones spike. These consistently manifest as headaches or fatigue on Wednesday afternoons, showing a 24-hour delay pattern.',
        visualization: 'timeline',
        actions: [
          { text: 'Pre-meeting breathing', type: 'primary' },
          { text: 'Reschedule meeting', type: 'secondary' }
        ],
        explanation: 'Your HPA axis takes about 24 hours to process stress hormones, which is why symptoms appear the next day.'
      }
    },
    {
      id: 'pattern-3',
      type: 'success',
      priority: 'medium',
      front: {
        icon: '',
        headline: 'Morning walks reduce afternoon fatigue by 40%',
        confidence: 76,
        dataPoints: 30,
        actionable: true
      },
      back: {
        fullInsight: 'On days you walk before 10am, your afternoon energy scores are 40% higher. The effect is strongest with 20+ minute walks.',
        visualization: 'comparison',
        actions: [
          { text: 'Set walk reminder', type: 'primary' },
          { text: 'View walk history', type: 'secondary' }
        ],
        explanation: 'Morning sunlight exposure and movement regulate your circadian rhythm and boost mitochondrial function.'
      }
    },
    {
      id: 'pattern-4',
      type: 'environmental',
      priority: 'medium',
      front: {
        icon: '',
        headline: 'Weather changes affect you more than most',
        confidence: 72,
        dataPoints: 60,
        actionable: false
      },
      back: {
        fullInsight: 'Barometric pressure drops of >0.5 inches correlate with your headache onset 65% of the time. You appear to be particularly weather-sensitive.',
        visualization: 'chart',
        actions: [
          { text: 'Check weather forecast', type: 'primary' },
          { text: 'Prevention tips', type: 'secondary' }
        ],
        explanation: 'Some people have heightened sensitivity to atmospheric pressure changes, affecting inner ear pressure and triggering headaches.'
      }
    },
    {
      id: 'pattern-5',
      type: 'prediction',
      priority: 'low',
      front: {
        icon: '',
        headline: 'Next high-risk period: Thursday',
        confidence: 68,
        dataPoints: 20,
        actionable: true
      },
      back: {
        fullInsight: 'Based on your 3-week cycle pattern, Thursday shows elevated risk for symptom flare-up. Preventive measures recommended Wednesday evening.',
        visualization: 'timeline',
        actions: [
          { text: 'Set prevention reminder', type: 'primary' },
          { text: 'View cycle pattern', type: 'secondary' }
        ],
        explanation: 'Your symptoms follow a roughly 21-day cycle, possibly linked to hormonal or stress accumulation patterns.'
      }
    }
  ];

  const doctorReadiness: DoctorReadinessData = {
    score: 87,
    missingData: ['Current medications', 'Blood pressure readings', 'Family history'],
    availableData: {
      symptoms: true,
      timeline: true,
      patterns: true,
      photos: true,
      aiAnalysis: true,
      medications: false,
      vitals: false
    },
    reportSections: [
      'Executive Summary',
      'Symptom Timeline',
      'Pattern Analysis',
      'Photo Evidence',
      'AI Insights',
      'Recommendations'
    ]
  };

  const comparativeIntelligence: ComparativeIntelligenceData = {
    similarUsers: 1240,
    patterns: [
      {
        pattern: 'Morning headaches after poor sleep',
        affectedUsers: 892,
        successfulInterventions: [
          {
            action: 'Hydration before bed',
            successRate: 68,
            triedBy: 234,
            description: 'Drinking 16oz water 30 minutes before sleep'
          },
          {
            action: 'Sleep position adjustment',
            successRate: 45,
            triedBy: 156,
            description: 'Elevating head with extra pillow to improve drainage'
          },
          {
            action: 'Magnesium supplement',
            successRate: 72,
            triedBy: 189,
            description: 'Taking 400mg magnesium glycinate before bed'
          }
        ]
      },
      {
        pattern: 'Stress-related digestive issues',
        affectedUsers: 567,
        successfulInterventions: [
          {
            action: 'Pre-meal breathing exercises',
            successRate: 58,
            triedBy: 123,
            description: '5 minutes of diaphragmatic breathing before meals'
          },
          {
            action: 'Probiotic supplementation',
            successRate: 64,
            triedBy: 298,
            description: 'Daily multi-strain probiotic with 50B CFU'
          }
        ]
      }
    ],
    topRecommendation: 'Based on users with similar patterns, magnesium supplementation shows the highest success rate for your symptom profile.'
  };

  return {
    healthVelocity,
    bodySystems,
    timeline,
    patternCards,
    doctorReadiness,
    comparativeIntelligence
  };
}

// Helper to get color for health score
export function getHealthColor(score: number): string {
  if (score >= 80) return '#00C896'; // Green
  if (score >= 60) return '#FFB800'; // Yellow
  if (score >= 40) return '#FF9500'; // Orange
  return '#FF6B6B'; // Red
}

// Helper to get gradient for health score
export function getHealthGradient(score: number): string {
  if (score >= 80) return 'from-green-500 to-emerald-500';
  if (score >= 60) return 'from-yellow-500 to-amber-500';
  if (score >= 40) return 'from-orange-500 to-red-500';
  return 'from-red-500 to-red-600';
}