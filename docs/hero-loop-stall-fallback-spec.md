# Hero Loop — Evidence-Based Stall Fallback

The home hero's progressive MP4 loop currently decides **once, at connect, from a
predicted network quality** whether the visitor ever sees motion. That decision
misfires on healthy home wifi and parks the site's centerpiece on a static poster
for the whole session. This spec replaces prediction with evidence: play the loop,
watch it, and fall back to HLS only when playback actually starves.

Diagnosed 2026-10-08 from a production HITL probe (see §1). Code is source of
truth for implementation detail; this file records intent and the locked
decisions. On landing, amend ADR-0041/0042 in `ARCHITECTURE.md` per convention.

---

## 0. Goal

Every visitor who can sustain the hero loop sees it; visitors who genuinely
can't get degraded-but-moving video (HLS, which ABR-downshifts) instead of a
static poster; only explicit data-saving intent (`saveData`) parks the poster
up front.

## 1. Current state (facts from the diagnosis)

- The hero renders a plain `<video class="media-frame__loop" autoplay muted loop
  playsinline preload="auto">` over Mux static renditions (720p + 1080p MP4) when
  eligible (ADR-0042). Confirmed in production markup.
- `holdProgressiveLoop()` in `MediaFrame.astro` parks the poster at
  `connectedCallback` when **any** of: `connection.saveData`, cellular-class
  `effectiveType` (slow-2g/2g/3g), or `connection.downlink < 4`
  (`PROGRESSIVE_LOOP_MIN_DOWNLINK_MBPS`). The hold strips the `<source>`s,
  re-runs `load()` to abort the parse-time fetch, stamps `data-loop-held`, and
  never adopts a player. It is **one-shot and sticky**: no re-check, no recovery,
  no path back for the session.
- The 4 Mbps floor came from one synthetic measurement (ADR-0042, CDP throttle at
  1.6 Mbps, 2026-10-06): the 720p rung (~3.9 Mbps) stalled 4× in 30s where HLS
  downshifted to 480p and played through.
- **The signal is not the link.** Chrome's Network Information API `downlink`
  is a lagging, conservative EWMA of recently observed HTTP throughput, capped
  at 10 Mbps, skewed by VPNs/proxies/middleboxes. It is sampled at
  `connectedCallback` — mid-parse, during the page's own resource storm, the
  worst moment to read it.
- **Field evidence (the diagnosing machine, 2026-10-08):** Chrome reported a
  *stable* `downlink: 1.55 Mbps`, `effectiveType: 4g`, `saveData: false` — so
  the hold fired on every visit, cold and warm. A forced-playback probe of the
  720p rung showed all `waiting` events at `t=0.0` (startup buffering) and
  `currentTime=7.8` at wall-clock t+20s — i.e., one clean loop wrap
  (20 − 12.1 ≈ 7.9): **the connection played the 720p loop smoothly in
  realtime** after ~2s of startup buffering. The hold parked the hero on a
  connection that handles it fine.
- Safari and Firefox have no Network Information API, so the hold can never
  fire there. The "Safari doesn't autoplay on refresh until scroll" behavior
  reported alongside this issue is a **separate mechanism** and is out of
  scope (§7).
- With the hold active, no user interaction can start the video (the sources
  are gone). Reports that "scroll starts the video" came from sessions where
  the estimate transiently read ≥ 4 Mbps.
- The 4s wedged-load watchdog (GH #178), the declarative-autoplay contract and
  gesture/transient retry routing (GH #190), and the frame-accurate
  `data-video-ready` opacity gate (GH #172) are all orthogonal and stay.

## 2. Locked decisions

1. **Connect-time hold narrows to `saveData` only.** Explicit user intent is
   the only prediction we keep. The `downlink < 4` and cellular-class
   `effectiveType` clauses are deleted from the hold decision — both ride the
   same estimator that misclassifies the diagnosing machine, and the estimator
   has no appeal process. `PROGRESSIVE_LOOP_MIN_DOWNLINK_MBPS` goes with them.
2. **Everyone else plays the MP4 loop**, exactly as today (declarative
   `autoplay` + JS gates unchanged).
3. **Stalling is judged on evidence, after startup.** Startup `waiting` events
   (before the first `playing`) are buffering, not failure — the probe showed
   three of them on a connection that then played smoothly. The stall monitor
   arms at `playing`; an intentional pause disarms it and the next `playing`
   re-arms it with a fresh window, so a visibility-gate pause early in the
   session (scroll out, tab away) never retires the verdict.
4. **The fallback on evidence of starvation is HLS, not the poster.** HLS is
   the delivery mechanism built for variable links and is proven on this exact
   asset class (ADR-0042: downshifted to 480p and played through at 1.6 Mbps).
   A static poster remains only for `saveData`.
5. **No flap.** MP4 → HLS is one-way per element per session. There is no path
   back to the MP4 rungs mid-session; hls.js's ABR owns quality from there.
6. **`saveData` hold gets a recovery path.** A `connectionchange` listener
   re-evaluates a held frame; if `saveData` cleared, the sources are restored
   and the loop plays. (Flipping *on* mid-session does not park a playing
   loop — the stall monitor handles real degradation.)

## 3. Design

### 3.1 The stall verdict (new pure module)

`apps/web/src/lib/loopStallMonitor.ts` — a small framework-free monitor,
exported as a factory so the verdict logic is unit-testable with fake timers
and synthetic event sequences (the regression seam the current code lacks):

```
createStallMonitor({ onStarved }): {
  notifyPlaying(): void      // arms the monitor (no-op while already armed)
  notifyWaiting(): void      // stalls counted only while armed
  notifyPause(): void        // intentional stops disarm
  dispose(): void
}
```

Verdict rules (constants exported for tests):

- **Armed** at `playing`. `waiting` while disarmed (startup buffering, or
  the resume buffer after a pause) is ignored; a `playing` that follows a
  stall while already armed is a no-op.
- **Starved** when, while armed: `STALL_LIMIT` (2) or more `waiting` events
  land within `STALL_WINDOW_MS` (15s) — the ADR-0042 failure signature was 4
  stalls in 30s, so 2 in 15 is the same density with margin — **or** a
  starvation check fails: every `STARVE_CHECK_MS` (5s), compare `currentTime`
  progress against elapsed wall time since arming; if the loop has been armed
  for at least `STARVE_GRACE_MS` (10s) and is progressing at under
  `STARVE_MIN_RATIO` (0.5× realtime), the link can't sustain the rung.
  (The ratio check catches sub-stall degradation — buffering just fast enough
  to never fire `waiting` but too slow to ever show the loop as authored.)
- `pause` (intentional stop — visibility gate, reduced-motion flip,
  userIntent) and `dispose()` disarm and clear all timers/listeners. The
  visibility gate pausing the hero on scroll-out must not accumulate verdicts,
  and the next `playing` re-arms with a fresh stall window and grace period.

### 3.2 The HLS swap (MediaFrame.astro element)

On `onStarved`, once per element:

1. Stamp `data-loop-fallback="hls"` on the host (debugging/observability
   parity with `data-loop-held` / `data-loop-revived`).
2. Disarm and detach everything loop-specific: the GH #178 watchdog (timers +
   listeners), the stall monitor, and the loop element's `wirePlayer`
   listeners (existing `disconnectedCallback` removal list is the reference —
   factor the teardown so both paths share it).
3. Remove the loop `<video>`; insert a `<mux-video>` built to match the SSR
   HLS shape (`playback-id`, `stream-type="on-demand"`, `muted`, `loop`,
   `playsinline`, `disablepictureinpicture`, `max-resolution` from the plan,
   plus the small-viewport cap the connectedCallback mobile clause applies).
   The playback id must reach the client: the loop's `<media-frame>` host
   gains `data-playback-id` (and `data-max-resolution`) at render, loop path
   only.
4. Set `_hlsConfig` as an own property **before** the element upgrades —
   `CONSTRAINED_AMBIENT_HLS_CONFIG` (2 Mbps seed, 10s buffer): the frame just
   proved the link is constrained, so start hls.js low instead of re-proving
   it from the 20 Mbps seed.
5. `void this.loadPlayer()` — the existing import/define/wire path adopts it.

The `data-video-ready` opacity gate (GH #172) is unchanged and is what makes
the swap invisible: the poster stays painted until the HLS path presents a
real frame, so a starving link degrades still → still → low-res motion, never
still → gray box.

### 3.3 `saveData` hold + recovery

- The `saveData` branch keeps today's shape (strip sources, abort the
  parse-time fetch, `data-loop-held`, adopt no player).
- Add one `connectionchange` listener, registered only while held; on change,
  re-read `saveData`. If cleared: remove `data-loop-held`, restore the
  original `<source>` list (retained on the element instance at hold time),
  `load()`, and run the normal loop adoption (`wirePlayer`,
  `syncAutoplayGate`, watchdog) so the frame joins the standard contract.
  `load()` after restore restarts the fetch — correct here: a `saveData`
  flip-off is explicit consent to spend the bytes.

### 3.4 What does not change

- Declarative `autoplay` + the three GH #190 guards (reduced-motion strip,
  pre-observation pause guard, `pageshow` re-eval) and the rejection routing
  (NotAllowedError → gesture retry, transient → timer retry).
- The GH #178 wedged-load watchdog for the loop path. Its signature
  (playback requested, zero data, `readyState < 2`) is disjoint from the
  stall monitor's (playback achieved, then starved); document that split in
  code comments so the two never "help" each other. **Amended (GH #198):**
  the watchdog's known reproduction — adoption of a parser-started loop
  from the ClientRouter's inert parsed document — is closed at the root:
  `startLoop()` replaces the adopted `<video>` with a fresh
  `cloneNode(true)` clone created in the live document whenever
  `html[data-nav]` is set, before wiring. The watchdog stays one release
  as a probe for any wedge a live-document element can still hit, then is
  removed if none reproduces.
- `constrainedNetwork()` and the HLS startup seeds — still used for the HLS
  path's initial config, now also on the fallback swap (§3.2.4).
- Mux static renditions stay 720p + 1080p, hero only.

## 4. Tests

Following the repo's two-layer convention (source-string contract tests in
`MediaFrame.test.ts`, unit tests for extracted logic):

**`lib/loopStallMonitor.test.ts` (new, behavioral, fake timers):**

- `waiting` before the first `playing` never counts (startup buffering is not
  failure — regression lock for the probe evidence).
- 2 post-arm `waiting` events inside 15s → `onStarved` fires once.
- 1 stall, then a clean 20s → no verdict.
- Progress under 0.5× realtime past the grace window → verdict; at-or-above →
  none.
- `notifyPause` mid-window resets the stall count; the next `notifyPlaying`
  re-arms with a fresh window; `dispose()` leaves no timers (vitest
  fake-timer count).

**`MediaFrame.test.ts` (revised source-string contracts):**

- Replace the "holds the poster on constrained networks" test: the hold
  predicate is `saveData` only; assert `holdProgressiveLoop` (renamed, e.g.
  `shouldHoldForSaveData`) contains no `downlink`, no `effectiveType`, no
  `matchMedia` reference, and that
  `PROGRESSIVE_LOOP_MIN_DOWNLINK_MBPS` is gone.
- The loop's host element carries `data-playback-id` / `data-max-resolution`
  when (and only when) the progressive loop renders.
- The fallback swap: builds `mux-video` with the SSR attribute set, sets
  `_hlsConfig` from the constrained ambient config before `loadPlayer()`,
  stamps `data-loop-fallback="hls"`, and tears down the watchdog + stall
  monitor in the same branch.
- The `connectionchange` recovery listener is registered only in the held
  branch and removed in `disconnectedCallback`.

## 5. Acceptance

1. **The diagnosing machine** (Chrome, stable `downlink` 1.55 Mbps): cold
   visit to a Vercel preview plays the hero loop after a short startup
   buffer; `data-loop-held` absent; no `data-loop-fallback` stamp.
2. **Simulated starvation** (DevTools network throttle to ~1 Mbps, cold
   load): loop attempts, stalls, swaps to HLS exactly once
   (`data-loop-fallback="hls"`), and playback continues at a downshifted
   rung. No swap back on un-throttle mid-session.
3. **Save-data** (DevTools emulation or Android Chrome with Data Saver):
   poster holds, `data-loop-held` present, and (emulation off →
   `connectionchange`) the loop restores and plays without a reload.
4. `pnpm test`, `pnpm typecheck`, `pnpm lint` green in the worktree.
5. Lighthouse mobile on the preview: no new eager fetches (the mux chunk
   downloads only on observed starvation); SI/LCP within noise of the
   current MP4 path.

## 6. Risks / watch items

- **Startup buffering got longer for genuinely slow links.** They now
  discover the stall by living it (a few seconds of poster while the MP4
  buffers, then HLS). Acceptable: the alternative was a permanent poster, and
  the poster stays painted throughout via the opacity gate.
- **Wasted bytes on the aborted MP4.** A starved loop has already fetched a
  few MB before the swap. Bounded by the browser's own progressive buffer
  behavior; the 4 Mbps prediction didn't prevent this either, it just
  guessed earlier. Not worth gating the swap on bytes-spent.
- **`connectionchange` is Chromium-only.** The recovery path is a
  progressive enhancement; Safari/Firefox never hold, so they never need it.

## 7. Out of scope

- **Safari refresh-no-autoplay-until-scroll.** Separate mechanism (the hold
  can't fire in Safari). ~~To be diagnosed on its own thread after this
  lands.~~ Closed by GH #196 (Finding A): the loop was playing, invisibly —
  with a warm media cache the browser starts it before `<media-frame>` is
  defined, `playing` has already fired, and nothing stamped
  `data-video-ready` until a scroll out/in restarted playback. `wirePlayer()`
  now stamps readiness from state as well as from the event.
- **Minting a low (360p/480p) MP4 static rendition.** Rejected for this fix:
  it keeps a predictive gate (just with more rungs), needs Mux-side work
  (precedent: `apps/studio/migrations/mux-hero-clip.ts`), and 480p is
  borderline for the very links in question — HLS covers the range better
  with what we already ship. Revisit only if field data shows the HLS
  swap firing at high rates.
- **Keeping and recalibrating the 4 Mbps threshold.** Rejected: any
  threshold on this estimator is the same bug with a different number.

## 8. On landing

- Amend ADR-0041/0042 in `ARCHITECTURE.md`: the constrained-network clause
  becomes "saveData holds the poster; everyone else plays the loop with an
  evidence-based HLS fallback", and the 1.6 Mbps measurement's role changes
  from threshold-justification to fallback-motivation.
- Commit message states the corrected hypothesis: the hold answered "could
  this connection ever stutter?" with a one-shot reading of a lagging
  estimator; replaced with measured starvation → HLS.
