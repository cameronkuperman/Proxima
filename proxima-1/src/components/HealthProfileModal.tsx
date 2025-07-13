'use client';

import { X, Eye, EyeOff, Plus, Minus, User, Building, Activity, AlertTriangle, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getUserProfile, completeOnboarding, OnboardingData, MedicationEntry, FamilyHistoryEntry } from '@/utils/onboarding';
import { supabase } from '@/lib/supabase';
import { DropdownSelect } from '@/components/onboarding/DropdownSelect';

interface HealthProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave?: () => void;
  missingLifestyle?: boolean;
  missingEmergency?: boolean;
}

interface Tab {
  id: string;
  label: string;
  icon: React.ReactNode;
  showAlert?: boolean;
}

export default function HealthProfileModal({ isOpen, onClose, onSave, missingLifestyle, missingEmergency }: HealthProfileModalProps) {
  const { user } = useAuth();
  const [userProfile, setUserProfile] = useState<OnboardingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Calculate missing flags dynamically based on current userProfile state
  const calculateMissingFlags = () => {
    if (!userProfile) return { missingLifestyle: true, missingEmergency: true };

    // Lifestyle fields
    const lifestyleFields = [
      userProfile.lifestyle_smoking_status,
      userProfile.lifestyle_alcohol_consumption,
      userProfile.lifestyle_exercise_frequency,
      userProfile.lifestyle_sleep_hours,
      userProfile.lifestyle_stress_level,
      userProfile.lifestyle_diet_type
    ];
    const currentMissingLifestyle = lifestyleFields.some(field => !field || field.trim() === '');

    // Emergency contact fields (email is optional)
    const emergencyFields = [
      userProfile.emergency_contact_name,
      userProfile.emergency_contact_relation,
      userProfile.emergency_contact_phone
    ];
    const currentMissingEmergency = emergencyFields.some(field => !field || field.trim() === '');

    return { 
      missingLifestyle: currentMissingLifestyle, 
      missingEmergency: currentMissingEmergency 
    };
  };

  const { missingLifestyle: currentMissingLifestyle, missingEmergency: currentMissingEmergency } = calculateMissingFlags();
  
  // Name field (separate from medical profile)
  const [userName, setUserName] = useState<string>('');
  
  // Temporary input states for adding new items
  const [medicationInput, setMedicationInput] = useState<MedicationEntry>({
    name: '',
    dosage: '',
    frequency: ''
  });
  const [familyHistoryInput, setFamilyHistoryInput] = useState<FamilyHistoryEntry>({
    relation: '',
    condition: '',
    age: ''
  });
  const [allergyInput, setAllergyInput] = useState('');

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!user || !isOpen) return;
      
      try {
        setLoading(true);
        const profile = await getUserProfile(user.id, user.email || '', user.user_metadata?.name || '');
        setUserProfile(profile);
        
        // Set the name from user auth data
        setUserName(user.user_metadata?.name || user.user_metadata?.full_name || user.email?.split('@')[0] || '');
      } catch (error) {
        console.error('Error fetching user profile:', error);
        setError('Failed to load profile data');
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [user, isOpen]);

  const handleSave = async () => {
    if (!user || !userProfile) return;
    
    setSaving(true);
    setError(null);
    setSuccess(null);

    // Only validate lifestyle if user has started filling it
    const hasAnyLifestyleData = [
      userProfile.lifestyle_smoking_status,
      userProfile.lifestyle_alcohol_consumption,
      userProfile.lifestyle_exercise_frequency,
      userProfile.lifestyle_sleep_hours,
      userProfile.lifestyle_stress_level,
      userProfile.lifestyle_diet_type
    ].some(field => field && field.trim() !== '');
    
    if (hasAnyLifestyleData && currentMissingLifestyle) {
      setError('Please complete all lifestyle fields or clear them all.');
      setSaving(false);
      return;
    }

    try {
      // Update name in auth metadata if changed
      const currentName = user.user_metadata?.name || user.user_metadata?.full_name || '';
      if (userName !== currentName && userName.trim()) {
        const { error: nameError } = await supabase.auth.updateUser({
          data: { name: userName.trim() }
        });
        
        if (nameError) {
          console.error('Error updating name:', nameError);
          setError('Failed to update name');
          return;
        }
      }
      
      // Update medical profile
      const result = await completeOnboarding(user.id, userProfile);
      
      if (result.success) {
        setSuccess('Profile updated successfully!');
        // Call the onSave callback to refresh parent data
        onSave?.();
        setTimeout(() => {
          setSuccess(null);
        }, 3000);
      } else {
        setError(result.error || 'Failed to save profile');
      }
    } catch (error) {
      setError('An unexpected error occurred');
      console.error('Error saving profile:', error);
    } finally {
      setSaving(false);
    }
  };

  const addMedication = () => {
    if (medicationInput.name.trim() && userProfile) {
      setUserProfile({
        ...userProfile,
        medications: [...(userProfile.medications || []), medicationInput]
      });
      setMedicationInput({ name: '', dosage: '', frequency: '' });
    }
  };

  const removeMedication = (index: number) => {
    if (userProfile) {
      setUserProfile({
        ...userProfile,
        medications: userProfile.medications?.filter((_, i) => i !== index) || []
      });
    }
  };

  const addFamilyHistory = () => {
    if (familyHistoryInput.relation.trim() && familyHistoryInput.condition.trim() && userProfile) {
      setUserProfile({
        ...userProfile,
        family_history: [...(userProfile.family_history || []), familyHistoryInput]
      });
      setFamilyHistoryInput({ relation: '', condition: '', age: '' });
    }
  };

  const removeFamilyHistory = (index: number) => {
    if (userProfile) {
      setUserProfile({
        ...userProfile,
        family_history: userProfile.family_history?.filter((_, i) => i !== index) || []
      });
    }
  };

  const addAllergy = () => {
    if (allergyInput.trim() && userProfile) {
      setUserProfile({
        ...userProfile,
        allergies: [...(userProfile.allergies || []), allergyInput.trim()]
      });
      setAllergyInput('');
    }
  };

  const removeAllergy = (index: number) => {
    if (userProfile) {
      setUserProfile({
        ...userProfile,
        allergies: userProfile.allergies?.filter((_, i) => i !== index) || []
      });
    }
  };

  const tabs: Tab[] = [
    { id: 'basic', label: 'Basic Info', icon: <User className="w-4 h-4" /> },
    { id: 'health', label: 'Health Profile', icon: <Building className="w-4 h-4" /> },
    { 
      id: 'lifestyle', 
      label: 'Lifestyle', 
      icon: <Activity className="w-4 h-4" />,
      showAlert: currentMissingLifestyle
    },
    { 
      id: 'emergency', 
      label: 'Emergency', 
      icon: <AlertTriangle className="w-4 h-4" />,
      showAlert: currentMissingEmergency
    },
  ];

  if (!isOpen) return null;

  return (
    <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
          className="bg-[#0a0a0a] border border-white/[0.1] rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-6 border-b border-white/[0.05]">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-white">Configure Health Profile</h2>
                  <p className="text-gray-400 text-sm mt-1">Your data is encrypted and never shared</p>
                </div>
                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Tabs */}
          <div className="flex border-b border-white/[0.05] relative">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                className={`flex-1 px-4 py-3 text-sm font-medium transition-all duration-300 ease-in-out relative ${
                    activeTab === tab.id
                      ? 'text-white'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <span className="flex items-center justify-center gap-2">
                    <span>{tab.icon}</span>
                    {tab.label}
                    {tab.showAlert && <AlertCircle className="w-3 h-3 text-red-400 ml-1" />}
                  </span>
                </button>
              ))}
            <motion.div
              className="absolute bottom-0 h-[2px] bg-gradient-to-r from-purple-500 to-pink-500"
              initial={false}
              animate={{
                left: `${tabs.findIndex(tab => tab.id === activeTab) * (100 / tabs.length)}%`,
                width: `${100 / tabs.length}%`
              }}
              transition={{ 
                type: "spring", 
                stiffness: 500, 
                damping: 30,
                duration: 0.3
              }}
            />
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto max-h-[60vh]">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
              </div>
            ) : (
              <>
                {error && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg"
                  >
                    <p className="text-sm text-red-300">{error}</p>
                  </motion.div>
                )}
                
                {success && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-6 p-4 bg-green-500/10 border border-green-500/20 rounded-lg"
                  >
                    <p className="text-sm text-green-300">{success}</p>
                  </motion.div>
                )}

                <AnimatePresence mode="wait">
                <motion.div
                    key={activeTab}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2, ease: "easeInOut" }}
                  >
                    {activeTab === 'basic' && (
                      <BasicInfoTab 
                        userProfile={userProfile} 
                        setUserProfile={setUserProfile}
                        userName={userName}
                        setUserName={setUserName}
                      />
                    )}
                    
                    {activeTab === 'health' && (
                      <HealthProfileTab
                        userProfile={userProfile}
                        setUserProfile={setUserProfile}
                        medicationInput={medicationInput}
                        setMedicationInput={setMedicationInput}
                        familyHistoryInput={familyHistoryInput}
                        setFamilyHistoryInput={setFamilyHistoryInput}
                        allergyInput={allergyInput}
                        setAllergyInput={setAllergyInput}
                        addMedication={addMedication}
                        removeMedication={removeMedication}
                        addFamilyHistory={addFamilyHistory}
                        removeFamilyHistory={removeFamilyHistory}
                        addAllergy={addAllergy}
                        removeAllergy={removeAllergy}
                      />
                    )}
                    
                    {activeTab === 'lifestyle' && (
                      <LifestyleTab userProfile={userProfile} setUserProfile={setUserProfile} missing={currentMissingLifestyle} />
                    )}
                    
                    {activeTab === 'emergency' && (
                      <EmergencyTab userProfile={userProfile} setUserProfile={setUserProfile} missing={currentMissingEmergency} />
                    )}
                  </motion.div>
                </AnimatePresence>
              </>
            )}
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-white/[0.05] flex justify-between items-center">
            <p className="text-xs text-gray-500">
              <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              Your data is encrypted and HIPAA compliant
            </p>
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="px-6 py-2 text-gray-400 hover:text-white transition-colors"
                >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:shadow-lg hover:shadow-purple-500/25 transition-all disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Profile'}
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// Custom Dropdown Component (same as onboarding)
const CustomDropdown = ({ 
  value, 
  onChange, 
  options, 
  placeholder,
  className = "" 
}: {
  value: string;
  onChange: (value: string) => void;
  options: string[];
  placeholder: string;
  className?: string;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownDirection, setDropdownDirection] = useState<'down' | 'up'>('down');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (isOpen && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      const spaceBelow = windowHeight - rect.bottom;
      const spaceAbove = rect.top;
      
      // Check if we're near the bottom of the modal or viewport
      if (spaceBelow < 240 && spaceAbove > 240) {
        setDropdownDirection('up');
      } else {
        setDropdownDirection('down');
      }
    }
  }, [isOpen]);

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-white/[0.03] border border-white/[0.05] rounded-lg px-4 py-3 text-white focus:outline-none focus:border-purple-500 transition-colors text-left flex items-center justify-between"
      >
        <span className={value ? 'text-white' : 'text-gray-500'}>
          {value || placeholder}
        </span>
        <motion.div
          animate={{ rotate: isOpen ? (dropdownDirection === 'up' ? 0 : 180) : (dropdownDirection === 'up' ? 180 : 0) }}
          transition={{ duration: 0.2 }}
        >
          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </motion.div>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ 
              opacity: 0, 
              y: dropdownDirection === 'up' ? 10 : -10, 
              scale: 0.95 
            }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ 
              opacity: 0, 
              y: dropdownDirection === 'up' ? 10 : -10, 
              scale: 0.95 
            }}
            transition={{ duration: 0.2 }}
            className={`fixed z-[99999] bg-white/[0.03] border border-white/[0.05] rounded-lg shadow-2xl max-h-60 overflow-auto backdrop-blur-md ${
              dropdownDirection === 'up' 
                ? 'mb-1' 
                : 'mt-1'
            }`}
            style={{ 
              left: triggerRef.current?.getBoundingClientRect().left || 0,
              width: triggerRef.current?.getBoundingClientRect().width || 200,
              ...(dropdownDirection === 'up' 
                ? { bottom: window.innerHeight - (triggerRef.current?.getBoundingClientRect().top || 0) }
                : { top: (triggerRef.current?.getBoundingClientRect().bottom || 0) }
              ),
              zIndex: 99999
            }}
          >
            <div className="p-1">
              {options.map((option, index) => (
                <motion.button
                  key={option}
                  type="button"
                  onClick={() => {
                    onChange(option);
                    setIsOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all hover:bg-white/[0.05] focus:outline-none focus:bg-white/[0.05] ${
                    value === option ? 'bg-white/[0.05] text-white' : 'text-gray-300 hover:text-white'
                  }`}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  {option}
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Basic Info Tab Component
function BasicInfoTab({ 
  userProfile, 
  setUserProfile, 
  userName, 
  setUserName 
}: {
  userProfile: OnboardingData | null;
  setUserProfile: (profile: OnboardingData) => void;
  userName: string;
  setUserName: (name: string) => void;
}) {
  if (!userProfile) return null;

  const raceOptions = [
    'American Indian or Alaska Native',
    'Asian',
    'Black or African American',
    'Hispanic or Latino',
    'Native Hawaiian or Other Pacific Islander',
    'White',
    'Other',
    'Prefer not to say'
  ];

  const genderOptions = [
    { label: 'Male', value: true },
    { label: 'Female', value: false },
    { label: 'Other', value: null }
  ];

  return (
    <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-400 mb-2">Full Name</label>
                      <input
                        type="text"
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
                        className="w-full bg-white/[0.03] border border-white/[0.05] rounded-lg px-4 py-3 text-white focus:outline-none focus:border-purple-500 transition-colors"
            placeholder="Enter your full name"
                      />
                    </div>
                    
                    <div>
          <label className="block text-sm font-medium text-gray-400 mb-2">Age</label>
                      <input
            type="number"
            value={userProfile.age}
            onChange={(e) => setUserProfile({ ...userProfile, age: e.target.value })}
                        className="w-full bg-white/[0.03] border border-white/[0.05] rounded-lg px-4 py-3 text-white focus:outline-none focus:border-purple-500 transition-colors"
            placeholder="Enter your age"
            min="1"
            max="120"
          />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">Height (cm)</label>
                      <input
                        type="number"
            value={userProfile.height}
            onChange={(e) => setUserProfile({ ...userProfile, height: e.target.value })}
                        className="w-full bg-white/[0.03] border border-white/[0.05] rounded-lg px-4 py-3 text-white focus:outline-none focus:border-purple-500 transition-colors"
                        placeholder="175"
            min="50"
            max="300"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">Weight (kg)</label>
                      <input
                        type="number"
            value={userProfile.weight}
            onChange={(e) => setUserProfile({ ...userProfile, weight: e.target.value })}
                        className="w-full bg-white/[0.03] border border-white/[0.05] rounded-lg px-4 py-3 text-white focus:outline-none focus:border-purple-500 transition-colors"
                        placeholder="70"
            min="10"
            max="500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-400 mb-2">Race/Ethnicity</label>
          <CustomDropdown
            value={userProfile.race || ''}
            onChange={(value) => setUserProfile({ ...userProfile, race: value })}
            options={raceOptions}
            placeholder="Select race/ethnicity"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-400 mb-2">Gender</label>
          <CustomDropdown
            value={userProfile.is_male === true ? 'Male' : userProfile.is_male === false ? 'Female' : userProfile.is_male === null ? 'Other' : ''}
            onChange={(value) => {
              const genderValue = value === 'Male' ? true : value === 'Female' ? false : null;
              setUserProfile({ ...userProfile, is_male: genderValue });
            }}
            options={genderOptions.map(g => g.label)}
            placeholder="Select gender"
                      />
                    </div>
                  </div>
    </div>
  );
}

// Health Profile Tab Component
function HealthProfileTab({
  userProfile,
  setUserProfile,
  medicationInput,
  setMedicationInput,
  familyHistoryInput,
  setFamilyHistoryInput,
  allergyInput,
  setAllergyInput,
  addMedication,
  removeMedication,
  addFamilyHistory,
  removeFamilyHistory,
  addAllergy,
  removeAllergy
}: {
  userProfile: OnboardingData | null;
  setUserProfile: (profile: OnboardingData) => void;
  medicationInput: MedicationEntry;
  setMedicationInput: (input: MedicationEntry) => void;
  familyHistoryInput: FamilyHistoryEntry;
  setFamilyHistoryInput: (input: FamilyHistoryEntry) => void;
  allergyInput: string;
  setAllergyInput: (input: string) => void;
  addMedication: () => void;
  removeMedication: (index: number) => void;
  addFamilyHistory: () => void;
  removeFamilyHistory: (index: number) => void;
  addAllergy: () => void;
  removeAllergy: (index: number) => void;
}) {
  if (!userProfile) return null;

  return (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-8"
                >
      {/* Personal Health Context */}
      <div>
        <label className="block text-sm font-medium text-gray-400 mb-2">
          Personal Health Context <span className="text-red-400">*</span>
        </label>
        <textarea
          value={userProfile.personal_health_context}
          onChange={(e) => setUserProfile({ ...userProfile, personal_health_context: e.target.value })}
          className="w-full bg-white/[0.03] border border-white/[0.05] rounded-lg px-4 py-3 text-white focus:outline-none focus:border-purple-500 transition-colors resize-none"
          placeholder="Describe your health status, symptoms, conditions, or concerns..."
          rows={4}
        />
      </div>

      {/* Current Medications */}
                  <div>
        <label className="block text-sm font-medium text-gray-400 mb-4">Current Medications</label>
        
        {/* Add Medication Form */}
        <div className="mb-4 p-4 border border-white/[0.05] rounded-lg bg-white/[0.02]">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
            <input
              type="text"
              value={medicationInput.name}
              onChange={(e) => setMedicationInput({ ...medicationInput, name: e.target.value })}
              className="bg-white/[0.03] border border-white/[0.05] rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500 transition-colors"
              placeholder="Medication name"
            />
            <input
              type="text"
              value={medicationInput.dosage}
              onChange={(e) => setMedicationInput({ ...medicationInput, dosage: e.target.value })}
              className="bg-white/[0.03] border border-white/[0.05] rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500 transition-colors"
              placeholder="Dosage"
            />
            <input
              type="text"
              value={medicationInput.frequency}
              onChange={(e) => setMedicationInput({ ...medicationInput, frequency: e.target.value })}
              className="bg-white/[0.03] border border-white/[0.05] rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500 transition-colors"
              placeholder="Frequency"
            />
          </div>
          <button
            onClick={addMedication}
            className="w-full px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:shadow-lg hover:shadow-purple-500/25 transition-all font-medium"
          >
            <span className="flex items-center justify-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Add Medication
            </span>
          </button>
        </div>

        {/* Medications List */}
                    <div className="space-y-2">
          {userProfile.medications?.map((medication, index) => (
            <motion.div 
              key={index} 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center justify-between p-3 bg-white/[0.02] rounded-lg"
            >
              <div>
                <p className="text-white font-medium">{medication.name}</p>
                <p className="text-gray-400 text-sm">{medication.dosage} - {medication.frequency}</p>
                          </div>
                          <button
                onClick={() => removeMedication(index)}
                            className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-all"
                          >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
            </motion.div>
          ))}
        </div>
                        </div>

      {/* Family History */}
      <div>
        <label className="block text-sm font-medium text-gray-400 mb-4">Family Medical History</label>
        
        {/* Add Family History Form */}
        <div className="mb-4 p-4 border border-white/[0.05] rounded-lg bg-white/[0.02]">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
            <input
              type="text"
              value={familyHistoryInput.relation}
              onChange={(e) => setFamilyHistoryInput({ ...familyHistoryInput, relation: e.target.value })}
              className="bg-white/[0.03] border border-white/[0.05] rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500 transition-colors"
              placeholder="Relation (e.g., Mother, Father)"
            />
            <input
              type="text"
              value={familyHistoryInput.condition}
              onChange={(e) => setFamilyHistoryInput({ ...familyHistoryInput, condition: e.target.value })}
              className="bg-white/[0.03] border border-white/[0.05] rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500 transition-colors"
              placeholder="Condition"
            />
                        <input
                          type="text"
              value={familyHistoryInput.age}
              onChange={(e) => setFamilyHistoryInput({ ...familyHistoryInput, age: e.target.value })}
              className="bg-white/[0.03] border border-white/[0.05] rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500 transition-colors"
              placeholder="Age when diagnosed (optional)"
                        />
          </div>
                        <button
            onClick={addFamilyHistory}
            className="w-full px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:shadow-lg hover:shadow-purple-500/25 transition-all font-medium"
                        >
            <span className="flex items-center justify-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Add Family History
            </span>
                        </button>
                  </div>

        {/* Family History List */}
        <div className="space-y-2">
          {userProfile.family_history?.map((history, index) => (
            <motion.div 
              key={index} 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center justify-between p-3 bg-white/[0.02] rounded-lg"
            >
                  <div>
                <p className="text-white font-medium">{history.relation}</p>
                <p className="text-gray-400 text-sm">
                  {history.condition} {history.age && `(Age: ${history.age})`}
                </p>
                          </div>
                          <button
                onClick={() => removeFamilyHistory(index)}
                            className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-all"
                          >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
            </motion.div>
          ))}
        </div>
                        </div>

      {/* Allergies */}
      <div>
        <label className="block text-sm font-medium text-gray-400 mb-4">Known Allergies</label>
        
        {/* Add Allergy Form */}
        <div className="mb-4 p-4 border border-white/[0.05] rounded-lg bg-white/[0.02]">
          <div className="flex gap-3">
                        <input
                          type="text"
              value={allergyInput}
              onChange={(e) => setAllergyInput(e.target.value)}
                          className="flex-1 bg-white/[0.03] border border-white/[0.05] rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500 transition-colors"
              placeholder="e.g., Peanuts, Shellfish, Penicillin"
                        />
                        <button
              onClick={addAllergy}
                          className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:shadow-lg hover:shadow-purple-500/25 transition-all font-medium"
                        >
                          <span className="flex items-center justify-center gap-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                            </svg>
                          Add
                          </span>
                        </button>
                    </div>
                  </div>

        {/* Allergies List */}
        <div className="space-y-2">
          {userProfile.allergies?.map((allergy, index) => (
            <motion.div 
              key={index} 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center justify-between p-3 bg-white/[0.02] rounded-lg"
            >
                  <div>
                <p className="text-white font-medium">{allergy}</p>
                          </div>
                          <button
                onClick={() => removeAllergy(index)}
                className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-all"
                          >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
            </motion.div>
          ))}
                    </div>
                  </div>
                </motion.div>
  );
}

// Lifestyle Tab Component
function LifestyleTab({ userProfile, setUserProfile, missing }: {
  userProfile: OnboardingData | null;
  setUserProfile: (profile: OnboardingData) => void;
  missing: boolean;
}) {
  if (!userProfile) return null;

  const smokingOptions = ['Never', 'Former smoker', 'Current smoker (less than 1 pack/day)', 'Current smoker (1+ pack/day)'];
  const alcoholOptions = ['Never', 'Rarely', 'Weekly', 'Daily', 'Multiple times daily'];
  const exerciseOptions = ['Never', 'Rarely', '1-2 times per week', '3-4 times per week', '5+ times per week'];
  const sleepOptions = ['Less than 5 hours', '5-6 hours', '7-8 hours', '9+ hours'];
  const stressOptions = ['Low', 'Moderate', 'High', 'Very High'];
  const dietOptions = ['Standard', 'Vegetarian', 'Vegan', 'Keto', 'Mediterranean', 'Other'];

  // Check if any lifestyle field has data
  const lifestyleFields = [
    userProfile.lifestyle_smoking_status,
    userProfile.lifestyle_alcohol_consumption,
    userProfile.lifestyle_exercise_frequency,
    userProfile.lifestyle_sleep_hours,
    userProfile.lifestyle_stress_level,
    userProfile.lifestyle_diet_type
  ];
  const hasAnyLifestyleData = lifestyleFields.some(field => field && field.trim() !== '');
  const hasAllLifestyleData = lifestyleFields.every(field => field && field.trim() !== '');

  return (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
      {hasAnyLifestyleData && !hasAllLifestyleData && (
        <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
          <div className="flex items-center justify-between">
            <p className="text-sm text-yellow-300">
              <AlertCircle className="w-4 h-4 inline mr-2" />
              Please complete all lifestyle fields or clear them all.
            </p>
            <button
              onClick={() => setUserProfile({
                ...userProfile,
                lifestyle_smoking_status: '',
                lifestyle_alcohol_consumption: '',
                lifestyle_exercise_frequency: '',
                lifestyle_sleep_hours: '',
                lifestyle_stress_level: '',
                lifestyle_diet_type: ''
              })}
              className="px-3 py-1 text-xs bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-300 rounded transition-colors"
            >
              Clear All
            </button>
          </div>
        </div>
      )}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
          <label className="block text-sm font-medium text-gray-400 mb-2">
            Smoking Status
          </label>
          <CustomDropdown
            value={userProfile.lifestyle_smoking_status || ''}
            onChange={(value) => setUserProfile({ ...userProfile, lifestyle_smoking_status: value })}
            options={smokingOptions}
            placeholder="Select smoking status"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-2">
            Alcohol Consumption
          </label>
          <CustomDropdown
            value={userProfile.lifestyle_alcohol_consumption || ''}
            onChange={(value) => setUserProfile({ ...userProfile, lifestyle_alcohol_consumption: value })}
            options={alcoholOptions}
            placeholder="Select alcohol consumption"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-2">
            Exercise Frequency
          </label>
          <CustomDropdown
            value={userProfile.lifestyle_exercise_frequency || ''}
            onChange={(value) => setUserProfile({ ...userProfile, lifestyle_exercise_frequency: value })}
            options={exerciseOptions}
            placeholder="Select exercise frequency"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-400 mb-2">
            Sleep Hours
          </label>
          <CustomDropdown
            value={userProfile.lifestyle_sleep_hours || ''}
            onChange={(value) => setUserProfile({ ...userProfile, lifestyle_sleep_hours: value })}
            options={sleepOptions}
            placeholder="Select sleep hours"
          />
                    </div>
                    
                    <div>
          <label className="block text-sm font-medium text-gray-400 mb-2">
            Stress Level
          </label>
          <CustomDropdown
            value={userProfile.lifestyle_stress_level || ''}
            onChange={(value) => setUserProfile({ ...userProfile, lifestyle_stress_level: value })}
            options={stressOptions}
            placeholder="Select stress level"
          />
                    </div>
                    
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-2">
            Diet Type
          </label>
          <CustomDropdown
            value={userProfile.lifestyle_diet_type || ''}
            onChange={(value) => setUserProfile({ ...userProfile, lifestyle_diet_type: value })}
            options={dietOptions}
            placeholder="Select diet type"
          />
                    </div>
                  </div>
                </motion.div>
  );
}

// Emergency Tab Component
function EmergencyTab({ userProfile, setUserProfile, missing }: {
  userProfile: OnboardingData | null;
  setUserProfile: (profile: OnboardingData) => void;
  missing: boolean;
}) {
  if (!userProfile) return null;

  // Check if any emergency contact field has data (email is optional)
  const emergencyFields = [
    userProfile.emergency_contact_name,
    userProfile.emergency_contact_relation,
    userProfile.emergency_contact_phone
  ];
  const hasAnyEmergencyData = emergencyFields.some(field => field && field.trim() !== '');
  const hasAllEmergencyData = emergencyFields.every(field => field && field.trim() !== '');

  return (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
      {hasAnyEmergencyData && !hasAllEmergencyData && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
          <div className="flex items-center justify-between">
            <p className="text-sm text-red-300">
              <AlertCircle className="w-4 h-4 inline mr-2" />
              Please complete the required emergency contact fields (name, relationship, phone) or clear them all.
            </p>
            <button
              onClick={() => setUserProfile({
                ...userProfile,
                emergency_contact_name: '',
                emergency_contact_relation: '',
                emergency_contact_phone: '',
                emergency_contact_email: ''
              })}
              className="px-3 py-1 text-xs bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded transition-colors"
            >
              Clear All
            </button>
          </div>
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">
                      Emergency Contact Name
                      {hasAnyEmergencyData && <span className="text-red-400 ml-1">*</span>}
                    </label>
                    <input
                      type="text"
            value={userProfile.emergency_contact_name || ''}
            onChange={(e) => setUserProfile({ ...userProfile, emergency_contact_name: e.target.value })}
                      className={`w-full bg-white/[0.03] border rounded-lg px-4 py-3 text-white focus:outline-none transition-colors ${
                        hasAnyEmergencyData && !userProfile.emergency_contact_name?.trim() 
                          ? 'border-red-500/50 focus:border-red-500' 
                          : 'border-white/[0.05] focus:border-purple-500'
                      }`}
                      placeholder="Jane Doe"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">
                      Relationship
                      {hasAnyEmergencyData && <span className="text-red-400 ml-1">*</span>}
                    </label>
                    <input
                      type="text"
            value={userProfile.emergency_contact_relation || ''}
            onChange={(e) => setUserProfile({ ...userProfile, emergency_contact_relation: e.target.value })}
                      className={`w-full bg-white/[0.03] border rounded-lg px-4 py-3 text-white focus:outline-none transition-colors ${
                        hasAnyEmergencyData && !userProfile.emergency_contact_relation?.trim() 
                          ? 'border-red-500/50 focus:border-red-500' 
                          : 'border-white/[0.05] focus:border-purple-500'
                      }`}
                      placeholder="Spouse, Parent, Sibling, etc."
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">
                      Phone Number
                      {hasAnyEmergencyData && <span className="text-red-400 ml-1">*</span>}
                    </label>
                    <input
                      type="tel"
            value={userProfile.emergency_contact_phone || ''}
            onChange={(e) => setUserProfile({ ...userProfile, emergency_contact_phone: e.target.value })}
                      className={`w-full bg-white/[0.03] border rounded-lg px-4 py-3 text-white focus:outline-none transition-colors ${
                        hasAnyEmergencyData && !userProfile.emergency_contact_phone?.trim() 
                          ? 'border-red-500/50 focus:border-red-500' 
                          : 'border-white/[0.05] focus:border-purple-500'
                      }`}
                      placeholder="+1 (555) 123-4567"
                    />
            </div>

        <div>
          <label className="block text-sm font-medium text-gray-400 mb-2">
            Email <span className="text-gray-500 text-xs">(optional)</span>
          </label>
          <input
            type="email"
            value={userProfile.emergency_contact_email || ''}
            onChange={(e) => setUserProfile({ ...userProfile, emergency_contact_email: e.target.value })}
            className="w-full bg-white/[0.03] border border-white/[0.05] rounded-lg px-4 py-3 text-white focus:outline-none focus:border-purple-500 transition-colors"
            placeholder="jane.doe@example.com"
          />
              </div>
            </div>
          </motion.div>
  );
}