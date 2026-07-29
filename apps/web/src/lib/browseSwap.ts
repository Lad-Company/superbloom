// In-place section swap for the /index browse controls (SortControl,
// TypeFilter). Changing sort order or type filter fetches only the results and
// swaps them in place, so browsing never triggers a full page navigation or
// jumps the visitor to the top. The sort toggle itself is updated in place
// (attributes only) so its arrow transitions between directions instead of
// re-rendering mid-state. Clicking a control label ("Sort by" / "Filter by")
// swaps which control is displayed; that mode is display-only and never
// navigates.
const LINK_SELECTOR = '[data-sort-toggle], [data-type-filter]'
const RESULTS_SELECTOR = '[data-browse-results]'
const MODE_SWAP_SELECTOR = '[data-mode-swap]'
const CONTROLS_SELECTOR = '[data-active-control]'

const regionOf = (node: Element | null | undefined) =>
  node?.closest<HTMLElement>('section') ?? null

// Attributes carry the full sort state, so a light sync keeps the mounted
// toggle honest and lets the CSS transition animate the arrow.
const syncSortToggle = (doc: Document, region: HTMLElement) => {
  const toggle = region.querySelector('[data-sort-toggle]')
  const nextToggle = doc.querySelector('[data-sort-toggle]')
  if (!toggle || !nextToggle) throw new Error('Sort toggle missing from response')
  const nextHref = nextToggle.getAttribute('href')
  if (nextHref) toggle.setAttribute('href', nextHref)
  const nextAriaLabel = nextToggle.getAttribute('aria-label')
  if (nextAriaLabel) toggle.setAttribute('aria-label', nextAriaLabel)
  const nextDirection = nextToggle
    .querySelector('[data-direction]')
    ?.getAttribute('data-direction')
  const arrow = toggle.querySelector('[data-direction]')
  if (nextDirection && arrow) arrow.setAttribute('data-direction', nextDirection)
}

// The filter control has no transitional state, so it is replaced wholesale.
const syncTypeFilter = (doc: Document, region: HTMLElement) => {
  const filter = region.querySelector('[data-type-filter-root]')
  const nextFilter = doc.querySelector('[data-type-filter-root]')
  if (filter && nextFilter) filter.replaceWith(nextFilter)
}

const swapRegion = async (url: string, region: HTMLElement) => {
  const response = await fetch(url)
  if (!response.ok) throw new Error('Browse section request failed')
  const doc = new DOMParser().parseFromString(await response.text(), 'text/html')
  const results = region.querySelector<HTMLElement>(RESULTS_SELECTOR)
  const nextResults = doc.querySelector<HTMLElement>(RESULTS_SELECTOR)
  if (!results || !nextResults) throw new Error('Browse results missing from response')
  syncSortToggle(doc, region)
  syncTypeFilter(doc, region)
  results.innerHTML = nextResults.innerHTML
  return response.url
}

const onClick = (event: MouseEvent) => {
  if (event.defaultPrevented || event.button !== 0) return
  if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
  const target = event.target as Element | null
  if (!target) return

  // Label buttons swap which browse control is displayed; they never navigate.
  const modeSwap = target.closest<HTMLElement>(MODE_SWAP_SELECTOR)
  if (modeSwap) {
    event.preventDefault()
    const controls = modeSwap.closest<HTMLElement>(CONTROLS_SELECTOR)
    if (!controls) return
    controls.dataset.activeControl = controls.dataset.activeControl === 'filter' ? 'sort' : 'filter'
    return
  }

  const link = target.closest<HTMLAnchorElement>(LINK_SELECTOR)
  if (!link) return
  const region = regionOf(link)
  if (!region || !link.href) return

  event.preventDefault()
  swapRegion(link.href, region)
    .then((finalUrl) => history.pushState(null, '', finalUrl))
    .catch(() => {
      window.location.href = link.href
    })
}

const onPopState = () => {
  // This feature pushes entries with null state and owns their restoration;
  // entries carrying router state are left for the ClientRouter.
  if (history.state !== null) return
  const region = regionOf(document.querySelector(LINK_SELECTOR))
  if (!region) {
    // Returned to a browse URL while the router is showing another page (the
    // router ignores state-less entries), so restore content with a full load.
    if (window.location.pathname === '/index') window.location.reload()
    return
  }
  swapRegion(window.location.href, region).catch(() => window.location.reload())
}

declare global {
  interface Window {
    __sbhBrowseSwapBound?: boolean
  }
}

export const initBrowseSwap = () => {
  // The guard lives on window so soft navigations that re-execute this module
  // cannot double-bind the listeners.
  if (window.__sbhBrowseSwapBound) return
  window.__sbhBrowseSwapBound = true
  // Capture phase keeps this handler ahead of the ClientRouter's bubble-phase
  // link interception (astro:transitions), which skips events whose default is
  // already prevented.
  document.addEventListener('click', onClick, {capture: true})
  window.addEventListener('popstate', onPopState)
}
