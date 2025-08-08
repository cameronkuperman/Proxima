'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Clock, Camera, FileText, TrendingUp, TrendingDown, ChevronRight, Lock, Bell, AlertCircle, Loader } from 'lucide-react';
import { PhotoSession } from '@/types/photo-analysis';
import { usePhotoSessions, usePhotoReminders, usePrefetchSession } from '@/hooks/queries/usePhotoQueries';
import { PhotoSessionWithCounts } from '@/services/supabasePhotoAnalysisService';

interface PhotoSessionHistoryV2Props {
  onSelectSession: (session: PhotoSession) => void;
  showContinueButton?: boolean;
}

export default function PhotoSessionHistoryV2({
  onSelectSession,
  showContinueButton = false,
}: PhotoSessionHistoryV2Props) {
  // Use React Query hooks for optimized data fetching
  const { data: sessions = [], isLoading, error } = usePhotoSessions(false); // Don't include sensitive sessions
  const { data: reminders = [] } = usePhotoReminders();
  const prefetchSession = usePrefetchSession();
  
  // Create a map of reminders by session ID for quick lookup
  const remindersBySession = React.useMemo(() => {
    const map: { [sessionId: string]: any } = {};
    reminders.forEach(reminder => {
      if (reminder.session_id) {
        map[reminder.session_id] = reminder;
      }
    });
    return map;
  }, [reminders]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return date.toLocaleDateString();
  };

  const isOverdueForFollowUp = (session: PhotoSessionWithCounts) => {
    const sessionId = session.id;
    if (!sessionId || !remindersBySession[sessionId]) return false;
    
    const reminder = remindersBySession[sessionId];
    if (!reminder.enabled) return false;
    
    if (reminder.next_reminder_date) {
      const nextReminderDate = new Date(reminder.next_reminder_date);
      return nextReminderDate < new Date();
    }
    
    return false;
  };

  const getTrend = (session: PhotoSessionWithCounts) => {
    // In real implementation, this would come from progression analysis
    // For now, return stable
    return 'stable' as 'improving' | 'stable' | 'worsening';
  };

  // Handle loading state
  if (isLoading) {
    return (
      <div className="backdrop-blur-[20px] bg-white/[0.03] border border-white/[0.05] rounded-xl p-12 text-center">
        <Loader className="w-8 h-8 text-gray-400 animate-spin mx-auto mb-4" />
        <p className="text-gray-400">Loading your photo sessions...</p>
      </div>
    );
  }

  // Handle error state
  if (error) {
    return (
      <div className="backdrop-blur-[20px] bg-white/[0.03] border border-white/[0.05] rounded-xl p-12 text-center">
        <div className="w-16 h-16 mx-auto mb-4 bg-red-800/20 rounded-full flex items-center justify-center">
          <AlertCircle className="w-8 h-8 text-red-400" />
        </div>
        <h3 className="text-xl font-semibold text-white mb-2">Error Loading Sessions</h3>
        <p className="text-gray-400">Unable to load your photo sessions. Please try again.</p>
      </div>
    );
  }

  // Handle empty state
  if (sessions.length === 0) {
    return (
      <div className="backdrop-blur-[20px] bg-white/[0.03] border border-white/[0.05] rounded-xl p-12 text-center">
        <div className="w-16 h-16 mx-auto mb-4 bg-gray-800 rounded-full flex items-center justify-center">
          <Camera className="w-8 h-8 text-gray-600" />
        </div>
        <h3 className="text-xl font-semibold text-white mb-2">No Photo Sessions Yet</h3>
        <p className="text-gray-400">Start your first photo analysis to track health conditions over time</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-semibold text-white">Your Photo Sessions</h2>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-400">{sessions.length} sessions</span>
          {/* Add info about hidden sensitive sessions if any */}
          <div className="text-xs text-gray-500 flex items-center gap-1">
            <Lock className="w-3 h-3" />
            <span>Sensitive sessions hidden</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sessions.map((session: any, index: number) => (
          <motion.div
            key={session.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ scale: 1.02 }}
            onClick={() => onSelectSession(session)}
            onMouseEnter={() => session.id && prefetchSession(session.id)} // Prefetch on hover for instant loading
            className="backdrop-blur-[20px] bg-white/[0.03] border border-white/[0.05] rounded-xl p-6 cursor-pointer hover:border-white/[0.1] transition-all group relative"
          >
            {/* Status Indicators */}
            <div className="absolute top-4 right-4 flex items-center gap-2">
              {/* Reminder indicator */}
              {session.id && remindersBySession[session.id]?.enabled && (
                <div className="p-1.5 rounded-full bg-orange-500/20" title="Reminder active">
                  <Bell className="w-3.5 h-3.5 text-orange-400" />
                </div>
              )}
              
              {/* Overdue indicator */}
              {isOverdueForFollowUp(session) && (
                <div className="p-1.5 rounded-full bg-amber-500/20 animate-pulse" title="Follow-up overdue">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
                </div>
              )}
            </div>

            {/* Thumbnail or placeholder */}
            <div className="aspect-video rounded-lg bg-gray-800 mb-4 overflow-hidden relative">
              {session.thumbnail_url ? (
                <img
                  src={session.thumbnail_url}
                  alt={session.condition_name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Camera className="w-12 h-12 text-gray-600" />
                </div>
              )}
              
              {/* Note: Sensitive sessions are already filtered out */}
              
              {/* Photo count overlay */}
              <div className="absolute bottom-2 left-2 px-2 py-1 rounded bg-black/50 backdrop-blur-sm flex items-center gap-1">
                <Camera className="w-3 h-3 text-white" />
                <span className="text-xs text-white">{session.photo_count || 0}</span>
              </div>
            </div>

            {/* Session info */}
            <h3 className="text-lg font-semibold text-white mb-2 truncate">
              {session.condition_name}
            </h3>
            
            {session.description && (
              <p className="text-sm text-gray-400 mb-3 line-clamp-2">
                {session.description}
              </p>
            )}

            {/* Metadata */}
            <div className="space-y-2 mb-4">
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <Clock className="w-3 h-3" />
                <span>Started {formatDate(session.created_at)}</span>
              </div>
              {session.last_photo_at && (
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <TrendingUp className="w-3 h-3" />
                  <span>Last update {formatDate(session.last_photo_at)}</span>
                </div>
              )}
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <FileText className="w-3 h-3" />
                <span>{session.analysis_count || 0} analyses</span>
              </div>
            </div>

            {/* Latest summary */}
            {session.latest_summary && (
              <div className="p-3 rounded-lg bg-white/[0.02] border border-white/[0.05] mb-4">
                <p className="text-xs text-gray-300 italic">"{session.latest_summary}"</p>
              </div>
            )}

            {/* Trend indicator */}
            {session.photo_count && session.photo_count > 1 && (
              <div className="mb-4">
                {(() => {
                  const trend = getTrend(session);
                  return (
                    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs ${
                      trend === 'improving' ? 'bg-green-500/20 text-green-400' :
                      trend === 'worsening' ? 'bg-red-500/20 text-red-400' :
                      'bg-yellow-500/20 text-yellow-400'
                    }`}>
                      {trend === 'improving' && <TrendingUp className="w-3 h-3" />}
                      {trend === 'worsening' && <TrendingDown className="w-3 h-3" />}
                      {trend === 'stable' && <span className="w-3 h-0.5 bg-current rounded" />}
                      <span className="capitalize">{trend}</span>
                    </div>
                  );
                })()}
              </div>
            )}

            {/* Action button */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-orange-400 group-hover:text-orange-300 transition-colors">
                {showContinueButton ? 'Continue tracking' : 'View details'}
              </span>
              <ChevronRight className="w-4 h-4 text-orange-400 group-hover:translate-x-1 transition-transform" />
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}