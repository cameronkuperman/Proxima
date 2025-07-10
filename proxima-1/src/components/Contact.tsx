'use client';
import { motion } from 'framer-motion';
import EmailSignupForm from './EmailSignupForm';

export default function Contact() {
  return (
    <section id="contact" className="relative py-16 px-6 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-[#0f0f0f]" />
      
      {/* Gradient orb */}
      <motion.div 
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-gradient-radial from-purple-500/10 via-purple-500/5 to-transparent blur-3xl"
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.5, 0.8, 0.5],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      
      <motion.div 
        className="relative z-10 max-w-4xl mx-auto text-center"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      >
        {/* Header */}
        <p className="text-sm font-medium text-purple-400 mb-4 uppercase tracking-wider">
          Get Early Access
        </p>
        <h2 className="text-4xl sm:text-5xl font-semibold text-white mb-4">
          Join the waitlist
        </h2>
        <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-12">
          We&apos;re launching in late 2025/early 2026. Join thousands who are already on the list 
          for exclusive early access and special launch pricing.
        </p>

        {/* Email Form */}
        <div className="max-w-md mx-auto mb-16">
          <EmailSignupForm />
        </div>

        {/* Contact Options */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-8 mb-20">
          <a href="mailto:hello@proxima.health" className="flex items-center gap-3 text-gray-400 hover:text-white transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            hello@proxima.health
          </a>
          
          <span className="text-gray-600 hidden sm:block">•</span>
          
          <a href="sms:8434466154" className="flex items-center gap-3 text-gray-400 hover:text-white transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            843-446-6154
          </a>
        </div>

        {/* Footer */}
        <div className="pt-20 border-t border-gray-800">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="text-gray-500 text-sm">
              © 2025 Proxima-1. All rights reserved.
            </div>
            <div className="flex items-center gap-6 text-sm">
              <a href="#" className="text-gray-500 hover:text-gray-300 transition-colors">Privacy</a>
              <a href="#" className="text-gray-500 hover:text-gray-300 transition-colors">Terms</a>
              <a href="#" className="text-gray-500 hover:text-gray-300 transition-colors">HIPAA</a>
            </div>
          </div>
          
          <div className="mt-8 text-gray-600 text-xs text-center max-w-2xl mx-auto">
            This product is not intended to diagnose, treat, cure, or prevent any disease. 
            Always consult with a healthcare professional for medical advice.
          </div>
        </div>
      </motion.div>
    </section>
  );
}