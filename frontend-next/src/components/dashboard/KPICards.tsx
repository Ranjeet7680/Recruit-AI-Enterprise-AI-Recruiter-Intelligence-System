'use client';

import { Users, UserCheck, Search, Zap } from 'lucide-react';
import CountUp from 'react-countup';
import { motion } from 'framer-motion';

const kpis = [
  { title: 'Total Candidates', value: 1284, icon: Users, color: 'bg-blue-500/10 text-blue-500', border: 'border-blue-500/20' },
  { title: 'Screened Profiles', value: 650, icon: Search, color: 'bg-purple-500/10 text-purple-500', border: 'border-purple-500/20' },
  { title: 'Interviews Scheduled', value: 120, icon: Zap, color: 'bg-amber-500/10 text-amber-500', border: 'border-amber-500/20' },
  { title: 'Offers Accepted', value: 24, icon: UserCheck, color: 'bg-emerald-500/10 text-emerald-500', border: 'border-emerald-500/20' },
];

export function KPICards() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {kpis.map((kpi, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: index * 0.1 }}
          className={`glass-card p-6 border ${kpi.border}`}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">{kpi.title}</h3>
            <div className={`p-2 rounded-xl ${kpi.color}`}>
              <kpi.icon className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-bold">
            <CountUp end={kpi.value} duration={2.5} separator="," />
          </div>
        </motion.div>
      ))}
    </div>
  );
}
