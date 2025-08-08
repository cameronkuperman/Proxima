'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { motion, AnimatePresence, useScroll, useTransform, useSpring, useInView, MotionValue } from 'framer-motion';
import { ArrowRight, Sparkles, Shield, Brain, Camera, Activity, ChevronDown, Star, Check, Zap, Globe, Heart, Eye, Clock, TrendingUp, Award, Users, Cpu } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

// Custom Loading Component with DNA Helix
const DNALoader = () => {
  return (
    <motion.div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.8, ease: "easeInOut" }}
    >
      <div className="relative">
        {/* DNA Helix Animation */}
        <svg width="120" height="120" viewBox="0 0 120 120" className="animate-spin-slow">
          <defs>
            <linearGradient id="dna-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#00D4FF" stopOpacity="0.8" />
              <stop offset="50%" stopColor="#0EA5E9" stopOpacity="1" />
              <stop offset="100%" stopColor="#00D4FF" stopOpacity="0.8" />
            </linearGradient>
          </defs>
          {[...Array(8)].map((_, i) => (
            <motion.circle
              key={i}
              cx={60 + Math.cos((i * Math.PI) / 4) * 30}
              cy={60 + Math.sin((i * Math.PI) / 4) * 30}
              r="4"
              fill="url(#dna-gradient)"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ 
                scale: [0, 1.2, 1],
                opacity: [0, 1, 0.8],
              }}
              transition={{
                duration: 2,
                delay: i * 0.1,
                repeat: Infinity,
                repeatType: "reverse"
              }}
            />
          ))}
        </svg>
        <motion.div 
          className="absolute inset-0 flex items-center justify-center"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          <span className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
            Seimeo
          </span>
        </motion.div>
      </div>
    </motion.div>
  );
};

// Magnetic Button Component
const MagneticButton = ({ children, className = "", onClick = () => {} }: any) => {
  const ref = useRef<HTMLButtonElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  const handleMouse = (e: React.MouseEvent<HTMLButtonElement>) => {
    const { clientX, clientY } = e;
    const { width, height, left, top } = ref.current!.getBoundingClientRect();
    const x = (clientX - left - width / 2) * 0.2;
    const y = (clientY - top - height / 2) * 0.2;
    setPosition({ x, y });
  };

  const reset = () => setPosition({ x: 0, y: 0 });

  return (
    <motion.button
      ref={ref}
      onMouseMove={handleMouse}
      onMouseLeave={reset}
      animate={{ x: position.x, y: position.y }}
      transition={{ type: "spring", stiffness: 150, damping: 15 }}
      className={className}
      onClick={onClick}
    >
      {children}
    </motion.button>
  );
};

// Health Pulse Orb Component
const HealthPulseOrb = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const orbitRadius = 80;
  
  return (
    <motion.div 
      className="relative w-64 h-64 cursor-pointer"
      onClick={() => setIsExpanded(!isExpanded)}
      whileHover={{ scale: 1.05 }}
    >
      {/* Main Orb */}
      <motion.div 
        className="absolute inset-0 rounded-full"
        animate={{
          background: [
            "radial-gradient(circle, rgba(0,212,255,0.3) 0%, rgba(14,165,233,0.1) 50%, transparent 70%)",
            "radial-gradient(circle, rgba(0,212,255,0.5) 0%, rgba(14,165,233,0.2) 50%, transparent 70%)",
            "radial-gradient(circle, rgba(0,212,255,0.3) 0%, rgba(14,165,233,0.1) 50%, transparent 70%)",
          ]
        }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      />
      
      {/* Pulsing Core */}
      <motion.div 
        className="absolute inset-8 rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 blur-xl"
        animate={{ 
          scale: [1, 1.2, 1],
          opacity: [0.5, 0.8, 0.5]
        }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      />
      
      {/* Center Icon */}
      <div className="absolute inset-0 flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        >
          <Heart className="w-12 h-12 text-white" />
        </motion.div>
      </div>
      
      {/* Orbiting Elements */}
      {[Brain, Eye, Activity, Shield].map((Icon, i) => (
        <motion.div
          key={i}
          className="absolute w-8 h-8"
          style={{
            left: '50%',
            top: '50%',
          }}
          animate={{
            x: Math.cos((Date.now() / 1000 + i * Math.PI / 2) % (Math.PI * 2)) * orbitRadius - 16,
            y: Math.sin((Date.now() / 1000 + i * Math.PI / 2) % (Math.PI * 2)) * orbitRadius - 16,
          }}
          transition={{ duration: 0, repeat: Infinity }}
        >
          <Icon className="w-8 h-8 text-cyan-400" />
        </motion.div>
      ))}
      
      {/* Click Hint */}
      <motion.div 
        className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-xs text-gray-400"
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        Click to explore
      </motion.div>
    </motion.div>
  );
};

// Animated Text Morph Component
const MorphingText = () => {
  const conditions = [
    "mysterious headache",
    "persistent fatigue", 
    "skin irritation",
    "chest discomfort",
    "joint pain"
  ];
  
  const [index, setIndex] = useState(0);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % conditions.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [conditions.length]);
  
  return (
    <AnimatePresence mode="wait">
      <motion.span
        key={index}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.5 }}
        className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500"
      >
        {conditions[index]}
      </motion.span>
    </AnimatePresence>
  );
};

// Bento Grid Card Component
const BentoCard = ({ icon: Icon, title, description, className = "", delay = 0 }: any) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 50 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
      transition={{ duration: 0.5, delay }}
      whileHover={{ y: -5, transition: { duration: 0.2 } }}
      className={`relative p-8 rounded-2xl bg-gradient-to-br from-gray-900/50 to-gray-800/30 backdrop-blur-xl border border-gray-800 overflow-hidden group ${className}`}
    >
      {/* Gradient Overlay on Hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      
      {/* Content */}
      <div className="relative z-10">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 flex items-center justify-center mb-4">
          <Icon className="w-6 h-6 text-white" />
        </div>
        <h3 className="text-xl font-semibold text-white mb-2">{title}</h3>
        <p className="text-gray-400 text-sm leading-relaxed">{description}</p>
      </div>
      
      {/* Animated Border */}
      <motion.div
        className="absolute inset-0 rounded-2xl"
        initial={{ opacity: 0 }}
        whileHover={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        style={{
          background: 'linear-gradient(45deg, transparent 30%, rgba(0,212,255,0.5) 50%, transparent 70%)',
          backgroundSize: '200% 200%',
          animation: 'shimmer 3s infinite',
          pointerEvents: 'none'
        }}
      />
    </motion.div>
  );
};

// Floating Testimonial Card
const TestimonialCard = ({ name, role, content, rating, delay = 0 }: any) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });
  
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.5, delay }}
      className="p-6 rounded-2xl bg-gradient-to-br from-gray-900/80 to-gray-800/50 backdrop-blur-xl border border-gray-800"
    >
      <div className="flex mb-3">
        {[...Array(5)].map((_, i) => (
          <Star key={i} className={`w-4 h-4 ${i < rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-600'}`} />
        ))}
      </div>
      <p className="text-gray-300 mb-4 text-sm italic">"{content}"</p>
      <div>
        <p className="text-white font-semibold">{name}</p>
        <p className="text-gray-500 text-xs">{role}</p>
      </div>
    </motion.div>
  );
};

// Main Landing Page Component
export default function V6LandingPage() {
  const [isLoading, setIsLoading] = useState(true);
  const { scrollY } = useScroll();
  const smoothScrollY = useSpring(scrollY, { stiffness: 100, damping: 30 });
  
  // Parallax transforms
  const heroY = useTransform(smoothScrollY, [0, 500], [0, -100]);
  const heroOpacity = useTransform(smoothScrollY, [0, 300], [1, 0]);
  
  useEffect(() => {
    // Simulate loading
    setTimeout(() => setIsLoading(false), 2000);
  }, []);
  
  return (
    <>
      <AnimatePresence>
        {isLoading && <DNALoader />}
      </AnimatePresence>
      
      <div className="min-h-screen bg-black text-white overflow-x-hidden">
        {/* Animated Background Gradient */}
        <div className="fixed inset-0 opacity-30">
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/20 via-blue-500/10 to-purple-500/20 animate-gradient-shift" />
        </div>
        
        {/* Navigation */}
        <motion.nav 
          className="fixed top-0 w-full z-40 backdrop-blur-xl bg-black/50 border-b border-gray-800"
          initial={{ y: -100 }}
          animate={{ y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
            <motion.div 
              className="flex items-center space-x-2"
              whileHover={{ scale: 1.05 }}
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 flex items-center justify-center">
                <Heart className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold">Seimeo</span>
            </motion.div>
            
            <div className="hidden md:flex items-center space-x-8">
              {['Features', 'How it Works', 'AI Technology', 'About'].map((item, i) => (
                <motion.a
                  key={item}
                  href={`#${item.toLowerCase().replace(' ', '-')}`}
                  className="text-gray-300 hover:text-white transition-colors"
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 + i * 0.1 }}
                >
                  {item}
                </motion.a>
              ))}
            </div>
            
            <MagneticButton className="px-6 py-2.5 rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 text-white font-medium hover:shadow-lg hover:shadow-cyan-500/25 transition-shadow">
              Get Started
            </MagneticButton>
          </div>
        </motion.nav>
        
        {/* Hero Section */}
        <motion.section 
          className="relative min-h-screen flex items-center justify-center px-6 pt-20"
          style={{ y: heroY, opacity: heroOpacity }}
        >
          <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.8 }}
            >
              <motion.div
                className="inline-flex items-center px-3 py-1 rounded-full bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border border-cyan-500/30 mb-6"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 1 }}
              >
                <Sparkles className="w-4 h-4 text-cyan-400 mr-2" />
                <span className="text-sm text-cyan-400">AI-Powered Health Intelligence</span>
              </motion.div>
              
              <h1 className="text-5xl lg:text-7xl font-bold mb-6 leading-tight">
                Understand your{' '}
                <br />
                <MorphingText />
                <br />
                in seconds
              </h1>
              
              <p className="text-xl text-gray-400 mb-8 leading-relaxed">
                Point to where it hurts. Describe what you feel. Get instant AI analysis from the world's most advanced health models.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <MagneticButton className="px-8 py-4 rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 text-white font-medium text-lg hover:shadow-xl hover:shadow-cyan-500/25 transition-all flex items-center justify-center group">
                  Start Free Analysis
                  <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </MagneticButton>
                
                <MagneticButton className="px-8 py-4 rounded-full bg-white/10 backdrop-blur-xl text-white font-medium text-lg hover:bg-white/20 transition-all flex items-center justify-center">
                  <Camera className="mr-2 w-5 h-5" />
                  Try Photo Scan
                </MagneticButton>
              </div>
              
              {/* Trust Indicators */}
              <motion.div 
                className="flex items-center gap-6 mt-12"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.2 }}
              >
                <div className="flex -space-x-2">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="w-10 h-10 rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 border-2 border-black" />
                  ))}
                </div>
                <div>
                  <p className="text-sm text-gray-400">Trusted by 50,000+ users</p>
                  <div className="flex items-center">
                    <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                    <span className="text-sm text-white ml-1">4.9/5 rating</span>
                  </div>
                </div>
              </motion.div>
            </motion.div>
            
            {/* Right Content - Health Pulse Orb */}
            <motion.div
              className="flex items-center justify-center"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 1 }}
            >
              <HealthPulseOrb />
            </motion.div>
          </div>
          
          {/* Scroll Indicator */}
          <motion.div 
            className="absolute bottom-8 left-1/2 -translate-x-1/2"
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <ChevronDown className="w-6 h-6 text-gray-400" />
          </motion.div>
        </motion.section>
        
        {/* Features Bento Grid */}
        <section id="features" className="py-32 px-6">
          <div className="max-w-7xl mx-auto">
            <motion.div 
              className="text-center mb-16"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-4xl lg:text-5xl font-bold mb-4">
                Healthcare reimagined with AI
              </h2>
              <p className="text-xl text-gray-400">
                Every feature designed to give you clarity when you need it most
              </p>
            </motion.div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <BentoCard
                icon={Cpu}
                title="3D Body Mapping"
                description="Click exactly where you feel symptoms on an interactive 3D model for precise analysis"
                className="lg:col-span-2"
                delay={0}
              />
              
              <BentoCard
                icon={Brain}
                title="Deep AI Reasoning"
                description="Advanced models that think through your symptoms step-by-step"
                delay={0.1}
              />
              
              <BentoCard
                icon={Camera}
                title="Visual Analysis"
                description="Upload photos for instant AI assessment of visible symptoms"
                delay={0.2}
              />
              
              <BentoCard
                icon={Clock}
                title="Symptom Timeline"
                description="Track changes over time with intelligent pattern recognition"
                delay={0.3}
              />
              
              <BentoCard
                icon={Shield}
                title="Privacy First"
                description="Your health data encrypted and never shared without permission"
                delay={0.4}
              />
            </div>
          </div>
        </section>
        
        {/* AI Partners Section */}
        <section className="py-32 px-6 relative">
          <div className="max-w-7xl mx-auto">
            <motion.div 
              className="text-center mb-16"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-4xl lg:text-5xl font-bold mb-4">
                Powered by leaders in AI
              </h2>
              <p className="text-xl text-gray-400">
                We integrate the world's most advanced AI models for unmatched accuracy
              </p>
            </motion.div>
            
            {/* 3D Carousel Effect */}
            <div className="relative h-32 flex items-center justify-center overflow-hidden">
              <motion.div 
                className="flex items-center gap-12"
                animate={{ x: [0, -1000] }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              >
                {['OpenAI', 'Anthropic', 'Google AI', 'xAI', 'Meta AI', 'OpenAI', 'Anthropic', 'Google AI'].map((partner, i) => (
                  <div key={i} className="flex items-center justify-center px-8 py-4 rounded-xl bg-white/5 backdrop-blur-xl border border-white/10 whitespace-nowrap">
                    <span className="text-lg font-semibold text-white">{partner}</span>
                  </div>
                ))}
              </motion.div>
            </div>
          </div>
        </section>
        
        {/* Testimonials */}
        <section className="py-32 px-6">
          <div className="max-w-7xl mx-auto">
            <motion.div 
              className="text-center mb-16"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-4xl lg:text-5xl font-bold mb-4">
                Real stories, real results
              </h2>
            </motion.div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <TestimonialCard
                name="Sarah Chen"
                role="Software Engineer"
                content="Seimeo helped me identify my chronic headaches were actually from eye strain. The 3D body mapping is incredibly intuitive."
                rating={5}
                delay={0}
              />
              
              <TestimonialCard
                name="Marcus Rodriguez"
                role="Parent of Two"
                content="As a parent, having instant health insights gives me peace of mind. The photo analysis feature is a game-changer."
                rating={5}
                delay={0.1}
              />
              
              <TestimonialCard
                name="Emily Watson"
                role="Fitness Instructor"
                content="I track my recovery and minor injuries with Seimeo. The AI recommendations are spot-on and help me train smarter."
                rating={5}
                delay={0.2}
              />
            </div>
          </div>
        </section>
        
        {/* CTA Section */}
        <section className="py-32 px-6 relative">
          <div className="max-w-4xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="relative p-16 rounded-3xl bg-gradient-to-r from-cyan-500/20 to-blue-500/20 backdrop-blur-xl border border-cyan-500/30"
            >
              <h2 className="text-4xl lg:text-5xl font-bold mb-6">
                Your health journey starts here
              </h2>
              <p className="text-xl text-gray-300 mb-8">
                Join thousands who've discovered clarity through AI-powered health intelligence
              </p>
              
              <MagneticButton className="px-10 py-5 rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 text-white font-semibold text-lg hover:shadow-2xl hover:shadow-cyan-500/30 transition-all inline-flex items-center group">
                Get Started Free
                <Zap className="ml-2 w-5 h-5 group-hover:rotate-12 transition-transform" />
              </MagneticButton>
              
              <p className="mt-6 text-sm text-gray-400">
                No credit card required • 5 free analyses per month
              </p>
            </motion.div>
          </div>
        </section>
        
        {/* Footer */}
        <footer className="py-12 px-6 border-t border-gray-800">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-cyan-400 to-blue-500 flex items-center justify-center">
                <Heart className="w-4 h-4 text-white" />
              </div>
              <span className="text-lg font-bold">Seimeo</span>
            </div>
            
            <p className="text-sm text-gray-400">
              © 2024 Seimeo. All rights reserved. 
            </p>
          </div>
        </footer>
      </div>
      
      <style jsx>{`
        @keyframes shimmer {
          0% { background-position: 200% 200%; }
          100% { background-position: -200% -200%; }
        }
        
        @keyframes gradient-shift {
          0% { transform: rotate(0deg) scale(1); }
          50% { transform: rotate(180deg) scale(1.2); }
          100% { transform: rotate(360deg) scale(1); }
        }
        
        .animate-gradient-shift {
          animation: gradient-shift 20s ease infinite;
        }
        
        .animate-spin-slow {
          animation: spin 4s linear infinite;
        }
        
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </>
  );
}