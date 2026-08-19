import {createHmac, timingSafeEqual} from 'node:crypto'

// Constant-time string compare for shared-secret checks (bearer tokens, signatures).
export function safeCompare(a: string, b: string): boolean {
  const bufferA = Buffer.from(a)
  const bufferB = Buffer.from(b)
  return bufferA.length === bufferB.length && timingSafeEqual(bufferA, bufferB)
}

// GitHub signs the raw request body with the webhook secret and sends it as
// `X-Hub-Signature-256: sha256=<hex hmac>`.
// https://docs.github.com/en/webhooks/using-webhooks/validating-webhook-deliveries
export function verifyGitHubSignature(
  rawBody: string,
  signatureHeader: string | null,
  secret: string,
): boolean {
  if (!signatureHeader?.startsWith('sha256=')) return false
  const expected = `sha256=${createHmac('sha256', secret).update(rawBody, 'utf8').digest('hex')}`
  return safeCompare(expected, signatureHeader)
}
