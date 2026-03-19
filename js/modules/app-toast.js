/**
 * app-toast.js
 * Duplicate-letter dismissible toast and celebratory effects (confetti, stars)
 */

const DUPE_PREF_KEY = 'wq_v2_dupe_dismissed';
var _dupeToastEl = null;

const _el = id => document.getElementById(id);

function removeDupeToast() {
  if (_dupeToastEl) { _dupeToastEl.remove(); _dupeToastEl = null; }
}

function checkDuplicates(result) {
  // Check if user has disabled this
  if (_el('s-dupe')?.value === 'off') return;
  if (typeof isAssessmentRoundLocked === 'function' && isAssessmentRoundLocked()) return;
  if (localStorage.getItem(DUPE_PREF_KEY) === 'true') return;

  const word = result.word;
  const freq = {};
  word.split('').forEach(c => { freq[c] = (freq[c] || 0) + 1; });

  for (const [letter, count] of Object.entries(freq)) {
    if (count < 2) continue;
    // Count correctly placed so far
    let placed = 0;
    result.guesses.forEach(g =>
      g.split('').forEach((ch, i) => { if (ch === letter && word[i] === letter) placed++; })
    );
    if (placed >= 1 && placed < count) {
      if (WQUI?.pulseDupeKey) {
        WQUI.pulseDupeKey(letter);
      }
      showDupeToast(letter.toUpperCase());
      break;
    }
  }
}

function showDupeToast(letter) {
  removeDupeToast();
  const div = document.createElement('div');
  div.id = 'dupe-toast';
  div.innerHTML = `
    <span>💡 Heads up: there's another <strong>${letter}</strong> in this word.</span>
    <div class="dupe-dismiss-row">
      <button id="dupe-ok">Got it</button>
      <button id="dupe-never">Don't show again</button>
    </div>`;
  document.body.appendChild(div);
  _dupeToastEl = div;

  _el('dupe-ok')?.addEventListener('click', removeDupeToast);
  _el('dupe-never')?.addEventListener('click', () => {
    localStorage.setItem(DUPE_PREF_KEY, 'true');
    removeDupeToast();
  });

  // Auto-remove after 8 seconds if not dismissed
  setTimeout(removeDupeToast, 8000);
}

function launchStars(){
  const layer = _el('celebrate-layer');
  if (!layer) return;
  layer.innerHTML = '';
  const starChars = ['⭐','✨','🌟'];
  const count = 12;
  for (let i=0;i<count;i++){
    const s = document.createElement('div');
    s.className = 'celebrate-star wq-anim';
    s.textContent = starChars[i % starChars.length];
    s.style.left = (10 + Math.random()*80) + 'vw';
    s.style.top  = (15 + Math.random()*55) + 'vh';
    s.style.animationDelay = (Math.random()*180) + 'ms';
    layer.appendChild(s);
  }
  setTimeout(()=>{ layer.innerHTML=''; }, 1200);
}

function launchConfetti() {
  const canvas = _el('confetti-canvas');
  if (!canvas) return;
  canvas.width  = window.innerWidth;
  canvas.height = window.innerHeight;
  const ctx = canvas.getContext('2d');
  const COLORS = ['#22c55e','#f59e0b','#3b82f6','#ec4899','#f97316','#a855f7','#06b6d4','#fbbf24'];
  const burstOrigins = [
    { x: canvas.width * 0.22, y: canvas.height * 0.14 },
    { x: canvas.width * 0.5, y: canvas.height * 0.1 },
    { x: canvas.width * 0.78, y: canvas.height * 0.14 }
  ];
  const pieces = Array.from({ length: 180 }, (_, index) => {
    const origin = burstOrigins[index % burstOrigins.length];
    return {
      x:     origin.x + (Math.random() - 0.5) * 140,
      y:     origin.y + (Math.random() - 0.5) * 40,
      w:     6 + Math.random() * 10,
      h:     4 + Math.random() * 6,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      vx:    (Math.random() - 0.5) * 6.2,
      vy:    1.8 + Math.random() * 3.4,
      angle: Math.random() * Math.PI * 2,
      spin:  (Math.random() - 0.5) * 0.2,
    };
  });
  let frame;
  const draw = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    let any = false;
    pieces.forEach(p => {
      p.x += p.vx; p.y += p.vy += 0.08; p.angle += p.spin;
      if (p.y < canvas.height + 30) any = true;
      ctx.save();
      ctx.translate(p.x, p.y); ctx.rotate(p.angle);
      ctx.fillStyle = p.color;
      ctx.globalAlpha = Math.max(0, 1 - p.y / canvas.height);
      ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      ctx.restore();
    });
    if (any) frame = requestAnimationFrame(draw);
    else ctx.clearRect(0, 0, canvas.width, canvas.height);
  };
  cancelAnimationFrame(frame);
  frame = requestAnimationFrame(draw);
  setTimeout(() => { cancelAnimationFrame(frame); ctx.clearRect(0, 0, canvas.width, canvas.height); }, 5500);
}

function initToast() {
  let lastModalCelebrateAt = 0;
  window.addEventListener('wq:result-modal-open', (event) => {
    const won = !!event?.detail?.won;
    if (!won) return;
    const settings = WQUI?.getSettings?.();
    if (settings && settings.confetti === false) return;
    const now = Date.now();
    if (now - lastModalCelebrateAt < 700) return;
    lastModalCelebrateAt = now;
    launchConfetti();
    launchStars();
  });
}

export { initToast, showDupeToast, removeDupeToast, checkDuplicates, launchConfetti, launchStars };
