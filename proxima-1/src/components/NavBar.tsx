"use client";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import AuthStatus from "./navbar/AuthStatus";

export default function NavBar() {
  return (
    <motion.nav 
      className="fixed top-0 left-0 right-0 z-50 bg-[#0a0a0a]/80 backdrop-blur-xl border-b border-gray-800"
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center gap-2">
              <Image src="/widelogoforbanner.png" alt="Proxima" width={200} height={50} priority className="h-12.5 w-auto" />
            </Link>
          </div>
          
          {/* Navigation */}
          <div className="hidden md:flex items-center gap-8">
            <Link href="#features" className="text-gray-400 hover:text-white transition-colors text-sm font-medium">
              Features
            </Link>
            <Link href="#how-it-works" className="text-gray-400 hover:text-white transition-colors text-sm font-medium">
              How it Works
            </Link>
            <Link href="#ai-partners" className="text-gray-400 hover:text-white transition-colors text-sm font-medium">
              AI Partners
            </Link>
            <Link href="#about" className="text-gray-400 hover:text-white transition-colors text-sm font-medium">
              About
            </Link>
            <Link href="#contact" className="text-gray-400 hover:text-white transition-colors text-sm font-medium">
              Contact
            </Link>
          </div>
          
          {/* Dynamic Auth Status and CTA */}
          <div className="flex items-center gap-4">
            <AuthStatus />
            <Link href="/demo" className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all duration-200">
              Try Demo
            </Link>
          </div>
        </div>
      </div>
    </motion.nav>
  );
}