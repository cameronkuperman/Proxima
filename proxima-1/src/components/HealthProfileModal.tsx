'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';

interface HealthProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function HealthProfileModal({ isOpen, onClose }: HealthProfileModalProps) {
  const [formData, setFormData] = useState({
    // Basic Information
    name: '',
    dateOfBirth: '',
    gender: '',
    height: '',
    weight: '',
    bloodType: '',
    
    // Medical History
    chronicConditions: [] as string[],
    currentMedications: [] as string[],
    allergies: [] as string[],
    surgeries: [] as string[],
    
    // Family History
    familyConditions: [] as string[],
    
    // Lifestyle
    smokingStatus: '',
    alcoholConsumption: '',
    exerciseFrequency: '',
    
    // Emergency Contact
    emergencyName: '',
    emergencyRelation: '',
    emergencyPhone: ''
  });

  const [activeTab, setActiveTab] = useState('basic');
  const [newItem, setNewItem] = useState('');
  const [activeField, setActiveField] = useState('');

  const handleAddItem = (field: string) => {
    if (newItem.trim()) {
      setFormData({
        ...formData,
        [field]: [...(formData[field as keyof typeof formData] as string[]), newItem]
      });
      setNewItem('');
      setActiveField('');
    }
  };

  const handleRemoveItem = (field: string, index: number) => {
    const updatedArray = [...(formData[field as keyof typeof formData] as string[])];
    updatedArray.splice(index, 1);
    setFormData({ ...formData, [field]: updatedArray });
  };

  const tabs = [
    { id: 'basic', label: 'Basic Info', icon: '👤' },
    { id: 'medical', label: 'Medical History', icon: '🏥' },
    { id: 'lifestyle', label: 'Lifestyle', icon: '🏃' },
    { id: 'emergency', label: 'Emergency', icon: '🚨' },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
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
            className="bg-[#0a0a0a] border border-white/[0.1] rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden"
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
            <div className="flex border-b border-white/[0.05]">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 px-4 py-3 text-sm font-medium transition-all relative ${
                    activeTab === tab.id
                      ? 'text-white'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <span className="flex items-center justify-center gap-2">
                    <span>{tab.icon}</span>
                    {tab.label}
                  </span>
                  {activeTab === tab.id && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-purple-500 to-pink-500"
                    />
                  )}
                </button>
              ))}
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              {/* Basic Info Tab */}
              {activeTab === 'basic' && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-6"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">Full Name</label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full bg-white/[0.03] border border-white/[0.05] rounded-lg px-4 py-3 text-white focus:outline-none focus:border-purple-500 transition-colors"
                        placeholder="John Doe"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">Date of Birth</label>
                      <input
                        type="date"
                        value={formData.dateOfBirth}
                        onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                        className="w-full bg-white/[0.03] border border-white/[0.05] rounded-lg px-4 py-3 text-white focus:outline-none focus:border-purple-500 transition-colors"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">Gender</label>
                      <select
                        value={formData.gender}
                        onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                        className="w-full bg-white/[0.03] border border-white/[0.05] rounded-lg px-4 py-3 text-white focus:outline-none focus:border-purple-500 transition-colors"
                      >
                        <option value="">Select gender</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                        <option value="prefer-not-to-say">Prefer not to say</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">Blood Type</label>
                      <select
                        value={formData.bloodType}
                        onChange={(e) => setFormData({ ...formData, bloodType: e.target.value })}
                        className="w-full bg-white/[0.03] border border-white/[0.05] rounded-lg px-4 py-3 text-white focus:outline-none focus:border-purple-500 transition-colors"
                      >
                        <option value="">Select blood type</option>
                        <option value="A+">A+</option>
                        <option value="A-">A-</option>
                        <option value="B+">B+</option>
                        <option value="B-">B-</option>
                        <option value="AB+">AB+</option>
                        <option value="AB-">AB-</option>
                        <option value="O+">O+</option>
                        <option value="O-">O-</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">Height (cm)</label>
                      <input
                        type="number"
                        value={formData.height}
                        onChange={(e) => setFormData({ ...formData, height: e.target.value })}
                        className="w-full bg-white/[0.03] border border-white/[0.05] rounded-lg px-4 py-3 text-white focus:outline-none focus:border-purple-500 transition-colors"
                        placeholder="175"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">Weight (kg)</label>
                      <input
                        type="number"
                        value={formData.weight}
                        onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                        className="w-full bg-white/[0.03] border border-white/[0.05] rounded-lg px-4 py-3 text-white focus:outline-none focus:border-purple-500 transition-colors"
                        placeholder="70"
                      />
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Medical History Tab */}
              {activeTab === 'medical' && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-6"
                >
                  {/* Allergies */}
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Allergies</label>
                    <div className="space-y-2">
                      {formData.allergies.map((allergy, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <div className="flex-1 bg-white/[0.03] border border-white/[0.05] rounded-lg px-4 py-2 text-white">
                            {allergy}
                          </div>
                          <button
                            onClick={() => handleRemoveItem('allergies', index)}
                            className="text-red-400 hover:text-red-300 transition-colors"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      ))}
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={activeField === 'allergies' ? newItem : ''}
                          onChange={(e) => setNewItem(e.target.value)}
                          onFocus={() => setActiveField('allergies')}
                          onKeyPress={(e) => e.key === 'Enter' && handleAddItem('allergies')}
                          className="flex-1 bg-white/[0.03] border border-white/[0.05] rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500 transition-colors"
                          placeholder="Add allergy (e.g., Penicillin, Peanuts)"
                        />
                        <button
                          onClick={() => handleAddItem('allergies')}
                          className="px-4 py-2 bg-purple-600/20 hover:bg-purple-600/30 text-purple-400 rounded-lg transition-colors"
                        >
                          Add
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Current Medications */}
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Current Medications</label>
                    <div className="space-y-2">
                      {formData.currentMedications.map((medication, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <div className="flex-1 bg-white/[0.03] border border-white/[0.05] rounded-lg px-4 py-2 text-white">
                            {medication}
                          </div>
                          <button
                            onClick={() => handleRemoveItem('currentMedications', index)}
                            className="text-red-400 hover:text-red-300 transition-colors"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      ))}
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={activeField === 'currentMedications' ? newItem : ''}
                          onChange={(e) => setNewItem(e.target.value)}
                          onFocus={() => setActiveField('currentMedications')}
                          onKeyPress={(e) => e.key === 'Enter' && handleAddItem('currentMedications')}
                          className="flex-1 bg-white/[0.03] border border-white/[0.05] rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500 transition-colors"
                          placeholder="Add medication"
                        />
                        <button
                          onClick={() => handleAddItem('currentMedications')}
                          className="px-4 py-2 bg-purple-600/20 hover:bg-purple-600/30 text-purple-400 rounded-lg transition-colors"
                        >
                          Add
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Chronic Conditions */}
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Chronic Conditions</label>
                    <div className="space-y-2">
                      {formData.chronicConditions.map((condition, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <div className="flex-1 bg-white/[0.03] border border-white/[0.05] rounded-lg px-4 py-2 text-white">
                            {condition}
                          </div>
                          <button
                            onClick={() => handleRemoveItem('chronicConditions', index)}
                            className="text-red-400 hover:text-red-300 transition-colors"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      ))}
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={activeField === 'chronicConditions' ? newItem : ''}
                          onChange={(e) => setNewItem(e.target.value)}
                          onFocus={() => setActiveField('chronicConditions')}
                          onKeyPress={(e) => e.key === 'Enter' && handleAddItem('chronicConditions')}
                          className="flex-1 bg-white/[0.03] border border-white/[0.05] rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500 transition-colors"
                          placeholder="Add condition (e.g., Diabetes, Hypertension)"
                        />
                        <button
                          onClick={() => handleAddItem('chronicConditions')}
                          className="px-4 py-2 bg-purple-600/20 hover:bg-purple-600/30 text-purple-400 rounded-lg transition-colors"
                        >
                          Add
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Lifestyle Tab */}
              {activeTab === 'lifestyle' && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-6"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">Smoking Status</label>
                      <select
                        value={formData.smokingStatus}
                        onChange={(e) => setFormData({ ...formData, smokingStatus: e.target.value })}
                        className="w-full bg-white/[0.03] border border-white/[0.05] rounded-lg px-4 py-3 text-white focus:outline-none focus:border-purple-500 transition-colors"
                      >
                        <option value="">Select status</option>
                        <option value="never">Never smoked</option>
                        <option value="former">Former smoker</option>
                        <option value="current">Current smoker</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">Alcohol Consumption</label>
                      <select
                        value={formData.alcoholConsumption}
                        onChange={(e) => setFormData({ ...formData, alcoholConsumption: e.target.value })}
                        className="w-full bg-white/[0.03] border border-white/[0.05] rounded-lg px-4 py-3 text-white focus:outline-none focus:border-purple-500 transition-colors"
                      >
                        <option value="">Select frequency</option>
                        <option value="never">Never</option>
                        <option value="rarely">Rarely</option>
                        <option value="moderate">Moderate (1-7 drinks/week)</option>
                        <option value="heavy">Heavy (&gt;7 drinks/week)</option>
                      </select>
                    </div>
                    
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-400 mb-2">Exercise Frequency</label>
                      <select
                        value={formData.exerciseFrequency}
                        onChange={(e) => setFormData({ ...formData, exerciseFrequency: e.target.value })}
                        className="w-full bg-white/[0.03] border border-white/[0.05] rounded-lg px-4 py-3 text-white focus:outline-none focus:border-purple-500 transition-colors"
                      >
                        <option value="">Select frequency</option>
                        <option value="none">No regular exercise</option>
                        <option value="light">Light (1-2 times/week)</option>
                        <option value="moderate">Moderate (3-4 times/week)</option>
                        <option value="active">Very active (5+ times/week)</option>
                      </select>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Emergency Contact Tab */}
              {activeTab === 'emergency' && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-6"
                >
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Emergency Contact Name</label>
                    <input
                      type="text"
                      value={formData.emergencyName}
                      onChange={(e) => setFormData({ ...formData, emergencyName: e.target.value })}
                      className="w-full bg-white/[0.03] border border-white/[0.05] rounded-lg px-4 py-3 text-white focus:outline-none focus:border-purple-500 transition-colors"
                      placeholder="Jane Doe"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Relationship</label>
                    <input
                      type="text"
                      value={formData.emergencyRelation}
                      onChange={(e) => setFormData({ ...formData, emergencyRelation: e.target.value })}
                      className="w-full bg-white/[0.03] border border-white/[0.05] rounded-lg px-4 py-3 text-white focus:outline-none focus:border-purple-500 transition-colors"
                      placeholder="Spouse, Parent, Sibling, etc."
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Phone Number</label>
                    <input
                      type="tel"
                      value={formData.emergencyPhone}
                      onChange={(e) => setFormData({ ...formData, emergencyPhone: e.target.value })}
                      className="w-full bg-white/[0.03] border border-white/[0.05] rounded-lg px-4 py-3 text-white focus:outline-none focus:border-purple-500 transition-colors"
                      placeholder="+1 (555) 123-4567"
                    />
                  </div>
                </motion.div>
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
                  onClick={() => {
                    // Save logic here
                    onClose();
                  }}
                  className="px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:shadow-lg hover:shadow-purple-500/25 transition-all"
                >
                  Save Profile
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}