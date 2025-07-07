'use client';

import { motion } from 'framer-motion';
import { useState } from 'react';

interface SettingItem {
  label: string;
  description: string;
  type: 'toggle' | 'button';
  enabled?: boolean;
  action?: () => void;
  danger?: boolean;
}

export default function AccountSettings() {
  const [settings, setSettings] = useState<SettingItem[]>([
    {
      label: 'Email Notifications',
      description: 'Receive health insights and reminders via email',
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
    },
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
  ]);

  const toggleSetting = (index: number) => {
    const newSettings = [...settings];
    if (newSettings[index].type === 'toggle') {
      newSettings[index].enabled = !newSettings[index].enabled;
      setSettings(newSettings);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="backdrop-blur-[20px] bg-white/[0.03] border border-white/[0.05] rounded-xl p-6"
    >
      <h3 className="text-lg font-semibold text-white mb-6">Account Settings</h3>

      <div className="space-y-4">
        {settings.map((setting, index) => (
          <motion.div
            key={setting.label}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 + index * 0.05 }}
            className="flex items-center justify-between py-3 border-b border-white/[0.05] last:border-0"
          >
            <div className="flex-1 pr-4">
              <p className={`text-sm font-medium ${setting.danger ? 'text-red-400' : 'text-white'}`}>
                {setting.label}
              </p>
              <p className="text-xs text-gray-400 mt-1">{setting.description}</p>
            </div>

            {setting.type === 'toggle' ? (
              <button
                onClick={() => toggleSetting(index)}
                className={`relative w-12 h-6 rounded-full transition-colors ${
                  setting.enabled ? 'bg-purple-600' : 'bg-white/[0.1]'
                }`}
              >
                <motion.div
                  animate={{
                    x: setting.enabled ? 24 : 2
                  }}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-lg"
                />
              </button>
            ) : (
              <button
                onClick={setting.action}
                className={`px-4 py-1.5 text-sm rounded-lg transition-all ${
                  setting.danger
                    ? 'text-red-400 hover:bg-red-500/10 border border-red-500/20 hover:border-red-500/30'
                    : 'text-gray-400 hover:text-white border border-white/[0.08] hover:border-white/[0.15]'
                }`}
              >
                {setting.label === 'Export Your Data' ? 'Export' : 'Delete'}
              </button>
            )}
          </motion.div>
        ))}
      </div>

      {/* Legal Links */}
      <div className="mt-8 pt-6 border-t border-white/[0.05]">
        <div className="flex flex-wrap gap-6 text-xs text-gray-500">
          <a href="#" className="hover:text-gray-300 transition-colors">Privacy Policy</a>
          <a href="#" className="hover:text-gray-300 transition-colors">Terms of Service</a>
          <a href="#" className="hover:text-gray-300 transition-colors">HIPAA Compliance</a>
          <a href="#" className="hover:text-gray-300 transition-colors">Contact Support</a>
        </div>
      </div>
    </motion.div>
  );
}