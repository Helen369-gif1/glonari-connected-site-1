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
  if (!overlay) return;

  const logo = document.getElementById('intro-logo');
  const copy = document.getElementById('intro-copy');
  const cta = document.getElementById('intro-cta');

  // v2 (2026-09-21): the old choreography auto-exited once a fixed hold
  // had played AND the Campus's own `load` event had fired (see this
  // file's pre-2026-09-21 history for that arithmetic). That is gone now —
  // the reveal (logo → copy → button, via the GSAP timeline below) is the
  // *entire* automatic part. Once the button is visible, nothing further
  // happens on its own; the visitor has to click it (or activate it with
  // Enter/Space while it's focused, which a native <button> already does
  // without any extra code here) to call beginExit() below.
  const EXIT_FADE_MS = 1600; // matches #intro-overlay's opacity transition in intro.css

  let exited = false;

  function beginExit() {
    if (exited) return;
    exited = true;

    if (typeof gsap !== 'undefined') gsap.killTweensOf([logo, copy, cta]);

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

  if (cta) {
    cta.addEventListener('click', beginExit);
  }

  // Hard, last-resort failsafe: if something breaks — a rendering bug
  // hides the button, a future edit forgets to wire its click, etc. — the
  // visitor must still, eventually, reach the Campus underneath rather
  // than being stuck on a dark screen forever. Deliberately very far out
  // (60s) so it can never be confused with, or cut into, the ~1.5s reveal
  // or a visitor genuinely taking their time reading the copy before
  // clicking "explore".
  const HARD_CEILING_MS = 60000;
  window.setTimeout(beginExit, HARD_CEILING_MS);

  if (!logo || !copy || !cta) return;

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (typeof gsap === 'undefined') {
    // GSAP CDN request failed/blocked: fall back to the plain CSS
    // transition defined in intro.css under .intro-overlay-fallback
    // instead of leaving the logo/copy/button stuck at their CSS-default
    // opacity:0 — a blocked CDN should degrade the reveal, not strand the
    // visitor in front of an unusable screen with no visible "explore".
    overlay.classList.add('intro-overlay-fallback');
    return;
  }

  // Reveal choreography, built as one GSAP timeline (times below are
  // seconds from timeline start, i.e. from page load):
  //   1. Logo fades + scales in.
  //   2. Copy (headline + subhead, as a single block — see note below)
  //      starts fading/sliding in while the logo is still finishing, not
  //      after it settles.
  //   3. The "explore" button fades in last, again starting slightly
  //      before the copy above has fully settled.
  // Total time to a fully-settled button: 1.5s. Deliberately at the fast
  // end of the ~1.5-2.5s the brief asked for, not the middle/slow end —
  // the brief's own priority for this screen is "smooth but not slow
  // enough to annoy", and 0.5-0.7s per step already reads as a soft,
  // deliberate fade rather than a snap; stretching further would trade
  // that priority away for a marginally more cinematic feel nobody asked
  // for here.
  //
  // Headline and subhead are one animated unit (.intro-copy), not two
  // staggered tweens — tried separately first; at this overall pace the
  // gap between them read as a stutter rather than a considered beat, so
  // they were folded into a single fade+rise on the shared wrapper. This
  // is explicitly one of the two outcomes the brief allowed for.
  const tl = gsap.timeline();

  if (reducedMotion) {
    // Same relative order (logo, then copy, then button), each starting
    // before the previous one has fully settled, but as quick plain
    // opacity fades with no scale/slide — motion is what's being reduced,
    // not the sequence itself.
    tl.to(logo, { opacity: 1, duration: 0.3, ease: 'none' }, 0)
      .to(copy, { opacity: 1, duration: 0.3, ease: 'none' }, 0.15)
      .to(cta, { opacity: 1, visibility: 'visible', duration: 0.3, ease: 'none' }, 0.3);
  } else {
    tl.fromTo(logo, { opacity: 0, scale: 0.92 }, { opacity: 1, scale: 1, duration: 0.7, ease: 'power2.out' }, 0)
      .fromTo(copy, { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.7, ease: 'power2.out' }, 0.4)
      .fromTo(cta, { opacity: 0 }, { opacity: 1, visibility: 'visible', duration: 0.5, ease: 'power1.out' }, 1.0);
  }
})();
