# Scroll-Driven Video Scrubber

An Apple-style scroll-driven video experience where a video scrubs frame-by-frame as the user scrolls, with animated text chapters that fade in and out at defined scroll positions.

## How It Works

### Architecture

The project is a single-page static site with three files:

- **`index.html`** — Page structure with an intro section, a scroll-driven performance section containing four chapters, and a bottom content area.
- **`style.css`** — Layout and animations, including the sticky viewport, gradient text effect, and responsive styles.
- **`script.js`** — Scroll-to-video synchronization and chapter animation logic.

### Scroll-Driven Video Scrubbing

The core mechanic uses a tall scroll runway (`700vh`) with a `position: sticky` child pinned to the viewport. As the user scrolls through this tall container:

1. **Scroll progress** is calculated as a 0–1 value based on how far through the `chapters-wrapper` you've scrolled.
2. **Video seeking** — The video's `currentTime` is set directly to `progress * duration`, scrubbing it in sync with scroll position. The video file must be encoded with every frame as a keyframe (`-g 1` in ffmpeg) so seeks are instant.
3. **Blob loading** — The video is fetched as a blob and assigned via `URL.createObjectURL()`, guaranteeing the entire file is buffered in memory for instant seeking (browsers may ignore `preload="auto"` for large files).

### Chapter Animations

Each chapter div has `data-*` attributes defining three animation phases as scroll-progress thresholds:

| Phase | Effect |
|-------|--------|
| **Intro** (`data-intro-start` to `data-intro-end`) | Fade in + slide up (Y: 90px to 15px) |
| **Bridge** (`data-bridge-start` to `data-bridge-end`) | Hold visible, slow drift (Y: 15px to -15px) |
| **Outro** (`data-outro-start` to `data-outro-end`) | Fade out + slide up (Y: -15px to -120px) |

All four chapters occupy the same grid cell and are layered — only one is visible at a time.

### Gradient Text Sweep

Headlines use a CSS `background-clip: text` trick with a tall linear gradient (200% height). Initially the dark portion is visible. When the scroll reaches `data-gradient-trigger`, the `.active` class is added, shifting `background-position` to reveal the colored portion. The CSS `transition` animates this as a color sweep.

### Performance

- Scroll events use `requestAnimationFrame` debouncing to avoid layout thrashing.
- The scroll listener is registered as `{ passive: true }`.

## Video Preparation

The source video must be re-encoded with all keyframes for instant seeking:

```bash
ffmpeg -i source.mp4 -g 1 -an performance-scrub.mp4
```

- `-g 1` — every frame is a keyframe (enables instant seeks to any frame)
- `-an` — strips audio (not needed for a scrub video)

## Running Locally

Serve the directory with any static file server (the blob fetch requires HTTP, not `file://`):

```bash
npx serve .
# or
python3 -m http.server
```
