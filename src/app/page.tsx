'use client';

import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { KPICards } from '@/components/dashboard/KPICards';
import { Charts } from '@/components/dashboard/Charts';
import { ActivityTimeline } from '@/components/dashboard/ActivityTimeline';
import { playSuccess } from '@/lib/sounds';
import { CalendarPlus, UserPlus, Sparkles, Play } from 'lucide-react';
import Link from 'next/link';

const quickActions = [
  { label: 'Schedule Interview', icon: CalendarPlus, href: '/interviews', color: '#6366f1' },
  { label: 'Add Candidate',      icon: UserPlus,     href: '/candidates',  color: '#8b5cf6' },
  { label: 'Ask AI Copilot',     icon: Sparkles,     href: '/copilot',     color: '#10b981' },
];

export default function Dashboard() {
  useEffect(() => {
    const t = setTimeout(playSuccess, 400);
    return () => clearTimeout(t);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto"
    >
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.05 }}
        className="mb-5 md:mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4"
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
            {/* Shimmer skeleton rows */}
            <div className="w-full max-w-xs mt-5 space-y-2">
              {[80, 65, 90].map((w, i) => (
                <motion.div
                  key={i}
                  className="skeleton h-2 rounded-full"
                  style={{ width: `${w}%`, animationDelay: `${i * 0.15}s` }}
                />
              ))}
            </div>
            <motion.div
              className="flex gap-1.5 mt-4"
            >
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="w-1.5 h-1.5 rounded-full bg-indigo-500"
                  animate={{ y: [0, -5, 0] }}
                  transition={{ repeat: Infinity, duration: 0.8, delay: i * 0.18 }}
                />
              ))}
            </motion.div>
          </div>
        </motion.div>

        <div className="lg:col-span-1">
          <ActivityTimeline />
        </div>
      </div>
    </motion.div>
  );
}
