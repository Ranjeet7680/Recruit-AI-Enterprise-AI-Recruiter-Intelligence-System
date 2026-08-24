'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart, Bar, AreaChart, Area, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer
} from 'recharts';
import {
  BarChart3, TrendingUp, ShieldCheck, Zap,
  Sparkles, Download, Layers
} from 'lucide-react';
import { playClick, playFilter } from '@/lib/sounds';

/* ════════════════════ MOCK / LIVE DATA ════════════════════ */
const pipelineData = [
  { stage: 'Sourced', count: 58049, dropOff: 0, fill: '#6366f1' },
  { stage: 'Screened (AI)', count: 12420, dropOff: 78.6, fill: '#8b5cf6' },
  { stage: 'Shortlisted', count: 1840, dropOff: 85.2, fill: '#a855f7' },
  { stage: 'Live Interview', count: 420, dropOff: 77.2, fill: '#00d4ff' },
  { stage: 'Offer Extended', count: 96, dropOff: 77.1, fill: '#10b981' },
];

const scoreDistribution = [
  { bracket: '90–100%', count: 128, label: 'Exceptional (Tier 1)' },
  { bracket: '80–89%', count: 486, label: 'High Match (Tier 2)' },
  { bracket: '70–79%', count: 1220, label: 'Qualified (Tier 3)' },
  { bracket: '60–69%', count: 3450, label: 'Potential Match' },
  { bracket: '<60%', count: 52765, label: 'Below Threshold' },
];

const skillDemandSupply = [
  { skill: 'PyTorch / TF', required: 95, supply: 72 },
  { skill: 'Vector Search', required: 90, supply: 64 },
  { skill: 'RAG & LLMs', required: 88, supply: 78 },
  { skill: 'FastAPI / API', required: 80, supply: 89 },
  { skill: 'Docker / K8s', required: 75, supply: 68 },
  { skill: 'Fine-Tuning', required: 85, supply: 54 },
];

const clusterShare = [
  { name: 'RAG & Retrieval Masters', value: 34, color: '#6366f1' },
  { name: 'Full-Stack ML Engineers', value: 28, color: '#8b5cf6' },
  { name: 'Deep Learning Specialists', value: 22, color: '#00d4ff' },
  { name: 'Data & Infra Pioneers', value: 16, color: '#10b981' },
];

const biasReductionMetrics = [
  { metric: 'Demographic Masking Rate', value: '100%', subtext: 'GDPR / HIPAA standard active' },
  { metric: 'Score Disparity Reduction', value: '-84.2%', subtext: 'Equalized across all demographics' },
  { metric: 'Hiring Decision Auditability', value: '100%', subtext: 'Deterministic SHAP explainability' },
  { metric: 'Screening Acceleration', value: '18.4x', subtext: 'Compared to manual human resume review' },
];

export default function AnalyticsPage() {
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | 'all'>('30d');

  const handleExport = () => {
    playClick();
    const csvContent = "data:text/csv;charset=utf-8," + 
      "Stage,Candidates,DropOff\n" + 
      pipelineData.map(e => `${e.stage},${e.count},${e.dropOff}%`).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `nexora_analytics_${timeRange}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto space-y-8">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 mb-2">
            <BarChart3 className="w-3.5 h-3.5" />
            Recruitment Intelligence Telemetry
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
            Advanced Analytics & Pipeline Intelligence
          </h1>
          <p className="text-sm text-slate-400">
            Real-time multi-factor scoring metrics, talent funnel velocity, and demographic bias reduction telemetry.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-[#141228] p-1 rounded-xl border border-white/10 text-xs">
            {(['7d', '30d', '90d', 'all'] as const).map((r) => (
              <button
                key={r}
                onClick={() => { setTimeRange(r); playFilter(); }}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                  timeRange === r
                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {r.toUpperCase()}
              </button>
            ))}
          </div>

          <button
            onClick={handleExport}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-white/10 hover:bg-white/15 border border-white/15 transition-all"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Export CSV</span>
          </button>
        </div>
      </div>

      {/* ── Top Metric Highlights ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {biasReductionMetrics.map((item, idx) => (
          <motion.div
            key={item.metric}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.08 }}
            className="rounded-2xl p-5 relative overflow-hidden"
            style={{
              background: 'linear-gradient(145deg, rgba(20,18,40,0.8), rgba(12,10,28,0.9))',
              border: '1px solid rgba(255,255,255,0.06)',
            }}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-400">{item.metric}</span>
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-black text-white tracking-tight mb-1 bg-clip-text text-transparent bg-gradient-to-r from-white to-indigo-200">
              {item.value}
            </div>
            <p className="text-[11px] text-slate-400">{item.subtext}</p>
          </motion.div>
        ))}
      </div>

      {/* ── Row 1: Pipeline Conversion Funnel & Score Distribution ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pipeline Funnel */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="rounded-2xl p-6 relative overflow-hidden"
          style={{
            background: 'linear-gradient(145deg, rgba(20,18,40,0.8), rgba(12,10,28,0.9))',
            border: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-indigo-400" />
                Hiring Velocity & Pipeline Conversion
              </h2>
              <p className="text-xs text-slate-400">Total volume traversing candidate evaluation checkpoints</p>
            </div>
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              58,049 Total
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={pipelineData} layout="vertical" margin={{ left: 20, right: 30, top: 10, bottom: 10 }}>
                <XAxis type="number" stroke="#64748b" fontSize={11} tickFormatter={(v) => v > 1000 ? `${(v/1000).toFixed(0)}k` : v} />
                <YAxis dataKey="stage" type="category" stroke="#cbd5e1" fontSize={12} width={100} />
                <Tooltip
                  contentStyle={{ background: '#0f0d22', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff' }}
                  formatter={(value: unknown) => [Number(value).toLocaleString() + ' candidates', 'Count']}
                />
                <Bar dataKey="count" radius={[0, 8, 8, 0]}>
                  {pipelineData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* AI Score Bracket Histogram */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.25 }}
          className="rounded-2xl p-6 relative overflow-hidden"
          style={{
            background: 'linear-gradient(145deg, rgba(20,18,40,0.8), rgba(12,10,28,0.9))',
            border: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-400" />
                AI Match Score Distribution
              </h2>
              <p className="text-xs text-slate-400">Deterministic scoring frequency across applicant pool</p>
            </div>
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
              Top 100 Shortlist
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={scoreDistribution} margin={{ left: 10, right: 10, top: 10, bottom: 10 }}>
                <defs>
                  <linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.6}/>
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="bracket" stroke="#cbd5e1" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} />
                <Tooltip
                  contentStyle={{ background: '#0f0d22', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff' }}
                  formatter={(v: unknown) => [Number(v).toLocaleString() + ' candidates', 'Volume']}
                />
                <Area type="monotone" dataKey="count" stroke="#8b5cf6" strokeWidth={3} fillOpacity={1} fill="url(#scoreGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      {/* ── Row 2: Skills Demand vs Supply & Talent Clusters ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Skills Demand Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="lg:col-span-2 rounded-2xl p-6 relative overflow-hidden"
          style={{
            background: 'linear-gradient(145deg, rgba(20,18,40,0.8), rgba(12,10,28,0.9))',
            border: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-400" />
                JD Skill Demand vs Applicant Supply
              </h2>
              <p className="text-xs text-slate-400">Target requirements calibrated against candidate competency signals</p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1 text-indigo-400 font-semibold">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" /> JD Demand
              </span>
              <span className="flex items-center gap-1 text-cyan-400 font-semibold">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" /> Pool Supply
              </span>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={skillDemandSupply} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                <XAxis dataKey="skill" stroke="#cbd5e1" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} domain={[0, 100]} />
                <Tooltip
                  contentStyle={{ background: '#0f0d22', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff' }}
                />
                <Bar dataKey="required" fill="#6366f1" radius={[6, 6, 0, 0]} name="JD Demand (%)" />
                <Bar dataKey="supply" fill="#00d4ff" radius={[6, 6, 0, 0]} name="Pool Supply (%)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Talent Clusters Breakdown */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="rounded-2xl p-6 relative overflow-hidden flex flex-col justify-between"
          style={{
            background: 'linear-gradient(145deg, rgba(20,18,40,0.8), rgba(12,10,28,0.9))',
            border: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2 mb-1">
              <Layers className="w-4 h-4 text-emerald-400" />
              K-Means Talent Clusters
            </h2>
            <p className="text-xs text-slate-400 mb-4">Autonomous clustering of applicant pool</p>

            <div className="h-44 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={clusterShare}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={70}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {clusterShare.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: '#0f0d22', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff' }}
                    formatter={(v: unknown) => [`${v}%`, 'Share']}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="space-y-2 pt-2 border-t border-white/5">
            {clusterShare.map((cl) => (
              <div key={cl.name} className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-2 text-slate-300">
                  <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: cl.color }} />
                  {cl.name}
                </span>
                <span className="font-mono font-bold text-white">{cl.value}%</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
