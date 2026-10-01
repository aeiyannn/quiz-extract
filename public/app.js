'use strict';

/* ══════════════════════════════════════════════════════════════════════════════
   SMIT Brand Colors — for confetti
══════════════════════════════════════════════════════════════════════════════ */
const SMIT_COLORS = [
  '#1565C0', '#42A5F5', '#0D47A1',   // SMIT blues (exact from logo)
  '#72B626', '#9CCC46', '#558B1B',   // SMIT greens (exact from logo)
  '#FFD700', '#FFA500',              // gold celebration pops
  '#ffffff',                          // white
];

/* ══════════════════════════════════════════════════════════════════════════════
   TIMER  (45 minutes)
══════════════════════════════════════════════════════════════════════════════ */
const TOTAL_SECONDS    = 45 * 60;       // 2700
const RING_CIRCUMFERENCE = 565.5;       // 2π × 90

let timerInterval = null;
let secondsLeft   = TOTAL_SECONDS;

function startTimer() {
  const timerText = document.getElementById('timer-text');
  const ring      = document.getElementById('ring-progress');
  const dot       = document.getElementById('ring-dot');
  const timeUpMsg = document.getElementById('time-up-msg');
  const sessionLbl= document.querySelector('.tp-session-label');

  function updateRingDot(progress) {
    // Rotate dot around the ring (r=90, cx=cy=110)
    const angle   = (1 - progress) * 2 * Math.PI - Math.PI / 2;
    const dotX    = 110 + 90 * Math.cos(angle);
    const dotY    = 110 + 90 * Math.sin(angle);
    dot.setAttribute('cx', dotX.toFixed(2));
    dot.setAttribute('cy', dotY.toFixed(2));
  }

  function tick() {
    if (secondsLeft > 0) secondsLeft--;

    const mm = String(Math.floor(secondsLeft / 60)).padStart(2, '0');
    const ss = String(secondsLeft % 60).padStart(2, '0');
    timerText.textContent = `${mm}:${ss}`;

    const progress = secondsLeft / TOTAL_SECONDS;
    const offset   = RING_CIRCUMFERENCE * (1 - progress);
    ring.style.strokeDashoffset = offset;

    // Update dot position
    updateRingDot(progress);

    // Color transitions
    if (secondsLeft <= 300) {
      // Under 5 min — red danger
      timerText.className = 'tp-ring-time danger';
      ring.style.stroke   = '#EF4444';
      dot.style.fill      = '#EF4444';
    } else if (secondsLeft <= 600) {
      // Under 10 min — amber warning
      timerText.className = 'tp-ring-time warn';
      ring.style.stroke   = '#F59E0B';
      dot.style.fill      = '#F59E0B';
    }

    if (secondsLeft === 0) {
      clearInterval(timerInterval);
      timerText.textContent = '00:00';
      sessionLbl.textContent = 'SESSION ENDED';
      sessionLbl.style.background = '#FEF2F2';
      sessionLbl.style.color      = '#EF4444';
      sessionLbl.style.borderColor= '#FECACA';
      timeUpMsg.classList.remove('hidden');
      showToast('⏰ 45-minute session has ended!', null, true);
    }
  }

  // Init ring to full
  updateRingDot(1);
  timerInterval = setInterval(tick, 1000);
}

/* ══════════════════════════════════════════════════════════════════════════════
   CONFETTI — SMIT palette
══════════════════════════════════════════════════════════════════════════════ */
function launchConfetti(passed) {
  if (typeof confetti === 'undefined') return;

  if (passed) {
    // Dual side cannons
    confetti({ particleCount: 90, angle: 60,  spread: 70, origin: { x: 0, y: 0.65 }, colors: SMIT_COLORS, scalar: 1.1 });
    confetti({ particleCount: 90, angle: 120, spread: 70, origin: { x: 1, y: 0.65 }, colors: SMIT_COLORS, scalar: 1.1 });
    // Star burst
    setTimeout(() => {
      confetti({
        particleCount: 50, spread: 120,
        origin: { y: 0.55 },
        shapes: ['star'],
        colors: ['#FFD700', '#0066CC', '#00897B', '#ffffff'],
        scalar: 1.4,
      });
    }, 300);
    // Extra sparkle burst
    setTimeout(() => {
      confetti({ particleCount: 40, spread: 80, origin: { y: 0.6 }, colors: SMIT_COLORS, gravity: 0.7 });
    }, 600);
  } else {
    confetti({
      particleCount: 25, spread: 40,
      origin: { y: 0.5 },
      colors: ['#EF4444', '#F87171', '#CBD5E1'],
      gravity: 1.3, scalar: 0.75,
    });
  }
}

/* ══════════════════════════════════════════════════════════════════════════════
   STUDENT POPUP (5 seconds)
══════════════════════════════════════════════════════════════════════════════ */
let popupTimer = null;

function showStudentPopup(record) {
  const popup      = document.getElementById('student-popup');
  const avatarEl   = document.getElementById('popup-avatar');
  const badgeEl    = document.getElementById('popup-badge');
  const nameEl     = document.getElementById('popup-name');
  const quizEl     = document.getElementById('popup-quiz');
  const scoreEl    = document.getElementById('popup-score');
  const pctEl      = document.getElementById('popup-pct');
  const attEl      = document.getElementById('popup-attempts');
  const barFill    = document.getElementById('popup-bar-fill');
  const cdFill     = document.getElementById('popup-cd-fill');

  const pct    = record.totalQuestions > 0
    ? Math.round((record.score / record.totalQuestions) * 100)
    : 0;
  const passed = record.status === 'passed';

  // Avatar initials
  const initials = (record.name || '?')
    .split(' ').slice(0, 2)
    .map(w => w[0] || '')
    .join('')
    .toUpperCase() || '?';

  avatarEl.textContent   = initials;
  nameEl.textContent     = record.name;
  quizEl.textContent     = record.quizTitle;
  scoreEl.textContent    = `${record.score}/${record.totalQuestions}`;
  pctEl.textContent      = `${pct}%`;
  attEl.textContent      = record.attempts;

  badgeEl.textContent    = passed ? 'PASSED' : 'FAILED';
  badgeEl.className      = `popup-status-badge ${passed ? 'passed' : 'failed'}`;

  // Score bar — reset then animate
  barFill.style.width  = '0%';
  barFill.className    = `popup-bar-fill${passed ? '' : ' fail'}`;
  requestAnimationFrame(() => requestAnimationFrame(() => {
    barFill.style.width = `${pct}%`;
  }));

  // Countdown drain bar — re-clone to restart CSS animation
  const newCd = cdFill.cloneNode(true);
  cdFill.parentNode.replaceChild(newCd, cdFill);

  // Show
  popup.classList.remove('hidden', 'hiding');

  // Confetti
  launchConfetti(passed);

  // Ring pop effect
  const ringWrap = document.getElementById('tp-ring-wrap');
  ringWrap.classList.remove('ring-pop');
  void ringWrap.offsetWidth;
  ringWrap.classList.add('ring-pop');

  // Auto-hide after 5s
  if (popupTimer) clearTimeout(popupTimer);
  popupTimer = setTimeout(closePopup, 5000);
}

function closePopup() {
  const popup = document.getElementById('student-popup');
  popup.classList.add('hiding');
  setTimeout(() => popup.classList.add('hidden'), 310);
  if (popupTimer) { clearTimeout(popupTimer); popupTimer = null; }
}

document.getElementById('popup-close').addEventListener('click', closePopup);

/* ══════════════════════════════════════════════════════════════════════════════
   STATS
══════════════════════════════════════════════════════════════════════════════ */
let allRecords = [];

function updateStats() {
  const total  = allRecords.length;
  const passed = allRecords.filter(r => r.status === 'passed').length;
  const failed = allRecords.filter(r => r.status === 'failed').length;
  const rate   = total > 0 ? Math.round((passed / total) * 100) + '%' : '—';

  document.getElementById('stat-total').textContent  = total;
  document.getElementById('stat-passed').textContent = passed;
  document.getElementById('stat-failed').textContent = failed;
  document.getElementById('stat-rate').textContent   = rate;
}

function updateLastResult(record) {
  const strip = document.getElementById('last-result-strip');
  const nameEl  = document.getElementById('last-result-name');
  const badgeEl = document.getElementById('last-result-badge');
  const timeEl  = document.getElementById('last-result-time');

  nameEl.textContent  = record.name;
  badgeEl.textContent = record.status === 'passed' ? 'Passed' : 'Failed';
  badgeEl.className   = `tp-last-badge ${record.status === 'passed' ? 'passed' : 'failed'}`;
  timeEl.textContent  = fmtRelative(record.observedAt);

  strip.classList.remove('hidden');
  // Re-trigger animation
  strip.style.animation = 'none';
  void strip.offsetWidth;
  strip.style.animation = '';
}

/* ══════════════════════════════════════════════════════════════════════════════
   INGEST
══════════════════════════════════════════════════════════════════════════════ */
function ingestRecord(record, isNew = false) {
  const exists = allRecords.some(r => r.quizId === record.quizId && r.id === record.id);
  if (exists) return;
  allRecords.push(record);
  updateStats();

  if (isNew) {
    showStudentPopup(record);
    updateLastResult(record);
    const pass = record.status === 'passed';
    showToast(
      `${record.name} — ${pass ? '✅ Passed' : '❌ Failed'}`,
      `${record.score}/${record.totalQuestions} · ${record.quizTitle}`,
      !pass
    );
  }
}

/* ══════════════════════════════════════════════════════════════════════════════
   TOAST
══════════════════════════════════════════════════════════════════════════════ */
function showToast(title, subtitle, isWarn = false) {
  const container = document.getElementById('toast-container');
  const t = document.createElement('div');
  t.className = `toast${isWarn ? ' toast--fail' : ''}`;
  t.innerHTML = `
    <div class="toast-body">
      <strong>${esc(title)}</strong>
      ${subtitle ? `<span>${esc(subtitle)}</span>` : ''}
    </div>
    <button class="toast-close" aria-label="Dismiss">&times;</button>`;
  t.querySelector('.toast-close').addEventListener('click', () => removeToast(t));
  container.appendChild(t);
  setTimeout(() => removeToast(t), 6000);
}
function removeToast(t) {
  t.classList.add('removing');
  setTimeout(() => t.remove(), 320);
}

/* ══════════════════════════════════════════════════════════════════════════════
   UTILS
══════════════════════════════════════════════════════════════════════════════ */
function esc(str) {
  const d = document.createElement('div');
  d.textContent = String(str ?? '');
  return d.innerHTML;
}
function fmtRelative(iso) {
  if (!iso) return '';
  try {
    const diff = Date.now() - new Date(iso).getTime();
    if (diff < 60000)   return 'just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    return new Date(iso).toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit' });
  } catch { return ''; }
}

/* ══════════════════════════════════════════════════════════════════════════════
   SOCKET.IO — inject SVG gradient + connect
══════════════════════════════════════════════════════════════════════════════ */
function injectSvgGradient() {
  const svg = document.querySelector('.tp-ring-svg');
  if (!svg) return;
  const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
  defs.innerHTML = `
    <linearGradient id="smitGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%"   stop-color="#1565C0"/>
      <stop offset="50%"  stop-color="#3A8FC7"/>
      <stop offset="100%" stop-color="#72B626"/>
    </linearGradient>`;
  svg.prepend(defs);
  document.getElementById('ring-progress').setAttribute('stroke', 'url(#smitGradient)');
}

function setConn(state) {
  const badge = document.getElementById('conn-badge');
  const text  = document.getElementById('conn-text');
  badge.className = `conn-badge conn-${state}`;
  text.textContent = state === 'connected' ? 'Connected' :
                     state === 'connecting' ? 'Connecting…' : 'Disconnected';
}

function initSocket() {
  const socket = io({
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 8000,
    reconnectionAttempts: Infinity,
  });

  socket.on('connect', () => setConn('connected'));
  socket.on('connect_error', () => setConn('connecting'));
  socket.on('disconnect', reason => {
    setConn('disconnected');
    console.warn('[socket] Disconnected:', reason);
  });
  socket.io.on('reconnect_attempt', () => setConn('connecting'));
  socket.io.on('reconnect', () => {
    setConn('connected');
    showToast('Reconnected to live feed ✓');
  });

  socket.on('quiz-results:snapshot', records => {
    if (Array.isArray(records)) records.forEach(r => ingestRecord(r, false));
  });

  socket.on('quiz-result:new', record => {
    if (record && typeof record === 'object') ingestRecord(record, true);
  });
}

/* ══════════════════════════════════════════════════════════════════════════════
   START BUTTON
══════════════════════════════════════════════════════════════════════════════ */
document.getElementById('start-btn').addEventListener('click', () => {
  const ss   = document.getElementById('start-screen');
  const page = document.getElementById('timer-page');

  ss.style.transition = 'opacity 0.45s ease, transform 0.45s ease';
  ss.style.opacity    = '0';
  ss.style.transform  = 'scale(1.04)';

  setTimeout(() => {
    ss.style.display = 'none';
    page.classList.remove('hidden');

    injectSvgGradient();
    startTimer();
    initSocket();
  }, 450);
});
