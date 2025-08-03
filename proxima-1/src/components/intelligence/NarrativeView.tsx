'use client';

import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { healthStoryService, HealthStoryData, RefreshInfo } from '@/lib/health-story';
import { storyNotesService, StoryNote } from '@/lib/story-notes';
import { RefreshCw, Calendar, Info, Edit2, Trash2, Check } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useHealthAnalysis, useExportPDF, useShareWithDoctor, useHealthIntelligence } from '@/hooks/useHealthIntelligence';
import { useWeeklyAIPredictions } from '@/hooks/useWeeklyAIPredictions';
import { format, startOfWeek } from 'date-fns';
import { toast } from 'sonner';
import { ShareModal } from '@/components/modals/ShareModal';



interface Insight {
  id: string;
  user_id?: string;
  story_id?: string | null;
  insight_type: 'positive' | 'warning' | 'neutral';
  title: string;
  description: string;
  confidence: number;
  week_of?: string;
  created_at?: string;
  metadata?: Record<string, any>;
}

interface Episode {
  id: string; // Changed to string to match story IDs
  date: string;
  title: string;
  subtitle?: string;
  preview: string;
  content: string;
  generatedDate?: string;
  dataSources?: {
    oracle_chats?: number;
    quick_scans?: number;
    deep_dives?: number;
    symptom_entries?: number;
  };
}

interface ShadowPattern {
  id: string;
  user_id?: string;
  pattern?: string; // Fallback field
  pattern_name?: string; // Backend field
  pattern_category?: 'symptom' | 'treatment' | 'wellness' | 'medication' | 'other';
  lastSeen?: string; // Fallback field
  last_seen_description?: string; // Backend field
  significance: 'high' | 'medium' | 'low';
  last_mentioned_date?: string;
  days_missing?: number;
  week_of?: string;
  created_at?: string;
}

interface HealthStrategy {
  id: string;
  user_id?: string;
  strategy: string;
  strategy_type: 'discovery' | 'pattern' | 'prevention' | 'optimization';
  priority?: number;
  rationale?: string;
  expected_outcome?: string;
  week_of?: string;
  created_at?: string;
  completion_status?: 'pending' | 'in_progress' | 'completed' | 'skipped';
}

interface Prediction {
  id: string;
  user_id?: string;
  story_id?: string | null;
  event?: string; // Fallback
  event_description?: string; // Backend field
  probability: number;
  timeframe: string;
  preventable: boolean;
  reasoning?: string;
  suggested_actions?: string[];
  week_of?: string;
  created_at?: string;
}

export default function NarrativeView() {
  const { user } = useAuth();
  const [currentEpisode, setCurrentEpisode] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [healthStories, setHealthStories] = useState<HealthStoryData[]>([]);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [refreshInfo, setRefreshInfo] = useState<RefreshInfo | null>(null);
  
  // Backend integration hooks
  const { data: analysisData, isLoading: isAnalysisLoading, error: analysisError } = useHealthAnalysis();
  
  // Get updateStrategyStatus from health intelligence hook
  const { updateStrategyStatus } = useHealthIntelligence();
  
  // Log analysis data for debugging
  useEffect(() => {
    console.log('🔍 NarrativeView Analysis Data:', {
      analysisData,
      isLoading: isAnalysisLoading,
      error: analysisError,
      insights: analysisData?.insights,
      predictions: analysisData?.predictions,
      shadowPatterns: analysisData?.shadow_patterns,
      strategies: analysisData?.strategies
    });
  }, [analysisData, isAnalysisLoading, analysisError]);
  
  // Use weekly AI predictions for pattern questions
  const { 
    patternQuestions: weeklyPatternQuestions,
    bodyPatterns: weeklyBodyPatterns,
    allPredictions: weeklyPredictions,
    dashboardAlert,
    dataQualityScore
  } = useWeeklyAIPredictions();
  const { exportPDF, isExporting } = useExportPDF();
  const { share: shareWithDoctor, isSharing } = useShareWithDoctor();
  const [shareLink, setShareLink] = useState<string | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);

  const story = episodes[currentEpisode] || null;

  // Use backend data only - no fallbacks
  const insights = analysisData?.insights || [];
  
  // Log what insights we're using
  console.log('📊 Insights being used:', {
    fromBackend: analysisData?.insights,
    actualInsights: insights,
    count: insights.length
  });


  // Use shadow patterns from backend only
  const shadowPatterns = analysisData?.shadow_patterns || [];
  const patternsToShow = shadowPatterns;
  
  // Log shadow patterns data
  console.log('👻 Shadow Patterns:', {
    fromBackend: shadowPatterns,
    patternsToShow,
    count: patternsToShow.length
  });

  // Combine strategies from health intelligence with pattern questions from weekly predictions
  const baseStrategies = analysisData?.strategies || [];
  
  // Convert pattern questions to strategies if no strategies available
  const patternStrategies = weeklyPatternQuestions && baseStrategies.length === 0
    ? weeklyPatternQuestions.slice(0, 5).map(q => ({
        id: q.id,
        strategy: q.question,
        strategy_type: 'discovery' as const
      }))
    : [];
  
  const healthStrategies = baseStrategies.length > 0 ? baseStrategies : patternStrategies;

  // Use weekly predictions if available
  const predictions = weeklyPredictions && weeklyPredictions.length > 0 
    ? weeklyPredictions.filter(p => p.type === 'immediate').slice(0, 4).map(p => ({
        id: p.id,
        event_description: p.title,
        probability: p.confidence,
        timeframe: p.timeframe || 'Next 7 days',
        preventable: true,
        reasoning: p.reasoning
      }))
    : analysisData?.predictions || [];

  const [showNoteInput, setShowNoteInput] = useState(false);
  const [note, setNote] = useState('');
  const [storyNote, setStoryNote] = useState<StoryNote | null>(null);
  const [isEditingNote, setIsEditingNote] = useState(false);
  const [isSavingNote, setIsSavingNote] = useState(false);

  // Load health stories from backend when component mounts
  useEffect(() => {
    if (user?.id) {
      loadHealthStories();
      loadRefreshInfo();
    }
  }, [user?.id]);

  // Load note for current story
  useEffect(() => {
    if (story && user?.id) {
      loadNoteForStory(story.id);
    }
  }, [story?.id, user?.id]);

  const loadRefreshInfo = async () => {
    if (!user?.id) return;
    const info = await healthStoryService.getRefreshInfo(user.id);
    setRefreshInfo(info);
  };

  const loadNoteForStory = async (storyId: string) => {
    const note = await storyNotesService.getNoteForStory(storyId);
    setStoryNote(note);
    setNote('');
    setShowNoteInput(false);
    setIsEditingNote(false);
  };

  const saveNote = async () => {
    if (!user?.id || !story || !note.trim()) return;
    
    setIsSavingNote(true);
    try {
      if (storyNote && isEditingNote) {
        // Update existing note
        const updatedNote = await storyNotesService.updateNote(storyNote.id, note);
        if (updatedNote) {
          setStoryNote(updatedNote);
          setIsEditingNote(false);
        }
      } else {
        // Create new note
        const newNote = await storyNotesService.createNote(user.id, {
          story_id: story.id,
          note_text: note
        });
        if (newNote) {
          setStoryNote(newNote);
        }
      }
      setShowNoteInput(false);
      setNote('');
    } catch (error) {
      console.error('Error saving note:', error);
    } finally {
      setIsSavingNote(false);
    }
  };

  const deleteNote = async () => {
    if (!storyNote) return;
    
    const confirmed = window.confirm('Are you sure you want to delete this note?');
    if (!confirmed) return;
    
    const success = await storyNotesService.deleteNote(storyNote.id);
    if (success) {
      setStoryNote(null);
      setNote('');
      setIsEditingNote(false);
      setShowNoteInput(false);
    }
  };

  const startEditingNote = () => {
    if (storyNote) {
      setNote(storyNote.note_text);
      setIsEditingNote(true);
      setShowNoteInput(true);
    }
  };

  const loadHealthStories = async () => {
    if (!user?.id) return;
    
    try {
      setIsLoading(true);
      setError(null);

      // Get past stories from backend
      const stories = await healthStoryService.getHealthStories(user.id);
      setHealthStories(stories);

      // Check if we need to generate a new story
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

      const recentStory = stories.find(story => 
        new Date(story.created_at) > oneWeekAgo
      );

      if (!recentStory && stories.length === 0) {
        // Generate new story if no stories exist at all
        await generateNewStory();
      } else if (stories.length > 0) {
        // Update episodes with backend data
        updateEpisodesFromStories(stories);
      } else {
        // No stories and no recent story - show default
        setEpisodes(getDefaultEpisodes());
      }
    } catch (err) {
      console.error('Error loading health stories:', err);
      setError('Failed to load health stories');
      // Set default episodes if loading fails and no episodes exist
      if (episodes.length === 0) {
        setEpisodes(getDefaultEpisodes());
      }
    } finally {
      setIsLoading(false);
      setIsInitialLoad(false);
    }
  };

  const generateNewStory = async () => {
    if (!user?.id) return;
    
    try {
      setIsLoading(true);
      setError(null);

      // Check refresh limit first
      const refreshCheck = await healthStoryService.checkAndRecordRefresh(user.id);
      
      if (!refreshCheck.success) {
        setError(refreshCheck.error || 'Refresh limit reached');
        setRefreshInfo(refreshCheck.refreshInfo || null);
        setIsLoading(false);
        return;
      }

      // Update refresh info
      setRefreshInfo(refreshCheck.refreshInfo || null);

      const response = await healthStoryService.generateWeeklyHealthStory(user.id);
      console.log('Health story generation response:', response);

      if (response.success && response.health_story) {
        const newStory: HealthStoryData & { title?: string; subtitle?: string } = {
          id: response.health_story.story_id,
          user_id: user.id,
          header: response.health_story.header,
          story_text: response.health_story.story_text,
          generated_date: response.health_story.generated_date,
          created_at: new Date().toISOString(),
          title: response.health_story.title,
          subtitle: response.health_story.subtitle
        };

        // Save the story to Supabase
        await healthStoryService.saveHealthStory(newStory);
        
        const updatedStories = [newStory, ...healthStories];
        setHealthStories(updatedStories);
        updateEpisodesFromStories(updatedStories);
        setCurrentEpisode(0); // Show the newly generated story
      } else {
        const errorMessage = response.error || response.message || 'Failed to generate health story';
        setError(errorMessage);
        console.error('Health story generation failed:', errorMessage);
        // Show demo content when API fails
        if (episodes.length === 0) {
          setEpisodes(getDefaultEpisodes());
        }
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate health story';
      setError(errorMessage);
      console.error('Error generating health story:', err);
      // Show demo content when catch block is triggered
      if (episodes.length === 0) {
        setEpisodes(getDefaultEpisodes());
      }
    } finally {
      setIsLoading(false);
    }
  };

  const getDefaultEpisodes = (): Episode[] => [
    {
      id: 'default-1',
      date: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
      title: 'Your Health Patterns This Week',
      subtitle: 'An analysis of your wellness trends',
      preview: 'Sleep improvements and headache patterns',
      content: `Your health journey continues to show positive momentum. This week has been marked by significant improvements in your sleep quality, with an average increase of 23% in deep sleep phases compared to last week. This improvement correlates strongly with the reduction in evening screen time you've implemented.

The persistent morning headaches you've been experiencing appear to be linked to a combination of factors: dehydration, elevated stress levels on weekdays, and potentially your sleeping position. The pattern analysis shows that headaches are 78% more likely on days following less than 6 hours of sleep.

Your body's response to the new exercise routine has been overwhelmingly positive. Heart rate variability has improved by 15%, and your resting heart rate has decreased by 4 bpm over the past month. These are strong indicators of improving cardiovascular health.`
    },
    {
      id: 'default-2',
      date: 'December 8, 2024',
      title: 'The Hydration Discovery',
      preview: 'How water intake affected your symptoms',
      content: `This week revealed a crucial connection between your hydration levels and symptom frequency. After increasing water intake by 40%, morning headaches decreased by 60%. The data shows optimal hydration windows throughout your day.`
    },
    {
      id: 'default-3',
      date: 'December 1, 2024',
      title: 'Stress and Sleep Correlation',
      preview: 'Understanding your rest patterns',
      content: `Analysis of your sleep data uncovered that work stress directly impacts sleep quality. Tuesday and Wednesday nights consistently show 30% less REM sleep, correlating with your busiest work days.`
    }
  ];

  const updateEpisodesFromStories = (stories: HealthStoryData[]) => {
    const newEpisodes: Episode[] = stories.map((story) => ({
      id: story.id, // Use the actual story ID
      date: new Date(story.created_at).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric'
      }),
      title: story.metadata?.title || story.header || 'Health Story',
      subtitle: story.metadata?.subtitle || story.subtitle,
      preview: story.subtitle || story.story_text.substring(0, 100) + '...',
      content: story.story_text, // This is already clean content from health-story.ts
      generatedDate: story.generated_date,
      dataSources: story.data_sources
    }));

    // Use default episodes if no stories
    if (newEpisodes.length === 0) {
      setEpisodes(getDefaultEpisodes());
    } else {
      setEpisodes(newEpisodes);
    }
  };

  return (
    <div className="flex gap-8 max-w-[1600px] mx-auto">
      {/* Episodes Sidebar - Far left */}
      <motion.div 
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="w-64 flex-shrink-0 hidden xl:block"
      >
        <div className="sticky top-24 space-y-4">
          <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider">Past Episodes</h3>
          <div className="space-y-2 max-h-[calc(100vh-200px)] overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent pr-2">
            {episodes.map((episode, index) => (
              <motion.button
                key={episode.id}
                onClick={() => setCurrentEpisode(index)}
                className={`w-full text-left p-4 rounded-lg border transition-all ${
                  currentEpisode === index
                    ? 'bg-white/[0.05] border-purple-500/50'
                    : 'bg-white/[0.02] border-white/[0.05] hover:bg-white/[0.03] hover:border-white/[0.08]'
                }`}
                whileHover={{ x: 4 }}
              >
                <p className="text-xs text-gray-500 mb-1">{episode.date}</p>
                <h4 className={`font-medium mb-1 text-sm ${currentEpisode === index ? 'text-white' : 'text-gray-300'}`}>
                  {episode.title}
                </h4>
                <p className="text-xs text-gray-400 line-clamp-2">{episode.preview}</p>
              </motion.button>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Main Content Area */}
      <div className="flex-1 flex gap-6">
        {/* Main Story Column */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="flex-1 max-w-5xl space-y-6"
        >
          {/* Main Story */}
          {isInitialLoad && isLoading ? (
          <div className="backdrop-blur-[20px] bg-white/[0.03] border border-white/[0.05] rounded-xl p-8">
            <div className="flex items-center justify-center py-16">
              <div className="text-center">
                <RefreshCw className="animate-spin w-8 h-8 text-purple-500 mx-auto mb-4" />
                <p className="text-gray-400">Loading your health stories...</p>
              </div>
            </div>
          </div>
        ) : !story ? (
          <div className="backdrop-blur-[20px] bg-white/[0.03] border border-white/[0.05] rounded-xl p-8">
            <div className="flex items-center justify-center py-16">
              <div className="text-center">
                <p className="text-gray-400 mb-4">No health story available</p>
                <button
                  onClick={generateNewStory}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  Generate Health Story
                </button>
              </div>
            </div>
          </div>
        ) : (
        <div className="backdrop-blur-[20px] bg-white/[0.03] border border-white/[0.05] rounded-xl p-8">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h2 className="text-2xl font-semibold text-white mb-2">{story.title}</h2>
              {story.subtitle && (
                <p className="text-base text-gray-300 mb-2">{story.subtitle}</p>
              )}
              <p className="text-sm text-gray-400">{story.date} • AI-generated analysis</p>
            </div>
            <div className="flex items-center gap-4">
              {refreshInfo && (
                <div className="text-sm text-gray-400">
                  <div className="flex items-center gap-2">
                    {refreshInfo.remaining > 0 ? (
                      <span>{refreshInfo.remaining} refresh{refreshInfo.remaining !== 1 ? 'es' : ''} left this week</span>
                    ) : (
                      <span className="text-orange-400">No refreshes left</span>
                    )}
                    <div className="relative group">
                      <Info className="w-4 h-4 cursor-help" />
                      <div className="absolute right-0 top-6 w-64 p-3 bg-gray-800 border border-gray-700 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                        <p className="text-xs text-gray-300 mb-2">
                          You can refresh your health story up to {refreshInfo.limit} times per week.
                        </p>
                        <p className="text-xs text-gray-400">
                          Resets: {new Date(refreshInfo.next_reset).toLocaleDateString('en-US', {
                            weekday: 'long',
                            month: 'short',
                            day: 'numeric',
                            hour: 'numeric',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={generateNewStory}
                disabled={isLoading || !user?.id || (refreshInfo ? !refreshInfo.can_refresh : false)}
                className="p-2 text-gray-400 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title={refreshInfo && !refreshInfo.can_refresh ? "Refresh limit reached" : "Regenerate story"}
              >
                {isLoading ? (
                  <RefreshCw className="w-5 h-5 animate-spin" />
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                )}
              </motion.button>
            </div>
          </div>

          {isLoading && currentEpisode === 0 ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <RefreshCw className="animate-spin w-8 h-8 text-purple-500 mx-auto mb-4" />
                <p className="text-gray-400">Generating your health story...</p>
              </div>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-red-400 mb-4">{error}</p>
              {!error.includes('not available yet') && (
                <button
                  onClick={generateNewStory}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  Try Again
                </button>
              )}
            </div>
          ) : (
            <div className="prose prose-invert max-w-none">
              <p className="text-gray-300 leading-relaxed whitespace-pre-wrap">
                {story.content}
              </p>
            </div>
          )}

          {/* Data Sources if available */}
          {story && story.dataSources && (
            <div className="mt-6 p-4 bg-white/[0.02] border border-white/[0.05] rounded-lg">
              <h4 className="text-sm font-medium text-gray-400 mb-3">Data Sources</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Oracle Chats:</span>{' '}
                  <span className="text-white">{story.dataSources.oracle_chats || 0}</span>
                </div>
                <div>
                  <span className="text-gray-500">Quick Scans:</span>{' '}
                  <span className="text-white">{story.dataSources.quick_scans || 0}</span>
                </div>
                <div>
                  <span className="text-gray-500">Deep Dives:</span>{' '}
                  <span className="text-white">{story.dataSources.deep_dives || 0}</span>
                </div>
                <div>
                  <span className="text-gray-500">Symptom Entries:</span>{' '}
                  <span className="text-white">{story.dataSources.symptom_entries || 0}</span>
                </div>
              </div>
            </div>
          )}

          {/* Personal Note Section */}
          <div className="mt-6 pt-6 border-t border-white/[0.05]">
            {/* Display existing note */}
            {storyNote && !showNoteInput && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-4"
              >
                <div className="flex items-start justify-between mb-2">
                  <h4 className="text-sm font-medium text-gray-400">Personal Note</h4>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={startEditingNote}
                      className="p-1 text-gray-400 hover:text-white transition-colors"
                      title="Edit note"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={deleteNote}
                      className="p-1 text-gray-400 hover:text-red-400 transition-colors"
                      title="Delete note"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                <p className="text-sm text-gray-300 whitespace-pre-wrap">{storyNote.note_text}</p>
                <p className="text-xs text-gray-500 mt-2">
                  Added {new Date(storyNote.created_at).toLocaleDateString()}
                </p>
              </motion.div>
            )}

            {/* Add/Edit note input */}
            {!storyNote && !showNoteInput ? (
              <button
                onClick={() => setShowNoteInput(true)}
                className="flex items-center gap-2 text-sm text-purple-400 hover:text-purple-300 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add personal note
              </button>
            ) : showNoteInput ? (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="space-y-3"
              >
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Add context or personal observations..."
                  className="w-full px-4 py-3 bg-white/[0.03] border border-white/[0.08] rounded-lg text-gray-200 placeholder-gray-500 resize-none focus:outline-none focus:border-purple-500/50 transition-colors"
                  rows={3}
                  autoFocus
                />
                <div className="flex gap-2">
                  <button
                    onClick={saveNote}
                    disabled={isSavingNote || !note.trim()}
                    className="px-4 py-2 bg-purple-600/20 hover:bg-purple-600/30 text-purple-400 rounded-lg transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSavingNote ? 'Saving...' : isEditingNote ? 'Update Note' : 'Save Note'}
                  </button>
                  <button
                    onClick={() => {
                      setShowNoteInput(false);
                      setNote('');
                      setIsEditingNote(false);
                    }}
                    disabled={isSavingNote}
                    className="px-4 py-2 text-gray-400 hover:text-white transition-colors text-sm disabled:opacity-50"
                  >
                    Cancel
                  </button>
                </div>
              </motion.div>
            ) : null}
          </div>
        </div>
        )}

      {/* Dashboard Alert if available */}
      {story && dashboardAlert && dataQualityScore >= 30 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`backdrop-blur-[20px] border rounded-xl p-6 ${
            dashboardAlert.severity === 'critical' 
              ? 'bg-red-500/10 border-red-500/20' 
              : dashboardAlert.severity === 'warning'
              ? 'bg-yellow-500/10 border-yellow-500/20'
              : 'bg-blue-500/10 border-blue-500/20'
          }`}
        >
          <div className="flex items-start justify-between">
            <div>
              <h3 className={`text-lg font-semibold mb-2 ${
                dashboardAlert.severity === 'critical' 
                  ? 'text-red-400' 
                  : dashboardAlert.severity === 'warning'
                  ? 'text-yellow-400'
                  : 'text-blue-400'
              }`}>
                {dashboardAlert.title}
              </h3>
              <p className="text-gray-300 mb-3">{dashboardAlert.description}</p>
              {dashboardAlert.preventionTip && (
                <p className="text-sm text-gray-400">
                  <span className="font-medium">Prevention tip:</span> {dashboardAlert.preventionTip}
                </p>
              )}
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500">AI Confidence</p>
              <p className="text-sm font-medium text-white">{dashboardAlert.confidence}%</p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Emergency Generate Button if no data */}
      {insights.length === 0 && !isAnalysisLoading && (
        <div className="backdrop-blur-[20px] bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-6 mb-6">
          <h3 className="text-lg font-semibold text-yellow-400 mb-2">No Health Intelligence Data</h3>
          <p className="text-gray-300 mb-4">
            It looks like your health intelligence data hasn't been generated yet. This is required to show your insights and predictions.
          </p>
          <p className="text-sm text-gray-400 mb-4">
            Backend API might not have any data for this week. Try generating fresh data.
          </p>
          <button
            onClick={() => window.location.href = '/intelligence'}
            className="px-4 py-2 bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400 rounded-lg transition-colors"
          >
            Go to Intelligence Page to Generate
          </button>
        </div>
      )}

      {/* Key Insights */}
      {insights.length > 0 && (
      <div className="backdrop-blur-[20px] bg-white/[0.03] border border-white/[0.05] rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Key Insights</h3>
        <div className="space-y-3">
          {insights.map((insight) => (
            <motion.div
              key={insight.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className={`p-4 rounded-lg border cursor-pointer hover:bg-white/[0.02] transition-all ${
                insight.insight_type === 'positive' 
                  ? 'bg-green-500/5 border-green-500/20' 
                  : insight.insight_type === 'warning'
                  ? 'bg-yellow-500/5 border-yellow-500/20'
                  : 'bg-white/[0.02] border-white/[0.05]'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="font-medium text-white mb-1">{insight.title}</h4>
                  <p className="text-sm text-gray-400">{insight.description}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500">Confidence</p>
                  <p className="text-sm font-medium text-white">{insight.confidence}%</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
      )}

      {/* Predictions */}
      {predictions.length > 0 && (
      <div className="backdrop-blur-[20px] bg-white/[0.03] border border-white/[0.05] rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Look Out For</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {predictions.map((prediction) => (
            <motion.div
              key={prediction.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-4 bg-white/[0.02] border border-white/[0.05] rounded-lg"
            >
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium text-white">{prediction.event_description}</h4>
                {prediction.preventable && (
                  <span className="text-xs px-2 py-1 bg-green-500/10 text-green-400 rounded-full">
                    Preventable
                  </span>
                )}
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Probability</span>
                  <span className="text-white font-medium">{prediction.probability}%</span>
                </div>
                <div className="w-full h-2 bg-white/[0.05] rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${prediction.probability}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className={`h-full rounded-full ${
                      prediction.probability > 60 
                        ? 'bg-gradient-to-r from-orange-500 to-red-500' 
                        : 'bg-gradient-to-r from-blue-500 to-cyan-500'
                    }`}
                  />
                </div>
                <p className="text-xs text-gray-400 mt-2">Expected: {prediction.timeframe}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
      )}

        {/* Export Options */}
        {story && (
        <div className="flex justify-end gap-3">
          <button 
            onClick={async () => {
              await exportPDF();
              toast.info('PDF export is not yet implemented');
            }}
            disabled={isExporting}
            className="px-4 py-2 text-sm text-gray-400 hover:text-white border border-white/[0.08] hover:border-white/[0.15] rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isExporting ? 'Exporting...' : 'Export as PDF'}
          </button>
          <button 
            onClick={async () => {
              await shareWithDoctor();
              toast.info('Share with doctor is not yet implemented');
            }}
            disabled={isSharing}
            className="px-4 py-2 text-sm text-gray-400 hover:text-white border border-white/[0.08] hover:border-white/[0.15] rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSharing ? 'Creating link...' : 'Share with Doctor'}
          </button>
        </div>
        )}
        </motion.div>

        {/* Health Advisory Sidebar */}
        {(
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="w-64 hidden xl:block"
          >
            <div className="sticky top-24 space-y-4">
              {/* Shadow Patterns */}
              <div className="backdrop-blur-[20px] bg-white/[0.02] border border-white/[0.03] rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-medium text-gray-400">Not Mentioned</h4>
                  <div className="relative group">
                    <Info className="w-3.5 h-3.5 text-gray-500 cursor-help" />
                    <div className="absolute right-0 -left-60 top-0 w-56 p-3 bg-gray-800 border border-gray-700 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10 pointer-events-none group-hover:pointer-events-auto">
                      <p className="text-xs text-gray-300">
                        Patterns that are missing from your recent stories can be as revealing as what's present
                      </p>
                    </div>
                  </div>
                </div>
                <div className="space-y-2.5">
                  {patternsToShow.length > 0 ? (
                    patternsToShow.map((pattern) => (
                      <motion.div
                        key={pattern.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="group"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="text-sm text-gray-300">{pattern.pattern_name}</p>
                            <p className="text-xs text-gray-500 mt-0.5">{pattern.last_seen_description}</p>
                          </div>
                          <div className={`w-1.5 h-1.5 rounded-full mt-1 ${
                            pattern.significance === 'high' ? 'bg-orange-400/60' :
                            pattern.significance === 'medium' ? 'bg-yellow-400/60' :
                            'bg-gray-400/60'
                          }`} />
                        </div>
                      </motion.div>
                    ))
                  ) : (
                    <p className="text-xs text-gray-500">No patterns detected yet. Keep logging your health data!</p>
                  )}
                </div>
              </div>

              {/* Strategic Moves */}
              <div className="backdrop-blur-[20px] bg-white/[0.02] border border-white/[0.03] rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-medium text-gray-400">Strategic Moves</h4>
                  <div className="relative group">
                    <Info className="w-3.5 h-3.5 text-gray-500 cursor-help" />
                    <div className="absolute right-0 -left-[272px] top-0 w-64 p-3 bg-gray-800 border border-gray-700 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10 pointer-events-none group-hover:pointer-events-auto">
                      <p className="text-xs text-gray-300 mb-2">
                        Small experiments and observations that unlock deeper understanding of your health patterns
                      </p>
                      <div className="flex items-center gap-3 text-xs text-gray-400">
                        <div className="flex items-center gap-1">
                          <div className="w-1.5 h-1.5 bg-blue-400 rounded-full"></div>
                          <span>Discovery</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <div className="w-1.5 h-1.5 bg-purple-400 rounded-full"></div>
                          <span>Pattern</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <div className="w-1.5 h-1.5 bg-green-400 rounded-full"></div>
                          <span>Prevention</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="space-y-3">
                  {healthStrategies.map((strategy, index) => (
                    <motion.div
                      key={strategy.id}
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className={`group cursor-pointer ${
                        'completion_status' in strategy && strategy.completion_status === 'completed' ? 'opacity-60' : ''
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        <button
                          onClick={async (e) => {
                            e.stopPropagation();
                            try {
                              const newStatus = ('completion_status' in strategy && strategy.completion_status === 'completed') ? 'pending' : 'completed';
                              await updateStrategyStatus(strategy.id, newStatus);
                              toast.success(`Strategy marked as ${newStatus}`);
                            } catch (error) {
                              toast.error('Failed to update strategy');
                            }
                          }}
                          className={`mt-0.5 w-4 h-4 rounded border flex items-center justify-center transition-all ${
                            'completion_status' in strategy && strategy.completion_status === 'completed' 
                              ? 'bg-green-500 border-green-500' 
                              : 'border-gray-600 hover:border-gray-400'
                          }`}
                        >
                          {'completion_status' in strategy && strategy.completion_status === 'completed' && (
                            <Check className="w-3 h-3 text-white" />
                          )}
                        </button>
                        <div className="flex-1">
                          <p className={`text-xs text-gray-300 group-hover:text-white transition-colors leading-relaxed ${
                            'completion_status' in strategy && strategy.completion_status === 'completed' ? 'line-through' : ''
                          }`}>
                            {strategy.strategy}
                          </p>
                          {'priority' in strategy && strategy.priority && (
                            <p className="text-[10px] text-gray-500 mt-1">
                              Priority: {strategy.priority}/10 • {strategy.strategy_type}
                            </p>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </div>
      
      {/* Share Modal */}
      {shareLink && (
        <ShareModal
          isOpen={showShareModal}
          onClose={() => {
            setShowShareModal(false);
            setShareLink(null);
          }}
          shareLink={shareLink}
        />
      )}
    </div>
  );
}