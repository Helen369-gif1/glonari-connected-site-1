// Screen 4 rewards counter — a wide strip of small marks drifting right at
// constant speed, a few of them briefly brightening. Motion only: no digits,
// currency, percentages, or plus signs, and nothing that reads as a real
// balance. One 8s linear cycle; each mark wraps its own position modulo the
// strip width, so the field has no visible seam. Plays continuously while
// Screen 4 is on screen; pauses (not resets) while off screen.

function initCounter(el) {
  const canvas = el;
  const ctx = canvas.getContext('2d');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const CYCLE_MS = 8000;
  const MARK_COUNT = 42;
  const HIGHLIGHT_RATIO = 0.2;
  const MARK_ALPHA = 0.16;
  const HIGHLIGHT_ALPHA = 0.6;

  let dpr = Math.max(1, window.devicePixelRatio || 1);
  let width = 0;
  let height = 0;
  let rafId = null;
  let cycleStart = null;
  let pausedAt = null;
  let lastElapsed = 0;

  function tokenColor(name, fallback) {
    const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    return value || fallback;
  }

  function hexToRgb(hex) {
    const clean = hex.replace('#', '').trim();
    const full = clean.length === 3 ? clean.split('').map((c) => c + c).join('') : clean;
    const int = parseInt(full, 16);
    return `${(int >> 16) & 255}, ${(int >> 8) & 255}, ${int & 255}`;
  }

  // The token is a low-alpha divider color; reuse its RGB base but apply
  // our own alpha so marks stay legible on the void background.
  function rgbTriplet(rgbaStr, fallback) {
    const match = /rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)/.exec(rgbaStr);
    return match ? `${match[1]}, ${match[2]}, ${match[3]}` : fallback;
  }

  const markRgb = rgbTriplet(tokenColor('--gr-glass-line', 'rgba(255, 255, 255, 0.08)'), '255, 255, 255');
  const markRgba = `rgba(${markRgb}, ${MARK_ALPHA})`;
  const bronzeRgb = hexToRgb(tokenColor('--gr-bronze', '#cd7f32'));

  // Evenly spread, lightly jittered starting positions so the field looks
  // organic but never clumps or leaves bare gaps as it scrolls.
  const marks = Array.from({ length: MARK_COUNT }, (_, i) => ({
    x0: (i + 0.5) / MARK_COUNT + Math.sin(i * 12.9898) * 0.3 * (1 / MARK_COUNT),
    h: 0.28 + 0.32 * Math.abs(Math.sin(i * 3.7 + 1)),
    w: 3 + (i % 3),
    yJitter: Math.sin(i * 5.233) * 0.12,
    highlight: (i * 0.61803398875) % 1 < HIGHLIGHT_RATIO,
    flashPeriod: 3400 + (i % 5) * 800,
    flashPhase: (i * 137.5) % 1000,
  }));

  function resize() {
    dpr = Math.max(1, window.devicePixelRatio || 1);
    const rect = canvas.getBoundingClientRect();
    width = rect.width;
    height = rect.height;
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    render(lastElapsed, reduceMotion);
  }

  // staticMode freezes every mark at its resting position with highlighted
  // marks at full pulse — a complete composition, never a bare strip.
  function render(elapsedMs, staticMode) {
    if (!width || !height) return;
    ctx.clearRect(0, 0, width, height);
    const progress = staticMode ? 0 : (elapsedMs % CYCLE_MS) / CYCLE_MS;
    marks.forEach((mark) => {
      const x = ((mark.x0 + progress) % 1) * width;
      const midY = height / 2 + mark.yJitter * height;
      const barH = Math.max(4, mark.h * height);

      let color = markRgba;
      if (mark.highlight) {
        const cyclePos = ((elapsedMs + mark.flashPhase) % mark.flashPeriod) / mark.flashPeriod;
        const pulse = staticMode ? 1 : Math.pow(Math.max(0, Math.sin(Math.PI * cyclePos)), 2);
        if (pulse > 0.02) color = `rgba(${bronzeRgb}, ${(HIGHLIGHT_ALPHA * pulse).toFixed(3)})`;
      }

      ctx.fillStyle = color;
      ctx.beginPath();
      if (ctx.roundRect) {
        ctx.roundRect(x - mark.w / 2, midY - barH / 2, mark.w, barH, mark.w / 2);
      } else {
        ctx.rect(x - mark.w / 2, midY - barH / 2, mark.w, barH);
      }
      ctx.fill();
    });
  }

  function frame(now) {
    if (cycleStart === null) cycleStart = now;
    lastElapsed = now - cycleStart;
    render(lastElapsed, false);
    rafId = requestAnimationFrame(frame);
  }

  function play() {
    if (rafId !== null) return;
    if (pausedAt !== null && cycleStart !== null) {
      cycleStart += performance.now() - pausedAt;
      pausedAt = null;
    }
    rafId = requestAnimationFrame(frame);
  }

  function pause() {
    if (rafId === null) return;
    cancelAnimationFrame(rafId);
    rafId = null;
    pausedAt = performance.now();
  }

  window.addEventListener('resize', resize);
  resize();

  if (reduceMotion) return;

  const target = canvas.closest('[data-slot]') || canvas;
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => (entry.isIntersecting ? play() : pause()));
    },
    { threshold: 0 }
  );
  observer.observe(target);
}

(function bootstrap() {
  const canvas = document.querySelector('[data-slot="--media-counter"] canvas');
  if (canvas) initCounter(canvas);
})();
