import {describe, expect, it} from 'vitest'
import {orderCaseStudiesByOverrides} from './workIndexOrder'

const cs = (id: string) => ({_id: id, title: `Case Study ${id}`})

describe('orderCaseStudiesByOverrides', () => {
  it('returns the input order when there are no overrides', () => {
    const items = [cs('a'), cs('b')]
    expect(orderCaseStudiesByOverrides(items, undefined)).toEqual(items)
    expect(orderCaseStudiesByOverrides(items, [])).toEqual(items)
  })

  it('leads with overridden items in override-list order', () => {
    const items = [cs('a'), cs('b'), cs('c')]
    const overrides = [{itemId: 'c'}, {itemId: 'a'}]
    expect(orderCaseStudiesByOverrides(items, overrides).map((i) => i._id)).toEqual(['c', 'a', 'b'])
  })

  it('keeps non-overridden items in their input (date-sorted) order', () => {
    const items = [cs('a'), cs('b'), cs('c'), cs('d')]
    const overrides = [{itemId: 'b'}]
    expect(orderCaseStudiesByOverrides(items, overrides).map((i) => i._id)).toEqual([
      'b',
      'a',
      'c',
      'd',
    ])
  })

  it('skips overrides for absent (e.g. featured) case studies', () => {
    const items = [cs('a'), cs('b')]
    const overrides = [{itemId: 'featured-x'}, {itemId: 'b'}]
    expect(orderCaseStudiesByOverrides(items, overrides).map((i) => i._id)).toEqual(['b', 'a'])
  })

  it('ignores duplicate and empty overrides', () => {
    const items = [cs('a'), cs('b')]
    const overrides = [{itemId: 'b'}, {itemId: 'b'}, null, {itemId: null}]
    expect(orderCaseStudiesByOverrides(items, overrides).map((i) => i._id)).toEqual(['b', 'a'])
  })

  it('does not mutate the input array', () => {
    const items = [cs('a'), cs('b')]
    orderCaseStudiesByOverrides(items, [{itemId: 'b'}])
    expect(items.map((i) => i._id)).toEqual(['a', 'b'])
  })
})
