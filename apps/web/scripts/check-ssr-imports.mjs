/**
 * SSR import guard. The Vercel function runtime executes the server chunks in
 * .vercel/output/functions at request time under real Node ESM — if any chunk
 * statically imports a client-only package, the route 500s at module load
 * (production incident 2026-08-31: `import {ScrollTrigger} from 'gsap/
 * ScrollTrigger'` reached the server graph and every ParallaxField route
 * returned 500; dev, CI build, and local Node all mask the interop failure).
 *
 * The usual vector is importing the 'lib/motion' barrel from Astro
 * frontmatter: it re-exports modules that top-level-import gsap. Frontmatter
 * must import motion constants from 'lib/motion/config' directly; the barrel
 * is for client <script> code only.
 *
 * Runs after `astro build` (reads .vercel/output). Exits 1 on any violation.
 */
import {readdirSync, readFileSync, statSync} from 'node:fs'
import {join, relative} from 'node:path'
import {fileURLToPath} from 'node:url'

const functionsDir = fileURLToPath(new URL('../.vercel/output/functions', import.meta.url))

/** Packages that must never appear in the SSR module graph. */
const CLIENT_ONLY = ['gsap', 'lenis', 'split-type', '@mux/mux-player']
const pattern = new RegExp(
  String.raw`(?:from|import)\s*\(?\s*['"](${CLIENT_ONLY.join('|')})(/[^'"]*)?['"]`,
  'g',
)

const chunks = []
const walk = (dir) => {
  for (const name of readdirSync(dir)) {
    if (name === 'node_modules') continue
    const path = join(dir, name)
    if (statSync(path).isDirectory()) walk(path)
    else if (name.endsWith('.mjs')) chunks.push(path)
  }
}
walk(functionsDir)

const violations = []
for (const chunk of chunks) {
  const matches = [...readFileSync(chunk, 'utf8').matchAll(pattern)]
  if (matches.length > 0) {
    const offenders = [...new Set(matches.map((match) => match[1]))].join("', '")
    violations.push(`  ${relative(functionsDir, chunk)}\n    imports '${offenders}'`)
  }
}

if (violations.length > 0) {
  console.error(
    `[check-ssr-imports] client-only packages in the SSR server graph:\n${violations.join('\n')}\n\n` +
      'The Vercel function 500s at module load when a server chunk imports these.\n' +
      'Keep client libs inside <script> blocks; frontmatter needing motion constants\n' +
      "must import from 'lib/motion/config' directly, never the 'lib/motion' barrel.",
  )
  process.exit(1)
}

console.log(`[check-ssr-imports] ${chunks.length} server chunks clean of client-only imports`)
