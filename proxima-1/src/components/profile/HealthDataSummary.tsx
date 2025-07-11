'use client';

import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getUserProfile, OnboardingData } from '@/utils/onboarding';
import { Building, Pill, AlertTriangle, Users, Lock, X } from 'lucide-react';

interface HealthDataItem {
  label: string;
  count: number;
  icon: React.ReactNode;
  lastUpdated: string;
  onClick: () => void;
}

interface HealthDataSummaryProps {
  onConfigureClick?: () => void;
  refreshTrigger?: number;
}

export default function HealthDataSummary({ onConfigureClick, refreshTrigger }: HealthDataSummaryProps) {
  const { user } = useAuth();
  const [userProfile, setUserProfile] = useState<OnboardingData | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUserProfile = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const profile = await getUserProfile(user.id, user.email || '', user.user_metadata?.name || '');

      setUserProfile(profile);
    } catch (error) {
      console.error('Error fetching user profile:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserProfile();
  }, [user, refreshTrigger]);

  const healthData: HealthDataItem[] = [
    {
      label: 'Personal Health Context',
      count: userProfile?.personal_health_context ? 1 : 0,
      icon: <Building className="w-5 h-5 text-blue-400" />,
      lastUpdated: '2 days ago',
      onClick: () => setSelectedCategory('personal_health_context')
    },
    {
      label: 'Current Medications',
      count: userProfile?.medications?.length || 0,
      icon: <Pill className="w-5 h-5 text-orange-400" />,
      lastUpdated: '1 week ago',
      onClick: () => setSelectedCategory('medications')
    },
    {
      label: 'Allergies',
      count: userProfile?.allergies?.length || 0,
      icon: <AlertTriangle className="w-5 h-5 text-yellow-400" />,
      lastUpdated: '1 month ago',
      onClick: () => setSelectedCategory('allergies')
    },
    {
      label: 'Family History',
      count: userProfile?.family_history?.length || 0,
      icon: <Users className="w-5 h-5 text-purple-400" />,
      lastUpdated: '2 weeks ago',
      onClick: () => setSelectedCategory('family_history')
    }
  ];

  const renderCategoryDetails = () => {
    if (!selectedCategory || !userProfile) return null;

    const categoryData = {
      personal_health_context: {
        title: 'Personal Health Context',
        content: (
          <div className="space-y-4">
            <div className="p-4 bg-blue-500/5 border border-blue-500/10 rounded-lg">
              <h4 className="text-sm font-medium text-blue-300 mb-2">AI Summary</h4>
              <p className="text-sm text-gray-400 italic">
                AI analysis coming soon - this will provide insights based on your health context
              </p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-white mb-2">Your Input</h4>
              <p className="text-sm text-gray-300 bg-white/[0.02] p-3 rounded-lg">
                {userProfile.personal_health_context || 'No health context provided'}
              </p>
            </div>
          </div>
        )
      },
      medications: {
        title: 'Current Medications',
        content: (
          <div className="space-y-3">
            {userProfile.medications && userProfile.medications.length > 0 ? (
              userProfile.medications.map((med, index) => (
                  <div key={index} className="p-3 bg-white/[0.02] rounded-lg">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm font-medium text-white">{med.name || 'Unnamed medication'}</p>
                        <p className="text-xs text-gray-400">
                          {med.dosage || 'No dosage'} - {med.frequency || 'No frequency'}
                        </p>
                      </div>
                                          </div>
                    </div>
                  ))
            ) : (
              <p className="text-sm text-gray-400">No medications recorded</p>
            )}
          </div>
        )
      },
      allergies: {
        title: 'Allergies',
        content: (
          <div className="space-y-3">
            {userProfile.allergies && userProfile.allergies.length > 0 ? (
              userProfile.allergies.map((allergy, index) => (
                <div key={index} className="p-3 bg-white/[0.02] rounded-lg">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-medium text-white">{allergy}</p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-400">No allergies recorded</p>
            )}
          </div>
        )
      },
      family_history: {
        title: 'Family History',
        content: (
          <div className="space-y-3">
            {userProfile.family_history && userProfile.family_history.length > 0 ? (
              userProfile.family_history.map((history, index) => (
                <div key={index} className="p-3 bg-white/[0.02] rounded-lg">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-medium text-white">{history.relation}</p>
                      <p className="text-xs text-gray-400">
                        {history.condition} {history.age ? `(Age: ${history.age})` : ''}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-400">No family history recorded</p>
            )}
          </div>
        )
      }
    };

    const category = categoryData[selectedCategory as keyof typeof categoryData];
    if (!category) return null;

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="mt-6 p-4 bg-white/[0.02] border border-white/[0.05] rounded-lg"
      >
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-lg font-medium text-white">{category.title}</h4>
          <button
            onClick={() => setSelectedCategory(null)}
            className="text-gray-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        {category.content}
      </motion.div>
    );
  };

  if (loading) {
    return (
      <div className="backdrop-blur-[20px] bg-white/[0.03] border border-white/[0.05] rounded-xl p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-white/[0.05] rounded mb-4"></div>
          <div className="grid grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-24 bg-white/[0.02] rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="backdrop-blur-[20px] bg-white/[0.03] border border-white/[0.05] rounded-xl p-6"
    >
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-white">Configured Health Data</h3>
          <p className="text-sm text-gray-400 mt-1">
            This data helps our AI provide more accurate insights
          </p>
        </div>
        <button
          onClick={onConfigureClick}
          className="px-4 py-2 text-sm text-white bg-white/[0.05] hover:bg-white/[0.08] border border-white/[0.08] hover:border-white/[0.15] rounded-lg transition-all"
        >
          Configure Health Data
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {healthData.map((item, index) => (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 + index * 0.05 }}
            className="bg-white/[0.02] border border-white/[0.05] rounded-lg p-4 hover:bg-white/[0.03] hover:border-white/[0.08] transition-all cursor-pointer"
            onClick={item.onClick}
          >
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  {item.icon}
                  <p className="text-sm text-gray-400">{item.label}</p>
                </div>
                <p className="text-2xl font-semibold text-white">{item.count}</p>
                <p className="text-xs text-gray-500 mt-1">Updated {item.lastUpdated}</p>
              </div>
              <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </motion.div>
        ))}
      </div>

      {renderCategoryDetails()}

      {/* Privacy Notice */}
      <div className="mt-6 p-4 bg-purple-500/5 border border-purple-500/10 rounded-lg">
        <div className="flex gap-3">
          <Lock className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-purple-300 font-medium">Your data is secure</p>
            <p className="text-xs text-gray-400 mt-1">
              All health information is encrypted and HIPAA compliant. We never share your data.
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}