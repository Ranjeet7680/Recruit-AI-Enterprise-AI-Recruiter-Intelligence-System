'use client';

import { motion } from 'framer-motion';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
  ResponsiveContainer, AreaChart, Area, Cell
} from 'recharts';

const pipelineData = [
  { name: 'Applied',    value: 1240, color: '#6366f1' },
  { name: 'Screened',   value: 650,  color: '#8b5cf6' },
  { name: 'Interviewed',value: 120,  color: '#10b981' },
  { name: 'Selected',   value: 24,   color: '#f59e0b' },
];

const successData = [
  { name: 'Jan', rate: 65 },
  { name: 'Feb', rate: 72 },
  { name: 'Mar', rate: 85 },
  { name: 'Apr', rate: 94 },
];

const tooltipStyle = {
  borderRadius: '12px',
  border: '1px solid rgba(255,255,255,0.08)',
  backgroundColor: 'rgba(10,8,22,0.95)',
  color: '#f1f5f9',
  boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
  fontSize: '12px',
  backdropFilter: 'blur(12px)',
};

export function Charts() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 mb-6 md:mb-8">
      {/* Pipeline Funnel */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2, ease: [0.23, 1, 0.32, 1] }}
        className="rounded-2xl p-4 md:p-6 overflow-hidden"
        style={{
          background: 'rgba(12,10,28,0.8)',
          border: '1px solid rgba(255,255,255,0.06)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
        }}
      >
        <div className="flex items-center justify-between mb-4 md:mb-6">
          <div>
            <h3 className="text-base md:text-lg font-bold text-white">Hiring Funnel</h3>
            <p className="text-xs text-slate-500 mt-0.5">Current pipeline stage</p>
          </div>
          <span className="text-[10px] font-bold text-indigo-400 bg-indigo-500/10 px-2.5 py-1 rounded-full uppercase tracking-wider">
            Live
          </span>
        </div>
        <div className="h-52 md:h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={pipelineData} layout="vertical" margin={{ left: 16, right: 8, top: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" horizontal={false} />
              <XAxis type="number" hide />
              <YAxis
                dataKey="name"
                type="category"
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#64748b', fontSize: 11, fontWeight: 500 }}
                width={72}
              />
              <RechartsTooltip
                cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                contentStyle={tooltipStyle}
              />
              <Bar dataKey="value" radius={[0, 6, 6, 0]} animationDuration={1200} animationBegin={300}>
                {pipelineData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        {/* Legend */}
        <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-3">
          {pipelineData.map((item) => (
            <div key={item.name} className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: item.color }} />
              <span className="text-[10px] text-slate-500">{item.name}</span>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Success Rate Area Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.32, ease: [0.23, 1, 0.32, 1] }}
        className="rounded-2xl p-4 md:p-6 overflow-hidden"
        style={{
          background: 'rgba(12,10,28,0.8)',
          border: '1px solid rgba(255,255,255,0.06)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
        }}
      >
        <div className="flex items-center justify-between mb-4 md:mb-6">
          <div>
            <h3 className="text-base md:text-lg font-bold text-white">AI Match Accuracy</h3>
            <p className="text-xs text-slate-500 mt-0.5">Trending upward 📈</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-emerald-400">94%</p>
            <p className="text-[10px] text-slate-500">This month</p>
          </div>
        </div>
        <div className="h-52 md:h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={successData} margin={{ left: 0, right: 8, top: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorRate" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#10b981" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
              <XAxis
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#64748b', fontSize: 11 }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#64748b', fontSize: 11 }}
                domain={[50, 100]}
              />
              <RechartsTooltip contentStyle={tooltipStyle} />
              <Area
                type="monotone"
                dataKey="rate"
                stroke="#10b981"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#colorRate)"
                animationDuration={1500}
                animationBegin={400}
                dot={{ fill: '#10b981', strokeWidth: 0, r: 4 }}
                activeDot={{ r: 6, fill: '#10b981', stroke: 'rgba(16,185,129,0.3)', strokeWidth: 4 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </motion.div>
    </div>
  );
}
