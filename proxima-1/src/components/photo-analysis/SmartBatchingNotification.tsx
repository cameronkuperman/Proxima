'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Info, ChevronDown, ChevronUp, Calendar } from 'lucide-react';
import { SmartBatchingInfo } from '@/types/photo-analysis';

interface SmartBatchingNotificationProps {
  batchingInfo: SmartBatchingInfo;
  onViewAllPhotos?: () => void;
}

export default function SmartBatchingNotification({
  batchingInfo,
  onViewAllPhotos
}: SmartBatchingNotificationProps) {
  const [isExpanded, setIsExpanded] = React.useState(false);
  
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="backdrop-blur-[20px] bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 mb-6"
    >
      <div className="flex items-start gap-3">
        <Info className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <h5 className="text-sm font-medium text-blue-400 mb-1">
              Intelligent Photo Selection Active
            </h5>
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-blue-400 hover:text-blue-300 transition-colors"
            >
              {isExpanded ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </button>
          </div>
          
          <p className="text-sm text-gray-300">
            Showing {batchingInfo.photos_shown} of {batchingInfo.total_photos} photos
            for optimal comparison
          </p>
          
          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="mt-3"
              >
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-gray-400 mb-2">Photos were selected based on:</p>
                    <ul className="space-y-1">
                      {batchingInfo.selection_reasoning?.map((reason, index) => (
                        <li key={index} className="text-sm text-gray-300 flex items-start gap-2">
                          <span className="text-blue-400 mt-0.5">•</span>
                          <span>{reason}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  {batchingInfo.omitted_periods && batchingInfo.omitted_periods.length > 0 && (
                    <div>
                      <p className="text-xs text-gray-400 mb-2">Time periods with similar photos:</p>
                      <div className="space-y-1">
                        {batchingInfo.omitted_periods?.map((period, index) => (
                          <div key={index} className="flex items-center gap-2 text-sm text-gray-300">
                            <Calendar className="w-3 h-3 text-gray-500" />
                            <span>
                              {new Date(period.start).toLocaleDateString()} - {new Date(period.end).toLocaleDateString()}
                            </span>
                            <span className="text-gray-500">
                              ({period.photos_omitted} photos)
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                
                {onViewAllPhotos && (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={onViewAllPhotos}
                    className="mt-4 px-4 py-2 rounded-lg bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-colors text-sm font-medium"
                  >
                    View All Photos
                  </motion.button>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}