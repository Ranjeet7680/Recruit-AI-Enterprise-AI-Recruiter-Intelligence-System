/* =========================================
   NexCall — App JavaScript
   Interactions, Navigation & Animations
   ========================================= */

'use strict';

// ── Screen Navigation ─────────────────────
const screens = ['screen-prejoin', 'screen-call', 'screen-effects', 'screen-more'];
let currentScreen = 0;
let callTimerInterval = null;
let callSeconds = 0;

function showScreen(index, direction = 1) {
  const allScreens = document.querySelectorAll('.screen');
  const allDots = document.querySelectorAll('.nav-dot');
  const allLabels = document.querySelectorAll('.nav-labels span');

  allScreens.forEach((s, i) => {
    s.classList.remove('active');
    s.style.transform = i === index ? 'translateX(0)' : `translateX(${(i - index) * 30}px)`;
    s.style.opacity = '0';
    s.style.pointerEvents = 'none';
  });

  allDots.forEach((d, i) => d.classList.toggle('active', i === index));
  allLabels.forEach((l, i) => {
    l.style.color = i === index ? 'rgba(240,244,255,0.9)' : 'rgba(240,244,255,0.35)';
    l.style.fontWeight = i === index ? '600' : '400';
  });

  const targetScreen = allScreens[index];
  targetScreen.classList.add('active');
  targetScreen.style.opacity = '1';
  targetScreen.style.transform = 'translateX(0)';
  targetScreen.style.pointerEvents = 'all';

  currentScreen = index;

  if (index === 1) {
    startCallTimer();
  } else {
    if (callTimerInterval && index !== 1) {
      // keep timer running when not on call screen
    }
  }
}

// ── Nav Dot Clicks ────────────────────────
document.querySelectorAll('.nav-dot').forEach((dot, i) => {
  dot.addEventListener('click', () => showScreen(i));
});

// ── Call Timer ────────────────────────────
function startCallTimer() {
  if (callTimerInterval) return;
  const timerEl = document.getElementById('callTimer');
  callTimerInterval = setInterval(() => {
    callSeconds++;
    const m = String(Math.floor(callSeconds / 60)).padStart(2, '0');
    const s = String(callSeconds % 60).padStart(2, '0');
    if (timerEl) timerEl.textContent = `${m}:${s}`;
  }, 1000);
}

// ── Pre-Join Screen ───────────────────────
document.getElementById('btn-join').addEventListener('click', () => {
  showScreen(1);
});

document.getElementById('btn-effects').addEventListener('click', () => {
  showScreen(2);
});

// ── Active Call Screen ────────────────────
document.getElementById('btn-back-call').addEventListener('click', () => {
  showScreen(0);
});

document.getElementById('btn-effects-call').addEventListener('click', () => {
  showScreen(2);
});

document.getElementById('btn-more-call').addEventListener('click', () => {
  showScreen(3);
});

document.getElementById('btn-end-call').addEventListener('click', () => {
  // End call animation
  const callScreen = document.getElementById('screen-call');
  callScreen.style.filter = 'brightness(0)';
  setTimeout(() => {
    callScreen.style.filter = '';
    if (callTimerInterval) {
      clearInterval(callTimerInterval);
      callTimerInterval = null;
      callSeconds = 0;
    }
    showScreen(0);
  }, 400);
});

// Mic toggle
let micActive = true;
document.getElementById('btn-mic-call').addEventListener('click', function() {
  micActive = !micActive;
  this.classList.toggle('active', micActive);
  const icon = this.querySelector('.ctrl-icon');
  icon.style.background = micActive ? 'rgba(124,92,252,0.3)' : 'rgba(255,77,109,0.3)';
  icon.style.borderColor = micActive ? 'var(--primary)' : 'var(--danger)';
  const waves = document.querySelector('.audio-wave');
  if (waves) waves.style.opacity = micActive ? '1' : '0.2';
});

// Camera toggle
let camActive = true;
document.getElementById('btn-cam-call').addEventListener('click', function() {
  camActive = !camActive;
  this.classList.toggle('active', camActive);
  const icon = this.querySelector('.ctrl-icon');
  icon.style.background = camActive ? 'rgba(124,92,252,0.3)' : 'rgba(255,77,109,0.3)';
  icon.style.borderColor = camActive ? 'var(--primary)' : 'var(--danger)';
});

// Speaker toggle on pre-join
document.getElementById('btn-speaker').addEventListener('click', function() {
  this.style.background = this.style.background ? '' : 'rgba(124,92,252,0.3)';
});

// ── Effects Screen ────────────────────────
document.getElementById('btn-close-effects').addEventListener('click', () => {
  showScreen(currentScreen === 2 ? 0 : currentScreen);
});

// Tab switching
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', function() {
    const tabId = this.dataset.tab;

    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.add('hidden'));

    this.classList.add('active');
    document.getElementById(`tab-content-${tabId}`).classList.remove('hidden');
  });
});

// Background options
document.querySelectorAll('.bg-option').forEach(btn => {
  btn.addEventListener('click', function() {
    document.querySelectorAll('.bg-option').forEach(b => b.classList.remove('active'));
    this.classList.add('active');
    ripple(this);
  });
});

// Background thumbnails
document.querySelectorAll('.bg-thumb').forEach(btn => {
  btn.addEventListener('click', function() {
    document.querySelectorAll('.bg-thumb').forEach(b => b.style.border = '2px solid transparent');
    this.style.border = '2px solid var(--primary)';
    this.style.boxShadow = '0 0 16px var(--primary-glow)';
    ripple(this);
  });
});

// Filter items
document.querySelectorAll('.filter-item').forEach(item => {
  item.addEventListener('click', function() {
    document.querySelectorAll('.filter-item').forEach(i => i.classList.remove('active'));
    this.classList.add('active');
  });
});

// Sliders
document.querySelectorAll('.appearance-slider').forEach(slider => {
  slider.addEventListener('input', function() {
    const valueEl = this.nextElementSibling;
    valueEl.textContent = this.value + '%';
    // Visual fill
    const pct = this.value;
    this.style.background = `linear-gradient(90deg, var(--primary) ${pct}%, var(--bg-glass-strong) ${pct}%)`;
  });
  // Init fill
  const pct = slider.value;
  slider.style.background = `linear-gradient(90deg, var(--primary) ${pct}%, rgba(255,255,255,0.12) ${pct}%)`;
});

// Toggle switch
document.getElementById('toggle-eyes').addEventListener('click', function() {
  this.classList.toggle('active');
});

// ── More Options Screen ───────────────────
document.getElementById('btn-close-more').addEventListener('click', () => {
  showScreen(1);
});

document.getElementById('moreBackdrop').addEventListener('click', () => {
  showScreen(1);
});

// Grid buttons toggle
document.querySelectorAll('.more-grid-btn').forEach(btn => {
  btn.addEventListener('click', function() {
    this.classList.toggle('active');
    ripple(this);
  });
});

// List items
document.getElementById('btn-ai-notes').addEventListener('click', function() {
  showToast('✨ AI Notes activated — summarizing your meeting');
});

document.getElementById('btn-on-the-go').addEventListener('click', function() {
  showToast('🚶 On-the-go mode enabled');
});

document.getElementById('btn-chat-more').addEventListener('click', function() {
  showToast('💬 Chat — no new messages');
});

document.getElementById('btn-settings-more').addEventListener('click', function() {
  showToast('⚙️ Settings panel coming soon');
});

// ── Toast Notification ────────────────────
function showToast(msg) {
  const existing = document.querySelector('.toast-notification');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.className = 'toast-notification';
  toast.textContent = msg;

  Object.assign(toast.style, {
    position: 'fixed',
    bottom: '180px',
    left: '50%',
    transform: 'translateX(-50%) translateY(20px)',
    background: 'rgba(20, 25, 40, 0.95)',
    backdropFilter: 'blur(20px)',
    border: '1px solid rgba(124,92,252,0.3)',
    borderRadius: '24px',
    padding: '12px 22px',
    color: 'white',
    fontSize: '13px',
    fontFamily: 'Outfit, sans-serif',
    fontWeight: '500',
    zIndex: '9999',
    boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
    opacity: '0',
    transition: 'all 0.3s cubic-bezier(0.4,0,0.2,1)',
    whiteSpace: 'nowrap',
    maxWidth: '320px',
  });

  document.body.appendChild(toast);

  requestAnimationFrame(() => {
    toast.style.opacity = '1';
    toast.style.transform = 'translateX(-50%) translateY(0)';
  });

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(-50%) translateY(-10px)';
    setTimeout(() => toast.remove(), 300);
  }, 2500);
}

// ── Ripple Effect ─────────────────────────
function ripple(el) {
  const r = document.createElement('div');
  const rect = el.getBoundingClientRect();

  Object.assign(r.style, {
    position: 'absolute',
    width: '80px',
    height: '80px',
    borderRadius: '50%',
    background: 'rgba(124,92,252,0.25)',
    transform: 'scale(0)',
    animation: 'rippleAnim 0.5s ease-out forwards',
    top: '50%',
    left: '50%',
    marginLeft: '-40px',
    marginTop: '-40px',
    pointerEvents: 'none',
  });

  el.style.position = 'relative';
  el.style.overflow = 'hidden';
  el.appendChild(r);

  setTimeout(() => r.remove(), 600);
}

// Add ripple keyframe
const style = document.createElement('style');
style.textContent = `
  @keyframes rippleAnim {
    to { transform: scale(3); opacity: 0; }
  }
`;
document.head.appendChild(style);

// ── Keyboard Navigation ───────────────────
document.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowRight' && currentScreen < screens.length - 1) {
    showScreen(currentScreen + 1);
  } else if (e.key === 'ArrowLeft' && currentScreen > 0) {
    showScreen(currentScreen - 1);
  }
});

// ── Touch Swipe ───────────────────────────
let touchStartX = 0;
let touchStartY = 0;

document.querySelector('.phone-frame').addEventListener('touchstart', (e) => {
  touchStartX = e.touches[0].clientX;
  touchStartY = e.touches[0].clientY;
}, { passive: true });

document.querySelector('.phone-frame').addEventListener('touchend', (e) => {
  const dx = e.changedTouches[0].clientX - touchStartX;
  const dy = e.changedTouches[0].clientY - touchStartY;

  if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 60) {
    if (dx < 0 && currentScreen < screens.length - 1) {
      showScreen(currentScreen + 1);
    } else if (dx > 0 && currentScreen > 0) {
      showScreen(currentScreen - 1);
    }
  }
}, { passive: true });

// ── Init ──────────────────────────────────
showScreen(0);

// ── Particle System ───────────────────────
function createParticle() {
  const particle = document.createElement('div');
  const size = Math.random() * 4 + 1;
  const x = Math.random() * window.innerWidth;
  const duration = Math.random() * 15 + 10;
  const delay = Math.random() * 5;

  Object.assign(particle.style, {
    position: 'fixed',
    width: size + 'px',
    height: size + 'px',
    borderRadius: '50%',
    background: Math.random() > 0.5 ? 'rgba(124,92,252,0.4)' : 'rgba(0,212,255,0.3)',
    left: x + 'px',
    bottom: '-10px',
    pointerEvents: 'none',
    zIndex: '0',
    animation: `floatUp ${duration}s ${delay}s linear infinite`,
    filter: 'blur(1px)',
  });

  document.querySelector('.ambient-bg').appendChild(particle);
}

const particleStyle = document.createElement('style');
particleStyle.textContent = `
  @keyframes floatUp {
    from { transform: translateY(0) rotate(0deg); opacity: 0; }
    10% { opacity: 1; }
    90% { opacity: 0.5; }
    to { transform: translateY(-100vh) rotate(360deg); opacity: 0; }
  }
`;
document.head.appendChild(particleStyle);

for (let i = 0; i < 15; i++) createParticle();

console.log('🎥 NexCall Premium Video UI — Initialized');
