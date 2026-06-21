'use client';

import { motion } from 'framer-motion';
import { FileText, Check, MessageSquare, Star } from 'lucide-react';
import { playPop, playClick } from '@/lib/sounds';

interface CandidateProps {
  name: string;
  matchScore: number;
  skills: string[];
  role: string;
}

const avatarColors = [
  ['#6366f1', '#8b5cf6'],
  ['#0ea5e9', '#6366f1'],
  ['#10b981', '#6366f1'],
  ['#f59e0b', '#ef4444'],
  ['#8b5cf6', '#ec4899'],
  ['#14b8a6', '#6366f1'],
];

function getScoreColor(score: number) {
  if (score >= 90) return '#10b981';
  if (score >= 80) return '#6366f1';
  if (score >= 70) return '#f59e0b';
  return '#ef4444';
}

export function CandidateCard({ name, matchScore, skills, role }: CandidateProps) {
  // Deterministic color from name
  const colorIndex = name.charCodeAt(0) % avatarColors.length;
  const [c1, c2] = avatarColors[colorIndex];
  const scoreColor = getScoreColor(matchScore);
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
        background: 'rgba(12,10,28,0.85)',
        border: '1px solid rgba(255,255,255,0.07)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
      }}
    >
      {/* Gradient accent top */}
      <div
        className="absolute top-0 left-0 right-0 h-1 rounded-t-2xl"
        style={{ background: `linear-gradient(to right, ${c1}, ${c2})` }}
      />

      <div className="p-4 md:p-5 pt-5">
        {/* Header */}
        <div className="flex items-start gap-3 mb-4">
          {/* Avatar */}
          <motion.div
            whileHover={{ scale: 1.1 }}
            transition={{ type: 'spring', stiffness: 400, damping: 20 }}
            className="w-11 h-11 rounded-xl flex items-center justify-center font-bold text-sm text-white flex-shrink-0 shadow-lg"
            style={{
              background: `linear-gradient(135deg, ${c1}, ${c2})`,
              boxShadow: `0 4px 14px ${c1}50`,
            }}
          >
            {initials}
          </motion.div>

          <div className="flex-1 min-w-0">
            <h3 className="text-sm md:text-base font-bold text-white truncate">{name}</h3>
            <p className="text-[11px] text-slate-400 truncate mt-0.5">{role}</p>
          </div>

          {/* Match score ring */}
          <div className="flex flex-col items-center flex-shrink-0">
            <div className="relative w-11 h-11">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                <path
                  strokeWidth="3"
                  stroke="rgba(255,255,255,0.07)"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <motion.path
                  initial={{ strokeDasharray: '0, 100' }}
                  animate={{ strokeDasharray: `${matchScore}, 100` }}
                  transition={{ duration: 1.2, ease: 'easeOut', delay: 0.2 }}
                  strokeWidth="3"
                  stroke={scoreColor}
                  strokeLinecap="round"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold" style={{ color: scoreColor }}>
                {matchScore}%
              </span>
            </div>
            <span className="text-[9px] text-slate-500 mt-0.5 font-semibold uppercase tracking-wider">Match</span>
          </div>
        </div>

        {/* Skills */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          {skills.slice(0, 4).map((skill) => (
            <motion.span
              key={skill}
              whileHover={{ scale: 1.05 }}
              className="px-2 py-0.5 rounded-full text-[10px] font-medium"
              style={{
                background: 'rgba(99,102,241,0.12)',
                border: '1px solid rgba(99,102,241,0.2)',
                color: '#a5b4fc',
              }}
            >
              {skill}
            </motion.span>
          ))}
        </div>

        {/* Action Buttons — always visible on mobile, hover on desktop */}
        <div
          className="flex gap-2 md:opacity-0 md:translate-y-2 md:group-hover:opacity-100 md:group-hover:translate-y-0 transition-all duration-200"
        >
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={playClick}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold transition-colors"
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.08)',
              color: '#94a3b8',
            }}
          >
            <FileText className="w-3.5 h-3.5" />
            View
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={playClick}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold transition-colors"
            style={{
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              color: 'white',
              boxShadow: '0 4px 12px rgba(99,102,241,0.3)',
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
