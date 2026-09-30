// Generates apps/web/public/social-card.png (1200x630 OG image).
//
// Chat clients (Slack, iMessage, etc.) often center-crop the OG image to a
// square thumbnail, so the wordmark must fit inside the center 630x630
// safe zone, not the full 1200px width.
//
// Requires: rsvg-convert and ImageMagick (`brew install librsvg imagemagick`).
// Usage: node apps/web/scripts/generate-social-card.mjs

import { execFileSync } from 'node:child_process';
import { unlinkSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';

const here = dirname(fileURLToPath(import.meta.url));
const publicDir = join(here, '..', 'public');

const WIDTH = 1200;
const HEIGHT = 630;
// Center square crop is 630 wide; keep padding so the logo clears it.
const LOGO_WIDTH = 540;
const OVERSAMPLE = 4; // render large, downscale for clean edges

const tmpLogo = join(tmpdir(), 'superbloom-social-logo.png');

try {
  execFileSync('rsvg-convert', [
    '-w', String(LOGO_WIDTH * OVERSAMPLE),
    join(publicDir, 'superbloom-house-logo.svg'),
    '-o', tmpLogo,
  ], { stdio: 'inherit' });

  execFileSync('magick', [
    '-size', `${WIDTH}x${HEIGHT}`, 'xc:black',
    '(', tmpLogo, '-resize', `${LOGO_WIDTH}x`, ')',
    '-gravity', 'center', '-composite',
    join(publicDir, 'social-card.png'),
  ], { stdio: 'inherit', shell: false });
} finally {
  try { unlinkSync(tmpLogo); } catch { /* best-effort temp cleanup */ }
}

console.log(
  `social-card.png written: ${WIDTH}x${HEIGHT}, logo ${LOGO_WIDTH}px wide, centered within the 630px square safe zone`
);
