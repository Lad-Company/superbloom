import {muxSkeletonThumbUrl} from './mediaRenderingPlan'

/**
 * Inline blur-up for ungated Mux video frames (ARCHITECTURE.md ADR-0039/0040).
 *
 * Sanity images ship an LQIP data URI, so their skeleton paints a blurred
 * preview on the first frame. Mux assets have no LQIP: the skeleton points
 * at a 24px thumbnail URL and the browser fetches it, which on the
 * full-viewport hero means the first frame after the veil's removal is a
 * flat token-colour box until that request lands. For priority frames we
 * fetch the same 24px thumb server-side at render and inline it as a data
 * URI, so the blur-up is in the HTML and the hero never paints bare.
 *
 * Bounded by design: one small fetch per distinct asset per server instance
 * (successes cached for the instance's lifetime), a short timeout, and the
 * plain URL as the fallback — a slow or failed Mux response degrades to
 * today's behaviour, never to a blank or a slow render.
 */

const FETCH_TIMEOUT_MS = 800

const cache = new Map<string, Promise<string | null>>()

const fetchDataUri = async (url: string, fetchImpl: typeof fetch): Promise<string | null> => {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)
  try {
    const response = await fetchImpl(url, {signal: controller.signal})
    if (!response.ok) return null
    const type = response.headers.get('content-type')?.split(';')[0]?.trim() || 'image/webp'
    const bytes = Buffer.from(await response.arrayBuffer())
    if (bytes.length === 0) return null
    return `data:${type};base64,${bytes.toString('base64')}`
  } catch {
    return null
  } finally {
    clearTimeout(timer)
  }
}

/**
 * Resolves to a `data:` URI for the asset's 24px thumbnail, or `null` when
 * the fetch fails or times out (callers fall back to the thumbnail URL).
 * Concurrent renders of the same asset share one in-flight request; a
 * failed result is not cached so the next render retries.
 */
export const muxBlurUpDataUri = async (
  playbackId: string,
  thumbTime?: number | null,
  fetchImpl: typeof fetch = fetch,
): Promise<string | null> => {
  const url = muxSkeletonThumbUrl(playbackId, thumbTime)
  let pending = cache.get(url)
  if (!pending) {
    pending = fetchDataUri(url, fetchImpl).then((result) => {
      if (result === null) cache.delete(url)
      return result
    })
    cache.set(url, pending)
  }
  return pending
}

/** Test seam: drop every cached entry. */
export const clearMuxBlurUpCache = (): void => {
  cache.clear()
}
