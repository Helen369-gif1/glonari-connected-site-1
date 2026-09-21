(() => {
  'use strict';

  // Branded intro (shared: desktop main.js's index.html + mobile/main.js's
  // mobile/index.html) — see intro.css for the visual states this toggles
  // and index.html/mobile/index.html for the inline <head> script that
  // decides, per page load, whether the intro runs at all.
  //
  // That decision already happened synchronously, before this (deferred)
  // script ever runs: a normal load or manual reload leaves `intro-active`
  // on <html>; an automatic live device-gate redirect (desktop<->mobile,
  // triggered by the existing 'change'-event listener in either page, NOT
  // by the initial synchronous check) consumes a one-shot sessionStorage
  // marker instead and never adds the class — so this script has nothing
  // to do on that landing page.
  const root = document.documentElement;
  if (!root.classList.contains('intro-active')) return;

  const overlay = document.getElementById('intro-overlay');
  const circle = document.getElementById('intro-circle');
  const text = document.getElementById('intro-text');
  if (!overlay) return;

  // Fixed choreography, in ms — see intro.css for the matching CSS
  // transition durations/easing each step drives. This is now a
  // deliberately slow, scripted sequence (not "however long it takes to
  // settle"), so every stage's wall-clock length is named here instead of
  // left as a magic number inside MIN_DISPLAY_MS's own math below:
  //   1. Globe fades/scales in over GLOBE_FADE_MS, starting at t=0.
  //   2. Text starts fading in at TEXT_START_MS (a deliberate ~200ms
  //      overlap with the globe's own transition, not a hard sequential
  //      wait), taking TEXT_FADE_MS to finish.
  //   3. Once both are visually settled, hold with no visual change for
  //      HOLD_MS.
  //   4. Exit: fade the whole overlay (globe + text together, one
  //      opacity transition on #intro-overlay — see intro.css) out over
  //      EXIT_FADE_MS.
  const GLOBE_FADE_MS = 2400;
  const TEXT_START_MS = 2200;
  const TEXT_FADE_MS = 2000;
  const HOLD_MS = 2000;
  const EXIT_FADE_MS = 1600;

  // Minimum time the composition stays visible before exit is even
  // eligible to begin — steps 1-3 above, back to back: both the globe and
  // the text must be fully settled (whichever of the two finishes later),
  // then the fixed hold on top of that. With the values above:
  //   settled = max(GLOBE_FADE_MS, TEXT_START_MS + TEXT_FADE_MS)
  //           = max(2400, 2200 + 2000) = max(2400, 4200) = 4200
  //   MIN_DISPLAY_MS = settled + HOLD_MS = 4200 + 2000 = 6200
  // This intentionally no longer means "at least this long, cut short if
  // the Campus is ready sooner" the way the old, much shorter value did —
  // steps 1-3 are a fixed choreography that plays in full every time.
  const MIN_DISPLAY_MS = Math.max(GLOBE_FADE_MS, TEXT_START_MS + TEXT_FADE_MS) + HOLD_MS;

  // Hard ceiling so the intro can never sit indefinitely waiting on a
  // readiness signal that never fires — a genuine fallback, not the
  // expected exit path. Set comfortably (1800ms) above MIN_DISPLAY_MS
  // rather than the old fixed 3.5s, which would now be LOWER than the
  // choreography's own minimum and would cut it off mid-hold (or worse,
  // mid-text-fade-in) on every single load: MIN_DISPLAY_MS (6200) + 1800
  // = 8000. On the normal path (Campus ready by 6200ms), total time from
  // load to fully-removed overlay is MIN_DISPLAY_MS + EXIT_FADE_MS = 6200
  // + 1600 = 7800ms (~7.8s) — the four-step choreography above, in full,
  // never visually truncated.
  const HARD_CEILING_MS = MIN_DISPLAY_MS + 1800;

  // Readiness signal: neither main.js exposes a custom "ready"/"assets
  // loaded" event, so the most reliable existing signal without
  // restructuring either app is the page's own `load` event — it only
  // fires once every eager-loaded image (sky/plaza/buildings on desktop,
  // sky/ground/fountain/eager carousel frames on mobile) has actually
  // finished, and does NOT wait on the `loading="lazy"` mobile frames
  // that aren't visible yet.

  let exited = false;
  let minDisplayDone = false;
  let readyDone = false;

  function tryExit() {
    if (exited || !minDisplayDone || !readyDone) return;
    beginExit();
  }

  function beginExit() {
    if (exited) return;
    exited = true;

    // Step 4: no separate "mark enlarges" beat — once the hold ends, the
    // whole overlay (globe + text, already at their settled resting
    // state) fades to transparent together via the existing `.intro-exit`
    // opacity transition (EXIT_FADE_MS, see intro.css).
    overlay.classList.add('intro-exit');

    // Once that fade transition has actually completed, fully disable the
    // overlay and remove it from the DOM — never left as a stray
    // `opacity: 0` element that could still block input.
    window.setTimeout(() => {
      overlay.classList.add('intro-done');
      root.classList.remove('intro-active');
      overlay.remove();
    }, EXIT_FADE_MS);
  }

  // Step 1: fade the globe in with its subtle scale-in settle (no
  // rotation — dropped from the animation entirely, see intro.css; reduced
  // motion drops the scale-in too, leaving a plain fade, but the timing
  // below fires at the exact same wall-clock times either way).
  requestAnimationFrame(() => {
    if (circle) circle.classList.add('is-in');
  });

  // Step 2: welcome/brand text starts fading in at TEXT_START_MS — a
  // deliberate slight overlap with the globe's still-finishing transition
  // (GLOBE_FADE_MS), not a hard sequential wait for it.
  window.setTimeout(() => {
    if (text) text.classList.add('is-in');
  }, TEXT_START_MS);

  // Step 3 (fixed hold, see MIN_DISPLAY_MS's own comment above for the
  // arithmetic): exit becomes eligible only once BOTH this fixed
  // choreography and Campus readiness have completed — whichever finishes
  // last decides when, via tryExit() below — bounded by the hard ceiling.
  window.setTimeout(() => {
    minDisplayDone = true;
    tryExit();
  }, MIN_DISPLAY_MS);

  if (document.readyState === 'complete') {
    readyDone = true;
  } else {
    window.addEventListener(
      'load',
      () => {
        readyDone = true;
        tryExit();
      },
      { once: true }
    );
  }

  window.setTimeout(beginExit, HARD_CEILING_MS);
})();
