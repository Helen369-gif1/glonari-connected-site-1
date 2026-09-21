// Screen 7 — Gia. Scroll-driven appearance of the two quote messages over
// the video's lower third, plus a play-once-per-visit video (IntersectionObserver,
// not scroll position). Local to Screen 7 only: does not read from or
// depend on js/scrub.js, and does not touch Screen 1.

(function () {
  var section = document.getElementById('screen-7');
  if (!section) return;

  var wrapper = section.querySelector('.screen-gia__wrapper');
  var messages = section.querySelectorAll('.screen-gia__message');
  if (!wrapper || !messages.length) return;

  // Each message's reveal window, as a fraction of the wrapper's scroll
  // progress (0 = scene just entered, 1 = scene about to release).
  var RANGES = [
    { start: 0.22, end: 0.40 },
    { start: 0.52, end: 0.70 }
  ];

  // The scroll-driven scene only runs on viewports wide and tall enough
  // for the pinned composition to fit, and only without reduced motion.
  // This mirrors the CSS media query that pins .screen-gia__sticky.
  var mql = window.matchMedia(
    '(min-width: 1100px) and (min-height: 700px) and (prefers-reduced-motion: no-preference)'
  );

  var active = false;
  var ticking = false;

  function clamp01(value) {
    return Math.min(1, Math.max(0, value));
  }

  function smoothstep(t) {
    return t * t * (3 - 2 * t);
  }

  function applyProgress(progress) {
    for (var i = 0; i < messages.length; i++) {
      var range = RANGES[i];
      if (!range) continue;
      var raw = clamp01((progress - range.start) / (range.end - range.start));
      var t = smoothstep(raw);
      messages[i].style.opacity = String(t);
      messages[i].style.transform =
        'translateX(' + ((1 - t) * -20).toFixed(2) + 'px) scale(' + (0.95 + t * 0.05).toFixed(4) + ')';
    }
  }

  function resetInlineStyles() {
    for (var i = 0; i < messages.length; i++) {
      messages[i].style.opacity = '';
      messages[i].style.transform = '';
    }
  }

  function update() {
    ticking = false;
    if (!active) return;

    var rect = wrapper.getBoundingClientRect();
    var total = wrapper.offsetHeight - window.innerHeight;
    var progress = total > 0 ? clamp01(-rect.top / total) : 0;
    applyProgress(progress);
  }

  function requestUpdate() {
    if (!active || ticking) return;
    ticking = true;
    requestAnimationFrame(update);
  }

  function setActive(next) {
    if (active === next) return;
    active = next;

    if (active) {
      window.addEventListener('scroll', requestUpdate, { passive: true });
      window.addEventListener('resize', requestUpdate);
      update();
    } else {
      window.removeEventListener('scroll', requestUpdate);
      window.removeEventListener('resize', requestUpdate);
      resetInlineStyles();
    }
  }

  function evaluate() {
    setActive(mql.matches);
  }

  if (mql.addEventListener) {
    mql.addEventListener('change', evaluate);
  } else if (mql.addListener) {
    mql.addListener(evaluate);
  }

  evaluate();

  // Play-once-per-visit video: starts when ~30% of the video is visible,
  // plays through a single time, holds its last frame, and only resets
  // (pause + currentTime = 0) once the visitor has fully left Screen 7 —
  // a brief wobble around the 30% line does not replay or reset it.
  var video = section.querySelector('.screen-gia__video');
  if (video && 'IntersectionObserver' in window) {
    var hasPlayedThisVisit = false;

    function playOnce() {
      if (hasPlayedThisVisit) return;
      hasPlayedThisVisit = true;
      video.play().catch(function () {
        // Autoplay may be blocked by the browser; the poster frame stays
        // visible in that case, which is an acceptable static fallback.
      });
    }

    function resetVisit() {
      hasPlayedThisVisit = false;
      video.pause();
      video.currentTime = 0;
    }

    var visibilityObserver = new IntersectionObserver(
      function (entries) {
        if (entries[entries.length - 1].intersectionRatio >= 0.3) {
          playOnce();
        }
      },
      { threshold: 0.3 }
    );
    visibilityObserver.observe(video);

    var exitObserver = new IntersectionObserver(
      function (entries) {
        if (!entries[entries.length - 1].isIntersecting) {
          resetVisit();
        }
      },
      { threshold: 0 }
    );
    exitObserver.observe(section);
  }
})();
