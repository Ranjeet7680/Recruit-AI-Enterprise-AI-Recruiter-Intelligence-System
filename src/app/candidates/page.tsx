'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CandidateCard } from '@/components/candidates/CandidateCard';
import { Search, SlidersHorizontal, X, UserPlus, Gem, Users, ChevronRight, Upload } from 'lucide-react';
import { playClick, playFilter, playSearch } from '@/lib/sounds';

interface Candidate {
  id: string | number;
  name: string;
  role: string;
  matchScore: number;
  skills: string[];
  status: 'Shortlisted' | 'Reviewing' | 'New';
  isGem?: boolean;
}

const mockCandidates: Candidate[] = [
  { id: 1, name: 'John Doe',      role: 'Senior Frontend Engineer',  matchScore: 92, skills: ['React', 'Next.js', 'TypeScript', 'Tailwind'], status: 'Shortlisted', isGem: true },
  { id: 2, name: 'Emily Chen',    role: 'Full Stack Developer',       matchScore: 88, skills: ['Node.js', 'React', 'PostgreSQL', 'AWS'],      status: 'Reviewing' },
  { id: 3, name: 'Michael Smith', role: 'UI/UX Designer',             matchScore: 95, skills: ['Figma', 'React', 'TypeScript', 'CSS'],         status: 'Shortlisted', isGem: true },
  { id: 4, name: 'Sarah Jenkins', role: 'Backend Engineer',           matchScore: 84, skills: ['Python', 'Docker', 'AWS', 'React'],            status: 'New' },
  { id: 5, name: 'David Kim',     role: 'DevOps Engineer',            matchScore: 91, skills: ['AWS', 'Docker', 'TypeScript', 'Python'],       status: 'Reviewing' },
  { id: 6, name: 'Lisa Wang',     role: 'Data Scientist',             matchScore: 89, skills: ['Python', 'TypeScript', 'React', 'AWS'],        status: 'New' },
];

const filters = ['All', '90%+', '80–89%', 'Frontend', 'Backend', 'Design'];

const containerVariants = {
  hidden:  { opacity: 0 },
  show:    { opacity: 1, transition: { staggerChildren: 0.07 } },
};

const stats = [
  { label: 'Total',       value: 12, color: '#6366f1' },
  { label: 'AI Gems',     value: 2,  color: '#f59e0b' },
  { label: 'Shortlisted', value: 4,  color: '#10b981' },
];

export default function CandidatesPage() {
  const [candidates, setCandidates] = useState<Candidate[]>(mockCandidates);
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');
  const [showFilters, setShowFilters] = useState(false);

  const handleResumeUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("/api/upload-resume-pdf", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to parse resume");
      }

      const data = await response.json();
      const parsedCandidate = data.candidate;

      const newCandUI = {
        id: parsedCandidate.id,
        name: parsedCandidate.name,
        role: parsedCandidate.experience_timeline?.[0]?.role || "Software Engineer",
        matchScore: Math.round(75 + Math.random() * 20),
        skills: (parsedCandidate.hard_skills || []).slice(0, 4),
        status: 'New' as const,
        isGem: parsedCandidate.experience_years <= 5.0 && parsedCandidate.hard_skills.length > 5
      };

      setCandidates(prev => [newCandUI, ...prev]);
    } catch (error: unknown) {
      const errMsg = error instanceof Error ? error.message : String(error);
      alert("Error parsing resume: " + errMsg);
    } finally {
      event.target.value = "";
    }
  };

  const filtered = candidates.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.role.toLowerCase().includes(search.toLowerCase());
    if (activeFilter === '90%+')    return matchesSearch && c.matchScore >= 90;
    if (activeFilter === '80–89%')  return matchesSearch && c.matchScore >= 80 && c.matchScore < 90;
    if (activeFilter === 'Frontend') return matchesSearch && c.skills.some((s) => ['React','Next.js','TypeScript','Figma','CSS'].includes(s));
    if (activeFilter === 'Backend')  return matchesSearch && c.skills.some((s) => ['Node.js','Python','Docker','AWS'].includes(s));
    if (activeFilter === 'Design')   return matchesSearch && c.skills.some((s) => ['Figma','CSS'].includes(s));
    return matchesSearch;
  });

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
      {/* ── Header ── */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-5 md:mb-7"
      >
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-white mb-1 flex items-center gap-2">
              <Users className="w-6 h-6 text-indigo-400" />
              Candidate Pool
            </h1>
            <p className="text-sm text-slate-400">
            {filtered.length} of {candidates.length} profiles · AI-ranked by match score
          </p>
        </div>

        {/* Add candidate buttons */}
        <div className="flex gap-2 flex-wrap self-start sm:self-auto">
          {/* Upload Resume PDF button */}
          <motion.button
            whileTap={{ scale: 0.95 }}
            whileHover={{ y: -2 }}
            onClick={() => {
              playClick();
              document.getElementById('candidate-resume-uploader')?.click();
            }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-indigo-400 border border-indigo-500/30 hover:bg-indigo-500/10 transition-colors"
          >
            <Upload className="w-4 h-4" />
            Upload Resume PDF
          </motion.button>
          <input
            type="file"
            id="candidate-resume-uploader"
            accept=".pdf,.docx,.txt"
            className="hidden"
            onChange={handleResumeUpload}
          />

          <motion.button
            whileTap={{ scale: 0.95 }}
            whileHover={{ y: -2 }}
            onClick={playClick}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white"
            style={{
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              boxShadow: '0 4px 16px rgba(99,102,241,0.35)',
            }}
          >
            <UserPlus className="w-4 h-4" />
            New Candidate
          </motion.button>
        </div>
        </div>

        {/* Mini stats row */}
        <div className="flex gap-3 mt-4 overflow-x-auto no-scrollbar pb-1 flex-nowrap">
          {stats.map((s) => (
            <div key={s.label}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm font-semibold"
              style={{ background: `${s.color}14`, border: `1px solid ${s.color}28`, color: s.color }}>
              <span className="text-base font-bold">{s.value}</span>
              <span className="text-[11px] font-medium opacity-80">{s.label}</span>
            </div>
          ))}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-semibold"
            style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)', color: '#fcd34d' }}>
            <Gem className="w-3.5 h-3.5" />
            0 New AI Matches
          </div>
        </div>
      </motion.div>

      {/* ── Tabs ── */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="flex gap-0 mb-5 border-b"
        style={{ borderColor: 'rgba(255,255,255,0.07)' }}
      >
        {['All Candidates', 'Shortlisted', 'Interviewed'].map((tab, i) => (
          <button
            key={tab}
            onClick={playClick}
            className="relative px-4 py-2.5 text-sm font-semibold transition-colors"
            style={{ color: i === 0 ? '#818cf8' : '#64748b' }}
          >
            {tab}
            {i === 0 && (
              <motion.div
                layoutId="candidates-tab-indicator"
                className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full"
                style={{ background: 'linear-gradient(90deg, #6366f1, #8b5cf6)' }}
              />
            )}
          </button>
        ))}
      </motion.div>

      {/* ── Search + Filter ── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08 }}
        className="flex gap-2 mb-4"
      >
        <div
          className="flex-1 flex items-center gap-2 px-3.5 py-2.5 rounded-xl transition-all"
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
            onFocus={playSearch}
            placeholder="Filter by skill, name, or role..."
            className="flex-1 bg-transparent text-sm text-slate-200 placeholder-slate-500 focus:outline-none"
            style={{ fontSize: 16 }}
          />
          {search && (
            <motion.button
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              onClick={() => setSearch('')}
              className="text-slate-500 hover:text-slate-300 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </motion.button>
          )}
        </div>

        <motion.button
          whileTap={{ scale: 0.93 }}
          onClick={() => { setShowFilters((s) => !s); playFilter(); }}
          className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all min-w-[44px] min-h-[44px] justify-center"
          style={{
            background: showFilters ? 'rgba(99,102,241,0.2)' : 'rgba(255,255,255,0.05)',
            border: `1px solid ${showFilters ? 'rgba(99,102,241,0.45)' : 'rgba(255,255,255,0.08)'}`,
            color: showFilters ? '#818cf8' : '#64748b',
            boxShadow: showFilters ? '0 0 12px rgba(99,102,241,0.2)' : 'none',
          }}
        >
          <SlidersHorizontal className="w-4 h-4" />
          <span className="hidden sm:inline">Filter</span>
        </motion.button>
      </motion.div>

      {/* ── Filter chips — horizontally scrollable ── */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0, marginBottom: 0 }}
            animate={{ opacity: 1, height: 'auto', marginBottom: 16 }}
            exit={{ opacity: 0, height: 0, marginBottom: 0 }}
            className="overflow-hidden"
          >
            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
              {filters.map((f) => (
                <motion.button
                  key={f}
                  whileTap={{ scale: 0.93 }}
                  onClick={() => { setActiveFilter(f); playFilter(); }}
                  className="px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all whitespace-nowrap flex-shrink-0"
                  style={{
                    background: activeFilter === f ? 'rgba(99,102,241,0.2)' : 'rgba(255,255,255,0.05)',
                    border: `1px solid ${activeFilter === f ? 'rgba(99,102,241,0.45)' : 'rgba(255,255,255,0.08)'}`,
                    color: activeFilter === f ? '#818cf8' : '#64748b',
                    boxShadow: activeFilter === f ? '0 0 10px rgba(99,102,241,0.2)' : 'none',
                  }}
                >
                  {f}
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Card Grid ── */}
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

      {/* ── Empty state ── */}
      {filtered.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center py-20 text-center"
        >
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
            style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)' }}>
            <Search className="w-7 h-7 text-indigo-400" />
          </div>
          <p className="text-slate-400 font-semibold mb-1">No candidates match</p>
          <p className="text-slate-600 text-sm mb-4">Try adjusting your search or filters</p>
          <button
            onClick={() => { setSearch(''); setActiveFilter('All'); }}
            className="flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 font-semibold transition-colors"
          >
            Clear all filters <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </motion.div>
      )}
    </div>
  );
}
