'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Calendar, Mail, MessageSquare, X, ChevronDown } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { ReminderConfig, FollowUpSuggestion } from '@/types/photo-analysis';

interface ReminderOptInProps {
  isOpen: boolean;
  onClose: () => void;
  onConfigure: (config: ReminderConfig) => void;
  analysisId: string;
  sessionId: string;
  suggestion?: FollowUpSuggestion;
  trackableMetrics?: { metric_name: string }[];
}

export default function ReminderOptIn({
  isOpen,
  onClose,
  onConfigure,
  analysisId,
  sessionId,
  suggestion,
  trackableMetrics
}: ReminderOptInProps) {
  const { user } = useAuth();
  const [reminderMethod, setReminderMethod] = useState<'email' | 'sms' | 'in_app'>('in_app');
  const [intervalDays, setIntervalDays] = useState(suggestion?.suggested_interval_days || 30);
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [showIntervalDropdown, setShowIntervalDropdown] = useState(false);

  const intervalOptions = [
    { value: 7, label: 'Weekly' },
    { value: 14, label: 'Every 2 weeks' },
    { value: 30, label: 'Monthly' },
    { value: 60, label: 'Every 2 months' },
    { value: 90, label: 'Quarterly' },
    { value: 0, label: 'Custom' }
  ];

  useEffect(() => {
    // Pre-fill email if available from user profile
    if (user?.email) {
      setEmail(user.email);
    }
  }, [user]);

  const handleConfigure = () => {
    const config: ReminderConfig = {
      session_id: sessionId,
      analysis_id: analysisId,
      enabled: true,
      interval_days: intervalDays,
      reminder_method: reminderMethod,
      reminder_text: `Time to update on your condition`,
      ai_reasoning: suggestion?.reasoning
    };

    if (reminderMethod === 'email' && email) {
      config.contact_info = { email };
    } else if (reminderMethod === 'sms' && phone) {
      config.contact_info = { phone };
    }

    onConfigure(config);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 100 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 100 }}
        className="fixed bottom-0 left-0 right-0 z-50 p-4"
      >
        <div className="max-w-2xl mx-auto">
          <motion.div
            className="backdrop-blur-[20px] bg-gray-900/90 border border-white/[0.1] rounded-2xl overflow-hidden shadow-2xl"
            layoutId="reminder-optin"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-orange-500/20 to-red-500/20 p-6 border-b border-white/[0.05]">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-orange-500/20 flex items-center justify-center">
                    <Bell className="w-6 h-6 text-orange-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">Track Your Progress</h3>
                    {suggestion && (
                      <p className="text-sm text-gray-400 mt-1">{suggestion.reasoning}</p>
                    )}
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-white/[0.05] rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6">
              {/* Trackable metrics */}
              {trackableMetrics && trackableMetrics.length > 0 && (
                <div className="mb-6 p-4 rounded-lg bg-white/[0.03] border border-white/[0.05]">
                  <p className="text-sm text-gray-400 mb-2">We can track:</p>
                  <div className="flex flex-wrap gap-2">
                    {trackableMetrics.map((metric, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 rounded-full bg-orange-500/20 text-orange-400 text-sm"
                      >
                        {metric.metric_name}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Interval selection */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-300 mb-3">
                  How often would you like reminders?
                </label>
                <div className="relative">
                  <button
                    onClick={() => setShowIntervalDropdown(!showIntervalDropdown)}
                    className="w-full px-4 py-3 rounded-lg bg-white/[0.03] text-white border border-white/[0.05] hover:border-orange-500/50 transition-all flex items-center justify-between"
                  >
                    <span className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      {intervalOptions.find(opt => opt.value === intervalDays)?.label || `Every ${intervalDays} days`}
                    </span>
                    <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${showIntervalDropdown ? 'rotate-180' : ''}`} />
                  </button>

                  <AnimatePresence>
                    {showIntervalDropdown && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute top-full left-0 right-0 mt-2 bg-gray-900 border border-white/[0.1] rounded-lg overflow-hidden z-10"
                      >
                        {intervalOptions.map((option) => (
                          <button
                            key={option.value}
                            onClick={() => {
                              if (option.value > 0) {
                                setIntervalDays(option.value);
                                setShowIntervalDropdown(false);
                              }
                            }}
                            className="w-full px-4 py-3 text-left hover:bg-white/[0.05] transition-colors text-sm text-gray-300 hover:text-white"
                          >
                            {option.label}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* Notification method */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-300 mb-3">
                  How should we remind you?
                </label>
                <div className="grid grid-cols-3 gap-3">
                  <button
                    onClick={() => setReminderMethod('in_app')}
                    className={`p-3 rounded-lg border transition-all ${
                      reminderMethod === 'in_app'
                        ? 'bg-orange-500/20 border-orange-500 text-orange-400'
                        : 'bg-white/[0.03] border-white/[0.05] text-gray-400 hover:border-white/[0.1]'
                    }`}
                  >
                    <Bell className="w-5 h-5 mx-auto mb-1" />
                    <span className="text-xs">In-App</span>
                  </button>
                  <button
                    onClick={() => setReminderMethod('email')}
                    className={`p-3 rounded-lg border transition-all ${
                      reminderMethod === 'email'
                        ? 'bg-orange-500/20 border-orange-500 text-orange-400'
                        : 'bg-white/[0.03] border-white/[0.05] text-gray-400 hover:border-white/[0.1]'
                    }`}
                  >
                    <Mail className="w-5 h-5 mx-auto mb-1" />
                    <span className="text-xs">Email</span>
                  </button>
                  <button
                    onClick={() => setReminderMethod('sms')}
                    className={`p-3 rounded-lg border transition-all ${
                      reminderMethod === 'sms'
                        ? 'bg-orange-500/20 border-orange-500 text-orange-400'
                        : 'bg-white/[0.03] border-white/[0.05] text-gray-400 hover:border-white/[0.1]'
                    }`}
                  >
                    <MessageSquare className="w-5 h-5 mx-auto mb-1" />
                    <span className="text-xs">SMS</span>
                  </button>
                </div>

                {/* Contact info inputs */}
                <AnimatePresence mode="wait">
                  {reminderMethod === 'email' && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-3"
                    >
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="your@email.com"
                        className="w-full px-4 py-2 rounded-lg bg-white/[0.03] text-white border border-white/[0.05] focus:border-orange-500 focus:outline-none text-sm"
                      />
                    </motion.div>
                  )}
                  {reminderMethod === 'sms' && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-3"
                    >
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+1 (555) 000-0000"
                        className="w-full px-4 py-2 rounded-lg bg-white/[0.03] text-white border border-white/[0.05] focus:border-orange-500 focus:outline-none text-sm"
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="flex-1 px-6 py-3 rounded-lg bg-white/[0.03] text-gray-400 hover:text-white border border-white/[0.05] hover:border-white/[0.1] transition-all"
                >
                  Not Now
                </button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleConfigure}
                  disabled={
                    (reminderMethod === 'email' && !email) ||
                    (reminderMethod === 'sms' && !phone)
                  }
                  className="flex-1 px-6 py-3 rounded-lg bg-gradient-to-r from-orange-500 to-red-500 text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  Enable Reminders
                </motion.button>
              </div>

              {/* Next reminder preview */}
              <div className="mt-4 text-center">
                <p className="text-xs text-gray-500">
                  Next reminder: {new Date(Date.now() + intervalDays * 24 * 60 * 60 * 1000).toLocaleDateString()}
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}