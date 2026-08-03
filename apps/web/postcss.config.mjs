import postcssCustomMedia from 'postcss-custom-media'
import { fileURLToPath } from 'node:url'

// Canonical breakpoints are defined once as @custom-media in tokens.css
// (docs/css-standardization-spec.md §5). Scoped Astro styles are processed
// file-by-file, so the definitions are pulled in via importFrom; components
// write `@media (--bp-small)` etc. and get the shared values inlined.
const tokensPath = fileURLToPath(new URL('./src/styles/tokens.css', import.meta.url))

export default {
  plugins: [postcssCustomMedia({ importFrom: [tokensPath] })],
}
