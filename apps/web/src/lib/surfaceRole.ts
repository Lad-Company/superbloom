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

// Each role declares its surface paint (--bg/--fg) plus Contained Control tokens.
// Controls resolve to pure black/white by surface darkness: dark surfaces get a
// white button that wipes to black; light surfaces get a black button that wipes
// to white. --surface-wipe-outline matches the post-wipe ink; only controls that
// opt into a stroke via --wipe-outline (Media Control Bar buttons) consume it —
// pill CTAs and tags wipe without a border. Case surfaces derive from their CMS
// fg/bg pair.
export const control = {
  onDark: '--control-bg: #ffffff; --control-fg: #000000; --surface-wipe-outline: #ffffff;',
  onLight: '--control-bg: #000000; --control-fg: #ffffff; --surface-wipe-outline: #000000;',
}

export const vars: Record<SurfaceRole, string> = {
  light: `--bg: #ffffff; --fg: #000000; ${control.onLight}`,
  dark: `--bg: #000000; --fg: #ffffff; ${control.onDark}`,
  'case-primary':
    '--bg: var(--case-primary-bg); --fg: var(--case-primary-fg); --control-bg: var(--case-primary-fg); --control-fg: var(--case-primary-bg); --surface-wipe-outline: var(--case-primary-fg);',
  'case-secondary':
    '--bg: var(--case-secondary-bg); --fg: var(--case-secondary-fg); --control-bg: var(--case-secondary-fg); --control-fg: var(--case-secondary-bg); --surface-wipe-outline: var(--case-secondary-fg);',
  'brand-accent': `--bg: var(--blue); --fg: var(--blue-fg); ${control.onDark}`,
  'brand-deep': `--bg: var(--purple); --fg: var(--purple-fg); ${control.onDark}`,
  'brand-muted': `--bg: var(--pink); --fg: var(--pink-fg); ${control.onLight}`,
  'brand-tertiary': `--bg: var(--green); --fg: var(--green-fg); ${control.onLight}`,
}
