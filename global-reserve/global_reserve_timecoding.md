# TIMECODING

## GLOBAL RESERVE — SCROLL TIMECODE SPECIFICATION

> **Note:** The supplied video (`video5.mp4`, 5.0 s) does not contain a burned-in text layer — visual frame-by-frame analysis confirmed no text is rendered in the footage itself. The timecodes below are therefore **proposed** values, scaled proportionally from the `digital_banker_timecoding` reference (10 s / 4 blocks) down to this screen's 5 s / 2 blocks, following the same pacing logic (shorter hold for the headline, longer hold for the body copy). Adjust if the actual production timing differs.

### Video Timecodes

| Block | Timecode |
|---|---|
| Block 1 | `00:00.0 – 00:02.0` |
| Block 2 | `00:02.0 – 00:05.0` |

### Transition Requirements

- **Crossfade Duration:** `0.5 seconds`
- Smooth `fade-in` and `fade-out` for each text block during scroll phase transitions.

### Block 2 Display Requirements

- **Fixed State:** Must remain visible on screen from `00:02.5` to `00:05.0`.
- **Behavior:** Holds position after fade-in completes, to allow complete reading of the paragraph before the scroll phase ends.
