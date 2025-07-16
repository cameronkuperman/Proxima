'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, ArrowLeft, Plus, Sparkles } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { PastReports } from '@/components/health/PastReports';
import { ReportViewerModal } from '@/components/health/ReportViewerModal';
import { QuickReportChat } from '@/components/health/QuickReportChat';
import { GeneratedReport } from '@/services/reportsService';
import { useAuth } from '@/contexts/AuthContext';
import AuthGuard from '@/components/AuthGuard';

export default function ReportsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [selectedReport, setSelectedReport] = useState<GeneratedReport | null>(null);
  const [showReportViewer, setShowReportViewer] = useState(false);
  const [showQuickChat, setShowQuickChat] = useState(false);

  const handleSelectReport = (report: GeneratedReport) => {
    setSelectedReport(report);
    setShowReportViewer(true);
  };


  return (
    <AuthGuard requireAuth={true}>
      <div className="min-h-screen bg-[#0a0a0a] relative overflow-hidden">
        {/* Ambient Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-600/5 to-blue-600/5 transition-all duration-3000" />
        
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

        {/* Header */}
        <div className="relative z-10 backdrop-blur-[20px] bg-white/[0.02] border-b border-white/[0.05]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="py-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => router.push('/dashboard')}
                    className="p-2 backdrop-blur-[20px] bg-white/[0.03] border border-white/[0.05] rounded-lg hover:border-white/[0.1] transition-all"
                  >
                    <ArrowLeft className="w-5 h-5 text-white" />
                  </motion.button>
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-gradient-to-r from-purple-600/20 to-blue-600/20 backdrop-blur-[20px] rounded-lg">
                      <FileText className="w-6 h-6 text-purple-400" />
                    </div>
                    <div>
                      <h1 className="text-3xl font-bold text-white">Health Reports</h1>
                      <p className="text-gray-400">AI-powered medical reports from your health data</p>
                    </div>
                  </div>
                </div>
                
                {/* Quick Generate Button */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowQuickChat(true)}
                  className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-xl font-medium transition-all duration-200 shadow-lg shadow-purple-600/20"
                >
                  <Plus className="w-5 h-5" />
                  <span>Generate New Report</span>
                  <Sparkles className="w-4 h-4" />
                </motion.button>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="relative z-10 px-6 py-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-7xl mx-auto"
          >
            <PastReports
              onSelectReport={handleSelectReport}
            />
          </motion.div>
        </div>

        {/* Floating Action Button (Mobile) */}
        <motion.button
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setShowQuickChat(true)}
          className="lg:hidden fixed bottom-8 right-8 w-14 h-14 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full shadow-lg flex items-center justify-center z-40"
        >
          <Plus className="w-6 h-6 text-white" />
        </motion.button>

        {/* Modals */}
        <ReportViewerModal
          isOpen={showReportViewer}
          onClose={() => {
            setShowReportViewer(false);
            setSelectedReport(null);
          }}
          report={selectedReport}
        />

        <QuickReportChat
          isOpen={showQuickChat}
          onClose={() => setShowQuickChat(false)}
        />
      </div>
    </AuthGuard>
  );
}