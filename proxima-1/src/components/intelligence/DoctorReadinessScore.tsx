'use client';

import { motion } from 'framer-motion';
import { DoctorReadinessData } from '@/lib/mock-health-data';
import { FileText, Download, Mail, Printer, Check, X, AlertCircle } from 'lucide-react';

interface DoctorReadinessScoreProps {
  data: DoctorReadinessData;
}

export default function DoctorReadinessScore({ data }: DoctorReadinessScoreProps) {
  const circumference = 2 * Math.PI * 60; // radius = 60
  const strokeDashoffset = circumference - (data.score / 100) * circumference;
  
  const getScoreColor = () => {
    if (data.score >= 80) return '#00C896';
    if (data.score >= 60) return '#FFB800';
    return '#FF6B6B';
  };
  
  const getScoreGradient = () => {
    if (data.score >= 80) return 'greenGradient';
    if (data.score >= 60) return 'yellowGradient';
    return 'redGradient';
  };

  return (
    <div className="backdrop-blur-[20px] bg-white/[0.03] border border-white/[0.05] rounded-xl p-6">
      <h3 className="text-lg font-semibold text-white mb-6">Doctor Readiness Score</h3>
      
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Score Circle */}
        <div className="flex flex-col items-center">
          <div className="relative">
            <svg className="w-32 h-32 transform -rotate-90">
              {/* Background circle */}
              <circle
                cx="64"
                cy="64"
                r="60"
                stroke="rgba(255, 255, 255, 0.05)"
                strokeWidth="8"
                fill="none"
              />
              {/* Progress circle */}
              <motion.circle
                cx="64"
                cy="64"
                r="60"
                stroke={`url(#${getScoreGradient()})`}
                strokeWidth="8"
                fill="none"
                strokeLinecap="round"
                strokeDasharray={circumference}
                initial={{ strokeDashoffset: circumference }}
                animate={{ strokeDashoffset }}
                transition={{ duration: 1.5, ease: "easeOut" }}
              />
              <defs>
                <linearGradient id="greenGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#00C896" />
                  <stop offset="100%" stopColor="#52C41A" />
                </linearGradient>
                <linearGradient id="yellowGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#FFB800" />
                  <stop offset="100%" stopColor="#FFC53D" />
                </linearGradient>
                <linearGradient id="redGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#FF6B6B" />
                  <stop offset="100%" stopColor="#FF4444" />
                </linearGradient>
              </defs>
            </svg>
            
            {/* Center content */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.5, duration: 0.3 }}
                className="text-center"
              >
                <div className="text-3xl font-bold text-white">{data.score}%</div>
                <div className="text-xs text-gray-400">Complete</div>
              </motion.div>
            </div>
          </div>
          
          <p className="text-xs text-gray-400 text-center mt-3 max-w-[150px]">
            Your health data is {data.score}% ready for doctor consultation
          </p>
        </div>
        
        {/* Data Checklist */}
        <div className="flex-1 space-y-4">
          <div>
            <h4 className="text-sm font-medium text-gray-400 mb-3">Available Data</h4>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(data.availableData).map(([key, available], index) => (
                <motion.div
                  key={key}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`flex items-center gap-2 p-2 rounded-lg ${
                    available ? 'bg-green-500/10' : 'bg-red-500/10'
                  }`}
                >
                  {available ? (
                    <Check className="w-4 h-4 text-green-400" />
                  ) : (
                    <X className="w-4 h-4 text-red-400" />
                  )}
                  <span className={`text-xs capitalize ${
                    available ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {key.replace(/([A-Z])/g, ' $1').trim()}
                  </span>
                </motion.div>
              ))}
            </div>
          </div>
          
          {data.missingData.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-400 mb-3">Missing Data</h4>
              <div className="space-y-1">
                {data.missingData.map((item, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 + index * 0.05 }}
                    className="flex items-center gap-2 text-xs text-gray-400"
                  >
                    <AlertCircle className="w-3 h-3 text-yellow-400" />
                    {item}
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Report Sections */}
      <div className="mt-6 p-4 bg-white/[0.02] rounded-lg border border-white/[0.05]">
        <h4 className="text-sm font-medium text-white mb-3">Report Sections</h4>
        <div className="flex flex-wrap gap-2">
          {data.reportSections.map((section, index) => (
            <motion.span
              key={index}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.7 + index * 0.03 }}
              className="px-2 py-1 text-xs bg-purple-500/10 text-purple-400 rounded-lg"
            >
              {section}
            </motion.span>
          ))}
        </div>
      </div>
      
      {/* Action Buttons */}
      <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-purple-500/20 hover:bg-purple-500/30 
            text-purple-400 rounded-lg transition-all"
        >
          <FileText className="w-4 h-4" />
          <span className="text-sm font-medium">Generate PDF</span>
        </motion.button>
        
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-white/[0.05] hover:bg-white/[0.08] 
            text-gray-400 hover:text-white rounded-lg transition-all"
        >
          <Mail className="w-4 h-4" />
          <span className="text-sm font-medium">Email Doctor</span>
        </motion.button>
        
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-white/[0.05] hover:bg-white/[0.08] 
            text-gray-400 hover:text-white rounded-lg transition-all"
        >
          <Printer className="w-4 h-4" />
          <span className="text-sm font-medium">Print</span>
        </motion.button>
      </div>
      
      {/* Tip */}
      <div className="mt-4 p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
        <p className="text-xs text-blue-400">
          💡 Complete the missing data points to improve your report quality and help your doctor make better recommendations.
        </p>
      </div>
    </div>
  );
}