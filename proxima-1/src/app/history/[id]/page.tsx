'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, Download, Share2, Calendar, Clock, 
  Activity, Brain, Camera, FileText, MessageCircle,
  AlertTriangle, Sparkles, ClipboardList, Search, BarChart,
  RefreshCw, ChevronRight, Shield, TrendingUp, Stethoscope
} from 'lucide-react';

export const dynamic = 'force-dynamic';
import { format } from 'date-fns';
import { supabase } from '@/lib/supabase';
import UnifiedAuthGuard from '@/components/UnifiedAuthGuard';
import { useAuth } from '@/contexts/AuthContext';

export default function HistoryPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [interaction, setInteraction] = useState<Record<string, unknown> | null>(null);
  const [fullData, setFullData] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState<string | null>(null);

  // First, fetch from user_interactions to get the type
  useEffect(() => {
    if (!params.id || !user) return;

    const fetchInteraction = async () => {
      setLoading(true);
      setError(null);

      try {
        // Get interaction type and metadata
        const { data: interactionData, error: interactionError } = await supabase
          .from('user_interactions')
          .select('*')
          .eq('id', params.id)
          .eq('user_id', user.id)
          .single();

        if (interactionError) throw interactionError;
        if (!interactionData) throw new Error('Interaction not found');

        setInteraction(interactionData);

        // Fetch full data based on type
        let fullDataQuery;
        
        switch (interactionData.interaction_type) {
          case 'quick_scan':
            fullDataQuery = supabase
              .from('quick_scans')
              .select('*')
              .eq('id', params.id)
              .single();
            break;
            
          case 'deep_dive':
            fullDataQuery = supabase
              .from('deep_dive_sessions')
              .select('*')
              .eq('id', params.id)
              .single();
            break;
            
          case 'photo_analysis':
            fullDataQuery = supabase
              .from('photo_sessions')
              .select(`
                *,
                photo_analyses (*),
                photo_uploads (*)
              `)
              .eq('id', params.id)
              .single();
            break;
            
          case 'report':
            fullDataQuery = supabase
              .from('medical_reports')
              .select('*')
              .eq('id', params.id)
              .single();
            break;
            
          case 'oracle_chat':
            fullDataQuery = supabase
              .from('conversations')
              .select(`
                *,
                messages (
                  role,
                  content,
                  created_at
                )
              `)
              .eq('id', params.id)
              .single();
            break;
            
          case 'flash_assessment':
            fullDataQuery = supabase
              .from('flash_assessments')
              .select('*')
              .eq('id', params.id)
              .single();
            break;
            
          case 'general_assessment':
            fullDataQuery = supabase
              .from('general_assessments')
              .select('*')
              .eq('id', params.id)
              .single();
            break;
            
          case 'general_deepdive':
            fullDataQuery = supabase
              .from('general_deepdive_sessions')
              .select('*')
              .eq('id', params.id)
              .single();
            break;
            
          case 'tracking_log':
            // Special case - tracking logs don't have individual records
            // They're aggregated by day, so we'll handle this differently
            setFullData({ 
              type: 'tracking_log',
              config_id: interactionData.metadata?.config_id,
              metric_name: interactionData.metadata?.metric_name 
            });
            setLoading(false);
            return;
            
          default:
            throw new Error('Unknown interaction type');
        }

        const { data: fullResult, error: fullError } = await fullDataQuery;
        if (fullError) throw fullError;
        
        setFullData(fullResult);
        
      } catch (err) {
        console.error('Error fetching interaction:', err);
        setError('Failed to load interaction details');
      } finally {
        setLoading(false);
      }
    };

    fetchInteraction();
  }, [params.id, user]);

  const getIcon = (type: string) => {
    switch (type) {
      case 'quick_scan': return <Activity className="w-6 h-6" />;
      case 'deep_dive': return <Brain className="w-6 h-6" />;
      case 'flash_assessment': return <Sparkles className="w-6 h-6" />;
      case 'general_assessment': return <ClipboardList className="w-6 h-6" />;
      case 'general_deepdive': return <Search className="w-6 h-6" />;
      case 'photo_analysis': return <Camera className="w-6 h-6" />;
      case 'report': return <FileText className="w-6 h-6" />;
      case 'oracle_chat': return <MessageCircle className="w-6 h-6" />;
      case 'tracking_log': return <BarChart className="w-6 h-6" />;
      default: return <Activity className="w-6 h-6" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'quick_scan': return 'from-emerald-500 to-green-500';
      case 'deep_dive': return 'from-indigo-500 to-purple-500';
      case 'flash_assessment': return 'from-amber-500 to-yellow-500';
      case 'general_assessment': return 'from-blue-500 to-cyan-500';
      case 'general_deepdive': return 'from-indigo-500 to-purple-500';
      case 'photo_analysis': return 'from-pink-500 to-rose-500';
      case 'report': return 'from-blue-500 to-cyan-500';
      case 'oracle_chat': return 'from-amber-500 to-yellow-500';
      case 'tracking_log': return 'from-gray-500 to-slate-500';
      default: return 'from-gray-500 to-slate-500';
    }
  };

  const runSimilarScan = () => {
    if (!fullData || !interaction) return;
    
    switch (interaction.interaction_type) {
      case 'quick_scan':
        router.push(`/scan?mode=quick&bodyPart=${fullData.body_part}`);
        break;
      case 'deep_dive':
        router.push(`/scan?mode=deep&bodyPart=${fullData.body_part}`);
        break;
      case 'flash_assessment':
        router.push('/dashboard?assessment=flash');
        break;
      case 'general_assessment':
        router.push(`/dashboard?assessment=general&category=${fullData.category}`);
        break;
      case 'general_deepdive':
        router.push(`/dashboard?assessment=general&mode=deep&category=${fullData.category}`);
        break;
      case 'photo_analysis':
        router.push('/photo-analysis');
        break;
      case 'report':
        router.push('/reports/generate');
        break;
      case 'oracle_chat':
        router.push('/oracle');
        break;
    }
  };

  const renderDeepDiveDetails = () => {
    if (!fullData) return null;
    
    const analysis = fullData.final_analysis as Record<string, unknown> | undefined;
    const formData = fullData.form_data as Record<string, unknown> | undefined;
    
    return (
      <div className="space-y-8">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/[0.03] rounded-xl p-6 border border-white/[0.05]"
        >
          <h3 className="text-xl font-semibold text-white mb-4">Deep Dive Analysis Summary</h3>
          
          {Boolean(analysis?.primaryCondition) && (
            <div className="mb-6">
              <h4 className="text-sm font-medium text-gray-400 mb-2">Primary Assessment</h4>
              <p className="text-lg text-white font-medium">{analysis!.primaryCondition as string}</p>
              {Boolean(analysis!.likelihood) && (
                <p className="text-sm text-gray-400 mt-1">Likelihood: {analysis!.likelihood as string}</p>
              )}
            </div>
          )}

          {Boolean(analysis?.confidence) && (
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-400">Confidence Level</span>
                <span className="text-sm text-white">{analysis!.confidence as number}%</span>
              </div>
              <div className="bg-white/[0.05] rounded-full h-3 overflow-hidden">
                <motion.div 
                  className="h-full bg-gradient-to-r from-indigo-500 to-purple-500"
                  initial={{ width: 0 }}
                  animate={{ width: `${analysis!.confidence as number}%` }}
                  transition={{ duration: 0.8 }}
                />
              </div>
            </div>
          )}

          {Boolean(analysis?.urgency) && (
            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg ${
              analysis!.urgency === 'high' ? 'bg-red-500/20 text-red-400' :
              analysis!.urgency === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
              'bg-green-500/20 text-green-400'
            }`}>
              <AlertTriangle className="w-4 h-4" />
              <span className="font-medium capitalize">{analysis!.urgency as string} Urgency</span>
            </div>
          )}

          {Boolean(fullData.questions && (fullData.questions as unknown[]).length > 0) && (
            <div className="mt-4 text-sm text-gray-400">
              <Brain className="w-4 h-4 inline mr-1" />
              {(fullData.questions as unknown[]).length} follow-up questions completed
            </div>
          )}
        </motion.div>

        {Boolean(formData) && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white/[0.03] rounded-xl p-6 border border-white/[0.05]"
          >
            <h3 className="text-xl font-semibold text-white mb-4">Symptoms Reported</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Boolean(formData!.symptoms) && (
                <div>
                  <p className="text-sm text-gray-400 mb-1">Main Symptoms</p>
                  <p className="text-white">{formData!.symptoms as string}</p>
                </div>
              )}
              {Boolean(formData!.painLevel) && (
                <div>
                  <p className="text-sm text-gray-400 mb-1">Pain Level</p>
                  <p className="text-white">{formData!.painLevel as number}/10</p>
                </div>
              )}
              {Boolean(formData!.duration) && (
                <div>
                  <p className="text-sm text-gray-400 mb-1">Duration</p>
                  <p className="text-white">{formData!.duration as string}</p>
                </div>
              )}
              {Boolean(formData!.frequency) && (
                <div>
                  <p className="text-sm text-gray-400 mb-1">Frequency</p>
                  <p className="text-white">{formData!.frequency as string}</p>
                </div>
              )}
              {Boolean(formData!.triggerEvent) && (
                <div className="md:col-span-2">
                  <p className="text-sm text-gray-400 mb-1">Trigger Event</p>
                  <p className="text-white">{formData!.triggerEvent as string}</p>
                </div>
              )}
              {Boolean(formData!.painType && (formData!.painType as unknown[]).length > 0) && (
                <div>
                  <p className="text-sm text-gray-400 mb-1">Pain Type</p>
                  <p className="text-white">{(formData!.painType as string[]).join(', ')}</p>
                </div>
              )}
              {Boolean(formData!.dailyImpact && (formData!.dailyImpact as unknown[]).length > 0) && (
                <div>
                  <p className="text-sm text-gray-400 mb-1">Daily Impact</p>
                  <p className="text-white">{(formData!.dailyImpact as string[]).join(', ')}</p>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {Boolean(analysis?.recommendations && (analysis!.recommendations as unknown[]).length > 0) && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white/[0.03] rounded-xl p-6 border border-white/[0.05]"
          >
            <h3 className="text-xl font-semibold text-white mb-4">Recommendations</h3>
            <ul className="space-y-3">
              {(analysis!.recommendations as string[]).map((rec: string, idx: number) => (
                <li key={idx} className="flex items-start gap-3">
                  <span className="text-indigo-400 mt-0.5">•</span>
                  <span className="text-gray-300">{rec}</span>
                </li>
              ))}
            </ul>
          </motion.div>
        )}

        {Boolean(analysis?.selfCare && (analysis!.selfCare as unknown[]).length > 0) && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="bg-white/[0.03] rounded-xl p-6 border border-white/[0.05]"
          >
            <h3 className="text-xl font-semibold text-white mb-4">Self-Care Instructions</h3>
            <ul className="space-y-3">
              {(analysis!.selfCare as string[]).map((care: string, idx: number) => (
                <li key={idx} className="flex items-start gap-3">
                  <span className="text-green-400 mt-0.5">•</span>
                  <span className="text-gray-300">{care}</span>
                </li>
              ))}
            </ul>
          </motion.div>
        )}

        {Boolean(analysis?.redFlags && (analysis!.redFlags as unknown[]).length > 0) && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-red-500/10 border border-red-500/20 rounded-xl p-6"
          >
            <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-400" />
              Warning Signs
            </h3>
            <ul className="space-y-2">
              {(analysis!.redFlags as string[]).map((flag: string, idx: number) => (
                <li key={idx} className="text-red-300">{flag}</li>
              ))}
            </ul>
          </motion.div>
        )}

        {Boolean(analysis?.timeline || analysis?.followUp) && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="bg-white/[0.03] rounded-xl p-6 border border-white/[0.05]"
          >
            <h3 className="text-xl font-semibold text-white mb-4">Timeline & Follow-up</h3>
            <div className="space-y-4">
              {Boolean(analysis!.timeline) && (
                <div>
                  <p className="text-sm text-gray-400 mb-1">Expected Timeline</p>
                  <p className="text-white">{analysis!.timeline as string}</p>
                </div>
              )}
              {Boolean(analysis!.followUp) && (
                <div>
                  <p className="text-sm text-gray-400 mb-1">Follow-up Recommendation</p>
                  <p className="text-white">{analysis!.followUp as string}</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </div>
    );
  };

  const renderQuickScanDetails = () => {
    if (!fullData) return null;
    
    const analysis = fullData.analysis_result as Record<string, unknown> | undefined;
    const formData = fullData.form_data as Record<string, unknown> | undefined;
    
    return (
      <div className="space-y-8">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/[0.03] rounded-xl p-6 border border-white/[0.05]"
        >
          <h3 className="text-xl font-semibold text-white mb-4">Analysis Summary</h3>
          
          {Boolean(analysis?.primaryCondition) && (
            <div className="mb-6">
              <h4 className="text-sm font-medium text-gray-400 mb-2">Primary Assessment</h4>
              <p className="text-lg text-white font-medium">{analysis!.primaryCondition as string}</p>
              {Boolean(analysis!.likelihood) && (
                <p className="text-sm text-gray-400 mt-1">Likelihood: {analysis!.likelihood as string}</p>
              )}
            </div>
          )}

          {Boolean(analysis?.confidence) && (
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-400">Confidence Level</span>
                <span className="text-sm text-white">{analysis!.confidence as number}%</span>
              </div>
              <div className="bg-white/[0.05] rounded-full h-3 overflow-hidden">
                <motion.div 
                  className="h-full bg-gradient-to-r from-emerald-500 to-green-500"
                  initial={{ width: 0 }}
                  animate={{ width: `${analysis!.confidence as number}%` }}
                  transition={{ duration: 0.8 }}
                />
              </div>
            </div>
          )}

          <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg ${
            fullData.urgency_level === 'high' ? 'bg-red-500/20 text-red-400' :
            fullData.urgency_level === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
            'bg-green-500/20 text-green-400'
          }`}>
            <AlertTriangle className="w-4 h-4" />
            <span className="font-medium capitalize">{fullData.urgency_level as string} Urgency</span>
          </div>
        </motion.div>

        {Boolean(formData) && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white/[0.03] rounded-xl p-6 border border-white/[0.05]"
          >
            <h3 className="text-xl font-semibold text-white mb-4">Symptoms Reported</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Boolean(formData!.symptoms) && (
                <div>
                  <p className="text-sm text-gray-400 mb-1">Main Symptoms</p>
                  <p className="text-white">{formData!.symptoms as string}</p>
                </div>
              )}
              {Boolean(formData!.painLevel) && (
                <div>
                  <p className="text-sm text-gray-400 mb-1">Pain Level</p>
                  <p className="text-white">{formData!.painLevel as number}/10</p>
                </div>
              )}
              {Boolean(formData!.duration) && (
                <div>
                  <p className="text-sm text-gray-400 mb-1">Duration</p>
                  <p className="text-white">{formData!.duration as string}</p>
                </div>
              )}
              {Boolean(formData!.frequency) && (
                <div>
                  <p className="text-sm text-gray-400 mb-1">Frequency</p>
                  <p className="text-white">{formData!.frequency as string}</p>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {Boolean(analysis?.recommendations && (analysis!.recommendations as unknown[]).length > 0) && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white/[0.03] rounded-xl p-6 border border-white/[0.05]"
          >
            <h3 className="text-xl font-semibold text-white mb-4">Recommendations</h3>
            <ul className="space-y-3">
              {(analysis!.recommendations as string[]).map((rec: string, idx: number) => (
                <li key={idx} className="flex items-start gap-3">
                  <span className="text-emerald-400 mt-0.5">•</span>
                  <span className="text-gray-300">{rec}</span>
                </li>
              ))}
            </ul>
          </motion.div>
        )}

        {Boolean(analysis?.redFlags && (analysis!.redFlags as unknown[]).length > 0) && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-red-500/10 border border-red-500/20 rounded-xl p-6"
          >
            <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-400" />
              Warning Signs
            </h3>
            <ul className="space-y-2">
              {(analysis!.redFlags as string[]).map((flag: string, idx: number) => (
                <li key={idx} className="text-red-300">{flag}</li>
              ))}
            </ul>
          </motion.div>
        )}
      </div>
    );
  };

  const renderFlashAssessmentDetails = () => {
    if (!fullData) return null;
    
    return (
      <div className="space-y-8">
        {/* Query and Response */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/[0.03] rounded-xl p-6 border border-white/[0.05]"
        >
          <h3 className="text-xl font-semibold text-white mb-4">Your Question</h3>
          <p className="text-gray-300 mb-6">{fullData.user_query as string}</p>
          
          <h3 className="text-xl font-semibold text-white mb-4">AI Response</h3>
          <div className="prose prose-invert max-w-none">
            <p className="text-gray-300 whitespace-pre-wrap">{fullData.ai_response as string}</p>
          </div>
        </motion.div>

        {/* Assessment Summary */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-6"
        >
          {/* Main Concern */}
          {Boolean(fullData.main_concern) && (
            <div className="bg-white/[0.03] rounded-xl p-6 border border-white/[0.05]">
              <h4 className="text-sm font-medium text-gray-400 mb-2">Main Concern Identified</h4>
              <p className="text-lg text-white">{fullData.main_concern as string}</p>
            </div>
          )}

          {/* Category */}
          {Boolean(fullData.category) && (
            <div className="bg-white/[0.03] rounded-xl p-6 border border-white/[0.05]">
              <h4 className="text-sm font-medium text-gray-400 mb-2">Category</h4>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-400">
                <Sparkles className="w-4 h-4" />
                <span className="font-medium capitalize">{fullData.category as string}</span>
              </div>
            </div>
          )}
        </motion.div>

        {/* Metrics */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-6"
        >
          {/* Urgency */}
          {Boolean(fullData.urgency) && (
            <div className="bg-white/[0.03] rounded-xl p-6 border border-white/[0.05]">
              <h4 className="text-sm font-medium text-gray-400 mb-4">Urgency Level</h4>
              <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg ${
                fullData.urgency === 'emergency' ? 'bg-red-500/20 text-red-400' :
                fullData.urgency === 'high' ? 'bg-orange-500/20 text-orange-400' :
                fullData.urgency === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                'bg-green-500/20 text-green-400'
              }`}>
                <AlertTriangle className="w-4 h-4" />
                <span className="font-medium capitalize">{fullData.urgency as string}</span>
              </div>
            </div>
          )}

          {/* Confidence */}
          {fullData.confidence_score !== undefined && fullData.confidence_score !== null && (
            <div className="bg-white/[0.03] rounded-xl p-6 border border-white/[0.05]">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-400">AI Confidence</span>
                <span className="text-sm text-white">{Math.round(fullData.confidence_score as number)}%</span>
              </div>
              <div className="bg-white/[0.05] rounded-full h-3 overflow-hidden">
                <motion.div 
                  className="h-full bg-gradient-to-r from-amber-500 to-yellow-500"
                  initial={{ width: 0 }}
                  animate={{ width: `${fullData.confidence_score as number}%` }}
                  transition={{ duration: 0.8 }}
                />
              </div>
            </div>
          )}
        </motion.div>

        {/* Suggested Action */}
        {Boolean(fullData.suggested_next_action) && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-6"
          >
            <h3 className="text-xl font-semibold text-white mb-4">Recommended Next Step</h3>
            <div className="flex items-center justify-between">
              <p className="text-amber-300">
                {fullData.suggested_next_action === 'general-assessment' && 'Take a comprehensive General Assessment for more detailed analysis'}
                {fullData.suggested_next_action === 'body-scan' && 'Use the 3D Body Scanner to pinpoint specific symptoms'}
                {fullData.suggested_next_action === 'see-doctor' && 'Consider scheduling an appointment with a healthcare provider'}
                {fullData.suggested_next_action === 'monitor' && 'Monitor your symptoms and track any changes'}
              </p>
              {(fullData.suggested_next_action === 'general-assessment' || fullData.suggested_next_action === 'body-scan') && (
                <button
                  onClick={() => {
                    if (fullData.suggested_next_action === 'general-assessment') {
                      router.push('/dashboard?assessment=general');
                    } else {
                      router.push('/scan');
                    }
                  }}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition-colors flex items-center gap-2"
                >
                  Start Now
                  <ChevronRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </motion.div>
        )}
      </div>
    );
  };

  const renderGeneralAssessmentDetails = () => {
    if (!fullData) return null;
    
    const formData = fullData.form_data as Record<string, unknown> | undefined;
    
    return (
      <div className="space-y-8">
        {/* Category & Overview */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/[0.03] rounded-xl p-6 border border-white/[0.05]"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="px-3 py-1 rounded-full bg-blue-500/20 text-blue-400 text-sm font-medium">
              <ClipboardList className="w-4 h-4 inline mr-1" />
              {fullData.category === 'energy' && 'Energy & Fatigue'}
              {fullData.category === 'mental' && 'Mental Health'}
              {fullData.category === 'sick' && 'Feeling Sick'}
              {fullData.category === 'physical' && 'Physical Pain'}
              {fullData.category === 'medication' && 'Medication Side Effects'}
              {fullData.category === 'multiple' && 'Multiple Issues'}
              {fullData.category === 'unsure' && 'General Health'}
            </div>
            {Boolean(fullData.doctor_visit_suggested) && (
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/20 text-orange-400">
                <Stethoscope className="w-4 h-4" />
                <span className="text-sm font-medium">Doctor Visit Suggested</span>
              </div>
            )}
          </div>
          
          {Boolean(fullData.primary_assessment) && (
            <>
              <h3 className="text-xl font-semibold text-white mb-4">Primary Assessment</h3>
              <p className="text-gray-300 whitespace-pre-wrap">{fullData.primary_assessment as string}</p>
            </>
          )}
        </motion.div>

        {/* Form Data */}
        {Boolean(formData) && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white/[0.03] rounded-xl p-6 border border-white/[0.05]"
          >
            <h3 className="text-xl font-semibold text-white mb-4">Information Provided</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(formData || {}).map(([key, value]) => (
                <div key={key}>
                  <p className="text-sm text-gray-400 mb-1">{key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</p>
                  <p className="text-white">
                    {Array.isArray(value) ? value.join(', ') : String(value)}
                  </p>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Metrics */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-6"
        >
          {/* Urgency */}
          {Boolean(fullData.urgency_level) && (
            <div className="bg-white/[0.03] rounded-xl p-6 border border-white/[0.05]">
              <h4 className="text-sm font-medium text-gray-400 mb-4">Urgency Level</h4>
              <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg ${
                fullData.urgency_level === 'high' ? 'bg-red-500/20 text-red-400' :
                fullData.urgency_level === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                'bg-green-500/20 text-green-400'
              }`}>
                <AlertTriangle className="w-4 h-4" />
                <span className="font-medium capitalize">{fullData.urgency_level as string} Priority</span>
              </div>
            </div>
          )}

          {/* Confidence */}
          {fullData.confidence_score !== undefined && (
            <div className="bg-white/[0.03] rounded-xl p-6 border border-white/[0.05]">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-400">Analysis Confidence</span>
                <span className="text-sm text-white">{Math.round(fullData.confidence_score as number)}%</span>
              </div>
              <div className="bg-white/[0.05] rounded-full h-3 overflow-hidden">
                <motion.div 
                  className="h-full bg-gradient-to-r from-blue-500 to-cyan-500"
                  initial={{ width: 0 }}
                  animate={{ width: `${fullData.confidence_score as number}%` }}
                  transition={{ duration: 0.8 }}
                />
              </div>
            </div>
          )}
        </motion.div>

        {/* Recommendations */}
        {Boolean(fullData.recommendations && (fullData.recommendations as unknown[]).length > 0) && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white/[0.03] rounded-xl p-6 border border-white/[0.05]"
          >
            <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-400" />
              Recommendations
            </h3>
            <ul className="space-y-3">
              {(fullData.recommendations as string[]).map((rec: string, idx: number) => (
                <li key={idx} className="flex items-start gap-3">
                  <span className="text-blue-400 mt-0.5">•</span>
                  <span className="text-gray-300">{rec}</span>
                </li>
              ))}
            </ul>
          </motion.div>
        )}

        {/* Follow-up */}
        {Boolean(fullData.follow_up_needed) && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-6"
          >
            <h3 className="text-xl font-semibold text-white mb-2">Follow-up Recommended</h3>
            <p className="text-blue-300">
              Based on your assessment, a follow-up evaluation or deeper analysis may be beneficial to better understand your symptoms.
            </p>
          </motion.div>
        )}
      </div>
    );
  };

  const renderGeneralDeepDiveDetails = () => {
    if (!fullData) return null;
    
    const finalAnalysis = fullData.final_analysis as Record<string, unknown> | undefined;
    
    return (
      <div className="space-y-8">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/[0.03] rounded-xl p-6 border border-white/[0.05]"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-400 text-sm font-medium">
                <Search className="w-4 h-4 inline mr-1" />
                {fullData.category === 'energy' && 'Energy & Fatigue'}
                {fullData.category === 'mental' && 'Mental Health'}
                {fullData.category === 'sick' && 'Feeling Sick'}
                {fullData.category === 'physical' && 'Physical Pain'}
                {fullData.category === 'medication' && 'Medication Side Effects'}
                {fullData.category === 'multiple' && 'Multiple Issues'}
                {fullData.category === 'unsure' && 'General Health'}
              </div>
              
              {Boolean(fullData.status) && (
                <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                  fullData.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                  fullData.status === 'abandoned' ? 'bg-gray-500/20 text-gray-400' :
                  'bg-blue-500/20 text-blue-400'
                }`}>
                  {fullData.status as string}
                </div>
              )}
            </div>
          </div>

          {Boolean(fullData.initial_complaint) && (
            <>
              <h3 className="text-xl font-semibold text-white mb-2">Initial Concern</h3>
              <p className="text-gray-300">{fullData.initial_complaint as string}</p>
            </>
          )}

          {/* Session Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            {Boolean(fullData.questions) && (
              <div className="bg-white/[0.05] rounded-lg p-3 text-center">
                <p className="text-2xl font-semibold text-white">{(fullData.questions as unknown[]).length}</p>
                <p className="text-xs text-gray-400 mt-1">Questions Asked</p>
              </div>
            )}
            {Boolean(fullData.answers) && (
              <div className="bg-white/[0.05] rounded-lg p-3 text-center">
                <p className="text-2xl font-semibold text-white">{(fullData.answers as unknown[]).length}</p>
                <p className="text-xs text-gray-400 mt-1">Answers Given</p>
              </div>
            )}
            {Boolean(fullData.key_findings) && (
              <div className="bg-white/[0.05] rounded-lg p-3 text-center">
                <p className="text-2xl font-semibold text-white">{(fullData.key_findings as unknown[]).length}</p>
                <p className="text-xs text-gray-400 mt-1">Key Findings</p>
              </div>
            )}
            {Boolean(fullData.session_duration_ms) && (
              <div className="bg-white/[0.05] rounded-lg p-3 text-center">
                <p className="text-2xl font-semibold text-white">
                  {Math.round((fullData.session_duration_ms as number) / 60000)}
                </p>
                <p className="text-xs text-gray-400 mt-1">Minutes</p>
              </div>
            )}
          </div>
        </motion.div>

        {/* Q&A History */}
        {Boolean(fullData.questions && fullData.answers && (fullData.questions as unknown[]).length > 0) && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white/[0.03] rounded-xl p-6 border border-white/[0.05]"
          >
            <h3 className="text-xl font-semibold text-white mb-4">Question & Answer History</h3>
            <div className="space-y-4">
              {(fullData.questions as Array<{question: string, question_number: number}>).map((q, idx) => {
                const answer = (fullData.answers as Array<{answer: string, question_number: number}>)
                  .find(a => a.question_number === q.question_number);
                
                return (
                  <div key={idx} className="border-b border-white/[0.05] pb-4 last:border-0">
                    <p className="text-sm font-medium text-indigo-400 mb-2">
                      Question {q.question_number}:
                    </p>
                    <p className="text-gray-300 mb-3">{q.question}</p>
                    {answer && (
                      <>
                        <p className="text-sm font-medium text-green-400 mb-2">Your Answer:</p>
                        <p className="text-gray-300">{answer.answer}</p>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* Final Analysis */}
        {fullData.status === 'completed' && finalAnalysis && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white/[0.03] rounded-xl p-6 border border-white/[0.05]"
          >
            <h3 className="text-xl font-semibold text-white mb-4">Final Analysis</h3>
            
            {/* Confidence Score */}
            {fullData.final_confidence !== undefined && (
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-400">Final Confidence</span>
                  <span className="text-sm text-white">{Math.round(fullData.final_confidence as number)}%</span>
                </div>
                <div className="bg-white/[0.05] rounded-full h-3 overflow-hidden">
                  <motion.div 
                    className="h-full bg-gradient-to-r from-indigo-500 to-purple-500"
                    initial={{ width: 0 }}
                    animate={{ width: `${fullData.final_confidence as number}%` }}
                    transition={{ duration: 0.8 }}
                  />
                </div>
              </div>
            )}

            {/* Analysis Content */}
            <div className="prose prose-invert max-w-none">
              {Object.entries(finalAnalysis).map(([key, value]) => (
                <div key={key} className="mb-4">
                  <h4 className="text-sm font-medium text-gray-400 mb-2">
                    {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </h4>
                  <p className="text-gray-300">
                    {Array.isArray(value) ? value.join(', ') : String(value)}
                  </p>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Key Findings */}
        {Boolean(fullData.key_findings && (fullData.key_findings as unknown[]).length > 0) && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white/[0.03] rounded-xl p-6 border border-white/[0.05]"
          >
            <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
              <Shield className="w-5 h-5 text-indigo-400" />
              Key Findings
            </h3>
            <ul className="space-y-3">
              {(fullData.key_findings as string[]).map((finding: string, idx: number) => (
                <li key={idx} className="flex items-start gap-3">
                  <span className="text-indigo-400 mt-0.5">•</span>
                  <span className="text-gray-300">{finding}</span>
                </li>
              ))}
            </ul>
          </motion.div>
        )}

        {/* Reasoning Snippets */}
        {Boolean(fullData.reasoning_snippets && (fullData.reasoning_snippets as unknown[]).length > 0) && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="bg-indigo-500/10 border border-indigo-500/20 rounded-xl p-6"
          >
            <h3 className="text-xl font-semibold text-white mb-4">AI Reasoning Process</h3>
            <div className="space-y-3">
              {(fullData.reasoning_snippets as string[]).map((snippet: string, idx: number) => (
                <div key={idx} className="text-indigo-300 text-sm">
                  <span className="text-indigo-400 font-medium">Step {idx + 1}:</span> {snippet}
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    );
  };

  const renderReportDetails = () => {
    if (!fullData) return null;
    
    const reportData = fullData.report_data as Record<string, unknown> | undefined;
    
    return (
      <div className="space-y-8">
        {/* Report Header */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/[0.03] rounded-xl p-6 border border-white/[0.05]"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                fullData.report_type === 'urgent_triage' 
                  ? 'bg-red-500/20 text-red-400' 
                  : 'bg-blue-500/20 text-blue-400'
              }`}>
                <FileText className="w-4 h-4 inline mr-1" />
                {fullData.report_type === 'comprehensive' && 'Comprehensive Report'}
                {fullData.report_type === 'urgent_triage' && 'Urgent Triage Report'}
                {fullData.report_type === 'photo_progression' && 'Photo Progression Report'}
                {fullData.report_type === 'symptom_timeline' && 'Symptom Timeline Report'}
                {fullData.report_type === 'specialist_focused' && 'Specialist Report'}
                {fullData.report_type === 'annual_summary' && 'Annual Summary'}
              </div>
              
              {Boolean(fullData.specialty) && (
                <div className="px-3 py-1 rounded-full bg-purple-500/20 text-purple-400 text-sm font-medium">
                  {fullData.specialty as string}
                </div>
              )}
            </div>
            
            <div className="flex items-center gap-2 text-sm text-gray-400">
              {Boolean(fullData.model_used) && (
                <>
                  <Brain className="w-4 h-4" />
                  <span>{fullData.model_used as string}</span>
                </>
              )}
            </div>
          </div>

          {/* Executive Summary */}
          {Boolean(fullData.executive_summary) && (
            <>
              <h3 className="text-xl font-semibold text-white mb-4">Executive Summary</h3>
              <p className="text-gray-300 whitespace-pre-wrap">{fullData.executive_summary as string}</p>
            </>
          )}

          {/* Confidence Score */}
          {fullData.confidence_score !== undefined && (
            <div className="mt-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-400">Report Confidence</span>
                <span className="text-sm text-white">{fullData.confidence_score as number}%</span>
              </div>
              <div className="bg-white/[0.05] rounded-full h-3 overflow-hidden">
                <motion.div 
                  className="h-full bg-gradient-to-r from-blue-500 to-cyan-500"
                  initial={{ width: 0 }}
                  animate={{ width: `${fullData.confidence_score as number}%` }}
                  transition={{ duration: 0.8 }}
                />
              </div>
            </div>
          )}
        </motion.div>

        {/* Report Sections */}
        {Boolean(reportData) && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="space-y-6"
          >
            {Object.entries(reportData || {}).map(([section, content]) => (
              <div 
                key={section}
                className="bg-white/[0.03] rounded-xl p-6 border border-white/[0.05]"
              >
                <h3 className="text-xl font-semibold text-white mb-4 capitalize">
                  {section.replace(/_/g, ' ')}
                </h3>
                <div className="prose prose-invert max-w-none">
                  {typeof content === 'string' ? (
                    <p className="text-gray-300 whitespace-pre-wrap">{content}</p>
                  ) : Array.isArray(content) ? (
                    <ul className="space-y-2">
                      {content.map((item, i) => (
                        <li key={i} className="text-gray-300">{String(item)}</li>
                      ))}
                    </ul>
                  ) : typeof content === 'object' && content !== null ? (
                    <div className="space-y-4">
                      {Object.entries(content).map(([key, value]) => (
                        <div key={key}>
                          <h4 className="text-sm font-medium text-gray-400 mb-1">
                            {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </h4>
                          <p className="text-gray-300">{String(value)}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-300">{String(content)}</p>
                  )}
                </div>
              </div>
            ))}
          </motion.div>
        )}

        {/* Metadata */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white/[0.03] rounded-xl p-6 border border-white/[0.05]"
        >
          <h3 className="text-xl font-semibold text-white mb-4">Report Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Boolean(fullData.data_sources) && (
              <div>
                <p className="text-sm text-gray-400 mb-1">Data Sources</p>
                <p className="text-white">
                  {Object.entries(fullData.data_sources as Record<string, unknown>)
                    .map(([key, value]) => `${key}: ${value}`)
                    .join(', ')}
                </p>
              </div>
            )}
            {Boolean(fullData.time_range) && (
              <div>
                <p className="text-sm text-gray-400 mb-1">Time Period</p>
                <p className="text-white">
                  {JSON.stringify(fullData.time_range)}
                </p>
              </div>
            )}
            {fullData.access_count !== undefined && (
              <div>
                <p className="text-sm text-gray-400 mb-1">Times Viewed</p>
                <p className="text-white">{fullData.access_count as number}</p>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    );
  };

  const renderOracleChatDetails = () => {
    if (!fullData) return null;
    
    const messages = fullData.messages as Array<{role: string, content: string, created_at: string}> | undefined;
    
    return (
      <div className="space-y-8">
        {/* Chat Header */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/[0.03] rounded-xl p-6 border border-white/[0.05]"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold text-white">
              {fullData.title as string || 'Oracle Consultation'}
            </h3>
            <div className="flex items-center gap-4 text-sm text-gray-400">
              <div className="flex items-center gap-2">
                <Brain className="w-4 h-4" />
                <span>{fullData.ai_provider as string || 'openai'} - {fullData.model_name as string || 'gpt-4'}</span>
              </div>
              <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                fullData.status === 'active' ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'
              }`}>
                {fullData.status === 'active' ? 'Active' : 'Completed'}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white/[0.05] rounded-lg p-3 text-center">
              <p className="text-2xl font-semibold text-white">{fullData.message_count as number || 0}</p>
              <p className="text-xs text-gray-400 mt-1">Messages</p>
            </div>
            <div className="bg-white/[0.05] rounded-lg p-3 text-center">
              <p className="text-2xl font-semibold text-white">{fullData.total_tokens as number || 0}</p>
              <p className="text-xs text-gray-400 mt-1">Tokens Used</p>
            </div>
            <div className="bg-white/[0.05] rounded-lg p-3 text-center">
              <p className="text-2xl font-semibold text-white">
                {messages ? messages.filter(m => m.role === 'user').length : 0}
              </p>
              <p className="text-xs text-gray-400 mt-1">Your Messages</p>
            </div>
          </div>
        </motion.div>

        {/* Messages */}
        {Boolean(messages && messages.length > 0) && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white/[0.03] rounded-xl p-6 border border-white/[0.05]"
          >
            <h3 className="text-xl font-semibold text-white mb-4">Conversation History</h3>
            <div className="space-y-4 max-h-[600px] overflow-y-auto">
              {(messages || []).map((message, idx) => (
                <div 
                  key={idx}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[80%] rounded-lg p-4 ${
                    message.role === 'user' 
                      ? 'bg-purple-600/20 border border-purple-500/20' 
                      : 'bg-white/[0.05] border border-white/[0.05]'
                  }`}>
                    <div className="flex items-center gap-2 mb-2">
                      {message.role === 'user' ? (
                        <div className="w-6 h-6 rounded-full bg-purple-600 flex items-center justify-center">
                          <span className="text-xs text-white font-bold">U</span>
                        </div>
                      ) : (
                        <Brain className="w-5 h-5 text-amber-400" />
                      )}
                      <span className="text-xs text-gray-400">
                        {format(new Date(message.created_at), 'MMM d, h:mm a')}
                      </span>
                    </div>
                    <p className="text-gray-300 whitespace-pre-wrap">{message.content}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Continue Conversation */}
        {fullData.status === 'active' && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-semibold text-white mb-2">Continue This Conversation</h3>
                <p className="text-amber-300">Pick up where you left off with Oracle</p>
              </div>
              <button
                onClick={() => router.push(`/oracle?conversation=${params.id}`)}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition-colors flex items-center gap-2"
              >
                Continue Chat
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </div>
    );
  };

  const renderTrackingLogDetails = () => {
    if (!fullData) return null;
    
    return (
      <div className="bg-white/[0.03] rounded-xl p-6 border border-white/[0.05]">
        <h3 className="text-xl font-semibold text-white mb-4">Tracking Data</h3>
        <p className="text-gray-300 mb-4">
          This is an aggregated tracking log for {fullData.metric_name as string || 'your health metric'}.
        </p>
        <p className="text-sm text-gray-400">
          Tracking logs show daily aggregated data. To view the full chart and history, 
          please return to the dashboard and click on the tracking card.
        </p>
      </div>
    );
  };

  const renderPhotoAnalysisDetails = () => {
    if (!fullData) return null;
    
    const analyses = fullData.photo_analyses as Array<Record<string, unknown>> | undefined;
    const uploads = fullData.photo_uploads as Array<Record<string, unknown>> | undefined;
    
    return (
      <div className="space-y-8">
        {/* Session Overview */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/[0.03] rounded-xl p-6 border border-white/[0.05]"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold text-white">
              {fullData.condition_name as string || 'Photo Analysis Session'}
            </h3>
            {Boolean(fullData.is_sensitive) && (
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-yellow-500/20 text-yellow-400">
                <Shield className="w-4 h-4" />
                <span className="text-sm font-medium">Sensitive Content</span>
              </div>
            )}
          </div>
          
          {Boolean(fullData.description) && (
            <p className="text-gray-300 mb-4">{fullData.description as string}</p>
          )}

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white/[0.05] rounded-lg p-3 text-center">
              <p className="text-2xl font-semibold text-white">{uploads?.length || 0}</p>
              <p className="text-xs text-gray-400 mt-1">Photos</p>
            </div>
            <div className="bg-white/[0.05] rounded-lg p-3 text-center">
              <p className="text-2xl font-semibold text-white">{analyses?.length || 0}</p>
              <p className="text-xs text-gray-400 mt-1">Analyses</p>
            </div>
            {Boolean(fullData.monitoring_phase) && (
              <div className="bg-white/[0.05] rounded-lg p-3 text-center">
                <p className="text-sm font-medium text-white capitalize">
                  {(fullData.monitoring_phase as string).replace(/_/g, ' ')}
                </p>
                <p className="text-xs text-gray-400 mt-1">Phase</p>
              </div>
            )}
            {Boolean(fullData.last_photo_at) && (
              <div className="bg-white/[0.05] rounded-lg p-3 text-center">
                <p className="text-sm font-medium text-white">
                  {format(new Date(fullData.last_photo_at as string), 'MMM d')}
                </p>
                <p className="text-xs text-gray-400 mt-1">Last Photo</p>
              </div>
            )}
          </div>
        </motion.div>

        {/* Latest Analysis */}
        {analyses && analyses.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white/[0.03] rounded-xl p-6 border border-white/[0.05]"
          >
            <h3 className="text-xl font-semibold text-white mb-4">Latest Analysis</h3>
            {Boolean(analyses[0].analysis_data) && (
              <div className="prose prose-invert max-w-none">
                <pre className="text-gray-300 whitespace-pre-wrap text-sm">
                  {JSON.stringify(analyses[0].analysis_data, null, 2)}
                </pre>
              </div>
            )}
            
            {analyses[0].confidence_score !== undefined && (
              <div className="mt-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-400">Analysis Confidence</span>
                  <span className="text-sm text-white">
                    {Math.round((analyses[0].confidence_score as number) * 100)}%
                  </span>
                </div>
                <div className="bg-white/[0.05] rounded-full h-3 overflow-hidden">
                  <motion.div 
                    className="h-full bg-gradient-to-r from-pink-500 to-rose-500"
                    initial={{ width: 0 }}
                    animate={{ width: `${(analyses[0].confidence_score as number) * 100}%` }}
                    transition={{ duration: 0.8 }}
                  />
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* Photo Gallery */}
        {Boolean(uploads && uploads.length > 0) && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white/[0.03] rounded-xl p-6 border border-white/[0.05]"
          >
            <h3 className="text-xl font-semibold text-white mb-4">Photo Timeline</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {(uploads || []).map((upload, idx) => (
                <div key={idx} className="bg-white/[0.05] rounded-lg p-3">
                  <div className="aspect-square bg-gray-800 rounded mb-2 flex items-center justify-center">
                    <Camera className="w-12 h-12 text-gray-600" />
                  </div>
                  <p className="text-xs text-gray-400 text-center">
                    {format(new Date(upload.uploaded_at as string), 'MMM d, yyyy')}
                  </p>
                  {Boolean(upload.category) && (
                    <p className="text-xs text-gray-500 text-center capitalize">
                      {(upload.category as string).replace(/_/g, ' ')}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Navigate to Full Photo Analysis */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-pink-500/10 border border-pink-500/20 rounded-xl p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-semibold text-white mb-2">View Full Photo Analysis</h3>
              <p className="text-pink-300">Access detailed analysis, comparisons, and tracking data</p>
            </div>
            <button
              onClick={() => router.push(`/photo-analysis?session=${params.id}`)}
              className="px-4 py-2 bg-pink-600 hover:bg-pink-700 text-white rounded-lg transition-colors flex items-center gap-2"
            >
              Open Analysis
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      </div>
    );
  };

  const renderContent = () => {
    switch (interaction?.interaction_type) {
      case 'quick_scan':
        return renderQuickScanDetails();
      case 'deep_dive':
        return renderDeepDiveDetails();
      case 'flash_assessment':
        return renderFlashAssessmentDetails();
      case 'general_assessment':
        return renderGeneralAssessmentDetails();
      case 'general_deepdive':
        return renderGeneralDeepDiveDetails();
      case 'photo_analysis':
        return renderPhotoAnalysisDetails();
      case 'report':
        return renderReportDetails();
      case 'oracle_chat':
        return renderOracleChatDetails();
      case 'tracking_log':
        return renderTrackingLogDetails();
      default:
        return (
          <div className="bg-white/[0.03] rounded-xl p-6 border border-white/[0.05]">
            <p className="text-gray-300">Details for this interaction type are not yet available.</p>
          </div>
        );
    }
  };

  if (loading) {
    return (
      <UnifiedAuthGuard requireAuth={true}>
        <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
          <div className="space-y-4">
            <div className="w-12 h-12 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-gray-400">Loading interaction details...</p>
          </div>
        </div>
      </UnifiedAuthGuard>
    );
  }

  if (error || !interaction) {
    return (
      <UnifiedAuthGuard requireAuth={true}>
        <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
          <div className="text-center space-y-4">
            <p className="text-red-400">{error || 'Interaction not found'}</p>
            <button
              onClick={() => router.push('/dashboard')}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
            >
              Return to Dashboard
            </button>
          </div>
        </div>
      </UnifiedAuthGuard>
    );
  }

  return (
    <UnifiedAuthGuard requireAuth={true}>
      <div className="min-h-screen bg-[#0a0a0a]">
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 -left-48 w-96 h-96 bg-gradient-to-r from-purple-600/10 to-pink-600/10 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 -right-48 w-96 h-96 bg-gradient-to-r from-blue-600/10 to-purple-600/10 rounded-full blur-3xl" />
        </div>

        <div className={`relative h-48 bg-gradient-to-br ${getTypeColor(interaction!.interaction_type as string)}`}>
          <div className="absolute inset-0 bg-black/30" />
          <div className="relative h-full max-w-6xl mx-auto px-6 flex items-center">
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-6">
                <button
                  onClick={() => router.push('/dashboard')}
                  className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
                >
                  <ArrowLeft className="w-5 h-5 text-white" />
                </button>
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                      {getIcon(interaction!.interaction_type as string)}
                    </div>
                    <h1 className="text-3xl font-bold text-white">
                      {interaction!.title as string}
                    </h1>
                  </div>
                  <div className="flex items-center gap-4 text-white/70">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      <span>{format(new Date(interaction!.created_at as string), 'PPP')}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      <span>{format(new Date(interaction!.created_at as string), 'p')}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Actions */}
              <div className="flex items-center gap-3">
                <button
                  onClick={runSimilarScan}
                  className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors flex items-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Run Similar
                </button>
                <button
                  className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors flex items-center gap-2"
                >
                  <Share2 className="w-4 h-4" />
                  Share
                </button>
                <button
                  className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Export
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-6 py-8">
          {renderContent()}
          
          {/* Related Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4"
          >
            <button
              onClick={() => router.push('/reports/generate')}
              className="p-4 bg-white/[0.03] hover:bg-white/[0.05] border border-white/[0.05] rounded-xl transition-all group"
            >
              <div className="flex items-center justify-between">
                <div className="text-left">
                  <p className="text-white font-medium">Generate Report</p>
                  <p className="text-sm text-gray-400">Create a medical report from this data</p>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors" />
              </div>
            </button>
            
            <button
              onClick={() => router.push('/oracle')}
              className="p-4 bg-white/[0.03] hover:bg-white/[0.05] border border-white/[0.05] rounded-xl transition-all group"
            >
              <div className="flex items-center justify-between">
                <div className="text-left">
                  <p className="text-white font-medium">Ask Oracle</p>
                  <p className="text-sm text-gray-400">Get AI insights about this result</p>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors" />
              </div>
            </button>
            
            <button
              onClick={() => router.push('/scan?mode=deep')}
              className="p-4 bg-white/[0.03] hover:bg-white/[0.05] border border-white/[0.05] rounded-xl transition-all group"
            >
              <div className="flex items-center justify-between">
                <div className="text-left">
                  <p className="text-white font-medium">Deep Dive</p>
                  <p className="text-sm text-gray-400">Get a more detailed analysis</p>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors" />
              </div>
            </button>
          </motion.div>
        </div>
      </div>
    </UnifiedAuthGuard>
  );
}