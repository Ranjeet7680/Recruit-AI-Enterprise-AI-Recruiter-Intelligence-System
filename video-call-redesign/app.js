/* =========================================
   NexCall — App JavaScript
   Interactions, Navigation & Animations
   ========================================= */

'use strict';

// Auto-detect Iframe embedding to switch to desktop edge-to-edge layout mode
const isEmbed = window.self !== window.top || new URLSearchParams(window.location.search).get('embed') === 'true';
if (isEmbed) {
  document.body.classList.add('embed-mode');
}

// ── Screen Navigation ─────────────────────
const screens = ['screen-prejoin', 'screen-call', 'screen-effects', 'screen-more'];
let currentScreen = 0;
let callTimerInterval = null;
let callSeconds = 0;

/**
 * Global state variables representing WebRTC streams and user preferences.
 */
let localMediaStream = null;
let micActive = true;
let camActive = true;
let captionsActive = true;

/**
 * Requests WebRTC webcam/microphone permissions and feeds the stream to the specified video element.
 * Falls back gracefully to avatar initials if access is denied or devices are unavailable.
 * @param {string} videoElementId - The DOM ID of the video element to attach the media stream.
 */
async function startWebcam(videoElementId) {
  if (localMediaStream) {
    const videoEl = document.getElementById(videoElementId);
    if (videoEl) {
      videoEl.srcObject = localMediaStream;
      videoEl.classList.remove('hidden');
      if (window.currentCameraFilter) {
        videoEl.style.filter = window.currentCameraFilter;
      }
    }
    return;
  }
  
  try {
    localMediaStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    const videoEl = document.getElementById(videoElementId);
    if (videoEl) {
      videoEl.srcObject = localMediaStream;
      videoEl.classList.remove('hidden');
      if (window.currentCameraFilter) {
        videoEl.style.filter = window.currentCameraFilter;
      }
    }
    updateTrackStates();
  } catch (err) {
    console.warn("Real webcam stream failed or not allowed:", err);
    showToast("⚠️ Webcam access denied or unavailable. Using simulated feed.");
  }
}

/**
 * Stops all WebRTC media tracks and hides related video DOM elements.
 */
function stopWebcam() {
  if (localMediaStream) {
    localMediaStream.getTracks().forEach(track => track.stop());
    localMediaStream = null;
  }
  const prejoinVideo = document.getElementById('prejoin-webcam');
  if (prejoinVideo) {
    prejoinVideo.srcObject = null;
    prejoinVideo.classList.add('hidden');
  }
  const pipVideo = document.getElementById('pip-webcam');
  if (pipVideo) {
    pipVideo.srcObject = null;
    pipVideo.classList.add('hidden');
  }
}

/**
 * Dynamically enables or disables WebRTC media stream tracks based on user preferences.
 */
function updateTrackStates() {
  if (!localMediaStream) return;
  localMediaStream.getVideoTracks().forEach(track => {
    track.enabled = camActive;
  });
  localMediaStream.getAudioTracks().forEach(track => {
    track.enabled = micActive;
  });
}

/**
 * Transitions the UI between different call phases/screens with smooth translation effects.
 * Also configures WebRTC device streaming dynamically based on target screen context.
 * @param {number} index - Target screen index (0: Pre-join, 1: Active Call, 2: Effects, 3: Options).
 * @param {number} [direction=1] - Slide animation direction offset multiplier.
 */
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

  if (index === 0) {
    const prejoinAvatar = document.querySelector('.video-preview-card .video-person-avatar');
    if (camActive) {
      startWebcam('prejoin-webcam');
      if (prejoinAvatar) prejoinAvatar.classList.add('hidden');
    } else {
      stopWebcam();
      if (prejoinAvatar) prejoinAvatar.classList.remove('hidden');
    }
  } else if (index === 1) {
    startCallTimer();
    const pipAvatar = document.getElementById('pip-user-avatar-initials');
    const prejoinVideo = document.getElementById('prejoin-webcam');
    if (prejoinVideo) {
      prejoinVideo.srcObject = null;
      prejoinVideo.classList.add('hidden');
    }
    if (camActive) {
      startWebcam('pip-webcam');
      if (pipAvatar) pipAvatar.style.display = 'none';
    } else {
      if (pipAvatar) pipAvatar.style.display = 'flex';
      const pipVideo = document.getElementById('pip-webcam');
      if (pipVideo) {
        pipVideo.srcObject = null;
        pipVideo.classList.add('hidden');
      }
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
  if (window.parent) {
    window.parent.postMessage({ type: 'video-call-joined' }, '*');
  }
});

document.getElementById('btn-effects').addEventListener('click', () => {
  showScreen(2);
});

document.getElementById('btn-toggle-cam').addEventListener('click', function() {
  camActive = !camActive;
  this.classList.toggle('active', camActive);
  const prejoinAvatar = document.querySelector('.video-preview-card .video-person-avatar');
  if (camActive) {
    this.style.background = '';
    this.style.color = '';
    startWebcam('prejoin-webcam');
    if (prejoinAvatar) prejoinAvatar.classList.add('hidden');
  } else {
    this.style.background = 'rgba(255,77,109,0.3)';
    this.style.color = 'var(--danger)';
    stopWebcam();
    if (prejoinAvatar) prejoinAvatar.classList.remove('hidden');
  }
  
  // Sync call button state
  const callCamBtn = document.getElementById('btn-cam-call');
  if (callCamBtn) {
    callCamBtn.classList.toggle('active', camActive);
    const icon = callCamBtn.querySelector('.ctrl-icon');
    if (icon) {
      icon.style.background = camActive ? 'rgba(124,92,252,0.3)' : 'rgba(255,77,109,0.3)';
      icon.style.borderColor = camActive ? 'var(--primary)' : 'var(--danger)';
    }
  }
});

document.getElementById('btn-toggle-mic').addEventListener('click', function() {
  micActive = !micActive;
  this.classList.toggle('active', micActive);
  if (micActive) {
    this.style.background = '';
    this.style.color = '';
  } else {
    this.style.background = 'rgba(255,77,109,0.3)';
    this.style.color = 'var(--danger)';
  }
  
  // Sync call button state
  const callMicBtn = document.getElementById('btn-mic-call');
  if (callMicBtn) {
    callMicBtn.classList.toggle('active', micActive);
    const icon = callMicBtn.querySelector('.ctrl-icon');
    if (icon) {
      icon.style.background = micActive ? 'rgba(124,92,252,0.3)' : 'rgba(255,77,109,0.3)';
      icon.style.borderColor = micActive ? 'var(--primary)' : 'var(--danger)';
    }
  }
  updateTrackStates();
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
    stopWebcam();
    showScreen(0);
    
    // Notify parent window to end the video call
    if (window.parent) {
      window.parent.postMessage({ type: 'end-video-call' }, '*');
    }
  }, 400);
});

// Mic toggle
document.getElementById('btn-mic-call').addEventListener('click', function() {
  micActive = !micActive;
  this.classList.toggle('active', micActive);
  const icon = this.querySelector('.ctrl-icon');
  if (icon) {
    icon.style.background = micActive ? 'rgba(124,92,252,0.3)' : 'rgba(255,77,109,0.3)';
    icon.style.borderColor = micActive ? 'var(--primary)' : 'var(--danger)';
  }
  const waves = document.querySelector('.audio-wave');
  if (waves) waves.style.opacity = micActive ? '1' : '0.2';
  
  // Sync prejoin button state
  const prejoinMicBtn = document.getElementById('btn-toggle-mic');
  if (prejoinMicBtn) {
    prejoinMicBtn.classList.toggle('active', micActive);
    prejoinMicBtn.style.background = micActive ? '' : 'rgba(255,77,109,0.3)';
    prejoinMicBtn.style.color = micActive ? '' : 'var(--danger)';
  }
  updateTrackStates();
});

// Camera toggle
document.getElementById('btn-cam-call').addEventListener('click', function() {
  camActive = !camActive;
  this.classList.toggle('active', camActive);
  const icon = this.querySelector('.ctrl-icon');
  if (icon) {
    icon.style.background = camActive ? 'rgba(124,92,252,0.3)' : 'rgba(255,77,109,0.3)';
    icon.style.borderColor = camActive ? 'var(--primary)' : 'var(--danger)';
  }
  
  const pipAvatar = document.getElementById('pip-user-avatar-initials');
  const pipVideo = document.getElementById('pip-webcam');
  if (camActive) {
    startWebcam('pip-webcam');
    if (pipAvatar) pipAvatar.style.display = 'none';
  } else {
    if (pipAvatar) pipAvatar.style.display = 'flex';
    if (pipVideo) {
      pipVideo.srcObject = null;
      pipVideo.classList.add('hidden');
    }
    updateTrackStates();
  }
  
  // Sync prejoin button state
  const prejoinCamBtn = document.getElementById('btn-toggle-cam');
  if (prejoinCamBtn) {
    prejoinCamBtn.classList.toggle('active', camActive);
    prejoinCamBtn.style.background = camActive ? '' : 'rgba(255,77,109,0.3)';
    prejoinCamBtn.style.color = camActive ? '' : 'var(--danger)';
  }
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

    document.querySelectorAll('.tab-btn').forEach(b => {
      b.classList.remove('active');
      b.setAttribute('aria-selected', 'false');
    });
    document.querySelectorAll('.tab-content').forEach(c => c.classList.add('hidden'));

    this.classList.add('active');
    this.setAttribute('aria-selected', 'true');
    const tabContent = document.getElementById(`tab-content-${tabId}`);
    if (tabContent) tabContent.classList.remove('hidden');
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

// Lobby initialization completed

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

// ── Extract and Apply URL parameters ──────────────────
function initDynamicParams() {
  const urlParams = new URLSearchParams(window.location.search);
  const candidateName = urlParams.get('candidate') || 'Aria Sterling';
  const candidateRole = urlParams.get('role') || 'Senior NLP / ML Engineer';
  const candidateAvatar = urlParams.get('avatar') || '';
  const recruiterName = urlParams.get('recruiter') || 'Ranjeet Kumar';
  const recruiterEmail = urlParams.get('email') || 'rajranjeet7680@gmail.com';

  // Helper to get initials
  function getInitials(name) {
    let initials = name.split(' ').filter(w => isNaN(w)).map(n => n[0]).join('').substring(0, 2).toUpperCase();
    if (initials.length === 1 && name.length > 1) initials = name.substring(0, 2).toUpperCase();
    return initials || 'CA';
  }

  // Update recruiter/user details on pre-join screen
  const rInitials = getInitials(recruiterName);
  const userInitialsEl = document.getElementById('prejoin-user-avatar-initials');
  if (userInitialsEl) userInitialsEl.textContent = rInitials;
  
  const userInitialsSmEl = document.getElementById('prejoin-user-avatar-sm-initials');
  if (userInitialsSmEl) userInitialsSmEl.textContent = rInitials;
  
  const userNameEl = document.getElementById('prejoin-user-name');
  if (userNameEl) userNameEl.textContent = recruiterName;
  
  const userEmailEl = document.getElementById('prejoin-user-email');
  if (userEmailEl) userEmailEl.textContent = recruiterEmail;

  // Update recruiter details on active call & effects screens
  const pipAvatarEl = document.getElementById('pip-user-avatar-initials');
  if (pipAvatarEl) pipAvatarEl.textContent = rInitials;
  
  const effectsAvatarEl = document.getElementById('effects-user-avatar-initials');
  if (effectsAvatarEl) effectsAvatarEl.textContent = rInitials;

  // Update candidate details inside the active call screen
  const cInitials = getInitials(candidateName);
  const candidateInitialsEl = document.getElementById('call-candidate-avatar-initials');
  const candidateAvatarImg = document.getElementById('call-candidate-avatar-img');
  
  if (candidateInitialsEl) {
    candidateInitialsEl.textContent = cInitials;
  }
  
  if (candidateAvatarImg) {
    if (candidateAvatar && candidateAvatar.trim() !== '') {
      candidateAvatarImg.src = candidateAvatar;
      candidateAvatarImg.classList.remove('hidden');
      if (candidateInitialsEl) candidateInitialsEl.classList.add('hidden');
    } else {
      candidateAvatarImg.classList.add('hidden');
      if (candidateInitialsEl) candidateInitialsEl.classList.remove('hidden');
    }
  }

  // Update call screen state when active
  const callStatusLabel = document.getElementById('call-status-label');
  if (callStatusLabel) {
    callStatusLabel.textContent = `${candidateName} is in the call`;
  }
}

// Run dynamic param initialization
initDynamicParams();

// ── Captions Toggle Event Listener ──
const captionsBtn = document.getElementById('btn-captions');
if (captionsBtn) {
  captionsBtn.addEventListener('click', function() {
    captionsActive = !captionsActive;
    this.classList.toggle('active', captionsActive);
    
    const captionOverlay = document.getElementById('call-captions-overlay');
    if (captionOverlay) {
      if (captionsActive) {
        captionOverlay.classList.remove('hidden');
      } else {
        captionOverlay.classList.add('hidden');
      }
    }
  });
}

// ── Parent Window Message Listener ──
window.addEventListener('message', (event) => {
  const data = event.data;
  if (!data) return;
  
  if (data.type === 'dialog-turn') {
    // Auto-join the active call if we receive a dialog-turn message on the prejoin screen
    if (currentScreen === 0) {
      showScreen(1);
    }
    handleDialogTurn(data);
  }
});

// Handle real-time transcript subtitles and soundwave sync
function handleDialogTurn(data) {
  const { speaker, text, candidateName } = data;
  
  // Update subtitles/captions
  const captionOverlay = document.getElementById('call-captions-overlay');
  const captionSpeaker = document.getElementById('caption-speaker');
  const captionText = document.getElementById('caption-text');
  
  if (captionOverlay && captionSpeaker && captionText) {
    if (captionsActive) {
      captionSpeaker.textContent = speaker === 'Candidate' ? `${candidateName}:` : 'Sarah Jenkins:';
      captionSpeaker.style.color = speaker === 'Candidate' ? 'var(--primary)' : '#00f2fe';
      captionText.textContent = text;
      captionOverlay.classList.remove('hidden');
    } else {
      captionOverlay.classList.add('hidden');
    }
  }
  
  // Animate candidate's audio waves and avatar ring
  const waves = document.querySelector('.audio-wave');
  const candidateAvatarRing = document.querySelector('.call-avatar-ring');
  
  if (speaker === 'Candidate') {
    if (waves) {
      waves.classList.add('active-speaking');
      waves.style.opacity = '1';
    }
    if (candidateAvatarRing) {
      candidateAvatarRing.style.animation = 'rotateBorder 2s linear infinite, pulseGlow 1.5s ease-in-out infinite alternate';
    }
  } else {
    // Recruiter speaking - candidate quiet
    if (waves) {
      waves.classList.remove('active-speaking');
      waves.style.opacity = '0.3';
    }
    if (candidateAvatarRing) {
      candidateAvatarRing.style.animation = 'rotateBorder 6s linear infinite';
    }
  }
}

// ── Sound Proxy to Parent Dashboard ──
function playParentSound(type) {
  try {
    if (window.parent) {
      if (type === 'click' && typeof window.parent.playClick === 'function') window.parent.playClick();
      else if (type === 'pop' && typeof window.parent.playPop === 'function') window.parent.playPop();
      else if (type === 'success' && typeof window.parent.playSuccess === 'function') window.parent.playSuccess();
      else if (type === 'chime' && typeof window.parent.playChime === 'function') window.parent.playChime();
      else if (type === 'error' && typeof window.parent.playError === 'function') window.parent.playError();
    }
  } catch (e) {
    // Cross-origin fallback or silent fail
  }
}

document.addEventListener('click', (e) => {
  const target = e.target.closest('button, [role="button"], .bg-option, .bg-thumb, .filter-item');
  if (target) {
    playParentSound('click');
  }
});

// ── Fullscreen Toggling Logic ──
const fullscreenBtn = document.getElementById('btn-fullscreen-call');
if (fullscreenBtn) {
  fullscreenBtn.addEventListener('click', function() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable full-screen mode: ${err.message}`);
        showToast("⚠️ Fullscreen blocked or unsupported by browser.");
      });
    } else {
      document.exitFullscreen();
    }
  });
}

document.addEventListener('fullscreenchange', () => {
  const btn = document.getElementById('btn-fullscreen-call');
  if (btn) {
    if (document.fullscreenElement) {
      btn.classList.add('active');
      btn.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 14h6v6m10-6h-6v6M4 10h6V4m10 6h-6V4"/></svg>`;
      showToast("📺 Fullscreen mode enabled.");
    } else {
      btn.classList.remove('active');
      btn.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" /></svg>`;
      showToast("Fullscreen mode disabled.");
    }
  }
});

// ── Real-Time Camera Visual Effects (Filters & Sliders) ──
window.currentCameraFilter = 'none';

function applyAppearanceFilters() {
  const smoothVal = parseFloat(document.getElementById('slider-smooth')?.value || 30) / 33.3; // 0px to 3px blur
  const brightnessVal = document.getElementById('slider-brightness')?.value || 50; 
  const contrastVal = document.getElementById('slider-contrast')?.value || 45; 
  
  // Calculate slider ranges (0-100% -> 25%-175%)
  const b = parseFloat(brightnessVal) * 1.5 + 25; 
  const c = parseFloat(contrastVal) * 1.5 + 25; 
  
  // Base CSS filter from active color filter name
  const activeFilterItem = document.querySelector('.filter-item.active span');
  const activeFilterName = activeFilterItem ? activeFilterItem.textContent.trim() : 'Original';
  
  let baseFilter = '';
  switch (activeFilterName) {
    case 'Mono':
      baseFilter = 'grayscale(1)';
      break;
    case 'Vivid':
      baseFilter = 'saturate(1.6)';
      break;
    case 'Fresh':
      baseFilter = 'saturate(0.9)';
      break;
    case 'Warm':
      baseFilter = 'sepia(0.35) saturate(1.3) hue-rotate(-10deg)';
      break;
    case 'Cool':
      baseFilter = 'saturate(0.85) hue-rotate(15deg)';
      break;
    default:
      baseFilter = '';
  }
  
  const filterString = `${baseFilter} brightness(${b}%) contrast(${c}%) blur(${smoothVal}px)`.trim();
  
  const prejoinWebcam = document.getElementById('prejoin-webcam');
  const pipWebcam = document.getElementById('pip-webcam');
  
  if (prejoinWebcam) prejoinWebcam.style.filter = filterString;
  if (pipWebcam) pipWebcam.style.filter = filterString;
  
  window.currentCameraFilter = filterString;
}

// Hook appearance filters into selection clicks
document.querySelectorAll('.filter-item').forEach(item => {
  item.addEventListener('click', () => {
    // Wait a brief tick for click active class switch to complete
    setTimeout(applyAppearanceFilters, 50);
  });
});

// Hook eye contact toggle switch
const toggleEyes = document.getElementById('toggle-eyes');
if (toggleEyes) {
  toggleEyes.addEventListener('click', function() {
    const isActive = this.classList.contains('active');
    showToast(isActive ? "👁️ AI Eye Contact correction active." : "AI Eye Contact correction inactive.");
  });
}

