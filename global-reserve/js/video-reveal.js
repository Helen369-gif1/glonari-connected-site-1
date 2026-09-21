// Screen 4.5 — scroll-controlled mask reveal over a looping video (Section 5.4a).
// The video itself is a plain autoplay/muted/loop element, playing on its
// own timeline — its currentTime is never touched by scroll, and this file
// never calls bindScrollToVideo() (js/scrub.js), which stays a Screen
// 1–only concern. Scroll drives only the clip-path window, the overlay
// darkness, and the headline reveal, via this section's own lightweight
// scroll-progress tracker below. No CSS zoom: the source footage already
// carries its own camera motion, and an added scale() transform amplified
// flicker in the night scene's fine detail — the video renders at a
// constant scale(1) always.

function initVideoReveal(section) {
  const wrapper = section.querySelector('.reveal-wrapper');
  const frame = section.querySelector('.reveal-frame');
  const video = section.querySelector('.reveal-video');
  const overlay = section.querySelector('.reveal-overlay');
  const fallback = section.querySelector('.reveal-fallback');
  const headline = section.querySelector('.reveal-headline');

  if (!wrapper || !frame || !video || !overlay || !headline) return;

  function showFallback() {
    video.hidden = true;
    if (fallback) fallback.hidden = false;
  }
  video.addEventListener('error', showFallback);

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ── Reduced motion ──
  // The design system requires a fully static composition here: turn off
  // autoplay/loop via JS and freeze the video on a single stable frame
  // (rather than leaving it playing, which the normal-motion path below
  // does deliberately). No IntersectionObserver-driven play either — it
  // simply stays paused. The mask stays fully open, the overlay rests at
  // its open-state alpha, and the headline is fully visible; that resting
  // state (no pin, no scroll-driven animation) comes from the
  // prefers-reduced-motion rules in css/screens.css.
  if (reduceMotion) {
    video.autoplay = false;
    video.loop = false;
    video.pause();
    video.currentTime = 0;
    headline.classList.add('is-static');
    return;
  }

  // ── Playback (normal motion only): a real, ordinary loop, gated only by
  // visibility ──
  // The `autoplay` attribute starts it as soon as it can; this observer's
  // job is only to pause it once the section is fully out of view and
  // resume it on return, so it never plays unnecessarily off-screen. It
  // never seeks or restarts it — pause/play only.
  const visibilityObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          video.play().catch(() => {});
        } else {
          video.pause();
        }
      });
    },
    { threshold: 0 }
  );
  visibilityObserver.observe(section);

  // ── Headline per-word reveal ──
  // Same technique as Screen 1's hero text (split into one <span> per word,
  // then a paused GSAP timeline driven by .time()) — but implemented here
  // locally rather than shared, since Screen 1's own copy in js/scrub.js is
  // locked and off-limits to refactor. Driven by scroll progress (0-1)
  // rather than seconds — GSAP's timeline units are arbitrary, so this
  // works the same way.
  function splitHeadlineIntoWords(el) {
    const text = el.textContent;
    el.innerHTML = text
      .split(/(\s+)/)
      .map((chunk) => (chunk.trim() ? `<span class="word">${chunk}</span>` : chunk))
      .join('');
    return Array.from(el.querySelectorAll('.word'));
  }

  const words = splitHeadlineIntoWords(headline);
  const WORD_IN_Y = 36;
  const WORD_OUT_Y = -26;
  const HEADLINE_IN_START = 0.42;
  const WORD_FADE_IN = 0.09;
  const WORD_STAGGER_IN = 0.012;
  // Out-phase is tuned to its own target window (fade starts ~70%, fully
  // gone by ~82%) rather than reusing the in-phase's timing.
  const HEADLINE_OUT_START = 0.7;
  const WORD_FADE_OUT = 0.07;
  const WORD_STAGGER_OUT = 0.01;

  const headlineTimeline = gsap.timeline({ paused: true });
  if (words.length) {
    headlineTimeline.fromTo(
      words,
      { opacity: 0, y: WORD_IN_Y },
      { opacity: 1, y: 0, duration: WORD_FADE_IN, ease: 'power3.out', stagger: WORD_STAGGER_IN },
      HEADLINE_IN_START
    );
    headlineTimeline.to(
      words,
      { opacity: 0, y: WORD_OUT_Y, duration: WORD_FADE_OUT, ease: 'power2.in', stagger: WORD_STAGGER_OUT },
      HEADLINE_OUT_START
    );
  }
  headlineTimeline.time(0);

  // ── Clip-path window and overlay ──
  const EXPAND_END = 0.45; // frame finishes expanding to full-bleed
  const HOLD_END = 0.7; // frame starts contracting again
  const START_INSET = { edge: 43, side: 36, radius: 16 }; // matches the supplied reference's window proportions
  // Closes to a wide panoramic band (~60% width x ~40% height), never
  // fully closing and never staying near full-screen.
  const END_INSET = { edge: 30, side: 20, radius: 20 };
  const OVERLAY_FADE_START = 0.42;
  const OVERLAY_FADE_END = 0.55;
  const OVERLAY_HOLD_ALPHA = 0.35;
  const OVERLAY_END_ALPHA = 0.6;

  function lerp(a, b, t) {
    return a + (b - a) * t;
  }
  function clamp01(v) {
    return Math.min(Math.max(v, 0), 1);
  }

  function applyFrame(progress) {
    let top;
    let side;
    let radius;

    if (progress <= EXPAND_END) {
      const t = clamp01(progress / EXPAND_END);
      top = lerp(START_INSET.edge, 0, t);
      side = lerp(START_INSET.side, 0, t);
      radius = lerp(START_INSET.radius, 0, t);
    } else if (progress <= HOLD_END) {
      top = 0;
      side = 0;
      radius = 0;
    } else {
      const t = clamp01((progress - HOLD_END) / (1 - HOLD_END));
      top = lerp(0, END_INSET.edge, t);
      side = lerp(0, END_INSET.side, t);
      radius = lerp(0, END_INSET.radius, t);
    }
    frame.style.clipPath = `inset(${top}% ${side}% ${top}% ${side}% round ${radius}px)`;

    let overlayAlpha;
    if (progress <= OVERLAY_FADE_START) {
      overlayAlpha = 0;
    } else if (progress <= OVERLAY_FADE_END) {
      const t = clamp01((progress - OVERLAY_FADE_START) / (OVERLAY_FADE_END - OVERLAY_FADE_START));
      overlayAlpha = lerp(0, OVERLAY_HOLD_ALPHA, t);
    } else if (progress <= HOLD_END) {
      overlayAlpha = OVERLAY_HOLD_ALPHA;
    } else {
      const t = clamp01((progress - HOLD_END) / (1 - HOLD_END));
      overlayAlpha = lerp(OVERLAY_HOLD_ALPHA, OVERLAY_END_ALPHA, t);
    }
    overlay.style.opacity = String(overlayAlpha);

    headlineTimeline.time(progress);
  }

  bindScrollProgress(wrapper, applyFrame, { smoothingBase: 0.001 });
}

// ── Scroll-progress tracker (mask/overlay/headline only) ──
// Deliberately separate from bindScrollToVideo() in js/scrub.js: that
// function couples scroll progress to a video's currentTime, which this
// section must never do. This is the same progress math (scroll fraction
// through the wrapper's own scrollable range, exponentially smoothed so
// fast/slow scrolling both animate the mask without snapping or jitter),
// minus everything video-seek-related.
function bindScrollProgress(wrapper, onProgress, options = {}) {
  const { smoothingBase = 0.001 } = options;

  let latestProgress = 0;
  let smoothedProgress = 0;
  let lastFrameTimestamp = null;
  let ticking = false;

  function getProgress() {
    const rect = wrapper.getBoundingClientRect();
    const scrollable = wrapper.offsetHeight - window.innerHeight;
    if (scrollable <= 0) return 0;
    return Math.min(Math.max(-rect.top / scrollable, 0), 1);
  }

  function update() {
    latestProgress = getProgress();
  }

  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      update();
      ticking = false;
    });
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  update();

  function frame(timestamp) {
    const deltaTime = lastFrameTimestamp === null ? 0 : (timestamp - lastFrameTimestamp) / 1000;
    lastFrameTimestamp = timestamp;

    const smoothingFactor = 1 - Math.pow(smoothingBase, deltaTime);
    smoothedProgress += (latestProgress - smoothedProgress) * smoothingFactor;

    onProgress(smoothedProgress);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}

(function bootstrap() {
  const section = document.getElementById('screen-4-5');
  if (section) initVideoReveal(section);
})();
