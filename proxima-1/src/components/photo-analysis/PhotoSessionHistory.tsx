'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Clock, Camera, FileText, TrendingUp, ChevronRight, Lock } from 'lucide-react';
import { PhotoSession } from '@/types/photo-analysis';

interface PhotoSessionHistoryProps {
  sessions: PhotoSession[];
  onSelectSession: (session: PhotoSession) => void;
  showContinueButton?: boolean;
}

export default function PhotoSessionHistory({
  sessions,
  onSelectSession,
  showContinueButton = false
}: PhotoSessionHistoryProps) {
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
        <span className="text-sm text-gray-400">{sessions.length} sessions</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sessions.map((session, index) => (
          <motion.div
            key={session.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ scale: 1.02 }}
            onClick={() => onSelectSession(session)}
            className="backdrop-blur-[20px] bg-white/[0.03] border border-white/[0.05] rounded-xl p-6 cursor-pointer hover:border-white/[0.1] transition-all group"
          >
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
              
              {/* Sensitive indicator */}
              {session.is_sensitive && (
                <div className="absolute top-2 right-2 p-1 rounded bg-black/50 backdrop-blur-sm">
                  <Lock className="w-4 h-4 text-white" />
                </div>
              )}
              
              {/* Photo count overlay */}
              <div className="absolute bottom-2 left-2 px-2 py-1 rounded bg-black/50 backdrop-blur-sm flex items-center gap-1">
                <Camera className="w-3 h-3 text-white" />
                <span className="text-xs text-white">{session.photo_count}</span>
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
                <span>{session.analysis_count} analyses</span>
              </div>
            </div>

            {/* Latest summary */}
            {session.latest_summary && (
              <div className="p-3 rounded-lg bg-white/[0.02] border border-white/[0.05] mb-4">
                <p className="text-xs text-gray-300 italic">"{session.latest_summary}"</p>
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