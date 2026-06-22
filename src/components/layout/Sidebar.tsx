'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Users, Sparkles, BarChart3, Settings, Video, Zap, Layers } from 'lucide-react';
import { motion } from 'framer-motion';
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
  { name: 'Live Interview',href: '/interviews', icon: Video },
  { name: 'AI Copilot',   href: '/copilot',    icon: Sparkles },
  { name: 'Analytics',    href: '/analytics',  icon: BarChart3 },
  { name: 'Settings',     href: '/settings',   icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
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
      <div className="px-6 py-6 border-b border-white/5">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.25 }}
          className="flex items-center gap-3"
        >
          {/* Animated icon */}
          <motion.div
            animate={{ rotate: [0, 8, -8, 0] }}
            transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}
            className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}
          >
            <Zap className="w-5 h-5 text-white" fill="white" />
          </motion.div>
          <div>
            <h1 className="text-lg font-bold leading-tight text-white">TalentMind</h1>
            <p className="text-[10px] text-slate-400 font-medium tracking-widest uppercase">AI Recruiter</p>
          </div>
        </motion.div>
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

      {/* User Profile */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="px-4 py-4 border-t border-white/5"
      >
        <div className="flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-white/5 transition-colors cursor-pointer">
          {/* Avatar with pulsing status */}
          <div className="relative flex-shrink-0">
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm text-white"
              style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}
            >
              RJ
            </div>
            {/* Online dot */}
            <span
              className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[#080614] bg-emerald-500"
              style={{ animation: 'glow-pulse 2s ease-in-out infinite' }}
            />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white truncate">Ranjeet</p>
            <p className="text-[11px] text-slate-400 truncate">Lead Recruiter</p>
          </div>
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0" />
        </div>
      </motion.div>
    </motion.aside>
  );
}
