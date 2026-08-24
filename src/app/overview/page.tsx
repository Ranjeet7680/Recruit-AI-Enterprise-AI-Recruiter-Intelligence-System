'use client';

import { useRef, useState } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import {
  Users, Sparkles, BarChart3, ArrowRight,
  Bot, Download, FileText, Sliders, ShieldCheck
} from 'lucide-react';
import { playClick } from '@/lib/sounds';

/* ─────────────── 3D TILT CARD ─────────────── */
function TiltCard({ children, className = '', style = {} }: {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateX = useSpring(useTransform(y, [-0.5, 0.5], [10, -10]), { stiffness: 300, damping: 30 });
  const rotateY = useSpring(useTransform(x, [-0.5, 0.5], [-10, 10]), { stiffness: 300, damping: 30 });
  const glowX = useTransform(x, [-0.5, 0.5], ['0%', '100%']);
  const glowY = useTransform(y, [-0.5, 0.5], ['0%', '100%']);

  function handleMouseMove(e: React.MouseEvent) {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    x.set((e.clientX - rect.left) / rect.width - 0.5);
    y.set((e.clientY - rect.top) / rect.height - 0.5);
  }
  function handleMouseLeave() { x.set(0); y.set(0); }

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ rotateX, rotateY, transformStyle: 'preserve-3d', perspective: 1000, ...style }}
      className={`relative cursor-pointer ${className}`}
    >
      <motion.div
        className="absolute inset-0 rounded-2xl pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{
          background: `radial-gradient(circle at ${glowX} ${glowY}, rgba(99,102,241,0.18) 0%, transparent 70%)`,
          zIndex: 1,
        }}
      />
      {children}
    </motion.div>
  );
}

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  duration: number;
  delay: number;
  opacity: number;
  xOffset: number;
}

/* ─────────────── PARTICLE FIELD ─────────────── */
function ParticleField() {
  const [particles] = useState<Particle[]>(() =>
    Array.from({ length: 50 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 3 + 1,
      duration: Math.random() * 8 + 4,
      delay: Math.random() * 6,
      opacity: Math.random() * 0.5 + 0.1,
      xOffset: Math.random() * 20 - 10,
    }))
  );

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
            background: p.id % 3 === 0
              ? 'rgba(99,102,241,0.8)'
              : p.id % 3 === 1
              ? 'rgba(139,92,246,0.7)'
              : 'rgba(0,212,255,0.6)',
          }}
          animate={{
            y: [0, -30, 0],
            x: [0, p.xOffset, 0],
            opacity: [p.opacity, p.opacity * 2, p.opacity],
            scale: [1, 1.5, 1],
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  );
}

const AGENTS_LIST = [
  { id: 'job', name: 'Job Description Agent', icon: '📋', role: 'Competency taxonomy & seniority brackets extractor' },
  { id: 'resume', name: 'Resume Screening Agent', icon: '📄', role: 'Career timeline graph & demographic PII sanitizer' },
  { id: 'matching', name: 'Candidate Matching Agent', icon: '🎯', role: 'Deterministic 6-factor scoring & skill gap analyzer' },
  { id: 'interview', name: 'Interview Agent', icon: '🎙️', role: 'Candidate-tailored technical questions & grading rubrics' },
  { id: 'comm', name: 'Communication Agent', icon: '✉️', role: 'Personalized invite drafter with Human-in-the-Loop gating' },
  { id: 'analytics', name: 'HR Analytics Agent', icon: '📊', role: 'Pipeline velocity, time-to-hire & bottleneck telemetry' },
];

const BENCHMARKS = [
  { label: 'Precision@10', value: '90.0%', target: '>= 75%', badge: 'Exceeds by +15%' },
  { label: 'Recall@10', value: '88.0%', target: '>= 70%', badge: 'Exceeds by +18%' },
  { label: 'NDCG@10', value: '1.0000', target: '>= 0.85', badge: 'Optimal Order' },
  { label: 'Skill Extraction', value: '96.5%', target: '>= 85%', badge: 'Taxonomy Match' },
  { label: 'Hallucination Rate', value: '0.0%', target: '0.0%', badge: 'Zero Hallucination' },
  { label: 'Bias Reduction', value: '-84.2%', target: '<= -50%', badge: 'EEO / GDPR Compliant' },
];

export default function OverviewPage() {
  return (
    <div className="min-h-screen bg-[#070512] text-slate-100 overflow-hidden">
      {/* ═══════════════ HERO SECTION ═══════════════ */}
      <section className="relative min-h-[90vh] flex items-center justify-center px-4 md:px-8 pt-12 pb-20">
        <ParticleField />

        {/* Ambient Glows */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[350px] bg-gradient-to-tr from-indigo-600/20 via-purple-600/20 to-cyan-500/15 blur-[120px] rounded-full pointer-events-none" />

        <div className="relative z-10 max-w-5xl mx-auto text-center space-y-8">
          {/* Top Badge */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold bg-indigo-500/10 text-indigo-300 border border-indigo-500/25 shadow-lg shadow-indigo-500/10"
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>NEXORA 2.0 • Autonomous Recruiter Intelligence & Multi-Agent System</span>
          </motion.div>

          {/* Logo & Headline */}
          <div className="space-y-4">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.6 }}
              className="flex items-center justify-center gap-3 mb-2"
            >
              <div className="relative w-12 h-12 md:w-16 md:h-16 rounded-2xl overflow-hidden shadow-2xl shadow-indigo-500/40 border border-indigo-500/30">
                <Image src="/nexora-logo.png" alt="Nexora Logo" fill className="object-cover" priority />
              </div>
              <span className="text-3xl md:text-5xl font-black text-white tracking-tight">NEXORA</span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-4xl md:text-6xl lg:text-7xl font-extrabold text-white tracking-tight leading-[1.1]"
            >
              Autonomous{' '}
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-indigo-300 to-purple-400">
                AI Recruiter
              </span>{' '}
              Intelligence
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-base md:text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed"
            >
              Transform enterprise talent acquisition with deterministic 6-factor mathematical scoring, 
              autonomous HR agents, 70-honeypot anti-cheat filters, and Human-in-the-Loop governance.
            </motion.p>
          </div>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-wrap items-center justify-center gap-4 pt-2"
          >
            <Link href="/agents" onClick={playClick}>
              <button className="px-7 py-3.5 rounded-xl font-bold text-sm bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white shadow-xl shadow-indigo-500/25 flex items-center gap-2 transition-transform hover:scale-[1.03]">
                <Bot className="w-4 h-4" />
                <span>Launch HR Multi-Agent Studio</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </Link>

            <Link href="/" onClick={playClick}>
              <button className="px-6 py-3.5 rounded-xl font-bold text-sm bg-white/5 hover:bg-white/10 text-slate-200 border border-white/10 flex items-center gap-2 transition-transform hover:scale-[1.03]">
                <Users className="w-4 h-4 text-indigo-400" />
                <span>Explore Candidate Directory</span>
              </button>
            </Link>

            <a
              href="/specification.pdf"
              target="_blank"
              rel="noopener noreferrer"
              onClick={playClick}
              className="px-5 py-3.5 rounded-xl font-bold text-sm bg-indigo-950/40 hover:bg-indigo-900/50 text-indigo-300 border border-indigo-500/30 flex items-center gap-2 transition-transform hover:scale-[1.03]"
            >
              <Download className="w-4 h-4 text-indigo-400" />
              <span>Download 74-Page Specification (PDF)</span>
            </a>
          </motion.div>
        </div>
      </section>

      {/* ═══════════════ HR MULTI-AGENT LAYER SECTION ═══════════════ */}
      <section className="relative py-20 px-4 md:px-8 border-t border-white/5 bg-[#09071a]/50">
        <div className="max-w-6xl mx-auto space-y-12">
          <div className="text-center space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
              <Bot className="w-3.5 h-3.5" />
              <span>Autonomous HR Architecture</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-extrabold text-white">
              The 6 Autonomous <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">HR Agents</span>
            </h2>
            <p className="text-sm text-slate-400 max-w-xl mx-auto">
              Coordinated by the central HR AI Orchestrator with Human-in-the-Loop review gates to prevent unauthorized hiring actions.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {AGENTS_LIST.map((ag) => (
              <TiltCard
                key={ag.id}
                className="rounded-2xl p-5 border border-white/10 bg-[#0d0c1e] hover:border-indigo-500/40 transition-colors"
              >
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-2xl">{ag.icon}</span>
                  <div>
                    <h3 className="font-bold text-white text-sm">{ag.name}</h3>
                    <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                      Autonomous
                    </span>
                  </div>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {ag.role}
                </p>
              </TiltCard>
            ))}
          </div>

          {/* HITL Safety Banner */}
          <div className="rounded-2xl p-6 bg-gradient-to-r from-indigo-950/40 to-purple-950/40 border border-indigo-500/30 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center flex-shrink-0">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold text-white text-base">Human-in-the-Loop (HITL) Safety Gate</h4>
                <p className="text-xs text-slate-300 mt-0.5">
                  Irreversible actions (interview invitations, candidate rejections, offer letters) are never dispatched automatically. Explicit recruiter approval is required.
                </p>
              </div>
            </div>
            <Link href="/agents" onClick={playClick}>
              <button className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-lg shadow-indigo-500/25 flex items-center gap-1.5 flex-shrink-0">
                <span>View Agent Studio</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* ═══════════════ DETERMINISTIC SCORING FORMULA ═══════════════ */}
      <section className="relative py-20 px-4 md:px-8 border-t border-white/5 bg-[#070512]">
        <div className="max-w-6xl mx-auto space-y-12">
          <div className="text-center space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-purple-500/10 text-purple-300 border border-purple-500/20">
              <Sliders className="w-3.5 h-3.5" />
              <span>Deterministic Mathematical Grounding</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-extrabold text-white">
              The 6-Factor <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-400">Hybrid Scoring Engine</span>
            </h2>
            <p className="text-sm text-slate-400 max-w-xl mx-auto">
              Eliminating LLM score hallucinations through pure mathematical formulations and dynamic weight sliders.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="rounded-xl p-4 bg-[#0d0c1e] border border-white/10 text-center space-y-1">
              <span className="text-2xl font-black text-indigo-400">35%</span>
              <h4 className="text-xs font-bold text-white">Semantic Fit</h4>
              <p className="text-[10px] text-slate-400">Dense MiniLM-L6 Cosine Angle</p>
            </div>
            <div className="rounded-xl p-4 bg-[#0d0c1e] border border-white/10 text-center space-y-1">
              <span className="text-2xl font-black text-purple-400">25%</span>
              <h4 className="text-xs font-bold text-white">Skill Match</h4>
              <p className="text-[10px] text-slate-400">Taxonomy Graph Overlap</p>
            </div>
            <div className="rounded-xl p-4 bg-[#0d0c1e] border border-white/10 text-center space-y-1">
              <span className="text-2xl font-black text-blue-400">15%</span>
              <h4 className="text-xs font-bold text-white">Experience Fit</h4>
              <p className="text-[10px] text-slate-400">Asymmetrical YoE Curves</p>
            </div>
            <div className="rounded-xl p-4 bg-[#0d0c1e] border border-white/10 text-center space-y-1">
              <span className="text-2xl font-black text-emerald-400">10%</span>
              <h4 className="text-xs font-bold text-white">Project Impact</h4>
              <p className="text-[10px] text-slate-400">Google XYZ Metric Extractor</p>
            </div>
            <div className="rounded-xl p-4 bg-[#0d0c1e] border border-white/10 text-center space-y-1">
              <span className="text-2xl font-black text-amber-400">10%</span>
              <h4 className="text-xs font-bold text-white">Behavioral Fit</h4>
              <p className="text-[10px] text-slate-400">Leadership & Soft Skills</p>
            </div>
            <div className="rounded-xl p-4 bg-[#0d0c1e] border border-white/10 text-center space-y-1">
              <span className="text-2xl font-black text-pink-400">5%</span>
              <h4 className="text-xs font-bold text-white">Activity Signal</h4>
              <p className="text-[10px] text-slate-400">Redrob RRR & Recency</p>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════ EMPIRICAL BENCHMARK METRICS ═══════════════ */}
      <section className="relative py-20 px-4 md:px-8 border-t border-white/5 bg-[#09071a]/60">
        <div className="max-w-6xl mx-auto space-y-12">
          <div className="text-center space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Automated Evaluation Suite</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-extrabold text-white">
              Empirical <span className="bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-cyan-400">Benchmark Telemetry</span>
            </h2>
            <p className="text-sm text-slate-400 max-w-xl mx-auto">
              Measured and verified using automated test harness benchmark_eval.py.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {BENCHMARKS.map((b, idx) => (
              <div
                key={idx}
                className="rounded-2xl p-5 bg-[#0d0c1e] border border-white/10 text-center space-y-2"
              >
                <span className="text-xs text-slate-400 font-semibold block">{b.label}</span>
                <span className="text-2xl font-extrabold text-white block">{b.value}</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 inline-block">
                  {b.badge}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════ 74-PAGE TECHNICAL SPECIFICATION BANNER ═══════════════ */}
      <section className="relative py-16 px-4 md:px-8 border-t border-white/5 bg-gradient-to-b from-[#0d0c1e] to-[#070512]">
        <div className="max-w-5xl mx-auto rounded-3xl p-8 md:p-12 border border-indigo-500/30 bg-gradient-to-r from-indigo-950/60 to-purple-950/60 relative overflow-hidden shadow-2xl">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
            <div className="space-y-3 text-center md:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
                <FileText className="w-3.5 h-3.5" />
                <span>Official Technical Documentation</span>
              </div>
              <h3 className="text-2xl md:text-3xl font-extrabold text-white">
                Download 74-Page Enterprise Specification
              </h3>
              <p className="text-xs md:text-sm text-slate-300 max-w-xl">
                Comprehensive handbook including architecture blueprints, 70-honeypot anti-cheat rules, SHAP force equations, REST API contracts, and evaluation benchmarks.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 flex-shrink-0">
              <a
                href="/specification.pdf"
                target="_blank"
                rel="noopener noreferrer"
                onClick={playClick}
                className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-bold text-xs shadow-xl shadow-indigo-500/30 flex items-center justify-center gap-2 transition-transform hover:scale-105"
              >
                <Download className="w-4 h-4" />
                <span>Download PDF (74 Pages)</span>
              </a>
              <a
                href="https://github.com/Ranjeet7680/Recruit-AI-Enterprise-AI-Recruiter-Intelligence-System/wiki"
                target="_blank"
                rel="noopener noreferrer"
                onClick={playClick}
                className="px-5 py-3.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-200 font-bold text-xs border border-white/10 flex items-center justify-center gap-2 transition-transform hover:scale-105"
              >
                <span>Read GitHub Wiki</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════ TEAM NEXORA SECTION ═══════════════ */}
      <section className="relative py-20 px-4 md:px-8 border-t border-white/5 bg-[#080614]/60">
        <div className="max-w-6xl mx-auto space-y-12">
          <div className="text-center space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider text-indigo-400 bg-indigo-500/10 border border-indigo-500/20">
              <Users className="w-3.5 h-3.5" />
              <span>Engineering & Core Leadership</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-extrabold text-white">
              Meet <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-indigo-300 to-purple-400">Team Nexora</span>
            </h2>
            <p className="text-slate-400 max-w-xl mx-auto text-sm">
              The AI engineers, researchers, and systems builders behind the Nexora Autonomous Recruitment Intelligence Platform.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Member 1: Ranjeet Kumar */}
            <motion.div
              whileHover={{ y: -6, borderColor: 'rgba(99,102,241,0.5)' }}
              className="rounded-2xl p-6 relative overflow-hidden transition-all duration-300"
              style={{
                background: 'linear-gradient(145deg, rgba(20,18,40,0.85), rgba(12,10,26,0.95))',
                border: '1px solid rgba(99,102,241,0.25)',
                boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
              }}
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="w-14 h-14 rounded-2xl overflow-hidden border-2 border-indigo-500/40 p-0.5 bg-indigo-500/10 flex-shrink-0 flex items-center justify-center font-bold text-xl text-white shadow-lg shadow-indigo-500/20">
                  <span className="bg-clip-text text-transparent bg-gradient-to-br from-blue-400 to-purple-400">RK</span>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-white">Ranjeet Kumar</h3>
                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300">
                      Leader
                    </span>
                  </div>
                  <p className="text-xs text-indigo-300/80 font-medium">Team Leader & AI Architect</p>
                </div>
              </div>
              <p className="text-xs text-slate-400 mb-4 leading-relaxed">
                Spearheads core ML architectures, multi-factor scoring algorithms, and end-to-end recruitment intelligence pipelines.
              </p>
              <a
                href="mailto:rajranjeet7680@gmail.com"
                className="inline-flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 font-mono transition-colors"
              >
                rajranjeet7680@gmail.com
              </a>
            </motion.div>

            {/* Member 2: GLS Santhosh */}
            <motion.div
              whileHover={{ y: -6, borderColor: 'rgba(139,92,246,0.5)' }}
              className="rounded-2xl p-6 relative overflow-hidden transition-all duration-300"
              style={{
                background: 'linear-gradient(145deg, rgba(20,18,40,0.85), rgba(12,10,26,0.95))',
                border: '1px solid rgba(139,92,246,0.25)',
                boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
              }}
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="w-14 h-14 rounded-2xl overflow-hidden border-2 border-purple-500/40 p-0.5 bg-purple-500/10 flex-shrink-0 flex items-center justify-center font-bold text-xl text-white shadow-lg shadow-purple-500/20">
                  <span className="bg-clip-text text-transparent bg-gradient-to-br from-purple-400 to-pink-400">GS</span>
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">GLS Santhosh</h3>
                  <p className="text-xs text-purple-300/80 font-medium">AI Engineer & Data Scientist</p>
                </div>
              </div>
              <p className="text-xs text-slate-400 mb-4 leading-relaxed">
                Focuses on semantic embedding vectorization, dense retrieval indexing, and deep candidate talent clustering.
              </p>
              <a
                href="mailto:glssanthosh1306@gmail.com"
                className="inline-flex items-center gap-1.5 text-xs text-purple-400 hover:text-purple-300 font-mono transition-colors"
              >
                glssanthosh1306@gmail.com
              </a>
            </motion.div>

            {/* Member 3: Abhishek Kantharia */}
            <motion.div
              whileHover={{ y: -6, borderColor: 'rgba(234,88,12,0.5)' }}
              className="rounded-2xl p-6 relative overflow-hidden transition-all duration-300"
              style={{
                background: 'linear-gradient(145deg, rgba(20,18,40,0.85), rgba(12,10,26,0.95))',
                border: '1px solid rgba(234,88,12,0.25)',
                boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
              }}
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="w-14 h-14 rounded-2xl overflow-hidden border-2 border-amber-500/40 p-0.5 bg-amber-500/10 flex-shrink-0 flex items-center justify-center font-bold text-xl text-white shadow-lg shadow-amber-500/20">
                  <span className="bg-clip-text text-transparent bg-gradient-to-br from-amber-400 to-orange-400">AK</span>
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Abhishek Kantharia</h3>
                  <p className="text-xs text-amber-300/80 font-medium">Full-Stack & Systems Engineer</p>
                </div>
              </div>
              <p className="text-xs text-slate-400 mb-4 leading-relaxed">
                Builds high-performance user interfaces, real-time video telemetry, Web Audio sound engines, and API integrations.
              </p>
              <a
                href="mailto:abhishek11111997@gmail.com"
                className="inline-flex items-center gap-1.5 text-xs text-amber-400 hover:text-amber-300 font-mono transition-colors"
              >
                abhishek11111997@gmail.com
              </a>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ═══════════════ FOOTER ═══════════════ */}
      <footer className="relative py-10 px-4 text-center border-t border-white/5 bg-[#05040e]">
        <div className="flex flex-col items-center justify-center gap-3 text-slate-400 text-sm">
          <div className="flex items-center gap-2.5">
            <Image src="/nexora-logo.png" alt="Nexora" width={24} height={24} className="w-6 h-6 object-contain rounded-md" />
            <span className="font-extrabold text-white tracking-widest text-base">NEXORA</span>
          </div>
          <p className="text-xs text-slate-500">
            Intelligence • Innovation • Impact — Enterprise Recruiter Intelligence System
          </p>
          <p className="text-[11px] text-slate-600">
            © 2026 Team Nexora. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
