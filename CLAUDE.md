# Glonari-Global-Scene — project rules

## Mandatory documentation updates

**Scope: this applies to the entire project, including `mobile/`.** The
"scene" and "interactive elements" below are not just the desktop scene in
the repo root — a change to the mobile scene (`mobile/index.html`,
`mobile/styles.css`, `mobile/main.js`, or any shared file like
`section-modal.js`/`section-modal.css`/`design-tokens.css` insofar as the
change affects mobile behavior) is held to exactly the same rule as a
change to root `index.html`/`styles.css`/`main.js`. Do not treat `mobile/`
as a separate, lighter-weight tree just because it started as a static
image with no plan/PRD coverage of its own — Stage 14 / PRD §19 (and any
future mobile-specific stage/section) are the same kind of "confirmed
decision" as anything about the desktop scene.

After EVERY completed task that changes, **on desktop or on mobile**:
- the scene's movement/parallax architecture
- the list of interactive elements (which buildings/tap-zones react to
  hover/click/tap)
- visual behavior (day/night, hover, click, tap, loading screen)
- any decision previously recorded as "confirmed" in PRODUCT_REQUIREMENTS.md,
  or as acceptance criteria / a stage status in DEVELOPMENT_PLAN.md

— both documents below MUST be updated BEFORE the task is considered done:

1. **DEVELOPMENT_PLAN.md** — find the relevant Stage and update:
   - acceptance criteria, if behavior changed
   - stage status
   - when superseding/replacing a previously accepted decision, add a block
     in the existing style: `> **SUPERSEDED (YYYY-MM-DD)** — [what changed],
     replaced by [what it's now], see chat/prompt from [date]`, without
     deleting the old text — the history of decisions must stay visible,
     never erased.

2. **PRODUCT_REQUIREMENTS.md** — find the relevant item (usually in §23
   "Confirmed requirements", but check other sections too if the decision
   is echoed there, e.g. §16 "Motion principles") and update with the same
   logic: don't delete, mark SUPERSEDED with a date and a short explanation
   of what replaced the old decision.

## Reporting on completed work

Do not publish a separate Artifact (HTML page or otherwise) for a
status/QA/test report on this project unless explicitly asked for one.
Report back in plain chat text instead. If screenshots are genuinely
useful to show something visually, attach them as plain image files
(e.g. saved to the scratchpad or referenced by path), not as a hosted
report page.

## Definition of done

A task that changes previously-documented behavior is not done if the code
changed but DEVELOPMENT_PLAN.md and/or PRODUCT_REQUIREMENTS.md did not —
this holds regardless of whether the changed code lives in the repo root
or under `mobile/`. If a task does NOT change a previously-recorded
decision (e.g. a purely visual bugfix with no architecture/scope change),
the documents do not need to be updated.
