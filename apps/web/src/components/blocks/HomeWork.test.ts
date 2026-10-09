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
  })
})
