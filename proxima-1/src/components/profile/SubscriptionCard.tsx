'use client';

import { motion } from 'framer-motion';
import { useState } from 'react';

export default function SubscriptionCard() {
  const [usage] = useState({
    chatsUsed: 47,
    chatsLimit: 100,
    plan: 'Pro',
    nextBilling: 'February 1, 2024',
    price: '$19/month'
  });

  const usagePercentage = (usage.chatsUsed / usage.chatsLimit) * 100;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="backdrop-blur-[20px] bg-white/[0.03] border border-white/[0.05] rounded-xl p-6"
    >
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-white">Subscription</h3>
        <span className="px-3 py-1 text-xs font-medium text-purple-400 bg-purple-500/10 border border-purple-500/20 rounded-full">
          {usage.plan} Plan
        </span>
      </div>

      {/* Usage Stats */}
      <div className="mb-6">
        <div className="flex items-end justify-between mb-2">
          <div>
            <p className="text-sm text-gray-400">Monthly Oracle Chats</p>
            <p className="text-2xl font-semibold text-white mt-1">
              {usage.chatsUsed} <span className="text-base text-gray-400">/ {usage.chatsLimit}</span>
            </p>
          </div>
          <p className="text-sm text-gray-400">{usagePercentage.toFixed(0)}% used</p>
        </div>
        
        {/* Progress Bar */}
        <div className="w-full h-2 bg-white/[0.05] rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${usagePercentage}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
            className={`h-full rounded-full ${
              usagePercentage > 80 
                ? 'bg-gradient-to-r from-orange-500 to-red-500' 
                : 'bg-gradient-to-r from-purple-500 to-pink-500'
            }`}
          />
        </div>
      </div>

      {/* Billing Info */}
      <div className="space-y-3 mb-6">
        <div className="flex justify-between">
          <span className="text-sm text-gray-400">Current plan</span>
          <span className="text-sm text-white">{usage.price}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-sm text-gray-400">Next billing date</span>
          <span className="text-sm text-white">{usage.nextBilling}</span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-sm font-medium rounded-lg hover:shadow-lg hover:shadow-purple-500/25 transition-all">
          Upgrade to Unlimited
        </button>
        <button className="px-4 py-2 text-sm text-gray-400 hover:text-white border border-white/[0.08] hover:border-white/[0.15] rounded-lg transition-all">
          Manage Billing
        </button>
      </div>
    </motion.div>
  );
}