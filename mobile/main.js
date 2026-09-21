(() => {
  'use strict';

  // Mobile carousel rebuild (2026-08-23, later same day). Replaces the
  // prior plain `.building-frame` list (native overflow-x scroll, no
  // active/center concept) with a real looping carousel: one active
  // (centered) building, its neighbors peeking at the viewport edges,
  // prev/next arrows, 7 pagination dots, and drag/swipe paging.
  //
  // Mobile interaction pass (2026-08-24, later still): tapping the
  // active (centered) building now opens the same `window.SectionModal`
  // used by desktop (see `activateFrame()`/`openBuildingModal()` below);
  // tapping a peeking side building still just re-centers the carousel
  // on it, unchanged. Tap-vs-drag used to be decided by an exact
  // `dragDeltaX === 0` check in `onPointerUp()` — a real finger almost
  // never lands on precisely zero movement, so that silently broke
  // tapping on real touch devices. Replaced by a `TAP_MAX_DISTANCE`
  // threshold on both axes.
  //
  // Every tap (touch, pen, *and* mouse) is now dispatched explicitly
  // from `onPointerUp()` via `activateFrame()`, rather than relying on
  // the browser's own compatibility `click` — confirmed via headless
  // Chromium that `viewportEl.setPointerCapture()` (needed so a fast
  // drag that leaves the viewport's bounds keeps being tracked) makes
  // even a genuine mouse click stop producing a `click` event on the
  // original target at all once captured, not just for touch. The
  // per-frame `click` listener a few lines below is kept only as a
  // harmless fallback for callers that dispatch activation without ever
  // going through pointer events at all (e.g. assistive tech or test
  // code calling `element.click()` directly) — `activateFrame()` is
  // idempotent against being called twice in quick succession for the
  // same building (`goTo()` already no-ops while `isAnimating`, and
  // re-opening an already-open modal with the same content is harmless),
  // so a redundant native `click` landing on top of the explicit
  // dispatch is not a real double-activation concern.

  const REAL_COUNT = 7; // persona, banker, global-connections, global-dream, glonari-ancillary, glonari-news, pulse

  // Kept in sync with `.building-frame { flex-basis }` in styles.css —
  // this is slot SIZE, unrelated to the spacing overlap below.
  const SLOT_WIDTH = 230;

  // Kept in sync with `.building-frame { margin-right }` in styles.css.
  // Slots overlap by this much (pulling neighbors closer without
  // touching SLOT_WIDTH), so the actual per-position translateX distance
  // is SLOT_WIDTH - OVERLAP, not SLOT_WIDTH itself. 70 fully closed the
  // gap (neighbors touching/overlapping, no visible sky between them) —
  // reduced to 30, which keeps a clearly visible gap while still pulling
  // neighbors noticeably closer than the pre-overlap (OVERLAP 0) spacing;
  // checked against all 7 buildings as both left and right neighbor —
  // see the styles.css comment for detail.
  const OVERLAP = 30;
  const STEP = SLOT_WIDTH - OVERLAP;

  const track = document.getElementById('carousel-track');
  const dotsContainer = document.getElementById('carousel-dots');
  if (!track) return;

  const viewportEl = track.parentElement;
  const prevBtn = document.querySelector('.carousel-arrow--prev');
  const nextBtn = document.querySelector('.carousel-arrow--next');

  // DOM order: [clone-of-last, ...7 real slides in source order, clone-of-first]
  const frames = Array.from(track.children);
  const dots = dotsContainer ? Array.from(dotsContainer.children) : [];

  let viewportWidth = viewportEl.clientWidth;
  let centerOffset = (viewportWidth - SLOT_WIDTH) / 2;

  // Slide positions run 0..8: 0 and 8 are the wrap-clones, 1..7 map to
  // real buildings 0..6. Start centered on the first real building
  // (Signature Persona Pavilion), matching the reference mockup.
  let position = 1;
  let isAnimating = false;

  function realIndexFromPosition(pos) {
    if (pos <= 0) return REAL_COUNT - 1;
    if (pos >= REAL_COUNT + 1) return 0;
    return pos - 1;
  }

  function render(pos, animate) {
    track.classList.toggle('no-anim', !animate);
    const tx = centerOffset - pos * STEP;
    track.style.transform = `translateX(${tx}px)`;

    frames.forEach((frame, i) => {
      frame.classList.toggle('is-active', i === pos);
      // Distinguishes which side of the active slide a peeking neighbor
      // sits on, so styles.css can mirror the ¾-angled face on only one
      // side (see the .building-face--angled comment there) — the same
      // angled render is otherwise reused unmirrored on both sides.
      frame.classList.toggle('is-prev', i === pos - 1);
      frame.classList.toggle('is-next', i === pos + 1);
    });

    const activeReal = realIndexFromPosition(pos);
    dots.forEach((dot, i) => dot.classList.toggle('is-active', i === activeReal));
  }

  function goTo(nextPosition, animate) {
    // Same-position requests (e.g. clicking the already-active dot) never
    // change track.style.transform, so `transitionend` below would never
    // fire to reset isAnimating — bail out before touching any state.
    if (nextPosition === position) return;
    if (isAnimating) return;
    isAnimating = true;
    position = nextPosition;
    render(position, animate !== false);
  }

  // Fast repeat swipes (2026-08-24, later still): a swipe that starts
  // before the previous one's 340ms CSS transition has finished used to
  // be dropped completely, since `onPointerDown` bailed out whenever
  // `isAnimating` was true — see `pendingSwipes` and the drag handlers
  // below for the fix, and `transitionend` here for where a queued swipe
  // gets replayed once there's a transition to attach it to.
  let pendingSwipes = [];

  // Same problem, tap side (2026-08-25): a tap (not a swipe) landing
  // entirely inside a previous transition's window used to be silently
  // dropped too — the `!dragLive` branch in `onPointerUp` only ever
  // queued swipes, so a fast repeat tap on a building while the carousel
  // was still animating looked like the carousel had "hung". Holds at
  // most one frame (unlike `pendingSwipes`, a queue) since only the most
  // recent tap's target matters if several land before the queue drains.
  let pendingTap = null;

  // Seamless loop: once the animated move to a clone slide finishes,
  // jump instantly (no transition) to the matching real slide at the
  // opposite end — visually identical, so the jump is imperceptible.
  track.addEventListener('transitionend', (event) => {
    if (event.target !== track || event.propertyName !== 'transform') return;
    if (position === 0) {
      position = REAL_COUNT;
      render(position, false);
    } else if (position === REAL_COUNT + 1) {
      position = 1;
      render(position, false);
    }
    isAnimating = false;

    if (pendingSwipes.length) {
      // Force a style flush before starting the queued swipe's own
      // transition: the wraparound jump above (transition disabled) and
      // this next goTo()/render() (transition re-enabled) both set
      // `transform` in the same synchronous turn — without an explicit
      // reflow between them, the browser can coalesce the two writes and
      // skip animating the queued swipe entirely instead of transitioning
      // from the jumped-to value.
      void track.offsetWidth;
      const direction = pendingSwipes.shift();
      goTo(position + direction, true);
      // Another transition is about to run — a queued tap must wait for
      // it too (activateFrame() bails out whenever `isAnimating` is
      // true, so calling it here would just silently drop the tap again).
      return;
    }

    if (pendingTap) {
      const frame = pendingTap;
      pendingTap = null;
      activateFrame(frame);
      // See the onPointerUp comment on the same call: activation must not
      // leave the tapped frame focused, or its gold focus-visible ring
      // shows up after a plain tap.
      frame.blur();
    }
  });

  function next() { goTo(position + 1, true); }
  function prev() { goTo(position - 1, true); }

  if (prevBtn) prevBtn.addEventListener('click', prev);
  if (nextBtn) nextBtn.addEventListener('click', next);

  dots.forEach((dot, i) => {
    dot.addEventListener('click', () => goTo(i + 1, true));
  });

  // Same #modal-overlay/#modal-card markup and shared section-modal.js/
  // section-modal.css as desktop (main.js) — see that file's own
  // "Section modal" comment for the content/open/close/focus-trap logic
  // this delegates to. `window.SectionModal` is guarded rather than
  // assumed, matching this module's existing defensive style, even
  // though `<script defer>` load order in mobile/index.html already
  // guarantees it exists by the time this runs.
  const sectionModal = window.SectionModal
    ? window.SectionModal.create({
        overlay: document.getElementById('modal-overlay'),
        card: document.getElementById('modal-card'),
        title: document.getElementById('modal-title'),
        desc: document.getElementById('modal-desc'),
        closeBtn: document.getElementById('modal-close'),
      })
    : null;

  function openBuildingModal(frame) {
    if (!sectionModal) return;
    const key = frame.dataset.building;
    if (!key) return;
    sectionModal.open(key, frame);
  }

  // Shared by the click/keydown listeners below (mouse + keyboard) and
  // by the touch/pen tap dispatch in onPointerUp() further down, so both
  // paths activate a building the exact same way.
  //
  // Wrap-clones (data-clone="true") are deliberately kept out of the Tab
  // order (tabindex="-1", aria-hidden — see mobile/index.html) since
  // they're not separate content, just the seamless-loop stand-ins for
  // the real slide at the opposite end. But a peeking clone is still a
  // real, visible pixel target for a pointer: tapping/clicking it must
  // page the carousel exactly like tapping the real building it depicts
  // would (2026-08-24, later still — previously bailed out here treating
  // clones as fully inert, which left them tappable-looking but dead).
  // `frames.indexOf(frame)` already gives 0 or REAL_COUNT+1 for a clone —
  // the same clone position `goTo()` already lands on mid-swipe — so no
  // clone-specific branch is needed beyond just not returning early.
  // `i === position` can't be true for a clone in practice (position is
  // only ever 0/REAL_COUNT+1 while `isAnimating` is true, and by the time
  // `transitionend` clears that flag it has already reassigned `position`
  // to the matching real value — see that listener above), so this can
  // never route a clone tap into openBuildingModal().
  function activateFrame(frame) {
    if (!frame) return;
    const i = frames.indexOf(frame);
    if (i === -1 || isAnimating) return;
    if (i === position) {
      openBuildingModal(frame);
    } else {
      goTo(i, true);
    }
  }

  frames.forEach((frame) => {
    // Keyboard activation is still gated by focusability, not by this
    // listener's presence — tabindex="-1" already keeps clones out of
    // reach, so attaching it here is harmless, not a new keyboard path.
    frame.addEventListener('click', () => activateFrame(frame));
    frame.addEventListener('keydown', (event) => {
      if (event.key !== 'Enter' && event.key !== ' ' && event.key !== 'Spacebar') return;
      event.preventDefault(); // Space must not also scroll the page
      activateFrame(frame);
    });
  });

  // ---- drag / swipe paging (real carousel transition, not inertial scroll) ----
  // Any real finger/mouse movement between down and up almost never lands
  // on exactly 0px — treating "0" as the only valid tap distance (the old
  // behavior) broke tapping on real touch devices. A small threshold on
  // both axes distinguishes a tap from a genuine drag instead.
  const TAP_MAX_DISTANCE = 10;

  // Rubber-band damping (2026-08-25, later still) applied in onPointerMove
  // to whatever raw distance sits past the one-full-loop render limit
  // (`minTx`/`maxTx` below) — a plain multiplier on the overflow is enough
  // to turn "track visually stops dead, no matter how much further the
  // finger moves" into "track keeps responding, just less per pixel past
  // the limit," without needing a log/sqrt curve for that. 0.32 was
  // picked as noticeably damped (a finger dragged well past the limit
  // still only inches the track forward) without reading as fully inert.
  const RUBBER_BAND_FACTOR = 0.32;

  let dragging = false; // a pointer is currently down, in ANY mode below
  // True once this gesture has taken manual control of the track's own
  // transform (either immediately, if nothing was animating at
  // pointerdown, or partway through — see onPointerMove — if the
  // previous transition happened to finish naturally while this gesture
  // was still queued). False for the whole gesture means it started (and
  // possibly ended) entirely while a previous transition was in flight —
  // see `pendingSwipes` above for how that case still gets acted on.
  let dragLive = false;
  let dragStartX = 0;
  let dragStartY = 0;
  let dragDeltaX = 0;
  let dragDeltaY = 0;
  let dragBaseTx = 0;
  let downFrame = null; // .building-frame under the pointer at pointerdown, if any

  function setPressed(frame, pressed) {
    if (!frame || frame.dataset.clone === 'true') return;
    frame.classList.toggle('is-pressed', pressed);
  }

  // Takes manual control of the track for live drag-following, baselined
  // to `event`'s current position — called either immediately from
  // onPointerDown (the common case: nothing animating yet) or later from
  // onPointerMove (the previous transition finished naturally mid-drag).
  function activateLiveDrag(event) {
    dragLive = true;
    dragStartX = event.clientX;
    dragStartY = event.clientY;
    dragDeltaX = 0;
    dragDeltaY = 0;
    dragBaseTx = centerOffset - position * STEP;
    track.classList.add('no-anim');
  }

  function onPointerDown(event) {
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    dragging = true;
    dragLive = false;
    dragStartX = event.clientX;
    dragStartY = event.clientY;
    dragDeltaX = 0;
    dragDeltaY = 0;
    downFrame = event.target.closest('.building-frame');
    setPressed(downFrame, true);
    if (viewportEl.setPointerCapture) viewportEl.setPointerCapture(event.pointerId);
    // `isAnimating` is deliberately NOT checked here anymore (2026-08-24,
    // later still) — it used to make onPointerDown bail out completely
    // while a previous transition was in flight, silently dropping a
    // fast repeat swipe with no visual reaction at all. If nothing is
    // animating, take live control immediately as before; otherwise
    // leave the in-flight transition alone (interrupting it mid-flight
    // to compute a live-follow position relative to a still-moving
    // target — especially right at the wrap-loop boundary, where
    // `position` briefly points at a clone whose own resting `tx` isn't
    // the one that ends up on screen — is real added complexity this
    // fix doesn't need) and just keep tracking the raw pointer movement
    // below, deciding what it meant once the gesture ends (onPointerUp)
    // or once the in-flight transition finishes naturally mid-gesture
    // (onPointerMove's `!dragLive` branch).
    if (!isAnimating) activateLiveDrag(event);
  }

  function onPointerMove(event) {
    if (!dragging) return;

    if (!dragLive) {
      if (isAnimating) {
        // Still queued — track raw movement for the tap/drag decision at
        // pointerup, but don't touch the track itself; it belongs to the
        // in-flight transition until that finishes.
        dragDeltaX = event.clientX - dragStartX;
        dragDeltaY = event.clientY - dragStartY;
        return;
      }
      // The in-flight transition finished naturally while this gesture
      // was still queued (e.g. a slow drag that started right at the
      // tail end of a previous swipe) — take live control now, baselined
      // to the pointer's CURRENT position so the carousel doesn't jump
      // using whatever raw delta had accumulated while queued.
      activateLiveDrag(event);
      return;
    }

    dragDeltaX = event.clientX - dragStartX;
    dragDeltaY = event.clientY - dragStartY;
    // Once movement clearly exceeds tap distance, this is a drag, not a
    // tap — drop the press feedback and forget the candidate frame so a
    // finger that drags across a building can never also activate it.
    if (downFrame && (Math.abs(dragDeltaX) >= TAP_MAX_DISTANCE || Math.abs(dragDeltaY) >= TAP_MAX_DISTANCE)) {
      setPressed(downFrame, false);
      downFrame = null;
    }
    // Limited (2026-08-24, later still; softened into rubber-band on
    // 2026-08-25, later still — see below) so one continuous drag can
    // never render past either buffer clone with a full 1:1 finger
    // follow — there are only 9 slides total (1 clone + 7 real + 1
    // clone), so dragging further than that has no next slide to reveal.
    const rawTx = dragBaseTx + dragDeltaX;
    const minTx = centerOffset - (REAL_COUNT + 1) * STEP; // clone-of-first fully centered
    const maxTx = centerOffset; // clone-of-last fully centered
    // Bug report (2026-08-25, later still): the hard `Math.min`/`Math.max`
    // clamp this used to be made the track stop dead the instant the
    // finger crossed `minTx`/`maxTx` — with no resistance, no spring, no
    // visual cue at all that a limit had been hit, `pointermove` kept
    // firing the whole time. That read as the app hanging, not as "you've
    // reached the end of one loop." Replaced with rubber-band damping:
    // past the limit, only `RUBBER_BAND_FACTOR` of the *overflow* is
    // still applied, so the track keeps visibly (if increasingly slowly)
    // responding to further finger movement instead of freezing outright.
    // This only changes what's rendered mid-drag — the commit decision in
    // onPointerUp still reads the real, undamped `dragDeltaX`, unchanged.
    let tx;
    if (rawTx > maxTx) {
      tx = maxTx + (rawTx - maxTx) * RUBBER_BAND_FACTOR;
    } else if (rawTx < minTx) {
      tx = minTx - (minTx - rawTx) * RUBBER_BAND_FACTOR;
    } else {
      tx = rawTx;
    }
    track.style.transform = `translateX(${tx}px)`;
  }

  function onPointerUp(event) {
    if (!dragging) return;
    dragging = false;
    setPressed(downFrame, false);

    const isTap = Math.abs(dragDeltaX) < TAP_MAX_DISTANCE && Math.abs(dragDeltaY) < TAP_MAX_DISTANCE;

    if (!dragLive) {
      // The whole gesture happened while a previous transition was still
      // in flight and never got picked up live (see onPointerMove) — the
      // track was never touched, so there's nothing to snap back
      // visually. Queue a real swipe's direction to replay once the
      // in-flight transition's `transitionend` fires, so a fast repeat
      // swipe still pages the carousel instead of being silently dropped.
      // Pushed rather than overwriting a single slot: three swipes
      // arriving before the first transition even finishes must still
      // page by three once they've each drained (one transition at a
      // time, chained through `transitionend` above) — a single pending
      // slot would silently lose all but the last of them, which is the
      // exact bug this fix is for. A tap in this same window used to be
      // dropped outright (neither queued here nor reachable through
      // activateFrame()'s own `isAnimating` gate, since it's never even
      // called) — see `pendingTap` below for that fix.
      if (!isTap) {
        const threshold = STEP * 0.18;
        if (dragDeltaX <= -threshold) pendingSwipes.push(1);
        else if (dragDeltaX >= threshold) pendingSwipes.push(-1);
      } else if (event && event.type === 'pointerup' && downFrame) {
        // Same "only a genuine pointerup completes a tap" guard as the
        // `dragLive` tap branch below — a cancelled/left gesture must not
        // queue an activation for later. Replayed from `transitionend`
        // once the in-flight transition (and any swipes queued behind it)
        // have fully drained — see `pendingTap` above.
        pendingTap = downFrame;
      }
      downFrame = null;
      return;
    }

    track.classList.remove('no-anim');

    if (isTap) {
      // No real drag happened (or a negligible one) — snap the transform
      // back to its exact resting value with no transition (a no-op if
      // it never moved), so there's nothing left to animate and
      // isAnimating is never touched here.
      render(position, false);
      // Only a genuine pointerup is a completed tap — pointercancel and
      // pointerleave both funnel into this same function (see the
      // listeners below) but must never activate anything, since the
      // gesture didn't end normally on this element.
      if (event && event.type === 'pointerup' && downFrame) {
        activateFrame(downFrame);
        // Explicit blur after a pointer-driven activation (2026-08-25) —
        // not a CSS-only fix, because the bug isn't really about styling:
        // `viewportEl.setPointerCapture()` (see the file-top comment)
        // swallows the native `click` a plain tap would otherwise produce,
        // so the browser never gets its usual click-driven signal that
        // this focus came from a pointer, not a keyboard. On some mobile
        // browsers that makes the `:focus-visible` heuristic guess wrong
        // and show the keyboard-only gold ring after an ordinary tap.
        // Blurring here (rather than inside `activateFrame()` itself,
        // which is shared with the Enter/Space keydown handler below) only
        // affects this pointer-driven call site — real keyboard activation
        // never runs this line, so Tab navigation keeps its focus ring.
        downFrame.blur();
      }
      downFrame = null;
      return;
    }

    downFrame = null;
    const threshold = STEP * 0.18;
    const dist = Math.abs(dragDeltaX);
    if (dist >= threshold) {
      // Multi-step commit (2026-08-25, later still): one continuous drag
      // used to page by at most 1 position no matter how far it travelled
      // — a real finger that pulled 3-4 STEPs in one gesture still only
      // advanced one slide, which read as the carousel ignoring most of
      // the drag. `direction` keeps the pre-existing sign convention
      // (negative dragDeltaX pages forward); `Math.floor` rather than
      // `Math.round` means a drag short of completing its next whole STEP
      // doesn't get rounded up past it, and `Math.max(1, ...)` preserves
      // the exact pre-existing behavior for anything between `threshold`
      // and one full STEP — that range already committed exactly 1 step
      // before this change, and still does.
      const direction = dragDeltaX < 0 ? 1 : -1;
      const rawSteps = Math.max(1, Math.floor(dist / STEP));
      // A single continuous drag still can't page further than one full
      // loop from wherever it started — from the current `position`,
      // slide 0 (clone-of-last) or REAL_COUNT+1 (clone-of-first) is as
      // far as there is anything left to reveal, matching the render
      // limit `onPointerMove`'s rubber-band above is damping past. This
      // also gives the "release while stretched past the limit" case its
      // required smooth return for free: capped at the boundary, the
      // commit lands exactly on that boundary clone, and the existing
      // transitionend wraparound below then resolves it to the matching
      // real slide via its normal animated transition — no separate
      // instant-snap branch needed.
      const maxStepsInDirection = direction > 0 ? REAL_COUNT + 1 - position : position;
      const steps = Math.min(rawSteps, maxStepsInDirection);
      // First step commits immediately (starts its own transition); any
      // remaining steps ride the same `pendingSwipes` queue an ordinary
      // fast repeat swipe already uses, so `transitionend` chains through
      // them one at a time exactly as it already does for that case.
      goTo(position + direction, true);
      for (let i = 1; i < steps; i++) pendingSwipes.push(direction);
    } else {
      // A real (sub-threshold) drag moved track.style.transform away from
      // its resting value — animate back to it, relying on transitionend
      // to reset isAnimating once that snap-back transition completes.
      isAnimating = true;
      render(position, true); // snap back to the current slide
    }
  }

  viewportEl.addEventListener('pointerdown', onPointerDown);
  viewportEl.addEventListener('pointermove', onPointerMove);
  viewportEl.addEventListener('pointerup', onPointerUp);
  viewportEl.addEventListener('pointercancel', onPointerUp);
  viewportEl.addEventListener('pointerleave', (event) => { if (dragging) onPointerUp(event); });

  window.addEventListener('resize', () => {
    viewportWidth = viewportEl.clientWidth;
    centerOffset = (viewportWidth - SLOT_WIDTH) / 2;
    render(position, false);
  });

  render(position, false);
})();
