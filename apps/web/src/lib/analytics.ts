declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void
    __gaInit?: boolean
  }
}

function sendPageView() {
  // No-op on non-allowlisted hosts (Layout skips emitting the inline snippet
  // when gaMode is 'off').
  if (typeof window.gtag !== 'function') return
  window.gtag('event', 'page_view', {
    page_location: window.location.href,
    page_path: window.location.pathname + window.location.search,
    page_title: document.title,
  })
}

export function initAnalytics() {
  if (window.__gaInit) return
  window.__gaInit = true
  // astro:page-load fires on the initial load and after every View Transition,
  // so this single listener covers first pageview plus all subsequent client
  // navigations.
  document.addEventListener('astro:page-load', sendPageView)
}
