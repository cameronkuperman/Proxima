"use client";

import { Suspense } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import UnifiedAuthGuard from "@/components/UnifiedAuthGuard";
import NavBar from "@/components/NavBar";

export const dynamic = "force-dynamic";

function EditorialHero() {
  return (
    <section className="relative w-full min-h-[92vh] bg-[#0a0a0a]">
      <div className="max-w-6xl mx-auto px-6 pt-32">
        <p className="text-sm tracking-widest text-gray-500 uppercase mb-6">Proxima</p>
        <h1 className="text-[42px] sm:text-[64px] leading-[1.05] font-semibold mb-6 text-white">
          One place for symptom clarity
        </h1>
        <p className="text-xl text-gray-400 max-w-2xl">
          A modern, privacy‑first way to describe symptoms, analyze photos, and prepare doctor‑ready summaries.
        </p>
        <div className="mt-10 flex flex-wrap gap-4 items-center">
          <Link href="/scan" className="px-6 py-3 rounded-lg bg-white text-black font-medium hover:bg-gray-200">Start Quick Scan</Link>
          <Link href="/demo" className="px-6 py-3 rounded-lg border border-gray-800 text-gray-300 hover:bg-gray-900/60">See Demo</Link>
        </div>
        <div className="mt-16 h-px w-full bg-gradient-to-r from-transparent via-white/20 to-transparent" />
      </div>
    </section>
  );
}

function GridFeatures() {
  const items = [
    { t: "3D Body", d: "Tap where it hurts. Get location‑aware guidance." },
    { t: "Photo AI", d: "Single shot or compare over time." },
    { t: "Timeline", d: "Weekly AI summaries and pattern tracking." },
    { t: "Reports", d: "Concise summaries you can share securely." },
  ];
  return (
    <section className="py-16 px-6">
      <div className="max-w-6xl mx-auto grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {items.map((i) => (
          <div key={i.t} className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-6">
            <h3 className="text-white font-semibold mb-2">{i.t}</h3>
            <p className="text-gray-400 text-sm">{i.d}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function SplitCTA() {
  return (
    <section className="py-20 px-6">
      <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-8 items-center">
        <div>
          <h3 className="text-3xl font-semibold text-white mb-3">Built to be clear</h3>
          <p className="text-gray-400 mb-6">From first question to final summary — designed to reduce uncertainty.</p>
          <div className="flex gap-3">
            <Link href="/scan" className="px-6 py-3 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 text-white">Quick Scan</Link>
            <Link href="/login" className="px-6 py-3 rounded-lg border border-gray-800 text-gray-300 hover:bg-gray-900/60">Join Early Access</Link>
          </div>
        </div>
        <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-6">
          <div className="grid grid-cols-2 gap-4">
            {[
              { k: "Avg. session", v: "2–5 min" },
              { k: "Return users", v: "68%" },
              { k: "Photos analyzed", v: "1.2M+" },
              { k: "Reports shared", v: "400k+" },
            ].map((m) => (
              <div key={m.k} className="bg-black/30 border border-white/[0.06] rounded-lg p-4">
                <p className="text-xs text-gray-500">{m.k}</p>
                <p className="text-xl font-semibold text-white">{m.v}</p>
              </div>
            ))}
          </div>
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
        <EditorialHero />
        <GridFeatures />
        <SplitCTA />
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


