(() => {
  'use strict';

  // Global mouse-controlled scene movement + custom cursor.
  //
  // Sizing, safe-travel derivation, smoothing shape, and cursor mechanics
  // are adapted from the Glonari Global Campus reference implementation
  // (see PROJECT_RULES/UI_LAYOUT_CAMPUS there) — reused as a proven
  // technique, not copied wholesale. .scene-world itself stays statically
  // centered; each .layer gets its own depth-scaled movement transform
  // (per-layer parallax) — see the "layers" setup and applyLayerTransforms()
  // below.

  // Logical Figma frame size — the internal 2050x800 coordinate system
  // every .layer's percentage position/size is still expressed against.
  const IMG_W = 2050;
  const IMG_H = 800;

  // Overscan beyond pure "object-fit: cover" fit. Cover math alone leaves
  // zero slack on whichever axis drives the scale — for this composition
  // that's almost always the height axis on real desktop viewports, which
  // would leave zero room for vertical drift without this.
  const BLEED = 1.035;

  // Hard cap on vertical travel regardless of how much bleed slack the
  // current viewport ratio provides, so vertical movement always reads
  // as subtle/secondary to horizontal.
  const MAX_TRAVEL_Y_PX = 24;

  // Damping time constant (seconds), frame-rate independent. Shared by
  // both axes — the dominant/secondary feel comes from the amplitude
  // (maxTravelX vs maxTravelY, derived from real overflow below), not
  // from different easing speeds per axis.
  const TAU = 0.6;

  const STOP_THRESHOLD = 0.05; // px

  const viewport = document.querySelector('.stage-viewport');
  const world = document.querySelector('.scene-world');
  if (!viewport || !world) return;

  // Per-layer parallax: each .layer carries its own depth multiplier
  // applied on top of the shared pointer offset below — sky/buildings lag
  // behind (background), plaza leads (foreground). Sky and plaza use a
  // fixed data-depth (design constants); buildings instead carry their
  // real logical position (data-left/data-width, the same 2050x800-frame
  // numbers already used to position them in CSS), and their depth is
  // derived from that geometry inside layout() below.
  const layers = Array.from(document.querySelectorAll('.layer')).map((el) => ({
    el,
    depth: parseFloat(el.dataset.depth) || 1,
    leftPx: el.dataset.left !== undefined ? parseFloat(el.dataset.left) : null,
    widthPx: el.dataset.width !== undefined ? parseFloat(el.dataset.width) : null,
  }));
  const plazaLayer = layers.find((layer) => layer.el.classList.contains('plaza'));

  // Floor applied to buildings that are already fully visible at rest
  // (their required reveal shift is 0) — keeps them participating in the
  // depth effect instead of sitting perfectly still.
  const BASELINE_BUILDING_DEPTH = 0.55;

  // Hover z-index override: normal building z-index is depth-derived
  // (roughly 55-110, see layout() below) so that adjacent buildings
  // correctly occlude each other at a parallax-shifted seam. Once a
  // building is hover-scaled (see the "Building hover" section further
  // down) its enlarged edges can reach into a neighbor's footprint, so
  // the hovered building needs to temporarily win that stacking order
  // regardless of its own depth. Kept below the plaza's fixed z-index
  // (1000) on purpose — plaza is the deliberate foreground layer and
  // should keep covering building bases as it already does at rest.
  // Declared here (not inside the later hover section) because layout()
  // below reads it on every pass, including its first call at startup.
  const HOVER_Z_INDEX = 500;
  let hoveredBuildingEl = null;

  const reduceMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  const finePointerQuery = window.matchMedia('(hover: hover) and (pointer: fine)');

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  // ---------- Cover-fit sizing + real-overflow safe travel ----------
  // .scene-world is sized in real pixels to the "object-fit: cover"
  // render size of the 2050x800 frame for the current viewport (plus
  // BLEED). Because the frame's aspect ratio (2.5625) is far wider than
  // any realistic desktop viewport, the height axis drives the scale,
  // and the composition naturally renders much wider than the viewport —
  // that horizontal overflow *is* the real space mouse movement explores.
  // No artificial headroom/buffer layer is used: every pixel a translate
  // can reveal is actual rendered composition.
  let maxTravelX = 0;
  let maxTravelY = 0;

  function layout() {
    const vw = viewport.clientWidth;
    const vh = viewport.clientHeight;
    if (vw === 0 || vh === 0) return;

    const scale = Math.max(vw / IMG_W, vh / IMG_H) * BLEED;
    const renderW = IMG_W * scale;
    const renderH = IMG_H * scale;

    world.style.width = `${renderW}px`;
    world.style.height = `${renderH}px`;

    // Real safe travel for a full-bleed layer (sky, plaza — both exactly
    // as wide as .scene-world, with zero horizontal slack of their own
    // beyond this bleed): how far it can shift before its own edge enters
    // the viewport.
    const worldMaxTravelX = Math.max(0, (renderW - vw) / 2);
    const worldMaxTravelY = Math.min(Math.max(0, (renderH - vh) / 2), MAX_TRAVEL_Y_PX);

    // Each building's depth is derived from its actual geometry, not
    // guessed: compute how far its clipped edge sits from the viewport
    // edge at rest (the "required shift" to fully reveal it), express
    // that as a fraction of worldMaxTravelX, then scale by the plaza
    // reference depth — a building needing the full worldMaxTravelX
    // reach (ratio 1) lands at the same depth as plaza, so it becomes
    // exactly as fully revealed at the pointer extreme.
    for (const layer of layers) {
      if (layer.leftPx === null) continue; // sky/plaza keep their fixed data-depth
      const leftAbs = renderW * (layer.leftPx / IMG_W - 0.5);
      const rightAbs = renderW * ((layer.leftPx + layer.widthPx) / IMG_W - 0.5);
      const vwHalf = vw / 2;
      const requiredShift = Math.max(0, -vwHalf - leftAbs, rightAbs - vwHalf);
      const ratio = worldMaxTravelX > 0 ? requiredShift / worldMaxTravelX : 0;
      layer.depth = Math.max(BASELINE_BUILDING_DEPTH, ratio * plazaLayer.depth);

      // Adjacent buildings move at different rates, so at nonzero offset
      // their shared edge no longer lines up — one overlaps into the
      // other's footprint. Stack the higher-depth (faster, more
      // foreground-like) neighbor on top so it's the one that occludes,
      // matching how closer objects naturally cover farther ones.
      // The currently-hovered building overrides this with a flat, much
      // higher z-index instead (see HOVER_Z_INDEX above) so its hover
      // scale is never clipped by a neighbor — re-applied here too so a
      // resize mid-hover doesn't clobber the override with the natural
      // depth-based value.
      layer.el.style.zIndex =
        layer.el === hoveredBuildingEl ? String(HOVER_Z_INDEX) : String(Math.round(layer.depth * 100));
    }

    // Normalize so the deepest layer (usually plaza, but a building can
    // take over if its required reveal exceeds worldMaxTravelX) is the
    // one that reaches worldMaxTravelX/Y exactly — never more, since
    // that's the hard ceiling a full-bleed layer can safely travel.
    // Every other, shallower layer then gets its own smaller share of
    // this reference range via its depth multiplier in
    // applyLayerTransforms(), so it always moves less and stays safe
    // automatically.
    const maxDepth = layers.reduce((max, layer) => Math.max(max, layer.depth), 1);
    maxTravelX = worldMaxTravelX / maxDepth;
    maxTravelY = worldMaxTravelY / maxDepth;

    // Keep any in-flight target within the freshly recomputed range.
    target.x = clamp(target.x, -maxTravelX, maxTravelX);
    target.y = clamp(target.y, -maxTravelY, maxTravelY);
  }

  window.addEventListener('resize', layout);
  window.addEventListener('orientationchange', layout);

  // ---------- Pointer-driven movement (independent transform per .layer) ----------
  const target = { x: 0, y: 0 };
  const offset = { x: 0, y: 0 };
  let rafId = null;
  let lastTime = null;

  function applyLayerTransforms() {
    for (const layer of layers) {
      const lx = (offset.x * layer.depth).toFixed(2);
      const ly = (offset.y * layer.depth).toFixed(2);
      layer.el.style.transform = `translate3d(${lx}px, ${ly}px, 0)`;
    }
  }

  function startLoop() {
    if (rafId !== null) return;
    lastTime = null;
    rafId = requestAnimationFrame(tick);
  }

  function stopLoop() {
    if (rafId !== null) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
    lastTime = null;
  }

  function tick(now) {
    if (lastTime === null) lastTime = now;
    const dt = (now - lastTime) / 1000;
    lastTime = now;

    const ease = 1 - Math.exp(-dt / TAU);
    offset.x += (target.x - offset.x) * ease;
    offset.y += (target.y - offset.y) * ease;

    const settled =
      Math.abs(target.x - offset.x) < STOP_THRESHOLD &&
      Math.abs(target.y - offset.y) < STOP_THRESHOLD;

    if (settled) {
      offset.x = target.x;
      offset.y = target.y;
      applyLayerTransforms();
      stopLoop();
      return;
    }

    applyLayerTransforms();
    rafId = requestAnimationFrame(tick);
  }

  function setTargetFromPointer(clientX, clientY) {
    const rect = viewport.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;

    const nx = clamp(((clientX - rect.left) / rect.width - 0.5) * 2, -1, 1);
    const ny = clamp(((clientY - rect.top) / rect.height - 0.5) * 2, -1, 1);

    // Negated: moving the pointer right shifts the world left, bringing
    // the scene's right side into view — the pointer indicates where to
    // "look", not a handle the world drags along 1:1.
    target.x = -nx * maxTravelX;
    target.y = -ny * maxTravelY;

    startLoop();
  }

  function resetTarget() {
    target.x = 0;
    target.y = 0;
    startLoop();
  }

  function handlePointerMove(event) {
    if (event.pointerType && event.pointerType !== 'mouse') return;
    setTargetFromPointer(event.clientX, event.clientY);
  }

  function handlePointerLeave(event) {
    if (event.pointerType && event.pointerType !== 'mouse') return;
    resetTarget();
  }

  function enableMovement() {
    viewport.addEventListener('pointermove', handlePointerMove);
    viewport.addEventListener('pointerleave', handlePointerLeave);
    window.addEventListener('blur', resetTarget);
  }

  function disableMovement() {
    viewport.removeEventListener('pointermove', handlePointerMove);
    viewport.removeEventListener('pointerleave', handlePointerLeave);
    window.removeEventListener('blur', resetTarget);
    stopLoop();
    target.x = 0;
    target.y = 0;
    offset.x = 0;
    offset.y = 0;
    applyLayerTransforms();
  }

  function applyMotionPreference() {
    if (reduceMotionQuery.matches) {
      disableMovement();
    } else {
      enableMovement();
    }
  }

  layout();
  applyLayerTransforms();
  applyMotionPreference();
  reduceMotionQuery.addEventListener('change', applyMotionPreference);

  // ---------- Building hover (silhouette-accurate hit-testing) ----------
  // Bounding-box hover would trigger across each building's transparent
  // PNG padding, not just its visible facade — adapted here from the
  // Glonari Global Campus reference concept of a defined "hit area" per
  // building, but implemented against this project's real per-building
  // alpha channel (the reference itself uses hand-measured rectangular
  // hotspots, not pixel alpha, since it renders one flattened image; each
  // building here is already its own transparent-background PNG, which
  // makes true silhouette hit-testing both possible and more accurate).
  // Detection is done via direct pointer coordinate math against each
  // building's own rendered box (which already reflects its live
  // parallax translate3d), independent of native pointer-events/:hover —
  // this sidesteps the foreground .plaza layer's bounding box (z-index
  // 1000, sized near-full-scene) ever swallowing hover before it reaches
  // a building underneath.
  const HOVER_ALPHA_THRESHOLD = 20; // 0-255; ignores near-fully-transparent pixels

  const buildings = Array.from(document.querySelectorAll('.layer.building')).map((el) => ({
    el,
    img: el.querySelector('img'),
    canvas: null,
    ctx: null,
    ready: false,
  }));

  function prepareBuildingMask(building) {
    const { img } = building;
    if (!img.naturalWidth || !img.naturalHeight) return;
    const canvas = document.createElement('canvas');
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    ctx.drawImage(img, 0, 0);
    building.canvas = canvas;
    building.ctx = ctx;
    building.ready = true;
  }

  for (const building of buildings) {
    if (building.img.complete) {
      prepareBuildingMask(building);
    } else {
      building.img.addEventListener('load', () => prepareBuildingMask(building), { once: true });
    }
  }

  // Maps a viewport point to a natural-pixel coordinate in the building's
  // own source image, honoring whichever object-fit the image actually
  // uses (cover for most buildings; the ancillary crop technique relies
  // on the default "fill" stretch instead) — so the same function works
  // for both without hardcoding per-building crop math here.
  function sampleAlpha(building, clientX, clientY) {
    if (!building.ready) return 0;
    const rect = building.img.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return 0;

    const lx = (clientX - rect.left) / rect.width;
    const ly = (clientY - rect.top) / rect.height;
    if (lx < 0 || lx > 1 || ly < 0 || ly > 1) return 0;

    const nw = building.canvas.width;
    const nh = building.canvas.height;
    let ix;
    let iy;

    if (getComputedStyle(building.img).objectFit === 'cover') {
      const scale = Math.max(rect.width / nw, rect.height / nh);
      const drawW = nw * scale;
      const drawH = nh * scale;
      const offX = (rect.width - drawW) / 2;
      const offY = (rect.height - drawH) / 2;
      ix = (lx * rect.width - offX) / scale;
      iy = (ly * rect.height - offY) / scale;
    } else {
      ix = lx * nw;
      iy = ly * nh;
    }

    ix = Math.floor(clamp(ix, 0, nw - 1));
    iy = Math.floor(clamp(iy, 0, nh - 1));

    try {
      return building.ctx.getImageData(ix, iy, 1, 1).data[3];
    } catch (err) {
      // Tainted canvas (e.g. page opened via file:// instead of served
      // over http) — fail closed: no hover rather than a thrown error.
      return 0;
    }
  }

  // Cursor handle shared with the "Custom cursor" section further down —
  // declared here (not there) because building hover needs to toggle its
  // "hover" class the moment hover state changes, independent of whether
  // this device matches finePointerQuery (that gate only controls the
  // cursor's own position-tracking loop below; toggling a class on an
  // element that's display:none on non-fine-pointer devices is harmless).
  const cursorDot = document.querySelector('.cursor-dot');

  // Two independent input-mode states feed the same visual "elevated"
  // look (glow + scale + z-index boost + cursor reaction): hoveredBuilding
  // (mouse, via alpha hit-testing) and focusedBuilding (keyboard, via
  // native focus/blur on the now-tabbable building elements — see the
  // "Keyboard access" loop below). Kept separate so a mouse pointerleave
  // firing elsewhere can't clobber a keyboard user's focus state and vice
  // versa; applyElevated()/recomputeElevated() reconcile them into the one
  // building that's actually shown as elevated at any moment.
  let hoveredBuilding = null;
  let focusedBuilding = null;
  let elevatedBuilding = null;

  // Restores a building to its normal depth-derived z-index (or, if it's
  // the currently-elevated one, applies the HOVER_Z_INDEX override) —
  // shared by both applyElevated() below and layout()'s own per-resize
  // pass, so there's one formula, not two copies of it.
  function refreshZIndex(el) {
    const layerEntry = layers.find((l) => l.el === el);
    if (!layerEntry) return;
    el.style.zIndex = el === hoveredBuildingEl ? String(HOVER_Z_INDEX) : String(Math.round(layerEntry.depth * 100));
  }

  function applyElevated(building) {
    if (building === elevatedBuilding) return;
    const previousEl = elevatedBuilding ? elevatedBuilding.el : null;
    if (elevatedBuilding) elevatedBuilding.el.classList.remove('is-hovered');
    if (building) building.el.classList.add('is-hovered');
    elevatedBuilding = building;
    // hoveredBuildingEl is the name layout()/refreshZIndex() already know
    // about (see HOVER_Z_INDEX above) — reused as-is here rather than
    // introducing a second z-index-override variable for the same job.
    hoveredBuildingEl = building ? building.el : null;
    if (previousEl) refreshZIndex(previousEl);
    if (building) refreshZIndex(building.el);
    // Same trigger (real silhouette hit or keyboard focus, never a
    // rectangular bounding box) drives the reference project's cursor
    // hover reaction — see .cursor-dot.hover in styles.css.
    if (cursorDot) cursorDot.classList.toggle('hover', building !== null);
  }

  function recomputeElevated() {
    applyElevated(hoveredBuilding || focusedBuilding);
  }

  function updateBuildingHover(clientX, clientY) {
    // While the section modal is open it visually covers the scene, but
    // this hit-testing is raw coordinate math, not native pointer-events —
    // it would otherwise keep "seeing" a building right through the
    // modal. Suspend it entirely for the duration.
    if (sectionModal && sectionModal.isOpen()) return;

    // When two buildings' boxes momentarily overlap at a parallax-shifted
    // seam, prefer whichever one the depth-based z-index already renders
    // on top, so hover matches what's visually in front.
    let best = null;
    let bestZ = -Infinity;
    for (const building of buildings) {
      if (sampleAlpha(building, clientX, clientY) <= HOVER_ALPHA_THRESHOLD) continue;
      const z = parseInt(building.el.style.zIndex, 10) || 0;
      if (z > bestZ) {
        best = building;
        bestZ = z;
      }
    }
    hoveredBuilding = best;
    recomputeElevated();
  }

  function clearBuildingHover() {
    hoveredBuilding = null;
    recomputeElevated();
  }

  // Independent of enableMovement()/disableMovement() above: hover is a
  // static affordance, not the vestibular-motion concern reduced-motion
  // targets (the reference project keeps its own hover transitions active
  // under reduced-motion for the same reason), so it stays wired
  // regardless of the movement/reduced-motion state.
  viewport.addEventListener('pointermove', (event) => {
    if (event.pointerType && event.pointerType !== 'mouse') return;
    updateBuildingHover(event.clientX, event.clientY);
  });
  viewport.addEventListener('pointerleave', clearBuildingHover);
  window.addEventListener('blur', clearBuildingHover);

  // ---------- Section modal (click a building to open) ----------
  // Content, open/close, and focus-trap behavior live in section-modal.js
  // (shared with mobile/main.js) — see index.html/section-modal.css for
  // the matching markup/CSS. Only what's desktop-specific stays here: the
  // hover→click trigger, and clearing hover state when the modal opens.
  function getBuildingKey(el) {
    return Array.from(el.classList).find((cls) => cls.startsWith('building-')) || null;
  }

  // ---------- Cross-project navigation (Digital Banker only) ----------
  // Every other building opens the in-page section modal (below). Digital
  // Banker is the one exception: it leaves this page entirely for the
  // separate Digital-Banker-GIA scroll-cinematic project. NAV_TARGETS maps
  // a building key to that destination so adding a future building->site
  // link (e.g. Global Dream once it has its own project) only means adding
  // one more entry here, not another special-cased branch.
  const NAV_TARGETS = {
    'building-banker': 'digital-banker/gia/index.html',
  };

  const exitTransition = document.getElementById('exit-transition');
  // Matches #exit-transition's CSS transition duration (styles.css) plus a
  // small margin, so the fade is visually complete before the real
  // navigation swaps the page out from under it.
  const EXIT_FADE_MS = 550;

  function navigateWithFade(url) {
    if (!exitTransition) {
      window.location.href = url;
      return;
    }
    exitTransition.classList.add('active');
    window.setTimeout(() => {
      window.location.href = url;
    }, EXIT_FADE_MS);
  }

  // Single entry point for "a building was activated" (click or keyboard),
  // used by both call sites below instead of each duplicating the
  // NAV_TARGETS check.
  function activateBuilding(key, el) {
    const target = NAV_TARGETS[key];
    if (target) {
      navigateWithFade(target);
      return;
    }
    if (!sectionModal || sectionModal.isOpen()) return;
    sectionModal.open(key, el);
  }

  const sectionModal = window.SectionModal.create({
    overlay: document.getElementById('modal-overlay'),
    card: document.getElementById('modal-card'),
    title: document.getElementById('modal-title'),
    desc: document.getElementById('modal-desc'),
    closeBtn: document.getElementById('modal-close'),
    // The modal visually covers the building being hovered/clicked — drop
    // its hover state so the glow/scale doesn't linger, pointlessly, under
    // the overlay for as long as the modal stays open.
    onOpen: () => {
      clearBuildingHover();
      // Same body-level flag digital-banker/lobby/index.html already uses
      // to hide its own persistent hint while a modal covers the scene —
      // .explore-hint (styles.css) is hidden by this class, not by any
      // per-element open/close call here.
      document.body.classList.add('modal-active');
    },
    onClose: () => {
      document.body.classList.remove('modal-active');
    },
  });

  viewport.addEventListener('click', () => {
    if (!hoveredBuilding) return;
    if (sectionModal && sectionModal.isOpen()) return;
    activateBuilding(getBuildingKey(hoveredBuilding.el), hoveredBuilding.el);
  });

  // ---------- Keyboard access (buildings) ----------
  // Not present in the Glonari Global Campus reference to carry over
  // either — its hit areas are real <button> elements, which get
  // keyboard focusability and Enter/Space activation for free from the
  // browser. This project's buildings are plain <div> layers (needed for
  // the alpha-mask hit-testing above), so both have to be added by hand:
  // tabindex="0"/role="button" in index.html make them reachable, and
  // this loop supplies the activation behavior a real <button> would
  // otherwise provide natively.
  for (const building of buildings) {
    building.el.addEventListener('focus', () => {
      focusedBuilding = building;
      recomputeElevated();
    });
    building.el.addEventListener('blur', () => {
      if (focusedBuilding !== building) return;
      focusedBuilding = null;
      recomputeElevated();
    });
    building.el.addEventListener('keydown', (event) => {
      if (event.key !== 'Enter' && event.key !== ' ' && event.key !== 'Spacebar') return;
      event.preventDefault(); // Space must not also scroll the page
      if (sectionModal && sectionModal.isOpen()) return;
      activateBuilding(getBuildingKey(building.el), building.el);
    });
  }

  // ---------- Custom cursor (fine-pointer desktop only) ----------
  // Gated so touch/coarse-pointer devices never attach these listeners at
  // all (CSS also hides the elements independently). Entirely independent
  // of the scene's own transform/state above.
  if (finePointerQuery.matches) {
    const cursorRing = document.querySelector('.cursor-ring');

    if (cursorDot && cursorRing) {
      let mx = window.innerWidth / 2;
      let my = window.innerHeight / 2;
      let rx = mx;
      let ry = my;

      cursorDot.style.left = `${mx}px`;
      cursorDot.style.top = `${my}px`;
      cursorRing.style.left = `${rx}px`;
      cursorRing.style.top = `${ry}px`;

      window.addEventListener('pointermove', (event) => {
        if (event.pointerType !== 'mouse') return;
        mx = event.clientX;
        my = event.clientY;
        cursorDot.style.left = `${mx}px`;
        cursorDot.style.top = `${my}px`;
      });

      function ringLoop() {
        rx += (mx - rx) * 0.15;
        ry += (my - ry) * 0.15;
        cursorRing.style.left = `${rx}px`;
        cursorRing.style.top = `${ry}px`;
        requestAnimationFrame(ringLoop);
      }
      ringLoop();
    }
  }

  // ---------- Fountain water video (reduced-motion) ----------
  // PRODUCT_REQUIREMENTS.md §21: any global movement must respect
  // prefers-reduced-motion. autoplay/loop can't be gated in CSS for
  // <video>, so it's paused here on a matching frame (leaving the pool
  // showing whatever frame it stopped on, rather than removed entirely) and
  // resumed if the OS-level setting changes live — same reduceMotionQuery
  // instance declared above, mirroring index.html's own live-query pattern.
  const waterVideo = document.querySelector('.water-video');
  if (waterVideo) {
    const syncWaterMotion = () => {
      if (reduceMotionQuery.matches) {
        waterVideo.pause();
      } else {
        waterVideo.play().catch(() => {});
      }
    };
    syncWaterMotion();
    reduceMotionQuery.addEventListener('change', syncWaterMotion);
  }
})();
