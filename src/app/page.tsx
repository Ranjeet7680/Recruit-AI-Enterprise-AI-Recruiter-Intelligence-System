'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { KPICards } from '@/components/dashboard/KPICards';
import { Charts } from '@/components/dashboard/Charts';
import { ActivityTimeline } from '@/components/dashboard/ActivityTimeline';
import { playSuccess, playClick } from '@/lib/sounds';
import { 
  CalendarPlus, UserPlus, Sparkles, ArrowRight, Play, Star, ShieldCheck, 
  Cpu, Users, BarChart3, Bot, Video, Mail, CheckCircle2, ChevronRight, LayoutDashboard, ExternalLink
} from 'lucide-react';
import Link from 'next/link';

const quickActions = [
  { label: 'Schedule Interview', icon: CalendarPlus, href: '/interviews', color: '#6366f1' },
  { label: 'Add Candidate',      icon: UserPlus,     href: '/candidates',  color: '#8b5cf6' },
  { label: 'Ask AI Copilot',     icon: Sparkles,     href: '/copilot',     color: '#10b981' },
];

const teamMembers = [
  {
    name: 'Ranjeet Kumar',
    role: 'Team Leader & Lead AI Architect',
    email: 'rajranjeet7680@gmail.com',
    isLeader: true,
    desc: 'Spearheads core ML architectures, 6-factor deterministic scoring engines, 70-honeypot anti-cheat filters, and full-stack integration.',
    badge: 'LEADER (Admin)',
    icon: Sparkles,
    color: '#6366f1'
  },
  {
    name: 'GLS Santhosh',
    role: 'AI Engineer & Data Scientist',
    email: 'glssanthosh1306@gmail.com',
    isLeader: false,
    desc: 'Develops FAISS dense vector search indexing, candidate skill ontology taxonomies, K-Means clustering, and data validation.',
    badge: 'AI Engineer',
    icon: Cpu,
    color: '#8b5cf6'
  },
  {
    name: 'Abhishek Kantharia',
    role: 'Full-Stack & Systems Engineer',
    email: 'abhishek11111997@gmail.com',
    isLeader: false,
    desc: 'Architects high-speed Next.js 16 UI, Web Audio sound synthesis engines, live video telemetry, and HR Multi-Agent Studio.',
    badge: 'Systems Engineer',
    icon: Bot,
    color: '#a855f7'
  }
];

export default function HomePage() {
  const [viewMode, setViewMode] = useState<'landing' | 'dashboard'>('landing');

  useEffect(() => {
    const t = setTimeout(playSuccess, 400);
    return () => clearTimeout(t);
  }, []);

  const handleSwitchToDashboard = () => {
    playClick();
    setViewMode('dashboard');
  };

  const handleSwitchToLanding = () => {
    playClick();
    setViewMode('landing');
  };

  return (
    <div className="min-h-screen bg-[#070610] text-slate-100">
      {/* Top Header Mode Bar */}
      <div className="border-b border-white/10 bg-[#0c0a1f]/90 backdrop-blur-xl sticky top-0 z-40 px-4 md:px-8 py-3 flex items-center justify-between shadow-lg shadow-black/40">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 via-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/30">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-base tracking-tight text-white">
                TalentMind AI
              </span>
              <span className="text-[10px] uppercase font-extrabold tracking-wider px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                v2.0 Enterprise
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-medium">Powered by Team Nexora</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center bg-white/10 p-1 rounded-xl border border-white/10 shadow-inner">
            <button
              onClick={handleSwitchToLanding}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                viewMode === 'landing'
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Landing Page</span>
            </button>
            <button
              onClick={handleSwitchToDashboard}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                viewMode === 'dashboard'
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span>Workspace Dashboard</span>
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {viewMode === 'landing' ? (
          /* ============================================================ */
          /* ULTRA HIGH-CONTRAST LANDING HERO (MATCHING USER SCREENSHOT)  */
          /* ============================================================ */
          <motion.div
            key="landing-view"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.3 }}
            className="max-w-7xl mx-auto px-4 md:px-8 py-8 md:py-14 space-y-16"
          >
            {/* HERO SECTION */}
            <div className="grid lg:grid-cols-12 gap-8 lg:gap-12 items-center">
              <div className="lg:col-span-6 space-y-6">
                {/* Pill Badge */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.1 }}
                  className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/20 border border-indigo-500/40 text-indigo-300 text-xs font-extrabold uppercase tracking-wider shadow-sm"
                >
                  <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Next-Gen Recruitment AI</span>
                </motion.div>

                {/* Main Headline */}
                <motion.h1
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 }}
                  className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-[1.12]"
                >
                  Hire <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">Smarter</span> with AI-Driven Intelligence.
                </motion.h1>

                {/* Subtitle */}
                <motion.p
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="text-base sm:text-lg text-slate-300 max-w-xl leading-relaxed"
                >
                  TalentMind AI transforms enterprise recruitment from a manual grind into a strategic advantage. Screen candidates with 95% accuracy in seconds, not weeks.
                </motion.p>

                {/* Action Buttons */}
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.25 }}
                  className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-2"
                >
                  <button
                    onClick={handleSwitchToDashboard}
                    className="px-8 py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 text-white font-extrabold text-sm shadow-xl shadow-indigo-500/30 hover:shadow-indigo-500/50 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 group"
                  >
                    <span>Recruiter Sign In</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </button>

                  <a
                    href="https://www.linkedin.com/embed/feed/update/urn:li:ugcPost:7473258213853839360"
                    target="_blank"
                    rel="noreferrer"
                    className="px-7 py-3.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-white font-extrabold text-sm transition-all flex items-center justify-center gap-2 shadow-sm"
                  >
                    <Play className="w-4 h-4 fill-current text-indigo-400" />
                    <span>Watch Demo</span>
                  </a>
                </motion.div>

                {/* Social Proof */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="flex items-center gap-4 pt-4 border-t border-white/10"
                >
                  <div className="flex -space-x-3">
                    <div className="w-10 h-10 rounded-full border-2 border-slate-900 bg-indigo-600 flex items-center justify-center text-white text-xs font-bold shadow-md">
                      RK
                    </div>
                    <div className="w-10 h-10 rounded-full border-2 border-slate-900 bg-purple-600 flex items-center justify-center text-white text-xs font-bold shadow-md">
                      GS
                    </div>
                    <div className="w-10 h-10 rounded-full border-2 border-slate-900 bg-pink-600 flex items-center justify-center text-white text-xs font-bold shadow-md">
                      AK
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-extrabold text-white">Trusted by 500+ Global HR Teams</p>
                    <div className="flex items-center gap-1 text-amber-400 text-xs mt-0.5">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="w-3.5 h-3.5 fill-current" />
                      ))}
                      <span className="text-slate-300 font-bold ml-1.5 text-[11px]">5.0 / 5.0 Rating</span>
                    </div>
                  </div>
                </motion.div>
              </div>

              {/* HERO RIGHT SHOWCASE (VIDEO & INTERACTIVE CARD) */}
              <div className="lg:col-span-6">
                <motion.div
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  className="relative rounded-3xl p-6 sm:p-7 overflow-hidden bg-[#0d0b24] border border-white/15 shadow-2xl shadow-black/80"
                >
                  {/* Card Header Traffic Dots + Match Badge */}
                  <div className="flex items-center justify-between mb-6 pb-3 border-b border-white/10">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-rose-500" />
                      <div className="w-3 h-3 rounded-full bg-amber-500" />
                      <div className="w-3 h-3 rounded-full bg-emerald-500" />
                    </div>

                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-extrabold">
                      <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      <span>Match Quality: 98%</span>
                    </div>
                  </div>

                  {/* Embedded Showcase / Video */}
                  <div className="relative aspect-video rounded-2xl overflow-hidden bg-slate-900 border border-white/10 shadow-lg group">
                    <iframe
                      src="https://www.linkedin.com/embed/feed/update/urn:li:ugcPost:7473258213853839360?compact=1"
                      className="w-full h-full border-0"
                      title="Nexora AI Recruiter Video Demonstration"
                      allowFullScreen
                    />
                  </div>

                  <div className="pt-4 flex items-center justify-between text-xs text-slate-300">
                    <span className="font-semibold text-white">Live Platform Demonstration</span>
                    <button
                      onClick={handleSwitchToDashboard}
                      className="text-indigo-400 hover:text-indigo-300 font-bold flex items-center gap-1 transition-colors"
                    >
                      <span>Open Workspace</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </motion.div>
              </div>
            </div>

            {/* TEAM NEXORA SHOWCASE SECTION */}
            <div id="team-nexora" className="pt-12 border-t border-white/10 space-y-10">
              <div className="text-center space-y-3 max-w-2xl mx-auto">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/20 border border-purple-500/40 text-purple-300 text-xs font-extrabold uppercase tracking-wider">
                  <Users className="w-3.5 h-3.5" />
                  <span>Engineering & Leadership</span>
                </div>
                <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                  Team Nexora
                </h2>
                <p className="text-sm text-slate-300">
                  Meet the visionary AI engineers and systems architects behind the Nexora Autonomous Recruitment Intelligence Platform.
                </p>
              </div>

              <div className="grid md:grid-cols-3 gap-6">
                {teamMembers.map((member, i) => (
                  <motion.div
                    key={member.name}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 * i }}
                    whileHover={{ y: -4 }}
                    className="relative rounded-2xl p-6 flex flex-col justify-between space-y-4 bg-[#0e0c26] border border-white/15 shadow-xl transition-all"
                  >
                    <div className="flex items-start justify-between">
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-md"
                        style={{ background: `linear-gradient(135deg, ${member.color}, ${member.color}bb)` }}
                      >
                        <member.icon className="w-6 h-6" />
                      </div>
                      <span
                        className="text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider"
                        style={{
                          background: member.isLeader ? 'rgba(245,158,11,0.2)' : 'rgba(255,255,255,0.08)',
                          color: member.isLeader ? '#fde047' : '#cbd5e1',
                          border: member.isLeader ? '1px solid rgba(245,158,11,0.4)' : '1px solid rgba(255,255,255,0.15)',
                        }}
                      >
                        {member.badge}
                      </span>
                    </div>

                    <div className="space-y-1.5">
                      <h4 className="text-lg font-bold text-white">{member.name}</h4>
                      <p className="text-xs font-bold text-indigo-400">{member.role}</p>
                      <p className="text-xs text-slate-300 leading-relaxed pt-1">{member.desc}</p>
                    </div>

                    <div className="pt-3 border-t border-white/10 flex items-center gap-1.5 text-xs text-slate-300 font-mono">
                      <Mail className="w-3.5 h-3.5 text-indigo-400" />
                      <a href={`mailto:${member.email}`} className="hover:text-indigo-300 hover:underline transition-colors">
                        {member.email}
                      </a>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        ) : (
          /* ============================================================ */
          /* RECRUITER WORKSPACE DASHBOARD VIEW                            */
          /* ============================================================ */
          <motion.div
            key="dashboard-view"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.3 }}
            className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto space-y-6"
          >
            {/* Header */}
            <motion.div
              initial={{ opacity: 0, y: -16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.05 }}
              className="flex flex-col sm:flex-row sm:items-end justify-between gap-4"
            >
              <div>
                <motion.h1
                  className="text-2xl md:text-3xl font-bold mb-1 text-white"
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  Welcome back,{' '}
                  <span
                    className="bg-clip-text text-transparent"
                    style={{ backgroundImage: 'linear-gradient(135deg, #6366f1, #8b5cf6, #a855f7)' }}
                  >
                    Ranjeet 👋
                  </span>
                </motion.h1>
                <p className="text-sm text-slate-400">{"Here's what's happening with your hiring pipeline today."}</p>
              </div>

              {/* Quick Actions */}
              <motion.div
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.15 }}
                className="flex gap-2 flex-wrap"
              >
                {quickActions.map((action) => (
                  <Link key={action.label} href={action.href}>
                    <motion.button
                      whileHover={{ y: -2, boxShadow: `0 6px 20px ${action.color}40` }}
                      whileTap={{ scale: 0.95 }}
                      className="flex items-center gap-1.5 text-xs font-semibold px-3.5 py-2 rounded-xl text-white transition-all"
                      style={{
                        background: `linear-gradient(135deg, ${action.color}22, ${action.color}10)`,
                        border: `1px solid ${action.color}40`,
                        color: action.color,
                        boxShadow: `0 2px 10px ${action.color}20`,
                      }}
                    >
                      <action.icon className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">{action.label}</span>
                    </motion.button>
                  </Link>
                ))}
              </motion.div>
            </motion.div>

            {/* KPI Cards */}
            <KPICards />

            {/* Charts */}
            <Charts />

            {/* Bottom row: AI Recommendations + Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
              <motion.div
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="lg:col-span-2 rounded-2xl p-4 md:p-6 bg-[#0c0a1f] border border-white/10 shadow-xl"
              >
                <div className="flex items-center justify-between mb-5">
                  <h3 className="text-base md:text-lg font-bold text-white">AI Recommendations</h3>
                  <span className="text-[10px] text-purple-400 bg-purple-500/10 px-2.5 py-1 rounded-full font-semibold uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-3 h-3" />
                    Processing
                  </span>
                </div>
                <div className="flex flex-col items-center justify-center h-36 md:h-48 text-center text-slate-400">
                  <motion.div
                    animate={{
                      rotate: [0, 12, -12, 12, 0],
                      scale: [1, 1.05, 1, 1.05, 1],
                    }}
                    transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
                    className="w-14 h-14 md:w-16 md:h-16 mb-4 rounded-2xl flex items-center justify-center"
                    style={{
                      background: 'linear-gradient(135deg, rgba(99,102,241,0.2), rgba(139,92,246,0.1))',
                      boxShadow: '0 0 20px rgba(99,102,241,0.2)',
                    }}
                  >
                    <span className="text-2xl md:text-3xl">🤖</span>
                  </motion.div>
                  <p className="text-sm font-medium text-slate-300 max-w-xs">
                    Analyzing resumes with AI...
                  </p>
                  <div className="w-full max-w-xs mt-5 space-y-2">
                    {[80, 65, 90].map((w, i) => (
                      <motion.div
                        key={i}
                        className="skeleton h-2 rounded-full"
                        style={{ width: `${w}%`, animationDelay: `${i * 0.15}s` }}
                      />
                    ))}
                  </div>
                  <div className="flex gap-1.5 mt-4">
                    {[0, 1, 2].map((i) => (
                      <motion.div
                        key={i}
                        className="w-1.5 h-1.5 rounded-full bg-indigo-500"
                        animate={{ y: [0, -5, 0] }}
                        transition={{ repeat: Infinity, duration: 0.8, delay: i * 0.18 }}
                      />
                    ))}
                  </div>
                </div>
              </motion.div>

              <div className="lg:col-span-1">
                <ActivityTimeline />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
