'use client';

import { Users, UserCheck, Search, Zap, TrendingUp, TrendingDown } from 'lucide-react';
import CountUp from 'react-countup';
import { motion } from 'framer-motion';
import { playPop } from '@/lib/sounds';

const kpis = [
  {
    title: 'Total Candidates',
    value: 1284,
    delta: '+12%',
    up: true,
    icon: Users,
    gradient: 'from-blue-600/20 to-blue-500/5',
    iconBg: 'rgba(59,130,246,0.15)',
    iconColor: 'text-blue-400',
    glowColor: 'rgba(59,130,246,0.25)',
    border: 'rgba(59,130,246,0.2)',
  },
  {
    title: 'Screened Profiles',
    value: 650,
    delta: '+8%',
    up: true,
    icon: Search,
    gradient: 'from-purple-600/20 to-purple-500/5',
    iconBg: 'rgba(139,92,246,0.15)',
    iconColor: 'text-purple-400',
    glowColor: 'rgba(139,92,246,0.25)',
    border: 'rgba(139,92,246,0.2)',
  },
  {
    title: 'Interviews Scheduled',
    value: 120,
    delta: '+24%',
    up: true,
    icon: Zap,
    gradient: 'from-amber-600/20 to-amber-500/5',
    iconBg: 'rgba(245,158,11,0.15)',
    iconColor: 'text-amber-400',
    glowColor: 'rgba(245,158,11,0.25)',
    border: 'rgba(245,158,11,0.2)',
  },
  {
    title: 'Offers Accepted',
    value: 24,
    delta: '-3%',
    up: false,
    icon: UserCheck,
    gradient: 'from-emerald-600/20 to-emerald-500/5',
    iconBg: 'rgba(16,185,129,0.15)',
    iconColor: 'text-emerald-400',
    glowColor: 'rgba(16,185,129,0.25)',
    border: 'rgba(16,185,129,0.2)',
  },
];

export function KPICards() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-5 mb-6 md:mb-8">
      {kpis.map((kpi, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: index * 0.1, ease: [0.23, 1, 0.32, 1] }}
          whileHover={{ y: -4, transition: { duration: 0.2 } }}
          whileTap={{ scale: 0.97 }}
          onHoverStart={playPop}
          className="relative overflow-hidden rounded-2xl cursor-pointer"
          style={{
            background: 'rgba(12,10,28,0.8)',
            border: `1px solid ${kpi.border}`,
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            boxShadow: `0 4px 20px rgba(0,0,0,0.2), 0 0 0 0 ${kpi.glowColor}`,
          }}
        >
          {/* Gradient background */}
          <div className={`absolute inset-0 bg-gradient-to-br ${kpi.gradient} pointer-events-none`} />

          {/* Shimmer sweep on hover */}
          <div className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity overflow-hidden rounded-2xl pointer-events-none">
            <div className="shimmer absolute inset-0" />
          </div>

          <div className="relative z-10 p-4 md:p-5">
            {/* Header */}
            <div className="flex items-start justify-between mb-3">
              <motion.div
                whileHover={{ scale: 1.15, rotate: 5 }}
                transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                className={`p-2 rounded-xl ${kpi.iconColor}`}
                style={{
                  background: kpi.iconBg,
                  boxShadow: `0 0 12px ${kpi.glowColor}`,
                }}
              >
                <kpi.icon className="w-4 h-4 md:w-5 md:h-5" />
              </motion.div>

              {/* Delta badge */}
              <div
                className={`flex items-center gap-0.5 text-[10px] md:text-xs font-bold px-1.5 py-0.5 rounded-full ${
                  kpi.up
                    ? 'bg-emerald-500/15 text-emerald-400'
                    : 'bg-red-500/15 text-red-400'
                }`}
              >
                {kpi.up ? (
                  <TrendingUp className="w-2.5 h-2.5" />
                ) : (
                  <TrendingDown className="w-2.5 h-2.5" />
                )}
                {kpi.delta}
              </div>
            </div>

            {/* Value */}
            <div className="text-2xl md:text-3xl font-bold text-white mb-0.5">
              <CountUp end={kpi.value} duration={2.5} separator="," />
            </div>

            {/* Title */}
            <p className="text-[11px] md:text-xs text-slate-400 font-medium leading-tight">
              {kpi.title}
            </p>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
