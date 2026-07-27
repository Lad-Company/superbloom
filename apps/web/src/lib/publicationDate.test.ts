import {describe, expect, it} from 'vitest'
import {formatPublicationDateIndex} from './publicationDate'

describe('formatPublicationDateIndex', () => {
  it('formats dates as MM DD YY space-separated', () => {
    const {label} = formatPublicationDateIndex('2026-06-26T12:00:00.000Z')
    expect(label).toBe('06 26 26')
  })

  it('zero-pads single-digit months and days', () => {
    const {label} = formatPublicationDateIndex('2026-01-05T12:00:00.000Z')
    expect(label).toBe('01 05 26')
  })

  it('uses the last two digits of the year', () => {
    const {label} = formatPublicationDateIndex('1999-12-31T12:00:00.000Z')
    expect(label).toBe('12 31 99')
  })

  it('returns an ISO dateTime value', () => {
    const {dateTime} = formatPublicationDateIndex('2026-06-26T12:00:00.000Z')
    expect(new Date(dateTime).toISOString()).toBe(dateTime)
  })
})
