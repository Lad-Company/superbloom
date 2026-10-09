import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'
import {
  createStallMonitor,
  STARVE_CHECK_MS,
  STARVE_GRACE_MS,
  STARVE_MIN_RATIO,
  STALL_WINDOW_MS,
} from './loopStallMonitor'

const setup = ({duration = 30}: {duration?: number} = {}) => {
  let nowMs = 0
  let mediaTimeS = 0
  let durationS = duration
  const onStarved = vi.fn()
  const monitor = createStallMonitor({
    onStarved,
    readCurrentTime: () => mediaTimeS,
    readDuration: () => durationS,
    now: () => nowMs,
  })
  const advance = (ms: number, nextMediaTimeS = mediaTimeS) => {
    mediaTimeS = nextMediaTimeS
    nowMs += ms
    vi.advanceTimersByTime(ms)
  }
  return {
    monitor,
    onStarved,
    advance,
    setMediaTime: (value: number) => {
      mediaTimeS = value
    },
    setDuration: (value: number) => {
      durationS = value
    },
  }
}

beforeEach(() => {
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
})

describe('createStallMonitor', () => {
  it('ignores waiting before the first playing (startup buffering is not failure)', () => {
    const {monitor, onStarved, advance} = setup()
    monitor.notifyWaiting()
    monitor.notifyWaiting()
    advance(STALL_WINDOW_MS * 2, 5)
    expect(onStarved).not.toHaveBeenCalled()
  })

  it('starves on two post-arm waiting events inside the window, once', () => {
    const {monitor, onStarved, advance} = setup()
    monitor.notifyPlaying()
    monitor.notifyWaiting()
    advance(1_000, 1)
    monitor.notifyWaiting()
    expect(onStarved).toHaveBeenCalledTimes(1)
    advance(STALL_WINDOW_MS * 2, 20)
    expect(onStarved).toHaveBeenCalledTimes(1)
  })

  it('does not starve on one stall followed by clean realtime progress', () => {
    const {monitor, onStarved, advance} = setup()
    monitor.notifyPlaying()
    monitor.notifyWaiting()
    advance(5_000, 5)
    advance(5_000, 10)
    advance(5_000, 15)
    advance(5_000, 20)
    expect(onStarved).not.toHaveBeenCalled()
  })

  it('starves when progress stays under the realtime floor past the grace window', () => {
    const {monitor, onStarved, advance} = setup()
    monitor.notifyPlaying()
    advance(STARVE_CHECK_MS, 2)
    expect(onStarved).not.toHaveBeenCalled()
    advance(STARVE_GRACE_MS - STARVE_CHECK_MS, 3)
    expect(onStarved).toHaveBeenCalledTimes(1)
  })

  it('does not starve when progress meets the realtime floor', () => {
    const {monitor, onStarved, advance} = setup()
    monitor.notifyPlaying()
    const playedAtGrace = STARVE_GRACE_MS * STARVE_MIN_RATIO / 1000
    advance(STARVE_CHECK_MS, playedAtGrace / 2)
    advance(STARVE_GRACE_MS - STARVE_CHECK_MS, playedAtGrace)
    advance(STARVE_CHECK_MS * 2, playedAtGrace + 10)
    expect(onStarved).not.toHaveBeenCalled()
  })

  it('discounts a loop wrap instead of reading the seam as negative progress', () => {
    const {monitor, onStarved, advance} = setup({duration: 12})
    monitor.notifyPlaying()
    advance(STARVE_CHECK_MS, 5)
    advance(STARVE_CHECK_MS, 10)
    // Wrap: 10s → 1s across the 12s seam is 3s of forward progress.
    advance(STARVE_CHECK_MS, 1)
    advance(STARVE_CHECK_MS, 6)
    expect(onStarved).not.toHaveBeenCalled()
  })

  it('notifyPause disarms mid-window and clears the progress timer', () => {
    const {monitor, onStarved, advance} = setup()
    monitor.notifyPlaying()
    expect(vi.getTimerCount()).toBe(1)
    monitor.notifyWaiting()
    advance(1_000, 1)
    monitor.notifyPause()
    expect(vi.getTimerCount()).toBe(0)
    monitor.notifyWaiting()
    advance(STALL_WINDOW_MS * 2, 20)
    expect(onStarved).not.toHaveBeenCalled()
  })

  it('re-arms on the next playing after a pause, with a fresh window and grace', () => {
    // The visibility gate pauses the hero when it scrolls out; scrolling
    // back must not leave the verdict permanently retired.
    const {monitor, onStarved, advance} = setup()
    monitor.notifyPlaying()
    monitor.notifyWaiting()
    advance(1_000, 1)
    monitor.notifyPause()
    expect(vi.getTimerCount()).toBe(0)
    // Resume: startup buffering before `playing` is still ignored.
    monitor.notifyWaiting()
    monitor.notifyPlaying()
    expect(vi.getTimerCount()).toBe(1)
    // One stall after re-arm is not enough (the pre-pause stall was cleared).
    monitor.notifyWaiting()
    expect(onStarved).not.toHaveBeenCalled()
    advance(1_000, 2)
    monitor.notifyWaiting()
    expect(onStarved).toHaveBeenCalledTimes(1)
  })

  it('ignores a playing that follows a stall while already armed', () => {
    const {monitor, onStarved, advance} = setup()
    monitor.notifyPlaying()
    advance(STARVE_CHECK_MS, 5)
    monitor.notifyWaiting()
    monitor.notifyPlaying()
    expect(vi.getTimerCount()).toBe(1)
    advance(1_000, 6)
    monitor.notifyWaiting()
    expect(onStarved).toHaveBeenCalledTimes(1)
  })

  it('dispose leaves no timers behind', () => {
    const {monitor} = setup()
    monitor.notifyPlaying()
    expect(vi.getTimerCount()).toBe(1)
    monitor.dispose()
    expect(vi.getTimerCount()).toBe(0)
  })
})
