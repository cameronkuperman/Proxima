'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-black">
      {/* Simple Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-xl border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2">
              <Image src="/widelogoforbanner.png" alt="Proxima" width={200} height={50} priority className="h-12 w-auto" />
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-4xl font-bold text-white mb-2">Terms of Service</h1>
            <p className="text-gray-400 mb-8">Effective Date: August 7, 2025</p>

            {/* Quick Summary Box */}
            <div className="bg-gradient-to-r from-purple-900/20 to-blue-900/20 border border-purple-800/50 rounded-lg p-6 mb-10">
              <h2 className="text-xl font-semibold text-purple-400 mb-3">Quick Summary (Not Legally Binding)</h2>
              <p className="text-gray-300 leading-relaxed">
                We provide health information tools, not medical advice. Use us at your own risk, follow your local laws, and don't misuse our platform. 
                You own your content, but you give us permission to use it to run the service. We're not responsible for losses from using our platform. 
                You can close your account anytime.
              </p>
            </div>

            <div className="prose prose-invert max-w-none">
              {/* Section 1 */}
              <section className="mb-10">
                <h2 className="text-2xl font-semibold text-white mb-4">1. Acceptance of Terms</h2>
                <p className="text-gray-300 leading-relaxed">
                  By accessing or using Proxima's website, mobile app, or services ("Services"), you agree to be bound by these Terms of Service ("Terms"). 
                  If you don't agree, do not use our Services.
                </p>
              </section>

              {/* Section 2 */}
              <section className="mb-10">
                <h2 className="text-2xl font-semibold text-white mb-4">2. Eligibility</h2>
                <p className="text-gray-300 leading-relaxed">
                  You must be at least 18 years old to use our Services.
                </p>
              </section>

              {/* Section 3 */}
              <section className="mb-10">
                <h2 className="text-2xl font-semibold text-white mb-4">3. Our Services</h2>
                <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
                  <li>Proxima provides AI-powered tools to help you understand your symptoms and health information.</li>
                  <li>We do not provide medical advice, diagnosis, or treatment. Always consult a qualified healthcare provider.</li>
                  <li>The Services are for informational purposes only.</li>
                </ul>
              </section>

              {/* Section 4 */}
              <section className="mb-10">
                <h2 className="text-2xl font-semibold text-white mb-4">4. Privacy & Data Use</h2>
                <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
                  <li>Our <Link href="/privacy" className="text-purple-400 hover:text-purple-300 underline">Privacy Policy</Link> explains how we collect, use, and protect your data.</li>
                  <li>We may send non-identifiable health data to third-party AI providers (e.g., OpenAI, Google) for processing.</li>
                  <li>These providers do not store your data or use it for AI training.</li>
                  <li>You agree that we can retain your data unless you request deletion.</li>
                </ul>
              </section>

              {/* Section 5 */}
              <section className="mb-10">
                <h2 className="text-2xl font-semibold text-white mb-4">5. User Responsibilities</h2>
                <p className="text-gray-300 leading-relaxed mb-3">You agree not to:</p>
                <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
                  <li>Use the Services for unlawful purposes.</li>
                  <li>Attempt to reverse-engineer, hack, or disrupt the Services.</li>
                  <li>Submit false or misleading information.</li>
                </ul>
              </section>

              {/* Section 6 */}
              <section className="mb-10">
                <h2 className="text-2xl font-semibold text-white mb-4">6. Intellectual Property</h2>
                <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
                  <li>All content, trademarks, and software in the Services belong to Proxima or our licensors.</li>
                  <li>You may not copy, distribute, or create derivative works without permission.</li>
                </ul>
              </section>

              {/* Section 7 - Medical Disclaimer */}
              <section className="mb-10">
                <h2 className="text-2xl font-semibold text-white mb-4">7. Medical Disclaimer</h2>
                <div className="bg-red-900/20 border border-red-800/50 rounded-lg p-4">
                  <p className="text-red-400 font-semibold mb-2">Important Medical Notice:</p>
                  <p className="text-gray-300 leading-relaxed mb-3">
                    Proxima is not a medical provider. Information provided is not a substitute for professional medical advice, diagnosis, or treatment.
                  </p>
                  <p className="text-gray-300 leading-relaxed font-semibold">
                    If you have a medical emergency, call your local emergency number immediately.
                  </p>
                </div>
              </section>

              {/* Section 8 */}
              <section className="mb-10">
                <h2 className="text-2xl font-semibold text-white mb-4">8. Limitation of Liability</h2>
                <p className="text-gray-300 leading-relaxed mb-3">To the fullest extent permitted by law:</p>
                <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
                  <li>Proxima is not liable for indirect, incidental, or consequential damages.</li>
                  <li>Our total liability to you will not exceed $100.</li>
                </ul>
              </section>

              {/* Section 9 */}
              <section className="mb-10">
                <h2 className="text-2xl font-semibold text-white mb-4">9. Governing Law</h2>
                <p className="text-gray-300 leading-relaxed">
                  These Terms are governed by the laws of the State of Delaware, USA, without regard to conflict of law principles.
                </p>
              </section>

              {/* Section 10 */}
              <section className="mb-10">
                <h2 className="text-2xl font-semibold text-white mb-4">10. Changes to Terms</h2>
                <p className="text-gray-300 leading-relaxed">
                  We may update these Terms from time to time. If we make material changes, we will notify you by email or through the Service.
                </p>
              </section>

              {/* Section 11 */}
              <section className="mb-10">
                <h2 className="text-2xl font-semibold text-white mb-4">11. Contact Us</h2>
                <p className="text-gray-300 leading-relaxed mb-3">
                  If you have questions about these Terms, contact us at:
                </p>
                <p className="text-gray-300">
                  Email: <a href="mailto:legal@proxima.health" className="text-purple-400 hover:text-purple-300 underline">legal@proxima.health</a>
                </p>
              </section>
            </div>

            {/* Back to top button */}
            <div className="mt-12 pt-8 border-t border-gray-800">
              <Link href="/" className="inline-flex items-center text-purple-400 hover:text-purple-300 transition-colors">
                <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back to Home
              </Link>
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  );
}