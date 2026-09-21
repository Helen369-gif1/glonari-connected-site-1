# TIMECODING

## DIGITAL BANKER — SCROLL TIMECODE SPECIFICATION

### Video Timecodes

| Block | Timecode |
|---|---|
| Block 1 | `00:00.0 – 00:02.5` |
| Block 2 | `00:02.5 – 00:05.5` |
| Block 3 | `00:05.5 – 00:07.5` |
| Block 4 | `00:07.5 – 00:10.0` |

### Transition Requirements

- **Crossfade Duration:** `0.5 seconds`
- Smooth `fade-in` and `fade-out` for each text block during scroll phase transitions.

### Block 4 Display Requirements

- **Fixed State:** Must remain visible on screen from `00:08.0` to `00:10.0`.
- **Behavior:** Holds position while the character stands in the open welcome posture to allow complete reading before user interaction.
