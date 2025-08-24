'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Calendar, Clock, MapPin, Activity, Brain, 
  Camera, FileText, MessageCircle, BarChart,
  ChevronRight, Share2, Download, Stethoscope,
  AlertTriangle, TrendingUp, Shield, Sparkles,
  ClipboardList, Search, RefreshCw
} from 'lucide-react';
import { format, formatDistanceToNow, differenceInDays } from 'date-fns';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { FollowUpButton } from '@/components/FollowUpButton';

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
            
          case 'flash_assessment':
            query = supabase
              .from('flash_assessments')
              .select('*')
              .eq('id', interactionId)
              .single();
            break;
            
          case 'general_assessment':
            query = supabase
              .from('general_assessments')
              .select('*')
              .eq('id', interactionId)
              .single();
            break;
            
          case 'general_deepdive':
            query = supabase
              .from('general_deepdive_sessions')
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

  const getTypeColor = () => {
    switch (interactionType) {
      case 'quick_scan': return 'from-emerald-500 to-green-500';
      case 'deep_dive': return 'from-indigo-500 to-purple-500';
      case 'flash_assessment': return 'from-amber-500 to-yellow-500';
      case 'general_assessment': return 'from-blue-500 to-cyan-500';
      case 'general_deepdive': return 'from-indigo-500 to-purple-500';
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

  // Check if follow-up is available for this assessment type
  const canFollowUp = () => {
    // Only allow follow-ups for these assessment types
    const eligibleTypes = ['quick_scan', 'deep_dive', 'general_assessment', 'general_deepdive'];
    if (!eligibleTypes.includes(interactionType)) return false;
    
    // Check if enough time has passed (at least 1 day)
    if (!data?.created_at) return false;
    const daysSince = differenceInDays(new Date(), new Date(data.created_at));
    return daysSince >= 1;
  };

  // Map interaction type to follow-up compatible type
  const mapInteractionType = (type: string): string => {
    const typeMap: Record<string, string> = {
      'quick_scan': 'quick_scan',
      'deep_dive': 'deep_dive',
      'general_assessment': 'general',
      'general_deepdive': 'general_deep'
    };
    return typeMap[type] || type;
  };

  // Handle follow-up navigation
  const handleFollowUp = () => {
    const mappedType = mapInteractionType(interactionType);
    router.push(`/follow-up/${mappedType}/${interactionId}`);
    onClose();
  };

  // Get days since text for button
  const getDaysSinceText = () => {
    if (!data?.created_at) return '';
    const daysSince = differenceInDays(new Date(), new Date(data.created_at));
    if (daysSince === 1) return '1 day later';
    if (daysSince < 7) return `${daysSince} days later`;
    if (daysSince < 30) return `${Math.floor(daysSince / 7)} week${Math.floor(daysSince / 7) > 1 ? 's' : ''} later`;
    return `${Math.floor(daysSince / 30)} month${Math.floor(daysSince / 30) > 1 ? 's' : ''} later`;
  };

  const renderDeepDivePreview = () => {
    if (!data) return null;
    
    const analysis = data.final_analysis;
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
                    className="h-full bg-gradient-to-r from-indigo-500 to-purple-500"
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
        {analysis?.urgency && (
          <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
            analysis.urgency === 'high' ? 'bg-red-500/20 text-red-400' :
            analysis.urgency === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
            'bg-green-500/20 text-green-400'
          }`}>
            <AlertTriangle className="w-4 h-4" />
            <span className="text-sm font-medium capitalize">{analysis.urgency} Urgency</span>
          </div>
        )}

        {/* Questions Asked */}
        {data.questions && data.questions.length > 0 && (
          <div className="text-sm text-gray-400">
            <span className="font-medium">{data.questions.length}</span> follow-up questions answered
          </div>
        )}

        {/* Key Recommendations */}
        {analysis?.recommendations?.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-400">Key Recommendations</h4>
            <ul className="space-y-1">
              {analysis.recommendations.slice(0, 3).map((rec: string, idx: number) => (
                <li key={idx} className="text-sm text-gray-300 flex items-start gap-2">
                  <span className="text-indigo-400 mt-0.5">•</span>
                  <span>{rec}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
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

  const renderFlashAssessmentPreview = () => {
    if (!data) return null;
    
    return (
      <div className="space-y-4">
        {/* Main Concern */}
        {data.main_concern && (
          <div className="bg-white/[0.03] rounded-lg p-4 border border-white/[0.05]">
            <h4 className="text-sm font-medium text-gray-400 mb-2">Main Concern</h4>
            <p className="text-white">{data.main_concern}</p>
          </div>
        )}

        {/* Urgency & Confidence */}
        <div className="grid grid-cols-2 gap-3">
          {/* Urgency */}
          {data.urgency && (
            <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
              data.urgency === 'emergency' ? 'bg-red-500/20 text-red-400' :
              data.urgency === 'high' ? 'bg-orange-500/20 text-orange-400' :
              data.urgency === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
              'bg-green-500/20 text-green-400'
            }`}>
              <AlertTriangle className="w-4 h-4" />
              <span className="text-sm font-medium capitalize">{data.urgency}</span>
            </div>
          )}

          {/* Category */}
          {data.category && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-500/20 text-amber-400">
              <Sparkles className="w-4 h-4" />
              <span className="text-sm font-medium capitalize">{data.category}</span>
            </div>
          )}
        </div>

        {/* Confidence Score */}
        {data.confidence_score !== undefined && (
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm text-gray-400">Confidence</span>
              <span className="text-sm text-gray-300">{Math.round(data.confidence_score)}%</span>
            </div>
            <div className="flex-1 bg-white/[0.05] rounded-full h-2 overflow-hidden">
              <motion.div 
                className="h-full bg-gradient-to-r from-amber-500 to-yellow-500"
                initial={{ width: 0 }}
                animate={{ width: `${data.confidence_score}%` }}
                transition={{ duration: 0.5, delay: 0.2 }}
              />
            </div>
          </div>
        )}

        {/* Suggested Action */}
        {data.suggested_next_action && (
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3">
            <p className="text-sm font-medium text-amber-400 mb-1">Recommended Next Step</p>
            <p className="text-sm text-gray-300">
              {data.suggested_next_action === 'general-assessment' && 'Take a General Assessment'}
              {data.suggested_next_action === 'body-scan' && 'Use the 3D Body Scanner'}
              {data.suggested_next_action === 'see-doctor' && 'Consider seeing a doctor'}
              {data.suggested_next_action === 'monitor' && 'Monitor your symptoms'}
            </p>
          </div>
        )}
      </div>
    );
  };

  const renderGeneralAssessmentPreview = () => {
    if (!data) return null;
    
    const analysis = data.analysis_result;
    return (
      <div className="space-y-4">
        {/* Category Badge */}
        <div className="flex items-center gap-2">
          <div className="px-3 py-1 rounded-full bg-blue-500/20 text-blue-400 text-sm font-medium">
            <ClipboardList className="w-4 h-4 inline mr-1" />
            {data.category === 'energy' && 'Energy & Fatigue'}
            {data.category === 'mental' && 'Mental Health'}
            {data.category === 'sick' && 'Feeling Sick'}
            {data.category === 'physical' && 'Physical Pain'}
            {data.category === 'medication' && 'Medication Side Effects'}
            {data.category === 'multiple' && 'Multiple Issues'}
            {data.category === 'unsure' && 'General Health'}
          </div>
        </div>

        {/* Primary Assessment */}
        {data.primary_assessment && (
          <div className="bg-white/[0.03] rounded-lg p-4 border border-white/[0.05]">
            <h4 className="text-sm font-medium text-gray-400 mb-2">Primary Assessment</h4>
            <p className="text-white text-sm">
              {data.primary_assessment.length > 200 
                ? data.primary_assessment.substring(0, 200) + '...' 
                : data.primary_assessment}
            </p>
          </div>
        )}

        {/* Urgency & Doctor Visit */}
        <div className="flex gap-3">
          {data.urgency_level && (
            <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
              data.urgency_level === 'high' ? 'bg-red-500/20 text-red-400' :
              data.urgency_level === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
              'bg-green-500/20 text-green-400'
            }`}>
              <AlertTriangle className="w-4 h-4" />
              <span className="text-sm font-medium capitalize">{data.urgency_level} Priority</span>
            </div>
          )}

          {data.doctor_visit_suggested && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-orange-500/20 text-orange-400">
              <Stethoscope className="w-4 h-4" />
              <span className="text-sm font-medium">Doctor Visit Suggested</span>
            </div>
          )}
        </div>

        {/* Confidence Score */}
        {data.confidence_score !== undefined && (
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm text-gray-400">Analysis Confidence</span>
              <span className="text-sm text-gray-300">{Math.round(data.confidence_score)}%</span>
            </div>
            <div className="flex-1 bg-white/[0.05] rounded-full h-2 overflow-hidden">
              <motion.div 
                className="h-full bg-gradient-to-r from-blue-500 to-cyan-500"
                initial={{ width: 0 }}
                animate={{ width: `${data.confidence_score}%` }}
                transition={{ duration: 0.5, delay: 0.2 }}
              />
            </div>
          </div>
        )}

        {/* Recommendations Count */}
        {data.recommendations && data.recommendations.length > 0 && (
          <div className="text-sm text-gray-400">
            <TrendingUp className="w-4 h-4 inline mr-1" />
            <span className="font-medium">{data.recommendations.length}</span> recommendations available
          </div>
        )}
      </div>
    );
  };

  const renderGeneralDeepDivePreview = () => {
    if (!data) return null;
    
    return (
      <div className="space-y-4">
        {/* Category & Status */}
        <div className="flex items-center gap-2">
          <div className="px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-400 text-sm font-medium">
            <Search className="w-4 h-4 inline mr-1" />
            {data.category === 'energy' && 'Energy & Fatigue'}
            {data.category === 'mental' && 'Mental Health'}
            {data.category === 'sick' && 'Feeling Sick'}
            {data.category === 'physical' && 'Physical Pain'}
            {data.category === 'medication' && 'Medication Side Effects'}
            {data.category === 'multiple' && 'Multiple Issues'}
            {data.category === 'unsure' && 'General Health'}
          </div>
          
          {data.status && (
            <div className={`px-3 py-1 rounded-full text-xs font-medium ${
              data.status === 'completed' ? 'bg-green-500/20 text-green-400' :
              data.status === 'abandoned' ? 'bg-gray-500/20 text-gray-400' :
              'bg-blue-500/20 text-blue-400'
            }`}>
              {data.status}
            </div>
          )}
        </div>

        {/* Initial Complaint */}
        {data.initial_complaint && (
          <div className="bg-white/[0.03] rounded-lg p-4 border border-white/[0.05]">
            <h4 className="text-sm font-medium text-gray-400 mb-2">Initial Concern</h4>
            <p className="text-white text-sm">
              {data.initial_complaint.length > 100 
                ? data.initial_complaint.substring(0, 100) + '...' 
                : data.initial_complaint}
            </p>
          </div>
        )}

        {/* Progress Stats */}
        <div className="grid grid-cols-2 gap-3">
          {data.questions && (
            <div className="bg-white/[0.03] rounded-lg p-3 border border-white/[0.05]">
              <p className="text-xs text-gray-400 mb-1">Questions Asked</p>
              <p className="text-xl font-semibold text-white">{data.questions.length}</p>
            </div>
          )}
          
          {data.key_findings && (
            <div className="bg-white/[0.03] rounded-lg p-3 border border-white/[0.05]">
              <p className="text-xs text-gray-400 mb-1">Key Findings</p>
              <p className="text-xl font-semibold text-white">{data.key_findings.length}</p>
            </div>
          )}
        </div>

        {/* Final Confidence (if completed) */}
        {data.status === 'completed' && data.final_confidence !== undefined && (
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm text-gray-400">Final Confidence</span>
              <span className="text-sm text-gray-300">{Math.round(data.final_confidence)}%</span>
            </div>
            <div className="flex-1 bg-white/[0.05] rounded-full h-2 overflow-hidden">
              <motion.div 
                className="h-full bg-gradient-to-r from-indigo-500 to-purple-500"
                initial={{ width: 0 }}
                animate={{ width: `${data.final_confidence}%` }}
                transition={{ duration: 0.5, delay: 0.2 }}
              />
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderReportPreview = () => {
    if (!data) return null;
    
    return (
      <div className="space-y-4">
        {/* Report Type */}
        <div className="flex items-center gap-2">
          <div className={`px-3 py-1 rounded-full text-sm font-medium ${
            data.report_type === 'urgent_triage' 
              ? 'bg-red-500/20 text-red-400' 
              : 'bg-blue-500/20 text-blue-400'
          }`}>
            <FileText className="w-4 h-4 inline mr-1" />
            {data.report_type === 'comprehensive' && 'Comprehensive Report'}
            {data.report_type === 'urgent_triage' && 'Urgent Triage Report'}
            {data.report_type === 'photo_progression' && 'Photo Progression Report'}
            {data.report_type === 'symptom_timeline' && 'Symptom Timeline Report'}
            {data.report_type === 'specialist_focused' && 'Specialist Report'}
            {data.report_type === 'annual_summary' && 'Annual Summary'}
          </div>
          
          {data.specialty && (
            <div className="px-3 py-1 rounded-full bg-purple-500/20 text-purple-400 text-sm font-medium">
              {data.specialty}
            </div>
          )}
        </div>

        {/* Executive Summary */}
        {data.executive_summary && (
          <div className="bg-white/[0.03] rounded-lg p-4 border border-white/[0.05]">
            <h4 className="text-sm font-medium text-gray-400 mb-2">Executive Summary</h4>
            <p className="text-white text-sm">
              {data.executive_summary.length > 200 
                ? data.executive_summary.substring(0, 200) + '...' 
                : data.executive_summary}
            </p>
          </div>
        )}

        {/* Model & Confidence */}
        <div className="flex items-center justify-between text-sm">
          {data.model_used && (
            <div className="text-gray-400">
              <Brain className="w-4 h-4 inline mr-1" />
              Model: <span className="text-gray-300">{data.model_used}</span>
            </div>
          )}
          
          {data.confidence_score !== undefined && (
            <div className="text-gray-400">
              Confidence: <span className="text-gray-300">{data.confidence_score}%</span>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderOracleChatPreview = () => {
    if (!data) return null;
    
    return (
      <div className="space-y-4">
        {/* Chat Title */}
        <div className="bg-white/[0.03] rounded-lg p-4 border border-white/[0.05]">
          <h4 className="text-sm font-medium text-gray-400 mb-2">Conversation</h4>
          <p className="text-white font-medium">{data.title || 'Oracle Consultation'}</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white/[0.03] rounded-lg p-3 border border-white/[0.05]">
            <p className="text-xs text-gray-400 mb-1">Messages</p>
            <p className="text-xl font-semibold text-white">{data.message_count || 0}</p>
          </div>
          
          <div className="bg-white/[0.03] rounded-lg p-3 border border-white/[0.05]">
            <p className="text-xs text-gray-400 mb-1">Status</p>
            <p className={`text-sm font-medium ${
              data.status === 'active' ? 'text-green-400' : 'text-gray-400'
            }`}>
              {data.status === 'active' ? 'Active' : 'Completed'}
            </p>
          </div>
        </div>

        {/* AI Model Info */}
        <div className="flex items-center justify-between text-sm">
          <div className="text-gray-400">
            <Brain className="w-4 h-4 inline mr-1" />
            {data.ai_provider || 'openai'} - {data.model_name || 'gpt-4'}
          </div>
        </div>

        {/* Last Message Time */}
        {data.last_message_at && (
          <div className="text-sm text-gray-400">
            <Clock className="w-4 h-4 inline mr-1" />
            Last message: {formatDistanceToNow(new Date(data.last_message_at), { addSuffix: true })}
          </div>
        )}
      </div>
    );
  };

  const renderPhotoAnalysisPreview = () => {
    if (!data) return null;
    
    return (
      <div className="space-y-4">
        {/* Condition Name */}
        <div className="bg-white/[0.03] rounded-lg p-4 border border-white/[0.05]">
          <h4 className="text-sm font-medium text-gray-400 mb-2">Condition</h4>
          <p className="text-white font-medium">{data.condition_name || 'Photo Analysis'}</p>
          {data.description && (
            <p className="text-sm text-gray-300 mt-1">{data.description}</p>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          {metadata?.photo_count !== undefined && (
            <div className="bg-white/[0.03] rounded-lg p-3 border border-white/[0.05]">
              <p className="text-xs text-gray-400 mb-1">Photos</p>
              <p className="text-xl font-semibold text-white">{metadata.photo_count}</p>
            </div>
          )}
          
          {metadata?.confidence !== undefined && (
            <div className="bg-white/[0.03] rounded-lg p-3 border border-white/[0.05]">
              <p className="text-xs text-gray-400 mb-1">Confidence</p>
              <p className="text-xl font-semibold text-white">{Math.round(metadata.confidence * 100)}%</p>
            </div>
          )}
        </div>

        {/* Sensitive Warning */}
        {data.is_sensitive && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-yellow-500/20 text-yellow-400">
            <Shield className="w-4 h-4" />
            <span className="text-sm font-medium">Sensitive Content</span>
          </div>
        )}

        {/* Analysis Status */}
        {metadata?.has_analysis && (
          <div className="text-sm text-gray-400">
            <Activity className="w-4 h-4 inline mr-1" />
            Latest analysis available
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
        return renderDeepDivePreview();
      case 'flash_assessment':
        return renderFlashAssessmentPreview();
      case 'general_assessment':
        return renderGeneralAssessmentPreview();
      case 'general_deepdive':
        return renderGeneralDeepDivePreview();
      case 'photo_analysis':
        return renderPhotoAnalysisPreview();
      case 'report':
        return renderReportPreview();
      case 'oracle_chat':
        return renderOracleChatPreview();
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
                      
                      {/* Follow-up button for eligible assessments */}
                      {canFollowUp() && (
                        <button
                          onClick={handleFollowUp}
                          className="flex-1 px-4 py-2.5 bg-white/[0.05] hover:bg-white/[0.08] text-white rounded-lg font-medium transition-all flex items-center justify-center gap-2"
                        >
                          Follow Up ({getDaysSinceText()})
                          <RefreshCw className="w-4 h-4" />
                        </button>
                      )}
                      
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