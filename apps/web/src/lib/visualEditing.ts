// Sanity Presentation connection (docs/content-preview-spec.md). The
// Presentation tool drives the preview iframe over a comlink channel named
// "visual-editing"; without this script the tool times out with "Unable to
// connect" and can never populate "Documents on this page". Layout.astro
// loads it only on preview requests (the sb_preview cookie), so regular
// visitors never download it. Click-to-edit overlays stay inert: content is
// not stega-encoded, so the overlay scan finds no targets.
import {navigate} from 'astro:transitions/client'
import {
  enableVisualEditing,
  type HistoryAdapter,
} from '@sanity/visual-editing/enable-visual-editing'
import {currentLocationUpdate, resolveToolNavigation} from './visualEditingNavigation'

export function initVisualEditing(): void {
  const history: HistoryAdapter = {
    // Tool → iframe: the editor clicked a location or edited the URL input.
    update: (update) => {
      const action = resolveToolNavigation(update, window.location.origin)
      if (!action) return
      if (action.kind === 'back') {
        window.history.back()
      } else {
        navigate(action.url, action.replace ? {history: 'replace'} : undefined)
      }
    },
    // Iframe → tool: keep the tool's URL bar and its "Documents on this page"
    // resolver in sync across View Transition navigations. The immediate send
    // covers the initial load — the comlink handshake can complete after
    // astro:page-load has already fired.
    subscribe: (report) => {
      const send = () => report({...currentLocationUpdate(), title: document.title})
      document.addEventListener('astro:page-load', send)
      send()
      return () => document.removeEventListener('astro:page-load', send)
    },
  }

  enableVisualEditing({
    history,
    // SSR draft mode has no client-side loaders to patch content in place, so
    // the freshest render is a full reload. The promise never settles because
    // the reload tears this context down first.
    refresh: () => {
      window.location.reload()
      return new Promise<void>(() => {})
    },
  })
}
