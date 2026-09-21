# Global Reserve Design System

Version: 1.0  
Reference: https://digital-banker-d2-production.up.railway.app/pages/landing.html  
Scope: Screens 2-10. Screen 1 keeps its existing approved visual treatment unless a later task explicitly changes it.

## 1. Purpose and precedence

This file is the visual source of truth for Global Reserve.

When implementation documents disagree, use this order:

1. The current user prompt controls the scope of the task.
2. This design system controls colors, typography, spacing, grids, section rhythm, component appearance, and responsive behavior.
3. `GLOBAL-RESERVE-BUILD-SPEC.md` controls approved English copy, section order, product terminology, semantic requirements, and required functionality.
4. Existing approved Screen 1 behavior remains unchanged unless the current prompt explicitly changes it.

Do not copy text, logos, navigation, or product-specific components from the reference website. The reference is used only for visual rhythm, density, typography, color, and motion character.

## 2. Design character

Global Reserve should feel:

- dark, precise, and calm;
- premium without decorative luxury styling;
- digital and intelligent rather than editorial;
- spacious but never empty;
- structured by alignment, contrast, and rhythm;
- animated with restrained, purposeful motion.

Avoid:

- light editorial pages after the hero;
- oversized serif display text below Screen 1;
- large unexplained empty areas;
- isolated lines or decorative objects that become meaningless when animation stops;
- gradients used as large background fills;
- glassmorphism, heavy shadows, excessive rounding, or ornamental cards;
- inconsistent section padding.

## 3. Core tokens

Add these tokens to `css/tokens.css`. Reuse them instead of repeating raw values.

```css
:root {
  /* Dark surfaces */
  --gr-void: #050508;
  --gr-void-deep: #08090d;
  --gr-surface: #0c0d12;
  --gr-surface-elevated: #12141a;

  /* Brand accents */
  --gr-bronze: #cd7f32;
  --gr-bronze-glow: rgba(205, 127, 50, 0.4);
  --gr-bronze-subtle: rgba(205, 127, 50, 0.15);

  /* Text and rules */
  --gr-text-primary: #ffffff;
  --gr-text-secondary: rgba(255, 255, 255, 0.7);
  --gr-text-tertiary: rgba(255, 255, 255, 0.45);
  --gr-text-muted: rgba(255, 255, 255, 0.25);
  --gr-line-dark: rgba(255, 255, 255, 0.08);

  /* Type */
  --gr-font-ui: "IBM Plex Sans", system-ui, sans-serif;
  --gr-font-mono: "IBM Plex Mono", ui-monospace, monospace;

  /* Container */
  --gr-container-max: 1200px;
  --gr-page-pad: clamp(24px, 3.5vw, 48px);

  /* Spacing scale */
  --gr-space-1: 8px;
  --gr-space-2: 16px;
  --gr-space-3: 24px;
  --gr-space-4: 32px;
  --gr-space-5: 48px;
  --gr-space-6: 64px;
  --gr-space-7: 96px;
  --gr-space-8: 128px;
  --gr-space-9: 160px;

  /* Section rhythm */
  --gr-section-pad: clamp(96px, 11vw, 160px);
  --gr-section-pad-compact: clamp(72px, 8vw, 96px);
  --gr-grid-gap: clamp(48px, 6vw, 96px);
}
```

Do not change the existing Screen 1 tokens or its Playfair Display styling as part of ordinary work on Screens 2-10.

## 4. Typography

### 4.1 Font roles

- Screen 1: retain its existing approved Playfair Display treatment.
- Screens 2-10 headings and body: IBM Plex Sans.
- Eyebrows, labels, compact metadata, and technical captions: IBM Plex Mono.
- Never use Playfair Display in Screens 2-10 unless a current user prompt explicitly requests it.

Use one Google Fonts request containing the required IBM Plex Sans and IBM Plex Mono weights while preserving the existing Screen 1 family.

### 4.2 Type scale

| Role | Size | Weight | Line height | Letter spacing | Color |
|---|---:|---:|---:|---:|---|
| H1 outside Screen 1 | `clamp(40px, 5vw, 64px)` | 700 | 1.05 | `-0.03em` | primary |
| H2 standard | `clamp(32px, 4vw, 48px)` | 700 | 1.10 | `-0.02em` | primary |
| H2 large centered | `clamp(36px, 4.5vw, 56px)` | 700 | 1.10 | `-0.02em` | primary |
| H3 / item title | `clamp(20px, 2vw, 28px)` | 600 | 1.20 | `-0.01em` | primary |
| Lead | `clamp(18px, 1.8vw, 22px)` | 400 | 1.65 | normal | secondary |
| Body | `clamp(17px, 1.4vw, 20px)` | 400 | 1.70 | normal | secondary |
| Small body | `15px` | 400 | 1.60 | normal | secondary |
| Eyebrow / label | `12px` | 600 | 1.20 | `0.10em` | bronze or tertiary |
| Caption | `13px` | 400 | 1.55 | normal | tertiary |
| Large data phrase | `clamp(30px, 3.2vw, 46px)` | 600 | 1.08 | `-0.02em` | bronze |

### 4.3 Text width

- Standard text column: 500-560px.
- Centered heading block: 720px maximum.
- Centered CTA block: 800px maximum.
- Long body copy must not span the full container.
- Prefer intentional line breaks only when specified in the approved copy.

### 4.4 Vertical relationships

Use these distances consistently:

| Relationship | Distance |
|---|---:|
| Eyebrow to heading | 16px |
| Heading to body | 24-32px |
| Body paragraph to secondary paragraph | 16px |
| Body to stat, feature list, or primary component | 32-48px |
| Heading group to major media or grid | 64-96px |
| Item title to item body | 8px |
| Caption to related value | 12-16px |
| Divider to content below | 24px |
| Last content item to section edge | never less than the section bottom padding |

Do not position normal content using negative margins.

## 5. Layout grid

### 5.1 Standard container

```css
.gr-container {
  width: min(100%, var(--gr-container-max));
  margin-inline: auto;
  padding-inline: var(--gr-page-pad);
}
```

The `1200px` maximum includes the internal side padding. At wide viewport sizes, content should not spread beyond this container merely to fill space.

### 5.2 Desktop columns

- Standard split: `grid-template-columns: minmax(0, 1fr) minmax(0, 1fr)`.
- Standard split gap: 64px.
- Editorial split gap: 96px.
- 40/60 split: use only when required by the screen specification.
- All direct grid children must use `min-width: 0`.
- Align the top of related text and media unless the composition explicitly calls for vertical centering.

### 5.3 Section types

#### Standard section

Use for most content screens.

```css
.gr-section {
  padding-block: var(--gr-section-pad);
}
```

Target desktop padding: 160px top and 160px bottom.

#### Compact section

Use for intentionally shorter screens such as a concise statement, ticker, or transition.

```css
.gr-section--compact {
  padding-block: var(--gr-section-pad-compact);
}
```

Target desktop padding: 96px top and 96px bottom.

#### Viewport section

Use when the section should occupy at least one screen.

```css
.gr-section--viewport {
  min-height: 100svh;
  display: flex;
  align-items: center;
  padding-block: var(--gr-section-pad);
}
```

The section must be allowed to grow taller than the viewport. Never use fixed `height: 100vh` for a normal content section.

#### Scroll-performance section

Pinned or sticky scrolling is exceptional. Screen 1 is the approved example. Do not add pinned sections unless the current prompt explicitly requires them.

## 6. Section boundaries and spacing

Every section owns its top and bottom padding. Do not rely on child margins to create space between screens.

Rules:

1. A heading must never sit directly against the end of the previous screen.
2. Standard screens use at least 96px of visible space above the first content element.
3. Desktop standard screens target 160px above and below their content.
4. Compact screens target 96px above and below.
5. Mobile screens use at least 72px above and below.
6. Adjacent sections must not collapse margins.
7. Do not add arbitrary white strips or default body backgrounds between dark sections.
8. Do not use a border between sections unless it has a defined semantic purpose.
9. Full-bleed media may touch the viewport edge; text may not.
10. When content is taller than the viewport, preserve section padding and allow natural document flow.

## 7. Common screen compositions

### 7.1 Split text and media

Use for Screens 2, 6, and 7 when their specific requirements allow it.

```css
.gr-split {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: var(--gr-grid-gap);
  align-items: center;
}
```

Internal text rhythm:

1. Eyebrow, if present.
2. Heading after 16px.
3. Body after 24-32px.
4. Secondary component after 32-48px.

### 7.2 Centered header plus content

Use for Screens 3, 4, 5, and 8 when appropriate.

- Header block max-width: 720px.
- Center with `margin-inline: auto`.
- Heading to body: 24px.
- Header block to the next major component: 64-96px.
- Keep long body text left-aligned when readability is better, even if the block itself is centered.

### 7.3 CTA composition

- Content max-width: 800px.
- Heading to body: 24px.
- Body to actions: 48px.
- Button gap: 16px.
- Center content horizontally.
- On mobile, stack buttons at full width.

### 7.4 Lists and process rows

- Row padding: 24px vertically.
- Marker to text gap: 32px desktop, 20px mobile.
- Item title to description: 8px.
- Divider: `1px solid var(--gr-line-dark)`.
- Active or emphasized state: bronze marker or bronze text, not a large bronze fill.

## 8. Surfaces, cards, and media

### 8.1 Cards

- Base background: `var(--gr-surface)` or transparent.
- Elevated background: `var(--gr-surface-elevated)`.
- Border: `1px solid var(--gr-line-dark)`.
- Radius: 8px.
- Internal padding: 32px desktop, 24px mobile.
- Card grid gap: 24px.
- Do not apply shadows by default.
- Bronze is an accent, never the card's full background.

### 8.2 Media

- Media must have an explicit `aspect-ratio`.
- Media must never determine the page width.
- Use `object-fit: cover` for photography and video.
- Decorative canvas and images use `aria-hidden="true"` and empty alt text as appropriate.
- Media-to-text gap comes from the parent grid, not ad hoc margins.
- Missing media must preserve the intended layout.

### 8.3 Digital animation panels

- Background: void or surface.
- Primary graphics: bronze.
- Supporting graphics: bronze at low opacity or dark neutral lines.
- Maintain multiple visible elements in the static and animated states.
- A completed animation must not collapse into an isolated line or nearly empty frame.

## 9. Motion

- Text reveal: 600ms, translateY from 24px to 0, opacity from 0 to 1.
- Ease: `cubic-bezier(.22, .61, .36, 1)`.
- Content reveal runs once unless the screen specification says otherwise.
- Ambient canvas or decorative graphics may loop continuously while visible.
- Pause expensive animation while outside the viewport and resume on return.
- Looping animations must have a seamless reset and a meaningful image at every phase.
- Hover feedback: 200-300ms.
- Do not animate layout dimensions that cause surrounding content to move.
- Do not use parallax or scroll hijacking unless explicitly approved.
- Under `prefers-reduced-motion: reduce`, show a complete, readable final composition.

## 10. Responsive system

### Desktop: 1200px and above

- Container max-width: 1200px.
- Container internal padding: 48px.
- Standard section padding: 160px.
- Compact section padding: 96px.
- Two-column gap: 64-96px.
- Standard H2 max: 48px.
- Large centered H2 max: 56px.

### Tablet landscape: 769-1199px

- Page padding: 32px.
- Section padding: 96-128px.
- Two-column gap: 48-64px.
- Preserve two columns only while each column remains readable.
- Never compress a text column below approximately 360px.

### Tablet and mobile: 768px and below

- Page padding: 24px.
- Section padding: 72-96px.
- Stack split layouts to one column.
- Column gap after stacking: 48-64px.
- Do not automatically place media first. Follow the screen-specific reading order.
- H2: 32-40px depending on available width.
- Body: 17-18px.
- Cards use 24px internal padding.
- Buttons stack and become full width.

### Small mobile: 480px and below

- Page padding: 20px.
- Minimum section padding: 72px.
- H2 minimum: 30-32px.
- Never allow a heading, data phrase, or canvas to overflow the viewport.
- Avoid forced line breaks that create one-word lines.

## 11. Implementation rules

1. Reuse shared classes and tokens. Do not duplicate the same spacing values in every screen.
2. Use `clamp()` for fluid type and major spacing.
3. Use CSS Grid or Flexbox for layout; do not position ordinary content absolutely.
4. Reserve absolute positioning for overlays, decorative layers, and animation internals.
5. Use `box-sizing: border-box` globally.
6. Set `min-width: 0` on grid and flex children that contain text or media.
7. Keep `overflow-x` controlled without hiding genuine layout bugs.
8. Do not use fixed section heights for content sections.
9. Do not change Screen 1 while implementing another screen.
10. Keep unfinished screens hidden until they are fully implemented and visually checked.
11. Modify only the files authorized by the current prompt.
12. Keep all repository content in English.

## 12. Visual QA checklist

Before reporting a screen complete, verify:

- The first content element has at least the required section top padding.
- The last content element has at least the required section bottom padding.
- Heading, body, and component spacing follows Section 4.4.
- Text aligns to the container grid.
- No body paragraph is wider than 560px unless intentionally centered in a 720px header block.
- H2 uses IBM Plex Sans, correct weight, line height, and maximum size.
- Screen background and text colors use tokens from this document.
- Major columns use a 64-96px desktop gap and at least 48px after stacking.
- No content is clipped at 1440px, 1024px, 768px, or 375px widths.
- No horizontal scrolling exists.
- Motion remains meaningful after the first cycle or in its final state.
- Reduced-motion mode displays a complete static composition.
- The previous completed screen remains unchanged.
- Unfinished screens remain hidden.
- The browser console has no errors or warnings.

## 13. Required instruction for future prompts

Start every future implementation prompt with:

> Read `GLOBAL-RESERVE-BUILD-SPEC.md` and `GLOBAL-RESERVE-DESIGN-SYSTEM.md` before changing files. The build spec controls approved copy, section order, product terminology, semantics, and functionality. The design system controls visual styling, typography, colors, spacing, grids, section rhythm, and responsive behavior. If their visual instructions conflict, follow the design system. Do not change previously approved screens unless this prompt explicitly authorizes it.

Then specify exactly one screen or one bounded system task.

## 14. Screen 5.5 exception

> Screen 5.5 exception: the internal hologram interface uses the supplied Figma-derived panel implementation as its visual source of truth, including Roboto 400/500/600, its original type scale, colors, geometry, decorative SVG assets, and internal spacing. This exception applies only inside the Screen 5.5 hologram panel. The surrounding site and all other screens continue to use the standard Global Reserve design system.

## 15. Global site-shell components

Permanent visual rules for the fixed header, mobile menu, dialogs, and footer added by the global site-shell task. Implemented in `css/site-shell.css`.

- **Fixed header**: `position: fixed`, solid `--gr-void` (or `--gr-surface`) background, 1px bottom hairline in `--gr-glass-line`, no gradient, no backdrop blur, no shadow. Height 72px desktop, 64px mobile. It is an overlay — Screen 1 keeps its existing geometry unchanged.
- **Header wordmark exception**: the header brand lockup uses Playfair Display 700, color `var(--gr-bronze)`, for the live text `GLOBAL RESERVE®` — the only approved use of Playfair Display outside Screen 1. All other header, menu, dialog, and footer text uses IBM Plex Sans; small legal/copyright lines use IBM Plex Mono.
- **Responsive breakpoint**: 1100px is the site-shell breakpoint. Above it, the full desktop header (nav + actions) is shown. At 1100px and below, nav and actions collapse into a hamburger-triggered mobile menu.
- **Mobile menu**: solid dark surface (`--gr-void`), no gradient, appears below the fixed header, no open/close animation at any time (kept restrained by default, and required to be static under reduced motion).
- **Bronze primary action**: the `Register` button and dialog submit buttons use a solid `--gr-bronze` fill with dark, readable text — bronze stays a small, restrained fill on interactive controls only, consistent with Section 8.1's rule that bronze is an accent and never a large background elsewhere on the page.
- **`--gr-glass-line` dividers**: used for the header's bottom hairline, the footer's top hairline, dialog borders, and the `Log in` button's border — the same hairline token used elsewhere in the system for low-contrast separation.
- **Native dialog appearance**: both the registration and login dialogs use the native `<dialog>` element with a solid `--gr-surface` background, 1px `--gr-glass-line` border, 8px radius, and a plain `rgba(0,0,0,.6)` backdrop — no blur, no gradient, no glass effect, no shadow. Both dialogs are explicitly centered in the viewport (`position: fixed; inset: 50% auto auto 50%; transform: translate(-50%, -50%)`) rather than relying on native implicit centering, since the project's global margin reset overrides it.
- **Footer full-lockup image**: `media/logo/gr-full-lockup.png` is displayed at 380-420px wide on desktop and `min(100%, 320px)` on mobile, height auto, `object-fit: contain`, never upscaled beyond 420px, tagline never cropped.
- **Solid dark surfaces**: header, mobile menu, dialogs, and footer all use flat `--gr-void`/`--gr-surface` fills — no gradients or glassmorphism anywhere in the site shell, matching Section 2's "avoid" list.
- **Reduced-motion behaviour**: under `prefers-reduced-motion: reduce`, the mobile menu has no animation, dialogs open and close without animation, and no hover transform is applied anywhere in the site shell.

Do not change existing Screen 1-10 design rules as part of this section.
