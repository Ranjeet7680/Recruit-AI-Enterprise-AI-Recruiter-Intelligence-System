/**
 * TalentMind AI — Complete Sound System v2
 * All sounds synthesized via Web Audio API — zero external files.
 * ADSR envelopes · Oscillator layering · Noise · Reverb · Filtering
 *
 * Sounds:
 *   playClick()      — generic button click
 *   playPop()        — hover / card select
 *   playSuccess()    — dashboard load / 3-note arpeggio
 *   playChime()      — AI message / new suggestion
 *   playRing()       — interview call joining
 *   playError()      — error / warning
 *   playNotify()     — activity feed notification
 *   playShortlist()  — candidate shortlisted (uplifting)
 *   playToggle()     — switch/toggle flip
 *   playSlider()     — slider drag tick
 *   playTab()        — tab switch
 *   playNav()        — sidebar/bottom nav navigation
 *   playFilter()     — filter chip activated
 *   playSubmit()     — form / scorecard submit
 *   playDelete()     — remove / reject action
 *   playSwipe()      — swipe / card dismiss
 *   playTyping()     — text input keystroke (subtle)
 *   playSearch()     — search activated
 *   playGem()        — AI gem candidate revealed
 *   playEndCall()    — end call (descending)
 *   playMute()       — mic mute toggle
 *   playRecord()     — recording start
 *   playCountUp()    — stat counter tick
 *   playWhoosh()     — page transition
 *   playLevel()      — score ring complete
 */

type AudioEnv = { attack?: number; decay?: number; sustain?: number; release?: number };

/* ─── Shared singleton AudioContext ─── */
let _ctx: AudioContext | null = null;
let _enabled = true;

function getCtx(): AudioContext | null {
  if (typeof window === 'undefined' || !_enabled) return null;
  try {
    if (!_ctx || _ctx.state === 'closed') {
      const Ctx = window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      _ctx = Ctx ? new Ctx() : null;
    }
    if (_ctx?.state === 'suspended') _ctx.resume();
    return _ctx;
  } catch { return null; }
}

/** Globally mute / unmute all sounds */
export const setSoundEnabled = (v: boolean) => { _enabled = v; };
export const isSoundEnabled = () => _enabled;

/* ─── ADSR helper ─── */
function adsr(
  gainNode: GainNode,
  ctx: AudioContext,
  { attack = 0.01, decay = 0.1, sustain = 0.5, release = 0.3 }: AudioEnv,
  peak = 0.3
) {
  const t = ctx.currentTime;
  gainNode.gain.setValueAtTime(0.0001, t);
  gainNode.gain.linearRampToValueAtTime(peak, t + attack);
  gainNode.gain.linearRampToValueAtTime(peak * sustain, t + attack + decay);
  gainNode.gain.setValueAtTime(peak * sustain, t + attack + decay);
  gainNode.gain.linearRampToValueAtTime(0.0001, t + attack + decay + release);
}

/* ─── Reverb helper (simple convolver from impulse) ─── */
function makeReverb(ctx: AudioContext, duration = 0.4, decay = 2): ConvolverNode {
  const sampleRate = ctx.sampleRate;
  const length = sampleRate * duration;
  const impulse = ctx.createBuffer(2, length, sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const data = impulse.getChannelData(ch);
    for (let i = 0; i < length; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, decay);
    }
  }
  const conv = ctx.createConvolver();
  conv.buffer = impulse;
  return conv;
}

/* ─── Low-pass filter helper ─── */
function makeLPF(ctx: AudioContext, freq: number, Q = 1): BiquadFilterNode {
  const f = ctx.createBiquadFilter();
  f.type = 'lowpass';
  f.frequency.value = freq;
  f.Q.value = Q;
  return f;
}

/* ══════════════════════════════════════════
   EXISTING SOUNDS (improved)
══════════════════════════════════════════ */

/** Short bright pop — hover/card enter */
export const playPop = () => {
  const ctx = getCtx(); if (!ctx) return;
  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(900, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1400, ctx.currentTime + 0.04);
    adsr(gain, ctx, { attack: 0.004, decay: 0.04, sustain: 0, release: 0.04 }, 0.14);
    osc.connect(gain); gain.connect(ctx.destination);
    osc.start(); osc.stop(ctx.currentTime + 0.1);
  } catch { /* silent */ }
};

/** Generic UI button click — clean tick */
export const playClick = () => {
  const ctx = getCtx(); if (!ctx) return;
  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(480, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(720, ctx.currentTime + 0.025);
    adsr(gain, ctx, { attack: 0.002, decay: 0.025, sustain: 0, release: 0.035 }, 0.1);
    osc.connect(gain); gain.connect(ctx.destination);
    osc.start(); osc.stop(ctx.currentTime + 0.07);
  } catch { /* silent */ }
};

/** 3-note ascending arpeggio — dashboard load / action success */
export const playSuccess = () => {
  const ctx = getCtx(); if (!ctx) return;
  try {
    const notes = [523.25, 659.25, 783.99]; // C5 E5 G5
    const rev = makeReverb(ctx, 0.5, 3);
    rev.connect(ctx.destination);
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.1);
      const t = ctx.currentTime + i * 0.1;
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.12, t + 0.012);
      gain.gain.linearRampToValueAtTime(0.07, t + 0.06);
      gain.gain.linearRampToValueAtTime(0.0001, t + 0.22);
      osc.connect(gain);
      gain.connect(ctx.destination);
      gain.connect(rev);
      osc.start(t); osc.stop(t + 0.28);
    });
  } catch { /* silent */ }
};

/** Soft bell chime — new AI message / copilot notification */
export const playChime = () => {
  const ctx = getCtx(); if (!ctx) return;
  try {
    const rev = makeReverb(ctx, 0.8, 2);
    rev.connect(ctx.destination);
    [523.25, 1046.5, 1318.5].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.04);
      const t = ctx.currentTime + i * 0.04;
      const peak = i === 0 ? 0.14 : 0.07;
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(peak, t + 0.008);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.7);
      osc.connect(gain);
      gain.connect(ctx.destination);
      gain.connect(rev);
      osc.start(t); osc.stop(t + 0.75);
    });
  } catch { /* silent */ }
};

/** Phone ring pattern — interview call joining */
export const playRing = () => {
  const ctx = getCtx(); if (!ctx) return;
  try {
    [0, 0.38].forEach((offset) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, ctx.currentTime + offset);
      osc.frequency.setValueAtTime(880, ctx.currentTime + offset + 0.14);
      gain.gain.setValueAtTime(0, ctx.currentTime + offset);
      gain.gain.linearRampToValueAtTime(0.2, ctx.currentTime + offset + 0.01);
      gain.gain.setValueAtTime(0.2, ctx.currentTime + offset + 0.13);
      gain.gain.linearRampToValueAtTime(0.0001, ctx.currentTime + offset + 0.3);
      osc.connect(gain); gain.connect(ctx.destination);
      osc.start(ctx.currentTime + offset);
      osc.stop(ctx.currentTime + offset + 0.32);
    });
  } catch { /* silent */ }
};

/** Low descending — error / warning */
export const playError = () => {
  const ctx = getCtx(); if (!ctx) return;
  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const lpf = makeLPF(ctx, 800);
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(380, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(180, ctx.currentTime + 0.28);
    adsr(gain, ctx, { attack: 0.01, decay: 0.12, sustain: 0.3, release: 0.18 }, 0.14);
    osc.connect(lpf); lpf.connect(gain); gain.connect(ctx.destination);
    osc.start(); osc.stop(ctx.currentTime + 0.45);
  } catch { /* silent */ }
};

/** Soft notification — activity feed */
export const playNotify = () => {
  const ctx = getCtx(); if (!ctx) return;
  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(698.46, ctx.currentTime);
    osc.frequency.setValueAtTime(880, ctx.currentTime + 0.09);
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.1, ctx.currentTime + 0.01);
    gain.gain.linearRampToValueAtTime(0.0001, ctx.currentTime + 0.28);
    osc.connect(gain); gain.connect(ctx.destination);
    osc.start(); osc.stop(ctx.currentTime + 0.3);
  } catch { /* silent */ }
};

/* ══════════════════════════════════════════
   NEW SOUNDS
══════════════════════════════════════════ */

/** Uplifting 4-note sparkle — shortlist candidate */
export const playShortlist = () => {
  const ctx = getCtx(); if (!ctx) return;
  try {
    const notes = [659.25, 783.99, 1046.5, 1318.51]; // E5 G5 C6 E6
    const rev = makeReverb(ctx, 0.6, 2.5);
    rev.connect(ctx.destination);
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = i % 2 === 0 ? 'sine' : 'triangle';
      const t = ctx.currentTime + i * 0.07;
      osc.frequency.setValueAtTime(freq, t);
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(0.1, t + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.35);
      osc.connect(g); g.connect(ctx.destination); g.connect(rev);
      osc.start(t); osc.stop(t + 0.4);
    });
  } catch { /* silent */ }
};

/** Crisp biphasic click — toggle / switch */
export const playToggle = () => {
  const ctx = getCtx(); if (!ctx) return;
  try {
    [0, 0.04].forEach((offset, i) => {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = 'square';
      const t = ctx.currentTime + offset;
      osc.frequency.setValueAtTime(i === 0 ? 600 : 900, t);
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(0.06, t + 0.003);
      g.gain.linearRampToValueAtTime(0.0001, t + 0.035);
      const lpf = makeLPF(ctx, 2000);
      osc.connect(lpf); lpf.connect(g); g.connect(ctx.destination);
      osc.start(t); osc.stop(t + 0.04);
    });
  } catch { /* silent */ }
};

/** Tiny high tick — slider drag */
export const playSlider = () => {
  const ctx = getCtx(); if (!ctx) return;
  try {
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1200, ctx.currentTime);
    g.gain.setValueAtTime(0, ctx.currentTime);
    g.gain.linearRampToValueAtTime(0.05, ctx.currentTime + 0.002);
    g.gain.linearRampToValueAtTime(0.0001, ctx.currentTime + 0.025);
    osc.connect(g); g.connect(ctx.destination);
    osc.start(); osc.stop(ctx.currentTime + 0.03);
  } catch { /* silent */ }
};

/** Soft lateral click — tab switch */
export const playTab = () => {
  const ctx = getCtx(); if (!ctx) return;
  try {
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(550, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(750, ctx.currentTime + 0.03);
    adsr(g, ctx, { attack: 0.003, decay: 0.03, sustain: 0, release: 0.04 }, 0.09);
    osc.connect(g); g.connect(ctx.destination);
    osc.start(); osc.stop(ctx.currentTime + 0.08);
  } catch { /* silent */ }
};

/** Quick whoosh tick — navigation between pages */
export const playNav = () => {
  const ctx = getCtx(); if (!ctx) return;
  try {
    // Noise burst + pitched tone
    const bufferSize = ctx.sampleRate * 0.06;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    const lpf = makeLPF(ctx, 1800);
    const ng = ctx.createGain();
    ng.gain.setValueAtTime(0.07, ctx.currentTime);
    ng.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.07);
    noise.connect(lpf); lpf.connect(ng); ng.connect(ctx.destination);
    noise.start(); noise.stop(ctx.currentTime + 0.07);

    const osc = ctx.createOscillator();
    const og = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(300, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + 0.06);
    adsr(og, ctx, { attack: 0.005, decay: 0.05, sustain: 0, release: 0.03 }, 0.08);
    osc.connect(og); og.connect(ctx.destination);
    osc.start(); osc.stop(ctx.currentTime + 0.1);
  } catch { /* silent */ }
};

/** Soft blip — filter chip activated */
export const playFilter = () => {
  const ctx = getCtx(); if (!ctx) return;
  try {
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(660, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(990, ctx.currentTime + 0.05);
    adsr(g, ctx, { attack: 0.003, decay: 0.04, sustain: 0.1, release: 0.06 }, 0.1);
    osc.connect(g); g.connect(ctx.destination);
    osc.start(); osc.stop(ctx.currentTime + 0.12);
  } catch { /* silent */ }
};

/** Rising confirmation tone — form / scorecard submit */
export const playSubmit = () => {
  const ctx = getCtx(); if (!ctx) return;
  try {
    const notes = [440, 554.37, 659.25, 880]; // A4 C#5 E5 A5
    const rev = makeReverb(ctx, 0.5, 2);
    rev.connect(ctx.destination);
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = 'sine';
      const t = ctx.currentTime + i * 0.09;
      osc.frequency.setValueAtTime(freq, t);
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(0.11, t + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.28);
      osc.connect(g); g.connect(ctx.destination); g.connect(rev);
      osc.start(t); osc.stop(t + 0.32);
    });
  } catch { /* silent */ }
};

/** Low descending blip — delete / reject action */
export const playDelete = () => {
  const ctx = getCtx(); if (!ctx) return;
  try {
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(440, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(220, ctx.currentTime + 0.12);
    adsr(g, ctx, { attack: 0.005, decay: 0.1, sustain: 0, release: 0.08 }, 0.12);
    osc.connect(g); g.connect(ctx.destination);
    osc.start(); osc.stop(ctx.currentTime + 0.22);
  } catch { /* silent */ }
};

/** Swipe/dismiss whoosh — card swipe */
export const playSwipe = () => {
  const ctx = getCtx(); if (!ctx) return;
  try {
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.14);
    adsr(g, ctx, { attack: 0.003, decay: 0.12, sustain: 0, release: 0.04 }, 0.1);
    osc.connect(g); g.connect(ctx.destination);
    osc.start(); osc.stop(ctx.currentTime + 0.18);
  } catch { /* silent */ }
};

/** Ultra-subtle key tick — text input keystroke */
export const playTyping = () => {
  const ctx = getCtx(); if (!ctx) return;
  try {
    const bufferSize = ctx.sampleRate * 0.015;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    const lpf = makeLPF(ctx, 3000);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.04, ctx.currentTime);
    source.connect(lpf); lpf.connect(g); g.connect(ctx.destination);
    source.start(); source.stop(ctx.currentTime + 0.02);
  } catch { /* silent */ }
};

/** Rising focus tone — search bar activated */
export const playSearch = () => {
  const ctx = getCtx(); if (!ctx) return;
  try {
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(440, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.08);
    adsr(g, ctx, { attack: 0.005, decay: 0.06, sustain: 0.2, release: 0.1 }, 0.1);
    osc.connect(g); g.connect(ctx.destination);
    osc.start(); osc.stop(ctx.currentTime + 0.2);
  } catch { /* silent */ }
};

/** Magical sparkle arpeggio — AI gem candidate discovered */
export const playGem = () => {
  const ctx = getCtx(); if (!ctx) return;
  try {
    const notes = [523.25, 659.25, 783.99, 1046.5, 1318.51, 1567.98]; // C E G C E G
    const rev = makeReverb(ctx, 1, 2);
    rev.connect(ctx.destination);
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = i % 2 === 0 ? 'sine' : 'triangle';
      const t = ctx.currentTime + i * 0.06;
      osc.frequency.setValueAtTime(freq, t);
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(0.09, t + 0.008);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.5);
      osc.connect(g); g.connect(ctx.destination); g.connect(rev);
      osc.start(t); osc.stop(t + 0.55);
    });
  } catch { /* silent */ }
};

/** Descending tone — end call */
export const playEndCall = () => {
  const ctx = getCtx(); if (!ctx) return;
  try {
    [0, 0.12, 0.24].forEach((offset, i) => {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = 'sine';
      const t = ctx.currentTime + offset;
      const freqs = [880, 660, 440];
      osc.frequency.setValueAtTime(freqs[i], t);
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(0.16, t + 0.01);
      g.gain.linearRampToValueAtTime(0.0001, t + 0.1);
      osc.connect(g); g.connect(ctx.destination);
      osc.start(t); osc.stop(t + 0.12);
    });
  } catch { /* silent */ }
};

/** Low thud — mic mute */
export const playMute = () => {
  const ctx = getCtx(); if (!ctx) return;
  try {
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    const lpf = makeLPF(ctx, 600);
    osc.type = 'square';
    osc.frequency.setValueAtTime(200, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.08);
    adsr(g, ctx, { attack: 0.003, decay: 0.06, sustain: 0, release: 0.06 }, 0.1);
    osc.connect(lpf); lpf.connect(g); g.connect(ctx.destination);
    osc.start(); osc.stop(ctx.currentTime + 0.14);
  } catch { /* silent */ }
};

/** Rising pulse — recording start */
export const playRecord = () => {
  const ctx = getCtx(); if (!ctx) return;
  try {
    [0, 0.15].forEach((offset) => {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = 'sine';
      const t = ctx.currentTime + offset;
      osc.frequency.setValueAtTime(660, t);
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(0.14, t + 0.01);
      g.gain.linearRampToValueAtTime(0.0001, t + 0.12);
      osc.connect(g); g.connect(ctx.destination);
      osc.start(t); osc.stop(t + 0.14);
    });
  } catch { /* silent */ }
};

/** Ultra-quiet tick — stat counter incrementing */
export const playCountUp = () => {
  const ctx = getCtx(); if (!ctx) return;
  try {
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1600, ctx.currentTime);
    g.gain.setValueAtTime(0, ctx.currentTime);
    g.gain.linearRampToValueAtTime(0.025, ctx.currentTime + 0.001);
    g.gain.linearRampToValueAtTime(0.0001, ctx.currentTime + 0.015);
    osc.connect(g); g.connect(ctx.destination);
    osc.start(); osc.stop(ctx.currentTime + 0.018);
  } catch { /* silent */ }
};

/** Soft air whoosh — page/screen transition */
export const playWhoosh = () => {
  const ctx = getCtx(); if (!ctx) return;
  try {
    const bufferSize = ctx.sampleRate * 0.2;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      const env = Math.sin((i / bufferSize) * Math.PI);
      data[i] = (Math.random() * 2 - 1) * env;
    }
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    const lpf = ctx.createBiquadFilter();
    lpf.type = 'bandpass';
    lpf.frequency.setValueAtTime(400, ctx.currentTime);
    lpf.frequency.exponentialRampToValueAtTime(3000, ctx.currentTime + 0.12);
    lpf.Q.value = 0.5;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.12, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.2);
    source.connect(lpf); lpf.connect(g); g.connect(ctx.destination);
    source.start(); source.stop(ctx.currentTime + 0.22);
  } catch { /* silent */ }
};

/** Satisfying ring complete — score ring finishes animating */
export const playLevel = () => {
  const ctx = getCtx(); if (!ctx) return;
  try {
    const rev = makeReverb(ctx, 0.4, 2.5);
    rev.connect(ctx.destination);
    // Two oscillators for richness
    [[880, 1108.73], [1320, 1661.2]].forEach(([f1, f2], layer) => {
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const g = ctx.createGain();
      osc1.type = 'sine'; osc2.type = 'triangle';
      osc1.frequency.setValueAtTime(f1, ctx.currentTime);
      osc2.frequency.setValueAtTime(f2, ctx.currentTime + 0.1);
      const peak = layer === 0 ? 0.1 : 0.06;
      g.gain.setValueAtTime(0, ctx.currentTime);
      g.gain.linearRampToValueAtTime(peak, ctx.currentTime + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.5);
      osc1.connect(g); osc2.connect(g);
      g.connect(ctx.destination); g.connect(rev);
      osc1.start(); osc1.stop(ctx.currentTime + 0.55);
      osc2.start(ctx.currentTime + 0.1); osc2.stop(ctx.currentTime + 0.55);
    });
  } catch { /* silent */ }
};

/** Sound settings storage */
export const saveSoundPreference = (enabled: boolean) => {
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem('talentmind_sound', enabled ? '1' : '0');
  }
};

export const loadSoundPreference = (): boolean => {
  if (typeof localStorage !== 'undefined') {
    const v = localStorage.getItem('talentmind_sound');
    return v === null ? true : v === '1';
  }
  return true;
};
