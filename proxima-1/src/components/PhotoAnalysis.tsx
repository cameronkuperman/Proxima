'use client';
import Image from 'next/image';
import { motion } from 'framer-motion';

export default function PhotoAnalysis() {
  return (
    <section className="relative py-16 px-6 overflow-hidden" id="photo-analysis">
      {/* Background */}
      <div className="absolute inset-0 bg-[#0a0a0a]" />
      
      {/* Gradient accents with parallax */}
      <motion.div 
        className="absolute top-0 left-1/4 w-[500px] h-[500px] rounded-full bg-gradient-radial from-cyan-500/10 via-blue-500/5 to-transparent blur-3xl"
        animate={{
          y: [0, -30, 0],
          x: [0, 20, 0],
          scale: [1, 1.1, 1],
        }}
        transition={{
          duration: 15,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      <motion.div 
        className="absolute bottom-0 right-1/4 w-[600px] h-[600px] rounded-full bg-gradient-radial from-indigo-500/10 via-purple-500/5 to-transparent blur-3xl"
        animate={{
          y: [0, 30, 0],
          x: [0, -20, 0],
          scale: [1, 1.15, 1],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 2
        }}
      />
      
      <div className="relative z-10 max-w-7xl mx-auto">
        {/* Header */}
        <motion.div 
          className="text-center mb-20"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          <p className="text-sm font-medium text-cyan-400 mb-4 uppercase tracking-wider">
            Visual Intelligence
          </p>
          <h2 className="text-4xl sm:text-5xl font-semibold text-white mb-4">
            See the change. Track the progress.
          </h2>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto">
            Upload photos for instant AI analysis or track changes over time. 
            Perfect for skin conditions, injuries, or any visible symptom.
          </p>
        </motion.div>

        {/* Two modes showcase */}
        <div className="grid lg:grid-cols-2 gap-8 mb-20 lg:items-stretch">
          {/* Instant Analysis */}
          <motion.div 
            className="relative group flex"
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 rounded-2xl blur-xl group-hover:from-cyan-500/20 group-hover:to-blue-500/20 transition-all duration-500" />
            <motion.div 
              className="relative bg-gray-900/50 border border-gray-800 rounded-2xl overflow-hidden hover:border-gray-700 transition-all duration-300 flex-1 flex flex-col"
              whileHover={{ scale: 1.02, y: -5 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              {/* Header with icon */}
              <div className="p-8 pb-0">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-3 rounded-lg bg-cyan-500/10 border border-cyan-500/20">
                    <svg className="w-6 h-6 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-2xl font-semibold text-white">Instant Analysis</h3>
                    <p className="text-gray-500 text-sm">Get answers in seconds</p>
                  </div>
                </div>
                
                <p className="text-gray-400 mb-6">
                  Need a quick assessment? Snap a photo, describe what you're experiencing, 
                  and get immediate AI-powered insights. Ask follow-up questions to dive deeper.
                </p>

                {/* Feature list */}
                <div className="space-y-3 mb-8">
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-cyan-500/20 flex items-center justify-center">
                      <div className="w-2 h-2 rounded-full bg-cyan-400" />
                    </div>
                    <span className="text-gray-300 text-sm">Upload single or multiple photos at once</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-cyan-500/20 flex items-center justify-center">
                      <div className="w-2 h-2 rounded-full bg-cyan-400" />
                    </div>
                    <span className="text-gray-300 text-sm">Describe each photo individually</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-cyan-500/20 flex items-center justify-center">
                      <div className="w-2 h-2 rounded-full bg-cyan-400" />
                    </div>
                    <span className="text-gray-300 text-sm">Get comprehensive analysis in seconds</span>
                  </div>
                </div>
              </div>

              {/* Visual mockup */}
              <div className="relative flex-1 min-h-[16rem] bg-gradient-to-b from-gray-900/0 to-black/50">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-32 h-32 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 flex items-center justify-center animate-pulse">
                    <svg className="w-12 h-12 text-cyan-400/60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                </div>
                {/* Floating UI elements */}
                <div className="absolute top-4 right-4 px-3 py-1 bg-cyan-500/20 border border-cyan-500/30 rounded-full text-xs text-cyan-400">
                  AI Analyzing...
                </div>
                <div className="absolute bottom-4 left-4 right-4 p-3 bg-gray-900/80 backdrop-blur-sm border border-gray-800 rounded-lg">
                  <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                    <div className="h-full w-3/4 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full animate-pulse" />
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>

          {/* Long-term Tracking */}
          <motion.div 
            className="relative group flex"
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 rounded-2xl blur-xl group-hover:from-indigo-500/20 group-hover:to-purple-500/20 transition-all duration-500" />
            <motion.div 
              className="relative bg-gray-900/50 border border-gray-800 rounded-2xl overflow-hidden hover:border-gray-700 transition-all duration-300 flex-1 flex flex-col"
              whileHover={{ scale: 1.02, y: -5 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              {/* Header with icon */}
              <div className="p-8 pb-0">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-3 rounded-lg bg-indigo-500/10 border border-indigo-500/20">
                    <svg className="w-6 h-6 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-2xl font-semibold text-white">Progress Tracking</h3>
                    <p className="text-gray-500 text-sm">Monitor changes over time</p>
                  </div>
                </div>
                
                <p className="text-gray-400 mb-6">
                  Track healing, monitor conditions, or document treatment progress. 
                  Upload photos over days, weeks, or months to see how things are changing.
                </p>

                {/* Feature list */}
                <div className="space-y-3 mb-8">
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-indigo-500/20 flex items-center justify-center">
                      <div className="w-2 h-2 rounded-full bg-indigo-400" />
                    </div>
                    <span className="text-gray-300 text-sm">Continue previous conversations</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-indigo-500/20 flex items-center justify-center">
                      <div className="w-2 h-2 rounded-full bg-indigo-400" />
                    </div>
                    <span className="text-gray-300 text-sm">Visual timeline of your progress</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-indigo-500/20 flex items-center justify-center">
                      <div className="w-2 h-2 rounded-full bg-indigo-400" />
                    </div>
                    <span className="text-gray-300 text-sm">AI tracks patterns and improvements</span>
                  </div>
                </div>
              </div>

              {/* Visual mockup - Timeline */}
              <div className="relative flex-1 min-h-[16rem] bg-gradient-to-b from-gray-900/0 to-black/50 p-8">
                <div className="flex items-center justify-between h-full">
                  {/* Timeline items */}
                  <div className="flex-1 flex items-center gap-4">
                    <div className="relative">
                      <div className="w-20 h-20 rounded-lg bg-gradient-to-br from-indigo-500/30 to-purple-500/30 animate-pulse" />
                      <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-xs text-gray-500">Day 1</div>
                    </div>
                    <div className="flex-1 h-0.5 bg-gradient-to-r from-indigo-500/50 to-purple-500/50" />
                    <div className="relative">
                      <div className="w-20 h-20 rounded-lg bg-gradient-to-br from-indigo-500/20 to-purple-500/20 animate-pulse" style={{animationDelay: '0.2s'}} />
                      <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-xs text-gray-500">Day 7</div>
                    </div>
                    <div className="flex-1 h-0.5 bg-gradient-to-r from-purple-500/50 to-indigo-500/50" />
                    <div className="relative">
                      <div className="w-20 h-20 rounded-lg bg-gradient-to-br from-indigo-500/10 to-purple-500/10 animate-pulse" style={{animationDelay: '0.4s'}} />
                      <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-xs text-gray-500">Day 14</div>
                    </div>
                  </div>
                </div>
                {/* Progress indicator */}
                <div className="absolute top-4 right-4 flex items-center gap-2 text-xs text-indigo-400">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                  Improving
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>

        {/* Use cases */}
        <div className="mb-20">
          <h3 className="text-2xl font-semibold text-white text-center mb-12">
            Perfect for tracking any visible condition
          </h3>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { iconNumber: 1, label: 'Rashes & Skin Conditions' },
              { iconNumber: 2, label: 'Wound Healing' },
              { iconNumber: 3, label: 'Swelling & Inflammation' },
              { iconNumber: 4, label: 'Eye Irritation' },
              { iconNumber: 5, label: 'Dental Issues' },
              { iconNumber: 6, label: 'Medication Reactions' },
              { iconNumber: 7, label: 'Foot & Nail Problems' },
              { iconNumber: 8, label: 'Post-Surgery Recovery' }
            ].map((useCase, index) => (
              <motion.div 
                key={index}
                className="p-4 bg-gray-900/30 border border-gray-800 rounded-xl hover:border-gray-700 transition-all duration-300 text-center cursor-pointer"
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ 
                  duration: 0.4, 
                  delay: index * 0.05,
                  ease: [0.22, 1, 0.36, 1]
                }}
                whileHover={{ 
                  scale: 1.05,
                  boxShadow: "0 10px 30px rgba(0,0,0,0.3)"
                }}
              >
                <motion.div 
                  className="w-6 h-6 mx-auto mb-2 flex items-center justify-center"
                  whileHover={{ rotate: 360 }}
                  transition={{ duration: 0.6 }}
                >
                  <Image
                    src={`/conditionIcons/${useCase.iconNumber}.png`}
                    alt={useCase.label}
                    width={24}
                    height={24}
                    className="w-6 h-6 object-contain filter invert"
                  />
                </motion.div>
                <div className="text-sm text-gray-400">{useCase.label}</div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Security emphasis */}
        <div className="text-center">
          <div className="inline-flex items-center gap-3 px-6 py-3 bg-gray-900/50 border border-gray-800 rounded-full">
            <svg className="w-5 h-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <span className="text-gray-300">
              Your photos are encrypted and stored securely • HIPAA compliant
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}