'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, Download, Share2, Calendar, Clock, 
  Activity, Brain, Camera, FileText, MessageCircle,
  BarChart, MapPin, AlertTriangle, TrendingUp,
  RefreshCw, ChevronRight, User, Shield
} from 'lucide-react';
import { format } from 'date-fns';
import { supabase } from '@/lib/supabase';
import UnifiedAuthGuard from '@/components/UnifiedAuthGuard';
import { useAuth } from '@/contexts/AuthContext';

export default function HistoryPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [interaction, setInteraction] = useState<any>(null);
  const [fullData, setFullData] = useState<any>(null);
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
    if (!fullData) return;
    
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

  const renderQuickScanDetails = () => {
    if (!fullData) return null;
    
    const analysis = fullData.analysis_result;
    const formData = fullData.form_data;
    
    return (
      <div className="space-y-8">
        {/* Summary Card */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/[0.03] rounded-xl p-6 border border-white/[0.05]"
        >
          <h3 className="text-xl font-semibold text-white mb-4">Analysis Summary</h3>
          
          {/* Primary Condition */}
          {analysis?.primaryCondition && (
            <div className="mb-6">
              <h4 className="text-sm font-medium text-gray-400 mb-2">Primary Assessment</h4>
              <p className="text-lg text-white font-medium">{analysis.primaryCondition}</p>
              {analysis.likelihood && (
                <p className="text-sm text-gray-400 mt-1">Likelihood: {analysis.likelihood}</p>
              )}
            </div>
          )}

          {/* Confidence Score */}
          {analysis?.confidence && (
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-400">Confidence Level</span>
                <span className="text-sm text-white">{analysis.confidence}%</span>
              </div>
              <div className="bg-white/[0.05] rounded-full h-3 overflow-hidden">
                <motion.div 
                  className="h-full bg-gradient-to-r from-emerald-500 to-green-500"
                  initial={{ width: 0 }}
                  animate={{ width: `${analysis.confidence}%` }}
                  transition={{ duration: 0.8 }}
                />
              </div>
            </div>
          )}

          {/* Urgency Level */}
          <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg ${
            fullData.urgency_level === 'high' ? 'bg-red-500/20 text-red-400' :
            fullData.urgency_level === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
            'bg-green-500/20 text-green-400'
          }`}>
            <AlertTriangle className="w-4 h-4" />
            <span className="font-medium capitalize">{fullData.urgency_level} Urgency</span>
          </div>
        </motion.div>

        {/* Symptoms Reported */}
        {formData && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white/[0.03] rounded-xl p-6 border border-white/[0.05]"
          >
            <h3 className="text-xl font-semibold text-white mb-4">Symptoms Reported</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {formData.symptoms && (
                <div>
                  <p className="text-sm text-gray-400 mb-1">Main Symptoms</p>
                  <p className="text-white">{formData.symptoms}</p>
                </div>
              )}
              {formData.painLevel && (
                <div>
                  <p className="text-sm text-gray-400 mb-1">Pain Level</p>
                  <p className="text-white">{formData.painLevel}/10</p>
                </div>
              )}
              {formData.duration && (
                <div>
                  <p className="text-sm text-gray-400 mb-1">Duration</p>
                  <p className="text-white">{formData.duration}</p>
                </div>
              )}
              {formData.frequency && (
                <div>
                  <p className="text-sm text-gray-400 mb-1">Frequency</p>
                  <p className="text-white">{formData.frequency}</p>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Recommendations */}
        {analysis?.recommendations && analysis.recommendations.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white/[0.03] rounded-xl p-6 border border-white/[0.05]"
          >
            <h3 className="text-xl font-semibold text-white mb-4">Recommendations</h3>
            <ul className="space-y-3">
              {analysis.recommendations.map((rec: string, idx: number) => (
                <li key={idx} className="flex items-start gap-3">
                  <span className="text-emerald-400 mt-0.5">•</span>
                  <span className="text-gray-300">{rec}</span>
                </li>
              ))}
            </ul>
          </motion.div>
        )}

        {/* Red Flags */}
        {analysis?.redFlags && analysis.redFlags.length > 0 && (
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
              {analysis.redFlags.map((flag: string, idx: number) => (
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
        return (
          <div className="bg-white/[0.03] rounded-xl p-6 border border-white/[0.05]">
            <p className="text-gray-300">Deep dive details coming soon...</p>
          </div>
        );
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
        {/* Background Effects */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 -left-48 w-96 h-96 bg-gradient-to-r from-purple-600/10 to-pink-600/10 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 -right-48 w-96 h-96 bg-gradient-to-r from-blue-600/10 to-purple-600/10 rounded-full blur-3xl" />
        </div>

        {/* Header */}
        <div className={`relative h-48 bg-gradient-to-br ${getTypeColor(interaction.interaction_type)}`}>
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
                      {getIcon(interaction.interaction_type)}
                    </div>
                    <h1 className="text-3xl font-bold text-white">
                      {interaction.title}
                    </h1>
                  </div>
                  <div className="flex items-center gap-4 text-white/70">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      <span>{format(new Date(interaction.created_at), 'PPP')}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      <span>{format(new Date(interaction.created_at), 'p')}</span>
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

        {/* Content */}
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