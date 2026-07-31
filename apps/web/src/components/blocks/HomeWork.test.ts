import {readFileSync} from 'node:fs'
import {describe, expect, it} from 'vitest'

const source = readFileSync(new URL('./HomeWork.astro', import.meta.url), 'utf8')

describe('HomeWork mosaic', () => {
  it('resolves a CMS-selected layout preset from lib/workMosaic', () => {
    expect(source).toContain('WORK_MOSAIC_PRESETS')
    expect(source).toContain('resolveMosaic')
    expect(source).toContain('preset?: string | null')
    expect(source).toContain("WORK_MOSAIC_PRESETS['stagger-right']")
  })

  it('supports a dev-only workPreset query override for VQA', () => {
    expect(source).toContain('import.meta.env.DEV')
    expect(source).toContain("Astro.url.searchParams.get('workPreset')")
  })

  it('supports left- and right-anchored floating captions', () => {
    expect(source).toContain('`caption-${slot.captionAnchor}`')
    expect(source).toContain('.mosaic-item.caption-right .caption')
  })

  it('keeps the mobile stacking implementation unchanged', () => {
    expect(source).toContain('@media (max-width: 1023px)')
    expect(source).toContain('grid-column: 1 / -1 !important;')
    expect(source).toContain('grid-row: auto !important;')
    expect(source).toContain('position: static;')
    expect(source).toContain('row-gap: var(--space-xl);')
  })

  it('keeps desktop media full-bleed with no page gutter', () => {
    expect(source).toContain('@media (min-width: 1024px)')
    expect(source).toContain('padding-inline: 0;')
  })
})
