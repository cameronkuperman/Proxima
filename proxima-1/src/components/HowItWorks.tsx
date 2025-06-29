'use client';

const steps = [
  {
    number: '01',
    title: 'Point to symptoms',
    description: 'Click on our interactive 3D body model to show exactly where you\'re experiencing symptoms.',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
      </svg>
    ),
    color: 'purple'
  },
  {
    number: '02',
    title: 'Describe & upload',
    description: 'Answer targeted questions and optionally upload photos for visual analysis.',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
      </svg>
    ),
    color: 'blue'
  },
  {
    number: '03',
    title: 'Get AI insights',
    description: 'Receive instant analysis or deep-dive assessment with follow-up questions.',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
      </svg>
    ),
    color: 'green'
  }
];

export default function HowItWorks() {
  return (
    <section className="relative py-32 px-6 overflow-hidden" id="how-it-works">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0a] to-[#0f0f0f]" />
      
      <div className="relative z-10 max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-20">
          <p className="text-sm font-medium text-purple-400 mb-4 uppercase tracking-wider">
            Simple Process
          </p>
          <h2 className="text-4xl sm:text-5xl font-semibold text-white mb-4">
            How it works
          </h2>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto">
            Whether you use our 3D body model or photo analysis, getting answers is simple
          </p>
        </div>
        
        {/* Steps */}
        <div className="grid md:grid-cols-3 gap-8 relative">
          {/* Connection line */}
          <div className="hidden md:block absolute top-12 left-1/6 right-1/6 h-[1px] bg-gradient-to-r from-purple-500/20 via-blue-500/20 to-green-500/20" />
          
          {steps.map((step, index) => (
            <div key={step.number} className="relative">
              {/* Step card */}
              <div className="relative bg-gray-900/30 border border-gray-800 rounded-2xl p-8 hover:border-gray-700 transition-all duration-300">
                {/* Step number */}
                <div className="absolute -top-4 -left-4 w-12 h-12 bg-[#0a0a0a] border border-gray-800 rounded-full flex items-center justify-center">
                  <span className="text-sm font-bold text-gray-400">{step.number}</span>
                </div>
                
                {/* Icon */}
                <div className={`w-12 h-12 rounded-xl bg-${step.color}-500/10 border border-${step.color}-500/20 flex items-center justify-center mb-6 text-${step.color}-400`}>
                  {step.icon}
                </div>
                
                {/* Content */}
                <h3 className="text-xl font-semibold text-white mb-3">{step.title}</h3>
                <p className="text-gray-400">{step.description}</p>
              </div>
            </div>
          ))}
        </div>
        
        {/* Bottom CTA */}
        <div className="text-center mt-20">
          <p className="text-gray-400 mb-6">Ready to try it out?</p>
          <button className="px-8 py-4 text-lg font-medium text-white bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl hover:from-purple-600 hover:to-pink-600 transition-all duration-200 transform hover:scale-[1.02]">
            Start Free Demo
          </button>
        </div>
      </div>
    </section>
  );
}