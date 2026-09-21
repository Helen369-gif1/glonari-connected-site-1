(() => {
  const video = document.getElementById('scrub-video');
  const wrapper = document.querySelector('.chapters-wrapper');
  const scrollCue = document.getElementById('scroll-cue');

  let videoDuration = 0;
  let videoReady = false;
  let latestProgress = 0;

  // ── Scroll cue fade ──
  // Same ramp()/smoothstep() technique as digital-banker/gia/index.html's
  // .cue: fully visible through CUE_FADE_START of this screen's own local
  // progress (getProgress(), below -- .chapters-wrapper only, never the
  // whole page), then eases out over the next span. Values match GIA's
  // tuned fix exactly, so the same "gone after one light scroll tick" bug
  // isn't reintroduced here.
  const CUE_FADE_START = 0.045;
  const CUE_FADE_END = 0.09;

  function clamp01(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }
  function smoothstep(v) { return v * v * (3 - 2 * v); }
  function ramp(t, a, b) {
    if (b <= a) return t >= b ? 1 : 0;
    return smoothstep(clamp01((t - a) / (b - a)));
  }

  // ── Text block timecoding (global_reserve_timecoding.md) ──
  // A single GSAP timeline (paused, driven manually by .time()) holds every
  // word tween in one shared clock. Each block has its own independent
  // in/out start time (video-time seconds) — no crossfade: block 1 must be
  // fully faded out before block 2 starts fading in, so there's always a
  // brief gap with no text on screen between them.
  const FADE_DURATION = 0.7;      // seconds, each word's own tween
  const WORD_STAGGER = 0.03;      // seconds between neighboring words starting
  const WORD_IN_Y = 36;           // px, fade-in starts this far below rest position
  const WORD_OUT_Y = -26;         // px, fade-out ends this far above rest position

  const BLOCK1_IN_START = 0.0;    // video-time (s) block 1 starts appearing
  const BLOCK1_OUT_START = 1.1;   // video-time (s) block 1 starts disappearing
  const BLOCK2_IN_START = 1.9;    // video-time (s) block 2 starts appearing
  const BLOCK2_OUT_START = 4.2;   // video-time (s) block 2 starts disappearing

  const pageLoadTime = performance.now() / 1000;

  function splitTextIntoWords(el) {
    const text = el.textContent;
    el.innerHTML = text
      .split(/(\s+)/)
      .map(chunk => (chunk.trim() ? `<span class="word">${chunk}</span>` : chunk))
      .join('');
    return Array.from(el.querySelectorAll('.word'));
  }

  const textBlocks = [
    { el: document.getElementById('text-block-1') },
    { el: document.getElementById('text-block-2') },
  ]
    .filter(b => b.el)
    .map(b => ({ ...b, words: splitTextIntoWords(b.el.querySelector('p')) }));

  const [block1, block2] = textBlocks;

  const textTimeline = gsap.timeline({ paused: true });

  if (block1 && block1.words.length) {
    textTimeline.fromTo(
      block1.words,
      { opacity: 0, y: WORD_IN_Y },
      { opacity: 1, y: 0, duration: FADE_DURATION, ease: 'power3.out', stagger: WORD_STAGGER },
      BLOCK1_IN_START
    );
    textTimeline.to(
      block1.words,
      { opacity: 0, y: WORD_OUT_Y, duration: FADE_DURATION, ease: 'power2.in', stagger: WORD_STAGGER },
      BLOCK1_OUT_START
    );
  }

  if (block2 && block2.words.length) {
    textTimeline.fromTo(
      block2.words,
      { opacity: 0, y: WORD_IN_Y },
      { opacity: 1, y: 0, duration: FADE_DURATION, ease: 'power3.out', stagger: WORD_STAGGER },
      BLOCK2_IN_START
    );
    textTimeline.to(
      block2.words,
      { opacity: 0, y: WORD_OUT_Y, duration: FADE_DURATION, ease: 'power2.in', stagger: WORD_STAGGER },
      BLOCK2_OUT_START
    );
  }

  // Render the t=0 (everything hidden) state immediately so words don't
  // flash unstyled before the first animation frame runs.
  textTimeline.time(0);

  function clamp(v, min, max) {
    return Math.min(Math.max(v, min), max);
  }

  function updateTextBlocks(currentTime) {
    // Block 1 must start appearing as soon as the page loads, even before
    // the user scrolls — so the timeline's effective time is whichever is
    // further along: real time elapsed since load, or scroll-driven time.
    // The cap matches block 1's fade-in window, so this early nudge never
    // affects block 1's fade-out or block 2's timing.
    const elapsedSinceLoad = clamp(
      performance.now() / 1000 - pageLoadTime,
      BLOCK1_IN_START,
      BLOCK1_IN_START + FADE_DURATION
    );
    textTimeline.time(Math.max(currentTime, elapsedSinceLoad));
  }

  // ── Load video as blob ──
  // Fetching the entire file into memory guarantees it's fully buffered
  // before scrubbing starts. preload="auto" is just a hint that browsers
  // often ignore for large files.

  fetch('media/hero-vault.mp4')
    .then(r => r.blob())
    .then(blob => {
      video.src = URL.createObjectURL(blob);
    });

  video.addEventListener('loadedmetadata', () => {
    videoDuration = video.duration;
    videoReady = true;
    update();
  });

  // ── Scroll progress (0–1) ──
  // Maps how far you've scrolled through the tall wrapper.

  function getProgress() {
    const rect = wrapper.getBoundingClientRect();
    const scrollable = wrapper.offsetHeight - window.innerHeight;
    if (scrollable <= 0) return 0;
    return Math.min(Math.max(-rect.top / scrollable, 0), 1);
  }

  // ── Scroll loop ──

  let ticking = false;

  function update() {
    const progress = getProgress();
    latestProgress = progress;
    if (scrollCue) {
      scrollCue.style.opacity = (1 - ramp(progress, CUE_FADE_START, CUE_FADE_END)).toFixed(3);
    }
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

  // ── Time smoothing ──
  // A fast scroll/flick can jump `target` across the whole FADE_DURATION
  // window in a single frame, which would make the text (and, to a lesser
  // extent, the video) snap instead of animate. `smoothedTime` chases
  // `target` with frame-rate-independent exponential smoothing (the same
  // idea as GSAP ScrollTrigger's numeric `scrub` value) so both the video
  // seek and the text timing always move through the intervening time
  // instead of teleporting to it.
  //
  // factor = 1 - SMOOTHING_BASE^dt: at SMOOTHING_BASE = 0.001, ~90% of any
  // gap closes within ~0.3s and ~97% within 0.5s — fast enough that calm
  // scrolling still feels immediate, slow enough that a quick flick's
  // crossfade actually plays instead of skipping.
  const SMOOTHING_BASE = 0.001;
  let smoothedTime = 0;
  let lastFrameTimestamp = null;

  // ── Video scrub loop ──
  // Runs independently of the scroll handler, on every animation frame.
  // Only issues a new seek once the previous one has finished (!video.seeking) —
  // requesting currentTime faster than the browser can seek just queues up
  // and causes visible jitter, so this always seeks toward the latest
  // scroll progress rather than replaying every intermediate value.

  function videoLoop(timestamp) {
    const deltaTime = lastFrameTimestamp === null ? 0 : (timestamp - lastFrameTimestamp) / 1000;
    lastFrameTimestamp = timestamp;

    // Text timing runs even before the video's metadata has loaded (target
    // is simply 0 until then), so the first block can start appearing
    // immediately on page load rather than waiting on the blob fetch.
    const target = videoReady ? latestProgress * videoDuration : 0;

    const smoothingFactor = 1 - Math.pow(SMOOTHING_BASE, deltaTime);
    smoothedTime += (target - smoothedTime) * smoothingFactor;

    if (videoReady && !video.seeking && Math.abs(video.currentTime - smoothedTime) > 1 / 24) {
      video.currentTime = smoothedTime;
    }
    updateTextBlocks(smoothedTime);
    requestAnimationFrame(videoLoop);
  }
  requestAnimationFrame(videoLoop);
})();
