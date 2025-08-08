'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { completeOnboarding, validateOnboardingData, OnboardingData, convertHeightToMetric, convertWeightToMetric, MedicationEntry, FamilyHistoryEntry } from '@/utils/onboarding';
import { useOnboarding } from '@/contexts/OnboardingContext';

interface OnboardingFlowProps {
  onComplete?: () => void;
}

const steps = [
  {
    id: 'basic',
    title: 'Basic Information',
    description: 'Tell us a bit about yourself',
    fields: ['age', 'height', 'weight', 'race', 'is_male']
  },
  {
    id: 'health',
    title: 'Health Profile',
    description: 'Help us understand your health better',
    fields: ['medications', 'personal_health_context', 'family_history', 'allergies']
  },
  {
    id: 'legal',
    title: 'Legal Agreements',
    description: 'Review and accept our terms',
    fields: ['tos_agreed', 'privacy_agreed']
  }
];

export default function OnboardingFlow({ onComplete }: OnboardingFlowProps) {
  const router = useRouter();
  const { user } = useAuth();
  const { markOnboardingComplete } = useOnboarding();
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Form data
  const [formData, setFormData] = useState<Partial<OnboardingData>>({
    age: '',
    height: '',
    weight: '',
    race: null,
    is_male: null,
    medications: [],
    personal_health_context: '',
    family_history: [],
    allergies: [],
    tos_agreed: false,
    privacy_agreed: false,
    tos_agreed_at: '',
    privacy_agreed_at: ''
  });



  // Measurement system and input states
  const [measurementSystem, setMeasurementSystem] = useState<'metric' | 'imperial'>('metric');
  const [imperialHeight, setImperialHeight] = useState({ feet: '', inches: '' });
  const [imperialWeight, setImperialWeight] = useState('');

  // Temporary input states for structured data
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

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleSubmit();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    if (!user) {
      setError('User not authenticated');
      return;
    }

    // Check if personal health context is filled (required field)
    if (!formData.personal_health_context?.trim()) {
      setError('Personal Health Context is required. Please describe your health status.');
      // Scroll to the personal health context field
      setTimeout(() => {
        const element = document.querySelector('textarea[placeholder*="Describe your health status"]');
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          (element as HTMLElement).focus();
        }
      }, 100);
      setIsLoading(false);
      return;
    }

    // Check if legal agreements are accepted (required)
    if (!formData.tos_agreed || !formData.privacy_agreed) {
      setError('You must agree to the Terms of Service and Privacy Policy to continue.');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    // Validate data
    const validation = validateOnboardingData(formData);
    if (!validation.valid) {
      setError(validation.errors[0]);
      setIsLoading(false);
      return;
    }

    try {
      // Convert measurements to metric if needed
      let finalHeight = formData.height;
      let finalWeight = formData.weight;
      
      if (measurementSystem === 'imperial') {
        // Convert imperial to metric
        if (imperialHeight.feet && imperialHeight.inches) {
          finalHeight = convertHeightToMetric(
            parseInt(imperialHeight.feet), 
            parseInt(imperialHeight.inches)
          ).toString();
        }
        if (imperialWeight) {
          finalWeight = convertWeightToMetric(parseFloat(imperialWeight)).toString();
        }
      }

      // Prepare data for database
      const dataToSubmit = {
        ...formData,
        height: finalHeight,
        weight: finalWeight,
        medications: formData.medications || [],
        family_history: formData.family_history || [],
        allergies: formData.allergies || []
      } as OnboardingData;
      
      const result = await completeOnboarding(user.id, dataToSubmit);
      
      if (result.success) {
        // Mark onboarding as complete immediately without DB call
        console.log('OnboardingFlow: Completed successfully, updating cache...');
        markOnboardingComplete(); // Update cache directly - no buffering!
        
        // Call onComplete callback if provided
        if (onComplete) {
          console.log('OnboardingFlow: Calling onComplete callback');
          onComplete();
        }
        
        // Ensure redirect with tutorial parameter
        console.log('OnboardingFlow: Redirecting to dashboard with showTutorial=true');
        const dashboardUrl = '/dashboard?showTutorial=true';
        
        // Use window.location for more reliable redirect with query params
        console.log('OnboardingFlow: Using window.location.href for redirect');
        window.location.href = dashboardUrl;
      } else {
        setError(result.error || 'Failed to complete onboarding');
      }
    } catch (err) {
      setError('An unexpected error occurred');
      console.error('Onboarding error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const addMedication = () => {
    if (medicationInput.name.trim()) {
      setFormData((prev: Partial<OnboardingData>) => ({
        ...prev,
        medications: [...(prev.medications || []), medicationInput]
      }));
      setMedicationInput({ name: '', dosage: '', frequency: '' });
    }
  };

  const removeMedication = (index: number) => {
    setFormData((prev: Partial<OnboardingData>) => ({
      ...prev,
      medications: prev.medications?.filter((_: MedicationEntry, i: number) => i !== index) || []
    }));
  };

  const addFamilyHistory = () => {
    if (familyHistoryInput.relation.trim() && familyHistoryInput.condition.trim()) {
      setFormData((prev: Partial<OnboardingData>) => ({
        ...prev,
        family_history: [...(prev.family_history || []), familyHistoryInput]
      }));
      setFamilyHistoryInput({ relation: '', condition: '', age: '' });
    }
  };

  const removeFamilyHistory = (index: number) => {
    setFormData((prev: Partial<OnboardingData>) => ({
      ...prev,
      family_history: prev.family_history?.filter((_: FamilyHistoryEntry, i: number) => i !== index) || []
    }));
  };

  const addAllergy = () => {
    if (allergyInput.trim()) {
      setFormData((prev: Partial<OnboardingData>) => ({
        ...prev,
        allergies: [...(prev.allergies || []), allergyInput.trim()]
      }));
      setAllergyInput('');
    }
  };

  const removeAllergy = (index: number) => {
    setFormData((prev: Partial<OnboardingData>) => ({
      ...prev,
      allergies: prev.allergies?.filter((_: string, i: number) => i !== index) || []
    }));
  };

  const isCurrentStepValid = () => {
    const currentFields = steps[currentStep].fields;
    return currentFields.every(field => {
      const value = formData[field as keyof OnboardingData];
      
      // Special handling for height and weight based on measurement system
      if (field === 'height' && measurementSystem === 'imperial') {
        return imperialHeight.feet !== '' && imperialHeight.inches !== '';
      }
      if (field === 'weight' && measurementSystem === 'imperial') {
        return imperialWeight !== '';
      }
      
      // Array fields can be empty
      if (field === 'medications' || field === 'family_history' || field === 'allergies') {
        return Array.isArray(value); // Arrays can be empty
      }
      
      // Personal health context is required and must not be empty/whitespace
      if (field === 'personal_health_context') {
        return value !== undefined && value !== null && typeof value === 'string' && value.trim() !== '';
      }
      
      // Race and gender are optional fields
      if (field === 'race' || field === 'is_male') {
        return true; // Always valid since these are optional
      }
      
      // Legal agreement fields
      if (field === 'tos_agreed' || field === 'privacy_agreed') {
        return value === true;
      }
      
      return value !== undefined && value !== null && value !== '';
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a] relative overflow-hidden py-8">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Gradient orbs */}
        <motion.div 
          className="absolute top-0 right-0 w-[800px] h-[800px] rounded-full bg-gradient-radial from-purple-500/10 via-purple-500/5 to-transparent blur-3xl"
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.5, 0.8, 0.5],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div 
          className="absolute bottom-0 left-0 w-[600px] h-[600px] rounded-full bg-gradient-radial from-blue-500/10 via-blue-500/5 to-transparent blur-3xl"
          animate={{
            scale: [1, 1.15, 1],
            opacity: [0.5, 0.7, 0.5],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1
          }}
        />
        
        {/* Subtle grid */}
        <div 
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: 'linear-gradient(to right, #ffffff 1px, transparent 1px), linear-gradient(to bottom, #ffffff 1px, transparent 1px)',
            backgroundSize: '50px 50px'
          }}
        />
      </div>

      {/* Onboarding Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative w-full max-w-[800px] mx-4"
      >
        <motion.div 
          className="backdrop-blur-[20px] bg-white/[0.03] border border-white/[0.05] rounded-xl p-6 relative"
          layout
        >
          {/* Loading Overlay */}
          {isLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center rounded-2xl"
            >
              <div className="text-center">
                <div className="w-12 h-12 border-3 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-4" />
                <p className="text-white text-sm">Setting up your profile...</p>
              </div>
            </motion.div>
          )}

          {/* Progress Bar */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-3">
              <span className="text-sm text-gray-400">Step {currentStep + 1} of {steps.length}</span>
              <span className="text-sm text-gray-400">{Math.round(((currentStep + 1) / steps.length) * 100)}%</span>
            </div>
            <div className="w-full bg-white/[0.05] rounded-full h-2">
              <motion.div
                className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
                transition={{ duration: 0.5, ease: "easeInOut" }}
              />
            </div>
          </div>

          {/* Header */}
          <div className="text-center mb-6">
            <h1 className="text-2xl font-semibold text-white mb-2">
              {steps[currentStep].title}
            </h1>
            <p className="text-gray-400 text-sm">
              {steps[currentStep].description}
            </p>
            {currentStep === 1 && (
              <div className="mt-3 p-2 backdrop-blur-[20px] bg-purple-500/[0.05] border border-purple-500/[0.2] rounded-xl">
                <p className="text-purple-300 text-xs">
                  <span className="text-red-400">*</span> Personal Health Context is required. All other fields are optional.
                </p>
              </div>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-6 p-4 backdrop-blur-[20px] bg-red-500/[0.05] border border-red-500/[0.2] rounded-xl"
            >
              <p className="text-red-400 text-sm text-center">{error}</p>
            </motion.div>
          )}

          {/* Form Content */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-4"
            >
              {currentStep === 0 && (
                <BasicInfoStep
                  formData={formData}
                  setFormData={setFormData}
                  measurementSystem={measurementSystem}
                  setMeasurementSystem={setMeasurementSystem}
                  imperialHeight={imperialHeight}
                  setImperialHeight={setImperialHeight}
                  imperialWeight={imperialWeight}
                  setImperialWeight={setImperialWeight}
                />
              )}
              
              {currentStep === 1 && (
                <HealthProfileStep
                  formData={formData}
                  setFormData={setFormData}
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
              
              {currentStep === 2 && (
                <LegalAgreementStep
                  formData={formData}
                  setFormData={setFormData}
                />
              )}
            </motion.div>
          </AnimatePresence>

          {/* Navigation */}
          <div className="flex justify-between mt-6">
            <motion.button
              onClick={handleBack}
              disabled={currentStep === 0}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="px-5 py-2.5 backdrop-blur-[20px] bg-white/[0.03] border border-white/[0.05] rounded-xl text-gray-400 hover:text-white hover:border-white/[0.1] transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              Back
            </motion.button>
            
            <motion.button
              onClick={handleNext}
              disabled={!isCurrentStepValid() || isLoading}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-medium transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/25 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              {currentStep === steps.length - 1 ? 'Complete Setup' : 'Next'}
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}

// Basic Info Step Component
function BasicInfoStep({ 
  formData, 
  setFormData, 
  measurementSystem, 
  setMeasurementSystem, 
  imperialHeight, 
  setImperialHeight, 
  imperialWeight, 
  setImperialWeight
}: {
  formData: Partial<OnboardingData>;
  setFormData: React.Dispatch<React.SetStateAction<Partial<OnboardingData>>>;
  measurementSystem: 'metric' | 'imperial';
  setMeasurementSystem: React.Dispatch<React.SetStateAction<'metric' | 'imperial'>>;
  imperialHeight: { feet: string; inches: string };
  setImperialHeight: React.Dispatch<React.SetStateAction<{ feet: string; inches: string }>>;
  imperialWeight: string;
  setImperialWeight: React.Dispatch<React.SetStateAction<string>>;
}) {
  // Input handlers
  const handleAgeChange = (value: string) => {
    if (value === '' || /^\d+$/.test(value)) {
      setFormData((prev: Partial<OnboardingData>) => ({ ...prev, age: value }));
    }
  };

  const handleMetricHeightChange = (value: string) => {
    if (value === '' || /^\d+$/.test(value)) {
      setFormData((prev: Partial<OnboardingData>) => ({ ...prev, height: value }));
    }
  };

  const handleImperialHeightChange = (field: 'feet' | 'inches', value: string) => {
    if (value === '' || /^\d+$/.test(value)) {
      const newHeight = { ...imperialHeight, [field]: value };
      setImperialHeight(newHeight);
    }
  };

  const handleWeightChange = (value: string) => {
    if (value === '' || /^\d+$/.test(value)) {
      if (measurementSystem === 'metric') {
        setFormData((prev: Partial<OnboardingData>) => ({ ...prev, weight: value }));
      } else {
        setImperialWeight(value);
      }
    }
  };

  const raceOptions = [
    'American Indian or Alaska Native',
    'Asian',
    'Black or African American',
    'Native Hawaiian or Other Pacific Islander',
    'White',
    'Hispanic or Latino',
    'Middle Eastern or North African',
    'Multiracial',
    'Prefer not to say'
  ];

  const genderOptions = [
    { label: 'Male', value: true },
    { label: 'Female', value: false },
    { label: 'Other', value: null }
  ];

  // Custom Dropdown Component
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
        
        // If there's not enough space below (assuming dropdown needs ~200px), show above
        if (spaceBelow < 200 && spaceAbove > 200) {
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
            className="w-full backdrop-blur-[20px] bg-white/[0.03] border border-white/[0.05] rounded-xl p-2.5 hover:border-white/[0.1] transition-all text-left flex items-center justify-between focus:outline-none focus:border-white/[0.2]"
          >
            <span className={`text-sm ${value ? 'text-white' : 'text-gray-500'}`}>
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
              <>
                {/* Blur overlay for content below dropdown */}
                <div 
                  className="fixed inset-x-0 z-[9997]"
                  style={{
                    top: triggerRef.current ? `${triggerRef.current.getBoundingClientRect().bottom + 10}px` : '0',
                    bottom: '0',
                    backdropFilter: 'blur(8px)',
                    WebkitBackdropFilter: 'blur(8px)',
                    pointerEvents: 'none',
                    maskImage: 'linear-gradient(to bottom, black 0%, transparent 100%)',
                    WebkitMaskImage: 'linear-gradient(to bottom, black 0%, transparent 100%)'
                  }}
                />
                
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
                  className={`absolute left-0 right-0 z-[9999] backdrop-blur-sm bg-black/[0.95] border border-white/[0.15] rounded-xl shadow-2xl max-h-60 overflow-y-auto scrollbar-hide ${
                    dropdownDirection === 'up' 
                      ? 'bottom-full mb-1' 
                      : 'top-full mt-1'
                  }`}
                >
                  <div className="p-1">
                    {options.map((option, index) => (
                      <button
                        key={option}
                        type="button"
                        onClick={() => {
                          onChange(option);
                          setIsOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all hover:bg-white/[0.1] focus:outline-none focus:bg-white/[0.1] ${
                          value === option ? 'bg-white/[0.1] text-white' : 'text-gray-300 hover:text-white'
                        }`}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      );
  };

  // Custom Gender Dropdown Component
  const GenderDropdown = ({ 
    value, 
    onChange, 
    placeholder,
    className = ""
  }: {
    value: boolean | null;
    onChange: (value: boolean | null) => void;
    placeholder: string;
    className?: string;
  }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [hasSelectedValue, setHasSelectedValue] = useState(false);
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
        
        // If there's not enough space below (assuming dropdown needs ~200px), show above
        if (spaceBelow < 200 && spaceAbove > 200) {
          setDropdownDirection('up');
        } else {
          setDropdownDirection('down');
        }
      }
    }, [isOpen]);

    const getDisplayValue = () => {
      if (value === true) return 'Male';
      if (value === false) return 'Female';
      if (value === null && hasSelectedValue) return 'Other';
      return '';
    };

          return (
        <div className={`relative ${className}`} ref={dropdownRef}>
          <button
            ref={triggerRef}
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="w-full backdrop-blur-[20px] bg-white/[0.03] border border-white/[0.05] rounded-xl p-2.5 hover:border-white/[0.1] transition-all text-left flex items-center justify-between focus:outline-none focus:border-white/[0.2]"
          >
            <span className={`text-sm ${getDisplayValue() ? 'text-white' : 'text-gray-500'}`}>
              {getDisplayValue() || placeholder}
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
              <>
                {/* Blur overlay for content below dropdown */}
                <div 
                  className="fixed inset-x-0 z-[9997]"
                  style={{
                    top: triggerRef.current ? `${triggerRef.current.getBoundingClientRect().bottom + 10}px` : '0',
                    bottom: '0',
                    backdropFilter: 'blur(8px)',
                    WebkitBackdropFilter: 'blur(8px)',
                    pointerEvents: 'none',
                    maskImage: 'linear-gradient(to bottom, black 0%, transparent 100%)',
                    WebkitMaskImage: 'linear-gradient(to bottom, black 0%, transparent 100%)'
                  }}
                />
                
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
                  className={`absolute left-0 right-0 z-[9999] backdrop-blur-sm bg-black/[0.95] border border-white/[0.15] rounded-xl shadow-2xl max-h-60 overflow-y-auto scrollbar-hide ${
                    dropdownDirection === 'up' 
                      ? 'bottom-full mb-1' 
                      : 'top-full mt-1'
                  }`}
                >
                  <div className="p-1">
                    {genderOptions.map((option, index) => (
                      <button
                        key={option.label}
                        type="button"
                        onClick={() => {
                          onChange(option.value);
                          setHasSelectedValue(true);
                          setIsOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all hover:bg-white/[0.1] focus:outline-none focus:bg-white/[0.1] ${
                          value === option.value ? 'bg-white/[0.1] text-white' : 'text-gray-300 hover:text-white'
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      );
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Age */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="space-y-2"
      >
        <label className="block text-white text-sm font-medium">Age</label>
        <CustomDropdown
          value={formData.age || ''}
          onChange={(value) => setFormData((prev: Partial<OnboardingData>) => ({ ...prev, age: value }))}
          options={Array.from({ length: 93 }, (_, i) => (i + 18).toString())}
          placeholder="Select your age"
        />
      </motion.div>

      {/* Measurement System Toggle */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="space-y-2"
      >
        <label className="block text-white text-sm font-medium">System</label>
        <div className="backdrop-blur-[20px] bg-white/[0.03] border border-white/[0.05] rounded-xl p-1">
          <div className="flex">
            <button
              type="button"
              onClick={() => setMeasurementSystem('metric')}
              className={`flex-1 py-1.5 px-3 rounded-lg text-sm font-medium transition-all ${
                measurementSystem === 'metric'
                  ? 'bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-white border border-white/[0.1]'
                  : 'text-gray-400 hover:text-white hover:bg-white/[0.03]'
              }`}
            >
              Metric
            </button>
            <button
              type="button"
              onClick={() => setMeasurementSystem('imperial')}
              className={`flex-1 py-1.5 px-3 rounded-lg text-sm font-medium transition-all ${
                measurementSystem === 'imperial'
                  ? 'bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-white border border-white/[0.1]'
                  : 'text-gray-400 hover:text-white hover:bg-white/[0.03]'
              }`}
            >
              Imperial
            </button>
          </div>
        </div>
      </motion.div>

      {/* Height */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="space-y-2"
      >
        <label className="block text-white text-sm font-medium">
          Height {measurementSystem === 'metric' ? '(cm)' : '(ft/in)'}
        </label>
        <div className="space-y-1">
          {measurementSystem === 'metric' ? (
            <div className="backdrop-blur-[20px] bg-white/[0.03] border border-white/[0.05] rounded-xl p-2.5 hover:border-white/[0.1] transition-all">
              <div className="relative">
                <input
                  type="number"
                  value={formData.height || ''}
                  onChange={(e) => handleMetricHeightChange(e.target.value)}
                  className="w-full bg-transparent text-white placeholder-gray-500 focus:outline-none pr-8 text-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  placeholder="Height in centimeters"
                  min="50"
                  max="300"
                />
                <span className="absolute right-0 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm">cm</span>
              </div>
            </div>
          ) : (
            <div className="flex gap-2">
              <div className="flex-1 backdrop-blur-[20px] bg-white/[0.03] border border-white/[0.05] rounded-xl p-2.5 hover:border-white/[0.1] transition-all">
                <div className="relative">
                  <input
                    type="number"
                    value={imperialHeight.feet}
                    onChange={(e) => handleImperialHeightChange('feet', e.target.value)}
                    className="w-full bg-transparent text-white placeholder-gray-500 focus:outline-none pr-6 text-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    placeholder="Feet"
                    min="1"
                    max="10"
                  />
                  <span className="absolute right-0 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm">ft</span>
                </div>
              </div>
              <div className="flex-1 backdrop-blur-[20px] bg-white/[0.03] border border-white/[0.05] rounded-xl p-2.5 hover:border-white/[0.1] transition-all">
                <div className="relative">
                  <input
                    type="number"
                    value={imperialHeight.inches}
                    onChange={(e) => handleImperialHeightChange('inches', e.target.value)}
                    className="w-full bg-transparent text-white placeholder-gray-500 focus:outline-none pr-6 text-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    placeholder="Inches"
                    min="0"
                    max="11"
                  />
                  <span className="absolute right-0 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm">in</span>
                </div>
              </div>
            </div>
          )}

        </div>
      </motion.div>

      {/* Weight */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="space-y-2"
      >
        <label className="block text-white text-sm font-medium">
          Weight {measurementSystem === 'metric' ? '(kg)' : '(lbs)'}
        </label>
        <div className="space-y-1">
          <div className="backdrop-blur-[20px] bg-white/[0.03] border border-white/[0.05] rounded-xl p-2.5 hover:border-white/[0.1] transition-all">
            <div className="relative">
              <input
                type="number"
                value={measurementSystem === 'metric' ? formData.weight || '' : imperialWeight}
                onChange={(e) => handleWeightChange(e.target.value)}
                className="w-full bg-transparent text-white placeholder-gray-500 focus:outline-none pr-10 text-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                placeholder={measurementSystem === 'metric' ? 'Weight in kilograms' : 'Weight in pounds'}
                min={measurementSystem === 'metric' ? '10' : '22'}
                max={measurementSystem === 'metric' ? '1000' : '2200'}
              />
              <span className="absolute right-0 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm">
                {measurementSystem === 'metric' ? 'kg' : 'lbs'}
              </span>
            </div>
          </div>

        </div>
      </motion.div>

      {/* Race */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="space-y-2"
      >
        <label className="block text-white text-sm font-medium">Race/Ethnicity</label>
        <CustomDropdown
          value={formData.race || ''}
          onChange={(value) => setFormData((prev: Partial<OnboardingData>) => ({ ...prev, race: value || null }))}
          options={raceOptions}
          placeholder="Select race/ethnicity"
        />
      </motion.div>

      {/* Gender */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="space-y-2"
      >
        <label className="block text-white text-sm font-medium">Gender</label>
        <GenderDropdown
          value={formData.is_male ?? null}
          onChange={(value) => setFormData((prev: Partial<OnboardingData>) => ({ ...prev, is_male: value }))}
          placeholder="Select gender"
        />
      </motion.div>
    </div>
  );
}

// Health Profile Step Component
function HealthProfileStep({ 
  formData, 
  setFormData, 
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
  formData: Partial<OnboardingData>;
  setFormData: React.Dispatch<React.SetStateAction<Partial<OnboardingData>>>;
  medicationInput: MedicationEntry;
  setMedicationInput: React.Dispatch<React.SetStateAction<MedicationEntry>>;
  familyHistoryInput: FamilyHistoryEntry;
  setFamilyHistoryInput: React.Dispatch<React.SetStateAction<FamilyHistoryEntry>>;
  allergyInput: string;
  setAllergyInput: React.Dispatch<React.SetStateAction<string>>;
  addMedication: () => void;
  removeMedication: (index: number) => void;
  addFamilyHistory: () => void;
  removeFamilyHistory: (index: number) => void;
  addAllergy: () => void;
  removeAllergy: (index: number) => void;
}) {
  return (
    <div className="space-y-4">
      {/* Medications */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="space-y-2"
      >
        <div>
          <h2 className="text-lg font-semibold text-white">Current Medications</h2>
          <p className="text-gray-400 text-sm">Add any medications you&apos;re currently taking</p>
        </div>
        
        <div className="backdrop-blur-[20px] bg-white/[0.03] border border-white/[0.05] rounded-xl p-3 hover:border-white/[0.1] transition-all">
          <div className="space-y-2">
            <div className="backdrop-blur-[20px] bg-white/[0.03] border border-white/[0.05] rounded-xl p-2.5 hover:border-white/[0.1] transition-all">
              <input
                type="text"
                value={medicationInput.name}
                onChange={(e) => setMedicationInput((prev: MedicationEntry) => ({ ...prev, name: e.target.value }))}
                className="w-full bg-transparent text-white placeholder-gray-500 focus:outline-none text-sm"
                placeholder="Medication name (e.g., Advil, Fentanyl)"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="backdrop-blur-[20px] bg-white/[0.03] border border-white/[0.05] rounded-xl p-2.5 hover:border-white/[0.1] transition-all">
                <input
                  type="text"
                  value={medicationInput.dosage}
                  onChange={(e) => setMedicationInput((prev: MedicationEntry) => ({ ...prev, dosage: e.target.value }))}
                  className="w-full bg-transparent text-white placeholder-gray-500 focus:outline-none text-sm"
                  placeholder="Dosage (e.g., 200mg, 5ml)"
                />
              </div>
              <div className="backdrop-blur-[20px] bg-white/[0.03] border border-white/[0.05] rounded-xl p-2.5 hover:border-white/[0.1] transition-all">
                <input
                  type="text"
                  value={medicationInput.frequency}
                  onChange={(e) => setMedicationInput((prev: MedicationEntry) => ({ ...prev, frequency: e.target.value }))}
                  className="w-full bg-transparent text-white placeholder-gray-500 focus:outline-none text-sm"
                  placeholder="Frequency (e.g., Daily, 2x/week)"
                />
              </div>
            </div>
            <motion.button
              onClick={addMedication}
              disabled={!medicationInput.name.trim()}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full py-1.5 backdrop-blur-[20px] bg-white/[0.03] border border-white/[0.05] rounded-xl text-white font-medium transition-all hover:border-white/[0.1] disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              Add Medication
            </motion.button>
          </div>
        </div>
        
        {formData.medications && formData.medications.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {formData.medications.map((med: MedicationEntry, index: number) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="backdrop-blur-[20px] bg-white/[0.03] border border-white/[0.05] rounded-xl p-2.5 hover:border-white/[0.1] transition-all group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-white text-sm truncate">{med.name}</div>
                    {(med.dosage || med.frequency) && (
                      <div className="text-xs text-gray-400 mt-0.5 truncate">
                        {med.dosage && `${med.dosage}`}
                        {med.dosage && med.frequency && ' • '}
                        {med.frequency && `${med.frequency}`}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => removeMedication(index)}
                    className="w-4 h-4 rounded-full bg-white/[0.05] hover:bg-white/[0.1] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity ml-2 flex-shrink-0"
                  >
                    <svg className="w-2 h-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Personal Health Context */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="space-y-2"
      >
        <div>
          <h2 className="text-lg font-semibold text-white">
            Personal Health Context <span className="text-red-400">*</span>
          </h2>
          <p className="text-gray-400 text-sm">Describe your current health status or concerns</p>
        </div>
        
        <div className="backdrop-blur-[20px] bg-white/[0.03] border border-white/[0.05] rounded-xl p-2.5 hover:border-white/[0.1] transition-all">
          <textarea
            value={formData.personal_health_context || ''}
            onChange={(e) => setFormData((prev: Partial<OnboardingData>) => ({ ...prev, personal_health_context: e.target.value }))}
            className="w-full bg-transparent text-white placeholder-gray-500 focus:outline-none resize-none text-sm"
            placeholder="Describe your health status, symptoms, conditions, or concerns..."
            rows={2}
          />
        </div>
      </motion.div>

      {/* Family History */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="space-y-2"
      >
        <div>
          <h2 className="text-lg font-semibold text-white">Family Medical History</h2>
          <p className="text-gray-400 text-sm">Add family medical conditions</p>
        </div>
        
        <div className="backdrop-blur-[20px] bg-white/[0.03] border border-white/[0.05] rounded-xl p-3 hover:border-white/[0.1] transition-all">
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <div className="backdrop-blur-[20px] bg-white/[0.03] border border-white/[0.05] rounded-xl p-2.5 hover:border-white/[0.1] transition-all">
                <input
                  type="text"
                  value={familyHistoryInput.relation}
                  onChange={(e) => setFamilyHistoryInput((prev: FamilyHistoryEntry) => ({ ...prev, relation: e.target.value }))}
                  className="w-full bg-transparent text-white placeholder-gray-500 focus:outline-none text-sm"
                  placeholder="Relation (e.g., Mother, Father)"
                />
              </div>
              <div className="backdrop-blur-[20px] bg-white/[0.03] border border-white/[0.05] rounded-xl p-2.5 hover:border-white/[0.1] transition-all">
                <input
                  type="text"
                  value={familyHistoryInput.condition}
                  onChange={(e) => setFamilyHistoryInput((prev: FamilyHistoryEntry) => ({ ...prev, condition: e.target.value }))}
                  className="w-full bg-transparent text-white placeholder-gray-500 focus:outline-none text-sm"
                  placeholder="Condition (e.g., Diabetes, Cancer)"
                />
              </div>
            </div>
            <div className="backdrop-blur-[20px] bg-white/[0.03] border border-white/[0.05] rounded-xl p-2.5 hover:border-white/[0.1] transition-all">
              <input
                type="text"
                value={familyHistoryInput.age}
                onChange={(e) => setFamilyHistoryInput((prev: FamilyHistoryEntry) => ({ ...prev, age: e.target.value }))}
                className="w-full bg-transparent text-white placeholder-gray-500 focus:outline-none text-sm"
                placeholder="Age when diagnosed (optional)"
              />
            </div>
            <motion.button
              onClick={addFamilyHistory}
              disabled={!familyHistoryInput.relation.trim() || !familyHistoryInput.condition.trim()}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full py-1.5 backdrop-blur-[20px] bg-white/[0.03] border border-white/[0.05] rounded-xl text-white font-medium transition-all hover:border-white/[0.1] disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              Add Family History
            </motion.button>
          </div>
        </div>
        
        {formData.family_history && formData.family_history.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {formData.family_history.map((entry: FamilyHistoryEntry, index: number) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="backdrop-blur-[20px] bg-white/[0.03] border border-white/[0.05] rounded-xl p-2.5 hover:border-white/[0.1] transition-all group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-white text-sm truncate">{entry.condition}</div>
                    <div className="text-xs text-gray-400 mt-0.5 truncate">
                      {entry.relation}
                      {entry.age && ` (age ${entry.age})`}
                    </div>
                  </div>
                  <button
                    onClick={() => removeFamilyHistory(index)}
                    className="w-4 h-4 rounded-full bg-white/[0.05] hover:bg-white/[0.1] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity ml-2 flex-shrink-0"
                  >
                    <svg className="w-2 h-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Allergies */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="space-y-2"
      >
        <div>
          <h2 className="text-lg font-semibold text-white">Known Allergies</h2>
          <p className="text-gray-400 text-sm">Add allergies or sensitivities</p>
        </div>
        
        <div className="backdrop-blur-[20px] bg-white/[0.03] border border-white/[0.05] rounded-xl p-2.5 hover:border-white/[0.1] transition-all">
          <div className="flex gap-2">
            <div className="flex-1 backdrop-blur-[20px] bg-white/[0.03] border border-white/[0.05] rounded-xl p-2.5 hover:border-white/[0.1] transition-all">
              <input
                type="text"
                value={allergyInput}
                onChange={(e) => setAllergyInput(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addAllergy();
                  }
                }}
                className="w-full bg-transparent text-white placeholder-gray-500 focus:outline-none text-sm"
                placeholder="e.g., Peanuts, Shellfish, Penicillin"
              />
            </div>
            <motion.button
              onClick={addAllergy}
              disabled={!allergyInput.trim()}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="px-3 py-1.5 backdrop-blur-[20px] bg-white/[0.03] border border-white/[0.05] rounded-xl text-white font-medium transition-all hover:border-white/[0.1] disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              Add
            </motion.button>
          </div>
        </div>
        
        {formData.allergies && formData.allergies.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-1.5">
            {formData.allergies.map((allergy: string, index: number) => (
              <motion.span
                key={index}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="inline-flex items-center justify-between backdrop-blur-[20px] bg-white/[0.03] border border-white/[0.05] text-white px-2.5 py-1 rounded-full text-sm group hover:border-white/[0.1] transition-all"
              >
                <span className="truncate flex-1 mr-1">{allergy}</span>
                <button
                  onClick={() => removeAllergy(index)}
                  className="w-3.5 h-3.5 rounded-full bg-white/[0.05] hover:bg-white/[0.1] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                >
                  <svg className="w-1.5 h-1.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </motion.span>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}

// Legal Agreement Step Component
function LegalAgreementStep({ 
  formData, 
  setFormData
}: {
  formData: Partial<OnboardingData>;
  setFormData: React.Dispatch<React.SetStateAction<Partial<OnboardingData>>>;
}) {
  const [privacyScrolledToBottom, setPrivacyScrolledToBottom] = useState(false);
  const [tosScrolledToBottom, setTosScrolledToBottom] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const privacyRef = useRef<HTMLDivElement>(null);
  const tosRef = useRef<HTMLDivElement>(null);

  const handlePrivacyScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const element = e.target as HTMLDivElement;
    const isAtBottom = Math.abs(element.scrollHeight - element.scrollTop - element.clientHeight) < 10;
    setPrivacyScrolledToBottom(isAtBottom);
  };

  const handleTosScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const element = e.target as HTMLDivElement;
    const isAtBottom = Math.abs(element.scrollHeight - element.scrollTop - element.clientHeight) < 10;
    setTosScrolledToBottom(isAtBottom);
  };

  const handleAgreementChange = (checked: boolean) => {
    setAgreedToTerms(checked);
    if (checked) {
      const timestamp = new Date().toISOString();
      setFormData((prev: Partial<OnboardingData>) => ({ 
        ...prev, 
        tos_agreed: true,
        tos_agreed_at: timestamp,
        privacy_agreed: true,
        privacy_agreed_at: timestamp
      }));
    } else {
      setFormData((prev: Partial<OnboardingData>) => ({ 
        ...prev, 
        tos_agreed: false,
        tos_agreed_at: '',
        privacy_agreed: false,
        privacy_agreed_at: ''
      }));
    }
  };

  const canAgree = privacyScrolledToBottom && tosScrolledToBottom;

  return (
    <div className="space-y-4">
      {/* Privacy Policy Section */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="space-y-2"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Privacy Policy Summary</h2>
          <a 
            href="/privacy" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-purple-400 hover:text-purple-300 text-sm underline"
          >
            View Full Policy
          </a>
        </div>
        
        <div 
          ref={privacyRef}
          onScroll={handlePrivacyScroll}
          className="backdrop-blur-[20px] bg-white/[0.03] border border-white/[0.05] rounded-xl p-4 hover:border-white/[0.1] transition-all max-h-48 overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent"
        >
          <div className="text-gray-300 text-sm space-y-3">
            <p>
              We collect and use your personal health information, photos, and account details to provide personalized AI-driven health insights and symptom tracking. Your health data is treated with strict confidentiality and is only shared with trusted AI providers (such as OpenAI, Google, and others) in a way that does not include your name or personally identifying information. These providers process your data solely to generate insights and do not store or use it to train their AI models.
            </p>
            <p>
              We use cookies and similar technologies to maintain your session, measure platform usage, and improve performance, but we do not use tracking or advertising cookies. You have full control over your data — you can access, download, correct, or delete your information and uploaded photos at any time through your account settings.
            </p>
            <p>
              By continuing, you agree to our full Privacy Policy which explains in detail how your data is collected, used, shared, and protected.
            </p>
          </div>
          {!privacyScrolledToBottom && (
            <div className="mt-2 text-center">
              <motion.div
                animate={{ y: [0, 5, 0] }}
                transition={{ repeat: Infinity, duration: 1.5 }}
                className="text-gray-500 text-xs"
              >
                ↓ Scroll to continue ↓
              </motion.div>
            </div>
          )}
        </div>
      </motion.div>

      {/* Terms of Service Section */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="space-y-2"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Terms of Service Summary</h2>
          <a 
            href="/terms" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-purple-400 hover:text-purple-300 text-sm underline"
          >
            View Full Terms
          </a>
        </div>
        
        <div 
          ref={tosRef}
          onScroll={handleTosScroll}
          className="backdrop-blur-[20px] bg-white/[0.03] border border-white/[0.05] rounded-xl p-4 hover:border-white/[0.1] transition-all max-h-48 overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent"
        >
          <div className="text-gray-300 text-sm space-y-3">
            <p>
              Proxima provides AI-powered tools designed to help you better understand your symptoms and health information. However, we do not provide medical advice, diagnosis, or treatment. Our services are for informational purposes only and should never replace consultation with a qualified healthcare professional.
            </p>
            <p>
              You must be at least 18 years old to use Proxima. By using our services, you agree to comply with our guidelines and not misuse or interfere with the platform. You retain ownership of the information you submit, but grant us a license to use it to provide and improve our services.
            </p>
            <p>
              Proxima disclaims liability for any damages resulting from your use of the service, including any decisions made based on the information provided. Our total liability is limited to a nominal amount. Please read the full Terms of Service for complete details.
            </p>
          </div>
          {!tosScrolledToBottom && (
            <div className="mt-2 text-center">
              <motion.div
                animate={{ y: [0, 5, 0] }}
                transition={{ repeat: Infinity, duration: 1.5 }}
                className="text-gray-500 text-xs"
              >
                ↓ Scroll to continue ↓
              </motion.div>
            </div>
          )}
        </div>
      </motion.div>

      {/* Agreement Checkbox */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="space-y-3"
      >
        {!canAgree && (
          <div className="backdrop-blur-[20px] bg-yellow-500/[0.05] border border-yellow-500/[0.2] rounded-xl p-3">
            <p className="text-yellow-400 text-sm text-center">
              Please scroll to the bottom of both agreements to continue
            </p>
          </div>
        )}
        
        <div className={`backdrop-blur-[20px] bg-white/[0.03] border border-white/[0.05] rounded-xl p-4 hover:border-white/[0.1] transition-all ${!canAgree ? 'opacity-50 pointer-events-none' : ''}`}>
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={agreedToTerms}
              onChange={(e) => handleAgreementChange(e.target.checked)}
              disabled={!canAgree}
              className="mt-1 w-4 h-4 rounded border-white/20 bg-white/5 text-purple-500 focus:ring-purple-500 focus:ring-offset-0 focus:ring-2 cursor-pointer"
            />
            <span className="text-sm text-white">
              I have read and agree to the{' '}
              <a 
                href="/privacy" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-purple-400 hover:text-purple-300 underline"
              >
                Privacy Policy
              </a>
              {' '}and{' '}
              <a 
                href="/terms" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-purple-400 hover:text-purple-300 underline"
              >
                Terms of Service
              </a>
            </span>
          </label>
        </div>

        {canAgree && (
          <div className="backdrop-blur-[20px] bg-green-500/[0.05] border border-green-500/[0.2] rounded-xl p-3">
            <p className="text-green-400 text-sm text-center">
              ✓ You have reviewed both agreements and can now proceed
            </p>
          </div>
        )}
      </motion.div>
    </div>
  );
} 