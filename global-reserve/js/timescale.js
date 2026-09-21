// Screen 2 balance-to-time animation.
// A cluster of bronze bars re-forms into a horizontal timeline, several
// nodes light up along it, a pulse sweeps across, and the composition
// eases back to the bar scene — a single seamless ~7s loop. Plays
// continuously while Screen 2 is on screen; pauses (not resets) while
// off screen. No numbers, currency, or labels — motion and composition
// only.

function initTimeScale(el) {
  const canvas = el;
  const ctx = canvas.getContext('2d');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const CYCLE_MS = 7000;
  const BAR_COUNT = 9;
  const NODE_COUNT = 5;
  const PARTICLE_COUNT = 14;

  // Cycle phases, as fractions of CYCLE_MS. morphAt() below is 0 at both
  // t=0 and t=1, so the loop wraps with no visible jump.
  const FORM_END = 0.16;   // bars re-form into the line
  const HOLD_END = 0.58;   // line fully formed — nodes light up, pulse sweeps
  const RETURN_END = 0.86; // line eases back into bars
  // [RETURN_END, 1] is a brief rest in the bar scene before the wrap.

  let dpr = Math.max(1, window.devicePixelRatio || 1);
  let width = 0;
  let height = 0;
  let rafId = null;
  let cycleStart = null; // performance.now() when the current cycle began
  let pausedAt = null;   // performance.now() when playback was paused
  let lastT = 0;         // most recent 0..1 cycle position, reused on resize

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

  const bronzeRgb = hexToRgb(tokenColor('--gr-bronze', '#cd7f32'));
  const voidDeep = tokenColor('--gr-void-deep', '#08090d');

  const bars = Array.from({ length: BAR_COUNT }, (_, i) => ({
    seed: 0.35 + 0.55 * Math.abs(Math.sin((i + 1) * 1.7)),
    wobblePhase: i * 0.9,
  }));

  const nodePositions = Array.from({ length: NODE_COUNT }, (_, i) => i / (NODE_COUNT - 1));

  const particles = Array.from({ length: PARTICLE_COUNT }, () => ({
    x: Math.random(),
    y: Math.random(),
    r: 0.6 + Math.random() * 1.6,
    speed: 0.02 + Math.random() * 0.04,
    phase: Math.random() * Math.PI * 2,
  }));

  function smoothstep(a, b, x) {
    const t = Math.min(Math.max((x - a) / (b - a), 0), 1);
    return t * t * (3 - 2 * t);
  }

  // 0 = bar scene, 1 = fully-formed timeline.
  function morphAt(t) {
    if (t < FORM_END) return smoothstep(0, FORM_END, t);
    if (t < HOLD_END) return 1;
    if (t < RETURN_END) return 1 - smoothstep(HOLD_END, RETURN_END, t);
    return 0;
  }

  function resize() {
    dpr = Math.max(1, window.devicePixelRatio || 1);
    const rect = canvas.getBoundingClientRect();
    width = rect.width;
    height = rect.height;
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (reduceMotion) {
      drawStaticReducedMotion();
    } else {
      draw(lastT, 0);
    }
  }

  function drawBackground() {
    ctx.fillStyle = voidDeep;
    ctx.fillRect(0, 0, width, height);

    // Faint static grid — texture only, never animates.
    ctx.strokeStyle = `rgba(${bronzeRgb}, 0.06)`;
    ctx.lineWidth = 1;
    const cols = 6;
    const rows = 6;
    for (let c = 1; c < cols; c++) {
      const x = (width / cols) * c;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let r = 1; r < rows; r++) {
      const y = (height / rows) * r;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
  }

  function drawParticles(elapsedMs) {
    ctx.save();
    particles.forEach((p) => {
      const drift = Math.sin(elapsedMs * 0.0002 + p.phase);
      const x = ((p.x + elapsedMs * 0.00001 * p.speed) % 1) * width;
      const y = (p.y + drift * 0.02) * height;
      const twinkle = 0.25 + 0.35 * (0.5 + 0.5 * Math.sin(elapsedMs * 0.0015 + p.phase));
      ctx.fillStyle = `rgba(${bronzeRgb}, ${twinkle.toFixed(3)})`;
      ctx.beginPath();
      ctx.arc(x, y, p.r, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.restore();
  }

  function drawBars(morph, elapsedMs) {
    const alpha = 1 - morph;
    if (alpha <= 0.01) return;
    const midY = height / 2;
    const gap = width / (BAR_COUNT + 1);
    const maxBarHeight = height * 0.55;
    const barW = Math.max(3, gap * 0.32);

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = `rgb(${bronzeRgb})`;
    ctx.shadowColor = `rgba(${bronzeRgb}, 0.5)`;
    ctx.shadowBlur = 10;
    bars.forEach((bar, i) => {
      const wobble = 0.85 + 0.15 * Math.sin(elapsedMs * 0.0006 + bar.wobblePhase);
      const barH = maxBarHeight * bar.seed * wobble * (1 - morph * 0.5);
      const x = gap * (i + 1) - barW / 2;
      ctx.fillRect(x, midY - barH / 2, barW, barH);
    });
    ctx.restore();
  }

  function timelineGeometry() {
    const midY = height / 2;
    const lineLength = width * 0.82;
    const startX = (width - lineLength) / 2;
    return { midY, lineLength, startX };
  }

  function drawTimeline(morph) {
    if (morph <= 0.01) return null;
    const { midY, lineLength, startX } = timelineGeometry();
    const drawnLength = lineLength * morph;
    const drawnStart = startX + (lineLength - drawnLength) / 2;

    ctx.save();
    ctx.globalAlpha = morph;
    ctx.strokeStyle = `rgb(${bronzeRgb})`;
    ctx.lineWidth = Math.max(1.5, height * 0.006);
    ctx.shadowColor = `rgba(${bronzeRgb}, 0.6)`;
    ctx.shadowBlur = 14;
    ctx.beginPath();
    ctx.moveTo(drawnStart, midY);
    ctx.lineTo(drawnStart + drawnLength, midY);
    ctx.stroke();
    ctx.restore();

    return { midY, startX, lineLength };
  }

  function drawNodes(t, morph, geometry) {
    if (!geometry || morph < 0.98) return;
    const { midY, startX, lineLength } = geometry;
    const holdSpan = HOLD_END - FORM_END;
    const localT = Math.min(Math.max((t - FORM_END) / holdSpan, 0), 1);

    nodePositions.forEach((pos, i) => {
      const onAt = (i / NODE_COUNT) * 0.7;
      const glow = smoothstep(onAt, onAt + 0.12, localT) * (1 - smoothstep(0.92, 1, localT) * 0.3);
      if (glow <= 0.02) return;
      const x = startX + lineLength * pos;
      ctx.save();
      ctx.globalAlpha = glow;
      ctx.fillStyle = `rgb(${bronzeRgb})`;
      ctx.shadowColor = `rgba(${bronzeRgb}, 0.9)`;
      ctx.shadowBlur = 18;
      ctx.beginPath();
      ctx.arc(x, midY, Math.max(3, height * 0.012), 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });
  }

  function drawPulse(t, morph, geometry) {
    if (!geometry || morph < 0.98) return;
    const holdSpan = HOLD_END - FORM_END;
    const localT = Math.min(Math.max((t - FORM_END) / holdSpan, 0), 1);
    if (localT <= 0 || localT >= 1) return;
    const { midY, startX, lineLength } = geometry;
    const x = startX + lineLength * smoothstep(0, 1, localT);
    const fade = Math.sin(Math.PI * localT); // 0 -> 1 -> 0 across the sweep

    ctx.save();
    const gradient = ctx.createRadialGradient(x, midY, 0, x, midY, height * 0.09);
    gradient.addColorStop(0, `rgba(${bronzeRgb}, ${(0.9 * fade).toFixed(3)})`);
    gradient.addColorStop(1, `rgba(${bronzeRgb}, 0)`);
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(x, midY, height * 0.09, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = `rgb(${bronzeRgb})`;
    ctx.shadowColor = `rgba(${bronzeRgb}, 1)`;
    ctx.shadowBlur = 20;
    ctx.beginPath();
    ctx.arc(x, midY, Math.max(2.5, height * 0.01), 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function draw(t, elapsedMs) {
    if (!width || !height) return;
    const morph = morphAt(t);
    ctx.clearRect(0, 0, width, height);
    drawBackground();
    drawParticles(elapsedMs);
    drawBars(morph, elapsedMs);
    const geometry = drawTimeline(morph);
    drawNodes(t, morph, geometry);
    drawPulse(t, morph, geometry);
  }

  function drawStaticReducedMotion() {
    // One fixed composite frame: bars at rest, a fully formed timeline, a
    // few lit nodes, and one static accent pulse — several elements
    // always read at once, never a bare line.
    if (!width || !height) return;
    ctx.clearRect(0, 0, width, height);
    drawBackground();
    drawParticles(0);
    drawBars(0.35, 0);
    const geometry = drawTimeline(1);
    if (!geometry) return;
    const { midY, startX, lineLength } = geometry;

    nodePositions.forEach((pos, i) => {
      if (i % 2 === 1 && i !== NODE_COUNT - 1) return; // a few lit, not all
      const x = startX + lineLength * pos;
      ctx.save();
      ctx.globalAlpha = 0.9;
      ctx.fillStyle = `rgb(${bronzeRgb})`;
      ctx.shadowColor = `rgba(${bronzeRgb}, 0.9)`;
      ctx.shadowBlur = 16;
      ctx.beginPath();
      ctx.arc(x, midY, Math.max(3, height * 0.012), 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });

    const pulseX = startX + lineLength * 0.68;
    ctx.save();
    const gradient = ctx.createRadialGradient(pulseX, midY, 0, pulseX, midY, height * 0.09);
    gradient.addColorStop(0, `rgba(${bronzeRgb}, 0.85)`);
    gradient.addColorStop(1, `rgba(${bronzeRgb}, 0)`);
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(pulseX, midY, height * 0.09, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function frame(now) {
    if (cycleStart === null) cycleStart = now;
    const elapsed = now - cycleStart;
    const t = (elapsed % CYCLE_MS) / CYCLE_MS;
    lastT = t;
    draw(t, elapsed);
    rafId = requestAnimationFrame(frame);
  }

  function play() {
    if (rafId !== null) return;
    if (pausedAt !== null && cycleStart !== null) {
      // Shift the cycle clock forward by the paused duration so playback
      // resumes exactly where it left off instead of jumping or resetting.
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

  if (reduceMotion) {
    drawStaticReducedMotion();
    return;
  }

  const target = canvas.closest('[data-slot]') || canvas;
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          play();
        } else {
          pause();
        }
      });
    },
    { threshold: 0 }
  );
  observer.observe(target);
}

(function bootstrap() {
  const canvas = document.querySelector('[data-slot="--media-question"] canvas');
  if (canvas) initTimeScale(canvas);
})();
