import {describe, expect, it} from 'vitest'
import {issuuEmbedUrl} from './issuu'

describe('issuuEmbedUrl', () => {
  it('converts a publication URL to the embed URL', () => {
    expect(issuuEmbedUrl('https://issuu.com/superbloomhouse/docs/superbloom_zineissue1_web')).toBe(
      'https://e.issuu.com/embed.html?d=superbloom_zineissue1_web&u=superbloomhouse',
    )
  })

  it('passes embed URLs through with their reader params intact', () => {
    const embed =
      'https://e.issuu.com/embed.html?backgroundColor=%23fbf0d6&d=superbloom_zine3finalweb&hideIssuuLogo=true&u=superbloomhouse'
    expect(issuuEmbedUrl(embed)).toBe(embed)
  })

  it('keeps extra path segments on a publication doc slug out of the embed', () => {
    expect(
      issuuEmbedUrl('https://issuu.com/superbloomhouse/docs/superbloom_zine2_webexport?fr=x'),
    ).toBe('https://e.issuu.com/embed.html?d=superbloom_zine2_webexport&u=superbloomhouse')
  })

  it('rejects non-ISSUU hosts, non-doc paths, and invalid input', () => {
    expect(issuuEmbedUrl('https://example.com/superbloomhouse/docs/issue')).toBeNull()
    expect(issuuEmbedUrl('https://issuu.com/superbloomhouse')).toBeNull()
    expect(issuuEmbedUrl('not a url')).toBeNull()
    expect(issuuEmbedUrl('')).toBeNull()
    expect(issuuEmbedUrl(null)).toBeNull()
    expect(issuuEmbedUrl(undefined)).toBeNull()
  })
})
