// @vitest-environment jsdom
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'
import {forwardBuffered, initDeferredSentry, type BufferedError} from './sentryDeferred'

// The real module calls Sentry.init as an import side effect; keep it inert.
vi.mock('../../sentry.client.config', () => ({}))

const captureEvent = vi.fn()
const captureException = vi.fn()
const eventFromException = vi.fn(async (exception: unknown) => ({
  exception: {values: [{type: 'Error', value: String(exception)}]},
}))

vi.mock('@sentry/astro', () => ({
  getClient: () => ({eventFromException, captureEvent}),
  captureException,
}))

type SentryModule = Parameters<typeof forwardBuffered>[0]
const sentryModule = {
  getClient: () => ({eventFromException, captureEvent}),
  captureException,
} as unknown as SentryModule

const entry = (overrides: Partial<BufferedError> = {}): BufferedError => ({
  kind: 'error',
  error: new Error('boom'),
  message: 'boom',
  timestamp: 1700000000,
  ...overrides,
})

describe('forwardBuffered', () => {
  beforeEach(() => {
    captureEvent.mockClear()
    captureException.mockClear()
    eventFromException.mockClear()
  })

  it('replays a buffered error through the client parser with the original timestamp', async () => {
    const error = new Error('early')
    await forwardBuffered(sentryModule, entry({error, message: 'early', timestamp: 1699999999.5}))
    expect(eventFromException).toHaveBeenCalledWith(
      error,
      expect.objectContaining({originalException: error, mechanism: {handled: false}}),
    )
    expect(captureEvent).toHaveBeenCalledTimes(1)
    const [event, hint] = captureEvent.mock.calls[0]
    expect(event.timestamp).toBe(1699999999.5)
    expect(hint).toEqual(expect.objectContaining({originalException: error}))
  })

  it('synthesizes an Error from the message when the event carried none (cross-origin)', async () => {
    await forwardBuffered(sentryModule, entry({error: null, message: 'Script error.'}))
    const [exception] = eventFromException.mock.calls[0]
    expect(exception).toBeInstanceOf(Error)
    expect((exception as Error).message).toBe('Script error.')
  })

  it('passes non-Error rejection reasons through unchanged', async () => {
    await forwardBuffered(
      sentryModule,
      entry({kind: 'unhandledrejection', error: 'string rejection', message: 'string rejection'}),
    )
    expect(eventFromException).toHaveBeenCalledWith('string rejection', expect.anything())
  })

  it('falls back to captureException when event parsing fails', async () => {
    eventFromException.mockRejectedValueOnce(new Error('parser blew up'))
    const error = new Error('still captured')
    await forwardBuffered(sentryModule, entry({error, message: 'still captured'}))
    expect(captureEvent).not.toHaveBeenCalled()
    expect(captureException).toHaveBeenCalledWith(error)
  })

  it('captures nothing when init produced no client', async () => {
    const noClient = {getClient: () => undefined} as unknown as SentryModule
    await forwardBuffered(noClient, entry())
    expect(captureEvent).not.toHaveBeenCalled()
    expect(captureException).not.toHaveBeenCalled()
  })
})

describe('initDeferredSentry', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
    delete window.__sbhSentryQueue
    delete window.__sbhSentryLive
  })

  it('is a no-op when Sentry is disabled (preview / local dev ship zero Sentry)', () => {
    vi.stubEnv('SENTRY_ENABLED', 'false')
    const addEventListener = vi.spyOn(window, 'addEventListener')
    initDeferredSentry()
    expect(addEventListener).not.toHaveBeenCalledWith('load', expect.anything(), expect.anything())
    addEventListener.mockRestore()
  })

  it('loads the SDK after load, marks it live, and flushes the buffer in order', async () => {
    vi.stubEnv('SENTRY_ENABLED', 'true')
    const first = entry({message: 'first', timestamp: 1700000001})
    const second = entry({message: 'second', timestamp: 1700000002})
    window.__sbhSentryQueue = [first, second]

    initDeferredSentry()
    // jsdom's document is already complete, so the load starts immediately.
    await vi.waitFor(() => expect(window.__sbhSentryLive).toBe(true))

    expect(window.__sbhSentryQueue).toEqual([])
    const captured = captureEvent.mock.calls.map(([event]) => event.timestamp)
    expect(captured).toEqual([1700000001, 1700000002])
  })
})
