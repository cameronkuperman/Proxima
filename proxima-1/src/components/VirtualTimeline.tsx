'use client';

import React, { useCallback, forwardRef } from 'react';
const ReactWindow = require('react-window');
const { FixedSizeList: List } = ReactWindow;
import InfiniteLoader from 'react-window-infinite-loader';
import { motion, AnimatePresence } from 'framer-motion';
import { format, formatDistanceToNow } from 'date-fns';
import { MapPin, Pill, Heart, Clock, User, AlertTriangle, Zap, Brain, Camera, BrainCircuit, Sparkles, FileText, Activity, ClipboardList, Search } from 'lucide-react';

interface TimelineEntry {
  id: string;
  user_id: string;
  interaction_type: string;
  created_at: string;
  title: string;
  severity: string;
  metadata: {
    confidence?: number;
    urgency?: string;
    body_part?: string;
    has_summary?: boolean;
    escalated?: boolean;
    message_count?: number;
    questions_asked?: number;
    photo_count?: number;
    category?: string;
    condition?: string;
    [key: string]: any;
  };
}

interface VirtualTimelineProps {
  data: TimelineEntry[];
  hasMore: boolean;
  loading: boolean;
  loadingMore: boolean;
  onLoadMore: () => void;
  onItemClick: (item: TimelineEntry) => void;
  expanded: boolean;
  height: number;
}

const getInteractionColor = (type: string) => {
  switch (type) {
    case 'quick_scan':
      return {
        gradient: 'from-emerald-500/20 to-green-500/20',
        iconColor: 'text-emerald-400',
        borderColor: 'border-emerald-500/20',
      };
    case 'deep_dive':
      return {
        gradient: 'from-indigo-500/20 to-purple-500/20',
        iconColor: 'text-indigo-400',
        borderColor: 'border-indigo-500/20',
      };
    case 'flash_assessment':
      return {
        gradient: 'from-amber-500/20 to-yellow-500/20',
        iconColor: 'text-amber-400',
        borderColor: 'border-amber-500/20',
      };
    case 'general_assessment':
      return {
        gradient: 'from-blue-500/20 to-cyan-500/20',
        iconColor: 'text-blue-400',
        borderColor: 'border-blue-500/20',
      };
    case 'general_deepdive':
      return {
        gradient: 'from-indigo-500/20 to-purple-500/20',
        iconColor: 'text-indigo-400',
        borderColor: 'border-indigo-500/20',
      };
    case 'photo_analysis':
      return {
        gradient: 'from-pink-500/20 to-rose-500/20',
        iconColor: 'text-pink-400',
        borderColor: 'border-pink-500/20',
      };
    case 'report':
      return {
        gradient: 'from-blue-500/20 to-cyan-500/20',
        iconColor: 'text-blue-400',
        borderColor: 'border-blue-500/20',
      };
    case 'oracle_chat':
      return {
        gradient: 'from-amber-500/20 to-yellow-500/20',
        iconColor: 'text-amber-400',
        borderColor: 'border-amber-500/20',
      };
    case 'tracking_log':
      return {
        gradient: 'from-gray-500/20 to-slate-500/20',
        iconColor: 'text-gray-400',
        borderColor: 'border-gray-500/20',
      };
    default:
      return {
        gradient: 'from-gray-500/20 to-gray-500/20',
        iconColor: 'text-gray-400',
        borderColor: 'border-gray-500/20',
      };
  }
};

const getInteractionIcon = (type: string) => {
  switch(type) {
    case 'quick_scan': return <Zap className="w-3 h-3" />;
    case 'deep_dive': return <Brain className="w-3 h-3" />;
    case 'flash_assessment': return <Sparkles className="w-3 h-3" />;
    case 'general_assessment': return <ClipboardList className="w-3 h-3" />;
    case 'general_deepdive': return <Search className="w-3 h-3" />;
    case 'photo_analysis': return <Camera className="w-3 h-3" />;
    case 'report': return <FileText className="w-3 h-3" />;
    case 'oracle_chat': return <BrainCircuit className="w-3 h-3" />;
    case 'tracking_log': return <Activity className="w-3 h-3" />;
    default: return <Heart className="w-3 h-3" />;
  }
};

interface RowProps {
  index: number;
  style: React.CSSProperties;
  data: {
    items: TimelineEntry[];
    expanded: boolean;
    onItemClick: (item: TimelineEntry) => void;
    showDateSeparators: boolean[];
  };
}

const Row = ({ index, style, data }: RowProps) => {
  const { items, expanded, onItemClick, showDateSeparators } = data;
  const entry = items[index];
  
  if (!entry) {
    return <div style={style} className="relative mb-8" />;
  }
  
  const colors = getInteractionColor(entry.interaction_type);
  const entryDate = new Date(entry.created_at);
  const dateStr = format(entryDate, 'MMM d, yyyy');
  const showDateSeparator = showDateSeparators[index];
  
  return (
    <div style={style} className="relative mb-8" role="article" aria-label={`${entry.title} from ${dateStr}`}>
      {/* Date separator */}
      {showDateSeparator && expanded && (
        <div className="relative mb-4 ml-12">
          <div className="flex items-center gap-2">
            <div className="h-px flex-1 bg-white/[0.05]" />
            <span className="text-xs text-gray-500 px-2">{dateStr}</span>
            <div className="h-px flex-1 bg-white/[0.05]" />
          </div>
        </div>
      )}
      
      {/* Date dot with icon */}
      <div 
        className={`absolute left-[9px] w-6 h-6 rounded-full bg-[#0a0a0a] border-2 ${colors.borderColor} flex items-center justify-center`}
        aria-hidden="true"
      >
        <div className={colors.iconColor}>
          {getInteractionIcon(entry.interaction_type)}
        </div>
      </div>
      
      {/* Content */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            className="ml-12"
          >
            <motion.div 
              whileHover={{ scale: 1.02, x: 3, y: -3 }}
              onClick={() => onItemClick(entry)}
              className={`p-3 rounded-lg bg-gradient-to-r ${colors.gradient} backdrop-blur-sm border border-white/[0.05] cursor-pointer hover:border-white/[0.1] transition-all relative`}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onItemClick(entry);
                }
              }}
            >
              <div className="flex items-center justify-between mb-1">
                <p className="text-xs text-gray-400">
                  {formatDistanceToNow(new Date(entry.created_at), { addSuffix: true })}
                </p>
                {entry.severity && (
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    entry.severity === 'high' ? 'bg-red-500/20 text-red-400' :
                    entry.severity === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                    'bg-green-500/20 text-green-400'
                  }`}>
                    {entry.severity}
                  </span>
                )}
              </div>
              <p className="text-sm text-white font-medium mb-1">{entry.title}</p>
              
              {/* Metadata badges */}
              <div className="flex flex-wrap gap-2 mt-2">
                {entry.metadata.body_part && (
                  <span className="text-xs text-gray-400 flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {entry.metadata.body_part}
                  </span>
                )}
                {entry.metadata.category && (
                  <span className="text-xs text-gray-400 flex items-center gap-1">
                    <Activity className="w-3 h-3" />
                    {entry.metadata.category}
                  </span>
                )}
                {entry.metadata.photo_count && entry.metadata.photo_count > 0 && (
                  <span className="text-xs text-gray-400" aria-label={`${entry.metadata.photo_count} photos attached`}>
                    📷 {entry.metadata.photo_count} photos
                  </span>
                )}
                {entry.metadata.message_count && entry.metadata.message_count > 0 && (
                  <span className="text-xs text-gray-400" aria-label={`${entry.metadata.message_count} messages exchanged`}>
                    💬 {entry.metadata.message_count} messages
                  </span>
                )}
                {entry.metadata.questions_asked && entry.metadata.questions_asked > 0 && (
                  <span className="text-xs text-gray-400" aria-label={`${entry.metadata.questions_asked} questions asked`}>
                    ❓ {entry.metadata.questions_asked} questions
                  </span>
                )}
                {entry.metadata.confidence && entry.metadata.confidence > 0 && (
                  <span className="text-xs text-gray-400" aria-label={`${Math.round(entry.metadata.confidence)}% confidence level`}>
                    {Math.round(entry.metadata.confidence)}% confidence
                  </span>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const VirtualTimeline = forwardRef<HTMLDivElement, VirtualTimelineProps>(
  ({ data, hasMore, loading, loadingMore, onLoadMore, onItemClick, expanded, height }, ref) => {
    
    // Calculate which items should show date separators
    const showDateSeparators = React.useMemo(() => {
      return data.map((entry, index) => {
        if (index === 0) return true;
        const prevDate = format(new Date(data[index - 1].created_at), 'MMM d, yyyy');
        const currDate = format(new Date(entry.created_at), 'MMM d, yyyy');
        return prevDate !== currDate;
      });
    }, [data]);
    
    // Item count with extra item for loading indicator
    const itemCount = hasMore ? data.length + 1 : data.length;
    
    // Check if an item is loaded
    const isItemLoaded = useCallback((index: number) => !hasMore || index < data.length, [hasMore, data.length]);
    
    // Load more items
    const loadMoreItems = useCallback(() => {
      if (!loadingMore && hasMore) {
        return onLoadMore();
      }
      return Promise.resolve();
    }, [loadingMore, hasMore, onLoadMore]);
    
    // Item data for row renderer
    const itemData = React.useMemo(
      () => ({
        items: data,
        expanded,
        onItemClick,
        showDateSeparators,
      }),
      [data, expanded, onItemClick, showDateSeparators]
    );
    
    if (loading) {
      return (
        <div className="flex items-center justify-center h-full">
          <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
        </div>
      );
    }
    
    if (data.length === 0) {
      return (
        <div className="text-center py-8" role="status">
          {expanded ? (
            <div className="ml-8">
              <div className="mb-4">
                <div className="w-12 h-12 mx-auto bg-gray-800/50 rounded-full flex items-center justify-center">
                  <Activity className="w-6 h-6 text-gray-600" />
                </div>
              </div>
              <p className="text-sm text-gray-400 mb-2">No past interactions</p>
              <p className="text-xs text-gray-500">Start with a Quick Scan to begin your health journey</p>
            </div>
          ) : (
            <div className="relative">
              <div className="absolute left-[9px] w-6 h-6 rounded-full bg-[#0a0a0a] border-2 border-gray-800/50 flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-gray-600/50" />
              </div>
            </div>
          )}
        </div>
      );
    }
    
    return (
      <InfiniteLoader
        isItemLoaded={isItemLoaded}
        itemCount={itemCount}
        loadMoreItems={loadMoreItems}
      >
        {({ onItemsRendered, ref: listRef }) => (
          <List
            ref={listRef}
            height={height}
            itemCount={itemCount}
            itemSize={expanded ? 140 : 40}
            itemData={itemData}
            onItemsRendered={onItemsRendered}
            className="timeline-scrollbar"
            style={{ overflow: 'auto' }}
          >
            {Row}
          </List>
        )}
      </InfiniteLoader>
    );
  }
);

VirtualTimeline.displayName = 'VirtualTimeline';

export default VirtualTimeline;