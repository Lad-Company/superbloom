// Shared dismiss behavior for every details/summary dropdown on the site
// (browse TypeFilter, form SelectDropdown, compact nav menu). A dropdown opts
// in with the data-dropdown attribute; the details/summary pattern already
// works without JS, this only adds outside-pointer and Escape dismissal. The
// guard lives on window so soft navigations that re-execute module scripts
// cannot double-bind the listeners.
declare global {
  interface Window {
    __sbhDropdownDismissBound?: boolean
  }
}

export const initDropdownDismiss = () => {
  if (window.__sbhDropdownDismissBound) return
  window.__sbhDropdownDismissBound = true

  document.addEventListener('pointerdown', (event) => {
    const target = event.target as Element | null
    document
      .querySelectorAll<HTMLDetailsElement>('details[data-dropdown][open]')
      .forEach((dropdown) => {
        if (target && dropdown.contains(target)) return
        dropdown.open = false
      })
  })

  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape') return
    const open = document.querySelector<HTMLDetailsElement>('details[data-dropdown][open]')
    if (!open) return
    open.open = false
    open.querySelector('summary')?.focus()
  })
}
