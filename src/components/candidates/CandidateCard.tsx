'use client';

import { motion } from 'framer-motion';
import { FileText, Star, Gem } from 'lucide-react';
import { playPop, playClick, playShortlist, playGem, playLevel } from '@/lib/sounds';

interface CandidateProps {
  name: string;
  matchScore: number;
  skills: string[];
  role: string;
  status?: 'New' | 'Reviewing' | 'Shortlisted';
  isGem?: boolean;
}

const avatarColors = [
  ['#6366f1', '#8b5cf6'],
  ['#0ea5e9', '#6366f1'],
  ['#10b981', '#6366f1'],
  ['#f59e0b', '#ef4444'],
  ['#8b5cf6', '#ec4899'],
  ['#14b8a6', '#6366f1'],
];

const skillCategories: Record<string, { bg: string; color: string; border: string }> = {
  React: { bg: 'rgba(6,182,212,0.12)', color: '#67e8f9', border: 'rgba(6,182,212,0.25)' },
  'Next.js': { bg: 'rgba(255,255,255,0.07)', color: '#e2e8f0', border: 'rgba(255,255,255,0.12)' },
  TypeScript: { bg: 'rgba(59,130,246,0.12)', color: '#93c5fd', border: 'rgba(59,130,246,0.2)' },
  Python: { bg: 'rgba(234,179,8,0.1)', color: '#fde047', border: 'rgba(234,179,8,0.2)' },
  AWS: { bg: 'rgba(245,158,11,0.1)', color: '#fcd34d', border: 'rgba(245,158,11,0.2)' },
  Docker: { bg: 'rgba(14,165,233,0.1)', color: '#7dd3fc', border: 'rgba(14,165,233,0.2)' },
  Figma: { bg: 'rgba(236,72,153,0.1)', color: '#f9a8d4', border: 'rgba(236,72,153,0.2)' },
};

function getSkillStyle(skill: string) {
  return skillCategories[skill] ?? {
    bg: 'rgba(99,102,241,0.12)',
    color: '#a5b4fc',
    border: 'rgba(99,102,241,0.2)',
  };
}

function getScoreColor(score: number) {
  if (score >= 90) return '#10b981';
  if (score >= 80) return '#6366f1';
  if (score >= 70) return '#f59e0b';
  return '#ef4444';
}

function getScoreGlow(score: number) {
  if (score >= 90) return 'rgba(16,185,129,0.4)';
  if (score >= 80) return 'rgba(99,102,241,0.4)';
  if (score >= 70) return 'rgba(245,158,11,0.4)';
  return 'rgba(239,68,68,0.4)';
}

function getStatusStyle(status: string) {
  switch (status) {
    case 'Shortlisted': return { bg: 'rgba(16,185,129,0.12)', color: '#6ee7b7', border: 'rgba(16,185,129,0.25)' };
    case 'Reviewing': return { bg: 'rgba(245,158,11,0.1)', color: '#fcd34d', border: 'rgba(245,158,11,0.2)' };
    default: return { bg: 'rgba(99,102,241,0.12)', color: '#a5b4fc', border: 'rgba(99,102,241,0.2)' };
  }
}

export function CandidateCard({ name, matchScore, skills, role, status = 'New', isGem = false }: CandidateProps) {
  const colorIndex = name.charCodeAt(0) % avatarColors.length;
  const [c1, c2] = avatarColors[colorIndex];
  const scoreColor = getScoreColor(matchScore);
  const scoreGlow = getScoreGlow(matchScore);
  const statusStyle = getStatusStyle(status);
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('');

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -6, transition: { duration: 0.2 } }}
      whileTap={{ scale: 0.98 }}
      onHoverStart={playPop}
      className="relative overflow-hidden rounded-2xl cursor-pointer group"
      style={{
        background: 'rgba(12,10,28,0.88)',
        border: '1px solid rgba(255,255,255,0.07)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        boxShadow: '0 4px 24px rgba(0,0,0,0.3)',
      }}
    >
      {/* Hover glow overlay */}
      <div
        className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
        style={{ background: `radial-gradient(ellipse at top, ${c1}12 0%, transparent 70%)` }}
      />

      {/* Gradient top accent */}
      <div
        className="absolute top-0 left-0 right-0 h-[3px] rounded-t-2xl"
        style={{ background: `linear-gradient(to right, ${c1}, ${c2})` }}
      />

      <div className="p-4 md:p-5 pt-5 relative z-10">
        {/* Header Row */}
        <div className="flex items-start gap-3 mb-3">
          {/* Avatar */}
          <motion.div
            whileHover={{ scale: 1.1, rotate: 3 }}
            transition={{ type: 'spring', stiffness: 400, damping: 20 }}
            className="w-12 h-12 rounded-xl flex items-center justify-center font-bold text-sm text-white flex-shrink-0 shadow-lg relative"
            onHoverStart={() => { if (isGem) playGem(); }}
            style={{
              background: `linear-gradient(135deg, ${c1}, ${c2})`,
              boxShadow: `0 4px 16px ${c1}55`,
            }}
          >
            {initials}
            {/* Gem badge */}
            {isGem && (
              <div className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, #f59e0b, #ef4444)', boxShadow: '0 0 8px rgba(245,158,11,0.6)' }}>
                <Gem className="w-2.5 h-2.5 text-white" fill="white" />
              </div>
            )}
          </motion.div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5 flex-wrap">
              <h3 className="text-sm md:text-[15px] font-bold text-white truncate">{name}</h3>
              {isGem && (
                <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full"
                  style={{ background: 'rgba(245,158,11,0.15)', color: '#fcd34d', border: '1px solid rgba(245,158,11,0.25)' }}>
                  AI Gem
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-400 truncate">{role}</p>
            {/* Status pill */}
            <span className="inline-block mt-1.5 text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
              style={{ background: statusStyle.bg, color: statusStyle.color, border: `1px solid ${statusStyle.border}` }}>
              {status}
            </span>
          </div>

          {/* Match score ring — bigger, with glow */}
          <div
            className="flex flex-col items-center flex-shrink-0"
            onMouseEnter={() => { if (matchScore >= 90) playLevel(); }}
          >
            <div className="relative w-[52px] h-[52px]" style={{ filter: `drop-shadow(0 0 6px ${scoreGlow})` }}>
              <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                <path
                  strokeWidth="2.8"
                  stroke="rgba(255,255,255,0.06)"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <motion.path
                  initial={{ strokeDasharray: '0, 100' }}
                  animate={{ strokeDasharray: `${matchScore}, 100` }}
                  transition={{ duration: 1.4, ease: 'easeOut', delay: 0.2 }}
                  strokeWidth="2.8"
                  stroke={scoreColor}
                  strokeLinecap="round"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-[11px] font-bold leading-none" style={{ color: scoreColor }}>
                  {matchScore}%
                </span>
              </div>
            </div>
            <span className="text-[8px] text-slate-500 mt-1 font-semibold uppercase tracking-wider">AI Match</span>
          </div>
        </div>

        {/* Inline match bar */}
        <div className="mb-3">
          <div className="h-[3px] rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${matchScore}%` }}
              transition={{ duration: 1.2, ease: 'easeOut', delay: 0.3 }}
              className="h-full rounded-full"
              style={{ background: `linear-gradient(90deg, ${scoreColor}, ${c2})` }}
            />
          </div>
        </div>

        {/* Skills with category color coding */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          {skills.slice(0, 4).map((skill) => {
            const s = getSkillStyle(skill);
            return (
              <motion.span
                key={skill}
                whileHover={{ scale: 1.06, y: -1 }}
                className="px-2 py-0.5 rounded-full text-[10px] font-semibold"
                style={{ background: s.bg, border: `1px solid ${s.border}`, color: s.color }}
              >
                {skill}
              </motion.span>
            );
          })}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 md:opacity-0 md:translate-y-2 md:group-hover:opacity-100 md:group-hover:translate-y-0 transition-all duration-200">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={playClick}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold transition-all"
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.08)',
              color: '#94a3b8',
            }}
          >
            <FileText className="w-3.5 h-3.5" />
            View Profile
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={playShortlist}
            whileHover={{ boxShadow: '0 6px 20px rgba(99,102,241,0.45)' }}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold transition-all"
            style={{
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              color: 'white',
              boxShadow: '0 4px 14px rgba(99,102,241,0.35)',
            }}
          >
            <Star className="w-3.5 h-3.5" fill="white" />
            Shortlist
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}
