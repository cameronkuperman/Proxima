'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import { Heart, Sparkles, Camera, Shield, Brain, Activity, ChevronRight, Waves } from 'lucide-react';

// Organic color palette
const colors = {
  cyan: '#00D4FF',
  teal: '#00B8D4',
  aqua: '#00E5FF',
  purple: '#B388FF',
  pink: '#FF80AB',
  lime: '#CCFF90',
};

// Blob Shape Generator
const BlobShape = ({ color, size = 400, className = '', animate = true }: any) => {
  const points = useRef([
    { x: 0.5, y: 0.1 },
    { x: 0.9, y: 0.3 },
    { x: 0.8, y: 0.7 },
    { x: 0.5, y: 0.9 },
    { x: 0.2, y: 0.7 },
    { x: 0.1, y: 0.3 },
  ]);
  
  const createPath = () => {
    const p = points.current;
    return `M ${p[0].x * size} ${p[0].y * size}
            C ${p[0].x * size} ${p[0].y * size}, ${p[1].x * size} ${p[1].y * size}, ${p[1].x * size} ${p[1].y * size}
            C ${p[1].x * size} ${p[1].y * size}, ${p[2].x * size} ${p[2].y * size}, ${p[2].x * size} ${p[2].y * size}
            C ${p[2].x * size} ${p[2].y * size}, ${p[3].x * size} ${p[3].y * size}, ${p[3].x * size} ${p[3].y * size}
            C ${p[3].x * size} ${p[3].y * size}, ${p[4].x * size} ${p[4].y * size}, ${p[4].x * size} ${p[4].y * size}
            C ${p[4].x * size} ${p[4].y * size}, ${p[5].x * size} ${p[5].y * size}, ${p[5].x * size} ${p[5].y * size}
            C ${p[5].x * size} ${p[5].y * size}, ${p[0].x * size} ${p[0].y * size}, ${p[0].x * size} ${p[0].y * size}Z`;
  };
  
  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className={className}
    >
      <defs>
        <linearGradient id={`gradient-${color}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={colors[color as keyof typeof colors]} stopOpacity="0.8" />
          <stop offset="100%" stopColor={colors.purple} stopOpacity="0.4" />
        </linearGradient>
        <filter id="goo">
          <feGaussianBlur in="SourceGraphic" stdDeviation="10" result="blur" />
          <feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 19 -9" result="goo" />
        </filter>
      </defs>
      <motion.path
        d={createPath()}
        fill={`url(#gradient-${color})`}
        filter="url(#goo)"
        animate={animate ? {
          d: [
            createPath(),
            `M ${0.4 * size} ${0.2 * size}
             C ${0.6 * size} ${0.1 * size}, ${0.95 * size} ${0.4 * size}, ${0.85 * size} ${0.6 * size}
             C ${0.9 * size} ${0.8 * size}, ${0.6 * size} ${0.95 * size}, ${0.4 * size} ${0.85 * size}
             C ${0.3 * size} ${0.9 * size}, ${0.05 * size} ${0.6 * size}, ${0.15 * size} ${0.4 * size}
             C ${0.1 * size} ${0.2 * size}, ${0.3 * size} ${0.05 * size}, ${0.4 * size} ${0.2 * size}Z`,
            createPath(),
          ],
        } : {}}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
    </svg>
  );
};

// Gooey Button with Magnetic Effect
const GooeyButton = ({ children, primary = false, className = '', onClick = () => {} }: any) => {
  const ref = useRef<HTMLButtonElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  
  const handleMouse = (e: React.MouseEvent) => {
    if (!ref.current) return;
    const { clientX, clientY } = e;
    const { left, top, width, height } = ref.current.getBoundingClientRect();
    const x = (clientX - left - width / 2) * 0.15;
    const y = (clientY - top - height / 2) * 0.15;
    setPosition({ x, y });
  };
  
  return (
    <motion.button
      ref={ref}
      className={`relative px-8 py-4 rounded-full font-medium overflow-hidden ${className}`}
      onMouseMove={handleMouse}
      onMouseLeave={() => setPosition({ x: 0, y: 0 })}
      onClick={onClick}
      animate={{ x: position.x, y: position.y }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
    >
      <div className="absolute inset-0 rounded-full" style={{
        background: primary 
          ? `linear-gradient(135deg, ${colors.cyan} 0%, ${colors.purple} 100%)`
          : 'rgba(255, 255, 255, 0.1)',
        filter: 'blur(0px)',
      }} />
      <span className="relative z-10 text-white">{children}</span>
      
      {/* Liquid effect on hover */}
      <motion.div
        className="absolute inset-0 rounded-full"
        style={{
          background: `radial-gradient(circle at ${50 + position.x}% ${50 + position.y}%, ${colors.aqua}40 0%, transparent 50%)`,
        }}
      />
    </motion.button>
  );
};

// Floating Particle System
const ParticleField = () => {
  return (
    <div className="fixed inset-0 pointer-events-none">
      {[...Array(20)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-2 h-2 rounded-full"
          style={{
            background: `radial-gradient(circle, ${colors.cyan}40 0%, transparent 70%)`,
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
          }}
          animate={{
            y: [0, -30, 0],
            x: [0, Math.random() * 20 - 10, 0],
            opacity: [0, 1, 0],
          }}
          transition={{
            duration: Math.random() * 10 + 10,
            repeat: Infinity,
            delay: Math.random() * 5,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
};

// Liquid Card Component
const LiquidCard = ({ icon: Icon, title, description, delay = 0 }: any) => {
  const [isHovered, setIsHovered] = useState(false);
  
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="relative p-8 rounded-3xl overflow-hidden"
      style={{
        background: 'rgba(255, 255, 255, 0.05)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
      }}
    >
      {/* Morphing background */}
      <div className="absolute inset-0 opacity-30">
        <BlobShape color="cyan" size={300} animate={isHovered} />
      </div>
      
      {/* Content */}
      <div className="relative z-10">
        <motion.div
          className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
          style={{
            background: `linear-gradient(135deg, ${colors.cyan} 0%, ${colors.purple} 100%)`,
          }}
          animate={isHovered ? { rotate: 360 } : {}}
          transition={{ duration: 0.8 }}
        >
          <Icon className="w-7 h-7 text-white" />
        </motion.div>
        
        <h3 className="text-xl font-semibold text-white mb-2">{title}</h3>
        <p className="text-gray-300 text-sm leading-relaxed">{description}</p>
      </div>
      
      {/* Ripple effect */}
      <AnimatePresence>
        {isHovered && (
          <motion.div
            className="absolute inset-0 rounded-3xl"
            initial={{ scale: 0, opacity: 0.5 }}
            animate={{ scale: 2, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1 }}
            style={{
              background: `radial-gradient(circle, ${colors.aqua} 0%, transparent 70%)`,
            }}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// Wave Pattern
const WavePattern = () => (
  <svg className="w-full h-32" viewBox="0 0 1440 320" preserveAspectRatio="none">
    <motion.path
      fill={colors.cyan}
      fillOpacity="0.1"
      animate={{
        d: [
          "M0,192L60,176C120,160,240,128,360,138.7C480,149,600,203,720,213.3C840,224,960,192,1080,165.3C1200,139,1320,117,1380,106.7L1440,96L1440,320L1380,320C1320,320,1200,320,1080,320C960,320,840,320,720,320C600,320,480,320,360,320C240,320,120,320,60,320L0,320Z",
          "M0,224L60,213.3C120,203,240,181,360,181.3C480,181,600,203,720,224C840,245,960,267,1080,261.3C1200,256,1320,224,1380,208L1440,192L1440,320L1380,320C1320,320,1200,320,1080,320C960,320,840,320,720,320C600,320,480,320,360,320C240,320,120,320,60,320L0,320Z",
          "M0,192L60,176C120,160,240,128,360,138.7C480,149,600,203,720,213.3C840,224,960,192,1080,165.3C1200,139,1320,117,1380,106.7L1440,96L1440,320L1380,320C1320,320,1200,320,1080,320C960,320,840,320,720,320C600,320,480,320,360,320C240,320,120,320,60,320L0,320Z",
        ],
      }}
      transition={{
        duration: 10,
        repeat: Infinity,
        ease: "easeInOut",
      }}
    />
  </svg>
);

export default function V9OrganicFluid() {
  const { scrollY } = useScroll();
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  
  // Parallax layers
  const layer1Y = useTransform(scrollY, [0, 1000], [0, -200]);
  const layer2Y = useTransform(scrollY, [0, 1000], [0, -400]);
  const layer3Y = useTransform(scrollY, [0, 1000], [0, -600]);
  
  // Track mouse for liquid cursor
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-purple-950 overflow-hidden">
      <ParticleField />
      
      {/* Liquid Cursor */}
      <motion.div
        className="fixed w-6 h-6 rounded-full pointer-events-none z-50 mix-blend-screen"
        style={{
          background: `radial-gradient(circle, ${colors.cyan} 0%, transparent 70%)`,
          left: mousePosition.x - 12,
          top: mousePosition.y - 12,
        }}
        transition={{ type: "spring", damping: 10, stiffness: 100 }}
      />
      
      {/* Background Blobs */}
      <div className="fixed inset-0">
        <motion.div 
          className="absolute top-0 -right-32 opacity-20"
          style={{ y: layer1Y }}
        >
          <BlobShape color="purple" size={600} />
        </motion.div>
        <motion.div 
          className="absolute bottom-0 -left-32 opacity-20"
          style={{ y: layer2Y }}
        >
          <BlobShape color="cyan" size={500} />
        </motion.div>
        <motion.div 
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-10"
          style={{ y: layer3Y }}
        >
          <BlobShape color="teal" size={800} />
        </motion.div>
      </div>
      
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-40 backdrop-blur-2xl bg-white/5">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <motion.div 
              className="flex items-center space-x-3"
              whileHover={{ scale: 1.05 }}
            >
              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-cyan-400 to-purple-500 flex items-center justify-center">
                <Heart className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-white">Seimeo</span>
            </motion.div>
            
            <div className="hidden md:flex items-center space-x-8">
              {['Features', 'Analysis', 'About', 'Contact'].map((item) => (
                <motion.a
                  key={item}
                  href={`#${item.toLowerCase()}`}
                  className="text-white/70 hover:text-white transition-colors"
                  whileHover={{ y: -2 }}
                >
                  {item}
                </motion.a>
              ))}
            </div>
            
            <GooeyButton primary>
              Get Started
            </GooeyButton>
          </div>
        </div>
      </nav>
      
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center px-6 pt-20">
        <div className="max-w-7xl mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            {/* Badge */}
            <motion.div
              className="inline-flex items-center px-4 py-2 rounded-full mb-6"
              style={{
                background: 'rgba(255, 255, 255, 0.1)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
              }}
              whileHover={{ scale: 1.05 }}
            >
              <Sparkles className="w-4 h-4 text-cyan-400 mr-2" />
              <span className="text-sm text-cyan-400">Fluid Health Intelligence</span>
            </motion.div>
            
            <h1 className="text-5xl lg:text-7xl font-bold mb-6 text-white">
              Health flows
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400">
                naturally here
              </span>
            </h1>
            
            <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto leading-relaxed">
              Experience health analysis that adapts to you. Organic interactions, 
              fluid insights, and intelligence that breathes with your needs.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <GooeyButton primary className="text-lg">
                <Waves className="inline mr-2" size={20} />
                Flow into Analysis
              </GooeyButton>
              
              <GooeyButton className="text-lg">
                <Camera className="inline mr-2" size={20} />
                Liquid Scan
              </GooeyButton>
            </div>
          </motion.div>
          
          {/* Floating Health Orbs */}
          <div className="absolute inset-0 pointer-events-none">
            {[Brain, Heart, Activity, Shield].map((Icon, i) => (
              <motion.div
                key={i}
                className="absolute"
                style={{
                  left: `${20 + i * 20}%`,
                  top: `${30 + (i % 2) * 30}%`,
                }}
                animate={{
                  y: [0, -30, 0],
                  x: [0, 10, -10, 0],
                }}
                transition={{
                  duration: 5 + i,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              >
                <div className="w-16 h-16 rounded-full bg-gradient-to-r from-cyan-400/20 to-purple-400/20 backdrop-blur-xl flex items-center justify-center">
                  <Icon className="w-8 h-8 text-white" />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
        
        {/* Wave separator */}
        <div className="absolute bottom-0 left-0 right-0">
          <WavePattern />
        </div>
      </section>
      
      {/* Features Section */}
      <section id="features" className="py-32 px-6 relative">
        <div className="max-w-7xl mx-auto">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl lg:text-5xl font-bold text-white mb-4">
              Features that flow with you
            </h2>
            <p className="text-xl text-gray-300">
              Every element designed to move, breathe, and adapt
            </p>
          </motion.div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <LiquidCard
              icon={Brain}
              title="Adaptive Intelligence"
              description="AI that morphs to understand your unique health patterns"
              delay={0}
            />
            
            <LiquidCard
              icon={Camera}
              title="Visual Flow"
              description="Photo analysis that sees beyond the surface"
              delay={0.1}
            />
            
            <LiquidCard
              icon={Activity}
              title="Living Timeline"
              description="Watch your health story unfold like water finding its path"
              delay={0.2}
            />
            
            <LiquidCard
              icon={Shield}
              title="Fluid Security"
              description="Protection that flows around your data seamlessly"
              delay={0.3}
            />
            
            <LiquidCard
              icon={Heart}
              title="Organic Insights"
              description="Health understanding that grows naturally from your input"
              delay={0.4}
            />
            
            <LiquidCard
              icon={Sparkles}
              title="Breathing Interface"
              description="UI that responds to your touch like water to movement"
              delay={0.5}
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
            className="relative p-16 rounded-[3rem] overflow-hidden"
            style={{
              background: 'rgba(255, 255, 255, 0.03)',
              backdropFilter: 'blur(40px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
            }}
          >
            {/* Animated background */}
            <div className="absolute inset-0 opacity-30">
              <BlobShape color="purple" size={600} />
            </div>
            
            <div className="relative z-10">
              <h2 className="text-4xl lg:text-5xl font-bold text-white mb-6">
                Let your health flow
              </h2>
              <p className="text-xl text-gray-300 mb-8">
                Join the fluid revolution in health understanding
              </p>
              
              <GooeyButton primary className="text-lg">
                Begin Your Flow <ChevronRight className="inline ml-1" size={20} />
              </GooeyButton>
            </div>
          </motion.div>
        </div>
      </section>
      
      {/* Footer with waves */}
      <footer className="relative pt-32 pb-12">
        <div className="absolute top-0 left-0 right-0 rotate-180">
          <WavePattern />
        </div>
        
        <div className="max-w-7xl mx-auto px-6 text-center relative">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-cyan-400 to-purple-500 flex items-center justify-center">
              <Heart className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-bold text-white">Seimeo</span>
          </div>
          
          <p className="text-sm text-gray-400">
            © 2024 Seimeo. Flowing forward.
          </p>
        </div>
      </footer>
    </div>
  );
}