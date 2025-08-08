"use client";

import { Suspense } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import UnifiedAuthGuard from "@/components/UnifiedAuthGuard";
import NavBar from "@/components/NavBar";

export const dynamic = "force-dynamic";

function TiltCard({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      whileHover={{ rotateX: -3, rotateY: 3, scale: 1.02 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className="[transform-style:preserve-3d] bg-gray-900/40 border border-gray-800 rounded-2xl p-6"
    >
      {children}
    </motion.div>
  );
}

function CardsHero() {
  return (
    <section className="relative w-full min-h-screen overflow-hidden bg-[#0a0a0a]">
      <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0a] via-[#0f0f0f] to-[#0a0a0a]" />
      <div className="relative z-10 max-w-7xl mx-auto px-6 pt-28 pb-16">
        <h1 className="text-5xl sm:text-6xl font-semibold text-white tracking-tight mb-4">
          Health clarity, designed
        </h1>
        <p className="text-xl text-gray-300 max-w-2xl">
          Purposeful micro‑interactions. Powerful analysis. Every pixel intentional.
        </p>
        <div className="mt-8 flex flex-col sm:flex-row gap-3">
          <Link href="/scan" className="px-6 py-4 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 text-white text-center">Start Quick Scan</Link>
          <Link href="/demo" className="px-6 py-4 rounded-lg border border-gray-800 text-gray-300 text-center hover:bg-gray-900/60">See Demo</Link>
        </div>

        <div className="mt-12 grid md:grid-cols-3 gap-6">
          <TiltCard>
            <h3 className="text-white font-semibold mb-2">3D Body Mapping</h3>
            <p className="text-gray-400 text-sm">Point to the exact spot and get context‑aware questions.</p>
          </TiltCard>
          <TiltCard>
            <h3 className="text-white font-semibold mb-2">Photo Analysis</h3>
            <p className="text-gray-400 text-sm">Instant insights from single or time‑series photos.</p>
          </TiltCard>
          <TiltCard>
            <h3 className="text-white font-semibold mb-2">Doctor‑Ready Reports</h3>
            <p className="text-gray-400 text-sm">Share concise summaries securely with clinicians.</p>
          </TiltCard>
        </div>
      </div>
    </section>
  );
}

function PageContent() {
  return (
    <UnifiedAuthGuard requireAuth={false}>
      <main className="min-h-screen flex flex-col items-stretch">
        <NavBar />
        <CardsHero />
      </main>
    </UnifiedAuthGuard>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<div className="p-6">Loading…</div>}>
      <PageContent />
    </Suspense>
  );
}


