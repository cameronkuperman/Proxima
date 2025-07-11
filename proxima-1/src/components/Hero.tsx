'use client';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import EmailSignupForm from "./EmailSignupForm";
import { staggerContainer } from '@/utils/animations';

const TYPING_QUERIES = [
  "Does this mole look suspicious?",
  "Why does my shoulder hurt?", 
  "Is this rash spreading?",
  "Could this be a skin infection?",
  "What's causing this chest pain?",
  "Should I be worried about this bump?"
];

export default function Hero() {
  const [currentQuery, setCurrentQuery] = useState('');
  const [queryIndex, setQueryIndex] = useState(0);
  const [isTyping, setIsTyping] = useState(true);
  const [charIndex, setCharIndex] = useState(0);

  useEffect(() => {
    const currentText = TYPING_QUERIES[queryIndex];
    
    if (isTyping) {
      if (charIndex < currentText.length) {
        const timeout = setTimeout(() => {
          setCurrentQuery(currentText.slice(0, charIndex + 1));
          setCharIndex(charIndex + 1);
        }, 50);
        return () => clearTimeout(timeout);
      } else {
        const timeout = setTimeout(() => {
          setIsTyping(false);
        }, 2000);
        return () => clearTimeout(timeout);
      }
    } else {
      if (charIndex > 0) {
        const timeout = setTimeout(() => {
          setCurrentQuery(currentText.slice(0, charIndex - 1));
          setCharIndex(charIndex - 1);
        }, 30);
        return () => clearTimeout(timeout);
      } else {
        setQueryIndex((prev) => (prev + 1) % TYPING_QUERIES.length);
        setIsTyping(true);
      }
    }
  }, [charIndex, isTyping, queryIndex]);

  return (
    <section className="relative w-full min-h-screen overflow-hidden bg-[#0a0a0a]" id="home">
      {/* Subtle gradient background */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0a] via-[#0f0f0f] to-[#0a0a0a]" />
      
      {/* Subtle grid pattern */}
      <div 
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 1px)`,
          backgroundSize: '40px 40px'
        }}
      />
      
      {/* Gradient orbs - Linear style with breathing animation */}
      <motion.div 
        className="absolute top-0 right-0 w-[800px] h-[800px] rounded-full bg-gradient-radial from-purple-500/10 via-purple-500/5 to-transparent blur-3xl"
        animate={{
          scale: [1, 1.1, 1],
          opacity: [0.5, 0.8, 0.5],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      <motion.div 
        className="absolute bottom-0 left-0 w-[600px] h-[600px] rounded-full bg-gradient-radial from-blue-500/10 via-blue-500/5 to-transparent blur-3xl"
        animate={{
          scale: [1, 1.15, 1],
          opacity: [0.5, 0.7, 0.5],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 1
        }}
      />
      
      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-6 pt-20">
        <motion.div 
          className="max-w-6xl mx-auto text-center"
          variants={staggerContainer}
          initial="initial"
          animate="animate"
        >
          {/* Badge */}
          <motion.div 
            className="inline-flex items-center gap-2 px-3 py-1 mb-8 text-sm text-gray-400 border border-gray-800 rounded-full bg-gray-900/50 backdrop-blur-sm"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-500"></span>
            </span>
            Early Access 2025
          </motion.div>
          
          {/* Main heading with typing effect */}
          <motion.h1 
            className="text-5xl sm:text-6xl md:text-7xl font-semibold text-white mb-6 tracking-tight"
            initial={{ opacity: 0, filter: "blur(10px)" }}
            animate={{ opacity: 1, filter: "blur(0px)" }}
            transition={{ duration: 0.8, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
          >
           
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 min-h-[1.2em]">
              {currentQuery}
            </span>
          </motion.h1>
          
          {/* Subtitle */}
          <motion.p 
            className="text-2xl sm:text-3xl text-gray-300 mb-12 max-w-3xl mx-auto leading-relaxed font-light"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6, ease: [0.22, 1, 0.36, 1] }}
          >
            Point. Describe. Understand. A smarter way to track your symptoms.
          </motion.p>
          
          
          {/* CTA Section */}
          <motion.div 
            className="max-w-md mx-auto space-y-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1, ease: [0.22, 1, 0.36, 1] }}
          >
            <EmailSignupForm />
            
            <motion.a
              href="https://www.youtube.com/watch?v=OT21T8Za0vs"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full px-8 py-4 text-gray-400 border border-gray-800 rounded-lg hover:bg-gray-900/50 hover:border-gray-700 transition-all duration-200 flex items-center justify-center gap-3 group"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Meet Proxima
            </motion.a>
          </motion.div>
          
          {/* Trust badges */}
          <div className="mt-16">
            {/* Top divider with fixed max width */}
            <div className="max-w-2xl mx-auto mb-16 border-t border-gray-800/50"></div>
            
            <motion.p 
              className="text-sm text-gray-500 mb-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 1.4 }}
            >
              Powered by the world&apos;s best AI
            </motion.p>
            <motion.div 
              className="flex items-center justify-center gap-10 opacity-30 mb-16"
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.3 }}
              transition={{ duration: 0.8, delay: 1.6 }}
            >
              {[
                { src: "/aiPartnerLogos/openai.png", alt: "OpenAI", size: 24 },
                { src: "/aiPartnerLogos/anthropic.png", alt: "Anthropic", size: 24 },
                { src: "/aiPartnerLogos/google.png", alt: "Google", size: 24 },
                { src: "/aiPartnerLogos/XAI_Logo.svg.png", alt: "xAI", size: 28 }
              ].map((logo, index) => (
                <motion.div
                  key={logo.alt}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ 
                    duration: 0.5, 
                    delay: 1.8 + (index * 0.1),
                    ease: [0.22, 1, 0.36, 1]
                  }}
                >
                  <Image
                    src={logo.src}
                    alt={logo.alt}
                    width={logo.size}
                    height={logo.size}
                    className={`${logo.size === 28 ? 'w-7 h-7' : 'w-6 h-6'} object-contain filter brightness-0 invert`}
                  />
                </motion.div>
              ))}
            </motion.div>
            
            {/* Bottom divider with fixed max width */}
            <div className="max-w-2xl mx-auto border-b border-gray-800/50"></div>
          </div>
        </motion.div>
      </div>
      
      {/* Bottom gradient fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#0a0a0a] to-transparent" />
    </section>
  );
}