'use client';
import { motion } from 'framer-motion';

export default function HealthcarePros() {
  return (
    <section className="relative py-16 px-6 overflow-hidden" id="healthcare-pros">
      {/* Background */}
      <div className="absolute inset-0 bg-[#0f0f0f]" />
      
      {/* Gradient accent */}
      <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 via-transparent to-blue-500/5" />
      
      <div className="relative z-10 max-w-7xl mx-auto">
        {/* Header */}
        <motion.div 
          className="text-center mb-20"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          <p className="text-sm font-medium text-purple-400 mb-4 uppercase tracking-wider">
            Medical Advisors
          </p>
          <h2 className="text-4xl sm:text-5xl font-semibold text-white mb-4">
            Built with medical expertise
          </h2>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto">
            We&apos;re working with experienced physicians to build a platform that actually 
            understands how healthcare works in the real world.
          </p>
        </motion.div>
        
        {/* Advisors Grid */}
        <div className="grid md:grid-cols-2 gap-12 max-w-4xl mx-auto">
          {/* Dr. Lenny */}
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="relative bg-gray-900/30 border border-gray-800 rounded-2xl p-8 hover:border-gray-700 transition-all duration-300">
              <div className="flex items-start gap-6">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center text-3xl font-bold text-white">
                  LG
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-semibold text-white mb-2">Dr. Leonard Goldschmidt</h3>
                  <p className="text-purple-400 mb-4">M.D., J.D.</p>
                  <p className="text-gray-400 leading-relaxed">
Guides our medical-legal strategy and oversees our HIPAA compliance and privacy policies, ensuring we maintain patient trust while keeping their data secure.                  </p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Dr. Baidoo */}
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="relative bg-gray-900/30 border border-gray-800 rounded-2xl p-8 hover:border-gray-700 transition-all duration-300">
              <div className="flex items-start gap-6">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 flex items-center justify-center text-3xl font-bold text-white">
                  EB
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-semibold text-white mb-2">Dr. Edward Botse-Baidoo</h3>
                  <p className="text-blue-400 mb-4">M.D.</p>
                  <p className="text-gray-400 leading-relaxed">
                    Responsible for the clinical validation of our AI. He tests our platform’s medical reasoning and refines its system prompts to guarantee every analysis is accurate, safe, and effective.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Trust Statement */}
        <div className="mt-20 text-center">
          <div className="inline-flex flex-col sm:flex-row items-center gap-8 px-8 py-6 bg-gray-900/30 border border-gray-800 rounded-2xl">
            <div className="flex items-center gap-3">
              <svg className="w-6 h-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <span className="text-gray-300">Medically Reviewed</span>
            </div>
            <div className="flex items-center gap-3">
              <svg className="w-6 h-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-gray-300">Always Up-to-Date</span>
            </div>
            <div className="flex items-center gap-3">
              <svg className="w-6 h-6 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <span className="text-gray-300">Evidence-Based</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}