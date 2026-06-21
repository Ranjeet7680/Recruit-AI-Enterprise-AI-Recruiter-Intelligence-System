'use client';

import { motion } from 'framer-motion';
import { Users, Clock, Target, TrendingUp } from 'lucide-react';
import CountUp from 'react-countup';

const metrics = [
  { label: 'Candidates',     value: 1284,  suffix: '',  icon: Users,      color: 'text-blue-400',    glow: 'rgba(59,130,246,0.3)' },
  { label: 'Interviews',     value: 42,    suffix: '',  icon: Clock,      color: 'text-purple-400',  glow: 'rgba(139,92,246,0.3)' },
  { label: 'Match Accuracy', value: 94,    suffix: '%', icon: Target,     color: 'text-emerald-400', glow: 'rgba(16,185,129,0.3)' },
  { label: 'Time Reduced',   value: 63,    suffix: '%', icon: TrendingUp, color: 'text-indigo-400',  glow: 'rgba(99,102,241,0.3)'  },
];

export function FloatingMetrics() {
  return (
    <motion.div
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: 'spring', damping: 22, stiffness: 120, delay: 0.6 }}
      className="hidden xl:flex fixed top-4 right-6 z-50 items-center gap-1 px-4 py-2.5 rounded-2xl"
      style={{
        background: 'rgba(8,6,20,0.82)',
        border: '1px solid rgba(255,255,255,0.07)',
        backdropFilter: 'blur(20px) saturate(180%)',
        WebkitBackdropFilter: 'blur(20px) saturate(180%)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.3), 0 0 0 1px rgba(99,102,241,0.1)',
      }}
    >
      {metrics.map((metric, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.7 + index * 0.08 }}
          whileHover={{ scale: 1.05, y: -2 }}
          className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl transition-colors hover:bg-white/5 cursor-default"
        >
          {/* Icon with glow */}
          <motion.div
            animate={{ scale: [1, 1.08, 1] }}
            transition={{ repeat: Infinity, duration: 3, delay: index * 0.5, ease: 'easeInOut' }}
            className={`p-1.5 rounded-lg ${metric.color}`}
            style={{
              background: metric.glow.replace('0.3', '0.12'),
              boxShadow: `0 0 8px ${metric.glow}`,
            }}
          >
            <metric.icon className="w-3.5 h-3.5" />
          </motion.div>

          <div>
            <p className="text-[9px] text-slate-500 uppercase tracking-widest font-semibold leading-none mb-0.5">
              {metric.label}
            </p>
            <p className="text-sm font-bold text-white leading-none">
              <CountUp end={metric.value} duration={2} separator="," />
              {metric.suffix}
            </p>
          </div>

          {/* Divider */}
          {index < metrics.length - 1 && (
            <div className="w-px h-6 bg-white/8 ml-1" />
          )}
        </motion.div>
      ))}
    </motion.div>
  );
}
