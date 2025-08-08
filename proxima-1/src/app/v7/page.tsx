'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useAnimation } from 'framer-motion';
import { Heart, Brain, Camera, Shield, Zap, AlertTriangle, ArrowRight, Menu, X, Star, Activity, Eye, Clock } from 'lucide-react';
import Link from 'next/link';

// Neo-Brutalist Design System
const colors = {
  black: '#000000',
  white: '#FFFFFF',
  cyan: '#00D4FF',
  pink: '#FF0080',
  yellow: '#FFD93D',
  green: '#00FF88',
};

// Screen Shake Hook
const useScreenShake = () => {
  const controls = useAnimation();
  
  const shake = async () => {
    await controls.start({
      x: [0, -10, 10, -10, 10, 0],
      y: [0, 10, -10, 10, -10, 0],
      transition: { duration: 0.5 }
    });
  };
  
  return { shake, controls };
};

// Brutal Button Component
const BrutalButton = ({ children, color = 'cyan', onClick = () => {}, className = '' }: any) => {
  const [isPressed, setIsPressed] = useState(false);
  
  return (
    <motion.button
      className={`relative ${className}`}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      onMouseLeave={() => setIsPressed(false)}
      onClick={onClick}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <div
        className={`px-8 py-4 font-black text-black border-4 border-black transition-all ${
          isPressed ? 'translate-x-1 translate-y-1' : ''
        }`}
        style={{
          backgroundColor: colors[color as keyof typeof colors],
          boxShadow: isPressed ? 'none' : '8px 8px 0px #000',
        }}
      >
        {children}
      </div>
    </motion.button>
  );
};

// ASCII Art Medical Symbol
const ASCIIHeart = () => (
  <pre className="text-xs text-pink font-mono select-none opacity-20">
{`
    ♥♥♥♥♥♥♥♥♥♥♥♥♥♥♥♥
  ♥♥♥♥♥♥♥♥♥♥♥♥♥♥♥♥♥♥♥♥
 ♥♥♥♥♥♥♥♥♥♥♥♥♥♥♥♥♥♥♥♥♥♥
♥♥♥♥♥♥♥♥♥♥♥♥♥♥♥♥♥♥♥♥♥♥♥♥
♥♥♥♥♥♥♥♥♥♥♥♥♥♥♥♥♥♥♥♥♥♥♥♥
 ♥♥♥♥♥♥♥♥♥♥♥♥♥♥♥♥♥♥♥♥♥♥
  ♥♥♥♥♥♥♥♥♥♥♥♥♥♥♥♥♥♥♥♥
   ♥♥♥♥♥♥♥♥♥♥♥♥♥♥♥♥♥♥
    ♥♥♥♥♥♥♥♥♥♥♥♥♥♥♥♥
     ♥♥♥♥♥♥♥♥♥♥♥♥♥♥
      ♥♥♥♥♥♥♥♥♥♥♥♥
       ♥♥♥♥♥♥♥♥♥♥
        ♥♥♥♥♥♥♥♥
         ♥♥♥♥♥♥
          ♥♥♥♥
           ♥♥
            ♥
`}
  </pre>
);

// Brutal Card Component
const BrutalCard = ({ children, color = 'white', className = '', delay = 0 }: any) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay }}
      className={`relative ${className}`}
    >
      <div
        className="p-8 border-4 border-black"
        style={{
          backgroundColor: colors[color as keyof typeof colors],
          boxShadow: '12px 12px 0px #000',
        }}
      >
        {children}
      </div>
    </motion.div>
  );
};

// Hand-drawn underline
const Underline = () => (
  <svg
    className="absolute -bottom-2 left-0 w-full"
    height="20"
    viewBox="0 0 300 20"
    preserveAspectRatio="none"
  >
    <path
      d="M0,10 Q75,5 150,10 T300,10"
      stroke={colors.pink}
      strokeWidth="4"
      fill="none"
      strokeLinecap="round"
    />
  </svg>
);

// Noise Texture Overlay
const NoiseOverlay = () => (
  <div 
    className="fixed inset-0 pointer-events-none opacity-[0.03] z-50"
    style={{
      backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' /%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' /%3E%3C/svg%3E")`,
    }}
  />
);

export default function V7NeoBrutalist() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { shake, controls } = useScreenShake();
  const [cursorStyle, setCursorStyle] = useState('default');
  
  // Change cursor on body map hover
  useEffect(() => {
    document.body.style.cursor = cursorStyle === 'crosshair' ? 'crosshair' : 'default';
    return () => {
      document.body.style.cursor = 'default';
    };
  }, [cursorStyle]);
  
  return (
    <motion.div animate={controls} className="min-h-screen bg-white overflow-x-hidden">
      <NoiseOverlay />
      
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-40 bg-yellow border-b-4 border-black">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div 
                className="w-12 h-12 bg-pink border-4 border-black flex items-center justify-center"
                style={{ boxShadow: '4px 4px 0px #000' }}
              >
                <Heart className="w-6 h-6" />
              </div>
              <span className="font-black text-2xl">SEIMEO</span>
            </div>
            
            {/* Desktop Nav */}
            <div className="hidden md:flex items-center space-x-8">
              {['FEATURES', 'HOW IT WORKS', 'PRICING', 'ABOUT'].map((item) => (
                <button
                  key={item}
                  className="font-black hover:text-pink transition-colors relative group"
                  onClick={() => shake()}
                >
                  {item}
                  <span className="absolute -bottom-1 left-0 w-0 h-1 bg-pink group-hover:w-full transition-all duration-300" />
                </button>
              ))}
            </div>
            
            <div className="flex items-center space-x-4">
              <BrutalButton color="cyan" onClick={() => shake()}>
                GET STARTED →
              </BrutalButton>
              
              {/* Mobile Menu Button */}
              <button
                className="md:hidden"
                onClick={() => setMenuOpen(!menuOpen)}
              >
                {menuOpen ? <X size={32} /> : <Menu size={32} />}
              </button>
            </div>
          </div>
        </div>
      </nav>
      
      {/* Mobile Menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'tween', duration: 0.3 }}
            className="fixed right-0 top-20 h-full w-3/4 bg-cyan border-l-4 border-black z-30"
          >
            <div className="p-8 space-y-6">
              {['FEATURES', 'HOW IT WORKS', 'PRICING', 'ABOUT'].map((item) => (
                <button
                  key={item}
                  className="block font-black text-2xl hover:text-pink transition-colors"
                  onClick={() => {
                    setMenuOpen(false);
                    shake();
                  }}
                >
                  {item}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6 relative">
        <div className="absolute top-40 left-10 rotate-12">
          <ASCIIHeart />
        </div>
        
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Left Content */}
            <div>
              <motion.div
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5 }}
              >
                {/* Badge */}
                <div 
                  className="inline-block px-4 py-2 bg-green border-4 border-black mb-6"
                  style={{ boxShadow: '6px 6px 0px #000' }}
                >
                  <span className="font-black text-sm">✨ AI-POWERED HEALTH ✨</span>
                </div>
                
                <h1 className="font-black text-6xl lg:text-8xl mb-6 leading-none">
                  YOUR
                  <br />
                  <span className="relative inline-block">
                    SYMPTOMS
                    <Underline />
                  </span>
                  <br />
                  <span className="text-pink">DECODED</span>
                  <br />
                  <span className="font-mono text-4xl lg:text-5xl text-cyan">
                    {"<INSTANTLY/>"}
                  </span>
                </h1>
                
                <p className="text-xl mb-8 font-bold max-w-lg">
                  Point → Click → Understand. We're making health analysis 
                  <span className="bg-yellow px-2 mx-1">STUPIDLY SIMPLE</span>
                  with AI that actually works.
                </p>
                
                <div className="flex flex-col sm:flex-row gap-4">
                  <BrutalButton color="pink" onClick={() => shake()}>
                    START ANALYSIS NOW!!!
                  </BrutalButton>
                  
                  <BrutalButton color="cyan" onClick={() => shake()}>
                    <Camera className="inline mr-2" />
                    PHOTO SCAN
                  </BrutalButton>
                </div>
                
                {/* Trust Stats */}
                <div className="mt-12 flex items-center gap-6">
                  <div 
                    className="px-4 py-3 bg-white border-4 border-black"
                    style={{ boxShadow: '6px 6px 0px #000' }}
                  >
                    <span className="font-black text-2xl">50K+</span>
                    <span className="block text-sm font-bold">USERS</span>
                  </div>
                  
                  <div 
                    className="px-4 py-3 bg-yellow border-4 border-black"
                    style={{ boxShadow: '6px 6px 0px #000' }}
                  >
                    <div className="flex">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="w-5 h-5 fill-black" />
                      ))}
                    </div>
                    <span className="block text-sm font-bold">4.9 RATING</span>
                  </div>
                </div>
              </motion.div>
            </div>
            
            {/* Right Content - Interactive Body Map */}
            <div className="relative">
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                onMouseEnter={() => setCursorStyle('crosshair')}
                onMouseLeave={() => setCursorStyle('default')}
                className="relative"
              >
                <div 
                  className="w-full h-[500px] bg-cyan border-4 border-black flex items-center justify-center relative overflow-hidden"
                  style={{ boxShadow: '16px 16px 0px #000' }}
                  onClick={() => shake()}
                >
                  {/* ASCII Body */}
                  <pre className="font-mono text-xs select-none">
{`
      O
     /|\\
    / | \\
      |
     / \\
    /   \\
`}
                  </pre>
                  
                  {/* Floating Icons */}
                  {[Brain, Heart, Eye, Shield].map((Icon, i) => (
                    <motion.div
                      key={i}
                      className="absolute"
                      style={{
                        top: `${20 + i * 20}%`,
                        left: `${10 + i * 20}%`,
                      }}
                      animate={{
                        y: [0, -10, 0],
                        rotate: [0, 10, -10, 0],
                      }}
                      transition={{
                        duration: 3,
                        delay: i * 0.5,
                        repeat: Infinity,
                      }}
                    >
                      <div 
                        className="p-3 bg-pink border-4 border-black"
                        style={{ boxShadow: '6px 6px 0px #000' }}
                      >
                        <Icon className="w-6 h-6" />
                      </div>
                    </motion.div>
                  ))}
                  
                  <div className="absolute bottom-4 left-4 right-4">
                    <div className="bg-black text-white p-2 font-mono text-xs">
                      {'> CLICK ANYWHERE TO TARGET SYMPTOMS_'}
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Features Section */}
      <section className="py-20 px-6 bg-pink">
        <div className="max-w-7xl mx-auto">
          <motion.h2 
            className="font-black text-5xl lg:text-6xl mb-12 text-center"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            FEATURES THAT
            <br />
            <span className="bg-yellow px-4">ACTUALLY MATTER</span>
          </motion.h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <BrutalCard color="cyan" delay={0}>
              <Brain className="w-12 h-12 mb-4" />
              <h3 className="font-black text-2xl mb-2">SMART AF</h3>
              <p className="font-bold">
                AI that thinks harder than your doctor's Google searches
              </p>
            </BrutalCard>
            
            <BrutalCard color="yellow" delay={0.1}>
              <Camera className="w-12 h-12 mb-4" />
              <h3 className="font-black text-2xl mb-2">PHOTO MAGIC</h3>
              <p className="font-bold">
                Take a pic, get answers. It's literally that simple
              </p>
            </BrutalCard>
            
            <BrutalCard color="green" delay={0.2}>
              <Clock className="w-12 h-12 mb-4" />
              <h3 className="font-black text-2xl mb-2">TIME TRACKER</h3>
              <p className="font-bold">
                Watch your symptoms over time like a health stalker (but legal)
              </p>
            </BrutalCard>
            
            <BrutalCard color="white" delay={0.3}>
              <Shield className="w-12 h-12 mb-4" />
              <h3 className="font-black text-2xl mb-2">FORT KNOX SECURE</h3>
              <p className="font-bold">
                Your data is safer than your ex's Netflix password
              </p>
            </BrutalCard>
            
            <BrutalCard color="cyan" delay={0.4}>
              <Activity className="w-12 h-12 mb-4" />
              <h3 className="font-black text-2xl mb-2">REAL-TIME</h3>
              <p className="font-bold">
                Results faster than you can say "WebMD cancer diagnosis"
              </p>
            </BrutalCard>
            
            <BrutalCard color="yellow" delay={0.5}>
              <Zap className="w-12 h-12 mb-4" />
              <h3 className="font-black text-2xl mb-2">INSTANT EVERYTHING</h3>
              <p className="font-bold">
                No loading screens. We hate them as much as you do
              </p>
            </BrutalCard>
          </div>
        </div>
      </section>
      
      {/* How It Works */}
      <section className="py-20 px-6 bg-cyan">
        <div className="max-w-7xl mx-auto">
          <motion.h2 
            className="font-black text-5xl lg:text-6xl mb-12 text-center"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            HOW THIS
            <br />
            <span className="line-through">MAGIC</span> SCIENCE WORKS
          </motion.h2>
          
          <div className="space-y-8 max-w-3xl mx-auto">
            {[
              { num: "01", title: "CLICK THE DAMN BODY", desc: "Point to where it hurts. Yes, it's that easy." },
              { num: "02", title: "DESCRIBE YOUR MISERY", desc: "Tell us what's wrong in plain English (or emoji 🤒)" },
              { num: "03", title: "AI DOES ITS THING", desc: "Our robots analyze faster than House MD" },
              { num: "04", title: "GET ACTUAL ANSWERS", desc: "No medical jargon. Just what you need to know." },
            ].map((step, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: i % 2 === 0 ? -50 : 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="flex items-center gap-6"
              >
                <div 
                  className="w-20 h-20 bg-black text-white flex items-center justify-center font-black text-2xl"
                  style={{ boxShadow: '8px 8px 0px #FF0080' }}
                >
                  {step.num}
                </div>
                <div className="flex-1">
                  <h3 className="font-black text-2xl mb-1">{step.title}</h3>
                  <p className="font-bold">{step.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
      
      {/* CTA Section */}
      <section className="py-20 px-6 bg-yellow">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
          >
            <h2 className="font-black text-5xl lg:text-7xl mb-6">
              STOP GOOGLING
              <br />
              <span className="text-pink">START KNOWING</span>
            </h2>
            
            <p className="text-xl font-bold mb-8 max-w-2xl mx-auto">
              Join 50,000+ people who stopped panicking and started understanding their health
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <BrutalButton color="pink" onClick={() => shake()}>
                GET STARTED FREE!!!
              </BrutalButton>
              
              <BrutalButton color="white" onClick={() => shake()}>
                WATCH DEMO →
              </BrutalButton>
            </div>
            
            <p className="mt-6 font-bold text-sm">
              NO CREDIT CARD • NO BS • JUST ANSWERS
            </p>
          </motion.div>
        </div>
      </section>
      
      {/* Footer */}
      <footer className="py-12 px-6 bg-black text-white">
        <div className="max-w-7xl mx-auto text-center">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-pink border-2 border-white flex items-center justify-center">
              <Heart className="w-5 h-5 text-white" />
            </div>
            <span className="font-black text-xl">SEIMEO</span>
          </div>
          
          <p className="font-bold mb-4">
            Made with {"<3"} and AI • Not Medical Advice (duh)
          </p>
          
          <p className="text-xs opacity-50">
            © 2024 Seimeo. All rights reserved. Seriously.
          </p>
        </div>
      </footer>
    </motion.div>
  );
}