'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Clock, Camera, FileText, ChevronRight, Bell, AlertCircle, Loader } from 'lucide-react';
import { PhotoSession } from '@/types/photo-analysis';
import { useAuth } from '@/contexts/AuthContext';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://web-production-945c4.up.railway.app';

interface Props {
  onSelectSession: (session: PhotoSession) => void;
  showContinueButton?: boolean;
}

// Ultra-lightweight session card
const SessionCardFast = React.memo(({ 
  session, 
  index,
  onSelect,
  showContinueButton
}: {
  session: PhotoSession;
  index: number;
  onSelect: () => void;
  showContinueButton: boolean;
}) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: index * 0.02 }} // Super fast animation
      whileHover={{ scale: 1.02 }}
      onClick={onSelect}
      className="backdrop-blur-[20px] bg-white/[0.03] border border-white/[0.05] rounded-xl p-6 cursor-pointer hover:border-white/[0.1] transition-all group relative"
    >
      {/* Simple icon placeholder - no image loading */}
      <div className="aspect-video rounded-lg bg-gray-800 mb-4 flex items-center justify-center">
        <Camera className="w-12 h-12 text-gray-600" />
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

      {/* Minimal metadata */}
      <div className="space-y-1 mb-4">
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <Clock className="w-3 h-3" />
          <span>Started {formatDate(session.created_at)}</span>
        </div>
        {/* Show counts only if loaded */}
        {(session.photo_count > 0 || session.analysis_count > 0) && (
          <div className="flex items-center gap-3 text-xs text-gray-400">
            <span className="flex items-center gap-1">
              <Camera className="w-3 h-3" />
              {session.photo_count}
            </span>
            <span className="flex items-center gap-1">
              <FileText className="w-3 h-3" />
              {session.analysis_count}
            </span>
          </div>
        )}
      </div>

      {/* Action */}
      <div className="flex items-center justify-between">
        <span className="text-sm text-orange-400">
          {showContinueButton ? 'Continue' : 'View'}
        </span>
        <ChevronRight className="w-4 h-4 text-orange-400 group-hover:translate-x-1 transition-transform" />
      </div>
    </motion.div>
  );
});

SessionCardFast.displayName = 'SessionCardFast';

export default function PhotoSessionHistoryUltraFast({ 
  onSelectSession, 
  showContinueButton = false
}: Props) {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<PhotoSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Fetch sessions from backend with caching
  useEffect(() => {
    const fetchSessions = async () => {
      if (!user?.id) {
        setIsLoading(false);
        return;
      }
      
      // Check localStorage cache first
      const cacheKey = `photo_sessions_${user.id}_${showContinueButton ? 'continue' : 'all'}`;
      const cached = localStorage.getItem(cacheKey);
      
      if (cached) {
        try {
          const { data, timestamp } = JSON.parse(cached);
          // Use cache if less than 30 minutes old
          if (Date.now() - timestamp < 30 * 60 * 1000) {
            setSessions(data);
            setIsLoading(false);
            // Still fetch fresh data in background
            fetchFreshData(false);
            return;
          }
        } catch (e) {
          console.error('Cache parse error:', e);
        }
      }
      
      // Fetch fresh data
      await fetchFreshData(true);
    };
    
    const fetchFreshData = async (showLoading: boolean) => {
      if (showLoading) setIsLoading(true);
      
      try {
        const response = await fetch(`${API_URL}/api/photo-analysis/sessions?user_id=${user!.id}&limit=20`);
        if (!response.ok) throw new Error('Failed to fetch sessions');
        
        const data = await response.json();
        const sessions = data.sessions || [];
        
        // Filter sensitive if needed for continue tracking
        const filtered = showContinueButton 
          ? sessions.filter((s: PhotoSession) => !s.is_sensitive)
          : sessions;
        
        setSessions(filtered);
        
        // Cache the results
        const cacheKey = `photo_sessions_${user!.id}_${showContinueButton ? 'continue' : 'all'}`;
        localStorage.setItem(cacheKey, JSON.stringify({
          data: filtered,
          timestamp: Date.now()
        }));
      } catch (err) {
        console.error('Error fetching sessions:', err);
        setError('Failed to load photo sessions');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchSessions();
  }, [user?.id, showContinueButton]);

  // Show skeleton loader while loading
  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between mb-6">
          <div className="h-8 w-48 bg-gradient-to-r from-gray-800 to-gray-700 rounded animate-pulse" />
          <div className="h-5 w-24 bg-gradient-to-r from-gray-800 to-gray-700 rounded animate-pulse" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <motion.div 
              key={i} 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: i * 0.05 }}
              className="backdrop-blur-[20px] bg-white/[0.03] border border-white/[0.05] rounded-xl p-6 relative overflow-hidden"
            >
              {/* Shimmer effect */}
              <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/[0.05] to-transparent" />
              
              <div className="aspect-video rounded-lg bg-gradient-to-r from-gray-800 to-gray-700 mb-4" />
              <div className="h-6 bg-gradient-to-r from-gray-800 to-gray-700 rounded mb-2" />
              <div className="h-4 bg-gradient-to-r from-gray-800 to-gray-700 rounded w-3/4" />
              
              <div className="mt-4 space-y-2">
                <div className="h-3 bg-gradient-to-r from-gray-800/50 to-gray-700/50 rounded w-1/2" />
                <div className="h-3 bg-gradient-to-r from-gray-800/50 to-gray-700/50 rounded w-2/3" />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="backdrop-blur-[20px] bg-white/[0.03] border border-white/[0.05] rounded-xl p-12 text-center">
        <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
        <p className="text-gray-400">Unable to load sessions. Please refresh.</p>
      </div>
    );
  }

  // Show empty state when no sessions exist
  if (!sessions || sessions.length === 0) {
    return (
      <div className="backdrop-blur-[20px] bg-white/[0.03] border border-white/[0.05] rounded-xl p-12 text-center">
        <Camera className="w-16 h-16 text-gray-600 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-white mb-2">No Photo Sessions</h3>
        <p className="text-gray-400">Start your first photo analysis</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-semibold text-white">Your Photo Sessions</h2>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-400">{sessions.length} sessions</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sessions.map((session, index) => (
          <SessionCardFast
            key={session.id || session.session_id}
            session={session}
            index={index}
            onSelect={() => onSelectSession(session)}
            showContinueButton={showContinueButton}
            onMouseEnter={() => {
              // Prefetch session data on hover for instant navigation
              const id = session.id || session.session_id;
              if (id) prefetchSession(id);
            }}
          />
        ))}
      </div>
    </div>
  );
}