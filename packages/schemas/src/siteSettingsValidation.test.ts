/**
 * Object-level validation wiring for the Global Card Defaults group in Site
 * Settings, through the real Studio validation engine. The cross-field rule
 * lives on the cardDefaults object; its errors must point at the nested
 * fields, not the object root.
 */
import {describe, expect, it} from 'vitest'
import {errorMarkers} from './validationHarness'

function baseSiteSettings(overrides: Record<string, unknown> = {}) {
  return {
    _id: 'siteSettings',
    _type: 'siteSettings',
    instagramUrl: 'https://instagram.com/superbloom',
    linkedInUrl: 'https://linkedin.com/company/superbloom',
    vimeoUrl: 'https://vimeo.com/superbloom',
    youTubeUrl: 'https://youtube.com/@superbloom',
    cardDefaults: {cardWidth: '1/2', mediaAspectRatio: '16:9', infoPosition: 'below'},
    ...overrides,
  } as any
}

describe('site settings document validation', () => {
  it('accepts valid global card defaults', async () => {
    expect(await errorMarkers(baseSiteSettings())).toEqual([])
  })

  it('points the info-position/card-width error at the nested cardDefaults fields', async () => {
    const markers = await errorMarkers(
      baseSiteSettings({
        cardDefaults: {cardWidth: '1/4', mediaAspectRatio: '16:9', infoPosition: 'left'},
      }),
    )
    expect(markers).toHaveLength(2)
    expect(markers).toEqual(
      expect.arrayContaining([
        {path: ['cardDefaults', 'infoPosition'], message: expect.stringContaining('Info position')},
        {path: ['cardDefaults', 'cardWidth'], message: expect.stringContaining('Info position')},
      ]),
    )
  })
})
