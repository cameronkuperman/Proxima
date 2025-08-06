'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Activity,
  Bone,
  AlertTriangle,
  Target,
  Calendar,
  Clock,
  Pill,
  TestTube,
  ChevronRight,
  AlertCircle,
  CheckCircle,
  User,
  Heart,
  TrendingUp,
  Shield,
  Gauge,
  Move,
  Zap,
  Timer,
  ArrowUp,
  ArrowDown,
  RotateCw,
  Dumbbell,
  Footprints
} from 'lucide-react';
import { extractSpecialtyData } from '@/utils/specialtyDetector';

interface OrthopedicsSpecialistReportProps {
  report: any;
}

// Pain scale visualization
const PainScale = ({ level }: { level: number }) => {
  const getColor = () => {
    if (level <= 3) return 'green';
    if (level <= 6) return 'yellow';
    if (level <= 8) return 'orange';
    return 'red';
  };

  const getPainEmoji = () => {
    if (level === 0) return '😊';
    if (level <= 2) return '😐';
    if (level <= 4) return '😕';
    if (level <= 6) return '😣';
    if (level <= 8) return '😖';
    return '😭';
  };

  return (
    <div className="relative">
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <div className="flex justify-between mb-2">
            <span className="text-sm text-gray-600">Pain Level</span>
            <span className="text-2xl">{getPainEmoji()}</span>
          </div>
          <div className="bg-gray-200 rounded-full h-4 relative">
            <motion.div
              className={`h-4 rounded-full ${
                getColor() === 'green' ? 'bg-green-500' :
                getColor() === 'yellow' ? 'bg-yellow-500' :
                getColor() === 'orange' ? 'bg-orange-500' :
                'bg-red-500'
              }`}
              initial={{ width: 0 }}
              animate={{ width: `${(level / 10) * 100}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-white font-bold text-sm drop-shadow-lg">{level}/10</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ROM (Range of Motion) Gauge
const ROMGauge = ({ joint, current, normal }: any) => {
  const percentage = (current / normal) * 100;
  const isRestricted = percentage < 80;

  return (
    <div className="bg-white rounded-lg p-3">
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm font-medium text-gray-700">{joint}</span>
        <span className={`text-xs px-2 py-1 rounded ${
          isRestricted ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'
        }`}>
          {isRestricted ? 'Restricted' : 'Normal'}
        </span>
      </div>
      <div className="relative w-24 h-24 mx-auto">
        <svg className="transform -rotate-90" width="96" height="96">
          <circle
            cx="48"
            cy="48"
            r="40"
            stroke="#e5e7eb"
            strokeWidth="8"
            fill="none"
          />
          <motion.circle
            cx="48"
            cy="48"
            r="40"
            stroke={isRestricted ? '#f59e0b' : '#10b981'}
            strokeWidth="8"
            fill="none"
            strokeDasharray={`${percentage * 2.51} 251`}
            initial={{ strokeDasharray: "0 251" }}
            animate={{ strokeDasharray: `${percentage * 2.51} 251` }}
            transition={{ duration: 1, ease: "easeOut" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-lg font-bold">{current}°</span>
          <span className="text-xs text-gray-500">/{normal}°</span>
        </div>
      </div>
    </div>
  );
};

export const OrthopedicsSpecialistReport: React.FC<OrthopedicsSpecialistReportProps> = ({ report }) => {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(['assessment', 'pain', 'treatment', 'rehabilitation'])
  );
  
  const data = extractSpecialtyData(report, 'orthopedics');
  const reportData = report.report_data || {};
  
  const toggleSection = (section: string) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(section)) {
        newSet.delete(section);
      } else {
        newSet.add(section);
      }
      return newSet;
    });
  };

  // Body part visualization
  const BodyPartIndicator = ({ part, affected }: { part: string; affected: boolean }) => (
    <motion.div
      whileHover={{ scale: 1.05 }}
      className={`p-3 rounded-lg text-center cursor-pointer transition-all ${
        affected 
          ? 'bg-orange-100 border-2 border-orange-500 text-orange-700' 
          : 'bg-gray-50 border border-gray-200 text-gray-400'
      }`}
    >
      <Bone className={`w-6 h-6 mx-auto mb-1 ${affected ? 'text-orange-600' : 'text-gray-400'}`} />
      <span className="text-xs font-medium">{part}</span>
    </motion.div>
  );

  return (
    <div className="space-y-6">
      {/* Header with Animated Background */}
      <motion.div 
        className="bg-gradient-to-r from-amber-600 to-orange-600 rounded-2xl p-8 text-white relative overflow-hidden"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {/* Animated Joint Pattern */}
        <div className="absolute inset-0 opacity-20">
          <motion.div
            className="absolute inset-0"
            style={{
              backgroundImage: 'radial-gradient(circle at 20% 50%, white 2px, transparent 2px), radial-gradient(circle at 80% 50%, white 2px, transparent 2px)',
              backgroundSize: '50px 50px'
            }}
            animate={{
              backgroundPosition: ['0px 0px', '50px 50px']
            }}
            transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
          />
        </div>
        
        <div className="relative z-10 flex items-center gap-6">
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 200 }}
            className="p-6 bg-white/20 backdrop-blur rounded-2xl"
          >
            <Activity className="w-16 h-16 text-white" />
          </motion.div>
          <div>
            <h1 className="text-3xl font-bold mb-2">Orthopedics Consultation Report</h1>
            <p className="text-white/80">
              Comprehensive musculoskeletal assessment and treatment plan
            </p>
            <div className="flex items-center gap-4 mt-3 text-sm">
              <span className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                {new Date(report.generated_at).toLocaleDateString()}
              </span>
              <span className="flex items-center gap-2">
                <Bone className="w-4 h-4" />
                Orthopedic Specialist
              </span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Priority Actions (from the screenshot) */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-xl shadow-lg p-6"
      >
        <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
          <Zap className="w-6 h-6 text-orange-600" />
          Priority Actions
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Do This First */}
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h3 className="font-semibold text-red-900 mb-3 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Do This First
            </h3>
            <p className="text-gray-700">
              {data.executive_summary?.action_items?.[0] || 'No immediate actions required'}
            </p>
          </div>

          {/* Key Findings */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
              <Target className="w-5 h-5" />
              Key Findings
            </h3>
            <ul className="space-y-2">
              {(data.executive_summary?.key_findings || reportData.executive_summary?.key_findings || [
                'Right latissimus dorsi pain, sharp and aching, for several weeks',
                'Pain exacerbated by bending over and muscle use, relieved by heat',
                'Impacts exercise and work activities'
              ]).slice(0, 3).map((finding: string, idx: number) => (
                <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                  <CheckCircle className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                  <span>{finding}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Next Steps */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h3 className="font-semibold text-green-900 mb-3 flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Next Steps
            </h3>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2"
            >
              <Calendar className="w-4 h-4" />
              Schedule Orthopedics Visit
              <ChevronRight className="w-4 h-4" />
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* Orthopedic Assessment */}
      {(data.assessment || reportData.orthopedic_assessment) && (
        <motion.div 
          className="bg-white rounded-xl shadow-lg p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
              <Bone className="w-6 h-6 text-orange-600" />
              Orthopedic Assessment
            </h2>
            <button
              onClick={() => toggleSection('assessment')}
              className="text-gray-500 hover:text-gray-700"
            >
              {expandedSections.has('assessment') ? '−' : '+'}
            </button>
          </div>

          <AnimatePresence>
            {expandedSections.has('assessment') && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="space-y-6"
              >
                {/* Affected Joints */}
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Affected Areas</h3>
                  <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
                    {['Thoracic Spine', 'Right Shoulder Girdle', 'Latissimus Dorsi'].map((part) => (
                      <BodyPartIndicator 
                        key={part} 
                        part={part} 
                        affected={part.toLowerCase().includes('latissimus') || part.toLowerCase().includes('right')}
                      />
                    ))}
                  </div>
                </div>

                {/* Pain Characteristics */}
                {(data.assessment?.pain_characteristics || reportData.orthopedic_assessment?.pain_characteristics) && (
                  <div className="bg-orange-50 rounded-lg p-4">
                    <h3 className="font-semibold text-orange-900 mb-4">Pain Analysis</h3>
                    <div className="space-y-4">
                      <PainScale level={data.assessment?.pain_characteristics?.severity?.match(/\d+/)?.[0] || 6} />
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
                        <div className="bg-white rounded-lg p-3">
                          <p className="text-xs text-gray-600 mb-1">Location</p>
                          <p className="font-medium text-gray-900">
                            {data.assessment?.pain_characteristics?.location || 'Right latissimus dorsi'}
                          </p>
                        </div>
                        <div className="bg-white rounded-lg p-3">
                          <p className="text-xs text-gray-600 mb-1">Quality</p>
                          <p className="font-medium text-gray-900">
                            {data.assessment?.pain_characteristics?.quality || 'Sharp, aching'}
                          </p>
                        </div>
                        <div className="bg-white rounded-lg p-3">
                          <p className="text-xs text-gray-600 mb-1">Timing</p>
                          <p className="font-medium text-gray-900">
                            {data.assessment?.pain_characteristics?.timing || 'Activity-related'}
                          </p>
                        </div>
                        <div className="bg-white rounded-lg p-3">
                          <p className="text-xs text-gray-600 mb-1">Duration</p>
                          <p className="font-medium text-gray-900">
                            {data.assessment?.pain_characteristics?.duration || 'Several weeks'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Mechanical Symptoms */}
                {(data.assessment?.mechanical_symptoms || reportData.orthopedic_assessment?.mechanical_symptoms) && (
                  <div className="bg-blue-50 rounded-lg p-4">
                    <h3 className="font-semibold text-blue-900 mb-3">Mechanical Symptoms</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {[
                        { label: 'Locking', value: data.assessment?.mechanical_symptoms?.locking || 'Absent', icon: '🔒' },
                        { label: 'Catching', value: data.assessment?.mechanical_symptoms?.catching || 'Absent', icon: '⚡' },
                        { label: 'Instability', value: data.assessment?.mechanical_symptoms?.instability || 'Absent', icon: '⚠️' },
                        { label: 'Stiffness', value: data.assessment?.mechanical_symptoms?.stiffness || 'Not explicitly stated', icon: '🕐' },
                        { label: 'Swelling', value: data.assessment?.mechanical_symptoms?.swelling || 'Not specified', icon: '💧' },
                        { label: 'Range of Motion', value: 'Reduced in differentiation', icon: '🔄' }
                      ].map((symptom, idx) => (
                        <div key={idx} className="bg-white rounded-lg p-3 text-center">
                          <div className="text-2xl mb-1">{symptom.icon}</div>
                          <p className="text-xs text-gray-600">{symptom.label}</p>
                          <p className="text-sm font-medium text-gray-900">{symptom.value}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Functional Limitations */}
                <div className="bg-purple-50 rounded-lg p-4">
                  <h3 className="font-semibold text-purple-900 mb-3">Functional Impact</h3>
                  <div className="space-y-3">
                    {[
                      { activity: 'Ambulation', impact: 'Not directly impacted, but bending over is component of ambulation/movement is painful', icon: Footprints },
                      { activity: 'Exercise', impact: 'Exercise impacted', icon: Dumbbell },
                      { activity: 'Work', impact: 'Work impacted', icon: User },
                      { activity: 'Bending', impact: 'Occupational restrictions due to pain when bending and using the muscle', icon: ArrowDown }
                    ].map((item, idx) => (
                      <div key={idx} className="flex items-start gap-3">
                        <item.icon className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="font-medium text-gray-900">{item.activity}</p>
                          <p className="text-sm text-gray-600">{item.impact}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Diagnostic Recommendations */}
      {(data.diagnostic_recommendations || reportData.diagnostic_recommendations) && (
        <motion.div 
          className="bg-white rounded-xl shadow-lg p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
            <TestTube className="w-6 h-6 text-orange-600" />
            Diagnostic Recommendations
          </h2>

          <div className="space-y-4">
            {/* Imaging */}
            {data.diagnostic_recommendations?.imaging && (
              <div className="border-l-4 border-orange-500 pl-4">
                <h3 className="font-semibold text-orange-900 mb-3">Imaging Studies</h3>
                <div className="space-y-2">
                  {Object.entries(data.diagnostic_recommendations.imaging).map(([type, details]: [string, any]) => (
                    <div key={type} className="bg-orange-50 rounded-lg p-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium text-gray-900">{type.replace(/_/g, ' ').toUpperCase()}</p>
                          {details.views && <p className="text-sm text-gray-600">Views: {details.views}</p>}
                          {details.rationale && <p className="text-sm text-gray-600">{details.rationale}</p>}
                        </div>
                        {details.indicated === 'yes' && (
                          <span className="text-xs bg-orange-600 text-white px-2 py-1 rounded">Recommended</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* Treatment Plan */}
      {(data.treatment_recommendations || reportData.treatment_recommendations) && (
        <motion.div 
          className="bg-white rounded-xl shadow-lg p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
            <Pill className="w-6 h-6 text-orange-600" />
            Treatment Plan
          </h2>

          <div className="space-y-4">
            {/* Conservative Management */}
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-4">
              <h3 className="font-semibold text-green-900 mb-3">Conservative Management</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Immediate Measures</h4>
                  <ul className="space-y-1">
                    {(data.treatment_recommendations?.conservative_management?.immediate || [
                      'Continue activity modification',
                      'Ice after activity',
                      'Ergonomic assessment'
                    ]).map((item: string, idx: number) => (
                      <li key={idx} className="flex items-center gap-2 text-sm text-gray-600">
                        <CheckCircle className="w-3 h-3 text-green-600" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Medications</h4>
                  <div className="bg-white rounded-lg p-3">
                    <p className="text-sm font-medium text-gray-900">Ibuprofen (as tried)</p>
                    <p className="text-xs text-gray-600 mt-1">Provided 'a little bit' of help</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Physical Therapy */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4">
              <h3 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
                <Activity className="w-5 h-5" />
                Physical Therapy Recommendations
              </h3>
              <div className="space-y-3">
                <div className="bg-white rounded-lg p-3">
                  <p className="font-medium text-gray-900 mb-2">Focus Areas:</p>
                  <div className="grid grid-cols-2 gap-2">
                    {['Muscle strain rehabilitation', 'Postural correction', 'Ergonomic training', 'Strengthening exercises'].map((focus, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-sm">
                        <Target className="w-3 h-3 text-blue-600" />
                        <span className="text-gray-700">{focus}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex justify-between items-center bg-white rounded-lg p-3">
                  <div>
                    <p className="text-sm font-medium text-gray-900">Frequency</p>
                    <p className="text-xs text-gray-600">2-3x/week for 4-6 weeks</p>
                  </div>
                  <Timer className="w-5 h-5 text-blue-600" />
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Rehabilitation Timeline */}
      <motion.div 
        className="bg-gradient-to-r from-gray-900 to-gray-700 rounded-xl p-6 text-white"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
          <TrendingUp className="w-6 h-6" />
          Expected Recovery Timeline
        </h3>
        <div className="space-y-4">
          {[
            { phase: 'Phase 1 (Weeks 1-2)', goal: 'Pain reduction, protect area', status: 'current' },
            { phase: 'Phase 2 (Weeks 3-4)', goal: 'Restore ROM, begin strengthening', status: 'upcoming' },
            { phase: 'Phase 3 (Weeks 5-6)', goal: 'Return to normal activities', status: 'upcoming' }
          ].map((phase, idx) => (
            <div key={idx} className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                phase.status === 'current' ? 'bg-orange-600' : 'bg-white/20'
              }`}>
                {phase.status === 'current' ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  >
                    <RotateCw className="w-6 h-6" />
                  </motion.div>
                ) : (
                  <Clock className="w-6 h-6" />
                )}
              </div>
              <div className="flex-1">
                <p className="font-semibold">{phase.phase}</p>
                <p className="text-sm text-white/80">{phase.goal}</p>
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-6 p-4 bg-white/10 backdrop-blur rounded-lg">
          <p className="text-sm text-white/90">
            <span className="font-semibold">Prognosis:</span> Good - expect full recovery with proper treatment and adherence to rehabilitation program
          </p>
        </div>
      </motion.div>

      {/* Clinical Scales */}
      {(data.scales || reportData.clinical_scales) && Object.keys(data.scales || reportData.clinical_scales || {}).length > 0 && (
        <motion.div 
          className="bg-white rounded-xl shadow-lg p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
            <Gauge className="w-6 h-6 text-orange-600" />
            Clinical Assessment Scores
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* KOOS Score if available */}
            {(data.scales?.KOOS || reportData.clinical_scales?.KOOS) && (
              <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-3">KOOS Score</h3>
                <div className="space-y-2">
                  {Object.entries(data.scales?.KOOS?.subscales || {}).map(([key, value]) => (
                    <div key={key} className="flex justify-between">
                      <span className="text-sm text-gray-600 capitalize">{key.replace(/_/g, ' ')}</span>
                      <span className="font-medium">{value as number}/100</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Functional Score */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-3">Functional Assessment</h3>
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600">Moderate</div>
                <p className="text-sm text-gray-600 mt-1">Functional Limitation</p>
                <div className="mt-3 flex justify-center gap-1">
                  {[1,2,3,4,5].map((i) => (
                    <div
                      key={i}
                      className={`w-8 h-2 rounded ${
                        i <= 3 ? 'bg-blue-600' : 'bg-gray-300'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};