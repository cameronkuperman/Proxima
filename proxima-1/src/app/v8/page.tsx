'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, useScroll, useTransform, useInView } from 'framer-motion';
import { ArrowRight, Plus, Minus } from 'lucide-react';

// Swiss Design System - Mathematical Precision
const GRID_SIZE = 8; // Base unit for spacing
const COLUMN_COUNT = 12;

// Only 2 colors + black/white
const colors = {
  primary: '#00D4FF', // Original cyan
  black: '#000000',
  white: '#FFFFFF',
  gray: '#F5F5F5',
};

// Grid Background Component
const GridBackground = () => (
  <div className="fixed inset-0 pointer-events-none opacity-[0.02]">
    <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <pattern id="grid" width={GRID_SIZE * 4} height={GRID_SIZE * 4} patternUnits="userSpaceOnUse">
          <path d={`M ${GRID_SIZE * 4} 0 L 0 0 0 ${GRID_SIZE * 4}`} fill="none" stroke="#000" strokeWidth="0.5"/>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#grid)" />
    </svg>
  </div>
);

// Number Counter Component
const NumberCounter = ({ value, suffix = '' }: { value: number; suffix?: string }) => {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });
  
  useEffect(() => {
    if (isInView) {
      const interval = setInterval(() => {
        setCount(prev => {
          if (prev >= value) {
            clearInterval(interval);
            return value;
          }
          return prev + Math.ceil(value / 50);
        });
      }, 30);
      return () => clearInterval(interval);
    }
  }, [isInView, value]);
  
  return (
    <span ref={ref} className="tabular-nums">
      {count.toLocaleString()}{suffix}
    </span>
  );
};

// Swiss Button - Minimal with precision
const SwissButton = ({ children, primary = false, onClick = () => {} }: any) => (
  <motion.button
    onClick={onClick}
    className={`px-${GRID_SIZE * 4} py-${GRID_SIZE * 2} border transition-all ${
      primary 
        ? 'bg-black text-white border-black hover:bg-white hover:text-black' 
        : 'bg-white text-black border-black hover:bg-black hover:text-white'
    }`}
    whileHover={{ scale: 1.01 }}
    whileTap={{ scale: 0.99 }}
    style={{ 
      padding: `${GRID_SIZE * 2}px ${GRID_SIZE * 4}px`,
      borderWidth: '0.5px' 
    }}
  >
    <span className="font-light tracking-widest text-xs uppercase">
      {children}
    </span>
  </motion.button>
);

// Data Point Component
const DataPoint = ({ number, label, delay = 0 }: any) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });
  
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay }}
      className="text-center"
    >
      <div 
        className="font-light leading-none mb-4"
        style={{ fontSize: '120px' }}
      >
        <NumberCounter value={number} />
      </div>
      <div className="text-xs uppercase tracking-[0.3em] font-light">
        {label}
      </div>
    </motion.div>
  );
};

// Section Divider - Swiss Poster Style
const SectionDivider = ({ number, title }: { number: string; title: string }) => (
  <div className="relative py-32 my-32 border-t-[0.5px] border-black">
    <div className="absolute top-0 left-0 -translate-y-1/2 bg-white pr-8">
      <span className="text-xs font-light">{number}</span>
    </div>
    <h2 className="text-6xl font-light tracking-tight">{title}</h2>
  </div>
);

export default function V8SwissMinimalism() {
  const { scrollY } = useScroll();
  const [currentSection, setCurrentSection] = useState(0);
  
  // Parallax for hero numbers
  const heroY1 = useTransform(scrollY, [0, 500], [0, -50]);
  const heroY2 = useTransform(scrollY, [0, 500], [0, -100]);
  const heroY3 = useTransform(scrollY, [0, 500], [0, -150]);
  
  // Update section indicator
  useEffect(() => {
    const handleScroll = () => {
      const sections = document.querySelectorAll('section');
      sections.forEach((section, i) => {
        const rect = section.getBoundingClientRect();
        if (rect.top <= 100 && rect.bottom >= 100) {
          setCurrentSection(i);
        }
      });
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  
  return (
    <div className="min-h-screen bg-white text-black">
      <GridBackground />
      
      {/* Navigation - Ultra Minimal */}
      <nav className="fixed top-0 w-full z-50 bg-white border-b-[0.5px] border-black">
        <div className="px-16 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-2 h-2 rounded-full bg-primary mr-4" />
              <span className="font-light tracking-[0.2em] text-sm uppercase">Seimeo</span>
            </div>
            
            <div className="hidden md:flex items-center space-x-16">
              {['Analysis', 'Method', 'Data', 'Contact'].map((item, i) => (
                <button
                  key={item}
                  className={`text-xs uppercase tracking-[0.2em] font-light transition-opacity ${
                    currentSection === i ? 'opacity-100' : 'opacity-40'
                  }`}
                >
                  {item}
                </button>
              ))}
            </div>
            
            <SwissButton primary>
              Begin
            </SwissButton>
          </div>
        </div>
      </nav>
      
      {/* Hero Section - Pure Typography */}
      <section className="min-h-screen px-16 pt-32 pb-16 flex items-center">
        <div className="w-full max-w-7xl mx-auto">
          <div className="grid grid-cols-12 gap-8">
            <div className="col-span-8">
              <h1 className="font-light leading-none tracking-tight mb-12">
                <span className="text-8xl">Health</span>
                <br />
                <span className="text-8xl">Analysis</span>
                <br />
                <span className="text-8xl text-primary">Perfected</span>
              </h1>
              
              <div className="max-w-md">
                <p className="font-light text-sm leading-relaxed mb-8">
                  Precision medical intelligence. Three dimensional body mapping. 
                  Instantaneous symptom analysis. No complexity. Pure function.
                </p>
                
                <div className="flex items-center space-x-4">
                  <SwissButton primary>
                    Start Analysis
                  </SwissButton>
                  <button className="text-xs uppercase tracking-[0.2em] font-light underline underline-offset-4">
                    Learn More
                  </button>
                </div>
              </div>
            </div>
            
            {/* Floating Numbers */}
            <div className="col-span-4 relative">
              <motion.div 
                style={{ y: heroY1 }}
                className="absolute top-0 right-0 text-9xl font-light text-primary opacity-20"
              >
                01
              </motion.div>
              <motion.div 
                style={{ y: heroY2 }}
                className="absolute top-32 right-16 text-7xl font-light opacity-10"
              >
                98%
              </motion.div>
              <motion.div 
                style={{ y: heroY3 }}
                className="absolute top-64 right-8 text-6xl font-light text-primary opacity-15"
              >
                3D
              </motion.div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Data Section */}
      <section className="px-16 py-32 border-t-[0.5px] border-black">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-3 gap-16">
            <DataPoint number={50000} label="Active Users" delay={0} />
            <DataPoint number={98} label="Accuracy Rate %" delay={0.1} />
            <DataPoint number={3} label="Second Response" delay={0.2} />
          </div>
        </div>
      </section>
      
      {/* Method Section - Swiss Poster Style */}
      <section className="px-16 py-32">
        <div className="max-w-7xl mx-auto">
          <SectionDivider number="02" title="Method" />
          
          <div className="grid grid-cols-12 gap-8">
            <div className="col-span-3">
              <div className="sticky top-32">
                <div className="text-xs uppercase tracking-[0.3em] font-light mb-8 opacity-50">
                  Process
                </div>
                <div className="space-y-4">
                  {['Select', 'Describe', 'Analyze', 'Understand'].map((step, i) => (
                    <div key={step} className="flex items-center">
                      <div className="w-px h-8 bg-black mr-4" />
                      <span className="text-xs uppercase tracking-[0.2em] font-light">
                        {String(i + 1).padStart(2, '0')} {step}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="col-span-6">
              <div className="space-y-24">
                {[
                  {
                    title: 'Precision Selection',
                    desc: 'Three-dimensional anatomical mapping enables exact symptom localization with millimeter accuracy.',
                  },
                  {
                    title: 'Contextual Input',
                    desc: 'Natural language processing interprets symptom descriptions with medical-grade terminology extraction.',
                  },
                  {
                    title: 'Algorithmic Analysis',
                    desc: 'Multi-model artificial intelligence processes inputs through validated diagnostic pathways.',
                  },
                  {
                    title: 'Clear Output',
                    desc: 'Results presented in hierarchical information architecture optimized for comprehension.',
                  },
                ].map((item, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                  >
                    <h3 className="text-2xl font-light mb-4">{item.title}</h3>
                    <p className="font-light text-sm leading-relaxed opacity-70">
                      {item.desc}
                    </p>
                  </motion.div>
                ))}
              </div>
            </div>
            
            <div className="col-span-3">
              {/* Visual Element - Abstract representation */}
              <div className="sticky top-32">
                <div className="relative w-full aspect-square">
                  <div className="absolute inset-0 border-[0.5px] border-black" />
                  <div className="absolute inset-4 border-[0.5px] border-black opacity-50" />
                  <div className="absolute inset-8 border-[0.5px] border-black opacity-25" />
                  <div 
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-primary"
                    style={{ 
                      clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)' 
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Features Grid */}
      <section className="px-16 py-32 bg-gray">
        <div className="max-w-7xl mx-auto">
          <SectionDivider number="03" title="Capabilities" />
          
          <div className="grid grid-cols-12 gap-px bg-black">
            {[
              'Body Mapping',
              'Photo Analysis', 
              'Time Tracking',
              'AI Processing',
              'Report Generation',
              'Data Security',
            ].map((feature, i) => (
              <motion.div
                key={feature}
                className="col-span-4 bg-white p-16"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
              >
                <div className="flex items-start justify-between mb-8">
                  <span className="text-xs font-light opacity-50">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <Plus size={16} className="opacity-30" />
                </div>
                <h3 className="text-lg font-light">{feature}</h3>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
      
      {/* CTA Section */}
      <section className="px-16 py-32">
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="text-6xl font-light mb-8">Begin Analysis</h2>
          <p className="font-light text-sm mb-12 opacity-70">
            Immediate access. No complexity.
          </p>
          <SwissButton primary>
            Start Now <ArrowRight className="inline ml-2" size={14} />
          </SwissButton>
        </div>
      </section>
      
      {/* Footer */}
      <footer className="px-16 py-12 border-t-[0.5px] border-black">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center">
            <div className="w-2 h-2 rounded-full bg-primary mr-4" />
            <span className="font-light tracking-[0.2em] text-xs uppercase">Seimeo</span>
          </div>
          
          <div className="flex items-center space-x-8">
            <span className="text-xs font-light opacity-50">© 2024</span>
            <span className="text-xs font-light opacity-50">Privacy</span>
            <span className="text-xs font-light opacity-50">Terms</span>
          </div>
        </div>
      </footer>
      
      {/* Section Indicator */}
      <div className="fixed right-8 top-1/2 -translate-y-1/2 z-40">
        <div className="space-y-2">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className={`w-px h-8 transition-all ${
                currentSection === i ? 'bg-black' : 'bg-black opacity-20'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}