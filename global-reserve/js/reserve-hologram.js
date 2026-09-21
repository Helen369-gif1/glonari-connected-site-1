// Screen 5.5 — Reserve Hologram in the Vault (Build Spec Section 5.5a).
// Independent of Screen 1's scroll-scrub (js/scrub.js) and of Screen 4.5's
// mask reveal (js/video-reveal.js) — this file imports nothing from either
// and is not imported by them. One local initReserveHologram(section)
// bootstrapped only for #screen-5-5; no globals.
//
// Two independent jobs happen here:
//
// 1. Stage scale — the panel/beam/glow live in one 1920x1080 "stage" that
//    must crop and scale exactly like the full-bleed background photo
//    (object-fit: cover) so they stay pixel-locked to it at any viewport
//    size. cover-scale = max(containerWidth/1920, containerHeight/1080) —
//    the same formula a `cover`-fit image uses — applied as a single
//    transform: scale() on the stage. This only runs above the 960px
//    breakpoint; below it css/reserve-hologram.css drops the stage
//    transform entirely in favor of a normal responsive layout.
//
// 2. Scroll reveal — a single paused GSAP timeline whose "seconds" are
//    treated as a 0-1 fraction of the section's own scroll range (same
//    trick as js/video-reveal.js's headline timeline), rendered with
//    tl.time(value) — not tl.progress(value), since .progress() normalizes
//    against the timeline's own total duration, which is shorter than 1
//    now that there's no exit-fade tween stretching it out. .time() keeps
//    every phase boundary matching its documented number. The progress
//    ring is handled separately from the timeline: its image is the exact
//    source asset (disc + outer glow + the baked 82% gold arc), revealed by
//    sweeping a conic-gradient mask around it rather than redrawn.
//
// There is no exit fade: every tween below only ever brings something IN.
// Once the last one finishes, nothing further is scheduled, so the fully
// assembled panel simply holds — it only leaves the viewport because the
// sticky pin itself ends.
//
// Unlike js/video-reveal.js, there is no continuous requestAnimationFrame
// loop running while this section is off-screen: a scroll/resize event
// schedules at most one rAF-batched update, and that's it.

function initReserveHologram(section) {
  const wrapper = section.querySelector('.reserve-hologram__wrapper');
  const sticky = section.querySelector('.reserve-hologram__sticky');
  const stage = section.querySelector('.reserve-hologram__stage');
  const panel = section.querySelector('.reserve-hologram__panel');
  const beam = section.querySelector('.reserve-hologram__beam');
  const baseGlow = section.querySelector('.reserve-hologram__base-glow');
  const headerLines = section.querySelector('.reserve-hologram__header-elements');
  const eyebrow = section.querySelector('.reserve-hologram__eyebrow');
  const heading = section.querySelector('.reserve-hologram__heading');
  const disclaimer = section.querySelector('.reserve-hologram__disclaimer');
  const dividers = Array.from(section.querySelectorAll('.reserve-hologram__divider'));
  const footer = section.querySelector('.reserve-hologram__footer');
  const ring = section.querySelector('.reserve-hologram__ring');
  const ringImg = section.querySelector('.reserve-hologram__ring-img');
  const ringPercent = section.querySelector('.reserve-hologram__ring-percent');
  const ringLabel = section.querySelector('.reserve-hologram__ring-label');

  const statOrder = ['ready', 'reserved', 'scheduled', 'committed'];
  const stats = statOrder
    .map((state) => section.querySelector(`.reserve-hologram__stat[data-state="${state}"]`))
    .filter(Boolean);

  if (!wrapper || !sticky || !stage || !panel) return;

  // ── 1. Stage scale (cover-fit, same crop math as object-fit: cover) ──
  function applyStageScale() {
    const rect = sticky.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const scale = Math.max(rect.width / 1920, rect.height / 1080);
    stage.style.transform = `translate(-50%, -50%) scale(${scale})`;
  }

  // ── 2. Scroll-driven reveal ──
  const tl = gsap.timeline({ paused: true });

  // 0.00-0.10 — vault and rest state only; nothing scheduled here.

  // 0.10-0.24 — projector glow and the correctly-oriented projection beam
  tl.fromTo([beam, baseGlow], { opacity: 0 }, { opacity: 1, duration: 0.14, ease: 'power1.out' }, 0.1);

  // 0.18-0.40 — the original background and panel frame build in
  tl.fromTo(panel, { opacity: 0, y: 22 }, { opacity: 1, y: 0, duration: 0.22, ease: 'power2.out' }, 0.18);

  // 0.30-0.495 — header: eyebrow, heading, disclaimer, header lines, dividers
  tl.fromTo(
    [headerLines, eyebrow, heading, disclaimer, ...dividers],
    { opacity: 0, y: 12 },
    { opacity: 1, y: 0, duration: 0.12, ease: 'power2.out', stagger: 0.015 },
    0.3
  );

  // 0.40-0.46 — the ring container powers on (opacity + small scale only;
  // the arc image itself is revealed separately below via a mask sweep)
  tl.fromTo(ring, { opacity: 0, scale: 0.94 }, { opacity: 1, scale: 1, duration: 0.06, ease: 'power1.out' }, 0.4);

  // 0.50-0.62 — the centre value and label
  tl.fromTo(
    [ringPercent, ringLabel],
    { opacity: 0, y: 10 },
    { opacity: 1, y: 0, duration: 0.12, ease: 'power2.out', stagger: 0.04 },
    0.5
  );

  // 0.58-0.815 — state summaries reveal in order: Ready, Reserved,
  // Scheduled, Committed (locked reveal order from Build Spec Section 5.5a)
  if (stats.length) {
    tl.fromTo(stats, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.1, ease: 'power2.out', stagger: 0.045 }, 0.58);
  }

  // 0.78-0.86 — the "Explore the example" line and its underline, last
  tl.fromTo(footer, { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: 0.08, ease: 'power2.out' }, 0.78);

  // 0.86-1.00 — the complete composition holds. No exit fade: nothing is
  // scheduled here or beyond, so every element simply stays at the value
  // its last tween left it at.

  // ── Progress ring arc: a conic-gradient mask sweep, not a redraw ──
  // The image is the exact source asset with the 82% gold arc already
  // baked in; sweeping the mask from 0deg to 360deg over its own window
  // reveals the whole ring (disc, outer glow, and arc together) exactly as
  // designed, in both directions, purely as a function of progress.
  const RING_SWEEP_START = 0.42;
  const RING_SWEEP_END = 0.6;

  function clamp01(value) {
    return Math.min(Math.max(value, 0), 1);
  }

  function applyRingSweep(progress) {
    if (!ringImg) return;
    const t = clamp01((progress - RING_SWEEP_START) / (RING_SWEEP_END - RING_SWEEP_START));
    const eased = 1 - Math.pow(1 - t, 3);
    ringImg.style.setProperty('--rh-ring-sweep', `${eased * 360}deg`);
  }

  function renderAtProgress(progress) {
    tl.time(progress);
    applyRingSweep(progress);
  }

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (reduceMotion) {
    // Fully static hold: no pin (handled by the reduced-motion CSS), no
    // scroll listener. Land past every reveal so the panel, header,
    // dividers, ring, all four summaries, and the footer line render at
    // their resting, fully-visible state in one render. The ring's mask is
    // also removed entirely by the reduced-motion CSS as a static fallback.
    applyStageScale();
    renderAtProgress(0.95);
    return;
  }

  function getProgress() {
    const rect = wrapper.getBoundingClientRect();
    const scrollable = wrapper.offsetHeight - window.innerHeight;
    if (scrollable <= 0) return 0;
    return clamp01(-rect.top / scrollable);
  }

  let ticking = false;
  function onScrollOrResize() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      applyStageScale();
      renderAtProgress(getProgress());
      ticking = false;
    });
  }

  window.addEventListener('scroll', onScrollOrResize, { passive: true });
  window.addEventListener('resize', onScrollOrResize, { passive: true });

  applyStageScale();
  renderAtProgress(getProgress());
}

(function bootstrap() {
  const section = document.getElementById('screen-5-5');
  if (section) initReserveHologram(section);
})();
