import {defineConfig, presetWind3} from 'unocss'

export default defineConfig({
  presets: [presetWind3()],
  rules: [
    [
      /^line-clamp-(\d+)$/,
      ([, d]) => ({
        overflow: 'hidden',
        display: '-webkit-box',
        '-webkit-box-orient': 'vertical',
        '-webkit-line-clamp': Number(d),
      }),
    ],
  ],
  theme: {
    colors: {
      bg: 'var(--bg)',
      fg: 'var(--fg)',
      'bg-20': 'var(--bg-20)',
      'bg-60': 'var(--bg-60)',
      'fg-12': 'var(--fg-12)',
      'fg-60': 'var(--fg-60)',
    },
    // Spacing keys reference the tokens in src/styles/tokens.css (single
    // source of truth) instead of re-hardcoding literals. The top three are
    // fluid clamps; the rest are fixed px. No markup uses Uno breakpoint
    // variants beyond `md:`/`lg:`, whose preset defaults (768/1024) already
    // match the canonical breakpoints.
    spacing: {
      'xs-4': 'var(--space-xs-4)',
      '3xs': 'var(--space-3xs)',
      '2xs': 'var(--space-2xs)',
      xs: 'var(--space-xs)',
      s: 'var(--space-s)',
      m: 'var(--space-m)',
      l: 'var(--space-l)',
      xl: 'var(--space-xl)',
      '2xl': 'var(--space-2xl)',
      '3xl': 'var(--space-3xl)',
      '4xl': 'var(--space-4xl)',
    },
    fontFamily: {
      'display-tight': 'var(--font-display-tight)',
      body: 'var(--font-body)',
      interface: 'var(--font-interface)',
    },
  },
  shortcuts: {
    // Type styles transcribed from Figma R3 variables. Display steps reference
    // the fluid ramp tokens in tokens.css (one shared 360→1440 curve); body/UI
    // steps stay fixed so they don't fight user zoom.
    // NB: var() sizes need the `length:` hint — bare `text-[var(--x)]` is
    // ambiguous and Uno emits a (broken) color declaration instead of
    // font-size.
    'type-h1':
      'font-display-tight font-[750] text-[length:var(--type-h1)] leading-[0.78] tracking-[0] uppercase line-clamp-4',
    'type-h2':
      'font-display-tight font-[750] text-[length:var(--type-h2)] leading-[0.88] tracking-[0] uppercase line-clamp-4',
    'type-h3':
      'font-display-tight font-[750] text-[length:var(--type-h3)] leading-[0.88] tracking-[0] uppercase line-clamp-4',
    'type-h4':
      'font-display-tight font-[750] text-[length:var(--type-h4)] leading-[0.88] tracking-[0] uppercase',
    'type-h5':
      'font-display-tight font-[750] text-[length:var(--type-h5)] leading-[0.88] tracking-[0] uppercase',
    'editorial-title':
      'font-body font-medium text-[24px] leading-[1.3] tracking-[-0.48px] lg:text-[38px] lg:leading-[1.28] lg:tracking-[-0.76px]',
    'type-h6': 'font-body font-medium text-[24px] leading-[1.2] tracking-[-0.48px]',
    'type-h7':
      'font-display-tight font-[750] text-[32px] leading-[0.88] tracking-[0] uppercase line-clamp-4',
    'type-eyebrow':
      'font-interface font-[750] text-[17px] leading-none tracking-[0.02em] uppercase',
    'type-section-heading':
      'font-display-tight font-[750] text-[length:var(--type-section-heading)] leading-[0.88] tracking-[0] uppercase line-clamp-4',
    'type-body': 'font-body font-medium text-[19px] leading-[1.3] tracking-[-0.38px]',
    'type-caption': 'font-body font-medium text-[17px] leading-[1.3] tracking-[-0.02em]',
    'type-label': 'font-interface font-[750] text-[17px] leading-none tracking-[0.02em] uppercase',
  },
})
