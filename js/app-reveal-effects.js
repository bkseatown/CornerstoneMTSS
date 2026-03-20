/**
 * app-reveal-effects.js
 * UI-only reveal helpers for duplicate toasts and celebration effects.
 */

function createRevealEffectsModule(deps) {
  const {
    documentRef = document,
    localStorageRef = localStorage,
    WQUI = null,
    getDupeMode = () => 'on',
    isAssessmentRoundLocked = () => false,
    getCelebrateLayer = () => null,
    getConfettiCanvas = () => null,
    dupePrefKey = 'wq_v2_dupe_dismissed',
    setTimeoutFn = setTimeout,
    requestAnimationFrameFn = requestAnimationFrame,
    cancelAnimationFrameFn = cancelAnimationFrame
  } = deps || {};

  let dupeToastEl = null;

  function removeDupeToast() {
    if (dupeToastEl) {
      dupeToastEl.remove();
      dupeToastEl = null;
    }
  }

  function maybeDismissDupeToast(target) {
    if (dupeToastEl && !dupeToastEl.contains(target)) {
      removeDupeToast();
    }
  }

  function showDupeToast(letter) {
    removeDupeToast();
    const div = documentRef.createElement('div');
    div.id = 'dupe-toast';
    div.innerHTML = `
      <span>Heads up: there's another <strong>${letter}</strong> in this word.</span>
      <div class="dupe-dismiss-row">
        <button id="dupe-ok">Got it</button>
        <button id="dupe-never">Don't show again</button>
      </div>`;
    documentRef.body.appendChild(div);
    dupeToastEl = div;

    div.querySelector('#dupe-ok')?.addEventListener('click', removeDupeToast);
    div.querySelector('#dupe-never')?.addEventListener('click', () => {
      localStorageRef.setItem(dupePrefKey, 'true');
      removeDupeToast();
    });

    setTimeoutFn(removeDupeToast, 8000);
  }

  function checkDuplicates(result) {
    if (getDupeMode() === 'off') return;
    if (isAssessmentRoundLocked()) return;
    if (localStorageRef.getItem(dupePrefKey) === 'true') return;

    const word = String(result?.word || '');
    const freq = {};
    word.split('').forEach((ch) => {
      freq[ch] = (freq[ch] || 0) + 1;
    });

    for (const [letter, count] of Object.entries(freq)) {
      if (count < 2) continue;
      let placed = 0;
      (result?.guesses || []).forEach((guess) => {
        guess.split('').forEach((ch, index) => {
          if (ch === letter && word[index] === letter) placed += 1;
        });
      });
      if (placed >= 1 && placed < count) {
        WQUI?.pulseDupeKey?.(letter);
        showDupeToast(letter.toUpperCase());
        break;
      }
    }
  }

  function launchStars() {
    const layer = getCelebrateLayer();
    if (!layer) return;
    layer.innerHTML = '';
    const starChars = ['*', '+', '.'];
    const count = 12;
    for (let index = 0; index < count; index += 1) {
      const star = documentRef.createElement('div');
      star.className = 'celebrate-star wq-anim';
      star.textContent = starChars[index % starChars.length];
      star.style.left = `${10 + Math.random() * 80}vw`;
      star.style.top = `${15 + Math.random() * 55}vh`;
      star.style.animationDelay = `${Math.random() * 180}ms`;
      layer.appendChild(star);
    }
    setTimeoutFn(() => {
      layer.innerHTML = '';
    }, 1200);
  }

  function launchConfetti() {
    const canvas = getConfettiCanvas();
    if (!canvas) return;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const ctx = canvas.getContext('2d');
    const colors = ['#22c55e', '#f59e0b', '#3b82f6', '#ec4899', '#f97316', '#a855f7', '#06b6d4', '#fbbf24'];
    const burstOrigins = [
      { x: canvas.width * 0.22, y: canvas.height * 0.14 },
      { x: canvas.width * 0.5, y: canvas.height * 0.1 },
      { x: canvas.width * 0.78, y: canvas.height * 0.14 }
    ];
    const pieces = Array.from({ length: 180 }, (_, index) => {
      const origin = burstOrigins[index % burstOrigins.length];
      return {
        x: origin.x + (Math.random() - 0.5) * 140,
        y: origin.y + (Math.random() - 0.5) * 40,
        w: 6 + Math.random() * 10,
        h: 4 + Math.random() * 6,
        color: colors[Math.floor(Math.random() * colors.length)],
        vx: (Math.random() - 0.5) * 6.2,
        vy: 1.8 + Math.random() * 3.4,
        angle: Math.random() * Math.PI * 2,
        spin: (Math.random() - 0.5) * 0.2
      };
    });
    let frame;
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      let any = false;
      pieces.forEach((piece) => {
        piece.x += piece.vx;
        piece.y += (piece.vy += 0.08);
        piece.angle += piece.spin;
        if (piece.y < canvas.height + 30) any = true;
        ctx.save();
        ctx.translate(piece.x, piece.y);
        ctx.rotate(piece.angle);
        ctx.fillStyle = piece.color;
        ctx.globalAlpha = Math.max(0, 1 - piece.y / canvas.height);
        ctx.fillRect(-piece.w / 2, -piece.h / 2, piece.w, piece.h);
        ctx.restore();
      });
      if (any) frame = requestAnimationFrameFn(draw);
      else ctx.clearRect(0, 0, canvas.width, canvas.height);
    };
    cancelAnimationFrameFn(frame);
    frame = requestAnimationFrameFn(draw);
    setTimeoutFn(() => {
      cancelAnimationFrameFn(frame);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }, 5500);
  }

  return {
    checkDuplicates,
    launchConfetti,
    launchStars,
    maybeDismissDupeToast,
    removeDupeToast
  };
}
