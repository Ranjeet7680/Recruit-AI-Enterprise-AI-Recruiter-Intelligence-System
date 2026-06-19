'use client';

import { motion } from 'framer-motion';
import { User, FileText, Check, MessageSquare } from 'lucide-react';

interface CandidateProps {
  name: string;
  matchScore: number;
  skills: string[];
  role: string;
}

export function CandidateCard({ name, matchScore, skills, role }: CandidateProps) {
  return (
    <motion.div
      whileHover={{ y: -8 }}
      className="glass-card group relative overflow-hidden"
    >
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center border border-slate-200 dark:border-slate-700">
              <User className="w-6 h-6 text-slate-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold">{name}</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">{role}</p>
            </div>
          </div>
          <div className="flex flex-col items-center">
            <div className="relative w-12 h-12 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-slate-200 dark:text-slate-700"
                  strokeWidth="3"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className="text-primary"
                  strokeDasharray={`${matchScore}, 100`}
                  strokeWidth="3"
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <span className="absolute text-[10px] font-bold">{matchScore}%</span>
            </div>
            <span className="text-[10px] text-slate-500 mt-1 uppercase font-semibold">Match</span>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-6">
          {skills.map((skill) => (
            <span key={skill} className="px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
              {skill}
            </span>
          ))}
        </div>

        {/* Hover Actions */}
        <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-300 bg-white/90 dark:bg-[#13121a]/95 backdrop-blur-sm border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2">
          <button className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm font-semibold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
            <FileText className="w-4 h-4" />
            View
          </button>
          <button className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition-colors shadow-lg shadow-primary/25">
            <Check className="w-4 h-4" />
            Shortlist
          </button>
        </div>
      </div>
    </motion.div>
  );
}
