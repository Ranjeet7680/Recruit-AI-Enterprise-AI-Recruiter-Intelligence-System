'use client';

import { motion } from 'framer-motion';
import { Users, Clock, Target, TrendingUp } from 'lucide-react';

const metrics = [
  { label: 'Candidates', value: '1,284', icon: Users, color: 'text-blue-500' },
  { label: 'Interviews', value: '42', icon: Clock, color: 'text-purple-500' },
  { label: 'Match Accuracy', value: '94%', icon: Target, color: 'text-green-500' },
  { label: 'Time Reduced', value: '63%', icon: TrendingUp, color: 'text-emerald-500' },
];

export function FloatingMetrics() {
  return (
    <motion.div 
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: 'spring', damping: 20, stiffness: 100, delay: 0.5 }}
      className="hidden lg:flex fixed top-4 right-8 z-50 glass-card px-6 py-3 items-center gap-6"
    >
      {metrics.map((metric, index) => (
        <div key={index} className="flex items-center gap-3 border-r border-slate-200 dark:border-slate-700/50 pr-6 last:border-0 last:pr-0">
          <div className={`p-2 bg-slate-100 dark:bg-slate-800 rounded-lg ${metric.color}`}>
            <metric.icon className="w-4 h-4" />
          </div>
          <div>
            <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">{metric.label}</p>
            <p className="text-sm font-bold">{metric.value}</p>
          </div>
        </div>
      ))}
    </motion.div>
  );
}
