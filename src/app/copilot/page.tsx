'use client';

/**
 * /copilot — Full-page AI Copilot with voice-to-voice + text-to-text.
 * Uses the same engine as FloatingCopilot but in a full-page layout.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles, Send, Mic, MicOff, Volume2, VolumeX,
  RotateCcw, FileText, Search, CheckSquare, BookOpen, ChevronRight,
} from 'lucide-react';
import { playClick, playChime } from '@/lib/sounds';

type Role = 'user' | 'assistant';
interface Msg { id: string; role: Role; text: string; ts: number }

const uid = () => Math.random().toString(36).slice(2, 9);

const QUICK_CHIPS = [
  { label: 'Analyze React JD', icon: FileText },
  { label: 'Best DevOps Candidate?', icon: Search },
  { label: 'Explain Candidate Scores', icon: CheckSquare },
  { label: 'Compare Amit vs Priya', icon: BookOpen },
];

const AI_REPLIES: Record<string, string> = {
  default:
    '🤖 **TalentMind Copilot:** I can help you search, filter, and compare candidates!\nTry asking me:\n• *"Who knows PyTorch?"*\n• *"Are there any hidden gems?"*\n• *"Compare Amit vs Priya"*',
  react:
    '📄 **React JD Analysis:** The React Job Description targets mid-to-senior engineers. Top match: **John Doe (92%)** — 4+ years React, TypeScript, Next.js. I found 3 strong shortlist candidates. Want me to rank them?',
  devops:
    '🏆 **Best DevOps Candidate:** **David Kim (91%)** leads your pipeline — Kubernetes, Terraform, CI/CD, AWS expertise. Second place: Emily Chen at 88%. Shall I auto-schedule an interview?',
  compare:
    '⚖️ **Amit vs Priya Comparison:**\n- Amit: Backend (Python, FastAPI) • 84% match\n- Priya: Full-Stack (React+Node) • 88% match\nPriya scores higher on technical communication. Recommend Priya for this role.',
  pytorch:
    '🔍 **PyTorch Candidates:** Found 2 candidates with PyTorch experience:\n1. Lisa Wang – Data Scientist (89%)\n2. James Park – ML Engineer (87%)\nWould you like to view their full profiles?',
  gems:
    '💎 **Hidden Gems Found:** 2 under-reviewed candidates with high AI scores:\n1. **Riya Sharma** (86%) – Strong NLP + LangChain skills, no prior outreach\n2. **Karan Mehta** (84%) – Rust + WebAssembly, unique profile\nShall I flag them for review?',
};

function getReply(text: string): string {
  const q = text.toLowerCase();
  if (q.includes('react') || q.includes('jd') || q.includes('job')) return AI_REPLIES.react;
  if (q.includes('devops') || q.includes('david')) return AI_REPLIES.devops;
  if (q.includes('compare') || q.includes('vs') || q.includes('amit') || q.includes('priya')) return AI_REPLIES.compare;
  if (q.includes('pytorch') || q.includes('torch')) return AI_REPLIES.pytorch;
  if (q.includes('gem') || q.includes('hidden')) return AI_REPLIES.gems;
  return AI_REPLIES.default;
}

/* ── Waveform ── */
function Waveform({ active, color = '#6366f1' }: { active: boolean; color?: string }) {
  return (
    <div className="flex items-end gap-[2px] h-4">
      {Array.from({ length: 9 }).map((_, i) => (
        <motion.div
          key={i}
          style={{ width: 2.5, background: color, borderRadius: 99 }}
          animate={active ? { height: [3, 16, 5, 14, 4, 18, 3] } : { height: 3 }}
          transition={{ repeat: Infinity, duration: 0.55 + i * 0.09, delay: i * 0.05 }}
        />
      ))}
    </div>
  );
}

/* ── Message bubble ── */
function Bubble({ msg, isSpeaking, onSpeak, onStop }: {
  msg: Msg; isSpeaking: boolean;
  onSpeak: (msg: Msg) => void; onStop: () => void;
}) {
  const isUser = msg.role === 'user';
  const lines = msg.text.split('\n');

  return (
    <motion.div
      initial={{ opacity: 0, y: 12, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 26 }}
      className={`flex items-end gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
    >
      {/* Avatar */}
      <div
        className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold text-white flex-shrink-0 mb-0.5"
        style={{
          background: isUser
            ? 'rgba(255,255,255,0.1)'
            : 'linear-gradient(135deg,#6366f1,#8b5cf6)',
          border: isUser ? '1px solid rgba(255,255,255,0.15)' : 'none',
        }}
      >
        {isUser ? 'U' : 'AI'}
      </div>

      <div
        className={`flex flex-col gap-1 ${isUser ? 'items-end' : 'items-start'}`}
        style={{ maxWidth: '75%' }}
      >
        <div
          className="px-4 py-3 text-sm leading-relaxed"
          style={{
            borderRadius: isUser ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
            ...(isUser
              ? {
                  background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
                  color: 'white',
                  boxShadow: '0 4px 16px rgba(99,102,241,0.3)',
                }
              : {
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: '#e2e8f0',
                }),
          }}
        >
          {lines.map((line, li) => {
            const parts = line.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g);
            return (
              <p key={li} className={li > 0 ? 'mt-1' : ''}>
                {parts.map((part, pi) => {
                  if (part.startsWith('**') && part.endsWith('**'))
                    return <strong key={pi} className="font-bold">{part.slice(2, -2)}</strong>;
                  if (part.startsWith('*') && part.endsWith('*'))
                    return <em key={pi} className="italic text-indigo-300">{part.slice(1, -1)}</em>;
                  return <span key={pi}>{part}</span>;
                })}
              </p>
            );
          })}

          {/* TTS waveform */}
          {!isUser && isSpeaking && (
            <div className="mt-2 pt-2 border-t border-white/10">
              <Waveform active color="#818cf8" />
            </div>
          )}
        </div>

        {/* Speak/stop button for AI messages */}
        {!isUser && (
          <button
            onClick={() => isSpeaking ? onStop() : onSpeak(msg)}
            className="flex items-center gap-1 text-[10px] font-medium transition-colors"
            style={{ color: isSpeaking ? '#f87171' : '#64748b' }}
          >
            {isSpeaking ? (
              <><VolumeX className="w-3 h-3" /> Stop</>
            ) : (
              <><Volume2 className="w-3 h-3" /> Listen</>
            )}
          </button>
        )}
      </div>
    </motion.div>
  );
}

/* ── Thinking indicator ── */
function Thinking() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="flex items-end gap-3"
    >
      <div
        className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold text-white flex-shrink-0"
        style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}
      >
        AI
      </div>
      <div
        className="flex items-center gap-1.5 px-4 py-3 rounded-xl"
        style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
      >
        <span className="text-xs text-slate-400 mr-1">Thinking</span>
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="w-1.5 h-1.5 rounded-full bg-indigo-500"
            animate={{ y: [0, -5, 0], opacity: [0.4, 1, 0.4] }}
            transition={{ repeat: Infinity, duration: 0.7, delay: i * 0.15 }}
          />
        ))}
      </div>
    </motion.div>
  );
}

/* ═══════════════════════ PAGE ═══════════════════════ */
export default function CopilotPage() {
  const [msgs, setMsgs] = useState<Msg[]>([{
    id: uid(), role: 'assistant', ts: Date.now(), text: AI_REPLIES.default,
  }]);
  const [input, setInput] = useState('');
  const [thinking, setThinking] = useState(false);
  const [voiceMode, setVoiceMode] = useState(false);
  const [listening, setListening] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState('');
  const [speakingId, setSpeakingId] = useState<string | null>(null);

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const recRef = useRef<any>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') synthRef.current = window.speechSynthesis;
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [msgs, thinking]);

  /* ── TTS ── */
  const speak = useCallback((msg: Msg) => {
    if (!synthRef.current) return;
    synthRef.current.cancel();
    const clean = msg.text
      .replace(/\*\*([^*]+)\*\*/g, '$1')
      .replace(/\*([^*]+)\*/g, '$1')
      .replace(/[🤖📄🏆⚖️🔍💎]/g, '');
    const utter = new SpeechSynthesisUtterance(clean);
    utter.lang = 'en-US'; utter.rate = 1.0; utter.pitch = 1.05;
    const voices = synthRef.current.getVoices();
    const pref = voices.find((v) =>
      ['Google US English', 'Samantha', 'Alex', 'Karen'].includes(v.name)
    ) || voices.find((v) => v.lang.startsWith('en')) || voices[0];
    if (pref) utter.voice = pref;
    utter.onstart = () => setSpeakingId(msg.id);
    utter.onend = () => setSpeakingId(null);
    utter.onerror = () => setSpeakingId(null);
    synthRef.current.speak(utter);
  }, []);

  const stopSpeak = useCallback(() => {
    synthRef.current?.cancel();
    setSpeakingId(null);
  }, []);

  /* ── Send ── */
  const sendMessage = useCallback((text: string) => {
    if (!text.trim()) return;
    stopSpeak();
    playClick();
    const userMsg: Msg = { id: uid(), role: 'user', text: text.trim(), ts: Date.now() };
    setMsgs((p) => [...p, userMsg]);
    setInput('');
    setThinking(true);

    setTimeout(() => {
      const reply = getReply(text);
      const aiMsg: Msg = { id: uid(), role: 'assistant', text: reply, ts: Date.now() };
      setMsgs((p) => [...p, aiMsg]);
      setThinking(false);
      playChime();
      if (voiceMode) speak(aiMsg);
    }, 900 + Math.random() * 900);
  }, [voiceMode, speak, stopSpeak]);

  /* ── Mic ── */
  const startListening = () => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) { alert('Speech recognition not supported. Use Chrome or Edge.'); return; }
    stopSpeak();
    const rec = new SR() as {
      lang: string; continuous: boolean; interimResults: boolean;
      onstart: (() => void) | null; onend: (() => void) | null;
      onerror: (() => void) | null; onresult: ((e: any) => void) | null;
      start(): void; stop(): void;
    };
    recRef.current = rec as any;
    rec.lang = 'en-US'; rec.continuous = false; rec.interimResults = true;
    rec.onstart = () => setListening(true);
    rec.onend = () => { setListening(false); setLiveTranscript(''); };
    rec.onerror = () => { setListening(false); setLiveTranscript(''); };
    rec.onresult = (e: any) => {
      let interim = '', final = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript;
        if (e.results[i].isFinal) final += t; else interim += t;
      }
      setLiveTranscript(interim || final);
      if (final) { setListening(false); setLiveTranscript(''); sendMessage(final); }
    };
    rec.start();
  };

  const stopListening = () => { recRef.current?.stop(); setListening(false); setLiveTranscript(''); };
  const toggleMic = () => listening ? stopListening() : startListening();
  const clearChat = () => {
    stopSpeak(); stopListening();
    setMsgs([{ id: uid(), role: 'assistant', ts: Date.now(), text: AI_REPLIES.default }]);
    setInput(''); setThinking(false);
  };

  return (
    <div
      className="flex flex-col"
      style={{ height: 'calc(100dvh - 72px)' }}
    >
      {/* ── Header ── */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between px-4 md:px-6 py-3.5 flex-shrink-0"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
      >
        <div className="flex items-center gap-3">
          <motion.div
            animate={{ rotate: [0, 8, -8, 0] }}
            transition={{ repeat: Infinity, duration: 3 }}
            className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg"
            style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', boxShadow: '0 4px 16px rgba(99,102,241,0.35)' }}
          >
            <Sparkles className="w-5 h-5 text-white" />
          </motion.div>
          <div>
            <h1 className="text-base md:text-lg font-bold text-white leading-tight">TalentMind Copilot AI</h1>
            <p className="text-[11px] text-slate-400">Voice + Text intelligence for your hiring pipeline</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Online badge */}
          <div className="flex items-center gap-1.5 text-[10px] text-emerald-400 bg-emerald-500/10 px-2.5 py-1.5 rounded-full font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-live" />
            Online
          </div>

          {/* Voice mode */}
          <button
            onClick={() => { setVoiceMode((v) => { if (v) stopSpeak(); return !v; }); playClick(); }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold transition-all"
            style={{
              background: voiceMode ? 'rgba(99,102,241,0.2)' : 'rgba(255,255,255,0.06)',
              border: `1px solid ${voiceMode ? 'rgba(99,102,241,0.4)' : 'rgba(255,255,255,0.1)'}`,
              color: voiceMode ? '#818cf8' : '#64748b',
            }}
          >
            {voiceMode ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">Voice {voiceMode ? 'On' : 'Off'}</span>
          </button>

          {/* Clear */}
          <button
            onClick={clearChat}
            className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-white/5 transition-colors"
            title="Clear chat"
          >
            <RotateCcw className="w-4 h-4 text-slate-500" />
          </button>
        </div>
      </motion.div>

      {/* ── Messages ── */}
      <div className="flex-1 overflow-y-auto no-scrollbar px-4 md:px-6 py-4 space-y-4">
        <AnimatePresence initial={false}>
          {msgs.map((msg) => (
            <Bubble
              key={msg.id}
              msg={msg}
              isSpeaking={speakingId === msg.id}
              onSpeak={speak}
              onStop={stopSpeak}
            />
          ))}
          {thinking && <Thinking key="thinking" />}
        </AnimatePresence>
        <div ref={bottomRef} />
      </div>

      {/* ── Live transcript banner ── */}
      <AnimatePresence>
        {listening && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="flex-shrink-0 mx-4 md:mx-6 mb-2 rounded-xl px-4 py-2.5 overflow-hidden"
            style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)' }}
          >
            <div className="flex items-center gap-3">
              <motion.div
                animate={{ scale: [1, 1.4, 1] }}
                transition={{ repeat: Infinity, duration: 0.7 }}
                className="w-2.5 h-2.5 rounded-full bg-red-500 flex-shrink-0"
              />
              <Waveform active color="#f87171" />
              <span className="text-sm text-red-300 font-medium">
                {liveTranscript || 'Listening…'}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Quick chips ── */}
      <div className="flex-shrink-0 px-4 md:px-6 pb-2 flex gap-2 overflow-x-auto no-scrollbar">
        {QUICK_CHIPS.map((chip) => (
          <button
            key={chip.label}
            onClick={() => sendMessage(chip.label)}
            className="flex-shrink-0 flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1.5 rounded-full transition-all"
            style={{
              background: 'rgba(99,102,241,0.1)',
              border: '1px solid rgba(99,102,241,0.2)',
              color: '#a5b4fc',
            }}
          >
            <chip.icon className="w-3 h-3" />
            {chip.label}
          </button>
        ))}
      </div>

      {/* ── Input area ── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex-shrink-0 px-4 md:px-6 pb-3"
        style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}
      >
        <div
          className="flex items-center gap-2 mt-3 rounded-2xl px-3 py-2"
          style={{
            background: 'rgba(255,255,255,0.05)',
            border: listening
              ? '1.5px solid rgba(239,68,68,0.5)'
              : '1.5px solid rgba(255,255,255,0.09)',
            transition: 'border-color 0.2s',
          }}
        >
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage(input)}
            placeholder={listening ? 'Listening…' : 'Ask about candidates or JDs…'}
            className="flex-1 bg-transparent text-sm text-slate-200 placeholder-slate-500 focus:outline-none py-1.5"
            style={{ fontSize: 16 }}
            disabled={listening}
          />

          {/* Mic */}
          <motion.button
            whileTap={{ scale: 0.85 }}
            onClick={toggleMic}
            className="w-9 h-9 flex items-center justify-center rounded-xl transition-all flex-shrink-0"
            style={{
              background: listening ? 'rgba(239,68,68,0.2)' : 'transparent',
            }}
            title={listening ? 'Stop listening' : 'Voice input'}
          >
            <AnimatePresence mode="wait">
              {listening ? (
                <motion.div key="off" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                  <MicOff className="w-5 h-5 text-red-400" />
                </motion.div>
              ) : (
                <motion.div key="on" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                  <Mic
                    className="w-5 h-5"
                    style={{ color: voiceMode ? '#f87171' : '#64748b' }}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.button>

          {/* Send */}
          <motion.button
            whileTap={{ scale: 0.85 }}
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || listening}
            className="w-9 h-9 flex items-center justify-center rounded-xl transition-all flex-shrink-0"
            style={{
              background: input.trim() && !listening
                ? 'linear-gradient(135deg,#6366f1,#8b5cf6)'
                : 'rgba(255,255,255,0.06)',
              boxShadow: input.trim() && !listening ? '0 4px 14px rgba(99,102,241,0.35)' : 'none',
            }}
          >
            <Send
              className="w-4 h-4"
              style={{ color: input.trim() && !listening ? 'white' : '#475569', marginLeft: 1 }}
            />
          </motion.button>
        </div>

        <p className="text-[10px] text-slate-600 text-center mt-2">
          Voice + Text AI · Responses are AI-generated · Not professional advice
        </p>
      </motion.div>
    </div>
  );
}
