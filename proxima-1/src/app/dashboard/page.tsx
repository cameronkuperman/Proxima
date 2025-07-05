'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function DashboardPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-[#0a0a0a] relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 -left-48 w-96 h-96 bg-gradient-to-r from-purple-600/10 to-pink-600/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 -right-48 w-96 h-96 bg-gradient-to-r from-blue-600/10 to-purple-600/10 rounded-full blur-3xl" />
        
        <div 
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: 'linear-gradient(to right, #ffffff 1px, transparent 1px), linear-gradient(to bottom, #ffffff 1px, transparent 1px)',
            backgroundSize: '50px 50px'
          }}
        />
      </div>

      {/* Main Content */}
      <div className="relative z-10 px-6 py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-6xl mx-auto"
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-12">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">Welcome to Proxima</h1>
              <p className="text-gray-400">Your personal health intelligence dashboard</p>
            </div>
            
            <button
              onClick={() => router.push('/login')}
              className="px-4 py-2 text-sm font-medium text-gray-400 hover:text-white border border-gray-800 rounded-lg hover:bg-gray-900/50 transition-all"
            >
              Sign Out
            </button>
          </div>

          {/* Dashboard Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Quick Scan Card */}
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="backdrop-blur-[20px] bg-white/[0.03] border border-white/[0.05] rounded-xl p-6 cursor-pointer group"
            >
              <div className="w-12 h-12 rounded-lg bg-gradient-to-r from-purple-600/20 to-pink-600/20 flex items-center justify-center mb-4 group-hover:from-purple-600/30 group-hover:to-pink-600/30 transition-all">
                <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Quick Scan</h3>
              <p className="text-gray-400 text-sm mb-4">Get instant AI-powered health insights</p>
              <div className="flex items-center text-purple-400 text-sm group-hover:translate-x-1 transition-transform">
                Start scan
                <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </motion.div>

            {/* 3D Body Map Card */}
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="backdrop-blur-[20px] bg-white/[0.03] border border-white/[0.05] rounded-xl p-6 cursor-pointer group"
            >
              <div className="w-12 h-12 rounded-lg bg-gradient-to-r from-blue-600/20 to-purple-600/20 flex items-center justify-center mb-4 group-hover:from-blue-600/30 group-hover:to-purple-600/30 transition-all">
                <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">3D Body Map</h3>
              <p className="text-gray-400 text-sm mb-4">Click exactly where you feel symptoms</p>
              <div className="flex items-center text-blue-400 text-sm group-hover:translate-x-1 transition-transform">
                Open map
                <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </motion.div>

            {/* Photo Analysis Card */}
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="backdrop-blur-[20px] bg-white/[0.03] border border-white/[0.05] rounded-xl p-6 cursor-pointer group"
            >
              <div className="w-12 h-12 rounded-lg bg-gradient-to-r from-pink-600/20 to-purple-600/20 flex items-center justify-center mb-4 group-hover:from-pink-600/30 group-hover:to-purple-600/30 transition-all">
                <svg className="w-6 h-6 text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Photo Analysis</h3>
              <p className="text-gray-400 text-sm mb-4">Upload photos for visual symptom analysis</p>
              <div className="flex items-center text-pink-400 text-sm group-hover:translate-x-1 transition-transform">
                Upload photo
                <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </motion.div>
          </div>

          {/* Recent Activity */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mt-12"
          >
            <h2 className="text-2xl font-semibold text-white mb-6">Recent Activity</h2>
            <div className="backdrop-blur-[20px] bg-white/[0.03] border border-white/[0.05] rounded-xl p-6">
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <svg className="w-16 h-16 text-gray-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <p className="text-gray-400">No recent activity yet</p>
                  <p className="text-gray-500 text-sm mt-2">Start by running a quick scan or using the 3D body map</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Quick Tips */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mt-8 p-4 bg-gradient-to-r from-purple-600/10 to-pink-600/10 rounded-lg border border-purple-600/20"
          >
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-purple-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <p className="text-sm text-gray-300">
                  <span className="font-medium text-white">Pro tip:</span> For the most accurate results, describe your symptoms in detail and use the 3D body map to show exactly where you're experiencing issues.
                </p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}