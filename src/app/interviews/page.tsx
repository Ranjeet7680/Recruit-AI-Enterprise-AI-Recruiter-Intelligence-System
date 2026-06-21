'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mic, MicOff, VideoOff, Phone, ScreenShare,
  CheckCircle2, Sparkles,
  ChevronDown, Monitor, Clock, MessageSquare,
} from 'lucide-react';
import { playRing, playClick } from '@/lib/sounds';

/* ════════════════════ TYPES ════════════════════ */
type Tab = 'copilot' | 'scorecard';

/* ════════════════════ WAVEFORM ════════════════════ */
function WaveformVisualizer({ active, color = '#8ab4f8' }: { active: boolean; color?: string }) {
  return (
    <div className="flex items-end gap-[2.5px] h-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <motion.div
          key={i}
          style={{ width: 2.2, background: color, borderRadius: 99 }}
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
        <span className="text-sm text-slate-700 dark:text-slate-300 font-semibold">{label}</span>
        <span className="text-sm font-bold" style={{ color: '#6366f1' }}>
          {value} <span className="text-slate-400 font-normal">/ 5</span>
        </span>
      </div>
      <div className="relative h-2 rounded-full" style={{ background: 'rgba(99,102,241,0.12)' }}>
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
          className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full border-2 border-white shadow-md transition-all duration-200 pointer-events-none"
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

/* ════════════════════ VIDEO TILE (GOOGLE MEET STYLE) ════════════════════ */
function VideoTile({
  name, initials, isSpeaking = false, isYou = false, imageSrc, camOn = true,
}: {
  name: string; initials: string; isSpeaking?: boolean; isYou?: boolean; imageSrc?: string; camOn?: boolean;
}) {
  return (
    <div
      className="relative flex flex-col items-center justify-center h-full w-full rounded-xl overflow-hidden transition-all duration-300"
      style={{
        background: '#202124',
        border: isSpeaking ? '3px solid #8ab4f8' : '1px solid rgba(255,255,255,0.08)',
        boxShadow: isSpeaking ? '0 0 20px rgba(138,180,248,0.25)' : 'none',
      }}
    >
      {/* Active Camera Feed Simulated background */}
      {(!isYou || camOn) ? (
        <div className="absolute inset-0 w-full h-full flex items-center justify-center overflow-hidden">
          <div className="w-full h-full bg-gradient-to-tr from-[#1b1c1e] to-[#2d3035] flex items-center justify-center">
            {/* profile container */}
            <motion.div
              animate={isSpeaking ? { scale: [1, 1.03, 1] } : {}}
              transition={{ repeat: Infinity, duration: 2 }}
              className="flex flex-col items-center"
            >
              {imageSrc ? (
                <div
                  className="w-20 h-20 md:w-24 md:h-24 rounded-full overflow-hidden border-2 shadow-2xl flex-shrink-0"
                  style={{
                    borderColor: isSpeaking ? '#8ab4f8' : 'rgba(255,255,255,0.2)',
                    boxShadow: isSpeaking ? '0 0 0 4px rgba(138,180,248,0.3)' : '0 10px 25px rgba(0,0,0,0.3)',
                  }}
                >
                  <img src={imageSrc} alt={name} className="w-full h-full object-cover" />
                </div>
              ) : (
                <div
                  className="w-20 h-20 md:w-24 md:h-24 rounded-full flex items-center justify-center font-bold text-2xl text-white shadow-2xl flex-shrink-0"
                  style={{
                    background: isYou ? 'linear-gradient(135deg, #10b981, #059669)' : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                    boxShadow: isSpeaking ? '0 0 0 4px rgba(138,180,248,0.3)' : '0 10px 25px rgba(0,0,0,0.3)',
                  }}
                >
                  {initials}
                </div>
              )}
            </motion.div>
          </div>
        </div>
      ) : (
        <div className="absolute inset-0 w-full h-full bg-[#111214] flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-[#3c4043] flex items-center justify-center text-lg font-bold text-slate-400 mx-auto mb-2 shadow-md">
              {initials}
            </div>
            <p className="text-[11px] text-slate-500 font-medium">Camera is off</p>
          </div>
        </div>
      )}

      {/* Name tag in bottom-left */}
      <div className="absolute bottom-3 left-3 bg-[#202124]/80 backdrop-blur-md px-2.5 py-1 rounded-md text-[11px] text-white font-semibold flex items-center gap-2 border border-white/5 shadow-md">
        <span>{name}</span>
        {isSpeaking && (
          <div className="flex items-end gap-[2px] h-3 w-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <motion.div
                key={i}
                style={{ width: 1.8, background: '#8ab4f8', borderRadius: 99 }}
                animate={{ height: [3, 11, 3] }}
                transition={{ repeat: Infinity, duration: 0.6 + i * 0.1, delay: i * 0.05 }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Mic status indicator in top-right */}
      <div className="absolute top-3 right-3 bg-black/45 backdrop-blur-md p-1.5 rounded-full border border-white/5 text-white">
        {(!isYou || camOn) ? (
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
        ) : (
          <MicOff className="w-3.5 h-3.5 text-red-400 animate-pulse" />
        )}
      </div>
    </div>
  );
}

/* ════════════════════ MAIN PAGE ════════════════════ */
export default function InterviewsPage() {
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('copilot');
  const [elapsed, setElapsed] = useState(68); // start at 01:08 like original
  const [candidateSpeaking, setCandidateSpeaking] = useState(true);
  const [showPanel, setShowPanel] = useState(true);

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

  return (
    <div
      className="flex flex-col overflow-hidden"
      style={{
        height: 'calc(100dvh - 72px)',
        background: '#111214',
      }}
    >
      {/* ═══════════ DESKTOP LAYOUT ═══════════ */}
      <div className="hidden md:flex flex-1 min-h-0 relative p-4 gap-4 bg-[#111214]">
        {/* Main Video Call Area */}
        <div className="flex-1 flex flex-col min-h-0 relative rounded-2xl overflow-hidden bg-[#202124] border border-white/5">
          {/* Top header overlay inside the call */}
          <div className="absolute top-4 left-4 z-10 bg-black/45 backdrop-blur-md px-3 py-1.5 rounded-lg text-white text-xs font-semibold flex items-center gap-2 border border-white/5 shadow-lg">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span>Live Technical Evaluation: Aria Sterling</span>
          </div>

          <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
            <div className="bg-black/45 backdrop-blur-md px-3 py-1.5 rounded-lg text-white font-mono text-xs font-bold flex items-center gap-1.5 border border-white/5 shadow-lg">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              {fmt(elapsed)}
            </div>
          </div>

          {/* Grid of video tiles (Google Meet grid layout) */}
          <div className="flex-1 p-6 pb-24 flex gap-4 items-center justify-center min-h-0">
            <div className="w-full h-full max-h-[520px] flex gap-4">
              <div className="flex-1 h-full min-w-0">
                <VideoTile
                  name="Aria Sterling (Candidate)"
                  initials="AS"
                  imageSrc="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=250"
                  isSpeaking={candidateSpeaking}
                />
              </div>
              <div className="flex-1 h-full min-w-0">
                <VideoTile
                  name="Sarah Jenkins (You)"
                  initials="SJ"
                  isSpeaking={!candidateSpeaking}
                  isYou
                  camOn={camOn}
                />
              </div>
            </div>
          </div>

          {/* Floating controls bar at the bottom center of the video screen */}
          <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex items-center gap-3.5 z-20 bg-[#1e1f22]/90 backdrop-blur-md px-5 py-3 rounded-full border border-white/5 shadow-2xl">
            {/* Mic Toggle */}
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => { setMicOn((v) => !v); playClick(); }}
              className={`w-11 h-11 rounded-full flex items-center justify-center transition-all ${
                micOn ? 'bg-[#3c4043] text-white hover:bg-[#4d5154]' : 'bg-[#ea4335] text-white hover:bg-[#f25c4f]'
              }`}
              title={micOn ? 'Mute microphone' : 'Unmute microphone'}
            >
              {micOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
            </motion.button>

            {/* Camera Toggle */}
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => { setCamOn((v) => !v); playClick(); }}
              className={`w-11 h-11 rounded-full flex items-center justify-center transition-all ${
                camOn ? 'bg-[#3c4043] text-white hover:bg-[#4d5154]' : 'bg-[#ea4335] text-white hover:bg-[#f25c4f]'
              }`}
              title={camOn ? 'Turn camera off' : 'Turn camera on'}
            >
              {camOn ? <Monitor className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
            </motion.button>

            {/* Screen Share */}
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={playClick}
              className="w-11 h-11 rounded-full flex items-center justify-center bg-[#3c4043] text-white hover:bg-[#4d5154] transition-all"
              title="Share screen"
            >
              <ScreenShare className="w-5 h-5" />
            </motion.button>

            {/* AI Copilot panel toggle */}
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => { setShowPanel((v) => !v); playClick(); }}
              className={`w-11 h-11 rounded-full flex items-center justify-center transition-all ${
                showPanel ? 'bg-[#8ab4f8] text-[#202124] hover:bg-[#a8c7fa]' : 'bg-[#3c4043] text-white hover:bg-[#4d5154]'
              }`}
              title={showPanel ? 'Hide AI panel' : 'Show AI panel'}
            >
              <MessageSquare className="w-5 h-5" />
            </motion.button>

            {/* End Call */}
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={playClick}
              className="w-16 h-11 rounded-full flex items-center justify-center bg-[#ea4335] hover:bg-[#d93025] text-white transition-all shadow-lg"
              title="End call"
            >
              <Phone className="w-5 h-5 rotate-[135deg]" />
            </motion.button>
          </div>
        </div>

        {/* AI Panel on Desktop */}
        <AnimatePresence>
          {showPanel && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 380, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 260, damping: 28 }}
              className="flex flex-col overflow-hidden bg-white rounded-2xl border border-slate-200/80 shadow-2xl"
            >
              {/* Tabs */}
              <div className="flex flex-shrink-0 border-b border-slate-100 bg-slate-50/50">
                {([
                  { id: 'copilot', label: 'AI Copilot Live', emoji: '🤖' },
                  { id: 'scorecard', label: 'Scorecard', emoji: '📋' },
                ] as { id: Tab; label: string; emoji: string }[]).map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => { setActiveTab(tab.id); playClick(); }}
                    className="relative flex-1 py-3.5 text-xs font-bold transition-all"
                    style={{
                      color: activeTab === tab.id ? '#6366f1' : '#94a3b8',
                      borderBottom: activeTab === tab.id ? '2.5px solid #6366f1' : '2.5px solid transparent',
                      background: 'transparent',
                    }}
                  >
                    <span className="mr-1">{tab.emoji}</span>
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Tab content */}
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
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ═══════════ MOBILE LAYOUT (GOOGLE MEET MOBILE OPTIMIZED) ═══════════ */}
      <div className="md:hidden flex flex-col flex-1 min-h-0 overflow-hidden bg-[#111214]">
        {/* Video Area Container */}
        <div
          className="relative transition-all duration-300 bg-[#202124] overflow-hidden"
          style={{
            height: showPanel ? '35vh' : '100%',
            flex: showPanel ? 'none' : '1',
          }}
        >
          {/* Header overlay for room name & timer */}
          <div className="absolute top-3 left-3 z-10 flex items-center gap-1.5 bg-black/45 backdrop-blur-md px-2 py-1 rounded-md text-[10px] text-white font-semibold border border-white/5 shadow-md">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
            <span>Aria Sterling</span>
          </div>

          <div className="absolute top-3 right-3 z-10 bg-black/45 backdrop-blur-md px-2.5 py-1 rounded-md text-[10px] text-white font-mono font-bold flex items-center gap-1 border border-white/5 shadow-md">
            <Clock className="w-3 h-3 text-slate-400" />
            {fmt(elapsed)}
          </div>

          {/* Video Grid/PiP Layout */}
          <div className="w-full h-full relative">
            {/* Candidate: main background tile */}
            <div className="w-full h-full">
              <VideoTile
                name="Aria (Candidate)"
                initials="AS"
                imageSrc="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=250"
                isSpeaking={candidateSpeaking}
              />
            </div>

            {/* You: floating picture-in-picture tile in top-right */}
            <motion.div
              drag
              dragConstraints={{ left: 10, right: 280, top: 10, bottom: 400 }}
              className="absolute top-12 right-3 w-24 h-32 rounded-lg overflow-hidden shadow-2xl z-10 border border-white/10"
              style={{ touchAction: 'none' }}
            >
              <VideoTile
                name="You"
                initials="SJ"
                isSpeaking={!candidateSpeaking}
                isYou
                camOn={camOn}
              />
            </motion.div>

            {/* Floating Mobile Controls overlayed at bottom center of the video box */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2.5 z-20 bg-[#1e1f22]/85 backdrop-blur-md px-4 py-2.5 rounded-full border border-white/5 shadow-xl">
              {/* Mic toggle */}
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => { setMicOn((v) => !v); playClick(); }}
                className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                  micOn ? 'bg-[#3c4043] text-white' : 'bg-[#ea4335] text-white'
                }`}
              >
                {micOn ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
              </motion.button>

              {/* Video toggle */}
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => { setCamOn((v) => !v); playClick(); }}
                className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                  camOn ? 'bg-[#3c4043] text-white' : 'bg-[#ea4335] text-white'
                }`}
              >
                {camOn ? <Monitor className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
              </motion.button>

              {/* AI Copilot toggle */}
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => { setShowPanel((v) => !v); playClick(); }}
                className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                  showPanel ? 'bg-[#8ab4f8] text-[#202124]' : 'bg-[#3c4043] text-white'
                }`}
              >
                <MessageSquare className="w-4 h-4" />
              </motion.button>

              {/* End call */}
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={playClick}
                className="w-12 h-9 rounded-full flex items-center justify-center bg-[#ea4335] text-white shadow-md"
              >
                <Phone className="w-4 h-4 rotate-[135deg]" />
              </motion.button>
            </div>
          </div>
        </div>

        {/* Mobile AI Panel */}
        <AnimatePresence>
          {showPanel && (
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: '65vh' }}
              exit={{ height: 0 }}
              className="flex flex-col bg-white overflow-hidden flex-shrink-0"
              style={{
                borderTopLeftRadius: '1.5rem',
                borderTopRightRadius: '1.5rem',
                boxShadow: '0 -10px 30px rgba(0,0,0,0.15)',
              }}
            >
              {/* Tab selector bar */}
              <div className="flex flex-shrink-0 border-b border-slate-100 bg-slate-50/50 py-1 shadow-sm">
                {([
                  { id: 'copilot', label: 'AI Copilot Live', emoji: '🤖' },
                  { id: 'scorecard', label: 'Scorecard', emoji: '📋' },
                ] as { id: Tab; label: string; emoji: string }[]).map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => { setActiveTab(tab.id); playClick(); }}
                    className="relative flex-1 py-3 text-xs font-bold transition-all"
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

              {/* Tab Contents */}
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
            </motion.div>
          )}
        </AnimatePresence>
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
      className="p-4 space-y-4"
    >
      {/* AI listening banner */}
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

      {/* Transcript bubbles */}
      <div className="space-y-3">
        {/* Interviewer bubble */}
        <div className="flex justify-end">
          <p
            className="text-[12px] text-white leading-relaxed rounded-2xl rounded-br-sm px-3.5 py-2.5 shadow-md"
            style={{
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              maxWidth: '88%',
            }}
          >
            Hello! Thanks for joining the call today. Can you start by giving us a brief overview
            of your technical background and experience?
          </p>
        </div>

        {/* Candidate bubble */}
        <div className="flex flex-col gap-1">
          <span className="text-[10px] font-bold text-indigo-500 ml-1">Aria Sterling (Candidate):</span>
          <p
            className="text-[12px] text-slate-700 dark:text-slate-300 leading-relaxed rounded-2xl rounded-bl-sm px-3.5 py-2.5"
            style={{
              background: 'rgba(241,245,249,1)',
              border: '1px solid rgba(148,163,184,0.15)',
              maxWidth: '90%',
            }}
          >
            Hi Sarah. Sure, I have about 6 years of experience in backend development with
            Python, FastAPI, and PostgreSQL. I specialize in designing scalable systems,
            query optimizations, and implementing caching mechanisms with Redis.
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
                style={{ background: 'rgba(99,102,241,0.12)' }}>
                <Sparkles className="w-3 h-3 text-indigo-400" />
              </div>
              <div className="flex items-center gap-1.5 flex-1 min-w-0">
                <span className="text-[10px] text-indigo-500 font-bold">Aria is speaking</span>
                <WaveformVisualizer active={speaking} color="#818cf8" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Suggested question card */}
      <div
        className="rounded-xl p-3 shadow-sm"
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
        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
          Recruiter Evaluation Notes
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Write detailed comments, observed strengths, risks, or compensation details..."
          rows={4}
          className="w-full text-sm text-slate-700 rounded-xl p-3 resize-none focus:outline-none transition-all shadow-sm"
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
        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
          Interview Decision Result
        </label>
        <div className="relative">
          <select
            value={decision}
            onChange={(e) => { setDecision(e.target.value); playClick(); }}
            className="w-full text-sm rounded-xl px-3.5 py-2.5 pr-10 appearance-none focus:outline-none transition-all cursor-pointer shadow-sm"
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
            className="flex items-center justify-center gap-2 w-full py-3.5 rounded-xl text-white text-sm font-bold shadow-md"
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
            className="w-full py-3.5 rounded-xl text-white text-sm font-bold transition-all shadow-md"
            style={{
              background: 'linear-gradient(135deg, #059669, #10b981)',
              boxShadow: '0 4px 16px rgba(16,185,129,0.3)',
            }}
          >
            Submit Scorecard &amp; Archive Call
          </motion.button>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
