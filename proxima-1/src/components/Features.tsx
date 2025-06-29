'use client';

export default function Features() {
  return (
    <section className="relative py-32 px-6 overflow-hidden" id="features">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0a] via-[#0f0f0f] to-[#0a0a0a]" />
      
      {/* Subtle grid */}
      <div 
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 1px)`,
          backgroundSize: '40px 40px'
        }}
      />
      
      <div className="relative z-10 max-w-7xl mx-auto">
        {/* Section header */}
        <div className="text-center mb-20">
          <h2 className="text-4xl sm:text-5xl font-semibold text-white mb-4">
            Everything you need to{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
              understand your health
            </span>
          </h2>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto">
            Two powerful ways to get answers: interactive 3D body mapping or instant photo analysis.
          </p>
        </div>
        
        {/* Feature grid */}
        <div className="grid lg:grid-cols-2 gap-12 mb-32">
          {/* 3D Body Mapping */}
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-2xl blur-xl group-hover:from-purple-500/20 group-hover:to-pink-500/20 transition-all duration-500" />
            <div className="relative bg-gray-900/50 border border-gray-800 rounded-2xl p-8 hover:border-gray-700 transition-all duration-300">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 rounded-lg bg-purple-500/10 border border-purple-500/20">
                  <svg className="w-6 h-6 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-semibold text-white">3D Body Mapping</h3>
              </div>
              
              <p className="text-gray-400 mb-6">
                Show us exactly where it hurts. Click on any part of the body and get questions 
                that actually make sense for that specific area. No more generic symptom lists.
              </p>
              
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="mt-1 p-1 rounded-full bg-purple-500/20">
                    <svg className="w-3 h-3 text-purple-400" fill="currentColor" viewBox="0 0 8 8">
                      <circle cx="4" cy="4" r="3" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-white font-medium mb-1">Anatomically Accurate</h4>
                    <p className="text-gray-500 text-sm">Powered by BioDigital's medical-grade 3D models</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="mt-1 p-1 rounded-full bg-purple-500/20">
                    <svg className="w-3 h-3 text-purple-400" fill="currentColor" viewBox="0 0 8 8">
                      <circle cx="4" cy="4" r="3" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-white font-medium mb-1">Context-Aware Questions</h4>
                    <p className="text-gray-500 text-sm">AI adapts questions based on body region and symptoms</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="mt-1 p-1 rounded-full bg-purple-500/20">
                    <svg className="w-3 h-3 text-purple-400" fill="currentColor" viewBox="0 0 8 8">
                      <circle cx="4" cy="4" r="3" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-white font-medium mb-1">Multi-System Support</h4>
                    <p className="text-gray-500 text-sm">Track symptoms across all body systems simultaneously</p>
                  </div>
                </div>
              </div>
              
              {/* Visual preview */}
              <div className="mt-8 p-6 bg-black/30 rounded-xl border border-gray-800/50">
                <div className="aspect-square relative overflow-hidden rounded-lg">
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 via-transparent to-pink-500/20" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-gray-600">
                      <svg className="w-32 h-32" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={0.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                  </div>
                  {/* Floating points */}
                  <div className="absolute top-1/4 left-1/3 w-3 h-3 bg-purple-500 rounded-full animate-pulse" />
                  <div className="absolute top-1/2 right-1/3 w-3 h-3 bg-pink-500 rounded-full animate-pulse" style={{animationDelay: '0.5s'}} />
                  <div className="absolute bottom-1/3 left-1/2 w-3 h-3 bg-purple-500 rounded-full animate-pulse" style={{animationDelay: '1s'}} />
                </div>
              </div>
            </div>
          </div>
          
          {/* Photo Analysis */}
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 rounded-2xl blur-xl group-hover:from-blue-500/20 group-hover:to-cyan-500/20 transition-all duration-500" />
            <div className="relative bg-gray-900/50 border border-gray-800 rounded-2xl p-8 hover:border-gray-700 transition-all duration-300">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                  <svg className="w-6 h-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-semibold text-white">Intelligent Photo Analysis</h3>
              </div>
              
              <p className="text-gray-400 mb-6">
                Sometimes you just need a quick answer. Snap a photo of any visible symptom 
                and get instant analysis. Track changes over time by comparing photos.
              </p>
              
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="mt-1 p-1 rounded-full bg-blue-500/20">
                    <svg className="w-3 h-3 text-blue-400" fill="currentColor" viewBox="0 0 8 8">
                      <circle cx="4" cy="4" r="3" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-white font-medium mb-1">Single & Time-Series Analysis</h4>
                    <p className="text-gray-500 text-sm">Analyze one photo or track progression over time</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="mt-1 p-1 rounded-full bg-blue-500/20">
                    <svg className="w-3 h-3 text-blue-400" fill="currentColor" viewBox="0 0 8 8">
                      <circle cx="4" cy="4" r="3" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-white font-medium mb-1">Medical-Grade AI</h4>
                    <p className="text-gray-500 text-sm">Trained on millions of medical images for accuracy</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="mt-1 p-1 rounded-full bg-blue-500/20">
                    <svg className="w-3 h-3 text-blue-400" fill="currentColor" viewBox="0 0 8 8">
                      <circle cx="4" cy="4" r="3" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-white font-medium mb-1">Privacy-First</h4>
                    <p className="text-gray-500 text-sm">HIPAA compliant with end-to-end encryption</p>
                  </div>
                </div>
              </div>
              
              {/* Visual preview */}
              <div className="mt-8 p-6 bg-black/30 rounded-xl border border-gray-800/50">
                <div className="grid grid-cols-3 gap-2">
                  <div className="aspect-square bg-gradient-to-br from-blue-500/10 to-cyan-500/10 rounded-lg animate-pulse" />
                  <div className="aspect-square bg-gradient-to-br from-cyan-500/10 to-blue-500/10 rounded-lg animate-pulse" style={{animationDelay: '0.2s'}} />
                  <div className="aspect-square bg-gradient-to-br from-blue-500/10 to-cyan-500/10 rounded-lg animate-pulse" style={{animationDelay: '0.4s'}} />
                </div>
                <div className="mt-4 space-y-2">
                  <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                    <div className="h-full w-3/4 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full" />
                  </div>
                  <p className="text-xs text-gray-500">AI Confidence: 94%</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Analysis modes */}
        <div className="relative">
          <h3 className="text-3xl font-semibold text-white text-center mb-12">
            Choose your speed: Quick answers or deep analysis
          </h3>
          
          <div className="grid md:grid-cols-2 gap-8">
            {/* Quick Scan */}
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-green-500/5 to-emerald-500/5 rounded-xl blur-lg group-hover:from-green-500/10 group-hover:to-emerald-500/10 transition-all duration-500" />
              <div className="relative bg-gray-900/30 border border-gray-800 rounded-xl p-6 hover:border-gray-700 transition-all duration-300">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-xl font-semibold text-white">Quick Scan</h4>
                  <span className="px-3 py-1 text-xs font-medium text-green-400 bg-green-500/10 border border-green-500/20 rounded-full">
                    ~30 seconds
                  </span>
                </div>
                <p className="text-gray-400 mb-4">
                  Need answers now? Get instant results in under 30 seconds. 
                  Perfect when you just need quick guidance.
                </p>
                <ul className="space-y-2 text-sm text-gray-500">
                  <li className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Instant results
                  </li>
                  <li className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Basic recommendations
                  </li>
                  <li className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Warning signs to watch
                  </li>
                </ul>
              </div>
            </div>
            
            {/* Deep Dive */}
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-orange-500/5 to-amber-500/5 rounded-xl blur-lg group-hover:from-orange-500/10 group-hover:to-amber-500/10 transition-all duration-500" />
              <div className="relative bg-gray-900/30 border border-gray-800 rounded-xl p-6 hover:border-gray-700 transition-all duration-300">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-xl font-semibold text-white">Deep Dive</h4>
                  <span className="px-3 py-1 text-xs font-medium text-orange-400 bg-orange-500/10 border border-orange-500/20 rounded-full">
                    2-5 minutes
                  </span>
                </div>
                <p className="text-gray-400 mb-4">
                  Want the full picture? Our AI asks follow-up questions to really understand 
                  what's going on. Takes a bit longer but worth it for complex symptoms.
                </p>
                <ul className="space-y-2 text-sm text-gray-500">
                  <li className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Follow-up questions
                  </li>
                  <li className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Detailed analysis
                  </li>
                  <li className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Doctor-ready reports
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}