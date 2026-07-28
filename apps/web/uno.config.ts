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
    spacing: {
      'xs-4': '8px',
      '3xs': '12px',
      '2xs': '24px',
      xs: '32px',
      s: '40px',
      m: '64px',
      l: '80px',
      xl: '96px',
      '2xl': '120px',
      '3xl': '160px',
      '4xl': '200px',
    },
    fontFamily: {
      'display-tight': 'var(--font-display-tight)',
      body: 'var(--font-body)',
      interface: 'var(--font-interface)',
    },
  },
  shortcuts: {
    // Type styles transcribed from Figma R3 variables
    'type-h1':
      'font-display-tight font-[750] text-[200px] leading-[0.78] tracking-[0] uppercase line-clamp-4',
    'type-h2':
      'font-display-tight font-[750] text-[140px] leading-[0.88] tracking-[0] uppercase line-clamp-4',
    'type-h3':
      'font-display-tight font-[750] text-[120px] leading-[0.88] tracking-[0] uppercase line-clamp-4',
    'type-h4': 'font-display-tight font-[750] text-[80px] leading-[0.88] tracking-[0] uppercase',
    'type-h5': 'font-display-tight font-[750] text-[56px] leading-[0.88] tracking-[0] uppercase',
    'editorial-title':
      'font-body font-medium text-[24px] leading-[1.3] tracking-[-0.48px] lg:text-[38px] lg:leading-[1.28] lg:tracking-[-0.76px]',
    'type-h6': 'font-body font-medium text-[24px] leading-[1.2] tracking-[-0.48px]',
    'type-h7':
      'font-display-tight font-[750] text-[32px] leading-[0.88] tracking-[0] uppercase line-clamp-4',
    'type-eyebrow':
      'font-interface font-[750] text-[17px] leading-none tracking-[0.02em] uppercase',
    'type-section-heading':
      'font-display-tight font-[750] text-[56px] leading-[0.88] tracking-[0] uppercase line-clamp-4',
    'type-body': 'font-body font-medium text-[19px] leading-[1.3] tracking-[-0.38px]',
    'type-caption': 'font-body font-medium text-[17px] leading-[1.3] tracking-[-0.02em]',
    'type-label': 'font-interface font-[750] text-[17px] leading-none tracking-[0.02em] uppercase',
  },
})
