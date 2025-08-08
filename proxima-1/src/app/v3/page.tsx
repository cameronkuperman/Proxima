"use client";

import { Suspense } from "react";
import Link from "next/link";
import { motion, useMotionValue, useTransform, useSpring } from "framer-motion";
import UnifiedAuthGuard from "@/components/UnifiedAuthGuard";
import NavBar from "@/components/NavBar";

export const dynamic = "force-dynamic";

function ParallaxHero() {
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const rx = useSpring(useTransform(my, [-200, 200], [8, -8]), { stiffness: 100, damping: 20 });
  const ry = useSpring(useTransform(mx, [-200, 200], [-8, 8]), { stiffness: 100, damping: 20 });

  return (
    <section
      onMouseMove={(e) => {
        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
        mx.set(e.clientX - (rect.left + rect.width / 2));
        my.set(e.clientY - (rect.top + rect.height / 2));
      }}
      className="relative w-full min-h-screen overflow-hidden bg-[#0a0a0a] perspective-[1000px]"
    >
      <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0a] via-[#0f0f0f] to-[#0a0a0a]" />

      <motion.div
        style={{ rotateX: rx, rotateY: ry }}
        className="relative z-10 max-w-7xl mx-auto px-6 pt-28 pb-20"
      >
        <div className="grid lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-7">
            <div className="inline-flex items-center gap-2 px-3 py-1 mb-6 text-sm text-gray-400 border border-gray-800 rounded-full bg-gray-900/50 backdrop-blur-sm">
              The one‑stop health clarity engine
            </div>
            <h1 className="text-5xl sm:text-6xl xl:text-7xl font-semibold text-white tracking-tight mb-4">
              The perfect diagnostic companion
            </h1>
            <p className="text-xl sm:text-2xl text-gray-300 leading-relaxed max-w-2xl">
              3D body mapping + medical photo analysis. Purposeful, precise, beautifully fast.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <Link href="/scan" className="px-6 py-4 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 text-white text-center">Start Quick Scan</Link>
              <Link href="/demo" className="px-6 py-4 rounded-lg border border-gray-800 text-gray-300 text-center hover:bg-gray-900/60">See Demo</Link>
            </div>
          </div>
          <div className="lg:col-span-5">
            <div className="relative h-[420px] rounded-2xl bg-gray-900/40 border border-gray-800 overflow-hidden">
              {/* Layer 1 */}
              <motion.div
                style={{ x: useTransform(mx, (v) => v * -0.03), y: useTransform(my, (v) => v * -0.03) }}
                className="absolute inset-0 bg-gradient-to-tr from-purple-500/20 to-pink-500/10"
              />
              {/* Layer 2 */}
              <motion.div
                style={{ x: useTransform(mx, (v) => v * 0.04), y: useTransform(my, (v) => v * 0.04) }}
                className="absolute top-10 left-10 w-56 h-36 rounded-xl bg-white/[0.04] border border-white/[0.08] backdrop-blur-md"
              />
              {/* Layer 3 */}
              <motion.div
                style={{ x: useTransform(mx, (v) => v * -0.06), y: useTransform(my, (v) => v * -0.06) }}
                className="absolute bottom-10 right-8 w-64 h-40 rounded-xl bg-white/[0.04] border border-white/[0.08] backdrop-blur-md"
              />
              {/* Glow points */}
              <motion.div style={{ x: useTransform(mx, (v) => v * 0.08), y: useTransform(my, (v) => v * -0.02) }} className="absolute top-20 right-1/3 w-3 h-3 rounded-full bg-pink-400/80 blur-[1px]" />
              <motion.div style={{ x: useTransform(mx, (v) => v * -0.05), y: useTransform(my, (v) => v * 0.07) }} className="absolute bottom-16 left-1/4 w-3 h-3 rounded-full bg-purple-400/80 blur-[1px]" />
            </div>
          </div>
        </div>
      </motion.div>
    </section>
  );
}

function Sections() {
  return (
    <>
      {/* Feature Rail */}
      <section className="relative py-16 px-6">
        <div className="relative z-10 max-w-7xl mx-auto grid md:grid-cols-3 gap-6">
          {[
            { t: "3D Mapping", d: "Anatomically aware Q&A for precision." },
            { t: "Photo Intelligence", d: "Single image and time‑series analysis." },
            { t: "Doctor‑ready", d: "Summaries, red flags, and next steps." },
          ].map((c) => (
            <motion.div key={c.t} initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="bg-gray-900/40 border border-gray-800 rounded-2xl p-6">
              <h3 className="text-white font-semibold mb-2">{c.t}</h3>
              <p className="text-gray-400 text-sm">{c.d}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative py-20 px-6">
        <div className="relative z-10 max-w-3xl mx-auto text-center">
          <h3 className="text-4xl font-semibold text-white mb-3">Start in under 30 seconds</h3>
          <p className="text-gray-400 mb-6">Quick Scan now. Deep‑dive when you’re ready.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/scan" className="px-6 py-4 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 text-white">Start Quick Scan</Link>
            <Link href="/login" className="px-6 py-4 rounded-lg border border-gray-800 text-gray-300 hover:bg-gray-900/60">Join Early Access</Link>
          </div>
        </div>
      </section>
    </>
  );
}

function PageContent() {
  return (
    <UnifiedAuthGuard requireAuth={false}>
      <main className="min-h-screen flex flex-col items-stretch">
        <NavBar />
        <ParallaxHero />
        <Sections />
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


