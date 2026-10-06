# Shy nav dismiss "snap" — investigation log (paused)

Status: **paused** (2026-10-02). Multiple fix attempts landed no visible
improvement. This doc records what was tried and what was verified, so the
next attempt doesn't retrace the same ground.

> **Code-drift warning (2026-10-06):** the v5 changes described below were
> never committed and no longer exist. The working tree is clean, and the
> sequenced dismiss they patched (hairline exit wipe + `transition-delay`
> slide, `is-exiting`, `EXIT_SEQUENCE_MS`) is gone from the code entirely —
> `Navigation.astro` now runs a single 240ms transform slide with the frost
> parked on a pseudo-layer during motion (`is-animating`, commit d4cc8b8).
> Whether the snap symptom survives that rewrite is unverified; re-confirm
> the symptom before reviving any hypothesis below. The timeline is kept as
> a record of dead ends, not as a description of current code.

## Symptom

On dismiss of the shy nav (revealed frosted bar → scroll down → bar slides
up), the bar snaps the last few percent of its travel instead of sliding
smoothly to the end. The sequenced dismiss (240ms hairline exit wipe, then
240ms bar slide via `transition-delay`) is mechanically intact; the
residual defect is the tail snap. Additionally the 1px hairline wipe at
`--fg-20` was judged illegible.

## Timeline of attempts

### v3 — sequenced dismiss with `transition-delay`

The dismiss was restructured so the hairline wipe plays first while the
bar's transform leg is delayed one `--motion-quick` (240ms) via
`.navigation.is-shy.is-exiting { transition-delay: ... }`. This fixed the
wipe being smeared by the concurrent slide, but introduced/retained the
tail snap.

Diagnosis of the snap: removing `is-exiting` mid-slide changes
`transition-delay` on a *running* transition; the browser re-evaluates
elapsed time against the transition's original start, reads it as
complete, and snaps to the final transform.

### v4 — `EXIT_SEQUENCE_MS` (480ms) timer

`beginExiting()` in `lib/shyNav.ts` cleared `is-exiting` on a 480ms
`setTimeout` (wipe 240ms + slide 240ms). Intended to keep the delay stable
for the whole sequence. Result: snap persisted. Root cause of the failure:
style recalc can lag the class flip by frames under scroll jank (Lenis),
so the slide regularly ends *after* t=480 and the timer still drops the
class mid-flight. No timer value can fix this — the class lifetime must
ride the transition's own lifecycle, not a wall clock.

### v5 — persistence model (latest attempt, this session)

- Removed the `EXIT_SEQUENCE_MS` timer entirely. `is-exiting` now persists
  while the bar is hidden and is cleared only by `clearExiting()` from
  `setState('top')`, `setState('revealed')`, and `initShyNav()` — always in
  the same tick as the transform change, so the delay change lands in the
  same style recalc.
- Prominence bump for the wipe: `shy-hairline-draw` animates
  `--fg-60 → --fg-20` (arrives hot, settles to the hairline recipe);
  `shy-hairline-exit` holds `--fg-60` through the sweep (ends clipped
  away, so the settle value is never seen). Background animates inside the
  keyframes — one animation, no extra pseudo properties.

**Verification that passed:**
- Full test suite (419 tests) and eslint clean.
- Live `animationstart` diagnostic (headless Chrome against the dev
  server): `shy-hairline-draw` fires on reveal, `shy-hairline-exit` fires
  on dismiss (first time this event was ever captured), `is-exiting`
  persists while hidden and clears with the class flip on re-reveal.

**Result:** user screen recording shows **no visible change** — the snap
is still there (and/or the wipe still doesn't read). Paused here.

## Open questions for the next attempt

- Is the snap actually in the *bar's* transition, or is it Lenis scroll
  interpolation making the last frames of page motion read as a nav snap?
  The class-lifecycle theory is now exhaustively closed off; the next
  hypothesis should come from a frame-level capture (Chrome DevTools
  Performance trace or `PerformanceObserver` + transform sampling), not
  another code theory.
  - **Update (2026-10-06):** Lenis is retired (ADR-0041, PR #170); scrolling
    is native everywhere. The Lenis-interpolation half of this question is
    now cheap to close — if the snap still reproduces on current main, the
    bar's own transition is the only remaining suspect.
- Capture the dismiss with `getComputedStyle(nav).transform` sampled per
  rAF to see whether the transform itself jumps or completes smoothly.
- Consider whether the exit wipe's prominence change is even perceptible
  at 1px/240ms; if not, the wipe may need a different treatment
  (thicker line during the sweep, or drop the wipe on dismiss).

## Current working tree

Clean. The v5 changes listed in the original log (`lib/shyNav.ts` persistence
model, `Navigation.astro` hot-sweep keyframes, the matching test and
design-system.md edits) were never committed and were later discarded; the
dismiss itself was subsequently rewritten (see the code-drift warning at the
top). Nothing to keep or revert — start any new attempt from `main`.
