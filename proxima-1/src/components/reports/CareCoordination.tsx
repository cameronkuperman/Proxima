'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { 
  Users, 
  Calendar, 
  AlertCircle, 
  Clock, 
  Phone, 
  FileText, 
  CheckCircle, 
  ArrowRight,
  Info,
  AlertTriangle,
  Stethoscope
} from 'lucide-react';

interface Referral {
  specialty: string;
  reason: string;
  urgency: 'routine' | 'urgent' | 'emergent';
  pre_referral_workup?: string[];
}

interface CareCoordinationProps {
  referralUrgency?: 'routine' | 'urgent' | 'emergent';
  preVisitPreparation?: string[];
  followUpPlan?: {
    specialty?: string;
    timing?: string;
    primary_care?: string;
    emergency_plan?: string;
  };
  recommendedReferrals?: Referral[];
  careGaps?: string[];
  communicationNeeds?: string[];
  className?: string;
}

export const CareCoordination: React.FC<CareCoordinationProps> = ({
  referralUrgency,
  preVisitPreparation = [],
  followUpPlan,
  recommendedReferrals = [],
  careGaps = [],
  communicationNeeds = [],
  className = ''
}) => {
  const hasContent = referralUrgency || 
    preVisitPreparation.length > 0 || 
    followUpPlan || 
    recommendedReferrals.length > 0 ||
    careGaps.length > 0 ||
    communicationNeeds.length > 0;

  if (!hasContent) {
    return null;
  }

  const urgencyConfig = {
    routine: {
      color: 'green',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      textColor: 'text-green-900',
      icon: CheckCircle,
      iconColor: 'text-green-600',
      message: 'Schedule at your convenience'
    },
    urgent: {
      color: 'yellow',
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-200',
      textColor: 'text-yellow-900',
      icon: AlertCircle,
      iconColor: 'text-yellow-600',
      message: 'Schedule within 1-2 weeks'
    },
    emergent: {
      color: 'red',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      textColor: 'text-red-900',
      icon: AlertTriangle,
      iconColor: 'text-red-600',
      message: 'Immediate medical attention needed'
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      <div className="flex items-center gap-2 mb-4">
        <Users className="w-5 h-5 text-gray-700" />
        <h3 className="text-lg font-semibold text-gray-900">Care Coordination</h3>
      </div>

      {/* Referral Urgency Alert */}
      {referralUrgency && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className={`p-4 rounded-lg border-2 ${urgencyConfig[referralUrgency].bgColor} ${urgencyConfig[referralUrgency].borderColor}`}
        >
          <div className="flex items-start gap-3">
            {React.createElement(urgencyConfig[referralUrgency].icon, {
              className: `w-6 h-6 ${urgencyConfig[referralUrgency].iconColor} flex-shrink-0`
            })}
            <div>
              <h4 className={`font-semibold ${urgencyConfig[referralUrgency].textColor} mb-1`}>
                {referralUrgency === 'emergent' ? 'Emergent Referral Required' : 
                 referralUrgency === 'urgent' ? 'Urgent Referral Recommended' : 
                 'Routine Referral Appropriate'}
              </h4>
              <p className={`text-sm ${urgencyConfig[referralUrgency].textColor}`}>
                {urgencyConfig[referralUrgency].message}
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Recommended Referrals */}
      {recommendedReferrals.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Stethoscope className="w-4 h-4 text-indigo-600" />
            <h4 className="font-medium text-gray-800">Specialist Referrals</h4>
          </div>
          <div className="space-y-3">
            {recommendedReferrals.map((referral, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="p-4 bg-indigo-50 border border-indigo-200 rounded-lg"
              >
                <div className="flex items-start justify-between mb-2">
                  <h5 className="font-semibold text-indigo-900 capitalize">{referral.specialty}</h5>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    referral.urgency === 'emergent' ? 'bg-red-100 text-red-800' :
                    referral.urgency === 'urgent' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {referral.urgency}
                  </span>
                </div>
                <p className="text-sm text-gray-700 mb-2">{referral.reason}</p>
                {referral.pre_referral_workup && referral.pre_referral_workup.length > 0 && (
                  <div className="mt-2 p-2 bg-white/50 rounded-md">
                    <p className="text-xs font-medium text-indigo-800 mb-1">Pre-referral workup:</p>
                    <ul className="list-disc list-inside text-xs text-gray-700 space-y-0.5">
                      {referral.pre_referral_workup.map((test, testIdx) => (
                        <li key={testIdx}>{test}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Pre-Visit Preparation */}
      {preVisitPreparation.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-blue-600" />
            <h4 className="font-medium text-gray-800">Pre-Visit Preparation</h4>
          </div>
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-900 mb-2">Bring to your appointment:</p>
            <ul className="space-y-2">
              {preVisitPreparation.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-gray-700">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Follow-up Plan */}
      {followUpPlan && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-purple-600" />
            <h4 className="font-medium text-gray-800">Follow-up Plan</h4>
          </div>
          <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg space-y-3">
            {followUpPlan.specialty && (
              <div className="flex items-start gap-3">
                <Clock className="w-4 h-4 text-purple-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-purple-900 text-sm">Specialist Follow-up</p>
                  <p className="text-sm text-gray-700">{followUpPlan.specialty}</p>
                  {followUpPlan.timing && (
                    <p className="text-xs text-gray-600 mt-1">Timing: {followUpPlan.timing}</p>
                  )}
                </div>
              </div>
            )}
            
            {followUpPlan.primary_care && (
              <div className="flex items-start gap-3">
                <Stethoscope className="w-4 h-4 text-purple-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-purple-900 text-sm">Primary Care</p>
                  <p className="text-sm text-gray-700">{followUpPlan.primary_care}</p>
                </div>
              </div>
            )}
            
            {followUpPlan.emergency_plan && (
              <div className="flex items-start gap-3 p-2 bg-red-50 rounded-md">
                <Phone className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-red-900 text-sm">Emergency Plan</p>
                  <p className="text-sm text-red-800">{followUpPlan.emergency_plan}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Care Gaps */}
      {careGaps.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-orange-600" />
            <h4 className="font-medium text-gray-800">Identified Care Gaps</h4>
          </div>
          <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
            <ul className="space-y-2">
              {careGaps.map((gap, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <ArrowRight className="w-4 h-4 text-orange-600 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-gray-700">{gap}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Communication Needs */}
      {communicationNeeds.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Phone className="w-4 h-4 text-gray-600" />
            <h4 className="font-medium text-gray-800">Communication Needs</h4>
          </div>
          <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
            <ul className="space-y-2">
              {communicationNeeds.map((need, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <Info className="w-4 h-4 text-gray-500 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-gray-700">{need}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* General Care Coordination Note */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-lg"
      >
        <div className="flex items-start gap-2">
          <Info className="w-4 h-4 text-gray-500 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-gray-600">
            <p className="font-medium mb-1">Care Coordination Tips:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Keep all healthcare providers informed of your treatments</li>
              <li>Maintain a current list of all medications and supplements</li>
              <li>Ask questions if you don't understand recommendations</li>
              <li>Consider bringing a trusted person to important appointments</li>
            </ul>
          </div>
        </div>
      </motion.div>
    </div>
  );
};