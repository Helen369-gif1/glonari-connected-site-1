// Screen 8 marquee (Section 5.8). Controls only Screen 8: the entrance
// reveal on the centered header, and pausing the ticker track while the
// section is fully outside the viewport. Independent of js/scrub.js.

(function () {
  'use strict';

  var section = document.getElementById('screen-8');
  if (!section) return;

  var header = section.querySelector('.screen-transparency__header');
  var track = section.querySelector('.ticker__track');
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (header && 'IntersectionObserver' in window) {
    var revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          header.classList.add('is-visible');
          revealObserver.disconnect();
        }
      });
    }, { threshold: 0.25 });
    revealObserver.observe(section);
  } else if (header) {
    header.classList.add('is-visible');
  }

  if (track && !reduceMotion && 'IntersectionObserver' in window) {
    var tickerObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        track.style.animationPlayState = entry.isIntersecting ? 'running' : 'paused';
      });
    }, { threshold: 0 });
    tickerObserver.observe(section);
  }
})();
