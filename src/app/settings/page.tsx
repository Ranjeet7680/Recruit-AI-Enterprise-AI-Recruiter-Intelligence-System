'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import {
  Settings, Sliders, Shield, Volume2, Key, Users,
  Save, RotateCcw, CheckCircle2, Sparkles,
  AlertCircle
} from 'lucide-react';
import { playClick, playSubmit, playSuccess } from '@/lib/sounds';

interface Weights {
  semantic: number;
  skills: number;
  experience: number;
  impact: number;
  behavioral: number;
  activity: number;
}

const DEFAULT_WEIGHTS: Weights = {
  semantic: 35,
  skills: 25,
  experience: 15,
  impact: 10,
  behavioral: 10,
  activity: 5,
};

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<'weights' | 'team' | 'audio' | 'privacy' | 'api'>('weights');
  const [weights, setWeights] = useState<Weights>(DEFAULT_WEIGHTS);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [biasReductionDefault, setBiasReductionDefault] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [soundVolume, setSoundVolume] = useState(80);
  const [geminiKey, setGeminiKey] = useState('');

  // Load weights from localStorage asynchronously to prevent cascading renders in React 19
  useEffect(() => {
    const frameId = requestAnimationFrame(() => {
      try {
        const saved = localStorage.getItem('nexora_ai_weights');
        if (saved) {
          setWeights(JSON.parse(saved));
        }
        const savedMute = localStorage.getItem('talentmind_sound_muted');
        if (savedMute !== null) {
          setSoundEnabled(savedMute !== 'true');
        }
      } catch {
        // ignore
      }
    });
    return () => cancelAnimationFrame(frameId);
  }, []);

  const totalWeight = Object.values(weights).reduce((a, b) => a + b, 0);

  const handleWeightChange = (key: keyof Weights, value: number) => {
    playClick();
    setWeights((prev) => ({ ...prev, [key]: value }));
  };

  const handleSaveWeights = () => {
    playSubmit();
    try {
      localStorage.setItem('nexora_ai_weights', JSON.stringify(weights));
    } catch {
      // ignore
    }
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      playSuccess();
    }, 2000);
  };

  const handleResetWeights = () => {
    playClick();
    setWeights(DEFAULT_WEIGHTS);
    try {
      localStorage.removeItem('nexora_ai_weights');
    } catch {
      // ignore
    }
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto space-y-8">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 mb-2">
            <Settings className="w-3.5 h-3.5" />
            System Preferences
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
            Settings & Scoring Calibration
          </h1>
          <p className="text-sm text-slate-400">
            Configure multi-factor algorithmic scoring weights, manage Team Nexora, and adjust audio haptics.
          </p>
        </div>

        {savedSuccess && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold"
          >
            <CheckCircle2 className="w-4 h-4" />
            Settings Saved Successfully!
          </motion.div>
        )}
      </div>

      {/* ── Tabs Navigation ── */}
      <div className="flex items-center gap-2 border-b border-white/10 pb-3 overflow-x-auto no-scrollbar">
        {[
          { id: 'weights', label: 'AI Scoring Weights', icon: Sliders },
          { id: 'team', label: 'Team Nexora', icon: Users },
          { id: 'audio', label: 'Audio & Haptics', icon: Volume2 },
          { id: 'privacy', label: 'Privacy & Bias', icon: Shield },
          { id: 'api', label: 'Model API Keys', icon: Key },
        ].map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id as typeof activeTab); playClick(); }}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ── TAB 1: AI SCORING WEIGHTS ── */}
      {activeTab === 'weights' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 lg:grid-cols-3 gap-6"
        >
          <div
            className="lg:col-span-2 rounded-2xl p-6 space-y-6 relative overflow-hidden"
            style={{
              background: 'linear-gradient(145deg, rgba(20,18,40,0.8), rgba(12,10,28,0.9))',
              border: '1px solid rgba(255,255,255,0.06)',
            }}
          >
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-indigo-400" />
                  Deterministic Multi-Factor Scoring Formula
                </h2>
                <p className="text-xs text-slate-400">
                  Calibrate the 6 core pillars used to compute candidate match scores.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleResetWeights}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Reset
                </button>
                <button
                  onClick={handleSaveWeights}
                  className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 shadow-md transition-all"
                >
                  <Save className="w-3.5 h-3.5" />
                  Save Changes
                </button>
              </div>
            </div>

            {/* Total Balance Gauge */}
            <div className={`p-4 rounded-xl border flex items-center justify-between ${
              totalWeight === 100
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
            }`}>
              <div className="flex items-center gap-2 text-xs font-semibold">
                {totalWeight === 100 ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    Weight Distribution Balanced (100% Total)
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-4 h-4 text-amber-400" />
                    Weights sum to {totalWeight}%. Auto-normalization will scale to 100%.
                  </>
                )}
              </div>
              <span className="text-sm font-mono font-black">{totalWeight}%</span>
            </div>

            {/* Sliders */}
            <div className="space-y-5">
              {[
                { key: 'semantic', label: 'Semantic Fit (Vector Dense Match)', desc: 'SentenceTransformers all-MiniLM-L6-v2 cosine similarity against JD', color: '#6366f1' },
                { key: 'skills', label: 'Skill Match (Hard Competencies)', desc: 'Ontology matching of required tech stack & equivalents', color: '#8b5cf6' },
                { key: 'experience', label: 'Experience Relevance (Years & Seniority)', desc: 'Fit within target experience band (e.g. 5-9 years)', color: '#a855f7' },
                { key: 'impact', label: 'Project Impact (Telemetry & Numbers)', desc: 'Quantitative metrics, deployed architectures, and action verbs', color: '#00d4ff' },
                { key: 'behavioral', label: 'Behavioral & Culture Fit', desc: 'Tone, collaborative keywords, and culture alignment signals', color: '#10b981' },
                { key: 'activity', label: 'Activity & Response Signal', desc: 'Open-source commits, certifications, and recruiter response rates', color: '#f59e0b' },
              ].map((item) => (
                <div key={item.key} className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-white">{item.label}</span>
                      <p className="text-[11px] text-slate-400">{item.desc}</p>
                    </div>
                    <span className="font-mono font-bold text-indigo-300 text-sm ml-4">
                      {weights[item.key as keyof Weights]}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    step={5}
                    value={weights[item.key as keyof Weights]}
                    onChange={(e) => handleWeightChange(item.key as keyof Weights, Number(e.target.value))}
                    className="w-full accent-indigo-500 h-2 bg-white/10 rounded-lg cursor-pointer"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Formula Preview Box */}
          <div
            className="rounded-2xl p-6 space-y-6 flex flex-col justify-between"
            style={{
              background: 'linear-gradient(145deg, rgba(20,18,40,0.8), rgba(12,10,28,0.9))',
              border: '1px solid rgba(255,255,255,0.06)',
            }}
          >
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-2">
                <Sparkles className="w-4 h-4 text-purple-400" />
                Live Scoring Equation
              </h3>
              <p className="text-xs text-slate-400 mb-4">
                The calculated score per applicant will evaluate:
              </p>

              <div className="p-4 rounded-xl bg-[#090718] border border-white/10 font-mono text-[11px] text-indigo-300 space-y-2 leading-relaxed">
                <div>Score =</div>
                <div className="pl-3 text-indigo-200">
                  + {weights.semantic}% × SemanticFit<br />
                  + {weights.skills}% × SkillMatch<br />
                  + {weights.experience}% × ExperienceFit<br />
                  + {weights.impact}% × ProjectImpact<br />
                  + {weights.behavioral}% × BehavioralFit<br />
                  + {weights.activity}% × ActivitySignal
                </div>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-xs text-indigo-300/80 leading-relaxed">
              <span className="font-bold text-indigo-200 block mb-1">💡 Pro Tip</span>
              For highly technical roles like Senior AI Engineers, prioritize Semantic Fit (35%) and Skill Match (25%) to filter keyword stuffers effectively.
            </div>
          </div>
        </motion.div>
      )}

      {/* ── TAB 2: TEAM NEXORA ── */}
      {activeTab === 'team' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <div
            className="rounded-2xl p-6 relative overflow-hidden"
            style={{
              background: 'linear-gradient(145deg, rgba(20,18,40,0.8), rgba(12,10,28,0.9))',
              border: '1px solid rgba(255,255,255,0.06)',
            }}
          >
            <div className="flex items-center gap-4 mb-6">
              <div className="w-14 h-14 rounded-2xl overflow-hidden border border-white/10 bg-white/5 p-1 flex-shrink-0 flex items-center justify-center shadow-lg shadow-indigo-500/20 relative">
                <Image src="/nexora-logo.png" alt="Nexora" width={56} height={56} className="w-full h-full object-contain rounded-lg" />
              </div>
              <div>
                <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
                  Team Nexora
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    Active Team
                  </span>
                </h2>
                <p className="text-xs text-slate-400">
                  RecruitAI Enterprise AI Recruiter Intelligence System
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              {/* Member 1 */}
              <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center font-bold text-sm text-indigo-200">
                    RK
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300">
                    Leader
                  </span>
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Ranjeet Kumar</h4>
                  <p className="text-xs text-indigo-300/80">Team Leader & AI Architect</p>
                  <p className="text-[11px] text-slate-400 font-mono mt-1">rajranjeet7680@gmail.com</p>
                </div>
              </div>

              {/* Member 2 */}
              <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-purple-600/30 border border-purple-500/40 flex items-center justify-center font-bold text-sm text-purple-200">
                    GS
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/20 border border-purple-500/40 text-purple-300">
                    Member
                  </span>
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">GLS Santhosh</h4>
                  <p className="text-xs text-purple-300/80">AI Engineer & Data Scientist</p>
                  <p className="text-[11px] text-slate-400 font-mono mt-1">glssanthosh1306@gmail.com</p>
                </div>
              </div>

              {/* Member 3 */}
              <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-amber-600/30 border border-amber-500/40 flex items-center justify-center font-bold text-sm text-amber-200">
                    AK
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300">
                    Member
                  </span>
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Abhishek Kantharia</h4>
                  <p className="text-xs text-amber-300/80">Full-Stack & Systems Engineer</p>
                  <p className="text-[11px] text-slate-400 font-mono mt-1">abhishek11111997@gmail.com</p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* ── TAB 3: AUDIO & HAPTICS ── */}
      {activeTab === 'audio' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl p-6 space-y-6 max-w-2xl"
          style={{
            background: 'linear-gradient(145deg, rgba(20,18,40,0.8), rgba(12,10,28,0.9))',
            border: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Volume2 className="w-4 h-4 text-indigo-400" />
              Synthesized Web Audio Sound System
            </h2>
            <p className="text-xs text-slate-400">
              Control UI feedback synthesized in real-time via the Web Audio API.
            </p>
          </div>

          <div className="flex items-center justify-between py-3 border-b border-white/5">
            <div>
              <div className="text-sm font-semibold text-white">Enable Interface Sounds</div>
              <p className="text-xs text-slate-400">Plays subtle synthesizer ticks, pops, and match chimes</p>
            </div>
            <button
              onClick={() => {
                const next = !soundEnabled;
                setSoundEnabled(next);
                try {
                  localStorage.setItem('talentmind_sound_muted', String(!next));
                } catch {
                  // ignore
                }
                if (next) playSuccess();
              }}
              className={`w-12 h-6 rounded-full p-1 transition-colors ${soundEnabled ? 'bg-indigo-600' : 'bg-slate-700'}`}
            >
              <div className={`w-4 h-4 rounded-full bg-white transition-transform ${soundEnabled ? 'translate-x-6' : 'translate-x-0'}`} />
            </button>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-white">Master Feedback Volume</span>
              <span className="font-mono text-indigo-300">{soundVolume}%</span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              value={soundVolume}
              onChange={(e) => {
                setSoundVolume(Number(e.target.value));
                playClick();
              }}
              className="w-full accent-indigo-500 h-2 bg-white/10 rounded-lg cursor-pointer"
            />
          </div>
        </motion.div>
      )}

      {/* ── TAB 4: PRIVACY & BIAS ── */}
      {activeTab === 'privacy' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl p-6 space-y-6 max-w-2xl"
          style={{
            background: 'linear-gradient(145deg, rgba(20,18,40,0.8), rgba(12,10,28,0.9))',
            border: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Shield className="w-4 h-4 text-emerald-400" />
              Demographic Bias Reduction & GDPR Masking
            </h2>
            <p className="text-xs text-slate-400">
              Ensure fair candidate evaluation free of unconscious gender, ethnic, or age bias.
            </p>
          </div>

          <div className="flex items-center justify-between py-3 border-b border-white/5">
            <div>
              <div className="text-sm font-semibold text-white">Default Bias Reduction (Masking)</div>
              <p className="text-xs text-slate-400">Automatically hide candidate names, photos, emails, and ages</p>
            </div>
            <button
              onClick={() => {
                setBiasReductionDefault(!biasReductionDefault);
                playClick();
              }}
              className={`w-12 h-6 rounded-full p-1 transition-colors ${biasReductionDefault ? 'bg-emerald-600' : 'bg-slate-700'}`}
            >
              <div className={`w-4 h-4 rounded-full bg-white transition-transform ${biasReductionDefault ? 'translate-x-6' : 'translate-x-0'}`} />
            </button>
          </div>

          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300/80 leading-relaxed">
            <span className="font-bold text-emerald-200 block mb-1">🛡️ Equal Opportunity Hiring</span>
            When active, all candidate scoring occurs exclusively on demonstrated skills, project telemetry, and domain relevance before personal identity is revealed to hiring managers.
          </div>
        </motion.div>
      )}

      {/* ── TAB 5: MODEL API KEYS ── */}
      {activeTab === 'api' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl p-6 space-y-6 max-w-2xl"
          style={{
            background: 'linear-gradient(145deg, rgba(20,18,40,0.8), rgba(12,10,28,0.9))',
            border: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Key className="w-4 h-4 text-amber-400" />
              AI Model & Inference Keys
            </h2>
            <p className="text-xs text-slate-400">
              Configure Google Gemini API key or use built-in local heuristic inference engine.
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-300">Google Gemini API Key (Optional)</label>
            <input
              type="password"
              value={geminiKey}
              onChange={(e) => setGeminiKey(e.target.value)}
              placeholder="AIzaSy..."
              className="w-full px-4 py-2.5 rounded-xl bg-[#0b091a] border border-white/10 text-white text-sm focus:outline-none focus:border-indigo-500"
            />
            <p className="text-[11px] text-slate-500">
              If left blank, the system automatically uses deterministic local FAISS + SentenceTransformers embeddings.
            </p>
          </div>

          <button
            onClick={() => {
              playSubmit();
              alert('API preferences saved locally!');
            }}
            className="flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 transition-all"
          >
            <Save className="w-3.5 h-3.5" />
            Save Key
          </button>
        </motion.div>
      )}
    </div>
  );
}
