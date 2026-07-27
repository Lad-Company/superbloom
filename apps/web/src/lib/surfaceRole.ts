export const surfaceRoles = [
  'light',
  'dark',
  'case-primary',
  'case-secondary',
  'brand-accent',
  'brand-deep',
  'brand-muted',
  'brand-tertiary',
] as const

export type SurfaceRole = (typeof surfaceRoles)[number]

export const vars: Record<SurfaceRole, string> = {
  light: '--bg: #ffffff; --fg: #000000; --surface-wipe-outline: #ffffff;',
  dark: '--bg: #000000; --fg: #ffffff; --surface-wipe-outline: #ffffff;',
  'case-primary':
    '--bg: var(--case-primary-bg); --fg: var(--case-primary-fg); --surface-wipe-outline: transparent;',
  'case-secondary':
    '--bg: var(--case-secondary-bg); --fg: var(--case-secondary-fg); --surface-wipe-outline: transparent;',
  'brand-accent': '--bg: var(--blue); --fg: var(--blue-fg); --surface-wipe-outline: transparent;',
  'brand-deep': '--bg: var(--purple); --fg: var(--purple-fg); --surface-wipe-outline: transparent;',
  'brand-muted': '--bg: var(--pink); --fg: var(--pink-fg); --surface-wipe-outline: transparent;',
  'brand-tertiary':
    '--bg: var(--green); --fg: var(--green-fg); --surface-wipe-outline: transparent;',
}
