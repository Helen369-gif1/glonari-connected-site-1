(() => {
  'use strict';

  // Shared section-modal logic: desktop (main.js, driven by hover+click on
  // real .layer.building elements) and mobile (mobile/main.js, driven by
  // tap on flat overlay zones) both open the exact same #modal-overlay/
  // #modal-card markup with the exact same per-building content — this
  // module is the one place that content and that open/close/focus-trap
  // behavior lives, so neither caller re-implements it.
  //
  // Content/behavior carried over as-is from the original desktop-only
  // implementation (itself adapted from the Glonari Global Campus
  // reference's openModal()/closeModal()) — see index.html/section-modal.css
  // for the matching markup/CSS this expects to find.
  const BUILDING_CONTENT = {
    'building-global-connections': {
      name: 'Global Connections',
      // TODO: replace with real copy
      desc: "Global Connections is Glonari's international network — a place to meet fellow members, discover partnerships, and stay linked across markets. Explore who's building alongside you, wherever they are in the world.",
    },
    'building-glonari-news': {
      name: 'Glonari News',
      // TODO: replace with real copy
      desc: 'Glonari News brings you market insights, campus announcements, and the stories shaping the Glonari community. Stay current with real-time updates from across the ecosystem.',
    },
    'building-pulse': {
      name: 'Glonari Pulse',
      // TODO: replace with real copy
      desc: "Glonari Pulse tracks the heartbeat of the ecosystem — real-time signals, activity trends, and the metrics that matter most to you. See what's moving, as it happens.",
    },
    'building-persona': {
      name: 'Signature Persona Pavilion',
      // TODO: replace with real copy
      desc: "The Signature Persona Pavilion is Glonari's flagship experience — a premium space built around the personas shaping how members engage with the platform. Step inside to discover the journey designed for you.",
    },
    'building-banker': {
      name: 'Digital Banker',
      // TODO: replace with real copy
      desc: 'Digital Banker is your everyday financial home within Glonari — accounts, cards, and transfers, managed securely in one always-on place. Banking that moves as fast as you do.',
    },
    'building-global-dream': {
      name: 'Global Dream',
      // TODO: replace with real copy
      desc: "Global Dream is where members set and pursue their biggest goals — from homeownership to long-term wealth building. A new model for turning ambition into a plan.",
    },
    'building-glonari-ancillary': {
      name: 'Glonari Ancillary',
      // TODO: replace with real copy
      desc: 'Glonari Ancillary unlocks the lifestyle services and member privileges that extend beyond banking — travel, concierge, and everyday perks. The extras that make membership worth it.',
    },
  };

  // dom: { overlay, card, title, desc, closeBtn } — the #modal-overlay
  // subtree's elements, already present in both index.html and
  // mobile/index.html. onOpen/onClose are optional hooks for
  // caller-specific side effects (e.g. desktop clears its own hover state
  // before the modal covers the scene — mobile has no such state).
  function createSectionModal({ overlay, card, title, desc, closeBtn, onOpen, onClose } = {}) {
    if (!overlay || !card || !title || !desc) return null;

    let isOpen = false;
    let lastFocusedEl = null;

    function getFocusable() {
      return Array.from(
        card.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')
      ).filter((el) => el.offsetParent !== null && !el.disabled);
    }

    function open(key, triggerEl) {
      const content = BUILDING_CONTENT[key];
      if (!content) return;

      title.textContent = content.name;
      desc.textContent = content.desc;
      isOpen = true;
      lastFocusedEl = triggerEl || null;
      if (onOpen) onOpen();
      overlay.classList.add('active');
      // Moving focus here fires a native blur on the trigger element (if it
      // had focus) — desktop's own focus-tracking loop in main.js already
      // turns that into focusedBuilding = null, no separate bookkeeping
      // needed here for that.
      if (closeBtn) closeBtn.focus();
    }

    function close() {
      if (!isOpen) return;
      isOpen = false;
      overlay.classList.remove('active');
      if (onClose) onClose();
      if (lastFocusedEl) lastFocusedEl.focus();
      lastFocusedEl = null;
    }

    if (closeBtn) closeBtn.addEventListener('click', close);
    overlay.addEventListener('click', (event) => {
      if (event.target === overlay) close();
    });

    // Focus trap: the Glonari Global Campus reference does NOT actually
    // implement one (its openModal()/closeModal() only move focus in/out,
    // with nothing stopping Tab from leaking past the modal to whatever's
    // next in DOM order) — so this is new, not carried over. Escape lives
    // in the same handler since both are modal-only keydown concerns.
    document.addEventListener('keydown', (event) => {
      if (!isOpen) return;

      if (event.key === 'Escape') {
        close();
        return;
      }

      if (event.key !== 'Tab') return;
      const focusable = getFocusable();
      if (focusable.length === 0) {
        event.preventDefault();
        return;
      }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const activeInside = card.contains(document.activeElement);
      if (event.shiftKey) {
        if (!activeInside || document.activeElement === first) {
          event.preventDefault();
          last.focus();
        }
      } else if (!activeInside || document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    });

    // Safety net for focus landing outside the modal by any path other
    // than Tab (e.g. a stray programmatic .focus() call elsewhere) while
    // it's open — the keydown trap above only covers actual Tab presses.
    document.addEventListener('focusin', (event) => {
      if (!isOpen || card.contains(event.target)) return;
      const target = getFocusable()[0] || closeBtn;
      if (target) target.focus();
    });

    return { open, close, isOpen: () => isOpen };
  }

  window.SectionModal = { BUILDING_CONTENT, create: createSectionModal };
})();
