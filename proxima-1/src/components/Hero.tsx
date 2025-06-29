'use client';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import EmailSignupForm from "./EmailSignupForm";

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
      
      {/* Gradient orbs - Linear style */}
      <div className="absolute top-0 right-0 w-[800px] h-[800px] rounded-full bg-gradient-radial from-purple-500/10 via-purple-500/5 to-transparent blur-3xl" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] rounded-full bg-gradient-radial from-blue-500/10 via-blue-500/5 to-transparent blur-3xl" />
      
      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-6 pt-20">
        <div className="max-w-6xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 mb-8 text-sm text-gray-400 border border-gray-800 rounded-full bg-gray-900/50 backdrop-blur-sm">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-500"></span>
            </span>
            Early Access 2025
          </div>
          
          {/* Main heading with typing effect */}
          <h1 className="text-5xl sm:text-6xl md:text-7xl font-semibold text-white mb-6 tracking-tight">
           
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 min-h-[1.2em]">
              "{currentQuery}"
            </span>
          </h1>
          
          {/* Subtitle */}
          <p className="text-2xl sm:text-3xl text-gray-300 mb-6 max-w-3xl mx-auto leading-relaxed font-light">
            Point. Describe. Understand. A smarter way to track your symptoms.
          </p>
          
          <p className="text-lg sm:text-xl text-gray-400 mb-12 max-w-2xl mx-auto">
            The most advanced 3D body mapping meets conversational AI to help you understand what's happening with your health.
          </p>
          
          {/* CTA Section */}
          <div className="max-w-md mx-auto space-y-4">
            <EmailSignupForm />
            
            <button className="w-full px-8 py-4 text-gray-400 border border-gray-800 rounded-lg hover:bg-gray-900/50 hover:border-gray-700 transition-all duration-200 flex items-center justify-center gap-3 group">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Watch Demo
              <span className="text-gray-600 text-sm">(Coming Soon)</span>
            </button>
          </div>
          
          {/* Trust badges */}
          <div className="mt-16">
            {/* Top divider with fixed max width */}
            <div className="max-w-2xl mx-auto mb-16 border-t border-gray-800/50"></div>
            
            <p className="text-sm text-gray-500 mb-6">Powered by the world's best AI</p>
            <div className="flex items-center justify-center gap-10 opacity-30 mb-16">
              <Image
                src="/aiPartnerLogos/openai.png"
                alt="OpenAI"
                width={24}
                height={24}
                className="w-6 h-6 object-contain filter brightness-0 invert"
              />
              <Image
                src="/aiPartnerLogos/anthropic.png"
                alt="Anthropic"
                width={24}
                height={24}
                className="w-6 h-6 object-contain filter brightness-0 invert"
              />
              <Image
                src="/aiPartnerLogos/google.png"
                alt="Google"
                width={24}
                height={24}
                className="w-6 h-6 object-contain filter brightness-0 invert"
              />
              <Image
                src="/aiPartnerLogos/XAI_Logo.svg.png"
                alt="xAI"
                width={28}
                height={28}
                className="w-7 h-7 object-contain filter brightness-0 invert"
              />
            </div>
            
            {/* Bottom divider with fixed max width */}
            <div className="max-w-2xl mx-auto border-b border-gray-800/50"></div>
          </div>
        </div>
      </div>
      
      {/* Bottom gradient fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#0a0a0a] to-transparent" />
    </section>
  );
}