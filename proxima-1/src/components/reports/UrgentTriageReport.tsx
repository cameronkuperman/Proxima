'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  AlertCircle, 
  Phone, 
  Siren,
  Clock,
  ChevronRight,
  Download,
  Share2,
  Mail,
  MapPin,
  Heart,
  Activity,
  Thermometer,
  AlertTriangle,
  PhoneCall,
  Zap,
  Copy,
  Check,
  ExternalLink
} from 'lucide-react';

interface UrgentTriageReportProps {
  report: any;
  onExport: () => void;
  onShare: () => void;
  onEmail: () => void;
}

export const UrgentTriageReport: React.FC<UrgentTriageReportProps> = ({ 
  report, 
  onExport, 
  onShare, 
  onEmail 
}) => {
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [copiedInfo, setCopiedInfo] = useState<string | null>(null);
  const [pulseAnimation, setPulseAnimation] = useState(true);
  
  const data = report.report_data?.triage_summary || report.triage_summary;
  
  // Emergency timer
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeElapsed(prev => prev + 1);
    }, 1000);
    
    return () => clearInterval(timer);
  }, []);
  
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopiedInfo(type);
    setTimeout(() => setCopiedInfo(null), 2000);
  };

  const getSeverityColor = (severity: string) => {
    switch (severity?.toLowerCase()) {
      case 'severe':
        return 'bg-red-600';
      case 'moderate':
        return 'bg-orange-500';
      case 'mild':
        return 'bg-yellow-500';
      default:
        return 'bg-red-600';
    }
  };

  const emergencyNumbers = {
    'US': '911',
    'UK': '999',
    'EU': '112',
    'Australia': '000'
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-900 via-red-800 to-orange-900">
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-black/20" />
        {pulseAnimation && (
          <>
            <motion.div
              className="absolute top-1/4 left-1/4 w-96 h-96 bg-red-500/30 rounded-full blur-3xl"
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.3, 0.5, 0.3],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
            <motion.div
              className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-orange-500/30 rounded-full blur-3xl"
              animate={{
                scale: [1.2, 1, 1.2],
                opacity: [0.3, 0.5, 0.3],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 1
              }}
            />
          </>
        )}
      </div>

      <div className="relative z-10 max-w-4xl mx-auto p-6">
        {/* Emergency Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-900/90 backdrop-blur-lg border-2 border-red-500 rounded-2xl p-6 mb-6"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 2 }}
              >
                <Siren className="w-12 h-12 text-white" />
              </motion.div>
              <div>
                <h1 className="text-3xl font-bold text-white">URGENT MEDICAL ATTENTION REQUIRED</h1>
                <p className="text-red-200">Emergency Triage Report • Generated {new Date(report.generated_at).toLocaleString()}</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-white text-2xl font-mono">{formatTime(timeElapsed)}</div>
              <p className="text-red-200 text-sm">Time Elapsed</p>
            </div>
          </div>

          {/* Emergency Actions Bar */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => window.location.href = 'tel:911'}
              className="bg-white text-red-900 py-4 px-6 rounded-lg font-bold flex items-center justify-center gap-3 hover:bg-red-50"
            >
              <Phone className="w-6 h-6" />
              Call 911 NOW
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onExport}
              className="bg-red-800 text-white py-4 px-6 rounded-lg font-bold flex items-center justify-center gap-3 hover:bg-red-700"
            >
              <Download className="w-6 h-6" />
              Export for EMT
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {}}
              className="bg-red-800 text-white py-4 px-6 rounded-lg font-bold flex items-center justify-center gap-3 hover:bg-red-700"
            >
              <MapPin className="w-6 h-6" />
              Find ER
            </motion.button>
          </div>
        </motion.div>

        {/* Primary Action Required */}
        {data?.recommended_action && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl p-8 mb-6 shadow-2xl"
          >
            <div className="flex items-start gap-4">
              <div className="p-4 bg-red-100 rounded-full">
                <AlertCircle className="w-8 h-8 text-red-600" />
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Immediate Action Required</h2>
                <p className="text-xl text-red-700 font-semibold mb-4">{data.recommended_action}</p>
                
                {/* Emergency contact numbers */}
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-sm font-semibold text-red-900 mb-2">Emergency Numbers:</p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {Object.entries(emergencyNumbers).map(([country, number]) => (
                      <a
                        key={country}
                        href={`tel:${number}`}
                        className="flex items-center justify-between bg-white px-3 py-2 rounded border border-red-200 hover:bg-red-50"
                      >
                        <span className="text-sm font-medium">{country}:</span>
                        <span className="font-bold text-red-600">{number}</span>
                      </a>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Vital Symptoms */}
        {data?.vital_symptoms?.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-2xl p-6 mb-6 shadow-xl"
          >
            <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-3">
              <Activity className="w-6 h-6 text-red-600" />
              Critical Symptoms
            </h3>
            
            <div className="space-y-4">
              {data.vital_symptoms.map((symptom: any, idx: number) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + idx * 0.1 }}
                  className="border-l-4 border-red-500 pl-4 py-3 bg-red-50 rounded-r-lg"
                >
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-lg text-gray-900">{symptom.symptom}</h4>
                    <span className={`px-3 py-1 rounded-full text-white text-sm font-bold ${getSeverityColor(symptom.severity)}`}>
                      {symptom.severity?.toUpperCase()}
                    </span>
                  </div>
                  
                  <p className="text-gray-700 mb-2">
                    <Clock className="inline w-4 h-4 mr-1" />
                    Duration: {symptom.duration}
                  </p>
                  
                  {symptom.red_flags?.length > 0 && (
                    <div className="mt-3 bg-red-100 p-3 rounded-lg">
                      <p className="font-semibold text-red-900 text-sm mb-1 flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4" />
                        Red Flags:
                      </p>
                      <ul className="space-y-1">
                        {symptom.red_flags.map((flag: string, flagIdx: number) => (
                          <li key={flagIdx} className="text-red-800 text-sm flex items-center gap-2">
                            <Zap className="w-3 h-3" />
                            {flag}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* What to Tell Doctor */}
        {data?.what_to_tell_doctor?.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white rounded-2xl p-6 mb-6 shadow-xl"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900 flex items-center gap-3">
                <PhoneCall className="w-6 h-6 text-blue-600" />
                What to Tell Emergency Services
              </h3>
              <button
                onClick={() => copyToClipboard(data.what_to_tell_doctor.join('\n'), 'emergency-info')}
                className="flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200"
              >
                {copiedInfo === 'emergency-info' ? (
                  <>
                    <Check className="w-4 h-4" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    Copy All
                  </>
                )}
              </button>
            </div>
            
            <div className="space-y-3">
              {data.what_to_tell_doctor.map((info: string, idx: number) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + idx * 0.1 }}
                  className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg"
                >
                  <span className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                    {idx + 1}
                  </span>
                  <p className="text-gray-800 flex-1">{info}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Recent Progression */}
        {data?.recent_progression && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="bg-yellow-50 border-2 border-yellow-400 rounded-2xl p-6 mb-6"
          >
            <h3 className="text-xl font-bold text-yellow-900 mb-3 flex items-center gap-3">
              <Clock className="w-6 h-6" />
              Recent Symptom Progression
            </h3>
            <p className="text-yellow-800 leading-relaxed">{data.recent_progression}</p>
          </motion.div>
        )}

        {/* Quick Actions Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="bg-white/90 backdrop-blur rounded-2xl p-6 shadow-xl"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={onShare}
              className="flex items-center justify-center gap-3 py-3 px-4 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              <Share2 className="w-5 h-5" />
              Share Report
            </button>
            <button
              onClick={onEmail}
              className="flex items-center justify-center gap-3 py-3 px-4 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              <Mail className="w-5 h-5" />
              Email to Doctor
            </button>
            <button
              onClick={() => window.open('https://www.google.com/maps/search/emergency+room+near+me', '_blank')}
              className="flex items-center justify-center gap-3 py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              <ExternalLink className="w-5 h-5" />
              Find Nearest ER
            </button>
          </div>
        </motion.div>

        {/* Report Info */}
        <div className="mt-6 text-center text-white/70 text-sm">
          Report ID: {report.report_id} • Confidence: {report.confidence_score}%
        </div>
      </div>
    </div>
  );
};