'use client';

const partners = [
  {
    name: 'OpenAI',
    description: 'Best for visual analysis and general reasoning',
    models: ['o3', 'o3-mini', 'GPT-4', 'GPT-4o', 'GPT-4o-mini'],
    gradient: 'from-green-500/20 to-emerald-500/20',
    logo: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8">
        <path d="M22.282 9.821a5.985 5.985 0 0 0-.516-4.91 6.046 6.046 0 0 0-6.51-2.9A6.065 6.065 0 0 0 4.981 4.18a5.985 5.985 0 0 0-3.998 2.9 6.046 6.046 0 0 0 .743 7.097 5.98 5.98 0 0 0 .51 4.911 6.051 6.051 0 0 0 6.515 2.9A5.985 5.985 0 0 0 13.26 24a6.056 6.056 0 0 0 5.772-4.206 5.99 5.99 0 0 0 3.997-2.9 6.056 6.056 0 0 0-.747-7.073zM13.26 22.43a4.476 4.476 0 0 1-2.876-1.04l.141-.081 4.779-2.758a.795.795 0 0 0 .392-.681v-6.737l2.02 1.168a.071.071 0 0 1 .038.052v5.583a4.504 4.504 0 0 1-4.494 4.494zM3.6 18.304a4.47 4.47 0 0 1-.535-3.014l.142.085 4.783 2.759a.771.771 0 0 0 .78 0l5.843-3.369v2.332a.08.08 0 0 1-.033.062L9.74 19.95a4.5 4.5 0 0 1-6.14-1.646zM2.34 7.896a4.485 4.485 0 0 1 2.366-1.973V11.6a.766.766 0 0 0 .388.676l5.815 3.355-2.02 1.168a.076.076 0 0 1-.071 0l-4.83-2.786A4.504 4.504 0 0 1 2.34 7.872zm16.597 3.855l-5.833-3.387L15.119 7.2a.076.076 0 0 1 .071 0l4.83 2.791a4.494 4.494 0 0 1-.676 8.105v-5.678a.79.79 0 0 0-.407-.667zm2.01-3.023l-.141-.085-4.774-2.782a.776.776 0 0 0-.785 0L9.409 9.23V6.897a.066.066 0 0 1 .028-.061l4.83-2.787a4.5 4.5 0 0 1 6.68 4.66zm-12.64 4.135l-2.02-1.164a.08.08 0 0 1-.038-.057V6.075a4.5 4.5 0 0 1 7.375-3.453l-.142.08L8.704 5.46a.795.795 0 0 0-.393.681zm1.097-2.365l2.602-1.5 2.607 1.5v2.999l-2.597 1.5-2.607-1.5z"/>
      </svg>
    )
  },
  {
    name: 'Anthropic',
    description: 'Excellent for nuanced medical conversations',
    models: ['Claude 4 Opus', 'Claude 4 Sonnet', 'Claude 3.5 Haiku', '+ Reasoning'],
    gradient: 'from-orange-500/20 to-red-500/20',
    logo: (
      <div className="w-8 h-8 flex items-center justify-center">
        <svg viewBox="0 0 50 65" fill="currentColor" className="w-8 h-8">
          <path d="M25.1 0L0 65h13.2l4.5-11.5h14.7L37 65h13.1L25.1 0zm0 23.7l5.1 13.1H20l5.1-13.1z"/>
        </svg>
      </div>
    )
  },
  {
    name: 'Google',
    description: 'Great for complex analysis and deep thinking',
    models: ['Gemini 2.5 Pro', '2.5 Pro Deep Thinking', '2.5 Flash', '2.5 Nano'],
    gradient: 'from-blue-500/20 to-cyan-500/20',
    logo: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8">
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
      </svg>
    )
  },
  {
    name: 'xAI',
    description: 'Fast and efficient for quick insights',
    models: ['Grok-3', 'Grok-3 Mini'],
    gradient: 'from-purple-500/20 to-pink-500/20',
    logo: (
      <div className="w-8 h-8 font-bold text-2xl flex items-center justify-center">𝕏</div>
    )
  }
];

export default function AIPartners() {
  return (
    <section className="relative py-32 px-6 overflow-hidden" id="ai-partners">
      {/* Background */}
      <div className="absolute inset-0 bg-[#0a0a0a]" />
      
      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-purple-500/5 to-transparent" />
      
      <div className="relative z-10 max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-20">
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
        </div>
        
        {/* Partners Grid */}
        <div className="grid md:grid-cols-2 gap-8 mb-16">
          {partners.map((partner, index) => (
            <div
              key={partner.name}
              className="group relative"
            >
              {/* Hover glow effect */}
              <div className={`absolute inset-0 bg-gradient-to-r ${partner.gradient} opacity-0 group-hover:opacity-10 rounded-2xl blur-xl transition-opacity duration-500`} />
              
              {/* Card */}
              <div className="relative bg-gray-900/30 border border-gray-800 rounded-2xl p-8 hover:border-gray-700 transition-all duration-300">
                <div className="flex items-start gap-6">
                  <div className="text-gray-400">
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
              </div>
            </div>
          ))}
        </div>
        
        {/* Bottom section */}
        <div className="text-center">
          <div className="inline-flex items-center gap-3 px-6 py-3 bg-gray-900/50 border border-gray-800 rounded-full">
            <svg className="w-5 h-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            <span className="text-gray-300">
              HIPAA compliant • SOC 2 certified • End-to-end encryption
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}