'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { Shield, Lock, Eye, Server, Users, AlertTriangle, Mail, CheckCircle } from 'lucide-react';

export default function Security() {
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
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {/* Header Section */}
            <div className="text-center mb-12">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-500 to-blue-500 rounded-2xl mb-4">
                <Shield className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-4xl font-bold text-white mb-4">Security at Proxima</h1>
              <p className="text-xl text-gray-400 max-w-2xl mx-auto">
                Your health data deserves the highest level of protection. Here's how we safeguard your information.
              </p>
            </div>

            {/* Transparency Notice */}
            <div className="bg-gradient-to-r from-blue-900/20 to-purple-900/20 border border-blue-800/50 rounded-lg p-6 mb-10">
              <h2 className="text-xl font-semibold text-blue-400 mb-3 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                Transparency First
              </h2>
              <p className="text-gray-300 leading-relaxed mb-3">
                We believe in being completely transparent about our security practices. As a consumer health app, 
                HIPAA regulations don't apply to our services. However, we implement industry-standard security measures 
                to protect your data and continuously improve our security posture.
              </p>
              <p className="text-gray-400 text-sm">
                Your privacy and data security are our top priorities, even without regulatory requirements.
              </p>
            </div>

            {/* Security Features Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
              {/* Data Encryption */}
              <motion.div 
                className="bg-gray-900/50 border border-gray-800 rounded-lg p-6"
                whileHover={{ scale: 1.02 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <div className="flex items-start gap-4">
                  <div className="p-2 bg-purple-500/10 rounded-lg">
                    <Lock className="w-6 h-6 text-purple-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-2">Data Encryption</h3>
                    <ul className="text-gray-400 space-y-1 text-sm">
                      <li>• 256-bit AES encryption at rest</li>
                      <li>• TLS 1.3 encryption in transit</li>
                      <li>• Encrypted database backups</li>
                      <li>• Secure API communications</li>
                    </ul>
                  </div>
                </div>
              </motion.div>

              {/* Infrastructure Security */}
              <motion.div 
                className="bg-gray-900/50 border border-gray-800 rounded-lg p-6"
                whileHover={{ scale: 1.02 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <div className="flex items-start gap-4">
                  <div className="p-2 bg-blue-500/10 rounded-lg">
                    <Server className="w-6 h-6 text-blue-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-2">Infrastructure</h3>
                    <ul className="text-gray-400 space-y-1 text-sm">
                      <li>• Hosted on secure cloud providers</li>
                      <li>• Regular security patches</li>
                      <li>• DDoS protection</li>
                      <li>• Web Application Firewall (WAF)</li>
                    </ul>
                  </div>
                </div>
              </motion.div>

              {/* Access Control */}
              <motion.div 
                className="bg-gray-900/50 border border-gray-800 rounded-lg p-6"
                whileHover={{ scale: 1.02 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <div className="flex items-start gap-4">
                  <div className="p-2 bg-green-500/10 rounded-lg">
                    <Users className="w-6 h-6 text-green-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-2">Access Control</h3>
                    <ul className="text-gray-400 space-y-1 text-sm">
                      <li>• Secure authentication via Supabase</li>
                      <li>• OAuth 2.0 with Google</li>
                      <li>• Session-based access control</li>
                      <li>• Automatic session timeout</li>
                    </ul>
                  </div>
                </div>
              </motion.div>

              {/* Privacy Protection */}
              <motion.div 
                className="bg-gray-900/50 border border-gray-800 rounded-lg p-6"
                whileHover={{ scale: 1.02 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <div className="flex items-start gap-4">
                  <div className="p-2 bg-yellow-500/10 rounded-lg">
                    <Eye className="w-6 h-6 text-yellow-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-2">Privacy Protection</h3>
                    <ul className="text-gray-400 space-y-1 text-sm">
                      <li>• Data anonymization for AI processing</li>
                      <li>• No selling of personal data</li>
                      <li>• Minimal data collection policy</li>
                      <li>• User-controlled data deletion</li>
                    </ul>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Detailed Sections */}
            <div className="space-y-10">
              {/* AI Data Processing */}
              <section>
                <h2 className="text-2xl font-semibold text-white mb-4">AI Data Processing Security</h2>
                <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-6">
                  <p className="text-gray-300 leading-relaxed mb-4">
                    When we process your health information through AI models:
                  </p>
                  <ul className="space-y-2">
                    <li className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-300">Personal identifiers are removed before sending to AI providers</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-300">Data is transmitted through encrypted channels only</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-300">AI providers (OpenAI, Anthropic, Google) don't store or train on your data</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-300">Results are immediately encrypted and stored securely</span>
                    </li>
                  </ul>
                </div>
              </section>

              {/* Security Practices */}
              <section>
                <h2 className="text-2xl font-semibold text-white mb-4">Our Security Practices</h2>
                <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="text-lg font-medium text-purple-400 mb-3">Development Security</h3>
                      <ul className="text-gray-400 space-y-2 text-sm">
                        <li>• Secure code reviews</li>
                        <li>• Dependency vulnerability scanning</li>
                        <li>• Environment variable protection</li>
                        <li>• Regular security updates</li>
                      </ul>
                    </div>
                    <div>
                      <h3 className="text-lg font-medium text-blue-400 mb-3">Operational Security</h3>
                      <ul className="text-gray-400 space-y-2 text-sm">
                        <li>• Access logging and monitoring</li>
                        <li>• Incident response procedures</li>
                        <li>• Regular backup testing</li>
                        <li>• Rate limiting on all APIs</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </section>

              {/* User Security Tips */}
              <section>
                <h2 className="text-2xl font-semibold text-white mb-4">How You Can Stay Secure</h2>
                <div className="bg-gradient-to-r from-purple-900/10 to-blue-900/10 border border-purple-800/30 rounded-lg p-6">
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <span className="text-purple-400 font-semibold">1.</span>
                      <div>
                        <p className="text-white font-medium mb-1">Use a strong, unique password</p>
                        <p className="text-gray-400 text-sm">Don't reuse passwords from other sites</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <span className="text-purple-400 font-semibold">2.</span>
                      <div>
                        <p className="text-white font-medium mb-1">Keep your account email secure</p>
                        <p className="text-gray-400 text-sm">Your email is the key to account recovery</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <span className="text-purple-400 font-semibold">3.</span>
                      <div>
                        <p className="text-white font-medium mb-1">Log out on shared devices</p>
                        <p className="text-gray-400 text-sm">Always sign out when using public computers</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <span className="text-purple-400 font-semibold">4.</span>
                      <div>
                        <p className="text-white font-medium mb-1">Report suspicious activity</p>
                        <p className="text-gray-400 text-sm">Contact us immediately if you notice anything unusual</p>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              {/* Incident Response */}
              <section>
                <h2 className="text-2xl font-semibold text-white mb-4">Incident Response</h2>
                <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-6">
                  <p className="text-gray-300 leading-relaxed mb-4">
                    In the unlikely event of a security incident:
                  </p>
                  <ol className="space-y-3 text-gray-300">
                    <li className="flex gap-3">
                      <span className="text-purple-400 font-semibold">1.</span>
                      <span>We will immediately investigate and contain the incident</span>
                    </li>
                    <li className="flex gap-3">
                      <span className="text-purple-400 font-semibold">2.</span>
                      <span>Affected users will be notified within 72 hours</span>
                    </li>
                    <li className="flex gap-3">
                      <span className="text-purple-400 font-semibold">3.</span>
                      <span>We will provide clear guidance on any necessary actions</span>
                    </li>
                    <li className="flex gap-3">
                      <span className="text-purple-400 font-semibold">4.</span>
                      <span>A full incident report will be made available</span>
                    </li>
                  </ol>
                </div>
              </section>

              {/* Vulnerability Disclosure */}
              <section>
                <h2 className="text-2xl font-semibold text-white mb-4">Vulnerability Disclosure</h2>
                <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-6">
                  <p className="text-gray-300 leading-relaxed mb-4">
                    We appreciate the security research community's efforts in helping keep our users safe. 
                    If you discover a security vulnerability:
                  </p>
                  <div className="bg-black/50 rounded-lg p-4 mb-4">
                    <p className="text-white font-medium mb-2">Please email us at:</p>
                    <a href="mailto:security@proxima.health" className="text-purple-400 hover:text-purple-300 font-mono">
                      security@proxima.health
                    </a>
                  </div>
                  <p className="text-gray-400 text-sm">
                    Include a detailed description of the vulnerability, steps to reproduce, and any potential impact. 
                    We commit to acknowledging your report within 48 hours.
                  </p>
                </div>
              </section>

              {/* Compliance & Standards */}
              <section>
                <h2 className="text-2xl font-semibold text-white mb-4">Compliance & Standards</h2>
                <div className="bg-gradient-to-r from-yellow-900/20 to-orange-900/20 border border-yellow-800/50 rounded-lg p-6">
                  <h3 className="text-lg font-medium text-yellow-400 mb-3">Regulatory Context</h3>
                  <p className="text-gray-300 mb-4">
                    As a direct-to-consumer health information platform, certain healthcare regulations like HIPAA do not apply 
                    to our services. HIPAA only governs "covered entities" such as healthcare providers and insurance companies.
                  </p>
                  <p className="text-gray-300 mb-4">
                    <span className="text-white font-medium">What this means for you:</span> While we're not bound by HIPAA, 
                    we voluntarily implement many of the same security practices to ensure your data remains private and secure.
                  </p>
                  <div className="bg-black/30 rounded-lg p-4">
                    <p className="text-gray-400 text-sm">
                      <span className="text-white font-medium">Note:</span> We follow industry-standard security best practices 
                      and continuously update our security measures to protect your information, regardless of regulatory requirements.
                    </p>
                  </div>
                </div>
              </section>

              {/* Contact Section */}
              <section>
                <h2 className="text-2xl font-semibold text-white mb-4">Security Contact</h2>
                <div className="bg-gradient-to-r from-purple-900/20 to-blue-900/20 border border-purple-800/50 rounded-lg p-6">
                  <div className="flex items-start gap-4">
                    <Mail className="w-6 h-6 text-purple-400 mt-1" />
                    <div>
                      <p className="text-white font-medium mb-2">For security concerns or questions:</p>
                      <a href="mailto:security@proxima.health" className="text-purple-400 hover:text-purple-300 text-lg font-mono">
                        security@proxima.health
                      </a>
                      <p className="text-gray-400 text-sm mt-2">
                        We take all security reports seriously and will respond within 48 hours.
                      </p>
                    </div>
                  </div>
                </div>
              </section>

              {/* Last Updated */}
              <div className="text-center pt-8 border-t border-gray-800">
                <p className="text-gray-500 text-sm">
                  Last updated: January 8, 2025
                </p>
              </div>
            </div>

            {/* Back to Home Button */}
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