"use client";

import { Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import UnifiedAuthGuard from "@/components/UnifiedAuthGuard";
import NavBar from "@/components/NavBar";

export const dynamic = "force-dynamic";

function HeroV2() {
  return (
    <section id="home" className="relative w-full min-h-screen overflow-hidden bg-[#0a0a0a]">
      <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0a] via-[#0f0f0f] to-[#0a0a0a]" />
      <div
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      <motion.div
        className="absolute top-[-200px] right-[-200px] w-[900px] h-[900px] rounded-full bg-gradient-radial from-purple-500/10 via-purple-500/5 to-transparent blur-3xl"
        animate={{ scale: [1, 1.08, 1], opacity: [0.5, 0.8, 0.5] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute bottom-[-200px] left-[-200px] w-[800px] h-[800px] rounded-full bg-gradient-radial from-blue-500/10 via-blue-500/5 to-transparent blur-3xl"
        animate={{ scale: [1, 1.12, 1], opacity: [0.5, 0.7, 0.5] }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 1 }}
      />

      <div className="relative z-10 max-w-7xl mx-auto px-6 pt-28 pb-16 grid lg:grid-cols-12 gap-12 items-center">
        <div className="lg:col-span-7">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <div className="inline-flex items-center gap-2 px-3 py-1 mb-6 text-sm text-gray-400 border border-gray-800 rounded-full bg-gray-900/50 backdrop-blur-sm">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-500" />
              </span>
              Early Access 2025
            </div>
            <h1 className="text-5xl sm:text-6xl xl:text-7xl font-semibold text-white tracking-tight mb-4">
              Describe. Analyze. Understand.
            </h1>
            <p className="text-xl sm:text-2xl text-gray-300 leading-relaxed max-w-2xl">
              Seimeo turns symptoms into clear, actionable insights using interactive 3D body mapping and
              medical‑grade photo analysis. Faster answers. Better decisions.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <Link
                href="/scan"
                className="px-6 py-4 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium hover:from-purple-600 hover:to-pink-600 transition-all duration-200 text-center"
              >
                Start Quick Scan
              </Link>
              <Link
                href="/demo"
                className="px-6 py-4 rounded-lg border border-gray-800 text-gray-300 hover:bg-gray-900/60 transition-all duration-200 text-center"
              >
                See Interactive Demo
              </Link>
            </div>

            <div className="mt-10">
              <p className="text-sm text-gray-500 mb-4">Trusted AI partners</p>
              <div className="flex items-center gap-8 opacity-40">
                {[
                  { src: "/aiPartnerLogos/openai.png", alt: "OpenAI", size: 24 },
                  { src: "/aiPartnerLogos/anthropic.png", alt: "Anthropic", size: 24 },
                  { src: "/aiPartnerLogos/google.png", alt: "Google", size: 24 },
                  { src: "/aiPartnerLogos/XAI_Logo.svg.png", alt: "xAI", size: 28 },
                ].map((logo) => (
                  <Image
                    key={logo.alt}
                    src={logo.src}
                    alt={logo.alt}
                    width={logo.size}
                    height={logo.size}
                    className={`${logo.size === 28 ? "w-7 h-7" : "w-6 h-6"} object-contain filter brightness-0 invert`}
                  />
                ))}
              </div>
            </div>
          </motion.div>
        </div>

        <div className="lg:col-span-5">
          <motion.div
            className="relative bg-gray-900/40 border border-gray-800 rounded-2xl p-6 overflow-hidden"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
          >
            <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-gradient-radial from-purple-500/20 to-transparent blur-2xl" />
            <div className="absolute -bottom-24 -left-24 w-72 h-72 rounded-full bg-gradient-radial from-blue-500/20 to-transparent blur-2xl" />
            <div className="relative z-10 grid gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-xl bg-black/30 border border-gray-800 p-4">
                  <p className="text-xs text-gray-400">Avg. time to result</p>
                  <p className="text-2xl font-semibold text-white">&lt; 30s</p>
                </div>
                <div className="rounded-xl bg-black/30 border border-gray-800 p-4">
                  <p className="text-xs text-gray-400">Privacy</p>
                  <p className="text-2xl font-semibold text-white">End‑to‑End</p>
                </div>
              </div>
              <div className="rounded-xl bg-black/30 border border-gray-800 p-4">
                <p className="text-xs text-gray-400 mb-2">Doctor‑ready report preview</p>
                <div className="h-32 rounded-lg bg-gradient-to-r from-gray-900 to-gray-800 relative overflow-hidden">
                  <div className="absolute inset-0 opacity-20">
                    <Image src="/photo-analysis.jpg" alt="Report" fill className="object-cover" />
                  </div>
                  <div className="relative z-10 p-3 text-sm text-gray-300">
                    • Summary, risks and next steps
                    <br />• Key patterns and timeline
                    <br />• Share securely with your clinician
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function Pillars() {
  const pillars = [
    {
      title: "3D Body Mapping",
      desc:
        "Point to the exact spot. Get location‑aware questions and guidance powered by anatomically accurate models.",
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
      glow: "from-purple-500/10 to-pink-500/10",
    },
    {
      title: "Photo Analysis",
      desc:
        "Instant insights from a single photo or time‑series. Track changes and compare over time.",
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
      glow: "from-blue-500/10 to-cyan-500/10",
    },
    {
      title: "Timeline & Tracking",
      desc:
        "Log symptoms, receive weekly AI summaries, and visualize progression with clear trendlines.",
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3v18h18M7 13l3 3 7-7" />
        </svg>
      ),
      glow: "from-emerald-500/10 to-green-500/10",
    },
    {
      title: "Doctor‑Ready Reports",
      desc:
        "Structured summaries with red flags, differential considerations, and next‑best‑steps.",
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6M7 4h10a2 2 0 012 2v12a2 2 0 01-2 2H7a2 2 0 01-2-2V6a2 2 0 012-2z" />
        </svg>
      ),
      glow: "from-amber-500/10 to-orange-500/10",
    },
  ];

  return (
    <section id="features" className="relative py-16 px-6 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0a] via-[#0f0f0f] to-[#0a0a0a]" />
      <div
        className="absolute inset-0 opacity-[0.02]"
        style={{ backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 1px)", backgroundSize: "40px 40px" }}
      />
      <div className="relative z-10 max-w-7xl mx-auto">
        <div className="text-center mb-14">
          <h2 className="text-4xl sm:text-5xl font-semibold text-white mb-3">What makes Seimeo different</h2>
          <p className="text-lg text-gray-400 max-w-3xl mx-auto">
            Built for real‑world decisions: fast, accurate, and privacy‑first.
          </p>
        </div>

        <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-6">
          {pillars.map((p) => (
            <motion.div
              key={p.title}
              className="relative group"
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${p.glow} rounded-2xl blur-xl opacity-60 group-hover:opacity-100 transition-opacity`} />
              <div className="relative bg-gray-900/50 border border-gray-800 rounded-2xl p-6 h-full hover:border-gray-700 transition-colors">
                <div className="w-10 h-10 rounded-lg bg-white/5 border border-white/10 text-gray-200 flex items-center justify-center mb-4">
                  {p.icon}
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">{p.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{p.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Outcomes() {
  const bullets = [
    "Clarity in minutes, not hours of searching",
    "Personalized guidance, not generic symptom lists",
    "Track and compare over time for better decisions",
    "Share securely with your clinician when ready",
  ];

  return (
    <section className="relative py-16 px-6 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0a] via-[#0f0f0f] to-[#0a0a0a]" />
      <div className="relative z-10 max-w-6xl mx-auto grid lg:grid-cols-12 gap-10 items-center">
        <div className="lg:col-span-6">
          <h3 className="text-3xl sm:text-4xl font-semibold text-white mb-4">Outcomes that matter</h3>
          <p className="text-gray-400 mb-6">
            We focus on practical, safe guidance that helps you decide what to do next — from self‑care to seeking
            in‑person care.
          </p>
          <ul className="space-y-3">
            {bullets.map((b) => (
              <li key={b} className="flex items-start gap-3 text-gray-300">
                <span className="mt-1 w-2 h-2 rounded-full bg-gradient-to-r from-purple-500 to-pink-500" /> {b}
              </li>
            ))}
          </ul>
        </div>
        <div className="lg:col-span-6">
          <div className="relative rounded-2xl bg-gray-900/40 border border-gray-800 p-6 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-tr from-purple-500/10 via-transparent to-pink-500/10" />
            <div className="relative grid grid-cols-2 gap-4">
              {[
                { k: "Avg. session", v: "2–5 min" },
                { k: "Return users", v: "68%" },
                { k: "Photos analyzed", v: "1.2M+" },
                { k: "Reports shared", v: "400k+" },
              ].map((m) => (
                <div key={m.k} className="rounded-xl bg-black/30 border border-gray-800 p-4">
                  <p className="text-xs text-gray-400">{m.k}</p>
                  <p className="text-2xl font-semibold text-white">{m.v}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function PrivacySecurity() {
  const items = [
    { title: "Private by default", desc: "Your data stays encrypted at rest and in transit. You control sharing." },
    { title: "No unexpected training", desc: "We don’t use your personal health data to train foundation models." },
    { title: "Enterprise‑grade controls", desc: "Audit trails, scoped access, and data minimization." },
  ];
  return (
    <section id="security" className="relative py-16 px-6 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0a] via-[#0f0f0f] to-[#0a0a0a]" />
      <div className="relative z-10 max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h3 className="text-3xl sm:text-4xl font-semibold text-white mb-3">Privacy & Security</h3>
          <p className="text-gray-400">Designed with safety in mind from day one.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {items.map((i) => (
            <div key={i.title} className="relative bg-gray-900/40 border border-gray-800 rounded-2xl p-6">
              <h4 className="text-white font-semibold mb-2">{i.title}</h4>
              <p className="text-gray-400 text-sm leading-relaxed">{i.desc}</p>
            </div>
          ))}
        </div>
        <div className="text-center mt-8">
          <Link href="/security" className="text-sm text-gray-300 underline underline-offset-4 hover:text-white">
            Read our security overview
          </Link>
        </div>
      </div>
    </section>
  );
}

function HowItWorksV2() {
  const steps = [
    { n: "01", t: "Point & describe", d: "Use the 3D body or upload a photo and answer targeted questions." },
    { n: "02", t: "AI analyzes", d: "We synthesize patterns, risk signals, and likely causes." },
    { n: "03", t: "Actionable next steps", d: "Get guidance, track changes, and generate a doctor‑ready report." },
  ];
  return (
    <section id="how-it-works" className="relative py-16 px-6 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0a] via-[#0f0f0f] to-[#0a0a0a]" />
      <div className="relative z-10 max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h3 className="text-3xl sm:text-4xl font-semibold text-white mb-3">How it works</h3>
          <p className="text-gray-400">Three steps. Minutes to clarity.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {steps.map((s, idx) => (
            <motion.div
              key={s.n}
              className="relative bg-gray-900/40 border border-gray-800 rounded-2xl p-6"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: idx * 0.1 }}
            >
              <div className="text-sm text-gray-500 mb-2">{s.n}</div>
              <h4 className="text-white font-semibold mb-2">{s.t}</h4>
              <p className="text-gray-400 text-sm">{s.d}</p>
            </motion.div>
          ))}
        </div>
        <div className="text-center mt-10">
          <Link
            href="/demo"
            className="px-6 py-3 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium hover:from-purple-600 hover:to-pink-600 transition-all duration-200 inline-block"
          >
            Try the interactive demo
          </Link>
        </div>
      </div>
    </section>
  );
}

function FAQ() {
  const faqs = [
    {
      q: "Is Seimeo a replacement for a doctor?",
      a: "No. Seimeo provides information and guidance to help you decide next steps and prepare for care, but it does not provide medical diagnoses or treatment.",
    },
    {
      q: "How is my data used?",
      a: "We encrypt data in transit and at rest. We do not use your personal health data to train foundation models. You can delete your data at any time.",
    },
    {
      q: "What does the early access include?",
      a: "3D body mapping, photo analysis, weekly summaries, and doctor‑ready reports. We’ll add more specialties over time.",
    },
  ];
  return (
    <section id="about" className="relative py-16 px-6 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0a] via-[#0f0f0f] to-[#0a0a0a]" />
      <div className="relative z-10 max-w-3xl mx-auto">
        <h3 className="text-3xl sm:text-4xl font-semibold text-white mb-8 text-center">Frequently asked questions</h3>
        <div className="space-y-4">
          {faqs.map((f) => (
            <details key={f.q} className="group bg-gray-900/40 border border-gray-800 rounded-xl p-5">
              <summary className="list-none flex items-center justify-between cursor-pointer">
                <span className="text-white font-medium">{f.q}</span>
                <span className="text-gray-400 group-open:rotate-45 transition-transform">+</span>
              </summary>
              <p className="text-gray-400 mt-3 text-sm leading-relaxed">{f.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

function FinalCTA() {
  return (
    <section id="contact" className="relative py-20 px-6 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0a] via-[#0f0f0f] to-[#0a0a0a]" />
      <div className="relative z-10 max-w-4xl mx-auto text-center">
        <h3 className="text-4xl sm:text-5xl font-semibold text-white mb-4">Ready to get clarity?</h3>
        <p className="text-gray-400 mb-8 max-w-2xl mx-auto">
          Join early access and start with a Quick Scan. Switch to a deep‑dive anytime.
        </p>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3">
          <Link
            href="/scan"
            className="px-6 py-4 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium hover:from-purple-600 hover:to-pink-600 transition-all duration-200"
          >
            Start Quick Scan
          </Link>
          <Link
            href="/login"
            className="px-6 py-4 rounded-lg border border-gray-800 text-gray-300 hover:bg-gray-900/60 transition-all duration-200"
          >
            Join Early Access
          </Link>
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
        <HeroV2 />
        <Pillars />
        <Outcomes />
        <PrivacySecurity />
        <HowItWorksV2 />
        <FAQ />
        <FinalCTA />
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


