# Global Reserve — Permanent Project Instructions

## Required reading

Before modifying any project file, read these documents completely:

1. `GLOBAL-RESERVE-BUILD-SPEC.md`
2. `GLOBAL-RESERVE-DESIGN-SYSTEM.md`

Do not begin implementation until both documents have been read.

## Source-of-truth order

Follow this precedence:

1. The current user prompt controls the scope of the current task.
2. `GLOBAL-RESERVE-DESIGN-SYSTEM.md` controls colors, typography, spacing, grids, component appearance, section rhythm, responsive behaviour, and visual motion character.
3. `GLOBAL-RESERVE-BUILD-SPEC.md` controls approved English copy, screen order, product terminology, semantics, media contracts, timing requirements, accessibility, and functionality.
4. Existing approved screens must remain unchanged unless the current user prompt explicitly authorizes changes to them.

If two instructions conflict, stop and report the conflict instead of guessing.

## Scope protection

* Work on only the screen or bounded system task named in the current prompt.
* Do not modify previously approved screens.
* Screen 1 is locked. Do not change its HTML, CSS, JavaScript, scroll runway, video, text coordinates, timing, smoothing, or overflow behaviour unless the current prompt explicitly authorizes a Screen 1 change.
* Do not fix unrelated problems.
* Keep unfinished screens hidden until they are implemented and visually verified.
* Preserve existing user changes and inspect `git status` and `git diff` before editing.

## Documentation synchronisation

Update project documentation when an approved project rule changes.

Update `GLOBAL-RESERVE-BUILD-SPEC.md` in the same task when the user approves a change to:

* page copy;
* screen order;
* product terminology;
* semantic structure;
* required functionality;
* media paths or media behaviour;
* scroll timing;
* video timing;
* animation progress ranges;
* accessibility requirements.

When Screen 1 timing changes are explicitly authorized, also update `global_reserve_timecoding.md`.

Update `GLOBAL-RESERVE-DESIGN-SYSTEM.md` in the same task only when the user explicitly approves a permanent change to:

* colors or design tokens;
* typography;
* container or grid rules;
* section spacing;
* breakpoints;
* shared component appearance;
* permanent motion principles.

Do not change a specification merely to justify an implementation mistake. If code conflicts with the approved specification, fix the code or report the conflict.

A small bug fix that only restores compliance with an existing document does not require rewriting that document.

## Language

* All project files must remain in English.
* Never add Cyrillic characters to HTML, CSS, JavaScript, JSON, Markdown documentation, comments, attributes, filenames, or commit messages.
* User-facing copy must match the approved Build Spec character for character unless the current prompt explicitly supplies replacement copy.

## Implementation

* Use vanilla HTML, CSS, and JavaScript.
* Do not add frameworks, npm, bundlers, TypeScript, Tailwind, or React.
* Reuse existing classes, tokens, functions, and components.
* Do not duplicate an existing implementation when it can be safely reused.
* Do not introduce new libraries without explicit permission.
* Respect `prefers-reduced-motion`.
* Do not add horizontal scrolling.
* Do not make layout changes while an animation is running.
* Missing media must not break the page.

## Git workflow

Before editing:

* run `git status`;
* inspect the current `git diff`;
* identify existing user changes;
* do not overwrite or revert them.

After editing:

* show the changed files;
* run relevant syntax and browser checks;
* show `git status`;
* show `git diff --stat`;
* clearly separate changes made in the current task from earlier uncommitted changes.

Do not run `git add`, create a commit, push, pull, reset, discard changes, or modify branches unless the current prompt explicitly authorizes that exact Git action.

## Verification

Before reporting a screen complete:

* verify the approved copy;
* verify desktop, tablet, and mobile layouts;
* verify no horizontal scrolling;
* verify the browser console has no project errors or warnings;
* verify reduced-motion behaviour;
* verify previously approved screens remain unchanged;
* verify unfinished screens remain hidden;
* verify no Cyrillic was added to project files.

Keep reports concise and factual.
