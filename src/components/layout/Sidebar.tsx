'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { 
  Home, Users, Sparkles, BarChart3, Settings, Video, 
  Layers, Bot, ArrowUpDown, Check, Copy, ExternalLink, X, Terminal
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';
import { playClick } from '@/lib/sounds';

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  isNew?: boolean;
}

const navItems: NavItem[] = [
  { name: 'Overview',      href: '/overview',   icon: Layers, isNew: true },
  { name: 'Dashboard',    href: '/',           icon: Home },
  { name: 'Candidates',   href: '/candidates', icon: Users },
  { name: 'HR Agents',    href: '/agents',     icon: Bot, isNew: true },
  { name: 'Live Interview',href: '/interviews', icon: Video },
  { name: 'AI Copilot',   href: '/copilot',    icon: Sparkles },
  { name: 'Analytics',    href: '/analytics',  icon: BarChart3 },
  { name: 'Settings',     href: '/settings',   icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const [showVersionModal, setShowVersionModal] = useState(false);
  const [copied, setCopied] = useState(false);

  const copyStreamlitCmd = () => {
    navigator.clipboard.writeText('streamlit run streamlit_app/main.py --server.port 8501');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      <motion.aside
        initial={{ x: -80, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 260, damping: 28, delay: 0.1 }}
        className="hidden md:flex flex-col w-64 h-screen fixed top-0 left-0 z-40"
        style={{
          background: 'rgba(8,6,20,0.88)',
          borderRight: '1px solid rgba(255,255,255,0.06)',
          backdropFilter: 'blur(24px) saturate(180%)',
          WebkitBackdropFilter: 'blur(24px) saturate(180%)',
        }}
      >
        {/* Logo */}
        <div className="px-5 py-5 border-b border-white/5">
          <Link href="/overview" onClick={playClick}>
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.25 }}
              className="flex items-center gap-3 cursor-pointer group"
            >
              {/* Logo Image */}
              <div className="relative w-10 h-10 rounded-xl overflow-hidden flex-shrink-0 border border-white/10 bg-white/5 flex items-center justify-center p-1 shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform duration-300">
                <Image
                  src="/nexora-logo.png"
                  alt="Nexora Logo"
                  width={40}
                  height={40}
                  className="w-full h-full object-contain rounded-lg"
                />
              </div>
              <div>
                <h1 className="text-lg font-extrabold tracking-wider bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-indigo-300 to-purple-400 leading-tight">
                  NEXORA
                </h1>
                <p className="text-[9px] text-indigo-300/70 font-semibold tracking-widest uppercase">
                  AI Recruiter Intelligence
                </p>
              </div>
            </motion.div>
          </Link>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto no-scrollbar">
          {navItems.map((item, index) => {
            const isActive = pathname === item.href;
            return (
              <motion.div
                key={item.name}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.15 + index * 0.07, type: 'spring', stiffness: 300, damping: 28 }}
              >
                <Link
                  href={item.href}
                  onClick={playClick}
                  className={clsx(
                    'relative flex items-center gap-3 px-4 py-3 rounded-xl transition-colors duration-200 group overflow-hidden',
                    isActive
                      ? 'text-white'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                  )}
                >
                  {/* Active background */}
                  {isActive && (
                    <motion.div
                      layoutId="sidebar-active-bg"
                      className="absolute inset-0 rounded-xl"
                      style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.25), rgba(139,92,246,0.15))' }}
                      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                    />
                  )}
                  {/* Active left accent */}
                  {isActive && (
                    <motion.div
                      layoutId="sidebar-active-bar"
                      className="absolute left-0 top-2 bottom-2 w-0.5 rounded-full"
                      style={{ background: 'linear-gradient(to bottom, #6366f1, #8b5cf6)' }}
                      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                    />
                  )}
                  <motion.div
                    whileHover={{ scale: 1.15 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                    className="relative z-10"
                  >
                    <item.icon
                      className={clsx('w-5 h-5 transition-colors', isActive ? 'text-indigo-400' : '')}
                    />
                  </motion.div>
                  <span className="relative z-10 text-sm font-medium">{item.name}</span>

                  {/* New badge */}
                  {item.isNew && !isActive && (
                    <span className="relative z-10 ml-auto text-[8px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider"
                      style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: 'white' }}>
                      3D
                    </span>
                  )}

                  {/* Interviews badge */}
                  {item.name === 'Live Interview' && (
                    <span className="relative z-10 ml-auto flex items-center gap-1 text-[9px] font-bold text-red-400 uppercase tracking-wider">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-live" />
                      Live
                    </span>
                  )}
                </Link>
              </motion.div>
            );
          })}
        </nav>

        {/* Version Switcher Widget */}
        <div className="px-4 py-2 border-t border-white/5">
          <button
            onClick={() => { playClick(); setShowVersionModal(true); }}
            className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/5 transition-all text-left group"
          >
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <div>
                <span className="text-[11px] font-bold text-slate-200 group-hover:text-white block">
                  v2.0 Enterprise
                </span>
                <span className="text-[9px] text-indigo-400 font-mono">
                  Next.js 16 Active
                </span>
              </div>
            </div>
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-300 transition-colors" />
          </button>
        </div>

        {/* User Profile */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="px-4 py-3 border-t border-white/5"
        >
          <div className="flex items-center gap-3 px-2 py-1.5 rounded-xl hover:bg-white/5 transition-colors cursor-pointer">
            {/* Avatar with pulsing status */}
            <div className="relative flex-shrink-0">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs text-white"
                style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}
              >
                RK
              </div>
              {/* Online dot */}
              <span
                className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-[#080614] bg-emerald-500"
                style={{ animation: 'glow-pulse 2s ease-in-out infinite' }}
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-white truncate">Ranjeet Kumar</p>
              <p className="text-[10px] text-indigo-300/80 truncate">Team Nexora • Leader</p>
            </div>
          </div>
        </motion.div>
      </motion.aside>

      {/* Version Switcher Modal */}
      <AnimatePresence>
        {showVersionModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.92, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.92, opacity: 0, y: 20 }}
              className="w-full max-w-lg rounded-3xl p-6 bg-[#0c0a1e] border border-indigo-500/30 shadow-2xl space-y-6 text-slate-100 relative overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                    <ArrowUpDown className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">Application Version Switcher</h3>
                    <p className="text-xs text-slate-400">Switch between Enterprise Next.js and Classic Streamlit</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowVersionModal(false)}
                  className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Version Options */}
              <div className="space-y-3">
                {/* Option 1: v2.0 Enterprise (Current) */}
                <div className="p-4 rounded-2xl bg-indigo-950/40 border-2 border-indigo-500/50 relative">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-sm">v2.0 Nexora Enterprise</span>
                      <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                        <Check className="w-3 h-3" /> ACTIVE NOW
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-slate-300 mb-2">
                    Next.js 16 App Router, Autonomous HR Multi-Agents, Real-time Video Call with Web Audio, SHAP force charts, and 3D Framer Motion UI.
                  </p>
                  <div className="text-[11px] font-mono text-indigo-300 bg-black/40 px-3 py-1.5 rounded-lg border border-white/5">
                    Live URL: https://recruit-ai-enterprise-ai-recruiter.vercel.app
                  </div>
                </div>

                {/* Option 2: v1.0 Streamlit Classic */}
                <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-indigo-500/30 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-200 text-sm">v1.0 Streamlit Classic UI</span>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">
                        LEGACY / OLD VERSION
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-slate-400 mb-3">
                    Original single-page Python Streamlit dashboard. Located in <code className="text-indigo-300 font-mono text-[11px]">streamlit_app/main.py</code>.
                  </p>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2 p-2 rounded-xl bg-black/60 border border-white/10 text-[11px] font-mono text-slate-300">
                      <div className="flex items-center gap-2 truncate">
                        <Terminal className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" />
                        <span className="truncate">streamlit run streamlit_app/main.py</span>
                      </div>
                      <button
                        onClick={copyStreamlitCmd}
                        className="px-2.5 py-1 rounded-md bg-white/10 hover:bg-white/20 text-white flex items-center gap-1 text-[10px] transition-colors flex-shrink-0"
                      >
                        {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        {copied ? 'Copied' : 'Copy'}
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      <a
                        href="http://localhost:8501"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 text-center py-2 rounded-xl bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-500/30 text-indigo-200 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                      >
                        <span>Open Local Streamlit (Port 8501)</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                </div>
              </div>

              {/* Launcher Hint */}
              <div className="text-[11px] text-slate-400 bg-white/[0.02] p-3 rounded-xl border border-white/5 flex items-center gap-2">
                <span className="text-base">💡</span>
                <span>
                  Tip: Double-click <strong className="text-white">launch_old_version.bat</strong> in your project folder to start the old Streamlit version automatically.
                </span>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
