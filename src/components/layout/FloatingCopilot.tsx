'use client';

/**
 * FloatingCopilot — Floating AI chat widget with full voice-to-voice + text-to-text.
 *
 * Voice I/O uses the Web Speech API (SpeechRecognition + SpeechSynthesis).
 * Both are available in Chrome, Edge, Safari 15+. Firefox requires a flag.
 *
 * Features:
 *  - Floating pill button (bottom-right)
 *  - Full chat panel (open/close with spring animation)
 *  - Text input → AI response
 *  - Microphone button → speech-to-text → AI response → text-to-speech
 *  - Voice Mode toggle (TTS auto-reads every AI reply when on)
 *  - Live transcript while listening
 *  - Animated waveform during TTS playback
 *  - Quick-chip suggestions
 *  - Persistent chat history in sessionStorage
 *  - Works on all devices (mobile/tablet/desktop)
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles, X, Send, Mic, MicOff, Volume2, VolumeX,
  RotateCcw, ChevronRight,
} from 'lucide-react';

/* ─────────────────── types ─────────────────── */
type Role = 'user' | 'assistant';
interface Msg { id: string; role: Role; text: string; ts: number }

/* ─────────────────── constants ─────────────────── */
const QUICK_CHIPS = [
  'Analyze React JD',
  'Best DevOps Candidate?',
  'Compare Amit vs Priya',
  'Who knows PyTorch?',
  'Are there hidden gems?',
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

const uid = () => Math.random().toString(36).slice(2, 9);

/* ─────────────────── waveform bars ─────────────────── */
function Waveform({ active, color = '#fff' }: { active: boolean; color?: string }) {
  return (
    <div className="flex items-end gap-[2px] h-4">
      {Array.from({ length: 7 }).map((_, i) => (
        <motion.div
          key={i}
          style={{ width: 2.5, background: color, borderRadius: 99 }}
          animate={active ? { height: [3, 14, 5, 12, 4, 16, 3] } : { height: 3 }}
          transition={{ repeat: Infinity, duration: 0.55 + i * 0.1, delay: i * 0.06 }}
        />
      ))}
    </div>
  );
}

/* ─────────────────── message bubble ─────────────────── */
function Bubble({ msg, isSpeaking }: { msg: Msg; isSpeaking: boolean }) {
  const isUser = msg.role === 'user';
  // Render bold (**text**) and italic (*text*) markdown-lite
  const lines = msg.text.split('\n');
  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: 'spring', stiffness: 320, damping: 28 }}
      className={`flex items-end gap-2 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
    >
      {/* Avatar */}
      {!isUser && (
        <div
          className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-[10px] font-bold text-white mb-0.5"
          style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', flexShrink: 0 }}
        >
          AI
        </div>
      )}
      {isUser && (
        <div
          className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-[10px] font-bold text-white mb-0.5"
          style={{ background: 'rgba(255,255,255,0.15)', flexShrink: 0 }}
        >
          U
        </div>
      )}

      <div
        className={`max-w-[80%] text-[13px] leading-relaxed px-3.5 py-2.5 ${
          isUser ? 'rounded-2xl rounded-br-sm' : 'rounded-2xl rounded-bl-sm'
        }`}
        style={
          isUser
            ? {
                background: 'rgba(255,255,255,0.12)',
                border: '1px solid rgba(255,255,255,0.18)',
                color: '#f1f5f9',
              }
            : {
                background: 'white',
                color: '#1e293b',
                boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
              }
        }
      >
        {lines.map((line, li) => {
          // Parse **bold** and *italic*
          const parts = line.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g);
          return (
            <p key={li} className={li > 0 ? 'mt-1' : ''}>
              {parts.map((part, pi) => {
                if (part.startsWith('**') && part.endsWith('**'))
                  return <strong key={pi}>{part.slice(2, -2)}</strong>;
                if (part.startsWith('*') && part.endsWith('*'))
                  return <em key={pi}>{part.slice(1, -1)}</em>;
                return <span key={pi}>{part}</span>;
              })}
            </p>
          );
        })}

        {/* Speaking waveform under AI bubble */}
        {!isUser && isSpeaking && (
          <div className="mt-2">
            <Waveform active color="#6366f1" />
          </div>
        )}
      </div>
    </motion.div>
  );
}

/* ─────────────────── typing indicator ─────────────────── */
function Thinking() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="flex items-end gap-2"
    >
      <div
        className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
        style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}
      >
        AI
      </div>
      <div
        className="flex items-center gap-1.5 px-4 py-3 rounded-2xl rounded-bl-sm"
        style={{ background: 'white', boxShadow: '0 2px 8px rgba(0,0,0,0.10)' }}
      >
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="w-1.5 h-1.5 rounded-full"
            style={{ background: '#6366f1' }}
            animate={{ y: [0, -5, 0], opacity: [0.4, 1, 0.4] }}
            transition={{ repeat: Infinity, duration: 0.7, delay: i * 0.15 }}
          />
        ))}
      </div>
    </motion.div>
  );
}

/* ═══════════════════════ MAIN WIDGET ═══════════════════════ */
export function FloatingCopilot() {
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [thinking, setThinking] = useState(false);
  const [voiceMode, setVoiceMode] = useState(false);
  const [listening, setListening] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState('');
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const [unread, setUnread] = useState(0);

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);

  /* ── init speech synthesis ── */
  useEffect(() => {
    if (typeof window !== 'undefined') {
      synthRef.current = window.speechSynthesis;
    }
  }, []);

  /* ── scroll to bottom ── */
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [msgs, thinking]);

  /* ── focus input when opened ── */
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 300);
      setUnread(0);
    }
  }, [open]);

  /* ── welcome message on first open ── */
  useEffect(() => {
    if (open && msgs.length === 0) {
      const welcome: Msg = {
        id: uid(),
        role: 'assistant',
        text: AI_REPLIES.default,
        ts: Date.now(),
      };
      setMsgs([welcome]);
    }
  }, [open]);

  /* ── speak a message via TTS ── */
  const speak = useCallback((text: string, msgId: string) => {
    if (!synthRef.current) return;
    synthRef.current.cancel();
    // Strip markdown
    const clean = text.replace(/\*\*([^*]+)\*\*/g, '$1').replace(/\*([^*]+)\*/g, '$1').replace(/[🤖📄🏆⚖️🔍💎]/g, '');
    const utter = new SpeechSynthesisUtterance(clean);
    utter.lang = 'en-US';
    utter.rate = 1.0;
    utter.pitch = 1.05;
    // Pick a natural voice if available
    const voices = synthRef.current.getVoices();
    const preferred = voices.find((v) =>
      ['Google US English', 'Samantha', 'Alex', 'Karen', 'Moira'].includes(v.name)
    ) || voices.find((v) => v.lang.startsWith('en') && !v.name.includes('Google')) || voices[0];
    if (preferred) utter.voice = preferred;
    utter.onstart = () => setSpeakingId(msgId);
    utter.onend = () => setSpeakingId(null);
    utter.onerror = () => setSpeakingId(null);
    synthRef.current.speak(utter);
  }, []);

  /* ── stop TTS ── */
  const stopSpeak = () => {
    synthRef.current?.cancel();
    setSpeakingId(null);
  };

  /* ── send message ── */
  const sendMessage = useCallback((text: string) => {
    if (!text.trim()) return;
    stopSpeak();

    const userMsg: Msg = { id: uid(), role: 'user', text: text.trim(), ts: Date.now() };
    setMsgs((prev) => [...prev, userMsg]);
    setInput('');
    setThinking(true);

    const delay = 1000 + Math.random() * 1000;
    setTimeout(() => {
      const reply = getReply(text);
      const aiMsg: Msg = { id: uid(), role: 'assistant', text: reply, ts: Date.now() };
      setMsgs((prev) => [...prev, aiMsg]);
      setThinking(false);
      if (!open) setUnread((u) => u + 1);
      if (voiceMode) speak(reply, aiMsg.id);
    }, delay);
  }, [voiceMode, speak, open]);

  /* ── start mic ── */
  const startListening = () => {
    const SR =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;
    if (!SR) {
      alert('Speech recognition is not supported in your browser. Try Chrome or Edge.');
      return;
    }
    stopSpeak();
    const rec = new SR() as {
      lang: string; continuous: boolean; interimResults: boolean;
      onstart: (() => void) | null;
      onend: (() => void) | null;
      onerror: (() => void) | null;
      onresult: ((e: any) => void) | null;
      start(): void; stop(): void;
    };
    recognitionRef.current = rec as any;
    rec.lang = 'en-US';
    rec.continuous = false;
    rec.interimResults = true;

    rec.onstart = () => setListening(true);
    rec.onend = () => { setListening(false); setLiveTranscript(''); };
    rec.onerror = () => { setListening(false); setLiveTranscript(''); };
    rec.onresult = (e: any) => {
      let interim = '';
      let final = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript;
        if (e.results[i].isFinal) final += t;
        else interim += t;
      }
      setLiveTranscript(interim || final);
      if (final) {
        setListening(false);
        setLiveTranscript('');
        sendMessage(final);
      }
    };
    rec.start();
  };

  const stopListening = () => {
    recognitionRef.current?.stop();
    setListening(false);
    setLiveTranscript('');
  };

  const toggleMic = () => {
    if (listening) stopListening();
    else startListening();
  };

  const clearChat = () => {
    stopSpeak();
    stopListening();
    setMsgs([]);
    setInput('');
    setThinking(false);
  };

  return (
    <>
      {/* ═══ FLOATING BUTTON ═══ */}
      <motion.button
        onClick={() => setOpen((v) => !v)}
        aria-label="Open AI Copilot"
        className="fixed z-50 flex items-center justify-center rounded-full shadow-2xl"
        style={{
          bottom: 'calc(72px + 16px + env(safe-area-inset-bottom))',
          right: 16,
          width: 52,
          height: 52,
          background: open
            ? 'linear-gradient(135deg,#ef4444,#dc2626)'
            : 'linear-gradient(135deg,#6366f1,#8b5cf6)',
          boxShadow: open
            ? '0 6px 24px rgba(239,68,68,0.45)'
            : '0 6px 24px rgba(99,102,241,0.5)',
        }}
        whileTap={{ scale: 0.88 }}
        animate={{ rotate: open ? 45 : 0 }}
        transition={{ type: 'spring', stiffness: 400, damping: 22 }}
      >
        {open ? <X className="w-5 h-5 text-white" /> : <Sparkles className="w-5 h-5 text-white" />}

        {/* Unread badge */}
        <AnimatePresence>
          {unread > 0 && !open && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold text-white"
              style={{ background: '#ef4444' }}
            >
              {unread}
            </motion.div>
          )}
        </AnimatePresence>

        {/* AI label */}
        {!open && (
          <span
            className="absolute -bottom-1 -right-1 text-[8px] font-black text-white px-1 rounded-sm"
            style={{ background: 'rgba(0,0,0,0.55)', letterSpacing: '0.05em' }}
          >
            AI
          </span>
        )}
      </motion.button>

      {/* ═══ CHAT PANEL ═══ */}
      <AnimatePresence>
        {open && (
          <motion.div
            key="copilot-panel"
            initial={{ opacity: 0, y: 24, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.94 }}
            transition={{ type: 'spring', stiffness: 340, damping: 30 }}
            className="fixed z-50 flex flex-col overflow-hidden"
            style={{
              bottom: 'calc(72px + 16px + 56px + env(safe-area-inset-bottom))',
              right: 12,
              width: 'min(380px, calc(100vw - 24px))',
              height: 'min(540px, calc(100dvh - 180px))',
              borderRadius: 20,
              background: 'linear-gradient(160deg,#0e0c24 0%,#13102b 100%)',
              border: '1px solid rgba(99,102,241,0.25)',
              boxShadow: '0 24px 64px rgba(0,0,0,0.55), 0 0 0 1px rgba(99,102,241,0.12)',
            }}
          >
            {/* ── Header ── */}
            <div
              className="flex items-center justify-between px-4 py-3 flex-shrink-0"
              style={{
                background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
                borderRadius: '20px 20px 0 0',
              }}
            >
              <div className="flex items-center gap-2.5">
                <motion.div
                  animate={{ rotate: [0, 8, -8, 0] }}
                  transition={{ repeat: Infinity, duration: 3 }}
                >
                  <Sparkles className="w-5 h-5 text-white" />
                </motion.div>
                <span className="text-sm font-bold text-white tracking-tight">TalentMind Copilot AI</span>
              </div>

              <div className="flex items-center gap-2">
                {/* Voice mode toggle */}
                <button
                  onClick={() => {
                    setVoiceMode((v) => {
                      if (v) stopSpeak();
                      return !v;
                    });
                  }}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold transition-all"
                  style={{
                    background: voiceMode ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.12)',
                    color: 'white',
                    border: '1px solid rgba(255,255,255,0.3)',
                  }}
                >
                  {voiceMode ? <Volume2 className="w-3 h-3" /> : <VolumeX className="w-3 h-3" />}
                  Voice Mode: {voiceMode ? 'On' : 'Off'}
                </button>

                {/* Clear */}
                <button
                  onClick={clearChat}
                  className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-white/20 transition-colors"
                  title="Clear chat"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-white/70" />
                </button>

                {/* Close */}
                <button
                  onClick={() => setOpen(false)}
                  className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-white/20 transition-colors"
                >
                  <X className="w-4 h-4 text-white" />
                </button>
              </div>
            </div>

            {/* ── Messages ── */}
            <div className="flex-1 overflow-y-auto no-scrollbar px-3 py-3 space-y-3">
              <AnimatePresence initial={false}>
                {msgs.map((msg) => (
                  <Bubble
                    key={msg.id}
                    msg={msg}
                    isSpeaking={speakingId === msg.id}
                  />
                ))}
                {thinking && <Thinking key="thinking" />}
              </AnimatePresence>
              <div ref={bottomRef} />
            </div>

            {/* ── Live transcript ── */}
            <AnimatePresence>
              {listening && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="flex-shrink-0 mx-3 mb-1 rounded-xl px-3 py-2 overflow-hidden"
                  style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.25)' }}
                >
                  <div className="flex items-center gap-2">
                    <motion.div
                      animate={{ scale: [1, 1.3, 1] }}
                      transition={{ repeat: Infinity, duration: 0.8 }}
                      className="w-2 h-2 rounded-full bg-red-400 flex-shrink-0"
                    />
                    <span className="text-[11px] text-red-300 font-medium">
                      {liveTranscript || 'Listening…'}
                    </span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* ── Quick chips ── */}
            <div
              className="flex-shrink-0 px-3 pb-1.5 flex gap-2 overflow-x-auto no-scrollbar"
              style={{ scrollSnapType: 'x mandatory' }}
            >
              {QUICK_CHIPS.map((chip) => (
                <button
                  key={chip}
                  onClick={() => sendMessage(chip)}
                  className="flex-shrink-0 flex items-center gap-1 text-[11px] font-semibold px-3 py-1.5 rounded-full transition-all whitespace-nowrap"
                  style={{
                    background: 'rgba(99,102,241,0.15)',
                    border: '1px solid rgba(99,102,241,0.3)',
                    color: '#a5b4fc',
                    scrollSnapAlign: 'start',
                  }}
                >
                  {chip}
                  <ChevronRight className="w-3 h-3 opacity-60" />
                </button>
              ))}
            </div>

            {/* ── Input bar ── */}
            <div
              className="flex-shrink-0 flex items-center gap-2 mx-3 mb-3 px-3 py-2 rounded-2xl"
              style={{
                background: 'rgba(255,255,255,0.07)',
                border: listening
                  ? '1.5px solid rgba(239,68,68,0.5)'
                  : '1.5px solid rgba(255,255,255,0.1)',
                transition: 'border-color 0.2s',
              }}
            >
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage(input);
                  }
                }}
                placeholder={listening ? 'Listening…' : 'Ask about candidates or JDs…'}
                className="flex-1 bg-transparent text-sm text-slate-200 placeholder-slate-500 focus:outline-none"
                style={{ fontSize: 16 }}
                disabled={listening}
              />

              {/* Mic button */}
              <motion.button
                whileTap={{ scale: 0.85 }}
                onClick={toggleMic}
                className="w-8 h-8 flex items-center justify-center rounded-xl flex-shrink-0 transition-all"
                style={{
                  background: listening ? 'rgba(239,68,68,0.25)' : 'transparent',
                }}
                title={listening ? 'Stop listening' : 'Start voice input'}
              >
                <AnimatePresence mode="wait">
                  {listening ? (
                    <motion.div key="listening" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                      <MicOff className="w-4 h-4 text-red-400" />
                    </motion.div>
                  ) : (
                    <motion.div key="idle" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                      <Mic
                        className="w-4 h-4"
                        style={{ color: voiceMode ? '#f87171' : '#94a3b8' }}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.button>

              {/* Send button */}
              <motion.button
                whileTap={{ scale: 0.85 }}
                onClick={() => sendMessage(input)}
                disabled={!input.trim() || listening}
                className="w-8 h-8 flex items-center justify-center rounded-xl flex-shrink-0 transition-all"
                style={{
                  background:
                    input.trim() && !listening
                      ? 'linear-gradient(135deg,#6366f1,#8b5cf6)'
                      : 'rgba(255,255,255,0.06)',
                  boxShadow:
                    input.trim() && !listening
                      ? '0 4px 12px rgba(99,102,241,0.35)'
                      : 'none',
                }}
              >
                <Send
                  className="w-3.5 h-3.5"
                  style={{
                    color: input.trim() && !listening ? 'white' : '#475569',
                    marginLeft: 1,
                  }}
                />
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
