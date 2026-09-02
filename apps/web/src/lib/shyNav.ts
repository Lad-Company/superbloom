/* Shy nav: the nav rides `position: absolute` at page top. Once it has
   scrolled off, any upward scroll reveals it as a fixed frosted bar and any
   downward scroll dismisses it again — pages keep persistent navigation
   without a return to the top. Runs across breakpoints; while the mobile
   compact menu is open the nav is the menu's chrome and stays revealed.

   Theme awareness: at page top the nav keeps its SSR surface role (Layout's
   navRole). While revealed mid-page it samples the surface section beneath
   it (`[data-surface-role]`, stamped by SurfaceSection with inline --bg/--fg)
   and adopts those vars, so links and logo stay legible over dark, light,
   and brand surfaces alike. The nav's --fg-12/--fg-60 and button treatments
   all derive from --bg/--fg, so copying the pair re-themes the whole bar.

   Motion: the slide is a CSS transform transition, disabled under
   prefers-reduced-motion (the show/hide behavior itself still works). */

/* Dead zone so sub-pixel scroll noise (and mobile URL-bar jitter) doesn't
   flip the state. */
const MIN_DELTA = 2

type ShyState = 'top' | 'revealed' | 'hidden'

let nav: HTMLElement | null = null
let state: ShyState = 'top'
let lastY = 0
let ticking = false
let listening = false
/* The SSR role vars as inlined by Navigation (style={vars[role]}). Captured
   at init — removeProperty would delete the SSR theme itself, dropping the
   nav back to the light :root defaults (black ink on dark heroes). */
let roleBg = ''
let roleFg = ''

/* Media-covered stages (Capes, media heroes) can't carry inline --bg/--fg
   vars — their own CSS consumes those vars with inverted meaning — so they
   declare data-nav-surface instead, resolved through this map. */
const NAV_SURFACE_COLORS: Record<string, {bg: string; fg: string}> = {
  dark: {bg: '#000000', fg: '#ffffff'},
  light: {bg: '#ffffff', fg: '#000000'},
}

const setColors = (bg: string, fg: string) => {
  if (!nav) return
  nav.style.setProperty('--bg', bg)
  nav.style.setProperty('--fg', fg)
}

/* The revealed nav samples the surface just below its own bottom edge,
   walking up from the hit element: an explicit data-nav-surface wins, then
   any [data-surface-role] ancestor contributes its computed --bg/--fg
   (SurfaceSection sets them inline; plain dark sections like advantages set
   them in CSS). With no stamped ancestor the last colors stay. */
const applySurfaceColors = () => {
  if (!nav) return
  let el: Element | null = document.elementFromPoint(window.innerWidth / 2, nav.offsetHeight + 8)
  while (el && el !== document.documentElement) {
    if (el instanceof HTMLElement) {
      const explicit = el.dataset.navSurface
      if (explicit && NAV_SURFACE_COLORS[explicit]) {
        const {bg, fg} = NAV_SURFACE_COLORS[explicit]
        setColors(bg, fg)
        return
      }
      if (el.dataset.surfaceRole) {
        const computed = getComputedStyle(el)
        const bg = computed.getPropertyValue('--bg').trim()
        const fg = computed.getPropertyValue('--fg').trim()
        if (bg && fg) {
          setColors(bg, fg)
          return
        }
      }
    }
    el = el.parentElement
  }
}

/* Back at page top the captured SSR role vars take over again. */
const restoreRoleColors = () => {
  if (!nav) return
  if (roleBg) nav.style.setProperty('--bg', roleBg)
  if (roleFg) nav.style.setProperty('--fg', roleFg)
}

const setState = (next: ShyState) => {
  if (!nav) return
  if (state === next) {
    // While revealed, keep re-sampling: the surface under the bar changes as
    // the user keeps scrolling up.
    if (next === 'revealed') applySurfaceColors()
    return
  }
  state = next
  if (next === 'top') {
    nav.classList.remove('is-shy', 'is-revealed')
    restoreRoleColors()
  } else if (next === 'revealed') {
    nav.classList.add('is-shy', 'is-revealed')
    applySurfaceColors()
  } else {
    nav.classList.add('is-shy')
    nav.classList.remove('is-revealed')
  }
}

const onScroll = () => {
  if (ticking) return
  ticking = true
  requestAnimationFrame(() => {
    ticking = false
    if (!nav) return
    const y = window.scrollY
    const dy = y - lastY
    lastY = y
    // While the compact menu is open the nav is the menu's chrome (its
    // toggle is the only way to close the panel) — keep it revealed.
    if (nav.querySelector('.compact-menu[open]')) {
      setState('revealed')
      return
    }
    if (y <= MIN_DELTA) {
      setState('top')
      return
    }
    if (dy < -MIN_DELTA) setState('revealed')
    // Only dismiss once the absolute nav has fully scrolled off — a small
    // scroll from the top shouldn't whisk it away.
    else if (dy > MIN_DELTA && y > nav.offsetHeight) setState('hidden')
    else if (state === 'revealed') applySurfaceColors()
  })
}

/* Rebinds to the current page's nav element. Called on load and after every
   view-transition swap (astro:page-load); the scroll listener itself is
   registered once. */
export const initShyNav = () => {
  nav = document.querySelector<HTMLElement>('.navigation')
  state = 'top'
  // Reset any shy state that survived a swap/restore on the same element,
  // then capture this page's SSR role colors as the top-state theme.
  nav?.classList.remove('is-shy', 'is-revealed')
  roleBg = nav?.style.getPropertyValue('--bg').trim() ?? ''
  roleFg = nav?.style.getPropertyValue('--fg').trim() ?? ''
  restoreRoleColors()
  lastY = window.scrollY
  if (!listening) {
    listening = true
    window.addEventListener('scroll', onScroll, {passive: true})
  }
  // Land correctly when the page restores mid-scroll (bfcache, anchors).
  onScroll()
}
