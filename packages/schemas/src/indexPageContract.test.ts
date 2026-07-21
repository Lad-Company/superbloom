import {describe, expect, it} from 'vitest'
import {validateIndexPageSecondary} from './indexPageContract'

describe('Index Page contract validators', () => {
  it('requires exactly three unique secondary items', () => {
    expect(validateIndexPageSecondary([{_ref: 'a'}], {})).toContain('exactly three')
    expect(
      validateIndexPageSecondary([{_ref: 'a'}, {_ref: 'a'}, {_ref: 'b'}], {}),
    ).toContain('unique')
    expect(
      validateIndexPageSecondary([{_ref: 'a'}, {_ref: 'b'}, {_ref: 'c'}], {}),
    ).toBe(true)
  })

  it('requires every secondary item to select a reference', () => {
    expect(
      validateIndexPageSecondary([{_ref: 'a'}, {}, {_ref: 'c'}], {}),
    ).toContain('must be selected')
  })

  it('excludes the lead item from secondary items', () => {
    expect(
      validateIndexPageSecondary(
        [{_ref: 'lead'}, {_ref: 'b'}, {_ref: 'c'}],
        {document: {lead: {_ref: 'lead'}}},
      ),
    ).toContain('cannot include the lead')
  })
})
