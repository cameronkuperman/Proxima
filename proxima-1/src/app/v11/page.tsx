'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, useScroll, useTransform, useSpring, AnimatePresence } from 'framer-motion';
import { Heart, Brain, Camera, Shield, Activity, Sparkles, ArrowRight, ChevronDown, Zap, Eye, Clock, TrendingUp } from 'lucide-react';

// Refined Color System
const colors = {
  primary: '#00D4FF',
  primaryDark: '#0095B8', 
  primaryLight: '#40E0FF',
  accent: '#FF00D4',
  dark: '#0A0A0B',
  gray: '#8B8B8D',
  white: '#FFFFFF',
};

// Smooth Button Component
const SmoothButton = ({ children, primary = false, className = '', onClick = () => {} }: any) => {
  const [isHovered, setIsHovered] = useState(false);
  
  return (
    <motion.button
      className={`relative px-8 py-4 rounded-full font-medium overflow-hidden transition-all ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      style={{
        background: primary 
          ? `linear-gradient(135deg, ${colors.primary}, ${colors.primaryDark})`
          : 'transparent',
        border: primary ? 'none' : '1px solid rgba(139, 139, 141, 0.3)',
      }}
    >
      {/* Subtle shimmer */}
      <motion.div
        className="absolute inset-0 rounded-full"
        style={{
          background: 'linear-gradient(105deg, transparent 40%, rgba(255, 255, 255, 0.3) 50%, transparent 60%)',
          opacity: 0,
        }}
        animate={{
          opacity: isHovered ? 1 : 0,
          x: isHovered ? '100%' : '-100%',
        }}
        transition={{ duration: 0.6 }}
      />
      
      <span className={`relative z-10 ${primary ? 'text-white' : 'text-gray-300'}`}>
        {children}
      </span>
    </motion.button>
  );
};

// Simple Health Orb
const HealthOrb = () => {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const orbRef = useRef<HTMLDivElement>(null);
  
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!orbRef.current) return;
    const rect = orbRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width - 0.5) * 10;
    const y = ((e.clientY - rect.top) / rect.height - 0.5) * -10;
    setMousePos({ x, y });
  };
  
  return (
    <motion.div
      ref={orbRef}
      className="relative w-72 h-72"
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setMousePos({ x: 0, y: 0 })}
      style={{
        transform: `perspective(1000px) rotateY(${mousePos.x}deg) rotateX(${mousePos.y}deg)`,
      }}
      whileHover={{ scale: 1.05 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
    >
      {/* Glow */}
      <motion.div
        className="absolute inset-0 rounded-full"
        style={{
          background: `radial-gradient(circle, rgba(0, 212, 255, 0.15) 0%, transparent 70%)`,
          filter: 'blur(40px)',
        }}
        animate={{
          scale: [1, 1.1, 1],
          opacity: [0.5, 0.7, 0.5],
        }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      />
      
      {/* Main orb */}
      <div
        className="absolute inset-8 rounded-full"
        style={{
          background: `radial-gradient(circle at 30% 30%, ${colors.primaryLight}, ${colors.primary}, ${colors.primaryDark})`,
          boxShadow: `
            inset -20px -20px 40px rgba(0, 0, 0, 0.5),
            inset 20px 20px 40px rgba(255, 255, 255, 0.1),
            0 0 60px rgba(0, 212, 255, 0.3)
          `,
        }}
      />
      
      {/* Icons */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="relative w-full h-full">
          {[Brain, Heart, Eye, Shield].map((Icon, i) => (
            <motion.div
              key={i}
              className="absolute w-10 h-10 rounded-full bg-white/10 backdrop-blur flex items-center justify-center"
              style={{
                left: '50%',
                top: '50%',
              }}
              animate={{
                x: Math.cos((i * Math.PI) / 2) * 100 - 20,
                y: Math.sin((i * Math.PI) / 2) * 100 - 20,
              }}
              transition={{
                duration: 20,
                repeat: Infinity,
                ease: "linear",
              }}
            >
              <Icon className="w-5 h-5 text-white/70" />
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

// Word Morphing
const MorphingWords = () => {
  const words = ['symptoms', 'health', 'wellness', 'vitals'];
  const [index, setIndex] = useState(0);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % words.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [words.length]);
  
  return (
    <AnimatePresence mode="wait">
      <motion.span
        key={words[index]}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.5 }}
        className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500"
      >
        {words[index]}
      </motion.span>
    </AnimatePresence>
  );
};

// Glass Card
const GlassCard = ({ children, icon: Icon, title, desc, delay = 0 }: any) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay }}
      whileHover={{ y: -5 }}
      className="relative p-8 rounded-2xl"
      style={{
        background: 'rgba(255, 255, 255, 0.03)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
      }}
    >
      <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-cyan-400/20 to-blue-500/20 flex items-center justify-center mb-4">
        <Icon className="w-6 h-6 text-cyan-400" />
      </div>
      <h3 className="text-xl font-semibold mb-2 text-white">{title}</h3>
      <p className="text-gray-400">{desc}</p>
    </motion.div>
  );
};

export default function V11RefinedOriginal() {
  const { scrollY } = useScroll();
  const smoothScrollY = useSpring(scrollY, { stiffness: 100, damping: 30 });
  
  const bgY = useTransform(smoothScrollY, [0, 1000], [0, -200]);
  const textY = useTransform(smoothScrollY, [0, 500], [0, -30]);
  
  return (
    <div className="min-h-screen bg-[#0A0A0B] text-white overflow-hidden">
      {/* Subtle gradient background */}
      <motion.div className="fixed inset-0" style={{ y: bgY }}>
        <div className="absolute inset-0 bg-gradient-to-b from-[#0A0A0B] via-[#0F0F10] to-[#0A0A0B]" />
        
        {/* Subtle orbs */}
        <motion.div
          className="absolute top-0 right-0 w-[800px] h-[800px] rounded-full"
          style={{
            background: `radial-gradient(circle, rgba(0, 212, 255, 0.05) 0%, transparent 50%)`,
            filter: 'blur(100px)',
          }}
          animate={{
            scale: [1, 1.1, 1],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
        />
        
        <motion.div
          className="absolute bottom-0 left-0 w-[600px] h-[600px] rounded-full"
          style={{
            background: `radial-gradient(circle, rgba(255, 0, 212, 0.03) 0%, transparent 50%)`,
            filter: 'blur(100px)',
          }}
          animate={{
            scale: [1, 1.15, 1],
          }}
          transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
        />
      </motion.div>
      
      {/* Navigation */}
      <motion.nav
        className="fixed top-0 w-full z-40 backdrop-blur-xl bg-black/30 border-b border-white/5"
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <motion.div className="flex items-center space-x-3" whileHover={{ scale: 1.05 }}>
              <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 flex items-center justify-center">
                <Heart className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-medium">Seimeo</span>
            </motion.div>
            
            <div className="hidden md:flex items-center space-x-8">
              {['Features', 'Analysis', 'About'].map((item) => (
                <a
                  key={item}
                  href={`#${item.toLowerCase()}`}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  {item}
                </a>
              ))}
            </div>
            
            <SmoothButton primary>
              Get Started
            </SmoothButton>
          </div>
        </div>
      </motion.nav>
      
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center px-6 pt-20">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Left Content */}
          <motion.div
            style={{ y: textY }}
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
          >
            <motion.div
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 backdrop-blur border border-white/10 mb-8"
              whileHover={{ scale: 1.05 }}
            >
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <span className="text-sm text-cyan-400">AI Health Intelligence</span>
            </motion.div>
            
            <h1 className="text-5xl lg:text-6xl font-bold mb-6 leading-tight">
              Understand your
              <br />
              <MorphingWords />
              <br />
              <span className="text-gray-400">instantly</span>
            </h1>
            
            <p className="text-xl text-gray-400 mb-8 leading-relaxed max-w-xl">
              Advanced symptom analysis powered by AI. Point, describe, and receive instant medical insights.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <SmoothButton primary className="text-lg">
                <Zap className="inline mr-2 w-5 h-5" />
                Start Analysis
              </SmoothButton>
              
              <SmoothButton className="text-lg">
                <Camera className="inline mr-2 w-5 h-5" />
                Try Photo Scan
              </SmoothButton>
            </div>
            
            {/* Stats */}
            <div className="flex items-center gap-8 mt-12">
              <div>
                <div className="text-2xl font-semibold text-cyan-400">50K+</div>
                <div className="text-sm text-gray-500">Active Users</div>
              </div>
              <div>
                <div className="text-2xl font-semibold text-cyan-400">98%</div>
                <div className="text-sm text-gray-500">Accuracy</div>
              </div>
              <div>
                <div className="text-2xl font-semibold text-cyan-400">&lt; 3s</div>
                <div className="text-sm text-gray-500">Response</div>
              </div>
            </div>
          </motion.div>
          
          {/* Right Content */}
          <motion.div
            className="flex items-center justify-center"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.3 }}
          >
            <HealthOrb />
          </motion.div>
        </div>
        
        {/* Scroll indicator */}
        <motion.div
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <ChevronDown className="w-6 h-6 text-gray-500" />
        </motion.div>
      </section>
      
      {/* Features Section */}
      <section id="features" className="py-32 px-6">
        <div className="max-w-7xl mx-auto">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl lg:text-5xl font-bold mb-4">
              Healthcare technology
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">
                perfected
              </span>
            </h2>
          </motion.div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <GlassCard
              icon={Brain}
              title="3D Body Mapping"
              desc="Interactive anatomical precision"
              delay={0}
            />
            <GlassCard
              icon={Activity}
              title="Real-time Analysis"
              desc="Instant AI-powered insights"
              delay={0.1}
            />
            <GlassCard
              icon={Camera}
              title="Visual Scanning"
              desc="Photo-based symptom detection"
              delay={0.2}
            />
            <GlassCard
              icon={Clock}
              title="Health Timeline"
              desc="Track symptoms over time"
              delay={0.3}
            />
            <GlassCard
              icon={Shield}
              title="Privacy First"
              desc="End-to-end encryption"
              delay={0.4}
            />
            <GlassCard
              icon={TrendingUp}
              title="Predictive Insights"
              desc="Anticipate health trends"
              delay={0.5}
            />
          </div>
        </div>
      </section>
      
      {/* CTA Section */}
      <section className="py-32 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="p-16 rounded-3xl bg-gradient-to-r from-cyan-500/10 to-blue-500/10 backdrop-blur border border-white/10"
          >
            <h2 className="text-4xl lg:text-5xl font-bold mb-6">
              Your health journey
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">
                starts here
              </span>
            </h2>
            
            <p className="text-xl text-gray-400 mb-8">
              Join thousands discovering clarity through AI health analysis
            </p>
            
            <SmoothButton primary className="text-lg">
              Get Started Free <Sparkles className="inline ml-2 w-5 h-5" />
            </SmoothButton>
          </motion.div>
        </div>
      </section>
      
      {/* Footer */}
      <footer className="py-12 px-6 border-t border-gray-800/50">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-cyan-400 to-blue-500 flex items-center justify-center">
              <Heart className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg">Seimeo</span>
          </div>
          
          <p className="text-sm text-gray-500">
            © 2024 Seimeo. Advanced health intelligence.
          </p>
        </div>
      </footer>
    </div>
  );
}