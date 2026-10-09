/**
 * Evidence-based starvation verdict for the progressive hero loop (GH #192).
 * The loop plays first; this monitor only swaps delivery after playback has
 * started and then starved. Startup `waiting` events (before the first
 * `playing`) are buffering, not failure — the 2026-10-08 field probe showed
 * three of them on a connection that then played the 720p rung smoothly.
 *
 * Pure factory so the verdict is unit-testable with fake timers and a
 * synthetic media clock; MediaFrame wires the notifications to real events.
 */

export const STALL_LIMIT = 2
export const STALL_WINDOW_MS = 15_000
export const STARVE_CHECK_MS = 5_000
export const STARVE_GRACE_MS = 10_000
export const STARVE_MIN_RATIO = 0.5

export interface StallMonitorOptions {
  onStarved: () => void
  /** Media clock in seconds (HTMLMediaElement.currentTime). */
  readCurrentTime: () => number
  /** Duration in seconds, used only to discount loop wraps in the progress
   *  ratio; a wrapped loop must not read as "no progress" after the seam. */
  readDuration?: () => number
  /** Wall clock in milliseconds; injected by tests with fake timers. */
  now?: () => number
}

export interface StallMonitor {
  /** Arms the monitor on `playing`; re-arms after a `notifyPause` so a
   *  visibility-gate pause early in the session does not retire the
   *  verdict. A `playing` that follows a stall while armed is ignored. */
  notifyPlaying: () => void
  /** Counts stalls while armed. */
  notifyWaiting: () => void
  /** Intentional stops (visibility gate, reduced-motion, userIntent) disarm. */
  notifyPause: () => void
  dispose: () => void
}

export const createStallMonitor = ({
  onStarved,
  readCurrentTime,
  readDuration,
  now = () => Date.now(),
}: StallMonitorOptions): StallMonitor => {
  let armed = false
  let disposed = false
  let starved = false
  let armedAtMs = 0
  let playedS = 0
  let lastMediaTimeS = 0
  let stallTimesMs: number[] = []
  let checkTimer: ReturnType<typeof setInterval> | null = null

  const clearCheckTimer = () => {
    if (checkTimer !== null) {
      clearInterval(checkTimer)
      checkTimer = null
    }
  }

  const disarm = () => {
    armed = false
    stallTimesMs = []
    clearCheckTimer()
  }

  const starve = () => {
    if (starved || disposed) return
    starved = true
    disarm()
    onStarved()
  }

  const accumulateProgress = () => {
    const current = readCurrentTime()
    if (!Number.isFinite(current)) {
      lastMediaTimeS = 0
      return
    }
    let delta = current - lastMediaTimeS
    if (delta < 0) {
      const duration = readDuration?.()
      // A loop wrap (currentTime falls from near duration to near 0) is a
      // seam, not negative progress. Seeks only exist on Presented frames,
      // which never run this monitor.
      if (
        duration !== undefined &&
        Number.isFinite(duration) &&
        duration > 0 &&
        lastMediaTimeS > duration / 2 &&
        current < duration / 2
      ) {
        delta += duration
      }
    }
    if (delta > 0) playedS += delta
    lastMediaTimeS = current
  }

  const checkProgress = () => {
    if (!armed || starved || disposed) return
    accumulateProgress()
    const elapsedMs = now() - armedAtMs
    if (elapsedMs < STARVE_GRACE_MS) return
    const elapsedS = elapsedMs / 1000
    // Sub-stall degradation: buffering just fast enough to never fire
    // `waiting`, but too slow to show the loop as authored.
    if (playedS < elapsedS * STARVE_MIN_RATIO) starve()
  }

  return {
    notifyPlaying() {
      if (disposed || starved || armed) return
      armed = true
      armedAtMs = now()
      const current = readCurrentTime()
      lastMediaTimeS = Number.isFinite(current) ? current : 0
      playedS = 0
      stallTimesMs = []
      checkTimer = setInterval(checkProgress, STARVE_CHECK_MS)
    },
    notifyWaiting() {
      if (!armed || starved || disposed) return
      const atMs = now()
      stallTimesMs = stallTimesMs.filter((stallAtMs) => atMs - stallAtMs < STALL_WINDOW_MS)
      stallTimesMs.push(atMs)
      // ADR-0042's failure signature was four stalls in 30s; two in 15 is
      // the same density with margin.
      if (stallTimesMs.length >= STALL_LIMIT) starve()
    },
    notifyPause() {
      if (disposed) return
      disarm()
    },
    dispose() {
      disposed = true
      disarm()
    },
  }
}
