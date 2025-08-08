'use client';

import { motion } from 'framer-motion';
import { useState } from 'react';
import Link from 'next/link';
import { Bell, Mail, MessageSquare, Calendar } from 'lucide-react';

interface SettingItem {
  label: string;
  description: string;
  type: 'toggle' | 'button' | 'input' | 'select';
  enabled?: boolean;
  value?: string;
  options?: { value: string; label: string }[];
  action?: () => void;
  danger?: boolean;
  icon?: React.ReactNode;
  placeholder?: string;
}

interface SettingSection {
  title: string;
  description?: string;
  items: SettingItem[];
}

export default function AccountSettings() {
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [reminderInterval, setReminderInterval] = useState('30');
  
  const [settingSections, setSettingSections] = useState<SettingSection[]>([
    {
      title: 'Photo Analysis Reminders',
      description: 'Configure how you receive follow-up reminders for photo tracking',
      items: [
        {
          label: 'Email Reminders',
          description: 'Get reminder emails for photo follow-ups',
          type: 'toggle',
          enabled: true,
          icon: <Mail className="w-4 h-4" />
        },
        {
          label: 'Email Address',
          description: 'Email for photo analysis reminders',
          type: 'input',
          value: email,
          placeholder: 'your@email.com',
          icon: <Mail className="w-4 h-4" />
        },
        {
          label: 'SMS Reminders',
          description: 'Get text message reminders for photo follow-ups',
          type: 'toggle',
          enabled: false,
          icon: <MessageSquare className="w-4 h-4" />
        },
        {
          label: 'Phone Number',
          description: 'Phone number for SMS reminders',
          type: 'input',
          value: phone,
          placeholder: '+1 (555) 000-0000',
          icon: <MessageSquare className="w-4 h-4" />
        },
        {
          label: 'In-App Reminders',
          description: 'See reminders in your dashboard',
          type: 'toggle',
          enabled: true,
          icon: <Bell className="w-4 h-4" />
        },
        {
          label: 'Default Reminder Interval',
          description: 'How often to remind you by default',
          type: 'select',
          value: reminderInterval,
          options: [
            { value: '7', label: 'Weekly' },
            { value: '14', label: 'Bi-weekly' },
            { value: '30', label: 'Monthly' },
            { value: '60', label: 'Every 2 months' },
            { value: '90', label: 'Quarterly' }
          ],
          icon: <Calendar className="w-4 h-4" />
        }
      ]
    },
    {
      title: 'General Notifications',
      items: [
        {
          label: 'Health Insights',
          description: 'Receive AI-generated health insights via email',
          type: 'toggle',
          enabled: true
        },
        {
          label: 'Weekly Health Summary',
          description: 'Get a weekly digest of your health patterns',
          type: 'toggle',
          enabled: true
        },
        {
          label: 'Data Sharing for Research',
          description: 'Anonymously contribute to health research',
          type: 'toggle',
          enabled: false
        }
      ]
    },
    {
      title: 'Data & Privacy',
      items: [
        {
          label: 'Export Your Data',
          description: 'Download all your health data in JSON format',
          type: 'button',
          action: () => console.log('Exporting data...')
        },
        {
          label: 'Delete Account',
          description: 'Permanently delete your account and all data',
          type: 'button',
          danger: true,
          action: () => console.log('Delete account...')
        }
      ]
    }
  ]);

  const toggleSetting = (sectionIndex: number, itemIndex: number) => {
    const newSections = [...settingSections];
    const item = newSections[sectionIndex].items[itemIndex];
    if (item.type === 'toggle') {
      item.enabled = !item.enabled;
      setSettingSections(newSections);
    }
  };

  const updateValue = (sectionIndex: number, itemIndex: number, value: string) => {
    const newSections = [...settingSections];
    newSections[sectionIndex].items[itemIndex].value = value;
    setSettingSections(newSections);
    
    // Update local state for specific fields
    const item = newSections[sectionIndex].items[itemIndex];
    if (item.label === 'Email Address') setEmail(value);
    if (item.label === 'Phone Number') setPhone(value);
    if (item.label === 'Default Reminder Interval') setReminderInterval(value);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="backdrop-blur-[20px] bg-white/[0.03] border border-white/[0.05] rounded-xl p-6"
    >
      <h3 className="text-lg font-semibold text-white mb-6">Account Settings</h3>

      <div className="space-y-8">
        {settingSections.map((section, sectionIndex) => (
          <motion.div
            key={section.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 + sectionIndex * 0.1 }}
          >
            <h4 className="text-md font-medium text-white mb-2">{section.title}</h4>
            {section.description && (
              <p className="text-xs text-gray-400 mb-4">{section.description}</p>
            )}
            
            <div className="space-y-3">
              {section.items.map((item, itemIndex) => (
                <motion.div
                  key={item.label}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 + itemIndex * 0.05 }}
                  className="flex items-center justify-between py-3 border-b border-white/[0.05] last:border-0"
                >
                  <div className="flex-1 pr-4">
                    <div className="flex items-center gap-2">
                      {item.icon && (
                        <span className="text-gray-400">{item.icon}</span>
                      )}
                      <p className={`text-sm font-medium ${item.danger ? 'text-red-400' : 'text-white'}`}>
                        {item.label}
                      </p>
                    </div>
                    <p className="text-xs text-gray-400 mt-1 ml-6">{item.description}</p>
                  </div>

                  {item.type === 'toggle' ? (
                    <button
                      onClick={() => toggleSetting(sectionIndex, itemIndex)}
                      className={`relative w-12 h-6 rounded-full transition-colors ${
                        item.enabled ? 'bg-purple-600' : 'bg-white/[0.1]'
                      }`}
                    >
                      <motion.div
                        animate={{
                          x: item.enabled ? 24 : 2
                        }}
                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                        className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-lg"
                      />
                    </button>
                  ) : item.type === 'input' ? (
                    <input
                      type="text"
                      value={item.value || ''}
                      onChange={(e) => updateValue(sectionIndex, itemIndex, e.target.value)}
                      placeholder={item.placeholder}
                      className="w-48 px-3 py-1.5 rounded-lg bg-white/[0.03] text-white text-sm border border-white/[0.05] focus:border-purple-500 focus:outline-none"
                      disabled={sectionIndex === 0 && (
                        (itemIndex === 1 && !section.items[0].enabled) ||
                        (itemIndex === 3 && !section.items[2].enabled)
                      )}
                    />
                  ) : item.type === 'select' ? (
                    <select
                      value={item.value || ''}
                      onChange={(e) => updateValue(sectionIndex, itemIndex, e.target.value)}
                      className="w-48 px-3 py-1.5 rounded-lg bg-white/[0.03] text-white text-sm border border-white/[0.05] focus:border-purple-500 focus:outline-none appearance-none cursor-pointer"
                    >
                      {item.options?.map(option => (
                        <option key={option.value} value={option.value} className="bg-gray-900">
                          {option.label}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <button
                      onClick={item.action}
                      className={`px-4 py-1.5 text-sm rounded-lg transition-all ${
                        item.danger
                          ? 'text-red-400 hover:bg-red-500/10 border border-red-500/20 hover:border-red-500/30'
                          : 'text-gray-400 hover:text-white border border-white/[0.08] hover:border-white/[0.15]'
                      }`}
                    >
                      {item.label === 'Export Your Data' ? 'Export' : 'Delete'}
                    </button>
                  )}
                </motion.div>
              ))}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Legal Links */}
      <div className="mt-8 pt-6 border-t border-white/[0.05]">
        <div className="flex flex-wrap gap-6 text-xs text-gray-500">
          <Link href="/privacy" className="hover:text-gray-300 transition-colors">Privacy Policy</Link>
          <a href="#" className="hover:text-gray-300 transition-colors">Terms of Service</a>
          <a href="#" className="hover:text-gray-300 transition-colors">Security & Compliance</a>
          <a href="#" className="hover:text-gray-300 transition-colors">Contact Support</a>
        </div>
      </div>
    </motion.div>
  );
}