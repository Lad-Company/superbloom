// @vitest-environment jsdom
import {afterEach, describe, expect, it, vi} from 'vitest'

/* The client config runs Sentry.init at import, so each test re-imports a
   fresh module and captures the options passed to the mocked init. */

vi.mock('@sentry/astro', () => ({init: vi.fn()}))

import * as Sentry from '@sentry/astro'

type TestEvent = {extra?: Record<string, unknown>}
type BeforeSend = (event: TestEvent, hint: {originalException?: unknown}) => TestEvent

const loadBeforeSend = async (): Promise<BeforeSend> => {
  vi.resetModules()
  await import('./sentry.client.config')
  const options = vi.mocked(Sentry.init).mock.calls[0]?.[0] as unknown as {beforeSend: BeforeSend}
  return options.beforeSend
}

/** Dispatches the event so `target` is set, the way a real rejection reason
    arrives after being fired at an element. */
const dispatchedOn = (el: Element, event: Event): Event => {
  el.dispatchEvent(event)
  return event
}

describe('sentry.client.config beforeSend', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it('enriches rejections whose reason is a CustomEvent', async () => {
    const beforeSend = await loadBeforeSend()
    const player = document.createElement('mux-video')
    player.id = 'hero'
    const reason = dispatchedOn(
      player,
      new CustomEvent('media-error', {detail: {code: 3, message: 'pipeline'}}),
    )

    const event = beforeSend({}, {originalException: reason})

    expect(event.extra?.rejectionReason).toEqual({
      eventClass: 'CustomEvent',
      type: 'media-error',
      // Detail values stay out of Sentry; the shape is enough to identify it.
      detail: {keys: ['code', 'message']},
      target: 'mux-video#hero',
    })
  })

  it('records primitive CustomEvent details as scalars', async () => {
    const beforeSend = await loadBeforeSend()
    const reason = new CustomEvent('retry', {detail: 2})

    const event = beforeSend({}, {originalException: reason})

    expect(event.extra?.rejectionReason).toMatchObject({type: 'retry', detail: '2'})
  })

  it('leaves Error rejections and plain events untouched', async () => {
    const beforeSend = await loadBeforeSend()

    expect(beforeSend({}, {originalException: new Error('boom')})).toEqual({})
    expect(beforeSend({}, {})).toEqual({})
  })
})
