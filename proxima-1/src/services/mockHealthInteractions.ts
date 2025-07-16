import { HealthInteraction, QuickScanSession, DeepDiveSession, PhotoSession } from './healthInteractionsService';

// Mock data generator
const generateMockQuickScans = (): QuickScanSession[] => [
  {
    id: 'qs-1',
    user_id: 'user-123',
    body_part: 'head',
    symptoms: 'Severe headache on the right side, throbbing pain',
    pain_level: 7,
    duration: '2 hours',
    created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    analysis: {
      primary_condition: 'Migraine',
      confidence: 0.85,
      recommendations: ['Rest in a dark room', 'Stay hydrated', 'Consider OTC pain relief'],
    },
  },
  {
    id: 'qs-2',
    user_id: 'user-123',
    body_part: 'chest',
    symptoms: 'Mild chest tightness during exercise',
    pain_level: 4,
    duration: '15 minutes',
    created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    analysis: {
      primary_condition: 'Exercise-induced discomfort',
      confidence: 0.72,
      recommendations: ['Warm up properly', 'Monitor intensity', 'See doctor if persists'],
    },
  },
  {
    id: 'qs-3',
    user_id: 'user-123',
    body_part: 'stomach',
    symptoms: 'Nausea and bloating after meals',
    pain_level: 5,
    duration: '3 days',
    created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    analysis: {
      primary_condition: 'Indigestion',
      confidence: 0.78,
      recommendations: ['Eat smaller meals', 'Avoid trigger foods', 'Track food diary'],
    },
  },
];

const generateMockDeepDives = (): DeepDiveSession[] => [
  {
    id: 'dd-1',
    session_id: 'session-abc123',
    user_id: 'user-123',
    body_part: 'back',
    initial_symptoms: 'Lower back pain, sharp when bending',
    model: 'gpt-4',
    status: 'completed',
    created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    completed_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000 + 10 * 60 * 1000).toISOString(),
    questions_asked: 8,
    final_analysis: {
      diagnosis: 'Muscle strain - likely from poor posture',
      confidence: 0.88,
      next_steps: ['Stretching exercises', 'Ergonomic assessment', 'Physical therapy if no improvement'],
    },
  },
  {
    id: 'dd-2',
    session_id: 'session-def456',
    user_id: 'user-123',
    body_part: 'head',
    initial_symptoms: 'Recurring headaches, worse in afternoon',
    model: 'claude-3',
    status: 'completed',
    created_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    completed_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000 + 15 * 60 * 1000).toISOString(),
    questions_asked: 12,
    final_analysis: {
      diagnosis: 'Tension headaches - stress and screen time related',
      confidence: 0.91,
      next_steps: ['Regular breaks from screen', 'Stress management', 'Eye exam recommended'],
    },
  },
];

const generateMockPhotoSessions = (): PhotoSession[] => [
  {
    id: 'ps-1',
    user_id: 'user-123',
    condition_name: 'Skin rash on forearm',
    photos_count: 5,
    created_at: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
    last_updated: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    analysis_summary: 'Appears to be contact dermatitis, showing improvement over time',
  },
  {
    id: 'ps-2',
    user_id: 'user-123',
    condition_name: 'Ankle swelling',
    photos_count: 3,
    created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    last_updated: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
    analysis_summary: 'Minor swelling, likely from sprain. Showing good recovery progress',
  },
];

// Convert to HealthInteraction format
export const generateMockHealthInteractions = (): HealthInteraction[] => {
  const quickScans = generateMockQuickScans().map(qs => ({
    id: qs.id,
    type: 'quick_scan' as const,
    timestamp: qs.created_at,
    data: qs,
  }));

  const deepDives = generateMockDeepDives().map(dd => ({
    id: dd.id,
    type: 'deep_dive' as const,
    timestamp: dd.created_at,
    data: dd,
  }));

  const photoSessions = generateMockPhotoSessions().map(ps => ({
    id: ps.id,
    type: 'photo_session' as const,
    timestamp: ps.created_at,
    data: ps,
  }));

  // Combine and sort by timestamp
  return [...quickScans, ...deepDives, ...photoSessions].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
};

// Mock stats generator
export const generateMockHealthStats = () => {
  const interactions = generateMockHealthInteractions();
  return {
    totalInteractions: interactions.length,
    quickScans: interactions.filter(i => i.type === 'quick_scan').length,
    deepDives: interactions.filter(i => i.type === 'deep_dive').length,
    photoSessions: interactions.filter(i => i.type === 'photo_session').length,
    mostCommonSymptoms: ['Headache', 'Back pain', 'Fatigue'],
    mostAffectedBodyParts: ['Head', 'Back', 'Chest'],
  };
};