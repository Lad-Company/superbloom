/**
 * Sourcemap cleanup. Runs after `astro build` and deletes every .map file
 * under dist/ and .vercel/output/, unconditionally.
 *
 * The Sentry vite plugin's filesToDeleteAfterUpload only deletes maps after a
 * successful upload — when the release/sourcemap upload fails (bad token,
 * wrong org), the maps survive and Vercel ships them, exposing readable source
 * at the public URL. Deleting here keeps the maps available to Sentry during
 * the build (upload happens inside `astro build`) while guaranteeing they
 * never reach the deployed output.
 *
 * Both directories are cleaned because the @astrojs/vercel adapter copies
 * dist/client into .vercel/output/static during the build, before this script
 * runs — deleting only dist/ would leave the deployed copies behind.
 */
import {existsSync, readdirSync, statSync, unlinkSync} from 'node:fs'
import {join} from 'node:path'
import {fileURLToPath} from 'node:url'

const targets = [
  fileURLToPath(new URL('../dist', import.meta.url)),
  fileURLToPath(new URL('../.vercel/output', import.meta.url)),
]

const maps = []
const walk = (dir) => {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name)
    if (statSync(path).isDirectory()) walk(path)
    else if (name.endsWith('.map')) maps.push(path)
  }
}
for (const target of targets) {
  if (existsSync(target)) walk(target)
}

for (const map of maps) unlinkSync(map)

console.log(`[remove-sourcemaps] deleted ${maps.length} sourcemap${maps.length === 1 ? '' : 's'}`)
