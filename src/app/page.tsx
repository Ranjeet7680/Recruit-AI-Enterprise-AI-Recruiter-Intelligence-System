'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { KPICards } from '@/components/dashboard/KPICards';
import { Charts } from '@/components/dashboard/Charts';
import { ActivityTimeline } from '@/components/dashboard/ActivityTimeline';
import { playSuccess, playClick } from '@/lib/sounds';
import { 
  CalendarPlus, UserPlus, Sparkles, ArrowRight, Play, Star, ShieldCheck, 
  Cpu, Users, BarChart3, Bot, Video, Mail, CheckCircle2, ChevronRight, LayoutDashboard
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
    <div className="min-h-screen">
      {/* Top Mode Bar */}
      <div className="border-b border-white/10 bg-slate-950/60 backdrop-blur-md sticky top-0 z-40 px-4 md:px-8 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/30">
            <Sparkles className="w-4 h-4" />
          </div>
          <span className="font-bold text-sm tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400">
            Nexora TalentMind AI
          </span>
          <span className="hidden sm:inline-block text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 ml-2">
            v2.0 Production
          </span>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center bg-white/5 p-1 rounded-xl border border-white/10">
            <button
              onClick={handleSwitchToLanding}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                viewMode === 'landing'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Landing Page</span>
            </button>
            <button
              onClick={handleSwitchToDashboard}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                viewMode === 'dashboard'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span>Recruiter Workspace</span>
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {viewMode === 'landing' ? (
          /* ============================================================ */
          /* LANDING PAGE HERO VIEW (MATCHING USER SCREENSHOT)            */
          /* ============================================================ */
          <motion.div
            key="landing-view"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.4 }}
            className="max-w-7xl mx-auto px-4 md:px-8 py-8 md:py-16 space-y-16 md:space-y-24"
          >
            {/* HERO SECTION */}
            <div className="grid lg:grid-cols-12 gap-8 lg:gap-12 items-center">
              <div className="lg:col-span-7 space-y-6">
                {/* Badge */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.1 }}
                  className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-xs font-bold uppercase tracking-wider"
                >
                  <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Next-Gen Recruitment AI</span>
                </motion.div>

                {/* Main Headline */}
                <motion.h1
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 }}
                  className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-[1.15]"
                >
                  Hire <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">Smarter</span> with AI-Driven Intelligence.
                </motion.h1>

                {/* Subtitle */}
                <motion.p
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="text-base sm:text-lg text-slate-300 max-w-2xl leading-relaxed"
                >
                  Nexora TalentMind AI transforms enterprise recruitment from a manual grind into a strategic advantage. Screen candidates with 95% accuracy in seconds, not weeks.
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
                    className="px-7 py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 text-white font-bold text-sm shadow-xl shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 group"
                  >
                    <span>Recruiter Sign In</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </button>

                  <a
                    href="https://www.linkedin.com/embed/feed/update/urn:li:ugcPost:7473258213853839360"
                    target="_blank"
                    rel="noreferrer"
                    className="px-6 py-3.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-200 hover:text-white font-bold text-sm transition-all flex items-center justify-center gap-2"
                  >
                    <Play className="w-4 h-4 fill-current text-indigo-400" />
                    <span>Watch Demo</span>
                  </a>
                </motion.div>

                {/* Social Proof Avatars */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="flex items-center gap-4 pt-4 border-t border-white/10"
                >
                  <div className="flex -space-x-3">
                    <div className="w-10 h-10 rounded-full border-2 border-slate-900 bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center text-white text-xs font-bold shadow-md">
                      RK
                    </div>
                    <div className="w-10 h-10 rounded-full border-2 border-slate-900 bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold shadow-md">
                      GS
                    </div>
                    <div className="w-10 h-10 rounded-full border-2 border-slate-900 bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold shadow-md">
                      AK
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-200">Trusted by 500+ Global HR Teams</p>
                    <div className="flex items-center gap-1 text-amber-400 text-xs mt-0.5">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="w-3.5 h-3.5 fill-current" />
                      ))}
                      <span className="text-slate-400 font-semibold ml-1.5 text-[11px]">5.0 / 5.0 Rating</span>
                    </div>
                  </div>
                </motion.div>
              </div>

              {/* HERO RIGHT PREVIEW CARD (MATCHING USER SCREENSHOT) */}
              <div className="lg:col-span-5">
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  className="relative rounded-3xl p-6 sm:p-8 overflow-hidden"
                  style={{
                    background: 'linear-gradient(135deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02))',
                    border: '1px solid rgba(255,255,255,0.12)',
                    boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.15)',
                    backdropFilter: 'blur(20px)',
                  }}
                >
                  {/* Card Header Traffic Dots + Match Badge */}
                  <div className="flex items-center justify-between mb-8 pb-4 border-b border-white/10">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-rose-500/80" />
                      <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                      <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
                    </div>

                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold">
                      <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      <span>Match Quality: 98%</span>
                    </div>
                  </div>

                  {/* Card Center Content */}
                  <div className="flex flex-col items-center text-center py-6 space-y-4">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shadow-lg shadow-indigo-500/20">
                      <Sparkles className="w-8 h-8 text-indigo-400" />
                    </div>

                    <h3 className="text-xl font-extrabold text-white">
                      TalentMind AI Dashboard
                    </h3>

                    <p className="text-xs sm:text-sm text-slate-400 max-w-sm leading-relaxed">
                      Real-time LLM candidate scoring, semantic resume matching, and bias-reduction shielding.
                    </p>

                    <button
                      onClick={handleSwitchToDashboard}
                      className="mt-4 px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-xs font-bold text-white flex items-center gap-2 transition-all hover:scale-105"
                    >
                      <span>Explore Live Workspace</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </motion.div>
              </div>
            </div>

            {/* TEAM NEXORA SHOWCASE SECTION */}
            <div id="team-nexora" className="pt-12 border-t border-white/10 space-y-10">
              <div className="text-center space-y-3 max-w-2xl mx-auto">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-bold uppercase tracking-wider">
                  <Users className="w-3.5 h-3.5" />
                  <span>Engineering & Leadership</span>
                </div>
                <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                  Team Nexora
                </h2>
                <p className="text-sm text-slate-400">
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
                    className="relative rounded-2xl p-6 flex flex-col justify-between space-y-4 transition-all"
                    style={{
                      background: member.isLeader
                        ? 'linear-gradient(135deg, rgba(99,102,241,0.12), rgba(139,92,246,0.06))'
                        : 'rgba(255,255,255,0.03)',
                      border: member.isLeader
                        ? '1px solid rgba(99,102,241,0.4)'
                        : '1px solid rgba(255,255,255,0.08)',
                      boxShadow: member.isLeader
                        ? '0 10px 30px -10px rgba(99,102,241,0.2)'
                        : 'none',
                    }}
                  >
                    <div className="flex items-start justify-between">
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center text-white"
                        style={{ background: `linear-gradient(135deg, ${member.color}, ${member.color}88)` }}
                      >
                        <member.icon className="w-6 h-6" />
                      </div>
                      <span
                        className="text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider"
                        style={{
                          background: member.isLeader ? 'rgba(245,158,11,0.15)' : 'rgba(255,255,255,0.06)',
                          color: member.isLeader ? '#fbbf24' : '#94a3b8',
                          border: member.isLeader ? '1px solid rgba(245,158,11,0.3)' : '1px solid rgba(255,255,255,0.1)',
                        }}
                      >
                        {member.badge}
                      </span>
                    </div>

                    <div className="space-y-1.5">
                      <h4 className="text-lg font-bold text-white">{member.name}</h4>
                      <p className="text-xs font-semibold text-indigo-400">{member.role}</p>
                      <p className="text-xs text-slate-400 leading-relaxed pt-1">{member.desc}</p>
                    </div>

                    <div className="pt-3 border-t border-white/5 flex items-center gap-1.5 text-xs text-slate-400 font-mono">
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
            transition={{ duration: 0.4 }}
            className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto space-y-6"
          >
            {/* Header */}
            <motion.div
              initial={{ opacity: 0, y: -16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.05 }}
              className="flex flex-col sm:flex-row sm:items-end justify-between gap-4"
            >
              <div>
                <motion.h1
                  className="text-2xl md:text-3xl font-bold mb-1"
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
                className="lg:col-span-2 rounded-2xl p-4 md:p-6"
                style={{
                  background: 'rgba(12,10,28,0.8)',
                  border: '1px solid rgba(255,255,255,0.06)',
                  backdropFilter: 'blur(16px)',
                  WebkitBackdropFilter: 'blur(16px)',
                }}
              >
                <div className="flex items-center justify-between mb-5">
                  <h3 className="text-base md:text-lg font-bold text-white">AI Recommendations</h3>
                  <span className="text-[10px] text-purple-400 bg-purple-500/10 px-2.5 py-1 rounded-full font-semibold uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-3 h-3" />
                    Processing
                  </span>
                </div>
                <div className="flex flex-col items-center justify-center h-36 md:h-48 text-center text-slate-500">
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
                  <p className="text-sm font-medium text-slate-400 max-w-xs">
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
