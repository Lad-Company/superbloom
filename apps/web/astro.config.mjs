// @ts-check
import { defineConfig } from 'astro/config';
import vercel from '@astrojs/vercel';
import UnoCSS from '@unocss/astro';

// https://astro.build/config
export default defineConfig({
  output: 'server',
  adapter: vercel(),
  integrations: [UnoCSS()],
});
