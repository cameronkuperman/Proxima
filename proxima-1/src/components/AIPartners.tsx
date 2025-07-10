'use client';
import Image from 'next/image';
import { motion } from 'framer-motion';

const partners = [
  {
    name: 'OpenAI',
    description: 'Best for visual analysis and general reasoning',
    models: ['o3', 'o3-mini', 'GPT-4', 'GPT-4o', 'GPT-4o-mini'],
    gradient: 'from-green-500/20 to-emerald-500/20',
    logo: (
      <Image
        src="/aiPartnerLogos/openai.png"
        alt="OpenAI"
        width={32}
        height={32}
        className="w-8 h-8 object-contain filter brightness-0 invert"
      />
    )
  },
  {
    name: 'Anthropic',
    description: 'Excellent for nuanced medical conversations',
    models: ['Claude 4 Opus', 'Claude 4 Sonnet', 'Claude 3.5 Haiku', '+ Reasoning'],
    gradient: 'from-orange-500/20 to-red-500/20',
    logo: (
      <Image
        src="/aiPartnerLogos/anthropic.png"
        alt="Anthropic"
        width={32}
        height={32}
        className="w-8 h-8 object-contain filter brightness-0 invert"
      />
    )
  },
  {
    name: 'Google',
    description: 'Great for complex analysis and deep thinking',
    models: ['Gemini 2.5 Pro', '2.5 Pro Deep Thinking', '2.5 Flash', '2.5 Flash Lite'],
    gradient: 'from-blue-500/20 to-cyan-500/20',
    logo: (
      <Image
        src="/aiPartnerLogos/google.png"
        alt="Google"
        width={32}
        height={32}
        className="w-8 h-8 object-contain filter brightness-0 invert"
      />
    )
  },
  {
    name: 'xAI',
    description: 'Fast and efficient for quick insights',
    models: ['Grok-4', 'Grok-4-Heavy (beta)', 'Grok-3', 'Grok-3 Mini'],
    gradient: 'from-purple-500/20 to-pink-500/20',
    logo: (
      <Image
        src="/aiPartnerLogos/XAI_Logo.svg.png"
        alt="xAI"
        width={40}
        height={40}
        className="w-10 h-10 object-contain filter brightness-0 invert"
      />
    )
  }
];

export default function AIPartners() {
  return (
    <section className="relative py-16 px-6 overflow-hidden" id="ai-partners">
      {/* Background */}
      <div className="absolute inset-0 bg-[#0a0a0a]" />
      
      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-purple-500/5 to-transparent" />
      
      <div className="relative z-10 max-w-7xl mx-auto">
        {/* Header */}
        <motion.div 
          className="text-center mb-20"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          <p className="text-sm font-medium text-purple-400 mb-4 uppercase tracking-wider">
            Powered by Industry Leaders
          </p>
          <h2 className="text-4xl sm:text-5xl font-semibold text-white mb-4">
            Choose the AI that works for you
          </h2>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto">
            We partner with the world's leading AI providers, giving you the freedom 
            to use whichever model you prefer for your health insights.
          </p>
        </motion.div>
        
        {/* Partners Grid */}
        <div className="grid md:grid-cols-2 gap-8 mb-16">
          {partners.map((partner, index) => (
            <motion.div
              key={partner.name}
              className="group relative"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ 
                duration: 0.5, 
                delay: index * 0.1,
                ease: [0.22, 1, 0.36, 1]
              }}
            >
              {/* Hover glow effect */}
              <div className={`absolute inset-0 bg-gradient-to-r ${partner.gradient} opacity-0 group-hover:opacity-10 rounded-2xl blur-xl transition-opacity duration-500`} />
              
              {/* Card */}
              <motion.div 
                className="relative bg-gray-900/30 border border-gray-800 rounded-2xl p-8 hover:border-gray-700 transition-all duration-300"
                whileHover={{ scale: 1.02, y: -5 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <div className="flex items-start gap-6">
                  <div className="text-gray-400 opacity-70">
                    {partner.logo}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-2xl font-semibold text-white mb-2">{partner.name}</h3>
                    <p className="text-sm text-gray-500 mb-4">{partner.description}</p>
                    <div className="flex flex-wrap gap-2">
                      {partner.models.map((model) => (
                        <span
                          key={model}
                          className="px-3 py-1 text-xs text-gray-400 bg-gray-800/50 border border-gray-700/50 rounded-full"
                        >
                          {model}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          ))}
        </div>
        
        {/* Bottom section */}
        <motion.div 
          className="text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
        >
          <motion.div 
            className="inline-flex items-center gap-3 px-6 py-3 bg-gray-900/50 border border-gray-800 rounded-full"
            whileHover={{ scale: 1.05 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <svg className="w-5 h-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            <span className="text-gray-300">
              HIPAA compliant • SOC 2 certified • End-to-end encryption
            </span>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}