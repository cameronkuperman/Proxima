'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-black">
      {/* Simple Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-xl border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2">
              <Image src="/widelogoforbanner.png" alt="Seimeo" width={200} height={50} priority className="h-12 w-auto" />
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
            <h1 className="text-4xl font-bold text-white mb-2">Privacy Policy</h1>
            <p className="text-gray-400 mb-8">Last updated: August 7, 2025</p>

            <div className="prose prose-invert max-w-none">
              <section className="mb-10">
                <h2 className="text-2xl font-semibold text-white mb-4">1. Introduction</h2>
                <p className="text-gray-300 leading-relaxed mb-4">
                  Welcome to Seimeo. We are committed to protecting your personal information and your right to privacy.
                </p>
                <p className="text-gray-300 leading-relaxed mb-4">
                  This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our AI-powered health intelligence platform. By using Seimeo, you agree to this Privacy Policy.
                </p>
                <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-4 my-6">
                  <p className="text-yellow-400 font-semibold mb-2">Important:</p>
                  <ul className="list-disc list-inside text-gray-300 space-y-2">
                    <li>Seimeo is not HIPAA or SOC 2 compliant.</li>
                    <li>We follow industry-standard security practices to protect your information.</li>
                    <li>Seimeo is not a medical device and does not replace professional medical advice.</li>
                  </ul>
                </div>
              </section>

              <section className="mb-10">
                <h2 className="text-2xl font-semibold text-white mb-4">2. Information We Collect</h2>
                
                <h3 className="text-xl font-semibold text-white mb-3 mt-6">2.1 Information You Provide</h3>
                
                <div className="mb-4">
                  <h4 className="text-lg font-medium text-blue-400 mb-2">Health Information</h4>
                  <ul className="list-disc list-inside text-gray-300 space-y-1">
                    <li>Symptom descriptions</li>
                    <li>Body part selections from our 3D mapping tool</li>
                    <li>Pain levels and duration</li>
                    <li>Relevant medical history</li>
                    <li>Responses to AI-generated follow-up questions</li>
                  </ul>
                </div>

                <div className="mb-4">
                  <h4 className="text-lg font-medium text-blue-400 mb-2">Visual Data</h4>
                  <ul className="list-disc list-inside text-gray-300 space-y-1">
                    <li>Uploaded photos for symptom analysis</li>
                    <li>Time-series photos for tracking changes</li>
                    <li>Associated metadata (e.g., date/time of capture)</li>
                  </ul>
                </div>

                <div className="mb-4">
                  <h4 className="text-lg font-medium text-blue-400 mb-2">Account Information</h4>
                  <ul className="list-disc list-inside text-gray-300 space-y-1">
                    <li>Email address</li>
                    <li>Name (optional)</li>
                    <li>Authentication credentials</li>
                    <li>User preferences/settings</li>
                  </ul>
                </div>

                <div className="mb-4">
                  <h4 className="text-lg font-medium text-blue-400 mb-2">Communications</h4>
                  <ul className="list-disc list-inside text-gray-300 space-y-1">
                    <li>Chat history with our AI</li>
                    <li>Generated health reports</li>
                    <li>Support inquiries and feedback</li>
                  </ul>
                </div>

                <h3 className="text-xl font-semibold text-white mb-3 mt-6">2.2 Information Collected Automatically</h3>
                
                <div className="mb-4">
                  <h4 className="text-lg font-medium text-blue-400 mb-2">Technical Data</h4>
                  <ul className="list-disc list-inside text-gray-300 space-y-1">
                    <li>IP address</li>
                    <li>Browser type/version</li>
                    <li>Device details and operating system</li>
                    <li>Date/time of access</li>
                    <li>Pages viewed, including interactions with 3D models</li>
                  </ul>
                </div>

                <div className="mb-4">
                  <h4 className="text-lg font-medium text-blue-400 mb-2">Analytics Data</h4>
                  <ul className="list-disc list-inside text-gray-300 space-y-1">
                    <li>Usage patterns and feature engagement</li>
                    <li>Session duration</li>
                    <li>Error logs and performance metrics</li>
                  </ul>
                </div>
              </section>

              <section className="mb-10">
                <h2 className="text-2xl font-semibold text-white mb-4">3. How We Use Your Information</h2>
                
                <h3 className="text-xl font-semibold text-white mb-3">3.1 Provide Core Services</h3>
                <ul className="list-disc list-inside text-gray-300 space-y-1 mb-4">
                  <li>Generate AI-powered health insights</li>
                  <li>Analyze uploaded images for symptoms</li>
                  <li>Create personalized follow-up questions</li>
                  <li>Produce doctor-ready reports</li>
                  <li>Track symptom progression</li>
                </ul>

                <h3 className="text-xl font-semibold text-white mb-3">3.2 Improve Our Platform</h3>
                <ul className="list-disc list-inside text-gray-300 space-y-1 mb-4">
                  <li>Enhance AI accuracy and relevance</li>
                  <li>Develop new features</li>
                  <li>Improve usability and interface design</li>
                  <li>Fix bugs and optimize performance</li>
                </ul>

                <h3 className="text-xl font-semibold text-white mb-3">3.3 Communicate With You</h3>
                <ul className="list-disc list-inside text-gray-300 space-y-1 mb-4">
                  <li>Service updates and notifications</li>
                  <li>Support responses</li>
                  <li>Important platform announcements</li>
                </ul>

                <h3 className="text-xl font-semibold text-white mb-3">3.4 Legal and Safety</h3>
                <ul className="list-disc list-inside text-gray-300 space-y-1 mb-4">
                  <li>Meet legal obligations</li>
                  <li>Detect/prevent fraud or abuse</li>
                  <li>Protect rights, safety, and integrity of our service</li>
                </ul>
              </section>

              <section className="mb-10">
                <h2 className="text-2xl font-semibold text-white mb-4">4. Legal Basis for Processing (EU/UK Users)</h2>
                <p className="text-gray-300 leading-relaxed mb-4">
                  If you are in the EEA or UK, we process your personal data under:
                </p>
                <ul className="list-disc list-inside text-gray-300 space-y-2 mb-4">
                  <li><strong className="text-white">Consent (GDPR Art. 6(1)(a))</strong> – for collecting and processing your information, especially health data.</li>
                  <li><strong className="text-white">Explicit Consent (GDPR Art. 9(2)(a))</strong> – for processing special category health data.</li>
                  <li><strong className="text-white">Legitimate Interests (GDPR Art. 6(1)(f))</strong> – for improving services and ensuring platform security.</li>
                </ul>
                <p className="text-gray-300 leading-relaxed">
                  You may withdraw your consent at any time, though this may limit service functionality.
                </p>
              </section>

              <section className="mb-10">
                <h2 className="text-2xl font-semibold text-white mb-4">5. Data Processing and AI Models</h2>
                <ul className="list-disc list-inside text-gray-300 space-y-2 mb-4">
                  <li>We send relevant, non-name-identifiable health data to AI providers to generate insights.</li>
                  <li>AI providers do not retain your data beyond processing your request.</li>
                  <li>AI providers do not use your data to train their models.</li>
                  <li>Data may be associated with an internal account ID for continuity, but not your name.</li>
                </ul>
                <p className="text-gray-300 leading-relaxed mb-4">Current AI partners:</p>
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-3">
                    <p className="text-white font-medium">OpenAI (GPT models)</p>
                  </div>
                  <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-3">
                    <p className="text-white font-medium">Anthropic (Claude models)</p>
                  </div>
                  <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-3">
                    <p className="text-white font-medium">Google (Gemini models)</p>
                  </div>
                  <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-3">
                    <p className="text-white font-medium">xAI (Grok models)</p>
                  </div>
                </div>
              </section>

              <section className="mb-10">
                <h2 className="text-2xl font-semibold text-white mb-4">6. Cookies & Tracking</h2>
                <p className="text-gray-300 leading-relaxed mb-4">
                  We use cookies and similar technologies to:
                </p>
                <ul className="list-disc list-inside text-gray-300 space-y-1 mb-4">
                  <li>Maintain session state</li>
                  <li>Measure platform usage</li>
                  <li>Improve performance</li>
                </ul>
                <p className="text-gray-300 leading-relaxed">
                  You can manage cookie preferences in your browser settings. We do not use advertising or tracking cookies for marketing.
                </p>
              </section>

              <section className="mb-10">
                <h2 className="text-2xl font-semibold text-white mb-4">7. Data Retention</h2>
                <ul className="list-disc list-inside text-gray-300 space-y-2 mb-4">
                  <li>We retain your personal data as long as your account is active to provide ongoing services.</li>
                  <li>Upon account deletion, we remove personal data within 30 days.</li>
                  <li>Some anonymized data may be kept for research and improvement.</li>
                  <li>For EU/UK users, we retain personal data only as long as necessary for the purposes collected.</li>
                </ul>
              </section>

              <section className="mb-10">
                <h2 className="text-2xl font-semibold text-white mb-4">8. International Data Transfers</h2>
                <p className="text-gray-300 leading-relaxed mb-4">
                  We may transfer your data to countries outside your own, including the U.S., where our servers and service providers operate.
                </p>
                <p className="text-gray-300 leading-relaxed">
                  <strong className="text-white">For EU/UK users:</strong> We rely on Standard Contractual Clauses (SCCs) approved by the European Commission, and the UK Addendum, to safeguard personal data when transferring it internationally.
                </p>
              </section>

              <section className="mb-10">
                <h2 className="text-2xl font-semibold text-white mb-4">9. Data Sharing</h2>
                <p className="text-gray-300 leading-relaxed mb-4">
                  We do not sell personal health information. We may share data:
                </p>
                <ul className="list-disc list-inside text-gray-300 space-y-2">
                  <li>With your consent (e.g., when sending a report to your doctor)</li>
                  <li>With service providers (cloud hosting, AI models, analytics) under strict contractual safeguards</li>
                  <li>For legal compliance (if required by law or legal process)</li>
                </ul>
              </section>

              <section className="mb-10">
                <h2 className="text-2xl font-semibold text-white mb-4">10. Security Measures</h2>
                <p className="text-gray-300 leading-relaxed mb-4">We use:</p>
                <ul className="list-disc list-inside text-gray-300 space-y-1">
                  <li>Encryption in transit and at rest</li>
                  <li>Secure authentication</li>
                  <li>Access controls and monitoring</li>
                  <li>Regular security audits</li>
                  <li>Secure API communications with AI partners</li>
                </ul>
              </section>

              <section className="mb-10">
                <h2 className="text-2xl font-semibold text-white mb-4">11. Your Rights</h2>
                <p className="text-gray-300 leading-relaxed mb-4">You may:</p>
                <ul className="list-disc list-inside text-gray-300 space-y-1">
                  <li>Access and download your data</li>
                  <li>Correct inaccurate data</li>
                  <li>Request deletion of your account/data</li>
                  <li>Export consultation history</li>
                  <li>Withdraw consent (EU/UK users)</li>
                  <li>Delete uploaded photos individually or in bulk</li>
                </ul>
              </section>

              <section className="mb-10">
                <h2 className="text-2xl font-semibold text-white mb-4">12. Children's Privacy</h2>
                <p className="text-gray-300 leading-relaxed">
                  Seimeo is not intended for individuals under 18. We do not knowingly collect their information.
                </p>
              </section>

              <section className="mb-10">
                <h2 className="text-2xl font-semibold text-white mb-4">13. Medical Disclaimer</h2>
                <div className="bg-red-900/20 border border-red-800 rounded-lg p-4">
                  <p className="text-red-400 font-semibold mb-2">Important:</p>
                  <p className="text-gray-300">
                    Seimeo provides informational insights only and is not a substitute for professional medical advice, diagnosis, or treatment. In emergencies, call local emergency services.
                  </p>
                </div>
              </section>

              <section className="mb-10">
                <h2 className="text-2xl font-semibold text-white mb-4">14. Changes to This Policy</h2>
                <p className="text-gray-300 leading-relaxed">
                  We may update this Privacy Policy. Changes will be posted here with a new "Last Updated" date. If changes are significant, we will notify you by email.
                </p>
              </section>

              <section className="mb-10">
                <h2 className="text-2xl font-semibold text-white mb-4">15. Contact</h2>
                <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-4">
                  <p className="text-white font-semibold mb-2">Seimeo Privacy Team</p>
                  <p className="text-gray-300">Email: <a href="mailto:privacy@seimeo.com" className="text-blue-400 hover:text-blue-300">privacy@seimeo.com</a></p>
                </div>
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