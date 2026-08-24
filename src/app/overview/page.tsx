'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import {
  Zap, Users, Video, Sparkles, BarChart3, ArrowRight,
  Brain, Shield, Cpu, Globe, TrendingUp, Star,
  CheckCircle2, Layers, Play, ChevronRight,
} from 'lucide-react';

/* ─────────────── 3D TILT CARD ─────────────── */
function TiltCard({ children, className = '', style = {} }: {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateX = useSpring(useTransform(y, [-0.5, 0.5], [12, -12]), { stiffness: 300, damping: 30 });
  const rotateY = useSpring(useTransform(x, [-0.5, 0.5], [-12, 12]), { stiffness: 300, damping: 30 });
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
      {/* Dynamic highlight */}
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
    Array.from({ length: 60 }, (_, i) => ({
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

/* ─────────────── ORBITING RING ─────────────── */
function OrbitRing({ radius, duration, iconEl, offset = 0 }: {
  radius: number;
  duration: number;
  iconEl: React.ReactNode;
  offset?: number;
}) {
  return (
    <motion.div
      className="absolute"
      style={{ width: radius * 2, height: radius * 2, top: `calc(50% - ${radius}px)`, left: `calc(50% - ${radius}px)` }}
      animate={{ rotate: 360 }}
      transition={{ duration, repeat: Infinity, ease: 'linear', delay: offset }}
    >
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full flex items-center justify-center"
        style={{
          width: 36,
          height: 36,
          background: 'rgba(99,102,241,0.15)',
          border: '1px solid rgba(99,102,241,0.3)',
          backdropFilter: 'blur(8px)',
        }}
      >
        {iconEl}
      </div>
    </motion.div>
  );
}

/* ─────────────── STATS COUNTER ─────────────── */
function StatCounter({ value, suffix, label, color, delay = 0 }: {
  value: number;
  suffix: string;
  label: string;
  color: string;
  delay?: number;
}) {
  const [count, setCount] = useState(0);
  const [started, setStarted] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting && !started) setStarted(true); },
      { threshold: 0.5 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [started]);

  useEffect(() => {
    if (!started) return;
    const timeout = setTimeout(() => {
      const duration = 1800;
      const steps = 60;
      const stepValue = value / steps;
      let current = 0;
      const interval = setInterval(() => {
        current += stepValue;
        if (current >= value) { setCount(value); clearInterval(interval); }
        else setCount(Math.floor(current));
      }, duration / steps);
      return () => clearInterval(interval);
    }, delay);
    return () => clearTimeout(timeout);
  }, [started, value, delay]);

  return (
    <div ref={ref} className="flex flex-col items-center">
      <span className="text-4xl md:text-5xl font-black" style={{ color }}>
        {count.toLocaleString()}{suffix}
      </span>
      <span className="text-sm text-slate-400 font-medium mt-1">{label}</span>
    </div>
  );
}

/* ─────────────── FEATURE CARD ─────────────── */
const featureCards = [
  {
    icon: Brain,
    title: 'AI-Powered Matching',
    desc: 'Neural network ranks candidates with 94% accuracy against your job requirements in real-time.',
    color: '#6366f1',
    glow: 'rgba(99,102,241,0.4)',
    delay: 0,
  },
  {
    icon: Video,
    title: 'Live Interview Room',
    desc: 'Conduct video interviews with AI copilot providing live suggestions and instant scorecards.',
    color: '#8b5cf6',
    glow: 'rgba(139,92,246,0.4)',
    delay: 0.1,
  },
  {
    icon: Shield,
    title: 'Bias-Free Screening',
    desc: 'Objective evaluation removes unconscious bias, ensuring fair and compliant hiring.',
    color: '#10b981',
    glow: 'rgba(16,185,129,0.4)',
    delay: 0.2,
  },
  {
    icon: Cpu,
    title: 'Instant Resume Parser',
    desc: 'Extract and structure any resume format in milliseconds using advanced NLP models.',
    color: '#f59e0b',
    glow: 'rgba(245,158,11,0.4)',
    delay: 0.3,
  },
  {
    icon: Globe,
    title: 'Global Talent Pipeline',
    desc: 'Connect to 500+ job boards simultaneously and manage applicants across regions.',
    color: '#00d4ff',
    glow: 'rgba(0,212,255,0.4)',
    delay: 0.4,
  },
  {
    icon: BarChart3,
    title: 'Hiring Analytics',
    desc: 'Real-time dashboards and predictive insights to optimize your entire hiring funnel.',
    color: '#ec4899',
    glow: 'rgba(236,72,153,0.4)',
    delay: 0.5,
  },
];

/* ─────────────── MODULE PREVIEW CARDS ─────────────── */
const moduleCards = [
  { title: 'Dashboard', href: '/', icon: Layers, color: '#6366f1', desc: 'Pipeline KPIs & AI recommendations' },
  { title: 'Candidates', href: '/candidates', icon: Users, color: '#8b5cf6', desc: 'AI-ranked talent pool' },
  { title: 'Live Interview', href: '/interviews', icon: Video, color: '#10b981', desc: 'Video calls with AI copilot' },
  { title: 'Analytics', href: '/analytics', icon: TrendingUp, color: '#f59e0b', desc: 'Funnel & conversion data' },
];

/* ─────────────── MAIN PAGE ─────────────── */
export default function OverviewPage() {

  return (
    <div className="min-h-screen overflow-x-hidden" style={{ background: '#07060f' }}>

      {/* ═══════════════ HERO SECTION ═══════════════ */}
      <section className="relative min-h-screen flex flex-col items-center justify-center px-4 py-20 overflow-hidden">
        <ParticleField />

        {/* Deep 3D Mesh Background */}
        <div className="absolute inset-0 pointer-events-none" style={{
          background: `
            radial-gradient(ellipse 80% 60% at 50% 0%, rgba(99,102,241,0.15) 0%, transparent 60%),
            radial-gradient(ellipse 50% 50% at 20% 80%, rgba(139,92,246,0.1) 0%, transparent 50%),
            radial-gradient(ellipse 40% 40% at 80% 20%, rgba(0,212,255,0.08) 0%, transparent 50%)
          `
        }} />

        {/* 3D Grid Lines */}
        <div className="absolute inset-0 pointer-events-none" style={{
          backgroundImage: `
            linear-gradient(rgba(99,102,241,0.06) 1px, transparent 1px),
            linear-gradient(90deg, rgba(99,102,241,0.06) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px',
          transform: 'perspective(800px) rotateX(12deg)',
          transformOrigin: 'bottom',
        }} />

        {/* Central Orbit System */}
        <div className="absolute" style={{ width: 400, height: 400, top: '50%', left: '50%', transform: 'translate(-50%, -70%)' }}>
          {/* Orbit ring 1 */}
          <motion.div
            className="absolute inset-0 rounded-full"
            style={{ border: '1px solid rgba(99,102,241,0.15)' }}
            animate={{ rotateX: [0, 360] }}
            transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
          />
          {/* Orbit ring 2 */}
          <motion.div
            className="absolute inset-8 rounded-full"
            style={{ border: '1px dashed rgba(139,92,246,0.12)' }}
          />

          <OrbitRing radius={200} duration={14} iconEl={<Brain className="w-4 h-4 text-indigo-400" />} />
          <OrbitRing radius={200} duration={14} iconEl={<Cpu className="w-4 h-4 text-purple-400" />} offset={-7} />
          <OrbitRing radius={140} duration={9} iconEl={<Shield className="w-4 h-4 text-emerald-400" />} />
          <OrbitRing radius={140} duration={9} iconEl={<Star className="w-4 h-4 text-amber-400" />} offset={-4.5} />
        </div>

        {/* Hero Content */}
        <div className="relative z-10 text-center max-w-5xl mx-auto">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full mb-8 text-xs font-bold tracking-wide"
            style={{
              background: 'rgba(99,102,241,0.12)',
              border: '1px solid rgba(99,102,241,0.35)',
              color: '#c7d2fe',
              boxShadow: '0 0 25px rgba(99,102,241,0.25)',
            }}
          >
            <Image src="/nexora-logo.png" alt="Nexora" width={20} height={20} className="w-5 h-5 object-contain rounded-full" />
            <span className="font-extrabold tracking-wider text-white">NEXORA</span>
            <span className="text-indigo-400">•</span>
            <span>Enterprise AI Recruiter Intelligence</span>
          </motion.div>

          {/* Heading */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.8, ease: [0.23, 1, 0.32, 1] }}
            className="text-5xl md:text-7xl lg:text-8xl font-black leading-[0.95] tracking-tight mb-6"
          >
            <span className="text-white">Hire Smarter</span>
            <br />
            <span
              className="bg-clip-text text-transparent"
              style={{ backgroundImage: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 40%, #00d4ff 100%)' }}
            >
              With AI Precision
            </span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, duration: 0.6 }}
            className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed"
          >
            Nexora AI screens thousands of resumes in seconds, conducts live AI-assisted interviews, 
            and delivers bias-free hiring intelligence — built by Team Nexora.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
          >
            <Link href="/">
              <motion.button
                whileHover={{ scale: 1.05, boxShadow: '0 8px 40px rgba(99,102,241,0.55)' }}
                whileTap={{ scale: 0.97 }}
                className="flex items-center gap-2 px-8 py-4 rounded-2xl text-white font-bold text-base transition-all"
                style={{
                  background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                  boxShadow: '0 4px 24px rgba(99,102,241,0.4)',
                }}
              >
                <Zap className="w-5 h-5" fill="white" />
                Open Dashboard
                <ArrowRight className="w-4 h-4" />
              </motion.button>
            </Link>
            <Link href="/interviews">
              <motion.button
                whileHover={{ scale: 1.03, borderColor: 'rgba(99,102,241,0.5)' }}
                whileTap={{ scale: 0.97 }}
                className="flex items-center gap-2 px-8 py-4 rounded-2xl font-bold text-base transition-all"
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  color: '#e2e8f0',
                }}
              >
                <Play className="w-4 h-4 text-indigo-400" fill="currentColor" />
                Live Interview Demo
              </motion.button>
            </Link>
          </motion.div>

          {/* Trust badges */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3 mt-12"
          >
            {['SOC 2 Compliant', 'GDPR Ready', '99.9% Uptime', 'Enterprise SSO'].map((badge) => (
              <div key={badge} className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                {badge}
              </div>
            ))}
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
          animate={{ y: [0, 8, 0] }}
          transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
        >
          <span className="text-[10px] text-slate-600 font-medium tracking-widest uppercase">Scroll</span>
          <div className="w-px h-8 rounded-full" style={{ background: 'linear-gradient(to bottom, rgba(99,102,241,0.5), transparent)' }} />
        </motion.div>
      </section>

      {/* ═══════════════ STATS SECTION ═══════════════ */}
      <section className="relative py-24 px-4">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.7 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12 p-10 rounded-3xl"
            style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.07)',
              backdropFilter: 'blur(20px)',
            }}
          >
            <StatCounter value={50000} suffix="+" label="Resumes Analyzed" color="#6366f1" delay={0} />
            <StatCounter value={94} suffix="%" label="Match Accuracy" color="#8b5cf6" delay={200} />
            <StatCounter value={72} suffix="%" label="Time Saved" color="#10b981" delay={400} />
            <StatCounter value={1200} suffix="+" label="Companies Hiring" color="#f59e0b" delay={600} />
          </motion.div>
        </div>
      </section>

      {/* ═══════════════ MODULE PREVIEWS ═══════════════ */}
      <section className="relative py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-14"
          >
            <h2 className="text-3xl md:text-5xl font-black text-white mb-4">
              Everything You Need to{' '}
              <span className="bg-clip-text text-transparent"
                style={{ backgroundImage: 'linear-gradient(135deg, #6366f1, #00d4ff)' }}>
                Hire Fast
              </span>
            </h2>
            <p className="text-slate-400 max-w-xl mx-auto">
              Four powerful modules, one unified platform. Navigate your entire hiring workflow without switching tools.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {moduleCards.map((card, i) => (
              <motion.div
                key={card.title}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
              >
                <TiltCard className="group h-full">
                  <Link href={card.href}>
                    <div
                      className="p-6 rounded-2xl h-full transition-all duration-300 group-hover:border-opacity-50"
                      style={{
                        background: 'rgba(255,255,255,0.03)',
                        border: `1px solid ${card.color}22`,
                        backdropFilter: 'blur(16px)',
                      }}
                    >
                      {/* 3D lifted icon */}
                      <motion.div
                        whileHover={{ scale: 1.15, rotateZ: 5 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                        className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                        style={{
                          background: `${card.color}18`,
                          border: `1px solid ${card.color}30`,
                          boxShadow: `0 4px 20px ${card.color}25`,
                        }}
                      >
                        <card.icon className="w-6 h-6" style={{ color: card.color }} />
                      </motion.div>
                      <h3 className="font-bold text-white text-lg mb-2">{card.title}</h3>
                      <p className="text-sm text-slate-400 leading-relaxed mb-4">{card.desc}</p>
                      <div className="flex items-center gap-1 text-xs font-semibold" style={{ color: card.color }}>
                        Open module <ChevronRight className="w-3.5 h-3.5" />
                      </div>
                    </div>
                  </Link>
                </TiltCard>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════ 3D FEATURE GRID ═══════════════ */}
      <section className="relative py-24 px-4">
        {/* Section background glow */}
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse 60% 40% at 50% 50%, rgba(99,102,241,0.06) 0%, transparent 70%)' }} />

        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-14"
          >
            <p className="text-indigo-400 text-sm font-bold uppercase tracking-widest mb-3">Features</p>
            <h2 className="text-3xl md:text-5xl font-black text-white">
              Built for Modern{' '}
              <span className="bg-clip-text text-transparent"
                style={{ backgroundImage: 'linear-gradient(135deg, #8b5cf6, #ec4899)' }}>
                Recruiting Teams
              </span>
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {featureCards.map((feat) => (
              <motion.div
                key={feat.title}
                initial={{ opacity: 0, y: 50, rotateX: -10 }}
                whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ delay: feat.delay, duration: 0.7, ease: [0.23, 1, 0.32, 1] }}
                style={{ transformStyle: 'preserve-3d', perspective: 800 }}
              >
                <TiltCard className="group h-full">
                  <motion.div
                    whileHover={{ boxShadow: `0 12px 40px ${feat.glow}30` }}
                    className="p-6 rounded-2xl h-full transition-all duration-300"
                    style={{
                      background: `linear-gradient(145deg, rgba(255,255,255,0.04), rgba(255,255,255,0.02))`,
                      border: `1px solid rgba(255,255,255,0.06)`,
                    }}
                  >
                    {/* Icon with glow */}
                    <div className="relative w-14 h-14 mb-5">
                      {/* Glow behind icon */}
                      <motion.div
                        className="absolute inset-0 rounded-2xl blur-xl"
                        style={{ background: feat.glow }}
                        animate={{ opacity: [0.3, 0.6, 0.3] }}
                        transition={{ duration: 3, repeat: Infinity, delay: feat.delay }}
                      />
                      <div
                        className="relative w-14 h-14 rounded-2xl flex items-center justify-center"
                        style={{
                          background: `linear-gradient(135deg, ${feat.color}25, ${feat.color}10)`,
                          border: `1px solid ${feat.color}30`,
                        }}
                      >
                        <feat.icon className="w-7 h-7" style={{ color: feat.color }} />
                      </div>
                    </div>

                    <h3 className="text-lg font-bold text-white mb-2">{feat.title}</h3>
                    <p className="text-sm text-slate-400 leading-relaxed">{feat.desc}</p>

                    {/* Hover reveal bar */}
                    <motion.div
                      className="mt-4 h-0.5 rounded-full"
                      style={{ background: `linear-gradient(90deg, ${feat.color}, transparent)` }}
                      initial={{ scaleX: 0, originX: 0 }}
                      whileInView={{ scaleX: 1 }}
                      viewport={{ once: true }}
                      transition={{ delay: feat.delay + 0.3, duration: 0.6 }}
                    />
                  </motion.div>
                </TiltCard>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════ 3D FLOATING SCREEN MOCKUP ═══════════════ */}
      <section className="relative py-24 px-4 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse 60% 50% at 50% 60%, rgba(99,102,241,0.08) 0%, transparent 60%)' }} />

        <div className="max-w-5xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-12"
          >
            <h2 className="text-3xl md:text-5xl font-black text-white mb-4">
              See It in{' '}
              <span className="bg-clip-text text-transparent"
                style={{ backgroundImage: 'linear-gradient(135deg, #10b981, #6366f1)' }}>
                Action
              </span>
            </h2>
            <p className="text-slate-400">Jump into any module and experience the difference.</p>
          </motion.div>

          {/* 3D floating screen */}
          <motion.div
            initial={{ opacity: 0, y: 60, rotateX: 20 }}
            whileInView={{ opacity: 1, y: 0, rotateX: 8 }}
            viewport={{ once: true }}
            transition={{ duration: 1, ease: [0.23, 1, 0.32, 1] }}
            style={{ transformStyle: 'preserve-3d', perspective: 1200, transformOrigin: 'bottom' }}
            className="relative mx-auto max-w-3xl"
          >
            <motion.div
              animate={{ y: [0, -12, 0] }}
              transition={{ repeat: Infinity, duration: 4.5, ease: 'easeInOut' }}
            >
            {/* Glow under card */}
            <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-3/4 h-24 blur-3xl rounded-full pointer-events-none"
              style={{ background: 'rgba(99,102,241,0.25)' }} />

            {/* Screen frame */}
            <div className="rounded-2xl overflow-hidden shadow-2xl"
              style={{
                border: '1px solid rgba(99,102,241,0.25)',
                background: 'rgba(8,6,20,0.95)',
                boxShadow: '0 40px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(99,102,241,0.15)',
              }}>
              {/* Fake browser bar */}
              <div className="flex items-center gap-2 px-4 py-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.03)' }}>
                <div className="w-3 h-3 rounded-full bg-red-500 opacity-70" />
                <div className="w-3 h-3 rounded-full bg-yellow-500 opacity-70" />
                <div className="w-3 h-3 rounded-full bg-green-500 opacity-70" />
                <div className="flex-1 mx-4 h-5 rounded-md text-center text-[10px] text-slate-500 font-medium flex items-center justify-center"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.07)' }}>
                  talentmind.ai/dashboard
                </div>
              </div>

              {/* Fake dashboard inside */}
              <div className="p-6 space-y-4">
                {/* KPI row */}
                <div className="grid grid-cols-4 gap-3">
                  {[
                    { label: 'Candidates', v: '1,284', c: '#6366f1' },
                    { label: 'Screened', v: '650', c: '#8b5cf6' },
                    { label: 'Interviews', v: '120', c: '#f59e0b' },
                    { label: 'Offers', v: '24', c: '#10b981' },
                  ].map((k) => (
                    <motion.div
                      key={k.label}
                      initial={{ opacity: 0, y: 10 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      className="rounded-xl p-3"
                      style={{ background: `${k.c}12`, border: `1px solid ${k.c}25` }}
                    >
                      <div className="text-xl font-black" style={{ color: k.c }}>{k.v}</div>
                      <div className="text-[10px] text-slate-500 font-medium">{k.label}</div>
                    </motion.div>
                  ))}
                </div>

                {/* Chart bar */}
                <div className="rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div className="text-xs text-slate-400 font-semibold mb-3">Hiring Pipeline</div>
                  <div className="flex items-end gap-2 h-20">
                    {[80, 55, 25, 10, 18, 35, 45, 70, 90, 65, 40, 55].map((h, i) => (
                      <motion.div
                        key={i}
                        className="flex-1 rounded-sm"
                        initial={{ scaleY: 0 }}
                        whileInView={{ scaleY: 1 }}
                        viewport={{ once: true }}
                        transition={{ delay: i * 0.05, duration: 0.5 }}
                        style={{
                          height: `${h}%`,
                          background: `linear-gradient(to top, #6366f1, #8b5cf6)`,
                          transformOrigin: 'bottom',
                          opacity: 0.7 + (i % 3) * 0.1,
                        }}
                      />
                    ))}
                  </div>
                </div>

                {/* Candidate row */}
                <div className="space-y-2">
                  {[
                    { name: 'Aria Sterling', role: 'Senior Frontend', score: 92, c: '#10b981' },
                    { name: 'John Doe', role: 'DevOps Engineer', score: 88, c: '#6366f1' },
                  ].map((c) => (
                    <div key={c.name} className="flex items-center gap-3 rounded-xl px-3 py-2"
                      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-bold text-white"
                        style={{ background: `linear-gradient(135deg, ${c.c}, #8b5cf6)` }}>
                        {c.name[0]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-bold text-white">{c.name}</div>
                        <div className="text-[10px] text-slate-500">{c.role}</div>
                      </div>
                      <div className="text-xs font-black" style={{ color: c.c }}>{c.score}%</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Product Showcase Section */}
      <section className="relative py-16 px-4">
        <div className="max-w-5xl mx-auto">
          <div
            className="rounded-3xl p-6 md:p-8 border border-white/10 shadow-xl"
            style={{
              background: 'linear-gradient(135deg, rgba(99,102,241,0.05), rgba(139,92,246,0.03))',
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
            }}
          >
            <div className="space-y-4 text-center max-w-2xl mx-auto mb-8">
              <span className="text-[10px] text-indigo-400 bg-indigo-500/10 px-2.5 py-1 rounded-full font-semibold uppercase tracking-wider inline-block">
                Product Showcase
              </span>
              <h3 className="text-xl md:text-2xl font-bold text-white">
                Experience TalentMind AI in Action
              </h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Explore our live walkthrough demonstration and feature reveal, showing real-time Zoom video call integration, draggable picture-in-picture video feeds, live recruiter scorecards, and vector similarity mapping.
              </p>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8 justify-items-center">
              {/* Demo Video Card */}
              <motion.div
                whileHover={{ y: -8, scale: 1.02 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                className="flex flex-col items-center w-full max-w-[520px] cursor-pointer"
              >
                <h4 className="text-xs font-semibold text-slate-500 mb-3 uppercase tracking-widest text-center transition-colors duration-300 hover:text-indigo-400">Walkthrough Demo Video</h4>
                <div className="rounded-2xl overflow-hidden border border-white/10 shadow-2xl relative bg-black/50 p-1 w-full transition-all duration-300 hover:border-indigo-500/50 hover:shadow-indigo-500/10">
                  <iframe
                    src="https://www.linkedin.com/embed/feed/update/urn:li:ugcPost:7473258213853839360?compact=1"
                    height="399"
                    width="100%"
                    frameBorder="0"
                    allowFullScreen={true}
                    title="Walkthrough Demo Video"
                    className="rounded-xl aspect-[504/399]"
                  ></iframe>
                </div>
              </motion.div>
              {/* Cinematic Video Card */}
              <motion.div
                whileHover={{ y: -8, scale: 1.02 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                className="flex flex-col items-center w-full max-w-[520px] cursor-pointer"
              >
                <h4 className="text-xs font-semibold text-slate-500 mb-3 uppercase tracking-widest text-center transition-colors duration-300 hover:text-indigo-400">Cinematic Reveal Video</h4>
                <div className="rounded-2xl overflow-hidden border border-white/10 shadow-2xl relative bg-black/50 p-1 w-full transition-all duration-300 hover:border-indigo-500/50 hover:shadow-indigo-500/10">
                  <iframe
                    src="https://www.linkedin.com/embed/feed/update/urn:li:ugcPost:7476638593818451969?compact=1"
                    height="399"
                    width="100%"
                    frameBorder="0"
                    allowFullScreen={true}
                    title="Cinematic Reveal Video"
                    className="rounded-xl aspect-[504/399]"
                  ></iframe>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════ CTA SECTION ═══════════════ */}
      <section className="relative py-24 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, ease: [0.23, 1, 0.32, 1] }}
            className="rounded-3xl p-12 relative overflow-hidden"
            style={{
              background: 'linear-gradient(145deg, rgba(99,102,241,0.15), rgba(139,92,246,0.1))',
              border: '1px solid rgba(99,102,241,0.25)',
            }}
          >
            {/* Background orbs */}
            <motion.div className="absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl pointer-events-none"
              style={{ background: 'rgba(99,102,241,0.15)' }}
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
            />
            <motion.div className="absolute bottom-0 left-0 w-48 h-48 rounded-full blur-3xl pointer-events-none"
              style={{ background: 'rgba(139,92,246,0.12)' }}
              animate={{ scale: [1, 1.3, 1] }}
              transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
            />

            <div className="relative z-10">
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6"
                style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', boxShadow: '0 0 30px rgba(99,102,241,0.4)' }}
              >
                <Zap className="w-8 h-8 text-white" fill="white" />
              </motion.div>

              <h2 className="text-3xl md:text-4xl font-black text-white mb-4">
                Ready to Transform Your Hiring?
              </h2>
              <p className="text-slate-400 mb-8 max-w-md mx-auto">
                Start hiring 5x faster with AI precision. No setup fees, no contracts — just better hires.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/">
                  <motion.button
                    whileHover={{ scale: 1.05, boxShadow: '0 8px 40px rgba(99,102,241,0.5)' }}
                    whileTap={{ scale: 0.97 }}
                    className="flex items-center gap-2 px-8 py-4 rounded-2xl text-white font-bold text-base"
                    style={{
                      background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                      boxShadow: '0 4px 24px rgba(99,102,241,0.35)',
                    }}
                  >
                    <Sparkles className="w-5 h-5" />
                    Launch Platform
                  </motion.button>
                </Link>
                <Link href="/candidates">
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    className="flex items-center gap-2 px-8 py-4 rounded-2xl font-bold text-base"
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', color: '#e2e8f0' }}
                  >
                    <Users className="w-4 h-4 text-indigo-400" />
                    Browse Candidates
                  </motion.button>
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Team Nexora Section */}
      <section className="relative py-20 px-4 md:px-8 border-t border-white/5 bg-[#080614]/60">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 mb-3">
              <Users className="w-3.5 h-3.5" />
              Engineering & Core Leadership
            </div>
            <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-3">
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

      {/* Footer */}
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
