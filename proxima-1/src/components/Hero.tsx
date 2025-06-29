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
          <div className="mt-16 pt-16 border-t border-gray-800/50">
            <p className="text-sm text-gray-500 mb-6">Powered by the world's best AI</p>
            <div className="flex items-center justify-center gap-10 opacity-30">
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                <path d="M22.282 9.821a5.985 5.985 0 0 0-.516-4.91 6.046 6.046 0 0 0-6.51-2.9A6.065 6.065 0 0 0 4.981 4.18a5.985 5.985 0 0 0-3.998 2.9 6.046 6.046 0 0 0 .743 7.097 5.98 5.98 0 0 0 .51 4.911 6.051 6.051 0 0 0 6.515 2.9A5.985 5.985 0 0 0 13.26 24a6.056 6.056 0 0 0 5.772-4.206 5.99 5.99 0 0 0 3.997-2.9 6.056 6.056 0 0 0-.747-7.073zM13.26 22.43a4.476 4.476 0 0 1-2.876-1.04l.141-.081 4.779-2.758a.795.795 0 0 0 .392-.681v-6.737l2.02 1.168a.071.071 0 0 1 .038.052v5.583a4.504 4.504 0 0 1-4.494 4.494zM3.6 18.304a4.47 4.47 0 0 1-.535-3.014l.142.085 4.783 2.759a.771.771 0 0 0 .78 0l5.843-3.369v2.332a.08.08 0 0 1-.033.062L9.74 19.95a4.5 4.5 0 0 1-6.14-1.646zM2.34 7.896a4.485 4.485 0 0 1 2.366-1.973V11.6a.766.766 0 0 0 .388.676l5.815 3.355-2.02 1.168a.076.076 0 0 1-.071 0l-4.83-2.786A4.504 4.504 0 0 1 2.34 7.872zm16.597 3.855l-5.833-3.387L15.119 7.2a.076.076 0 0 1 .071 0l4.83 2.791a4.494 4.494 0 0 1-.676 8.105v-5.678a.79.79 0 0 0-.407-.667zm2.01-3.023l-.141-.085-4.774-2.782a.776.776 0 0 0-.785 0L9.409 9.23V6.897a.066.066 0 0 1 .028-.061l4.83-2.787a4.5 4.5 0 0 1 6.68 4.66zm-12.64 4.135l-2.02-1.164a.08.08 0 0 1-.038-.057V6.075a4.5 4.5 0 0 1 7.375-3.453l-.142.08L8.704 5.46a.795.795 0 0 0-.393.681zm1.097-2.365l2.602-1.5 2.607 1.5v2.999l-2.597 1.5-2.607-1.5z"/>
              </svg>
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                <path d="M17.89 5.41l-5.41 14.18h-2.94L4.12 5.41h3.07l3.32 8.97h.06l3.33-8.97h3.07z"/>
              </svg>
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              <div className="font-bold text-xl">𝕏</div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Bottom gradient fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#0a0a0a] to-transparent" />
    </section>
  );
}