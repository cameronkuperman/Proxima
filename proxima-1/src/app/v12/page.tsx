'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { motion, useScroll, useTransform, useSpring, useMotionValue, AnimatePresence, useInView, useAnimationControls } from 'framer-motion';
import { Heart, Brain, Camera, Shield, Activity, Sparkles, ArrowRight, ChevronDown, Zap, Eye, Clock, TrendingUp, Waves, Hexagon, Globe, Cpu } from 'lucide-react';

// Ultra Premium Color System with Dynamic Shades
const colors = {
  primary: '#00D4FF',
  primaryGlow: '#00E5FF',
  primaryDeep: '#007A99',
  accent: '#FF00D4',
  accentGlow: '#FF40E0',
  dark: '#050506',
  darkElevated: '#0A0A0C',
  light: '#FFFFFF',
  aurora: {
    cyan: '#00D4FF',
    purple: '#9D00FF',
    pink: '#FF00D4',
    blue: '#0080FF',
  },
};

// Premium Loading Animation
const PremiumLoader = () => {
  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 1, ease: [0.43, 0.13, 0.23, 0.96] }}
    >
      <div className="relative">
        {/* DNA Double Helix */}
        <svg width="200" height="200" viewBox="0 0 200 200">
          <defs>
            <linearGradient id="premium-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={colors.primary} />
              <stop offset="50%" stopColor={colors.accent} />
              <stop offset="100%" stopColor={colors.aurora.purple} />
            </linearGradient>
          </defs>
          
          {/* Helix strands */}
          {[...Array(20)].map((_, i) => (
            <motion.circle
              key={i}
              cx={100 + Math.sin((i * Math.PI) / 5) * 40}
              cy={i * 10}
              r="3"
              fill="url(#premium-gradient)"
              initial={{ opacity: 0, scale: 0 }}
              animate={{
                opacity: [0, 1, 1, 0],
                scale: [0, 1, 1, 0],
              }}
              transition={{
                duration: 2,
                delay: i * 0.05,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
          ))}
        </svg>
        
        <motion.div
          className="absolute inset-0 flex items-center justify-center"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5, duration: 0.5 }}
        >
          <h1 className="text-3xl font-thin tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400">
            SEIMEO
          </h1>
        </motion.div>
      </div>
    </motion.div>
  );
};

// Interactive Constellation Navigation
const ConstellationNav = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stars, setStars] = useState<Array<{ x: number; y: number; vx: number; vy: number }>>([]);
  const mousePos = useMotionValue({ x: 0, y: 0 });
  
  useEffect(() => {
    // Initialize stars
    const newStars = Array.from({ length: 50 }, () => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * 100,
      vx: (Math.random() - 0.5) * 0.5,
      vy: (Math.random() - 0.5) * 0.5,
    }));
    setStars(newStars);
  }, []);
  
  useEffect(() => {
    if (!canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;
    
    const animate = () => {
      ctx.clearRect(0, 0, canvasRef.current!.width, canvasRef.current!.height);
      
      // Draw connections
      stars.forEach((star, i) => {
        stars.slice(i + 1).forEach(otherStar => {
          const dist = Math.hypot(star.x - otherStar.x, star.y - otherStar.y);
          if (dist < 100) {
            ctx.beginPath();
            ctx.moveTo(star.x, star.y);
            ctx.lineTo(otherStar.x, otherStar.y);
            ctx.strokeStyle = `rgba(0, 212, 255, ${0.2 * (1 - dist / 100)})`;
            ctx.stroke();
          }
        });
        
        // Draw star
        ctx.beginPath();
        ctx.arc(star.x, star.y, 2, 0, Math.PI * 2);
        ctx.fillStyle = colors.primary;
        ctx.fill();
      });
      
      requestAnimationFrame(animate);
    };
    
    animate();
  }, [stars]);
  
  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none"
      width={typeof window !== 'undefined' ? window.innerWidth : 1920}
      height={100}
    />
  );
};

// Holographic Card with Depth
const HolographicCard = ({ children, className = '', delay = 0 }: any) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);
  const [glare, setGlare] = useState({ x: 50, y: 50 });
  
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    
    setRotateY((x - 50) / 3);
    setRotateX(-(y - 50) / 3);
    setGlare({ x, y });
  };
  
  const handleMouseLeave = () => {
    setRotateX(0);
    setRotateY(0);
    setGlare({ x: 50, y: 50 });
  };
  
  return (
    <motion.div
      ref={cardRef}
      className={`relative ${className}`}
      initial={{ opacity: 0, y: 50, rotateX: -15 }}
      whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.8, delay, ease: [0.43, 0.13, 0.23, 0.96] }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        transform: `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`,
        transformStyle: 'preserve-3d',
      }}
    >
      {/* Base layer */}
      <div
        className="absolute inset-0 rounded-3xl"
        style={{
          background: 'linear-gradient(135deg, rgba(0, 212, 255, 0.1), rgba(255, 0, 212, 0.05))',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
        }}
      />
      
      {/* Holographic effect */}
      <div
        className="absolute inset-0 rounded-3xl opacity-30"
        style={{
          background: `radial-gradient(circle at ${glare.x}% ${glare.y}%, ${colors.primaryGlow} 0%, transparent 50%)`,
        }}
      />
      
      {/* Rainbow shimmer */}
      <div
        className="absolute inset-0 rounded-3xl opacity-20"
        style={{
          background: `conic-gradient(from ${rotateY * 10}deg, #FF0080, #00D4FF, #FFD700, #00FF88, #FF0080)`,
          filter: 'blur(20px)',
        }}
      />
      
      {/* Content */}
      <div className="relative z-10 p-8">{children}</div>
      
      {/* 3D shadow */}
      <div
        className="absolute inset-0 rounded-3xl -z-10"
        style={{
          transform: 'translateZ(-50px) scale(0.9)',
          background: 'rgba(0, 0, 0, 0.5)',
          filter: 'blur(30px)',
        }}
      />
    </motion.div>
  );
};

// Liquid Fill Button
const LiquidButton = ({ children, primary = false, className = '', onClick = () => {} }: any) => {
  const [isHovered, setIsHovered] = useState(false);
  const [ripples, setRipples] = useState<Array<{ x: number; y: number; id: number }>>([]);
  
  const handleClick = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const newRipple = { x, y, id: Date.now() };
    setRipples([...ripples, newRipple]);
    setTimeout(() => {
      setRipples(prev => prev.filter(r => r.id !== newRipple.id));
    }, 1000);
    onClick();
  };
  
  return (
    <motion.button
      className={`relative px-10 py-5 rounded-full overflow-hidden ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleClick}
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
      transition={{ type: "spring", stiffness: 400, damping: 17 }}
    >
      {/* Base gradient */}
      <div
        className="absolute inset-0"
        style={{
          background: primary
            ? `linear-gradient(135deg, ${colors.primary}, ${colors.aurora.purple})`
            : 'transparent',
          border: primary ? 'none' : '1px solid rgba(255, 255, 255, 0.2)',
        }}
      />
      
      {/* Liquid fill effect */}
      <motion.div
        className="absolute inset-0"
        style={{
          background: `linear-gradient(180deg, transparent, ${colors.primaryGlow}40)`,
        }}
        initial={{ y: '100%' }}
        animate={{ y: isHovered ? '0%' : '100%' }}
        transition={{ duration: 0.5, ease: [0.43, 0.13, 0.23, 0.96] }}
      />
      
      {/* Wave effect */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none"
        style={{ transform: 'translateY(50%)' }}
      >
        <motion.path
          d="M0,50 Q150,30 300,50 T600,50 L600,100 L0,100 Z"
          fill={`${colors.primary}20`}
          animate={{
            d: [
              "M0,50 Q150,30 300,50 T600,50 L600,100 L0,100 Z",
              "M0,50 Q150,70 300,50 T600,50 L600,100 L0,100 Z",
              "M0,50 Q150,30 300,50 T600,50 L600,100 L0,100 Z",
            ],
          }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        />
      </svg>
      
      {/* Ripples */}
      <AnimatePresence>
        {ripples.map(ripple => (
          <motion.div
            key={ripple.id}
            className="absolute rounded-full"
            style={{
              left: ripple.x,
              top: ripple.y,
              background: 'radial-gradient(circle, rgba(255, 255, 255, 0.5) 0%, transparent 70%)',
            }}
            initial={{ width: 0, height: 0, x: 0, y: 0 }}
            animate={{ width: 300, height: 300, x: -150, y: -150 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1, ease: "easeOut" }}
          />
        ))}
      </AnimatePresence>
      
      <span className={`relative z-10 font-medium ${primary ? 'text-white' : 'text-gray-300'}`}>
        {children}
      </span>
    </motion.button>
  );
};

// Aurora Background Effect
const AuroraBackground = () => {
  return (
    <div className="fixed inset-0 overflow-hidden">
      {/* Aurora layers */}
      {Object.entries(colors.aurora).map(([name, color], i) => (
        <motion.div
          key={name}
          className="absolute inset-0"
          style={{
            background: `radial-gradient(ellipse at ${50 + i * 10}% ${50 - i * 10}%, ${color}15 0%, transparent 50%)`,
            filter: 'blur(60px)',
          }}
          animate={{
            x: [0, 100, -100, 0],
            y: [0, -100, 100, 0],
            scale: [1, 1.2, 0.8, 1],
          }}
          transition={{
            duration: 20 + i * 5,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}
      
      {/* Mesh gradient overlay */}
      <div
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage: `
            radial-gradient(at 27% 37%, ${colors.aurora.cyan} 0px, transparent 50%),
            radial-gradient(at 97% 21%, ${colors.aurora.purple} 0px, transparent 50%),
            radial-gradient(at 52% 99%, ${colors.aurora.pink} 0px, transparent 50%),
            radial-gradient(at 10% 29%, ${colors.aurora.blue} 0px, transparent 50%),
            radial-gradient(at 97% 96%, ${colors.primary} 0px, transparent 50%),
            radial-gradient(at 33% 50%, ${colors.accent} 0px, transparent 50%)
          `,
        }}
      />
    </div>
  );
};

// Sound Visualization (Visual Only)
const SoundWaves = () => {
  const bars = 20;
  
  return (
    <div className="flex items-center justify-center gap-1 h-12">
      {[...Array(bars)].map((_, i) => (
        <motion.div
          key={i}
          className="w-1 bg-gradient-to-t from-cyan-400 to-purple-400 rounded-full"
          animate={{
            height: [
              Math.random() * 30 + 10,
              Math.random() * 40 + 20,
              Math.random() * 30 + 10,
            ],
          }}
          transition={{
            duration: 0.5 + Math.random() * 0.5,
            repeat: Infinity,
            ease: "easeInOut",
            delay: i * 0.05,
          }}
        />
      ))}
    </div>
  );
};

// Interactive Health Sphere with WebGL-like Effects
const HealthSphere = () => {
  const sphereRef = useRef<HTMLDivElement>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const controls = useAnimationControls();
  
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!sphereRef.current) return;
    const rect = sphereRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
    const y = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
    setMousePos({ x, y });
  };
  
  return (
    <motion.div
      ref={sphereRef}
      className="relative w-96 h-96"
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setMousePos({ x: 0, y: 0 })}
      animate={controls}
    >
      {/* Outer shell */}
      <motion.div
        className="absolute inset-0 rounded-full"
        style={{
          background: `conic-gradient(from ${mousePos.x * 90}deg, ${colors.aurora.cyan}, ${colors.aurora.purple}, ${colors.aurora.pink}, ${colors.aurora.blue}, ${colors.aurora.cyan})`,
          filter: 'blur(40px)',
          transform: `rotate(${mousePos.x * 20}deg)`,
        }}
        animate={{
          scale: [1, 1.1, 1],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      
      {/* Glass sphere */}
      <div
        className="absolute inset-8 rounded-full"
        style={{
          background: `radial-gradient(circle at ${50 + mousePos.x * 20}% ${50 - mousePos.y * 20}%, ${colors.primaryGlow}40, ${colors.primary}20, transparent)`,
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          boxShadow: `
            inset ${-mousePos.x * 20}px ${mousePos.y * 20}px 40px rgba(0, 212, 255, 0.3),
            inset ${mousePos.x * 20}px ${-mousePos.y * 20}px 40px rgba(255, 0, 212, 0.3),
            0 0 100px ${colors.primary}40
          `,
          transform: `perspective(1000px) rotateY(${mousePos.x * 15}deg) rotateX(${-mousePos.y * 15}deg)`,
          transformStyle: 'preserve-3d',
        }}
      />
      
      {/* Inner core */}
      <motion.div
        className="absolute inset-24 rounded-full"
        style={{
          background: `radial-gradient(circle, ${colors.light}60 0%, ${colors.primaryGlow}40 50%, transparent 70%)`,
          filter: 'blur(10px)',
        }}
        animate={{
          scale: [0.8, 1, 0.8],
          opacity: [0.6, 1, 0.6],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      
      {/* Orbiting elements */}
      <div className="absolute inset-0">
        {[Brain, Heart, Eye, Shield, Activity, Cpu].map((Icon, i) => (
          <motion.div
            key={i}
            className="absolute"
            style={{
              left: '50%',
              top: '50%',
            }}
            animate={{
              x: Math.cos((Date.now() / 1000 + i * Math.PI / 3) % (Math.PI * 2)) * 150 - 20,
              y: Math.sin((Date.now() / 1000 + i * Math.PI / 3) % (Math.PI * 2)) * 150 - 20,
              z: Math.sin((Date.now() / 1000 + i * Math.PI / 3) % (Math.PI * 2)) * 50,
            }}
          >
            <motion.div
              className="w-14 h-14 rounded-2xl flex items-center justify-center"
              style={{
                background: `linear-gradient(135deg, ${colors.aurora[Object.keys(colors.aurora)[i % 4] as keyof typeof colors.aurora]}40, ${colors.dark}80)`,
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
              }}
              whileHover={{ scale: 1.2, rotate: 360 }}
              transition={{ duration: 0.5 }}
            >
              <Icon className="w-7 h-7 text-white" />
            </motion.div>
          </motion.div>
        ))}
      </div>
      
      {/* Interactive particles */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(30)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 rounded-full bg-white"
            style={{
              left: `${50 + (Math.random() - 0.5) * 80}%`,
              top: `${50 + (Math.random() - 0.5) * 80}%`,
            }}
            animate={{
              x: [0, mousePos.x * 20, 0],
              y: [0, mousePos.y * 20, 0],
              opacity: [0, 1, 0],
            }}
            transition={{
              duration: 2 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
          />
        ))}
      </div>
    </motion.div>
  );
};

// Dynamic Text with Gradient Animation
const DynamicText = ({ children }: { children: React.ReactNode }) => {
  return (
    <motion.span
      className="relative inline-block"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <span className="relative z-10 text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400">
        {children}
      </span>
      <motion.span
        className="absolute inset-0 text-transparent bg-clip-text bg-gradient-to-r from-pink-400 via-cyan-400 to-purple-400 blur-xl opacity-50"
        animate={{
          x: [0, 10, 0],
          y: [0, -10, 0],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        {children}
      </motion.span>
    </motion.span>
  );
};

export default function V12UltraPremium() {
  const [loading, setLoading] = useState(true);
  const { scrollY } = useScroll();
  const smoothScrollY = useSpring(scrollY, { stiffness: 50, damping: 15 });
  
  // Advanced parallax layers
  const bgY = useTransform(smoothScrollY, [0, 1000], [0, -500]);
  const midY = useTransform(smoothScrollY, [0, 1000], [0, -300]);
  const frontY = useTransform(smoothScrollY, [0, 1000], [0, -100]);
  
  useEffect(() => {
    setTimeout(() => setLoading(false), 2000);
  }, []);
  
  return (
    <>
      <AnimatePresence>
        {loading && <PremiumLoader />}
      </AnimatePresence>
      
      {!loading && (
        <div className="min-h-screen bg-black text-white overflow-hidden">
          <AuroraBackground />
          
          {/* Premium grain texture */}
          <div
            className="fixed inset-0 opacity-[0.02] pointer-events-none z-50 mix-blend-overlay"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='1.5' numOctaves='3' /%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.4'/%3E%3C/svg%3E")`,
            }}
          />
          
          {/* Navigation with constellation effect */}
          <motion.nav
            className="fixed top-0 w-full z-40"
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.43, 0.13, 0.23, 0.96] }}
            style={{
              background: 'rgba(5, 5, 6, 0.5)',
              backdropFilter: 'blur(40px) saturate(150%)',
              borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
            }}
          >
            <ConstellationNav />
            
            <div className="relative max-w-7xl mx-auto px-6 py-5">
              <div className="flex items-center justify-between">
                <motion.div
                  className="flex items-center space-x-4"
                  whileHover={{ scale: 1.05 }}
                >
                  <motion.div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center"
                    style={{
                      background: `conic-gradient(from 180deg, ${colors.aurora.cyan}, ${colors.aurora.purple}, ${colors.aurora.pink}, ${colors.aurora.blue}, ${colors.aurora.cyan})`,
                    }}
                    animate={{ rotate: 360 }}
                    transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                  >
                    <Heart className="w-6 h-6 text-white" />
                  </motion.div>
                  <span className="text-xl font-light tracking-wider">Seimeo</span>
                </motion.div>
                
                <div className="hidden md:flex items-center space-x-10">
                  {['Analysis', 'Technology', 'Vision', 'Connect'].map((item, i) => (
                    <motion.a
                      key={item}
                      href={`#${item.toLowerCase()}`}
                      className="relative text-gray-400 hover:text-white transition-colors"
                      initial={{ opacity: 0, y: -20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 + i * 0.1, ease: [0.43, 0.13, 0.23, 0.96] }}
                    >
                      {item}
                      <motion.div
                        className="absolute -bottom-2 left-0 h-[1px]"
                        style={{
                          background: `linear-gradient(90deg, ${colors.aurora.cyan}, ${colors.aurora.purple})`,
                        }}
                        initial={{ width: 0 }}
                        whileHover={{ width: '100%' }}
                        transition={{ duration: 0.3 }}
                      />
                    </motion.a>
                  ))}
                </div>
                
                <LiquidButton primary>
                  Experience <Sparkles className="inline ml-2 w-4 h-4" />
                </LiquidButton>
              </div>
            </div>
          </motion.nav>
          
          {/* Hero Section with Ultra Effects */}
          <section className="relative min-h-screen flex items-center justify-center px-6 pt-20">
            <motion.div style={{ y: bgY }} className="absolute inset-0">
              <SoundWaves />
            </motion.div>
            
            <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-20 items-center relative z-10">
              {/* Left Content */}
              <motion.div
                style={{ y: frontY }}
                initial={{ opacity: 0, x: -100 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 1, ease: [0.43, 0.13, 0.23, 0.96] }}
              >
                {/* Ultra Premium Badge */}
                <motion.div
                  className="inline-flex items-center gap-3 px-5 py-3 rounded-full mb-10"
                  style={{
                    background: 'rgba(255, 255, 255, 0.03)',
                    backdropFilter: 'blur(40px)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                  }}
                  whileHover={{ scale: 1.05, y: -2 }}
                >
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                  >
                    <Hexagon className="w-5 h-5 text-cyan-400" />
                  </motion.div>
                  <span className="text-sm font-light tracking-wide text-cyan-400">
                    Next-Gen Health Intelligence
                  </span>
                </motion.div>
                
                <h1 className="text-6xl lg:text-8xl font-thin mb-8 leading-tight tracking-tight">
                  The future of
                  <br />
                  <DynamicText>health analysis</DynamicText>
                  <br />
                  <span className="text-gray-500">is here</span>
                </h1>
                
                <p className="text-xl text-gray-400 mb-10 leading-relaxed max-w-xl font-light">
                  Experience healthcare reimagined through quantum-inspired AI, 
                  dimensional body mapping, and predictive health intelligence.
                </p>
                
                <div className="flex flex-col sm:flex-row gap-5">
                  <LiquidButton primary className="text-lg">
                    <Globe className="inline mr-2 w-5 h-5" />
                    Enter the Matrix
                  </LiquidButton>
                  
                  <LiquidButton className="text-lg">
                    <Waves className="inline mr-2 w-5 h-5" />
                    Quantum Scan
                  </LiquidButton>
                </div>
                
                {/* Live metrics with glow */}
                <motion.div
                  className="flex items-center gap-10 mt-14"
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1, ease: [0.43, 0.13, 0.23, 0.96] }}
                >
                  {[
                    { value: '99.9%', label: 'Accuracy' },
                    { value: '< 1s', label: 'Response' },
                    { value: '∞', label: 'Possibilities' },
                  ].map((stat, i) => (
                    <div key={i} className="text-center">
                      <motion.div
                        className="text-3xl font-thin mb-1"
                        style={{
                          textShadow: `0 0 30px ${colors.aurora[Object.keys(colors.aurora)[i] as keyof typeof colors.aurora]}`,
                        }}
                      >
                        {stat.value}
                      </motion.div>
                      <div className="text-xs text-gray-500 uppercase tracking-widest">
                        {stat.label}
                      </div>
                    </div>
                  ))}
                </motion.div>
              </motion.div>
              
              {/* Right Content - Ultra Sphere */}
              <motion.div
                style={{ y: midY }}
                className="flex items-center justify-center"
                initial={{ opacity: 0, scale: 0.5, rotate: -180 }}
                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                transition={{ duration: 1.5, delay: 0.5, ease: [0.43, 0.13, 0.23, 0.96] }}
              >
                <HealthSphere />
              </motion.div>
            </div>
            
            {/* Scroll indicator with pulse */}
            <motion.div
              className="absolute bottom-10 left-1/2 -translate-x-1/2"
              animate={{ y: [0, 15, 0] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
            >
              <motion.div
                className="w-12 h-12 rounded-full flex items-center justify-center"
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                }}
                whileHover={{ scale: 1.2 }}
              >
                <ChevronDown className="w-5 h-5 text-gray-400" />
              </motion.div>
            </motion.div>
          </section>
          
          {/* Features with Holographic Cards */}
          <section id="analysis" className="py-40 px-6 relative">
            <div className="max-w-7xl mx-auto">
              <motion.div
                className="text-center mb-20"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
              >
                <h2 className="text-5xl lg:text-6xl font-thin mb-6">
                  Capabilities beyond
                  <br />
                  <DynamicText>imagination</DynamicText>
                </h2>
                <p className="text-xl text-gray-400 font-light">
                  Where science fiction becomes medical reality
                </p>
              </motion.div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                {[
                  {
                    icon: Brain,
                    title: 'Quantum Analysis',
                    desc: 'Multi-dimensional symptom processing',
                    gradient: [colors.aurora.cyan, colors.aurora.purple],
                  },
                  {
                    icon: Activity,
                    title: 'Neural Synthesis',
                    desc: 'Real-time biometric intelligence',
                    gradient: [colors.aurora.purple, colors.aurora.pink],
                  },
                  {
                    icon: Eye,
                    title: 'Vision Matrix',
                    desc: 'Holographic body scanning',
                    gradient: [colors.aurora.pink, colors.aurora.blue],
                  },
                  {
                    icon: Cpu,
                    title: 'Infinity Core',
                    desc: 'Limitless processing power',
                    gradient: [colors.aurora.blue, colors.aurora.cyan],
                  },
                ].map((feature, i) => (
                  <HolographicCard key={i} delay={i * 0.1}>
                    <motion.div
                      className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6"
                      style={{
                        background: `linear-gradient(135deg, ${feature.gradient[0]}40, ${feature.gradient[1]}20)`,
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                      }}
                      whileHover={{ rotate: [0, 360], scale: 1.1 }}
                      transition={{ duration: 0.8 }}
                    >
                      <feature.icon className="w-8 h-8 text-white" />
                    </motion.div>
                    
                    <h3 className="text-2xl font-light mb-3">{feature.title}</h3>
                    <p className="text-gray-400 font-light">{feature.desc}</p>
                    
                    {/* Animated underline */}
                    <motion.div
                      className="mt-6 h-[1px]"
                      style={{
                        background: `linear-gradient(90deg, ${feature.gradient[0]}, ${feature.gradient[1]})`,
                      }}
                      initial={{ scaleX: 0 }}
                      whileInView={{ scaleX: 1 }}
                      viewport={{ once: true }}
                      transition={{ duration: 1, delay: 0.5 + i * 0.1 }}
                    />
                  </HolographicCard>
                ))}
              </div>
            </div>
          </section>
          
          {/* CTA Section */}
          <section className="py-40 px-6 relative">
            <div className="max-w-5xl mx-auto text-center">
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 1, ease: [0.43, 0.13, 0.23, 0.96] }}
                className="relative p-20 rounded-[3rem] overflow-hidden"
                style={{
                  background: 'rgba(255, 255, 255, 0.02)',
                  backdropFilter: 'blur(100px)',
                  border: '1px solid rgba(255, 255, 255, 0.05)',
                }}
              >
                {/* Animated mesh background */}
                <div className="absolute inset-0">
                  <motion.div
                    className="absolute inset-0"
                    style={{
                      backgroundImage: `
                        repeating-linear-gradient(0deg, ${colors.primary}10 0px, transparent 1px, transparent 40px, ${colors.primary}10 41px),
                        repeating-linear-gradient(90deg, ${colors.accent}10 0px, transparent 1px, transparent 40px, ${colors.accent}10 41px)
                      `,
                    }}
                    animate={{
                      x: [0, 40],
                      y: [0, 40],
                    }}
                    transition={{
                      duration: 10,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                  />
                </div>
                
                <div className="relative z-10">
                  <h2 className="text-5xl lg:text-6xl font-thin mb-8">
                    Begin your journey into
                    <br />
                    <DynamicText>tomorrow's healthcare</DynamicText>
                  </h2>
                  
                  <p className="text-xl text-gray-400 mb-12 max-w-3xl mx-auto font-light">
                    Join the evolution. Experience health intelligence that adapts, learns, and evolves with you.
                  </p>
                  
                  <LiquidButton primary className="text-lg">
                    Initialize Sequence <Zap className="inline ml-2 w-5 h-5" />
                  </LiquidButton>
                  
                  <p className="mt-8 text-sm text-gray-500 font-light">
                    Free quantum analysis • No temporal commitment required
                  </p>
                </div>
              </motion.div>
            </div>
          </section>
          
          {/* Footer */}
          <footer className="py-16 px-6 border-t border-white/5">
            <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between">
              <div className="flex items-center space-x-4 mb-6 md:mb-0">
                <motion.div
                  className="w-10 h-10 rounded-xl"
                  style={{
                    background: `conic-gradient(from 0deg, ${colors.aurora.cyan}, ${colors.aurora.purple}, ${colors.aurora.pink}, ${colors.aurora.blue}, ${colors.aurora.cyan})`,
                  }}
                  animate={{ rotate: 360 }}
                  transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                />
                <span className="text-lg font-light tracking-wider">Seimeo</span>
              </div>
              
              <p className="text-sm text-gray-500 font-light">
                © 2024 Seimeo. Transcending healthcare boundaries.
              </p>
            </div>
          </footer>
        </div>
      )}
    </>
  );
}