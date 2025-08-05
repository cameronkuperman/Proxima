'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertTriangle,
  AlertCircle,
  X,
  Phone,
  Ambulance,
  Clock,
  ChevronDown,
  ChevronUp,
  Shield,
  ExternalLink
} from 'lucide-react';

interface RedFlag {
  flag: string;
  severity: 'emergency' | 'urgent' | 'caution';
  action?: string;
  timeframe?: string;
}

interface RedFlagsAlertProps {
  redFlags?: string[] | RedFlag[];
  recommendedAction?: string;
  recommendedTiming?: string;
  sticky?: boolean;
  dismissible?: boolean;
  className?: string;
  specialty?: string;
}

export const RedFlagsAlert: React.FC<RedFlagsAlertProps> = ({
  redFlags = [],
  recommendedAction,
  recommendedTiming,
  sticky = true,
  dismissible = true,
  className = '',
  specialty
}) => {
  const [isDismissed, setIsDismissed] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);
  const [showConfirmDismiss, setShowConfirmDismiss] = useState(false);

  if (!redFlags?.length && !recommendedAction) return null;
  if (isDismissed) return null;

  // Normalize red flags to RedFlag format
  const normalizedFlags: RedFlag[] = redFlags.map(flag => {
    if (typeof flag === 'string') {
      return { flag, severity: 'urgent' };
    }
    return flag;
  });

  // Determine overall severity
  const overallSeverity = normalizedFlags.some(f => f.severity === 'emergency') 
    ? 'emergency' 
    : normalizedFlags.some(f => f.severity === 'urgent') 
    ? 'urgent' 
    : 'caution';

  const getSeverityConfig = () => {
    switch (overallSeverity) {
      case 'emergency':
        return {
          bgColor: 'bg-red-50',
          borderColor: 'border-red-500',
          textColor: 'text-red-900',
          iconColor: 'text-red-600',
          icon: Ambulance,
          title: 'Emergency Medical Attention Required',
          actionText: 'Call 911 or go to nearest emergency room immediately'
        };
      case 'urgent':
        return {
          bgColor: 'bg-orange-50',
          borderColor: 'border-orange-500',
          textColor: 'text-orange-900',
          iconColor: 'text-orange-600',
          icon: AlertTriangle,
          title: 'Urgent Medical Evaluation Needed',
          actionText: recommendedAction || 'Contact your healthcare provider within 24-48 hours'
        };
      default:
        return {
          bgColor: 'bg-yellow-50',
          borderColor: 'border-yellow-500',
          textColor: 'text-yellow-900',
          iconColor: 'text-yellow-600',
          icon: AlertCircle,
          title: 'Medical Attention Recommended',
          actionText: recommendedAction || 'Schedule an appointment with your healthcare provider'
        };
    }
  };

  const config = getSeverityConfig();
  const Icon = config.icon;

  const handleDismiss = () => {
    if (overallSeverity === 'emergency') {
      setShowConfirmDismiss(true);
    } else {
      setIsDismissed(true);
    }
  };

  const confirmDismiss = () => {
    setIsDismissed(true);
    setShowConfirmDismiss(false);
  };

  return (
    <AnimatePresence>
      {!isDismissed && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className={`
            ${config.bgColor} ${config.borderColor} border-2 rounded-xl shadow-lg
            ${sticky ? 'sticky top-4 z-40' : ''}
            ${className}
          `}
        >
          {/* Main Alert Content */}
          <div className="p-4">
            <div className="flex items-start gap-4">
              {/* Icon */}
              <div className={`p-3 ${config.bgColor} rounded-lg ${config.iconColor}`}>
                <Icon className="w-6 h-6" />
              </div>

              {/* Content */}
              <div className="flex-1">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className={`text-lg font-bold ${config.textColor} mb-1`}>
                      {config.title}
                    </h3>
                    <p className={`${config.textColor} font-medium mb-3`}>
                      {config.actionText}
                    </p>

                    {/* Expandable Flags List */}
                    {normalizedFlags.length > 0 && (
                      <div>
                        <button
                          onClick={() => setIsExpanded(!isExpanded)}
                          className={`flex items-center gap-2 text-sm font-medium ${config.iconColor} hover:underline mb-2`}
                        >
                          {isExpanded ? (
                            <>
                              <ChevronUp className="w-4 h-4" />
                              Hide details
                            </>
                          ) : (
                            <>
                              <ChevronDown className="w-4 h-4" />
                              View {normalizedFlags.length} warning sign{normalizedFlags.length > 1 ? 's' : ''}
                            </>
                          )}
                        </button>

                        <AnimatePresence>
                          {isExpanded && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.2 }}
                              className="overflow-hidden"
                            >
                              <ul className="space-y-2 mb-3">
                                {normalizedFlags.map((flag, idx) => (
                                  <li key={idx} className={`flex items-start gap-2 ${config.textColor}`}>
                                    <span className={`${config.iconColor} mt-0.5`}>•</span>
                                    <div>
                                      <span className="font-medium">{flag.flag}</span>
                                      {flag.action && (
                                        <p className="text-sm mt-0.5 opacity-90">{flag.action}</p>
                                      )}
                                      {flag.timeframe && (
                                        <p className="text-sm mt-0.5 flex items-center gap-1 opacity-80">
                                          <Clock className="w-3 h-3" />
                                          {flag.timeframe}
                                        </p>
                                      )}
                                    </div>
                                  </li>
                                ))}
                              </ul>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    )}

                    {/* Timing Information */}
                    {recommendedTiming && (
                      <div className={`flex items-center gap-2 text-sm ${config.textColor} mt-2`}>
                        <Clock className="w-4 h-4" />
                        <span className="font-medium">Timing: {recommendedTiming}</span>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex items-center gap-3 mt-4">
                      {overallSeverity === 'emergency' && (
                        <a
                          href="tel:911"
                          className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors"
                        >
                          <Phone className="w-4 h-4" />
                          Call 911
                        </a>
                      )}
                      {specialty && (
                        <button className={`inline-flex items-center gap-2 px-4 py-2 ${config.bgColor} ${config.textColor} border ${config.borderColor} rounded-lg font-medium hover:opacity-80 transition-opacity`}>
                          Find {specialty} specialist
                          <ExternalLink className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Dismiss Button */}
                  {dismissible && (
                    <button
                      onClick={handleDismiss}
                      className={`p-1 ${config.iconColor} hover:bg-white/50 rounded-lg transition-colors`}
                      title="Dismiss alert"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Confirm Dismiss Modal for Emergency */}
          <AnimatePresence>
            {showConfirmDismiss && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-red-900/90 backdrop-blur-sm rounded-xl flex items-center justify-center p-4"
              >
                <div className="bg-white rounded-lg p-6 max-w-sm text-center">
                  <Shield className="w-12 h-12 text-red-600 mx-auto mb-3" />
                  <h4 className="text-lg font-bold text-gray-900 mb-2">
                    Are you sure?
                  </h4>
                  <p className="text-gray-600 mb-4">
                    This is an emergency warning. Dismissing it could delay critical medical care.
                  </p>
                  <div className="flex gap-3 justify-center">
                    <button
                      onClick={() => setShowConfirmDismiss(false)}
                      className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg font-medium hover:bg-gray-300"
                    >
                      Keep visible
                    </button>
                    <button
                      onClick={confirmDismiss}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700"
                    >
                      Dismiss anyway
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
};