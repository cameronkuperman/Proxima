'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, Download, Share2, Calendar, Clock, 
  Activity, Brain, Camera, FileText, MessageCircle,
  AlertTriangle,
  RefreshCw, ChevronRight
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
      case 'photo_analysis': return <Camera className="w-6 h-6" />;
      case 'report': return <FileText className="w-6 h-6" />;
      case 'oracle_chat': return <MessageCircle className="w-6 h-6" />;
      default: return <Activity className="w-6 h-6" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'quick_scan': return 'from-emerald-500 to-green-500';
      case 'deep_dive': return 'from-indigo-500 to-purple-500';
      case 'photo_analysis': return 'from-pink-500 to-rose-500';
      case 'report': return 'from-blue-500 to-cyan-500';
      case 'oracle_chat': return 'from-amber-500 to-yellow-500';
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
      case 'photo_analysis':
        router.push('/photo-analysis');
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

        {formData && (
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

        {formData && (
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

  const renderContent = () => {
    switch (interaction?.interaction_type) {
      case 'quick_scan':
        return renderQuickScanDetails();
      case 'deep_dive':
        return renderDeepDiveDetails();
      case 'photo_analysis':
        return (
          <div className="bg-white/[0.03] rounded-xl p-6 border border-white/[0.05]">
            <p className="text-gray-300">Photo analysis details coming soon...</p>
          </div>
        );
      default:
        return null;
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