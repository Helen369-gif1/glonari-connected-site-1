# GLOBAL RESERVE® — Landing Page Build Spec

**For: Claude Code (VS Code extension) · Project: Glonari / Digital Banker · Version 1 · 2026-09-16**

---

## RULE 0 — LANGUAGE (READ FIRST)

This document is written in English. It ends with **Appendix D**, which is written in Russian.

- Appendix D is a note for the human designer only. **Do not read it as an instruction, do not translate it, do not act on it.**
- **Never emit Cyrillic characters** into any file you create or edit: not in markup, not in copy, not in CSS, not in comments, not in commit messages, not in `alt` / `aria-label` / `title` attributes.
- All user-facing copy in this project is English and is quoted verbatim in Section 5. Copy it character for character, including the typographic apostrophe `'` and the em dash `—`. Do not rewrite, shorten, "improve", or re-punctuate it.
- If a string you need is not in this document, do not invent it. Insert `<!-- TODO: copy needed -->` and list it in your summary.

---

## 1. WHAT WE ARE BUILDING

A single-page marketing site for **GLOBAL RESERVE®**, a product inside the Glonari platform. Nine full-height screens, scrolled top to bottom, roughly one minute of reading — plus one short scroll-triggered video reveal inserted between Screens 4 and 5 (Section 5.4a).

It is a static site. No framework, no build step, no backend, no analytics, no cookie banner.

Tone of the design: warm, quiet, editorial. Serif headlines, generous whitespace, very little motion, no gradients-as-decoration, no card shadows, no emoji, no icon libraries.

---

## 2. EXISTING CODE — START FROM IT, DO NOT REPLACE IT

The repository already contains a working implementation of **Screen 1**. Treat it as the reference for quality and technique.

```
/index.html               Screen 1 markup
/style.css                Screen 1 styles
/script.js                Scroll-to-video scrubbing + per-word text animation
/video111.mp4             Screen 1 video source (1280x720, 6s, vault interior)
/performance-scrub.mp4    Unrelated reference asset — ignore
/video5.mp4               Earlier cut of the hero video — ignore
/video5_original.mp4      Earlier cut — ignore
/README.md                Explains the scroll-scrub technique
/global_reserve_text_spec.md      Figma coordinates for Screen 1 text blocks
/global_reserve_timecoding.md     Screen 1 scroll timecodes
```

Rules for the existing code:

1. Do not change the Screen 1 scroll-scrub mechanism, the 300vh runway, the sticky viewport, or the text block coordinates.
2. Do not delete `README.md`, `global_reserve_text_spec.md`, or `global_reserve_timecoding.md`.
3. You may refactor `style.css` into the token structure in Section 4, as long as Screen 1 renders identically.
4. Screen 1 is currently missing its eyebrow, its two buttons, and its scroll hint. Add them per Section 5.1.

---

## 3. TARGET FILE STRUCTURE

```
/index.html
/css/tokens.css           Design tokens only (Section 4)
/css/base.css             Reset, typography, container, utilities
/css/screens.css          Per-screen layout
/css/reserve-hologram.css Screen 5.5 projection layout and responsive states
/js/scrub.js              Screen 1 scroll-to-video-time binding (moved from script.js, logic unchanged). Locked to Screen 1 — nothing else reads from it
/js/video-reveal.js       Screen 4.5 clip-path reveal, overlay, headline, and background-video visibility (see Section 5.4a)
/js/reveal.js             IntersectionObserver reveal for screens 2-10
/js/ticker.js             Screen 8 marquee
/js/counter.js            Screen 4 counter animation (see Section 7)
/js/timescale.js          Screen 2 balance-to-time animation (see Section 7)
/js/reserve-hologram.js   Screen 5.5 scroll-driven vault projection (see Section 5.5a)
/js/gia.js                Screen 7 scroll-driven quote message reveal plus play-once-per-visit video playback. Serves only Screen 7 — does not import from or depend on js/scrub.js, does not touch Screen 1. video.currentTime is never tied to scroll progress; currentTime = 0 is used only to reset the video after the visitor fully leaves Screen 7 (see Section 5.7)
/media/                   All video and image assets
/media/reveal-vault.mp4   Screen 4.5 background video, supplied directly as the final asset for this slot (see Section 5.4a)
/media/reserve-hologram-bg.webp  Screen 5.5 clean vault background, without interface or text
/css/site-shell.css       Global fixed header, mobile menu, registration/login dialogs, footer (see Section 5.11)
/js/site-shell.js         Mobile navigation, registration dialog, login dialog, placeholder-link prevention. Does not read from or depend on js/scrub.js or any other screen-specific script (see Section 5.11)
/media/logo/gr-emblem.png       Approved square emblem mark, transparent, 245x245
/media/logo/gr-full-lockup.png  Approved wide lockup with tagline, transparent, 967x245
```

- Vanilla HTML/CSS/JS. No npm, no bundler, no TypeScript, no Tailwind, no React.
- One `<section>` per screen, with `id="screen-1"` through `id="screen-10"` — Screen 9 was removed by an approved design decision (see Section 5.9) and does not exist; Screen 8 is followed directly by Screen 10 — plus `id="screen-4-5"` for the scroll-video reveal and `id="screen-5-5"` for the reserve hologram inserted between Screens 5 and 6.
- Each section gets a `data-screen` attribute with its slug: `hero`, `question`, `red`, `rewards`, `reveal`, `states`, `reserve-demo`, `path`, `gia`, `transparency`, `cta`.
- Serve locally with `python3 -m http.server`. The blob fetch in the scrub script does not work over `file://`.

---

## 4. DESIGN TOKENS

Put these in `/css/tokens.css` as custom properties on `:root`.

### Color

| Token | Value | Used for |
|---|---|---|
| `--gr-ink` | `#16130F` | Primary text on light |
| `--gr-ink-2` | `#5C554C` | Secondary text, captions |
| `--gr-paper` | `#F5F2ED` | Page background |
| `--gr-paper-2` | `#EDE8E0` | Alternating section background |
| `--gr-line` | `#D7D0C4` | Hairlines, dividers |
| `--gr-dark` | `#17140F` | Unused — reserved from removed Screen 9 |
| `--gr-dark-ink` | `#F1EBE1` | Unused — reserved from removed Screen 9 |
| `--gr-accent` | `#B98A3C` | Warm gold. Hairline accents and focus rings only — never large fills |
| `--gr-on-media` | `#FFFFFF` | Text placed over video |

Text over video also gets `text-shadow: 0 2px 24px rgba(0,0,0,.35)`.

### Type

Headlines: `'Playfair Display', Georgia, serif` (Google Fonts, weights 500 and 700, `display=swap`).
Everything else: system sans stack, already defined in the current `style.css`.

Sizes are given for a 1920px-wide reference frame. Use `clamp()` so they scale down; the min values are the mobile sizes.

| Token | Desktop | Line height | Weight | Mobile min |
|---|---|---|---|---|
| `--fs-h1` | 64px | 120% | 500 | 30px |
| `--fs-h2` | 48px | 120% | 500 | 26px |
| `--fs-hero-body` | 36px | 150% | 700 | 17px |
| `--fs-body` | 20px | 160% | 400 | 16px |
| `--fs-lead` | 24px | 150% | 500 | 17px |
| `--fs-stat` | 72px | 100% | 500 | 34px |
| `--fs-item-title` | 20px | 140% | 600 | 17px |
| `--fs-small` | 16px | 150% | 400 | 15px |
| `--fs-caption` | 14px | 150% | 400 | 13px |
| `--fs-eyebrow` | 14px | 100% | 600 | 12px, `letter-spacing: .2em`, uppercase |

Letter spacing is `0` everywhere except the eyebrow.

### Layout

- Content container: `max-width: 1200px`, side padding `clamp(20px, 5vw, 80px)`.
- Screen 1 text column: `width: 47.5%` (912/1920), `left: 26.25%` (504/1920) — already implemented, do not change.
- Vertical rhythm inside a screen: `--space-s: 16px`, `--space-m: 32px`, `--space-l: 64px`, `--space-xl: 120px`.
- Screens 2-10 are `min-height: 100vh` with vertically centered content, except Screens 4 and 8, which are `min-height: 60vh`.
- Single breakpoint at `768px`. Below it: every two-column layout stacks to one column, media goes above text, the Screen 5 bar becomes vertical, the Screen 6 stepper becomes a vertical list, buttons go full width and stack.

### Buttons

Two variants only.

- `.btn--primary`: filled `--gr-ink`, text `--gr-paper`, `border-radius: 999px`, padding `18px 40px`, font-size 16px, weight 600.
- `.btn--secondary`: transparent, 1.5px border `--gr-line`, text inherits screen foreground.
- Both: `<a>` elements with `href="#"` for now, `transition: opacity .2s`, visible focus ring in `--gr-accent`.
- No third variant, no icons inside buttons.

---

## 5. SCREEN-BY-SCREEN SPEC

Copy below is final. Reproduce it verbatim.

### 5.1 Screen 1 — Hero (already built, needs completion)

Full-bleed scroll-scrubbed video, text centered over it, 300vh runway, sticky viewport. Two text blocks appear in sequence as the user scrolls.

| Element | Copy | Style | Position |
|---|---|---|---|
| Eyebrow | `GLOBAL RESERVE®` | `--fs-eyebrow` | centered, above H1 |
| H1 | `Your Asset Control Center` | `--fs-h1`, Playfair 500 | centered, top 10.556% |
| Body | `Think of it as the smart hub behind your Glonari participation — one place that tracks your housing payments, rewards, and reserves, so you don't have to juggle them yourself.` | `--fs-hero-body`, Playfair 700 | centered, top 40% |
| Button 1 | `See How It Works` | primary | centered, 48px under body |
| Button 2 | `Meet Gia` | secondary | centered, beside button 1 |
| Scroll hint | `Scroll` | `--fs-caption` | centered, 64px from bottom, with a drifting vertical line underneath |

Scroll hint implemented 2026-09-21, replacing the originally specified `Scroll — it takes about a minute` copy at direct user request: it now reuses digital-banker/gia/index.html's own `.cue` pattern verbatim (short caption + drifting line, `#scroll-cue`/`.scroll-cue__line` in `css/screens.css`), including that page's progress-based opacity fade (fully visible through ~4.5% of this screen's own local scroll progress, easing out by ~9%) driven from `js/scrub.js`'s existing `getProgress()`, rather than a fixed pixel/class threshold. Buttons 1 and 2 in the row above remain unimplemented — out of scope for this pass, not touched.

Timing, unchanged from `global_reserve_timecoding.md`:

- Text block 1 (eyebrow + H1): visible `0.00s – 2.00s` of the 5s scroll timeline.
- Text block 2 (body + buttons): fades in at `2.00s`, holds from `2.50s` to `5.00s`.
- Crossfade `0.5s` between blocks.
- Buttons belong to block 2 and fade with it, but must be clickable whenever they are visible.

No balances, no numbers anywhere on this screen.

A static dark overlay, `rgba(0, 0, 0, 0.24)`, sits above the video and below the text (`.video-container::after`) to improve the readability of both text blocks. It is a constant, non-animated layer — it does not change opacity with scroll or reduced motion.

### 5.2 Screen 2 — The Question

Two columns, 50/50. Text left, media right. Media slot: `--media-question` (see Section 6).

| Element | Copy | Style | Align |
|---|---|---|---|
| H2 | `Everyone asks how much they have.`<br>`Almost nobody can answer how long they're covered.` | `--fs-h2`, two lines, `<br>` between them | left |
| Body | `A balance tells you about today. It doesn't tell you how many years your housing is financially covered. Global Reserve answers the second question — it reads everything you hold, everything you owe on housing, and turns it into time.` | `--fs-body`, max-width 560px | left |
| Stat label | `Years of housing covered` | `--fs-caption`, `--gr-ink-2` | left |
| Stat value | `8.5 years` | `--fs-stat`, color `--gr-ink-2` | left |
| Caption | `Your own number depends on what you hold and what you owe.` | `--fs-caption`, `--gr-ink-2` | left |

The stat block sits below the body with a 1px top hairline in `--gr-line`.

### 5.3 Screen 3 — What RED actually is

Centered header, then one wide card. Inside the card: illustration left (40%), text right (60%). Three short lines in a 3-column row below the card.

Card: 1.5px border `--gr-line`, `border-radius: 8px`, padding 40px, no shadow, no fill.
Media slot: `--media-red`.

| Element | Copy | Style | Align |
|---|---|---|---|
| Eyebrow | `THE PART EVERYONE ASKS ABOUT FIRST` | `--fs-eyebrow` | center |
| H2 | `RED isn't money. It's housing, paid forward.` | `--fs-h2` | center |
| Body (in card) | `RED — Real Estate Dollars — are credits that exist for one purpose: covering your housing inside Glonari. Your monthly housing fee comes out of them, and they're what stands behind you when you move on a property. They're used, not traded — which is exactly why they hold their job instead of drifting off into something else.` | `--fs-body` | left |
| Line 1 | `Made for housing, and nothing else` | `--fs-small` | left in column |
| Line 2 | `Spent as you live, not held as an investment` | `--fs-small` | left in column |
| Line 3 | `The more you hold, the longer you're covered` | `--fs-small` | left in column |

One card, not a three-token grid.

### 5.4 Screen 4 — Rewards

Short screen, `min-height: 60vh`. Everything centered, max-width 720px. A full-width counter strip sits at the bottom of the section.
Media slot: `--media-counter` (or the generated animation, Section 7).

| Element | Copy | Style | Align |
|---|---|---|---|
| H2 | `When the system saves you money, you keep it.` | `--fs-h2` | center |
| Body | `Glonari is always looking for a better price, a better term, a smaller fee. When it finds one, the saving doesn't disappear into the platform — it comes back to you as rewards, and those rewards work on the same thing everything else here works on: your housing.` | `--fs-body` | center |
| Lead line | `Nothing to claim. Nothing to chase. It happens whether you're watching or not.` | `--fs-lead` | center, 32px above the strip |

The counter strip shows motion only. No currency, no digits that read as a real balance.

### 5.4a Screen 4.5 — "This is what it's all for." (mask reveal over a looping video)

A new, independent full-height section inserted between Screen 4 and Screen 5 — not a modification of either. One cinematic beat, no mechanics: an aerial night shot of a home slowly reveals to full-bleed as the visitor scrolls, one line of copy fades in over it, then it recedes into Screen 5. No eyebrow, no body copy, no buttons, no numbers.

**Source footage.** `media/reveal-vault.mp4` is an aerial night shot of a home (coastal homes, pools, warm lit windows) — 1280×720, 30fps, 4.5s (135 frames), approximately 1.83MB. It was supplied directly by the designer as the final asset for this slot; very little camera movement, so it reads well as a calm, continuous loop rather than a busy pan.

**Implementation — a real looping video, not a scroll-scrub.** Unlike Screen 1's hero, this video's `currentTime` is never touched by scroll: it plays as an ordinary `<video autoplay muted loop playsinline>`, running continuously on its own timeline the moment it's in view. Scroll drives only the presentation around it — the clip-path mask, the overlay, and the headline — through the section's own lightweight scroll-progress tracker in `/js/video-reveal.js`. This section does **not** call `bindScrollToVideo` (Section 2), which stays a Screen 1–only concern; the two screens' video needs are different (one is scrubbed frame-by-frame, one just plays), so they don't share that function. An `IntersectionObserver` on the section pauses the video once it's fully out of view and resumes it on return, so it never plays unnecessarily off-screen.

**Behaviour:**

- Section height: `320vh` scroll runway. Inner content is `position: sticky; top: 0; height: 100vh`, pinned for the full runway. This is the **second** pinned section on the page — Section 8's "no pinned sections other than Screen 1" rule is amended below to name both.
- Video element: `media/reveal-vault.mp4`, `autoplay`, `muted`, `loop`, `playsinline`, `preload="auto"`, `object-fit: cover`.
- Reveal: the frame starts as a small rounded window, `clip-path: inset(43% 36% 43% 36% round 16px)`, and expands to full-bleed, `inset(0% 0% 0% 0% round 0px)`, over the first 45% of the section's scroll distance (`0%–45%`). `scrub`, not a fixed duration — the expansion is tied one-to-one to scroll position, `ease: none`.
- Fully open, full-bleed hold: `45%–70%`.
- Closing: `70%–100%`, contracting to a wide panoramic band — never fully closing and never staying near full-screen — `clip-path: inset(30% 20% 30% 20% round 20px)` (roughly 60% of the frame's width, 40% of its height). Fully reversible on scroll-back, same as the reveal.
- No CSS zoom on the video. The source footage already carries its own camera motion; an added `scale()` transform amplified flicker in the night scene's fine detail, so the video renders at a constant `scale(1)` for the whole scroll range.
- As the frame finishes expanding, a dark overlay fades to `rgba(0,0,0,.35)` and the headline fades in over it using the same per-word reveal technique as Screen 1's hero text (split into one `<span>` per word, then a paused GSAP timeline driven by `.time()`). It's implemented locally in `/js/video-reveal.js`, not shared from `/js/scrub.js` — that file is locked to Screen 1 (Section 2), so this section keeps its own small copy of the word-splitting helper rather than touching it.
- The headline holds through the open phase, then starts fading (with a slight `translateY` lift) around `70%` and is fully gone by about `82%`, while the frame contracts per above and the overlay darkens to `.6`, cueing the transition into Screen 5.

| Element | Copy | Style | Position |
|---|---|---|---|
| Headline | `This is what it's all for.` | `--fs-h1`, Playfair 500, `--gr-on-media`, text-shadow per Section 4 | centered, over the frame |

No eyebrow, no body text, no buttons, no stat. If `media/reveal-vault.mp4` is missing, show the standard Section 6 placeholder full-bleed, with the headline still appearing on schedule.

If a different headline is wanted instead of the one above, two alternates in the same register:
- `This is the part that isn't a number.`
- `Everything else was just the path here.`

**Reduced motion:** a fully static composition, per the design system's requirement. No pin, no scroll-driven clip-path/overlay/headline animation — the mask sits fully open, the overlay rests at its open-state alpha, and the headline is fully visible. Unlike the normal-motion behaviour above, the background video does **not** keep playing here: `autoplay` and `loop` are turned off via JavaScript, the video is paused, and it's left on a single stable frame — a real static frame, not a looping one.

### 5.5 Screen 5 — What your reserve is doing right now

Centered header (max-width 720px), then a horizontal 4-segment bar at full container width, then a 4-column row of labels, then a centered closing line. No media.

Bar: height 56px, `border-radius: 999px`, 1.5px border `--gr-line`, four segments split `1.2fr 1fr .9fr .6fr`, divided by 1.5px vertical rules. Fills step through `--gr-paper-2` to `--gr-line`. On hover a segment lifts to full opacity; the effect is decorative only and must not shift layout.

| Element | Copy | Style | Align |
|---|---|---|---|
| H2 | `Your reserve is never just sitting there.` | `--fs-h2` | center |
| Body | `At any moment, part of what you hold is free, part is set aside for a home you're working toward, and part is holding a home you already have. Global Reserve labels every piece, all the time, so you always know what you can use and what's already spoken for.` | `--fs-body` | center |
| Segment labels | `Ready` · `Committed` · `Reserved` · `Scheduled` | `--fs-caption` | center of segment |
| Column 1 | `Ready` / `Free to cover your housing or grow your position.` | `--fs-item-title` / `--fs-small` | left |
| Column 2 | `Committed` / `Held while you work toward a property.` | same | left |
| Column 3 | `Reserved` / `Holding a home that's already yours.` | same | left |
| Column 4 | `Scheduled` / `Arriving later, managed for you.` | same | left |
| Closing line | `No hidden totals. No number that means two things at once.` | `--fs-small` | center |

The four state names are product terminology. Do not rename them to `Available`, `Locked`, `Pending`, or anything else.

### 5.5a Screen 5.5 — Reserve Hologram in the Vault (scroll-driven product demonstration)

This is a new independent section inserted between Screen 5 and Screen 6. It replaces the former click-open modal. The visitor first reads the calm explanation of the four states on Screen 5, then scrolls into a full-viewport vault scene where the example product interface assembles automatically. The complete interface must be visible without a click.

This is not one pre-rendered video. `references/reserve-hologram-panel-source/` is the visual and geometric source of truth for the panel: its exact HTML structure, CSS geometry (the 1920×1080 scene and every element's coordinates within it), Roboto type scale, colors, and decorative SVG assets are transplanted into production nearly verbatim — see the Screen 5.5 exception in `GLOBAL-RESERVE-DESIGN-SYSTEM.md`. The supplied concept image (`references/Screen_5_5_Reference.png`) is a composition reference for the same result. Labels and values remain real HTML/CSS/SVG (not baked into a raster image) so the copy stays sharp, editable, accessible, responsive, and reversible on scroll.

**Section structure and asset:**

- Section: `id="screen-5-5"`, `data-screen="reserve-demo"`, height `420vh`.
- Inner stage: `position: sticky; top: 0; height: 100vh; overflow: hidden`.
- Background: `media/reserve-hologram-bg.webp`, 1920x1080, clean vault scene with no interface or text, rendered full-bleed with `object-fit: cover`.
- The bronze projector base is baked into the background at approximately `(960, 895)` on the 1920×1080 frame. The beam and glow are separate decorative elements with `aria-hidden="true"`, positioned in the same 1920×1080 coordinate space as the panel so they stay pixel-locked to both the panel and the baked-in base at every viewport size.
- Panel: exact source geometry, `left: 400px; top: 206px; width: 1119px; height: 599px` on the 1920×1080 frame — not four detached floating cards.

**Visual treatment:**

- Per the Screen 5.5 design-system exception: the panel's colors, borders, glow, and gradient background come from the source assets as-is (border `#82C0FA`, eyebrow/key-figure gold `#F7C37B`/`#F8C47B`, secondary text `#8DA3B9`, white primary text, inner disc `#09213E`).
- No modal backdrop, close control, or four separate glowing cards.
- The central ring uses the source `progress-ring.svg` (muted disc, outer glow, bronze-gold arc baked at 82%) — not a redrawn or substitute ring.

**Exact interface copy:**

| Element | Copy | Position |
|---|---|---|
| Eyebrow | `GLOBAL RESERVE®` | top centre |
| Heading | `Your reserve at a glance` | below eyebrow |
| Disclaimer | `Example interface — not your account.` | below heading; remains visible whenever example figures are visible |
| Centre | `82%` / `Ready` | central SVG ring |
| Ready | `$42,800` / `Free to use today` | top-left |
| Reserved | `$18,000` / `Holding a home you already have` | top-right |
| Scheduled | `90 days` / `Arriving on its own timeline` | bottom-left |
| Committed | `78%` / `Toward a property you're working on` | bottom-right |
| Footer | `Explore the example` | bottom centre of the panel, under the source underline graphic |

The four state names are locked product terminology: `Ready`, `Committed`, `Reserved`, `Scheduled`. Do not replace them with `Available`, `Locked`, `Pending`, `Future Unlocks`, `Qualification Progress`, or any other label. The disclaimer qualifies every figure in this section as an example; do not repeat "for example" inside every state summary. The footer line is plain text — not a link or button — unless a later prompt supplies an approved destination.

**Scroll sequence:**

Use the current project's existing GSAP/scroll-progress setup; do not add another animation library. Map normalized section progress from `0` to `1` and keep the complete sequence reversible when scrolling upward.

| Progress | State |
|---:|---|
| `0.00–0.10` | Vault only; no projection |
| `0.10–0.24` | Projector glow and the projection beam appear |
| `0.18–0.40` | The original background and panel frame build in |
| `0.30–0.50` | Eyebrow, heading, disclaimer, and decorative lines reveal |
| `0.40–0.60` | Source progress ring reveals (conic sweep); `82%` and `Ready` follow |
| `0.58–0.82` | State summaries reveal in this order: Ready, Reserved, Scheduled, Committed |
| `0.78–0.86` | `Explore the example` and its underline reveal, last |
| `0.86–1.00` | Full composition holds, fully visible and readable — no exit fade |

There is no exit phase: the panel, beam, glow, and all text remain fully visible for the rest of the runway once assembled. The section only leaves the viewport because the sticky pin ends, not because anything fades out. Each state summary uses only a small `translateY` plus opacity. Do not animate layout dimensions or add parallax. The vault background remains visually stable while the projection assembles.

**Implementation and isolation:**

- Implement in `js/reserve-hologram.js` and `css/reserve-hologram.css`.
- Export one `initReserveHologram(el)` function. No globals.
- Do not import from, edit, or depend on `js/scrub.js`; Screen 1 remains locked.
- This section is not a dialog, has no focus trap, does not open on click, and has no close button.
- Pause any continuous decorative work while the section is outside the viewport.

**Responsive and reduced motion:**

- Desktop (above `960px`): the exact 1920×1080 panel geometry, scaled as one unit with the background using a `cover` formula so the panel, beam, and baked-in projector base stay pixel-locked together.
- At `960px` and below: a separate adaptive layout (not a scaled-down copy of the desktop stage) — ring above the summaries, two columns down to `600px`, one column below it, in the order Ready, Reserved, Scheduled, Committed; no horizontal scrolling; all copy remains readable in Roboto at reduced sizes.
- Under `prefers-reduced-motion: reduce`: remove the pin and all scroll animation, show one complete static composition with the ring (fully revealed) and all four summaries visible, and preserve the disclaimer and the footer line.

### 5.6 Screen 6 — The path to a home

Two columns, 50/50: photo left, text right. Below both, a horizontal 4-step stepper at full container width, then a highlighted line.
Media slot: `--media-home`.

Stepper: a 1.5px horizontal rule with four 14px circles sitting on it, label left-aligned under each circle. Static — no progress fill, no percentages.

| Element | Copy | Style | Align |
|---|---|---|---|
| H2 | `A home here doesn't start with a signature.`<br>`It starts with holding steady.` | `--fs-h2`, two lines | left |
| Body | `Before you take on a property, you go through a qualifying period: you set aside what's required and you keep it there. That's it. No credit theatre, no paperwork marathon — the proof is that you held your position. Global Reserve runs the clock, watches the threshold, and shows you the home you're working toward the whole way through.` | `--fs-body` | left |
| Step 1 | `Choose the home you're working toward` | `--fs-small` | left |
| Step 2 | `Set aside what it requires` | `--fs-small` | left |
| Step 3 | `Hold — and watch the days come down` | `--fs-small` | left |
| Step 4 | `Qualify, and move` | `--fs-small` | left |
| Note line | `If your position slips below what's required, the clock resets. You'll hear about it early, while it's still easy to fix.` | `--fs-small`, 2px left rule in `--gr-line`, 12px padding | left |

The note line stays at full body size and full contrast. Do not shrink it, grey it out, or move it into a footer.

### 5.7 Screen 7 — Gia

Two columns, 40/60: video left, text right. This video is required; it is the only human presence on the page. Do not substitute an illustration, an avatar, or an animation.
Media slot: `--media-gia`.

Over the video, in its lower third, two quote messages appear in sequence, tied to scroll position rather than a timer:

- The section provides extra scroll height (about `220svh`) around an inner stage that stays `position: sticky` while the sequence plays, on desktop viewports wide and tall enough for the full 40/60 composition to fit (implemented as `min-width: 1100px` and `min-height: 700px`). Below that threshold, on tablet, phone, or with `prefers-reduced-motion: reduce`, the extra scroll height and the sticky pin are both removed and the section flows normally.
- At the start of the scroll-driven sequence both messages are hidden. Message 1 fades in first, roughly across local scroll progress `0.22–0.40`. Message 2 fades in later, roughly across `0.52–0.70`. These ranges are approximate and may be tuned in the browser.
- Once a message has appeared it does not disappear again on further forward scroll — by the end of the scene both messages are visible together.
- Scrolling back up reverses the sequence smoothly, since each message's opacity and position are a direct, continuous function of scroll progress rather than a state machine.
- Each message animates `opacity: 0 → 1`, `translateX: -20px → 0`, `scale: 0.95 → 1`.
- The video's `currentTime` is never tied to scroll progress; scroll drives only the two messages. (`currentTime` is set to `0` only once, as part of resetting the video after the visitor fully leaves Screen 7 — see the playback behaviour below.)
- On tablet, phone, short viewports, and under reduced motion, both messages are shown immediately as a static, fully readable composition — no pin, no added scroll height.

Bubbles: 1px border `--gr-glass-line`, `border-radius: 8px`, padding `10px 16px`, 15px body text, background `rgba(5,5,8,.72)` so they stay legible over any part of the video.

Right column: eyebrow, H2, body, then five items in a two-column grid with the fifth spanning both columns, then a closing line above a 1px top hairline.

| Element | Copy |
|---|---|
| Bubble 1 | `"Your housing is covered into the mid-2030s."` |
| Bubble 2 | `"Nothing needs your attention today."` |
| Eyebrow | `THE PART THAT THINKS` |
| H2 | `Gia isn't a chat window. She's the reason this feels simple.` |
| Body | `Gia is the intelligence running underneath Global Reserve. She's mostly invisible, and that's the point — you should be living your life, not administering it.` |
| Item 1 title | `She explains.` |
| Item 1 text | `Every change gets one sentence in plain language. Not a log entry, an answer: "At your current position, your housing is covered into the mid-2030s."` |
| Item 2 title | `She watches.` |
| Item 2 text | `If your qualifying position starts drifting toward trouble, you hear it while it's still small.` |
| Item 3 title | `She handles.` |
| Item 3 text | `Your monthly housing fee is taken care of in the background. No transfers, no reminders, no late anything.` |
| Item 4 title | `She looks ahead.` |
| Item 4 text | `She keeps an eye on what your housing will need later and quietly keeps your position moving in that direction.` |
| Item 5 title | `She marks the moments.` |
| Item 5 text | `First foundation. First qualification. First home secured. Years of work shouldn't end up as a line in a transaction list.` |
| Closing line | `Gia never moves anything without your permission. She just makes sure you never have to guess.` |

Video element: `muted playsinline preload="metadata"` (no `autoplay`, no `loop`), `poster` attribute pointing at the poster frame, `object-fit: cover`, `aspect-ratio: 4/5`, `border-radius: 8px`. The video is always muted and decorative: no mute/unmute toggle, no visible or custom controls, and no captions track. This is a silent presentational video, not a spoken message the visitor needs to hear.

Playback is visibility-driven, not autoplay-on-load, and is handled locally in `js/gia.js` via `IntersectionObserver` (not scroll position, and never `video.currentTime` driven by scroll):

- On page load the poster image shows; the video does not play.
- The video starts, once, when roughly 30% of it becomes visible.
- It plays through exactly once per visit to the section — no loop, and it does not restart while the visitor remains within Screen 7, including on a small wobble back and forth across the 30% line.
- After it finishes, it holds on its last frame.
- The visit state resets only once the visitor has fully left Screen 7 (the video is paused and `currentTime` is set back to `0`).
- Returning to Screen 7 later starts the video again from the beginning once it crosses 30% visibility.

### 5.8 Screen 8 — Transparency

Short screen, `min-height: 60vh`. Centered header, max-width 720px. Below it a marquee at full viewport width, edge to edge, breaking out of the container. No media.

| Element | Copy | Align |
|---|---|---|
| H2 | `Nothing happens quietly.` | center |
| Body | `Every movement in your reserve is written down the moment it happens, with the date and the reason attached. Not a statement that arrives at the end of the month — a history you can open right now, at two in the morning, for no reason at all.` | center |

Marquee items, in this order, repeated to fill the loop:

`Housing fee covered` · `Rewards earned` · `Position committed` · `Qualification started` · `Qualification complete` · `Home reserved`

Each item is a pill: 1px border `--gr-line`, `border-radius: 999px`, padding `8px 18px`, `--fs-caption`, `--gr-ink-2`, `white-space: nowrap`.

Marquee behaviour: one direction, constant speed, 40-60s per cycle, no pause on hover, no drag. Fade the left and right 120px with a mask so pills do not clip hard at the edges. Implement by duplicating the item list once and translating the track by -50%; `aria-hidden="true"` on the duplicate.

### 5.9 Screen 9 — Removed

Screen 9 ("The honest part") was intentionally removed from the page by an approved design decision. The page flow goes directly from Screen 8 to Screen 10. Do not recreate this screen, its copy, or any compact replacement, and do not move its content into Screen 8, Screen 10, a footer, or any other location.

### 5.10 Screen 10 — CTA

Full-bleed video background, same warm object as the hero, centered content, max-width 760px.
Media slot: `--media-cta`.

| Element | Copy | Style | Align |
|---|---|---|---|
| H2 | `You don't need a plan yet.`<br>`You just need to see where you stand.` | `--fs-h1` scaled to 56px, two lines | center |
| Body | `Open Global Reserve and you'll see how long you're covered, what's already working for you, and what the next step looks like — with Gia already watching the parts you'd rather not think about.` | `--fs-body` | center |
| Button 1 | `Open Your Reserve` | primary | center |
| Button 2 | `Talk to Gia First` | secondary | center, beside button 1 |

This video autoplays and loops normally at natural playback speed. It is not scroll-scrubbed. Both buttons are required; do not drop the secondary one. Under `prefers-reduced-motion: reduce`, and on viewports below 768px, the moving video is replaced by its poster frame (`media/cta-vault-poster.jpg`) as a static full-bleed background.

### 5.11 Global site shell — header, footer, registration and login dialogs

Approved exception to Appendix C (see Appendix C). Adds one global fixed header, one global footer, one registration dialog, and one login dialog. Implemented in `css/site-shell.css` and `js/site-shell.js`. Does not modify Screen 1-10 content, copy, or behaviour.

**Header** — `<header class="site-header">`, `position: fixed`, 72px tall desktop / 64px tall mobile, solid background (`--gr-void`), 1px bottom hairline (`--gr-glass-line`), no gradients/blur/shadow. Overlays Screen 1; Screen 1 receives no added padding or margin. Anchor-scroll offset: ~80px desktop, ~72px mobile.

Brand lockup (left): link to `#screen-1`, containing `media/logo/gr-emblem.png` (decorative, `alt=""`, 40x40 desktop / 32x32 mobile) plus the live text `GLOBAL RESERVE®` in Playfair Display 700 (~21px desktop / ~17px mobile, letter-spacing ~0.02em), color `var(--gr-bronze)` — the only approved Playfair Display use outside Screen 1. Accessible name of the link: "GLOBAL RESERVE®".

Primary navigation (`<nav aria-label="Primary navigation">`), IBM Plex Sans:

| Label | Destination |
|---|---|
| Overview | `#screen-2` |
| RED | `#screen-3` |
| Rewards | `#screen-4` |
| Reserve | `#screen-5-5` |
| Gia | `#screen-7` |

Header actions: two `<button type="button">` elements, `Log in` (transparent, 1px `--gr-glass-line` border) and `Register` (filled `--gr-bronze`, dark text, 8px radius, no gradient/glow/shadow). Both open their respective dialog.

**Breakpoint: 1100px.** Above it, the desktop nav and actions are visible. At 1100px and below, they hide behind a hamburger button (`aria-label="Open menu"`/`"Close menu"`, `aria-expanded`, `aria-controls`) that reveals a solid dark mobile menu containing all five nav links plus Log in and Register. The menu closes on link selection, on Escape (returning focus to the hamburger), and on outside click. No third-party icon library; the hamburger is built from CSS lines.

**Registration dialog** — native `<dialog id="register-dialog">`. Heading `Create your account`. Fields: Full name (`text`, required, `autocomplete="name"`), Email (`email`, required, `autocomplete="email"`), Password (`password`, required, `minlength="8"`, `autocomplete="new-password"`), Confirm password (same, plus mismatch validation). Checkbox: `I agree to the Terms and Privacy Policy` (required; `Terms` and `Privacy Policy` are placeholder links, `href="#"`, class `placeholder-link`, destinations TODO). Submit button: `Create Account`. On mismatched passwords, shows the inline error `Passwords do not match.`, cleared once corrected. On successful validation: no network request, no account created, nothing stored (no cookies/localStorage/sessionStorage/URL params), and the inline success message `Form validated successfully. No account has been created.` is shown. Close button accessible name: `Close registration dialog`. `// TODO: wire up real registration endpoint` marks the client-only handler in `js/site-shell.js`.

**Login dialog** — native `<dialog id="login-dialog">`. Heading `Log in`. Fields: Email (`email`, required, `autocomplete="email"`), Password (`password`, required, `autocomplete="current-password"`). Submit button: `Log in`. On submit: no network request, nothing stored, inline result `Demo only. Sign-in is not connected yet.` is shown. Close button accessible name: `Close login dialog`. `// TODO: wire up real authentication endpoint` marks the client-only handler in `js/site-shell.js`.

Both dialogs: `aria-labelledby`, focus the first field on open, close on Escape/backdrop click/close button, reset validation/result state and clear password fields on close. Focus restoration: a dialog opened from the desktop header returns focus to that same desktop button on close; a dialog opened from the mobile menu closes the menu and returns focus to the hamburger button on close, since the mobile menu's own Log in/Register buttons are hidden once the menu closes. Both dialogs are explicitly `position: fixed`, centered in the viewport via `inset: 50% auto auto 50%; margin: 0; transform: translate(-50%, -50%)` (needed because the project's global `* { margin: 0; }` reset overrides the browser's native dialog centering) — this is static layout positioning, not an animation. Visual treatment: `--gr-surface` background, plain `rgba(0,0,0,.6)` backdrop (no blur), no gradient/glow/shadow, `width: min(560px, calc(100vw - 48px))`, `max-height: 90svh` with internal scroll, 8px radius, 1px `--gr-glass-line` border, IBM Plex Sans. Under `prefers-reduced-motion: reduce`, no open/close animation.

**Footer** — `<footer class="site-footer">`, placed after Screen 10, `--gr-void` background, 1px top hairline (`--gr-glass-line`), compact vertical padding `clamp(72px, 8vw, 96px)`, no gradient/shadow/glass.

Full logo: `media/logo/gr-full-lockup.png`, alt text `GLOBAL RESERVE® — SECURE TODAY. EMPOWER TOMORROW.`, desktop width 380-420px, mobile `min(100%, 320px)`, never upscaled beyond 420px, tagline preserved uncropped.

Social placeholders: four hand-authored inline SVGs (Instagram, LinkedIn, X, YouTube), `currentColor`, each `href="#"`, class `placeholder-link`, accessible `aria-label`, destinations TODO.

Footer navigation (`<nav aria-label="Footer navigation">`):

| Label | Destination |
|---|---|
| Overview | `#screen-2` |
| RED | `#screen-3` |
| Rewards | `#screen-4` |
| Reserve | `#screen-5-5` |
| Gia | `#screen-7` |
| Terms | `#` (placeholder, TODO destination) |
| Privacy | `#` (placeholder, TODO destination) |

Legal line (IBM Plex Mono): `Global Reserve is part of the Glonari platform. This page is for product information only and is not a statement of account.`

Copyright line (IBM Plex Mono): `© 2026 Global Reserve`

Placeholder-link prevention (Terms, Privacy Policy, Terms, Privacy, Instagram, LinkedIn, X, YouTube — all class `placeholder-link`) is handled once in `js/site-shell.js`, which does not read from or modify `js/scrub.js` or any other screen-specific script.

---

## 6. MEDIA CONTRACT

Every media slot is a `<div class="media-slot" data-slot="...">` with a fixed `aspect-ratio`. If the asset file is missing, the slot renders a neutral placeholder: `--gr-paper-2` fill, 1.5px dashed `--gr-line` border, and a centered English label reading `Media pending` plus the expected filename. The page must never break because an asset is absent.

| Slot | Screen | File | Format | Length | Behaviour |
|---|---|---|---|---|---|
| `--media-hero` | 1 | `media/hero-vault.mp4` | 1280x720 | 6s | Scroll-scrubbed. Already present as `video111.mp4`; re-encode with `ffmpeg -i video111.mp4 -g 1 -an media/hero-vault.mp4`. `#scrub-video` carries `poster="media/hero-vault-poster.jpg"` (`hero-vault.mp4`'s own first frame) so the correct frame paints immediately on render, before `js/scrub.js` finishes fetching the video as a blob and assigns `video.src` |
| `--media-reveal` | 4.5 | `media/reveal-vault.mp4` | 1280x720, 30fps | 4.5s (135 frames), ~1.83MB, autoplaying loop | Plays continuously (`autoplay muted loop`), independent of scroll — scroll drives only the section's mask, overlay, and headline (Section 5.4a) |
| `--media-question` | 2 | `media/time-scale.mp4` | 1080x1080 | 4-6s | Plays once when the section reaches 40% of the viewport, then holds the last frame. May be generated instead — Section 7.1 |
| `--media-red` | 3 | `media/red-object.webp` | 800x800, transparent | still | Static. Optional 8-10s loop if a video version is supplied |
| `--media-counter` | 4 | `media/rewards-ticker.mp4` | 1920x200 | 8s | Loop. May be generated instead — Section 7.2 |
| `--media-reserve-demo` | 5.5 | `media/reserve-hologram-bg.webp` | 1920x1080 | still | Clean vault background only; hologram interface is built in HTML/CSS/SVG and controlled by scroll |
| `--media-home` | 6 | `media/home.png` | 1254x1254 source, cropped to 4:5 | still | Static photograph, displayed in a 4:5 cropped media frame |
| `--media-gia` | 7 | `media/gia.mp4` | 1288x1610, 4:5 | ~5.04s | No `autoplay`, no loop. Muted, `playsinline`, poster `media/gia-poster.jpg`. Plays once per visit when ~30% visible (`IntersectionObserver`), holds last frame, resets only after fully leaving Screen 7. No mute/unmute button, no controls, no captions track |
| `--media-cta` | 10 | `media/cta-vault.mp4` | 1280x720, H.264, 30fps | ~6.01s, ~2.42MB | Autoplaying, muted, looping background at natural playback speed. Not scroll-scrubbed. Poster `media/cta-vault-poster.jpg` shown under `prefers-reduced-motion: reduce` and below 768px |

All videos: no audio track except Gia, `preload="metadata"`, `playsinline`, and `muted` before `autoplay`. Total page weight target under 12MB on desktop; on viewports under 768px, load poster images instead of the decorative videos on Screens 2, 4, and 10.

Screen 4.5's video autoplays and loops independently of scroll, like the Screen 10 CTA video. It stays a real video at every viewport width and is sized to fit inside the existing 12MB budget alongside the other video slots above.

---

## 7. GENERATED ANIMATIONS

Two assets may be built in code instead of supplied as video. Build them only when explicitly asked in the prompt. Until then, the slot shows the placeholder from Section 6.

Both must be self-contained, dependency-free, canvas or SVG, under 150 lines, and must respect `prefers-reduced-motion: reduce` by rendering their final frame statically.

### 7.1 Screen 2 — balance-to-time animation (`js/timescale.js`)

A vertical stack of bars representing an amount dissolves and re-forms as a horizontal timeline. Duration 4s, ease-out, plays once when the section crosses 40% of the viewport, then holds the final frame.

- Colors from tokens only: bars `--gr-line`, timeline rule `--gr-ink-2`, one accent tick in `--gr-accent`.
- No axis labels, no numbers, no currency symbols, no tooltips. The only number on this screen is the English stat line in the markup.
- Square canvas, `aspect-ratio: 1/1`, responsive to container width, drawn at `devicePixelRatio`.
- Export a single `initTimeScale(el)` function. No globals.

### 7.2 Screen 4 — rewards counter (`js/counter.js`)

A horizontal strip suggesting continuous accrual: small marks drifting right at constant speed, occasionally brightening.

- Strip is `1920x200` in proportion, full container width, height clamped to 120px.
- **No digits at all.** No currency, no percentages, no plus signs. Motion only.
- Speed: one full traversal in 8s, `linear`, seamless loop.
- Colors: marks `--gr-line`, highlight `--gr-accent` at 40% opacity.
- Export a single `initCounter(el)` function. No globals.

---

## 8. MOTION, ACCESSIBILITY, PERFORMANCE

1. Scroll reveal for ordinary Screens 2-10: opacity `0 -> 1` and `translateY(24px -> 0)`, 600ms, `cubic-bezier(.22,.61,.36,1)`, triggered once at 25% visibility via `IntersectionObserver`. Screen 4.5 and Screen 5.5 use only their own explicitly specified scroll sequences.
2. No parallax, no pinned sections other than Screen 1, Screen 4.5, Screen 5.5, and Screen 7, no horizontal scroll, no scroll hijacking. Screen 7's pin is conditional: it only applies at `min-width: 1100px` and `min-height: 700px` and `prefers-reduced-motion: no-preference` (Section 5.7); outside that window it is a normal static block.
3. `@media (prefers-reduced-motion: reduce)`: disable reveal, marquee, bubbles, and generated animations; show final frames; Screen 1 shows a single static frame with its text visible. Screen 4.5 is fully static too: no pin, its clip-path/overlay/headline hold at their resting state without animating, and its background video has `autoplay`/`loop` turned off via JavaScript and is paused on a single stable frame. Screen 5.5 also loses its pin and displays the complete hologram composition statically with every label and the example disclaimer visible.
4. Semantic markup: one `<h1>` (Screen 1) and `<h2>` for every other screen. Buttons that navigate are `<a>`. Decorative media gets `aria-hidden="true"` and empty `alt`.
5. Keyboard: visible focus ring, logical tab order, no positive `tabindex`.
6. Contrast: all text meets WCAG AA. Over video, rely on the text shadow plus a `rgba(0,0,0,.25)` overlay if a measurement fails.
7. Fonts: `display=swap`, preconnect to Google Fonts, one family, two weights.
8. Images: `loading="lazy"` on everything below the fold, explicit `width` and `height` to prevent layout shift.
9. No console errors or warnings on load.

---

## 9. ACCEPTANCE CHECKLIST

Before reporting done, verify each item and state the result:

- [ ] No Cyrillic character exists anywhere in the repository output. Verify with `grep -rPl "[\x{0400}-\x{04FF}]" --include=* .` over the files you created or edited, excluding the three original `.md` reference files.
- [ ] All nine numbered screens (1-8, 10 — Screen 9 intentionally removed) plus Screen 4.5 and Screen 5.5 exist with correct ids and `data-screen` values (eleven sections total).
- [ ] Every string on the page matches Section 5 character for character.
- [ ] Screen 1 still scrubs on scroll and its text coordinates are unchanged.
- [ ] Missing media assets render the placeholder, and the page still lays out correctly.
- [ ] Screens 4 and 8 contain no digits.
- [ ] Screen 5.5 appears automatically during normal page scroll, uses one unified projection plane, reveals Ready, Reserved, Scheduled, and Committed in the specified order, holds the complete readable composition, and reverses correctly on upward scroll. It is not a modal and is not gated behind a click.
- [ ] Screen 5.5 shows `Example interface — not your account.` whenever example figures are visible; its interface text is HTML/SVG rather than baked into the background image.
- [ ] In normal motion, Screen 4.5's video autoplays, loops, and is paused only while the section is fully out of view (`IntersectionObserver`); scroll drives only the clip-path reveal/contraction (no layout shift), overlay, and headline. Under `prefers-reduced-motion`, the mask/overlay/headline hold at rest and the video itself is paused on a single stable frame (`autoplay`/`loop` off via JavaScript) — a fully static composition.
- [ ] Screen 1, Screen 4.5, Screen 5.5, and Screen 7 are the only four pinned/scroll-stage sections on the page. Screen 7's pin applies only at `min-width: 1100px`, `min-height: 700px`, and `prefers-reduced-motion: no-preference` — outside that window it is a normal static block.
- [ ] The Gia video element exists with `muted`, `playsinline`, and a poster, with no `autoplay` and no `loop`. It starts once at roughly 30% visibility, plays through exactly once per visit to the section, resets only after the visitor has fully left Screen 7, and plays again from the start on return.
- [ ] Layout is correct at 1920, 1440, 1024, 768, and 375 CSS pixels.
- [ ] `prefers-reduced-motion` produces a fully static, readable page.
- [ ] No framework, no build step, no package manager files added.

---

## APPENDIX A — PROMPTS TO PASTE INTO CLAUDE CODE

Use these in order. Each assumes this document is open in the workspace as `BUILD-SPEC.md`.

**A1 — Scaffold**

> Read BUILD-SPEC.md. Follow Rule 0 strictly: English only in all output, no Cyrillic anywhere. Restructure the project per Section 3 without changing how Screen 1 behaves, create the token files from Section 4, and scaffold empty sections for Screens 2-10 plus Screen 4.5 and Screen 5.5 with correct ids, `data-screen` values, and headings only. Do not write any copy yet beyond the headings.

**A2 — Copy and layout, in batches**

> Read BUILD-SPEC.md Section 5.2 through 5.5a and build Screens 2 through 5 plus the independent Screen 4.5 and Screen 5.5 sections between them: markup, copy verbatim, layout, scroll behaviour, reduced-motion fallback, and responsive behaviour at the 768px breakpoint. Use the media placeholder from Section 6 for every media slot. Screen 5.5 is not a modal and must not be hidden behind a click. English only.

> Now do the same for Sections 5.6 to 5.8, then 5.10. Screen 9 was removed by an approved design decision (Section 5.9) — do not build it.

**A3 — Motion and accessibility**

> Implement Section 8 across all screens: the reveal observer, the Screen 8 marquee, the Gia quote bubbles, reduced-motion fallbacks, focus states. No other animation.

**A4 — Generated animations, only if wanted**

> Build the Screen 2 animation described in Section 7.1 as `js/timescale.js`, canvas-based, no dependencies, tokens for color, no numerals, reduced-motion safe.

> Build the Screen 4 counter described in Section 7.2 as `js/counter.js`. Motion only, no digits of any kind.

**A5 — Audit**

> Run the acceptance checklist in Section 9 and report each item as pass or fail with the file and line where it fails. Fix the failures, then re-run the checklist.

---

## APPENDIX B — TERMINOLOGY LOCK

These are product terms. Use exactly this spelling and capitalisation, and never translate or paraphrase them:

`GLOBAL RESERVE®` · `Global Reserve` · `Glonari` · `RED` · `Real Estate Dollars` · `Gia` · `Ready` · `Committed` · `Reserved` · `Scheduled`

Never introduce on this page: `GD`, `Glonari Dollars`, `Future RED`, `Global Dream`, `DBR`, `Experience Capacity`, tier names, percentages, yields, cost bases, or any specific balance figure. If a task seems to require one, stop and ask.

Exception: inside the independent Screen 5.5 reserve hologram only, the illustrative example figures specified in Section 5.5a are permitted. The persistent disclaimer `Example interface — not your account.` qualifies all of them. This does not lift the restriction anywhere else on the page — Screens 1–10 and their copy remain governed by the rule above.

---

## APPENDIX C — OUT OF SCOPE

Do not add: cookie banner, language switcher, dark-mode toggle, contact form, pricing table, FAQ accordion, testimonials, logo carousel, chat widget, analytics, or any third-party script.

**Approved exception (global site-shell task):** a global fixed header with navigation, a global footer with navigation and social placeholders, a registration dialog, and a login dialog are approved and specified in Section 5.11. Every other exclusion above remains in force — no cookie banner, language switcher, dark-mode toggle, contact form, pricing table, FAQ, testimonials, logo carousel, chat widget, analytics, third-party icon library, or other new script/dependency.

---

## APPENDIX D — ЗАМЕТКА ДЛЯ ДИЗАЙНЕРА (не инструкция для Claude Code)

*Этот раздел — для человека. Claude Code его игнорирует: в Rule 0 прямо сказано не воспринимать его как задание и не переносить кириллицу в код.*

**Как пользоваться документом**

1. Положите файл в корень проекта под именем `BUILD-SPEC.md` и откройте папку в VS Code.
2. В Claude Code давайте промпты из Appendix A по очереди, по одному за раз. Не просите «сделай всё сразу» — на десяти экранах он начнёт сокращать текст.
3. После каждого шага просите короткий отчёт: какие файлы изменены и что осталось незакрытым.

**Почему русского нет в основном тексте**

Весь документ написан по-английски специально: если инструкция двуязычная, модель регулярно тащит русские формулировки в `alt`, в комментарии и в служебные строки. Rule 0 плюс пункт в чек-листе с `grep` по диапазону кириллицы закрывают это на двух уровнях — на входе и на выходе.

**Про анимации (экраны 2 и 4)**

Секция 7 написана так, что Claude Code не тронет их, пока вы явно не попросите промптом A4. Если решите делать видео отдельно — просто положите файлы по путям из таблицы в секции 6, и заглушки сами заменятся. Ключевое ограничение, которое стоит держать: на счётчике не должно быть ни одной цифры, иначе экран начинает читаться как банковский баланс, а весь смысл страницы в обратном.

**Что я бы проверила руками после сборки**

- Экран 1 — не съехали ли координаты текста относительно Figma (504 / 114 / 432).
- Экран 6 — строка про сброс таймера должна остаться крупной и заметной.
- Экран 7 — видео с Gia обязано быть на месте; если его подменили картинкой, экран теряет смысл.
- Экраны 4 и 8 — ни одной цифры.
- Экран 4.5 (новый) — обычное циклическое видео, которое играет независимо от скролла; скролл управляет только маской, затемнением и заголовком; проверить, что вес вписывается в общий бюджет страницы наравне с остальными видео.
