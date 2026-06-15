import { defineConfig, presetWind3 } from 'unocss';

export default defineConfig({
  presets: [presetWind3()],
  theme: {
    colors: {
      bg: 'var(--bg)',
      fg: 'var(--fg)',
      'bg-20': 'var(--bg-20)',
      'bg-60': 'var(--bg-60)',
      'fg-12': 'var(--fg-12)',
      'fg-60': 'var(--fg-60)',
    },
    fontFamily: {
      'display-tight': 'var(--font-display-tight)',
      'display-compact': 'var(--font-display-compact)',
      body: 'var(--font-body)',
      label: 'var(--font-label)',
    },
  },
  shortcuts: {
    // Type styles transcribed from Figma R3 variables
    'type-h1':
      'font-display-tight font-[750] text-[200px] leading-[0.78] tracking-[0] uppercase',
    'type-h3':
      'font-display-tight font-[750] text-[120px] leading-[0.88] tracking-[0] uppercase',
    'type-h6': 'font-body font-medium text-[24px] leading-[1.2] tracking-[-0.48px]',
    'type-eyebrow':
      'font-display-compact font-[750] text-[17px] leading-none tracking-[0.34px] uppercase',
    'type-body': 'font-body font-medium text-[19px] leading-[1.3] tracking-[-0.38px]',
    'type-caption': 'font-body font-medium text-[17px] leading-[1.3] tracking-[-0.34px]',
    'type-label':
      'font-label font-[800] text-[17px] leading-none tracking-[0.34px] uppercase',
  },
});
