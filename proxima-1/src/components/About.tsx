'use client';
import { motion } from 'framer-motion';

export default function About() {
  return (
    <section id="about" className="relative py-16 px-6 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-[#0a0a0a]" />
      
      <motion.div 
        className="relative z-10 max-w-4xl mx-auto text-center"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      >
        {/* Header */}
        <p className="text-sm font-medium text-purple-400 mb-4 uppercase tracking-wider">
          About Seimeo-1
        </p>
        <h2 className="text-4xl sm:text-5xl font-semibold text-white mb-8">
          Healthcare reimagined
        </h2>
        
        <p className="text-xl text-gray-400 leading-relaxed mb-12">
          We believe everyone deserves to understand what&apos;s happening with their body. 
          That&apos;s why we&apos;re combining the latest in AI with intuitive design to create 
          a health companion that actually speaks your language.
        </p>
        
        {/* Mission Cards */}
        <div className="grid md:grid-cols-3 gap-6 mt-16">
          <motion.div 
            className="bg-gray-900/30 border border-gray-800 rounded-xl p-6 hover:border-gray-700 transition-all duration-300"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            whileHover={{ scale: 1.05, y: -5 }}
          >
            <div className="w-12 h-12 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mb-4 mx-auto">
              <svg className="w-6 h-6 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Global Access</h3>
            <p className="text-gray-400 text-sm">
              Breaking down barriers to quality healthcare, available 24/7 worldwide
            </p>
          </motion.div>
          
          <motion.div 
            className="bg-gray-900/30 border border-gray-800 rounded-xl p-6 hover:border-gray-700 transition-all duration-300"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            whileHover={{ scale: 1.05, y: -5 }}
          >
            <div className="w-12 h-12 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mb-4 mx-auto">
              <svg className="w-6 h-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Medical Accuracy</h3>
            <p className="text-gray-400 text-sm">
              Physician-reviewed, AI-powered insights you can trust
            </p>
          </motion.div>
          
          <motion.div 
            className="bg-gray-900/30 border border-gray-800 rounded-xl p-6 hover:border-gray-700 transition-all duration-300"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            whileHover={{ scale: 1.05, y: -5 }}
          >
            <div className="w-12 h-12 rounded-lg bg-green-500/10 border border-green-500/20 flex items-center justify-center mb-4 mx-auto">
              <svg className="w-6 h-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Privacy First</h3>
            <p className="text-gray-400 text-sm">
              Secure and encrypted with enterprise-grade privacy for your peace of mind
            </p>
          </motion.div>
        </div>
        
        {/* Team Note */}
        <motion.div 
          className="mt-20 p-8 bg-gray-900/30 border border-gray-800 rounded-2xl"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
        >
          <p className="text-gray-400 mb-6">
            Founded by a team passionate about making healthcare accessible to everyone, 
            Seimeo-1 combines cutting-edge AI technology with medical expertise to deliver 
            insights that matter.
          </p>
          <div className="flex items-center justify-center gap-4">
            <span className="text-sm text-gray-500">Coming 2025</span>
            <span className="text-gray-600">•</span>
            <span className="text-sm text-gray-500">Join the waitlist</span>
          </div>
        </motion.div>
      </motion.div>
    </section>
  );
}