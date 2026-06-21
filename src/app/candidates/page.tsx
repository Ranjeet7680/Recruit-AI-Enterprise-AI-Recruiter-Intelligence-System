'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CandidateCard } from '@/components/candidates/CandidateCard';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import { playClick } from '@/lib/sounds';

const mockCandidates = [
  { id: 1, name: 'John Doe',       role: 'Senior Frontend Engineer',  matchScore: 92, skills: ['React', 'Next.js', 'TypeScript', 'Tailwind'] },
  { id: 2, name: 'Emily Chen',     role: 'Full Stack Developer',       matchScore: 88, skills: ['Node.js', 'React', 'PostgreSQL', 'AWS'] },
  { id: 3, name: 'Michael Smith',  role: 'UI/UX Designer',             matchScore: 95, skills: ['Figma', 'Framer', 'CSS', 'User Testing'] },
  { id: 4, name: 'Sarah Jenkins',  role: 'Backend Engineer',           matchScore: 84, skills: ['Python', 'FastAPI', 'Docker', 'Redis'] },
  { id: 5, name: 'David Kim',      role: 'DevOps Engineer',            matchScore: 91, skills: ['Kubernetes', 'Terraform', 'CI/CD', 'AWS'] },
  { id: 6, name: 'Lisa Wang',      role: 'Data Scientist',             matchScore: 89, skills: ['Python', 'TensorFlow', 'SQL', 'Pandas'] },
];

const filters = ['All', '90%+', '80–89%', 'Frontend', 'Backend', 'Design'];

const containerVariants = {
  hidden:  { opacity: 0 },
  show:    { opacity: 1, transition: { staggerChildren: 0.08 } },
};

export default function CandidatesPage() {
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');
  const [showFilters, setShowFilters] = useState(false);

  const filtered = mockCandidates.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.role.toLowerCase().includes(search.toLowerCase());
    if (activeFilter === '90%+') return matchesSearch && c.matchScore >= 90;
    if (activeFilter === '80–89%') return matchesSearch && c.matchScore >= 80 && c.matchScore < 90;
    if (activeFilter === 'Frontend') return matchesSearch && c.skills.some((s) => ['React','Next.js','TypeScript','Figma','CSS'].includes(s));
    if (activeFilter === 'Backend')  return matchesSearch && c.skills.some((s) => ['Node.js','Python','FastAPI','PostgreSQL'].includes(s));
    if (activeFilter === 'Design')   return matchesSearch && c.skills.some((s) => ['Figma','Framer','User Testing'].includes(s));
    return matchesSearch;
  });

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-5 md:mb-8"
      >
        <h1 className="text-2xl md:text-3xl font-bold text-white mb-1">Candidates</h1>
        <p className="text-sm text-slate-400">
          {filtered.length} of {mockCandidates.length} candidates · AI-matched
        </p>
      </motion.div>

      {/* Search + Filter row */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08 }}
        className="flex gap-2 mb-4"
      >
        {/* Search input */}
        <div
          className="flex-1 flex items-center gap-2 px-3 py-2.5 rounded-xl"
          style={{
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.08)',
          }}
        >
          <Search className="w-4 h-4 text-slate-500 flex-shrink-0" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search candidates..."
            className="flex-1 bg-transparent text-sm text-slate-200 placeholder-slate-500 focus:outline-none"
            style={{ fontSize: 16 }}
          />
          {search && (
            <motion.button
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              onClick={() => setSearch('')}
              className="text-slate-500 hover:text-slate-300"
            >
              <X className="w-3.5 h-3.5" />
            </motion.button>
          )}
        </div>

        {/* Filter toggle */}
        <motion.button
          whileTap={{ scale: 0.93 }}
          onClick={() => { setShowFilters((s) => !s); playClick(); }}
          className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors min-w-[44px] min-h-[44px] justify-center"
          style={{
            background: showFilters ? 'rgba(99,102,241,0.2)' : 'rgba(255,255,255,0.05)',
            border: `1px solid ${showFilters ? 'rgba(99,102,241,0.4)' : 'rgba(255,255,255,0.08)'}`,
            color: showFilters ? '#818cf8' : '#64748b',
          }}
        >
          <SlidersHorizontal className="w-4 h-4" />
          <span className="hidden sm:inline">Filter</span>
        </motion.button>
      </motion.div>

      {/* Filter chips */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0, marginBottom: 0 }}
            animate={{ opacity: 1, height: 'auto', marginBottom: 16 }}
            exit={{ opacity: 0, height: 0, marginBottom: 0 }}
            className="overflow-hidden"
          >
            <div className="flex flex-wrap gap-2 pb-1">
              {filters.map((f) => (
                <motion.button
                  key={f}
                  whileTap={{ scale: 0.93 }}
                  onClick={() => { setActiveFilter(f); playClick(); }}
                  className="px-3 py-1.5 rounded-full text-xs font-semibold transition-all"
                  style={{
                    background: activeFilter === f ? 'rgba(99,102,241,0.2)' : 'rgba(255,255,255,0.05)',
                    border: `1px solid ${activeFilter === f ? 'rgba(99,102,241,0.4)' : 'rgba(255,255,255,0.08)'}`,
                    color: activeFilter === f ? '#818cf8' : '#64748b',
                  }}
                >
                  {f}
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Card grid */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4"
      >
        <AnimatePresence>
          {filtered.map((candidate) => (
            <motion.div
              key={candidate.id}
              layout
              variants={{
                hidden: { opacity: 0, y: 20 },
                show:   { opacity: 1, y: 0 },
              }}
              exit={{ opacity: 0, scale: 0.95 }}
            >
              <CandidateCard {...candidate} />
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>

      {/* Empty state */}
      {filtered.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center py-20 text-center"
        >
          <div className="text-4xl mb-4">🔍</div>
          <p className="text-slate-400 font-medium">No candidates match your filter</p>
          <button
            onClick={() => { setSearch(''); setActiveFilter('All'); }}
            className="mt-3 text-xs text-indigo-400 hover:underline"
          >
            Clear filters
          </button>
        </motion.div>
      )}
    </div>
  );
}
