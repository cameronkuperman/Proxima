'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Calendar, Clock, MapPin, Activity, Brain, 
  Camera, FileText, MessageCircle, BarChart,
  ChevronRight, Share2, Download, Stethoscope,
  AlertTriangle, TrendingUp, Shield
} from 'lucide-react';
import { format } from 'date-fns';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

interface HistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  interactionId: string;
  interactionType: string;
  metadata?: any;
}

export default function HistoryModal({ 
  isOpen, 
  onClose, 
  interactionId, 
  interactionType,
  metadata 
}: HistoryModalProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // Fetch full interaction data
  useEffect(() => {
    if (!isOpen || !interactionId) return;

    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        let query;
        
        switch (interactionType) {
          case 'quick_scan':
            query = supabase
              .from('quick_scans')
              .select('*')
              .eq('id', interactionId)
              .single();
            break;
            
          case 'deep_dive':
            query = supabase
              .from('deep_dive_sessions')
              .select('*')
              .eq('id', interactionId)
              .single();
            break;
            
          case 'photo_analysis':
            query = supabase
              .from('photo_sessions')
              .select(`
                *,
                photo_analyses (*)
              `)
              .eq('id', interactionId)
              .single();
            break;
            
          case 'report':
            query = supabase
              .from('medical_reports')
              .select('*')
              .eq('id', interactionId)
              .single();
            break;
            
          case 'oracle_chat':
            query = supabase
              .from('conversations')
              .select(`
                *,
                messages (
                  role,
                  content,
                  created_at
                )
              `)
              .eq('id', interactionId)
              .single();
            break;
            
          default:
            throw new Error('Unknown interaction type');
        }

        const { data: result, error: queryError } = await query;
        
        if (queryError) throw queryError;
        setData(result);
        
      } catch (err) {
        console.error('Error fetching interaction data:', err);
        setError('Failed to load interaction details');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [isOpen, interactionId, interactionType]);

  const getIcon = () => {
    switch (interactionType) {
      case 'quick_scan': return <Activity className="w-6 h-6" />;
      case 'deep_dive': return <Brain className="w-6 h-6" />;
      case 'photo_analysis': return <Camera className="w-6 h-6" />;
      case 'report': return <FileText className="w-6 h-6" />;
      case 'oracle_chat': return <MessageCircle className="w-6 h-6" />;
      case 'tracking_log': return <BarChart className="w-6 h-6" />;
      default: return <Activity className="w-6 h-6" />;
    }
  };

  const getTypeColor = () => {
    switch (interactionType) {
      case 'quick_scan': return 'from-emerald-500 to-green-500';
      case 'deep_dive': return 'from-indigo-500 to-purple-500';
      case 'photo_analysis': return 'from-pink-500 to-rose-500';
      case 'report': return 'from-blue-500 to-cyan-500';
      case 'oracle_chat': return 'from-amber-500 to-yellow-500';
      default: return 'from-gray-500 to-slate-500';
    }
  };

  const navigateToFull = () => {
    router.push(`/history/${interactionId}`);
    onClose();
  };

  const renderQuickScanPreview = () => {
    if (!data) return null;
    
    const analysis = data.analysis_result;
    return (
      <div className="space-y-4">
        {/* Body Part */}
        <div className="flex items-center gap-2 text-gray-300">
          <MapPin className="w-4 h-4" />
          <span className="text-sm">{data.body_part}</span>
        </div>

        {/* Primary Condition */}
        {analysis?.primaryCondition && (
          <div className="bg-white/[0.03] rounded-lg p-4 border border-white/[0.05]">
            <h4 className="text-sm font-medium text-gray-400 mb-2">Primary Assessment</h4>
            <p className="text-white font-medium">{analysis.primaryCondition}</p>
            {analysis.confidence && (
              <div className="mt-2 flex items-center gap-2">
                <div className="flex-1 bg-white/[0.05] rounded-full h-2 overflow-hidden">
                  <motion.div 
                    className="h-full bg-gradient-to-r from-emerald-500 to-green-500"
                    initial={{ width: 0 }}
                    animate={{ width: `${analysis.confidence}%` }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                  />
                </div>
                <span className="text-xs text-gray-400">{analysis.confidence}%</span>
              </div>
            )}
          </div>
        )}

        {/* Urgency */}
        {data.urgency_level && (
          <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
            data.urgency_level === 'high' ? 'bg-red-500/20 text-red-400' :
            data.urgency_level === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
            'bg-green-500/20 text-green-400'
          }`}>
            <AlertTriangle className="w-4 h-4" />
            <span className="text-sm font-medium capitalize">{data.urgency_level} Urgency</span>
          </div>
        )}

        {/* Key Recommendations */}
        {analysis?.recommendations?.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-400">Key Recommendations</h4>
            <ul className="space-y-1">
              {analysis.recommendations.slice(0, 3).map((rec: string, idx: number) => (
                <li key={idx} className="text-sm text-gray-300 flex items-start gap-2">
                  <span className="text-emerald-400 mt-0.5">•</span>
                  <span>{rec}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  };

  const renderPreviewContent = () => {
    switch (interactionType) {
      case 'quick_scan':
        return renderQuickScanPreview();
      case 'deep_dive':
        return (
          <div className="space-y-4">
            <p className="text-gray-300">
              Deep dive analysis for {data?.body_part || 'health concern'}
            </p>
            {data?.final_analysis && (
              <div className="bg-white/[0.03] rounded-lg p-4 border border-white/[0.05]">
                <p className="text-sm text-gray-300 line-clamp-3">
                  {data.final_analysis.summary || 'Analysis completed'}
                </p>
              </div>
            )}
          </div>
        );
      case 'photo_analysis':
        return (
          <div className="space-y-4">
            <p className="text-gray-300">
              Photo analysis for {data?.condition_name || 'condition'}
            </p>
            {metadata?.photo_count > 0 && (
              <p className="text-sm text-gray-400">{metadata.photo_count} photos analyzed</p>
            )}
          </div>
        );
      default:
        return <p className="text-gray-300">View full details for more information</p>;
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
          />
          
          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", duration: 0.5 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-lg"
          >
            <div className="bg-gray-900/95 backdrop-blur-xl rounded-2xl border border-white/[0.08] shadow-2xl overflow-hidden">
              {/* Header */}
              <div className={`relative h-32 bg-gradient-to-br ${getTypeColor()} p-6`}>
                <div className="absolute inset-0 bg-black/20" />
                <div className="relative flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                      {getIcon()}
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-white">
                        {interactionType.split('_').map(word => 
                          word.charAt(0).toUpperCase() + word.slice(1)
                        ).join(' ')}
                      </h3>
                      {data?.created_at && (
                        <p className="text-white/70 text-sm">
                          {format(new Date(data.created_at), 'PPP')}
                        </p>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={onClose}
                    className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
                  >
                    <X className="w-4 h-4 text-white" />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="p-6">
                {loading ? (
                  <div className="space-y-3">
                    <div className="h-4 bg-white/[0.03] rounded animate-pulse" />
                    <div className="h-4 bg-white/[0.03] rounded animate-pulse w-3/4" />
                    <div className="h-20 bg-white/[0.03] rounded animate-pulse" />
                  </div>
                ) : error ? (
                  <div className="text-center py-8">
                    <p className="text-red-400">{error}</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {renderPreviewContent()}
                    
                    {/* Actions */}
                    <div className="flex gap-3 pt-4 border-t border-white/[0.05]">
                      <button
                        onClick={navigateToFull}
                        className="flex-1 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-lg font-medium transition-all flex items-center justify-center gap-2"
                      >
                        View Full Details
                        <ChevronRight className="w-4 h-4" />
                      </button>
                      <button
                        className="px-4 py-2.5 bg-white/[0.05] hover:bg-white/[0.08] text-white rounded-lg transition-all"
                        title="Share"
                      >
                        <Share2 className="w-4 h-4" />
                      </button>
                      <button
                        className="px-4 py-2.5 bg-white/[0.05] hover:bg-white/[0.08] text-white rounded-lg transition-all"
                        title="Download"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}