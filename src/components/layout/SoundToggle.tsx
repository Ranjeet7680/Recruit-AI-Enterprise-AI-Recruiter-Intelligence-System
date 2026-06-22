'use client';

/**
 * SoundToggle — Floating sound on/off button (bottom-left)
 * Persists preference to localStorage. Reads initial state on mount.
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Volume2, VolumeX } from 'lucide-react';
import { setSoundEnabled, loadSoundPreference, saveSoundPreference, playToggle } from '@/lib/sounds';

export function SoundToggle() {
  const [enabled, setEnabled] = useState(true);
  const [showLabel, setShowLabel] = useState(false);

  useEffect(() => {
    const pref = loadSoundPreference();
    setSoundEnabled(pref);
    requestAnimationFrame(() => {
      setEnabled(pref);
    });
  }, []);

  const toggle = () => {
    const next = !enabled;
    setEnabled(next);
    setSoundEnabled(next);
    saveSoundPreference(next);
    if (next) {
      // Small delay so the new state is active before playing
      setTimeout(playToggle, 10);
    }
    setShowLabel(true);
    setTimeout(() => setShowLabel(false), 2000);
  };

  return (
    <div
      className="fixed left-4 z-50 flex items-center gap-2"
      style={{ bottom: 'calc(var(--bottom-nav-height) + 16px + env(safe-area-inset-bottom))' }}
    >
      {/* Floating label */}
      <AnimatePresence>
        {showLabel && (
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            className="text-xs font-semibold px-2.5 py-1.5 rounded-xl whitespace-nowrap"
            style={{
              background: 'rgba(8,6,20,0.9)',
              border: '1px solid rgba(255,255,255,0.08)',
              color: enabled ? '#6ee7b7' : '#94a3b8',
              backdropFilter: 'blur(12px)',
            }}
          >
            Sound {enabled ? 'ON 🔊' : 'OFF 🔇'}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toggle button */}
      <motion.button
        onClick={toggle}
        whileTap={{ scale: 0.88 }}
        whileHover={{ scale: 1.08 }}
        className="w-10 h-10 rounded-2xl flex items-center justify-center transition-all relative overflow-hidden"
        style={{
          background: enabled ? 'rgba(99,102,241,0.15)' : 'rgba(255,255,255,0.05)',
          border: `1px solid ${enabled ? 'rgba(99,102,241,0.35)' : 'rgba(255,255,255,0.08)'}`,
          boxShadow: enabled ? '0 0 16px rgba(99,102,241,0.2)' : 'none',
          backdropFilter: 'blur(12px)',
        }}
        title={enabled ? 'Mute all sounds' : 'Enable sounds'}
      >
        {/* Pulse ring when enabled */}
        {enabled && (
          <motion.div
            className="absolute inset-0 rounded-2xl"
            style={{ border: '1px solid rgba(99,102,241,0.4)' }}
            animate={{ scale: [1, 1.3], opacity: [0.5, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeOut' }}
          />
        )}

        <AnimatePresence mode="wait">
          <motion.div
            key={enabled ? 'on' : 'off'}
            initial={{ scale: 0, rotate: -90 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0, rotate: 90 }}
            transition={{ duration: 0.2 }}
          >
            {enabled
              ? <Volume2 className="w-4.5 h-4.5 text-indigo-400" />
              : <VolumeX className="w-4.5 h-4.5 text-slate-500" />
            }
          </motion.div>
        </AnimatePresence>
      </motion.button>
    </div>
  );
}
