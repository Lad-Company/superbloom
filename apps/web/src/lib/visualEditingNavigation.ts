// Navigation mapping for the Sanity Presentation connection (see
// visualEditing.ts). Pure and DOM-free so it can be unit-tested without
// Astro's client runtime.
import type {HistoryUpdate} from '@sanity/visual-editing/enable-visual-editing'

export type ToolNavigation =
  {kind: 'back'} | {kind: 'navigate'; url: string; replace: boolean} | null

// Maps a tool-initiated history update to a ClientRouter action. The tool
// sends relative URLs (pathname + search + hash) but may send absolute ones;
// anything cross-origin is dropped — never navigate on blind trust.
export function resolveToolNavigation(
  update: Pick<HistoryUpdate, 'type' | 'url'>,
  currentOrigin: string,
): ToolNavigation {
  let url: URL
  try {
    url = new URL(update.url, currentOrigin)
  } catch {
    return null
  }
  if (url.origin !== currentOrigin) return null
  if (update.type === 'pop') return {kind: 'back'}
  return {
    kind: 'navigate',
    url: `${url.pathname}${url.search}${url.hash}`,
    replace: update.type === 'replace',
  }
}

// The current location in the shape the Presentation tool expects: origin-less
// (matching the official adapters), with the title for its URL bar.
export function currentLocationUpdate(): Pick<HistoryUpdate, 'type' | 'url'> {
  return {type: 'push', url: `${location.pathname}${location.search}${location.hash}`}
}
