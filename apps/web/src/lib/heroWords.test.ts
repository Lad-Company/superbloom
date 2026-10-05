import {describe, expect, it} from 'vitest'
import {splitHeroWords} from './heroWords'

describe('splitHeroWords', () => {
  it('indexes words and keeps whitespace runs as separate tokens', () => {
    expect(splitHeroWords('Unexpected is  the standard')).toEqual([
      {kind: 'word', text: 'Unexpected', index: 0},
      {kind: 'space', text: ' '},
      {kind: 'word', text: 'is', index: 1},
      {kind: 'space', text: '  '},
      {kind: 'word', text: 'the', index: 2},
      {kind: 'space', text: ' '},
      {kind: 'word', text: 'standard', index: 3},
    ])
  })

  it('preserves leading and trailing whitespace without inventing words', () => {
    expect(splitHeroWords('  Shop ')).toEqual([
      {kind: 'space', text: '  '},
      {kind: 'word', text: 'Shop', index: 0},
      {kind: 'space', text: ' '},
    ])
  })

  it('treats newlines as whitespace so CMS line breaks still split', () => {
    const tokens = splitHeroWords('Expect\nthe unexpected')
    expect(tokens.filter((t) => t.kind === 'word').map((t) => t.text)).toEqual([
      'Expect',
      'the',
      'unexpected',
    ])
  })

  it('round-trips the original text', () => {
    const heading = 'Superbloom House’s 5th-Birthday Move? Open a Shop'
    expect(splitHeroWords(heading).map((t) => t.text).join('')).toBe(heading)
  })

  it('returns nothing for an empty heading', () => {
    expect(splitHeroWords('')).toEqual([])
  })
})
