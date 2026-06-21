'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mic, MicOff, VideoOff, Phone, ScreenShare,
  CheckCircle2, Sparkles,
  ChevronDown, Monitor,
} from 'lucide-react';
import { playRing, playClick } from '@/lib/sounds';

/* ════════════════════ TYPES ════════════════════ */
type Tab = 'copilot' | 'scorecard';

/* ════════════════════ WAVEFORM ════════════════════ */
function WaveformVisualizer({ active, color = '#6366f1' }: { active: boolean; color?: string }) {
  return (
    <div className="flex items-end gap-[2px] h-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <motion.div
          key={i}
          style={{ width: 2, background: color, borderRadius: 99 }}
          animate={
            active
              ? { height: [3, 14, 5, 12, 4, 16, 3], opacity: 1 }
              : { height: 3, opacity: 0.4 }
          }
          transition={{ repeat: Infinity, duration: 0.6 + (i % 3) * 0.12, delay: i * 0.05 }}
        />
      ))}
    </div>
  );
}

/* ════════════════════ RATING SLIDER ════════════════════ */
function RatingSlider({
  label, value, onChange,
}: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-sm text-slate-700 dark:text-slate-300 font-medium">{label}</span>
        <span className="text-sm font-bold" style={{ color: '#6366f1' }}>
          {value} <span className="text-slate-400 font-normal">/ 5</span>
        </span>
      </div>
      <div className="relative h-1.5 rounded-full" style={{ background: 'rgba(99,102,241,0.12)' }}>
        <div
          className="absolute left-0 top-0 h-full rounded-full transition-all duration-200"
          style={{
            width: `${(value / 5) * 100}%`,
            background: 'linear-gradient(90deg, #6366f1, #8b5cf6)',
          }}
        />
        <input
          type="range"
          min={1}
          max={5}
          step={1}
          value={value}
          onChange={(e) => { onChange(Number(e.target.value)); playClick(); }}
          className="absolute inset-0 w-full opacity-0 cursor-pointer"
          style={{ height: '100%' }}
        />
        {/* Thumb */}
        <div
          className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full border-2 border-white shadow-md transition-all duration-200"
          style={{
            left: `calc(${(value / 5) * 100}% - 8px)`,
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            boxShadow: '0 0 0 3px rgba(99,102,241,0.25), 0 2px 6px rgba(0,0,0,0.2)',
          }}
        />
      </div>
    </div>
  );
}

/* ════════════════════ VIDEO TILE ════════════════════ */
function VideoTile({
  name, subtitle, initials, isSpeaking = false, isYou = false,
  imageSrc,
}: {
  name: string; subtitle?: string; initials: string;
  isSpeaking?: boolean; isYou?: boolean; imageSrc?: string;
}) {
  return (
    <div
      className="relative flex flex-col items-center justify-center h-full w-full rounded-xl overflow-hidden"
      style={{
        background: 'linear-gradient(160deg, #131128 0%, #1a1535 100%)',
        border: isSpeaking
          ? '2px solid rgba(99,102,241,0.7)'
          : '1px solid rgba(255,255,255,0.07)',
        boxShadow: isSpeaking ? '0 0 0 3px rgba(99,102,241,0.2), inset 0 0 30px rgba(99,102,241,0.08)' : 'none',
        transition: 'border-color 0.3s, box-shadow 0.3s',
      }}
    >
      {/* Avatar or image */}
      <div className="relative flex flex-col items-center gap-2">
        {imageSrc ? (
          <div
            className="w-20 h-20 md:w-24 md:h-24 rounded-full overflow-hidden border-2"
            style={{
              borderColor: isSpeaking ? 'rgba(99,102,241,0.6)' : 'rgba(255,255,255,0.15)',
              boxShadow: isSpeaking ? '0 0 0 4px rgba(99,102,241,0.25)' : 'none',
            }}
          >
            <div
              className="w-full h-full bg-gradient-to-br from-slate-600 to-slate-800 flex items-center justify-center text-2xl font-bold text-white"
            >
              {initials}
            </div>
          </div>
        ) : (
          <div
            className="w-20 h-20 md:w-24 md:h-24 rounded-full flex items-center justify-center font-bold text-2xl text-white"
            style={{
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              boxShadow: isSpeaking ? '0 0 0 4px rgba(99,102,241,0.4), 0 0 30px rgba(99,102,241,0.3)' : 'none',
            }}
          >
            {initials}
          </div>
        )}

        <div className="text-center mt-1">
          <p className="text-sm font-semibold text-white">{name}</p>
          {subtitle && (
            <div className="flex items-center justify-center gap-1.5 mt-0.5">
              {isSpeaking ? (
                <>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <span className="text-[11px] text-emerald-400">Audio Connected</span>
                </>
              ) : isYou ? (
                <>
                  <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                  <span className="text-[11px] text-slate-400">{subtitle}</span>
                </>
              ) : (
                <span className="text-[11px] text-slate-500">{subtitle}</span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Bottom: camera label */}
      {!isYou && (
        <div
          className="absolute bottom-2 left-2 px-2 py-0.5 rounded text-[9px] font-medium text-slate-400"
          style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)' }}
        >
          Remote Camera Feed
        </div>
      )}

      {/* Speaking glow overlay */}
      <AnimatePresence>
        {isSpeaking && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 rounded-xl pointer-events-none"
            style={{ background: 'radial-gradient(ellipse at center, rgba(99,102,241,0.06) 0%, transparent 70%)' }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

/* ════════════════════ MAIN PAGE ════════════════════ */
export default function InterviewsPage() {
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('scorecard');
  const [elapsed, setElapsed] = useState(68); // start at 01:08 like screenshot
  const [candidateSpeaking, setCandidateSpeaking] = useState(true);

  // Scorecard state
  const [scores, setScores] = useState({
    technical: 4, communication: 3, problemSolving: 4, culture: 4,
  });
  const [notes, setNotes] = useState('');
  const [decision, setDecision] = useState('hire');
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    playRing();
    const timer = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const t = setInterval(() => setCandidateSpeaking((s) => !s), 4000);
    return () => clearInterval(t);
  }, []);

  const fmt = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  const handleSubmit = () => {
    playClick();
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 3000);
  };

  const controlButtons = [
    {
      id: 'mic', icon: micOn ? Mic : MicOff, label: micOn ? 'Mute' : 'Unmute',
      active: micOn, danger: !micOn,
      onClick: () => { setMicOn((v) => !v); playClick(); },
    },
    {
      id: 'cam', icon: camOn ? Monitor : VideoOff, label: camOn ? 'Stop Video' : 'Start Video',
      active: camOn, danger: !camOn,
      onClick: () => { setCamOn((v) => !v); playClick(); },
    },
    {
      id: 'screen', icon: ScreenShare, label: 'Share Screen',
      active: true, danger: false, onClick: playClick,
    },
  ];

  return (
    /**
     * Outer container:
     * - On mobile: full remaining height (100dvh minus bottom nav)
     * - On desktop: same but side-by-side layout
     */
    <div
      className="flex flex-col overflow-hidden"
      style={{
        height: 'calc(100dvh - 72px)',
        background: 'var(--background)',
      }}
    >
      {/* ═══════════ DESKTOP LAYOUT ═══════════
          Everything lives inside a centered card on desktop */}
      <div className="hidden md:flex flex-1 items-start justify-center p-6 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 240, damping: 26 }}
          className="w-full max-w-5xl rounded-2xl overflow-hidden shadow-2xl flex flex-col"
          style={{
            background: 'white',
            border: '1px solid rgba(148,163,184,0.18)',
            boxShadow: '0 20px 60px rgba(0,0,0,0.15), 0 4px 20px rgba(0,0,0,0.08)',
            minHeight: 520,
            maxHeight: 'calc(100dvh - 120px)',
          }}
        >
          {/* ── Desktop Header ── */}
          <div
            className="flex items-center justify-between px-5 py-3.5 flex-shrink-0"
            style={{ borderBottom: '1px solid rgba(148,163,184,0.15)' }}
          >
            <div className="flex items-center gap-3">
              {/* Live dot */}
              <div className="flex items-center gap-2">
                <span className="live-dot" style={{ width: 8, height: 8 }} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-sm font-bold text-slate-800">Live Interview Room:</h1>
                  <span className="text-sm font-bold" style={{ color: '#6366f1' }}>Aria Sterling</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Senior NLP / ML Engineer • Technical Evaluation
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Timer */}
              <div
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg font-mono text-sm font-bold text-slate-700"
                style={{ background: '#f1f5f9', border: '1px solid #e2e8f0' }}
              >
                {fmt(elapsed)}
              </div>
              {/* End Call */}
              <motion.button
                whileTap={{ scale: 0.94 }}
                onClick={playClick}
                className="flex items-center gap-2 text-white text-sm font-bold px-4 py-1.5 rounded-lg transition-all"
                style={{
                  background: '#ef4444',
                  boxShadow: '0 4px 14px rgba(239,68,68,0.35)',
                }}
              >
                <Phone className="w-3.5 h-3.5 rotate-[135deg]" />
                End Call
              </motion.button>
            </div>
          </div>

          {/* ── Desktop Body ── */}
          <div className="flex flex-1 min-h-0">

            {/* LEFT: Video tiles */}
            <div className="flex flex-col flex-1 min-h-0 p-4 gap-0">
              {/* Two video tiles side by side */}
              <div className="flex gap-3 flex-1 min-h-0" style={{ minHeight: 260 }}>
                <div className="flex-1 rounded-xl overflow-hidden">
                  <VideoTile
                    name="Aria Sterling (Candidate)"
                    subtitle="Audio Connected"
                    initials="AS"
                    isSpeaking={candidateSpeaking}
                  />
                </div>
                <div className="flex-1 rounded-xl overflow-hidden">
                  <VideoTile
                    name="Sarah Jenkins (You)"
                    subtitle="Mic off"
                    initials="SJ"
                    isSpeaking={!candidateSpeaking}
                    isYou
                  />
                </div>
              </div>

              {/* Control bar */}
              <div
                className="flex items-center justify-center gap-2 py-3 mt-3 rounded-xl"
                style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}
              >
                {controlButtons.map((btn) => (
                  <motion.button
                    key={btn.id}
                    whileTap={{ scale: 0.88 }}
                    onClick={btn.onClick}
                    title={btn.label}
                    className="flex flex-col items-center justify-center gap-1 rounded-xl min-w-[56px] min-h-[48px] transition-all"
                    style={{
                      background: btn.danger ? 'rgba(239,68,68,0.1)' : 'rgba(99,102,241,0.08)',
                      border: `1px solid ${btn.danger ? 'rgba(239,68,68,0.2)' : 'rgba(99,102,241,0.15)'}`,
                    }}
                  >
                    <btn.icon
                      className="w-4 h-4"
                      style={{ color: btn.danger ? '#ef4444' : '#6366f1' }}
                    />
                    <span className="text-[9px] text-slate-500 font-medium">{btn.label}</span>
                  </motion.button>
                ))}
              </div>
            </div>

            {/* RIGHT: AI Panel */}
            <div
              className="w-80 flex flex-col flex-shrink-0 overflow-hidden"
              style={{ borderLeft: '1px solid rgba(148,163,184,0.15)' }}
            >
              {/* Tabs */}
              <div
                className="flex flex-shrink-0"
                style={{ borderBottom: '1px solid rgba(148,163,184,0.15)' }}
              >
                {([
                  { id: 'copilot', label: 'AI Copilot Live', emoji: '🤖' },
                  { id: 'scorecard', label: 'Scorecard', emoji: '📋' },
                ] as { id: Tab; label: string; emoji: string }[]).map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => { setActiveTab(tab.id); playClick(); }}
                    className="relative flex-1 py-3 text-xs font-semibold transition-colors"
                    style={{
                      color: activeTab === tab.id ? '#6366f1' : '#94a3b8',
                      borderBottom: activeTab === tab.id ? '2px solid #6366f1' : '2px solid transparent',
                      background: 'transparent',
                    }}
                  >
                    <span className="mr-1">{tab.emoji}</span>
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Tab content — scrollable */}
              <div className="flex-1 overflow-y-auto no-scrollbar">
                <AnimatePresence mode="wait">
                  {activeTab === 'copilot' && <CopilotPanel key="copilot" speaking={candidateSpeaking} />}
                  {activeTab === 'scorecard' && (
                    <ScorecardPanel
                      key="scorecard"
                      scores={scores}
                      setScores={setScores}
                      notes={notes}
                      setNotes={setNotes}
                      decision={decision}
                      setDecision={setDecision}
                      submitted={submitted}
                      onSubmit={handleSubmit}
                    />
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* ═══════════ MOBILE LAYOUT ═══════════ */}
      <div className="md:hidden flex flex-col flex-1 min-h-0 overflow-hidden">

        {/* ── Mobile Header ── */}
        <div
          className="flex items-center justify-between px-3 py-2.5 flex-shrink-0"
          style={{
            background: 'white',
            borderBottom: '1px solid rgba(148,163,184,0.2)',
            boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
          }}
        >
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <span className="live-dot flex-shrink-0" style={{ width: 7, height: 7 }} />
            <div className="min-w-0">
              <div className="flex items-center gap-1 flex-wrap">
                <span className="text-[12px] font-bold text-slate-800 whitespace-nowrap">Live Interview Room:</span>
                <span className="text-[12px] font-bold whitespace-nowrap" style={{ color: '#6366f1' }}>
                  Aria Sterling
                </span>
              </div>
              <p className="text-[10px] text-slate-500 leading-tight mt-0.5">
                Senior NLP / ML Engineer • Technical Evaluation
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 flex-shrink-0 ml-2">
            <div
              className="font-mono text-xs font-bold text-slate-700 px-2 py-1 rounded-lg"
              style={{ background: '#f1f5f9', border: '1px solid #e2e8f0' }}
            >
              {fmt(elapsed)}
            </div>
            <motion.button
              whileTap={{ scale: 0.92 }}
              onClick={playClick}
              className="flex items-center gap-1 text-white text-[11px] font-bold px-2.5 py-1.5 rounded-lg"
              style={{
                background: '#ef4444',
                boxShadow: '0 3px 10px rgba(239,68,68,0.35)',
                whiteSpace: 'nowrap',
              }}
            >
              <Phone className="w-3 h-3 rotate-[135deg]" />
              End Call
            </motion.button>
          </div>
        </div>

        {/* ── Mobile Video Strip ── */}
        <div
          className="flex gap-2 px-2 py-2 flex-shrink-0"
          style={{ background: '#0f0d20' }}
        >
          <div
            className="flex-1 rounded-xl overflow-hidden"
            style={{ height: 'clamp(100px, 28vw, 150px)' }}
          >
            <VideoTile
              name="Aria Sterling (Candidate)"
              subtitle="Audio Connected"
              initials="AS"
              isSpeaking={candidateSpeaking}
            />
          </div>
          <div
            className="flex-1 rounded-xl overflow-hidden"
            style={{ height: 'clamp(100px, 28vw, 150px)' }}
          >
            <VideoTile
              name="Sarah Jenkins (You)"
              subtitle="Mic off"
              initials="SJ"
              isSpeaking={!candidateSpeaking}
              isYou
            />
          </div>
        </div>

        {/* ── Mobile Control Bar ── */}
        <div
          className="flex items-center justify-center gap-3 px-4 py-2 flex-shrink-0"
          style={{
            background: '#0f0d20',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          {controlButtons.map((btn) => (
            <motion.button
              key={btn.id}
              whileTap={{ scale: 0.85 }}
              onClick={btn.onClick}
              className="flex items-center justify-center rounded-xl"
              style={{
                width: 44, height: 44,
                background: btn.danger ? 'rgba(239,68,68,0.2)' : 'rgba(255,255,255,0.1)',
                border: `1px solid ${btn.danger ? 'rgba(239,68,68,0.3)' : 'rgba(255,255,255,0.12)'}`,
              }}
            >
              <btn.icon
                className="w-4 h-4"
                style={{ color: btn.danger ? '#f87171' : 'rgba(255,255,255,0.8)' }}
              />
            </motion.button>
          ))}
        </div>

        {/* ── Mobile Tabs ── */}
        <div
          className="flex flex-shrink-0"
          style={{
            background: 'white',
            borderBottom: '1px solid rgba(148,163,184,0.2)',
          }}
        >
          {([
            { id: 'copilot', label: 'AI Copilot Live', emoji: '🤖' },
            { id: 'scorecard', label: 'Scorecard', emoji: '📋' },
          ] as { id: Tab; label: string; emoji: string }[]).map((tab) => (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); playClick(); }}
              className="relative flex-1 py-2.5 text-[11px] font-semibold transition-colors"
              style={{
                color: activeTab === tab.id ? '#6366f1' : '#94a3b8',
                borderBottom: activeTab === tab.id ? '2px solid #6366f1' : '2px solid transparent',
                background: 'transparent',
              }}
            >
              <span className="mr-1">{tab.emoji}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── Mobile Tab Content ── */}
        <div className="flex-1 overflow-y-auto no-scrollbar" style={{ background: 'white' }}>
          <AnimatePresence mode="wait">
            {activeTab === 'copilot' && <CopilotPanel key="copilot" speaking={candidateSpeaking} />}
            {activeTab === 'scorecard' && (
              <ScorecardPanel
                key="scorecard"
                scores={scores}
                setScores={setScores}
                notes={notes}
                setNotes={setNotes}
                decision={decision}
                setDecision={setDecision}
                submitted={submitted}
                onSubmit={handleSubmit}
              />
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════ COPILOT PANEL ═══════════════════ */
function CopilotPanel({ speaking }: { speaking: boolean }) {
  return (
    <motion.div
      key="copilot"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="p-4 space-y-3"
    >
      {/* AI listening */}
      <div
        className="flex items-center gap-2.5 rounded-xl px-3 py-2.5"
        style={{ background: 'rgba(99,102,241,0.07)', border: '1px solid rgba(99,102,241,0.15)' }}
      >
        <div
          className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
        >
          <Sparkles className="w-3.5 h-3.5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[11px] font-semibold text-indigo-700 dark:text-indigo-300 leading-snug">
            AI is listening. Suggestions update as candidate responds.
          </p>
        </div>
      </div>

      {/* Transcript */}
      <div className="space-y-2.5">
        {/* Interviewer bubble */}
        <div className="flex justify-end">
          <p
            className="text-[12px] text-white leading-relaxed rounded-2xl rounded-br-sm px-3.5 py-2.5"
            style={{
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              maxWidth: '88%',
              boxShadow: '0 2px 12px rgba(99,102,241,0.3)',
            }}
          >
            Hello! Thanks for joining the call today. Can you start by giving us a brief overview
            of your technical background and experience?
          </p>
        </div>

        {/* Candidate bubble */}
        <div className="flex flex-col gap-1">
          <span className="text-[10px] font-bold text-indigo-400 ml-1">Aria Sterling:</span>
          <p
            className="text-[12px] text-slate-700 dark:text-slate-300 leading-relaxed rounded-2xl rounded-bl-sm px-3.5 py-2.5"
            style={{
              background: 'rgba(241,245,249,1)',
              border: '1px solid rgba(148,163,184,0.2)',
              maxWidth: '90%',
            }}
          >
            Hi Sarah. Sure, I have about 6 years of experience in backend development with
            Python, FastAPI, and PostgreSQL…
          </p>
        </div>

        {/* Live speaking indicator */}
        <AnimatePresence>
          {speaking && (
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 4 }}
              className="flex items-center gap-2 px-3 py-2 rounded-xl"
              style={{ background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.1)' }}
            >
              <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ background: 'rgba(99,102,241,0.15)' }}>
                <Sparkles className="w-3 h-3 text-indigo-400" />
              </div>
              <div className="flex items-center gap-1.5 flex-1 min-w-0">
                <span className="text-[10px] text-indigo-400 font-medium">Aria is speaking</span>
                <div className="flex items-end gap-[2px] h-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <motion.div key={i}
                      style={{ width: 2, background: '#818cf8', borderRadius: 99 }}
                      animate={{ height: [2, 10, 3, 8, 2] }}
                      transition={{ repeat: Infinity, duration: 0.5 + i * 0.1, delay: i * 0.08 }}
                    />
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Suggested question card */}
      <div
        className="rounded-xl p-3"
        style={{ background: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.2)' }}
      >
        <div className="flex items-center gap-2 mb-1.5">
          <span className="text-base leading-none">💡</span>
          <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider">
            Suggested Next Question
          </span>
        </div>
        <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
          AI Copilot Suggestion: Ask them to elaborate on how they optimized PostgreSQL query
          performance or handled database connection pools in FastAPI.
        </p>
      </div>
    </motion.div>
  );
}

/* ═══════════════════ SCORECARD PANEL ═══════════════════ */
interface ScorecardProps {
  scores: { technical: number; communication: number; problemSolving: number; culture: number };
  setScores: (s: ScorecardProps['scores']) => void;
  notes: string; setNotes: (n: string) => void;
  decision: string; setDecision: (d: string) => void;
  submitted: boolean; onSubmit: () => void;
}

function ScorecardPanel({ scores, setScores, notes, setNotes, decision, setDecision, submitted, onSubmit }: ScorecardProps) {
  const dimensions = [
    { key: 'technical', label: 'Technical Skills' },
    { key: 'communication', label: 'Communication Fit' },
    { key: 'problemSolving', label: 'Problem Solving' },
    { key: 'culture', label: 'Culture & Team Fit' },
  ] as { key: keyof typeof scores; label: string }[];

  const decisions = [
    { value: 'hire', label: '✅ Hire (Proceed to next round)', color: '#10b981' },
    { value: 'hold', label: '⏸ Hold (Further consideration)', color: '#f59e0b' },
    { value: 'reject', label: '❌ Reject (Not a fit)', color: '#ef4444' },
  ];

  return (
    <motion.div
      key="scorecard"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="p-4 pb-6 space-y-5"
    >
      {/* Header */}
      <div>
        <h2 className="text-sm font-bold text-slate-800">Recruiter Assessment Scorecard</h2>
        <p className="text-[11px] text-slate-500 mt-0.5">
          Rate key candidate dimensions to compile match results.
        </p>
      </div>

      {/* Rating sliders */}
      <div className="space-y-4">
        {dimensions.map((dim) => (
          <RatingSlider
            key={dim.key}
            label={dim.label}
            value={scores[dim.key]}
            onChange={(v) => setScores({ ...scores, [dim.key]: v })}
          />
        ))}
      </div>

      {/* Notes */}
      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-2">
          Recruiter Evaluation Notes
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Write detailed comments, observed strengths, risks, or compensation details..."
          rows={4}
          className="w-full text-sm text-slate-700 rounded-xl p-3 resize-none focus:outline-none transition-all"
          style={{
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            fontSize: 14,
            caretColor: '#6366f1',
          }}
          onFocus={(e) => {
            e.target.style.border = '1px solid rgba(99,102,241,0.5)';
            e.target.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.1)';
          }}
          onBlur={(e) => {
            e.target.style.border = '1px solid #e2e8f0';
            e.target.style.boxShadow = 'none';
          }}
        />
      </div>

      {/* Decision dropdown */}
      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-2">
          Interview Decision Result
        </label>
        <div className="relative">
          <select
            value={decision}
            onChange={(e) => { setDecision(e.target.value); playClick(); }}
            className="w-full text-sm rounded-xl px-3.5 py-2.5 pr-10 appearance-none focus:outline-none transition-all cursor-pointer"
            style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              color:
                decision === 'hire' ? '#059669' :
                decision === 'hold' ? '#d97706' : '#dc2626',
              fontWeight: 600,
              fontSize: 14,
            }}
            onFocus={(e) => {
              (e.target as HTMLSelectElement).style.border = '1px solid rgba(99,102,241,0.4)';
              (e.target as HTMLSelectElement).style.boxShadow = '0 0 0 3px rgba(99,102,241,0.08)';
            }}
            onBlur={(e) => {
              (e.target as HTMLSelectElement).style.border = '1px solid #e2e8f0';
              (e.target as HTMLSelectElement).style.boxShadow = 'none';
            }}
          >
            {decisions.map((d) => (
              <option key={d.value} value={d.value}>{d.label}</option>
            ))}
          </select>
          <ChevronDown
            className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none"
          />
        </div>
      </div>

      {/* Submit button */}
      <AnimatePresence mode="wait">
        {submitted ? (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-center justify-center gap-2 w-full py-3.5 rounded-xl text-white text-sm font-bold"
            style={{ background: 'linear-gradient(135deg, #059669, #10b981)' }}
          >
            <CheckCircle2 className="w-4 h-4" />
            Scorecard Submitted!
          </motion.div>
        ) : (
          <motion.button
            key="submit"
            whileTap={{ scale: 0.97 }}
            onClick={onSubmit}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="w-full py-3.5 rounded-xl text-white text-sm font-bold transition-all"
            style={{
              background: 'linear-gradient(135deg, #059669, #10b981)',
              boxShadow: '0 4px 16px rgba(16,185,129,0.35)',
            }}
          >
            Submit Scorecard &amp; Archive Call
          </motion.button>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
