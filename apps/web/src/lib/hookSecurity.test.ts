import {createHmac} from 'node:crypto'
import {describe, expect, it} from 'vitest'
import {safeCompare, verifyGitHubSignature} from './hookSecurity'

const SECRET = 'test-secret'
const BODY = '{"hello":"world"}'
const sign = (body: string, secret: string) =>
  `sha256=${createHmac('sha256', secret).update(body, 'utf8').digest('hex')}`

describe('verifyGitHubSignature', () => {
  it('accepts a valid signature over the raw body', () => {
    expect(verifyGitHubSignature(BODY, sign(BODY, SECRET), SECRET)).toBe(true)
  })

  it('rejects a tampered body', () => {
    expect(verifyGitHubSignature(`${BODY} `, sign(BODY, SECRET), SECRET)).toBe(false)
  })

  it('rejects a signature made with the wrong secret', () => {
    expect(verifyGitHubSignature(BODY, sign(BODY, 'other-secret'), SECRET)).toBe(false)
  })

  it('rejects missing and malformed headers', () => {
    expect(verifyGitHubSignature(BODY, null, SECRET)).toBe(false)
    expect(verifyGitHubSignature(BODY, 'sha1=abc', SECRET)).toBe(false)
    expect(verifyGitHubSignature(BODY, 'sha256=not-hex', SECRET)).toBe(false)
  })
})

describe('safeCompare', () => {
  it('compares strings by value', () => {
    expect(safeCompare('abc', 'abc')).toBe(true)
    expect(safeCompare('abc', 'abd')).toBe(false)
    expect(safeCompare('abc', 'abcd')).toBe(false)
  })
})
