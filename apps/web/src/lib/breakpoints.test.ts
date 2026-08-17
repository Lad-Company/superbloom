import {readFileSync} from 'node:fs'
import {describe, expect, it} from 'vitest'
import {BREAKPOINTS} from './breakpoints'

/** `@custom-media` name in tokens.css → BREAKPOINTS key it mirrors. */
const MIRRORED: Record<string, keyof typeof BREAKPOINTS> = {
  '--bp-small': 'smallMax',
  '--bp-below-desktop': 'belowDesktopMax',
  '--bp-960': 'railNarrowMax',
  '--bp-600': 'railTightMax',
}

const tokensCss = readFileSync(new URL('../styles/tokens.css', import.meta.url), 'utf8')

const customMediaMaxWidths = (): Record<string, number> => {
  const out: Record<string, number> = {}
  const pattern = /@custom-media\s+(--[\w-]+)\s+\(max-width:\s*([\d.]+)px\)/g
  for (const match of tokensCss.matchAll(pattern)) {
    out[match[1]] = Number(match[2])
  }
  return out
}

describe('BREAKPOINTS mirrors tokens.css @custom-media (ADR-0024)', () => {
  const fromCss = customMediaMaxWidths()

  it.each(Object.entries(MIRRORED))('%s matches BREAKPOINTS.%s', (cssName, key) => {
    expect(fromCss[cssName], `tokens.css must define ${cssName} as a max-width`).toBeDefined()
    expect(BREAKPOINTS[key]).toBe(fromCss[cssName])
  })
})
