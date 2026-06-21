/**
 * TalentMind AI — Rich Sound System
 * All sounds are synthesized via Web Audio API (no external files needed)
 * ADSR envelopes + oscillator layering for premium feel
 */

type AudioEnv = { attack?: number; decay?: number; sustain?: number; release?: number };

function createAudioCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  try {
    const Ctx = window.AudioContext || (window as any).webkitAudioContext;
    return Ctx ? new Ctx() : null;
  } catch {
    return null;
  }
}

function applyADSR(
  gainNode: GainNode,
  ctx: AudioContext,
  { attack = 0.01, decay = 0.1, sustain = 0.5, release = 0.3 }: AudioEnv,
  peak = 0.3
) {
  const t = ctx.currentTime;
  gainNode.gain.setValueAtTime(0, t);
  gainNode.gain.linearRampToValueAtTime(peak, t + attack);
  gainNode.gain.linearRampToValueAtTime(peak * sustain, t + attack + decay);
  gainNode.gain.setValueAtTime(peak * sustain, t + attack + decay);
  gainNode.gain.linearRampToValueAtTime(0.0001, t + attack + decay + release);
}

/** Short bright pop — hover/select interactions */
export const playPop = () => {
  const ctx = createAudioCtx();
  if (!ctx) return;
  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1320, ctx.currentTime + 0.04);
    applyADSR(gain, ctx, { attack: 0.005, decay: 0.05, sustain: 0, release: 0.05 }, 0.18);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.12);
  } catch (e) { /* silent fail */ }
};

/** Generic UI button click */
export const playClick = () => {
  const ctx = createAudioCtx();
  if (!ctx) return;
  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(440, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(660, ctx.currentTime + 0.03);
    applyADSR(gain, ctx, { attack: 0.003, decay: 0.03, sustain: 0, release: 0.04 }, 0.12);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.08);
  } catch (e) { /* silent fail */ }
};

/** 3-note ascending arpeggio — dashboard load / success */
export const playSuccess = () => {
  const ctx = createAudioCtx();
  if (!ctx) return;
  try {
    const notes = [523.25, 659.25, 783.99]; // C5, E5, G5
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.1);
      const t = ctx.currentTime + i * 0.1;
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.14, t + 0.015);
      gain.gain.linearRampToValueAtTime(0.08, t + 0.06);
      gain.gain.linearRampToValueAtTime(0.0001, t + 0.22);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.25);
    });
  } catch (e) { /* silent fail */ }
};

/** Soft bell chime — new AI message received */
export const playChime = () => {
  const ctx = createAudioCtx();
  if (!ctx) return;
  try {
    // Two-partial bell synthesis
    [523.25, 1046.5].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      const peak = i === 0 ? 0.15 : 0.08;
      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(peak, ctx.currentTime + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.6);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.65);
    });
  } catch (e) { /* silent fail */ }
};

/** Phone ring pattern — interview join */
export const playRing = () => {
  const ctx = createAudioCtx();
  if (!ctx) return;
  try {
    // Two quick beeps
    [0, 0.35].forEach((offset) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, ctx.currentTime + offset);
      osc.frequency.setValueAtTime(880, ctx.currentTime + offset + 0.15);
      gain.gain.setValueAtTime(0, ctx.currentTime + offset);
      gain.gain.linearRampToValueAtTime(0.22, ctx.currentTime + offset + 0.01);
      gain.gain.setValueAtTime(0.22, ctx.currentTime + offset + 0.14);
      gain.gain.linearRampToValueAtTime(0.0001, ctx.currentTime + offset + 0.28);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + offset);
      osc.stop(ctx.currentTime + offset + 0.3);
    });
  } catch (e) { /* silent fail */ }
};

/** Low descending tone — error / warning */
export const playError = () => {
  const ctx = createAudioCtx();
  if (!ctx) return;
  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(400, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.25);
    applyADSR(gain, ctx, { attack: 0.01, decay: 0.1, sustain: 0.3, release: 0.15 }, 0.15);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.4);
  } catch (e) { /* silent fail */ }
};

/** Soft notification — new activity item */
export const playNotify = () => {
  const ctx = createAudioCtx();
  if (!ctx) return;
  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(698.46, ctx.currentTime); // F5
    osc.frequency.setValueAtTime(880, ctx.currentTime + 0.08); // A5
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.12, ctx.currentTime + 0.01);
    gain.gain.linearRampToValueAtTime(0.0001, ctx.currentTime + 0.3);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.32);
  } catch (e) { /* silent fail */ }
};
