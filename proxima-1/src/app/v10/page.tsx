'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Terminal, Activity, Database, Cpu, Zap, ChevronRight, AlertCircle, Power } from 'lucide-react';

// Retro color palette
const colors = {
  terminal: '#00FF41', // Matrix green
  cyan: '#00D4FF',
  amber: '#FFB000',
  red: '#FF0040',
  purple: '#FF00FF',
  background: '#000000',
};

// CRT Screen Effect Component
const CRTEffect = () => (
  <div className="fixed inset-0 pointer-events-none z-50">
    {/* Scanlines */}
    <div 
      className="absolute inset-0"
      style={{
        background: 'repeating-linear-gradient(0deg, rgba(0, 0, 0, 0.15), transparent 1px, transparent 2px, rgba(0, 0, 0, 0.15) 3px)',
      }}
    />
    
    {/* Screen curve effect */}
    <div 
      className="absolute inset-0"
      style={{
        background: 'radial-gradient(ellipse at center, transparent 0%, rgba(0, 0, 0, 0.4) 100%)',
      }}
    />
    
    {/* Chromatic aberration */}
    <div className="absolute inset-0 mix-blend-screen">
      <div className="absolute inset-0 opacity-50" style={{ background: 'radial-gradient(circle at 30% 50%, red 0%, transparent 50%)' }} />
      <div className="absolute inset-0 opacity-50" style={{ background: 'radial-gradient(circle at 70% 50%, cyan 0%, transparent 50%)' }} />
    </div>
    
    {/* Flicker */}
    <motion.div
      className="absolute inset-0 bg-white mix-blend-overlay"
      animate={{ opacity: [0, 0.03, 0] }}
      transition={{ duration: 0.1, repeat: Infinity, repeatDelay: Math.random() * 5 }}
    />
  </div>
);

// Terminal Text Component
const TerminalText = ({ children, delay = 0 }: any) => {
  const [displayText, setDisplayText] = useState('');
  const [showCursor, setShowCursor] = useState(true);
  
  useEffect(() => {
    const text = children.toString();
    let currentIndex = 0;
    
    const interval = setInterval(() => {
      if (currentIndex <= text.length) {
        setDisplayText(text.slice(0, currentIndex));
        currentIndex++;
      } else {
        clearInterval(interval);
        setTimeout(() => setShowCursor(false), 500);
      }
    }, 30);
    
    return () => clearInterval(interval);
  }, [children]);
  
  return (
    <span className="font-mono">
      {displayText}
      {showCursor && <span className="animate-pulse">_</span>}
    </span>
  );
};

// Glitch Text Effect
const GlitchText = ({ children }: any) => {
  const [glitch, setGlitch] = useState(false);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setGlitch(true);
      setTimeout(() => setGlitch(false), 200);
    }, 3000 + Math.random() * 3000);
    
    return () => clearInterval(interval);
  }, []);
  
  return (
    <span className="relative inline-block">
      <span className={glitch ? 'glitch' : ''}>{children}</span>
      {glitch && (
        <>
          <span className="absolute top-0 left-0 text-red-500 opacity-70" style={{ transform: 'translateX(-2px)' }}>
            {children}
          </span>
          <span className="absolute top-0 left-0 text-cyan-500 opacity-70" style={{ transform: 'translateX(2px)' }}>
            {children}
          </span>
        </>
      )}
    </span>
  );
};

// Boot Sequence Component
const BootSequence = ({ onComplete }: { onComplete: () => void }) => {
  const [lines, setLines] = useState<string[]>([]);
  const bootMessages = [
    'SEIMEO OS v2.0.24 INITIALIZING...',
    'Loading kernel modules... [OK]',
    'Scanning hardware... [OK]',
    'Initializing AI cores... [OK]',
    'Connecting to health matrix... [OK]',
    'Loading symptom database... [OK]',
    'Calibrating biometric sensors... [OK]',
    'System ready. Welcome to SEIMEO.',
  ];
  
  useEffect(() => {
    let currentLine = 0;
    const interval = setInterval(() => {
      if (currentLine < bootMessages.length) {
        setLines(prev => [...prev, bootMessages[currentLine]]);
        currentLine++;
      } else {
        clearInterval(interval);
        setTimeout(onComplete, 1000);
      }
    }, 300);
    
    return () => clearInterval(interval);
  }, []);
  
  return (
    <motion.div
      className="fixed inset-0 z-50 bg-black flex items-center justify-center"
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="w-full max-w-2xl p-8">
        <pre className="text-green-400 font-mono text-sm">
          {lines.map((line, i) => (
            <div key={i} className="mb-1">
              {line}
            </div>
          ))}
        </pre>
      </div>
    </motion.div>
  );
};

// Retro Button
const RetroButton = ({ children, primary = false, onClick = () => {} }: any) => (
  <motion.button
    onClick={onClick}
    className={`px-6 py-3 font-mono text-sm uppercase tracking-wider border-2 ${
      primary 
        ? `border-[${colors.terminal}] text-[${colors.terminal}] shadow-[0_0_20px_${colors.terminal}40]` 
        : 'border-cyan-400 text-cyan-400'
    } bg-black hover:bg-opacity-10 transition-all relative overflow-hidden group`}
    whileHover={{ scale: 1.05 }}
    whileTap={{ scale: 0.95 }}
    style={{
      borderColor: primary ? colors.terminal : colors.cyan,
      color: primary ? colors.terminal : colors.cyan,
      boxShadow: primary ? `0 0 20px ${colors.terminal}40` : `0 0 20px ${colors.cyan}40`,
    }}
  >
    <span className="relative z-10">{children}</span>
    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-0 group-hover:opacity-20 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
  </motion.button>
);

// Grid Background
const TronGrid = () => (
  <div className="fixed inset-0 pointer-events-none">
    <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
          <path d="M 50 0 L 0 0 0 50" fill="none" stroke={colors.cyan} strokeWidth="0.5" opacity="0.1"/>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#grid)" />
      
      {/* Perspective grid lines */}
      <line x1="50%" y1="100%" x2="30%" y2="0%" stroke={colors.cyan} strokeWidth="0.5" opacity="0.05"/>
      <line x1="50%" y1="100%" x2="70%" y2="0%" stroke={colors.cyan} strokeWidth="0.5" opacity="0.05"/>
    </svg>
  </div>
);

// ASCII Health Display
const ASCIIHealthDisplay = () => {
  const [pulse, setPulse] = useState(72);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setPulse(68 + Math.floor(Math.random() * 8));
    }, 1000);
    return () => clearInterval(interval);
  }, []);
  
  return (
    <pre className="text-green-400 font-mono text-xs leading-tight">
{`
╔════════════════════════╗
║   BIOMETRIC SCAN       ║
╠════════════════════════╣
║ PULSE: ${pulse} BPM         ║
║ TEMP:  98.6°F          ║
║ O2:    98%             ║
║ STATUS: ANALYZING...   ║
╚════════════════════════╝

     ♥ ♥ ♥ ♥ ♥ ♥
    ♥           ♥
   ♥  HEARTBEAT  ♥
   ♥   MONITOR   ♥
    ♥           ♥
     ♥ ♥ ♥ ♥ ♥
`}
    </pre>
  );
};

export default function V10RetroFuturistic() {
  const [booted, setBooted] = useState(false);
  const [commandInput, setCommandInput] = useState('');
  const [terminalHistory, setTerminalHistory] = useState<string[]>([]);
  
  // Handle command input
  const handleCommand = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && commandInput) {
      setTerminalHistory(prev => [...prev, `> ${commandInput}`, 'Command recognized. Redirecting to analysis...']);
      setCommandInput('');
    }
  };
  
  return (
    <>
      <AnimatePresence>
        {!booted && <BootSequence onComplete={() => setBooted(true)} />}
      </AnimatePresence>
      
      {booted && (
        <div className="min-h-screen bg-black text-green-400 font-mono overflow-hidden">
          <CRTEffect />
          <TronGrid />
          
          {/* Navigation Terminal */}
          <nav className="fixed top-0 w-full z-40 border-b border-green-400/30 bg-black/90 backdrop-blur-sm">
            <div className="max-w-7xl mx-auto px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  >
                    <Power className="w-6 h-6 text-green-400" />
                  </motion.div>
                  <GlitchText>SEIMEO://SYSTEM</GlitchText>
                </div>
                
                <div className="hidden md:flex items-center space-x-6 text-xs">
                  {['SCAN', 'ANALYZE', 'DATABASE', 'TERMINAL'].map((item) => (
                    <button
                      key={item}
                      className="hover:text-cyan-400 transition-colors relative group"
                    >
                      [{item}]
                      <span className="absolute bottom-0 left-0 w-0 h-px bg-cyan-400 group-hover:w-full transition-all duration-300" />
                    </button>
                  ))}
                </div>
                
                <RetroButton primary>
                  [INITIATE]
                </RetroButton>
              </div>
            </div>
          </nav>
          
          {/* Hero Section */}
          <section className="min-h-screen flex items-center justify-center px-6 pt-20">
            <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12">
              {/* Left Content */}
              <div>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5 }}
                >
                  {/* System Status */}
                  <div className="mb-8 text-xs opacity-70">
                    <TerminalText>SYSTEM STATUS: ONLINE</TerminalText>
                    <br />
                    <span className="text-cyan-400">NEURAL NET: ACTIVE</span>
                  </div>
                  
                  <h1 className="text-4xl lg:text-6xl mb-6 leading-tight">
                    <GlitchText>DIAGNOSTIC</GlitchText>
                    <br />
                    <span className="text-cyan-400">PROTOCOL</span>
                    <br />
                    <span className="text-amber-500">[ENGAGED]</span>
                  </h1>
                  
                  <div className="mb-8 p-4 border border-green-400/30 bg-black/50">
                    <p className="text-sm leading-relaxed text-green-300">
                      &gt; Advanced symptom analysis terminal
                      <br />
                      &gt; Neural network processing: ENABLED
                      <br />
                      &gt; Biometric scanning: READY
                      <br />
                      &gt; Medical database: CONNECTED
                    </p>
                  </div>
                  
                  {/* Command Input */}
                  <div className="mb-8">
                    <div className="flex items-center gap-2 p-3 border border-green-400/30 bg-black/50">
                      <span className="text-green-400">$</span>
                      <input
                        type="text"
                        value={commandInput}
                        onChange={(e) => setCommandInput(e.target.value)}
                        onKeyDown={handleCommand}
                        placeholder="Enter command..."
                        className="flex-1 bg-transparent outline-none text-green-400 placeholder-green-400/30"
                      />
                      <span className="animate-pulse">_</span>
                    </div>
                    
                    {/* Terminal History */}
                    {terminalHistory.length > 0 && (
                      <div className="mt-2 p-2 border border-green-400/30 bg-black/50 text-xs max-h-32 overflow-y-auto">
                        {terminalHistory.map((line, i) => (
                          <div key={i}>{line}</div>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex gap-4">
                    <RetroButton primary>
                      [RUN DIAGNOSTIC]
                    </RetroButton>
                    
                    <RetroButton>
                      [VIEW MATRIX]
                    </RetroButton>
                  </div>
                </motion.div>
              </div>
              
              {/* Right Content - ASCII Display */}
              <div className="flex items-center justify-center">
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                  className="relative"
                >
                  <ASCIIHealthDisplay />
                  
                  {/* Holographic Effect */}
                  <motion.div
                    className="absolute inset-0 pointer-events-none"
                    animate={{
                      opacity: [0.5, 1, 0.5],
                      scale: [1, 1.02, 1],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                  >
                    <div className="w-full h-full border border-cyan-400/20 transform rotate-3" />
                  </motion.div>
                </motion.div>
              </div>
            </div>
          </section>
          
          {/* Features Grid */}
          <section className="py-20 px-6">
            <div className="max-w-7xl mx-auto">
              <h2 className="text-3xl mb-12 text-center">
                <GlitchText>SYSTEM.CAPABILITIES</GlitchText>
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  { icon: Cpu, title: 'NEURAL.SCAN', desc: 'Deep learning analysis' },
                  { icon: Database, title: 'MED.DATABASE', desc: 'Vast symptom library' },
                  { icon: Activity, title: 'REALTIME.MONITOR', desc: 'Live health tracking' },
                  { icon: Zap, title: 'INSTANT.PROCESS', desc: 'Microsecond response' },
                  { icon: Terminal, title: 'CMD.INTERFACE', desc: 'Power user access' },
                  { icon: AlertCircle, title: 'ALERT.SYSTEM', desc: 'Critical notifications' },
                ].map((feature, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                    className="p-6 border border-green-400/30 bg-black/50 hover:border-cyan-400/50 transition-colors group"
                  >
                    <feature.icon className="w-8 h-8 mb-4 text-cyan-400 group-hover:text-green-400 transition-colors" />
                    <h3 className="text-sm mb-2">{feature.title}</h3>
                    <p className="text-xs opacity-70">{feature.desc}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          </section>
          
          {/* CTA Section */}
          <section className="py-20 px-6">
            <div className="max-w-4xl mx-auto text-center">
              <motion.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                className="p-12 border border-green-400 bg-black/50 relative overflow-hidden"
              >
                {/* Matrix rain effect */}
                <div className="absolute inset-0 opacity-10">
                  {[...Array(10)].map((_, i) => (
                    <motion.div
                      key={i}
                      className="absolute text-xs"
                      style={{ left: `${i * 10}%` }}
                      animate={{
                        y: [-100, 1000],
                      }}
                      transition={{
                        duration: 10,
                        repeat: Infinity,
                        delay: i * 0.5,
                        ease: "linear",
                      }}
                    >
                      {Array.from({ length: 50 }, () => Math.random() > 0.5 ? '1' : '0').join('')}
                    </motion.div>
                  ))}
                </div>
                
                <div className="relative z-10">
                  <h2 className="text-3xl mb-4">
                    <GlitchText>INITIALIZE.PROTOCOL</GlitchText>
                  </h2>
                  <p className="text-sm mb-8 opacity-70">
                    Connect to the health matrix. Begin analysis sequence.
                  </p>
                  
                  <RetroButton primary>
                    [JACK IN] <ChevronRight className="inline w-4 h-4" />
                  </RetroButton>
                </div>
              </motion.div>
            </div>
          </section>
          
          {/* Footer */}
          <footer className="py-8 px-6 border-t border-green-400/30">
            <div className="max-w-7xl mx-auto text-center text-xs opacity-50">
              <p>SEIMEO SYSTEMS © 2024 | TERMINAL v2.0.24 | STATUS: OPERATIONAL</p>
              <p className="mt-2">
                <span className="text-cyan-400">[ESC]</span> EXIT | 
                <span className="text-cyan-400"> [F1]</span> HELP | 
                <span className="text-cyan-400"> [↑↑↓↓←→←→BA]</span> ???
              </p>
            </div>
          </footer>
          
          <style jsx>{`
            @keyframes glitch {
              0%, 100% { transform: translateX(0); }
              20% { transform: translateX(-2px); }
              40% { transform: translateX(2px); }
              60% { transform: translateX(-1px); }
              80% { transform: translateX(1px); }
            }
            
            .glitch {
              animation: glitch 0.3s ease-in-out;
            }
          `}</style>
        </div>
      )}
    </>
  );
}