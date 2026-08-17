const ISSUU_HOST = 'issuu.com'
const EMBED_HOST = 'e.issuu.com'

/**
 * Normalize an ISSUU URL to the flipbook embed URL.
 *
 * Editors paste either the public publication URL
 * (`https://issuu.com/<user>/docs/<doc>`) or the embed URL issuu's share dialog
 * produces (`https://e.issuu.com/embed.html?d=<doc>&u=<user>`). Embed URLs pass
 * through untouched so their reader params (backgroundColor, hideIssuuLogo,
 * theme colors) survive; anything else returns null.
 */
export function issuuEmbedUrl(value?: string | null): string | null {
  if (!value) return null

  let url: URL
  try {
    url = new URL(value)
  } catch {
    return null
  }

  const host = url.hostname
  if (host !== ISSUU_HOST && !host.endsWith(`.${ISSUU_HOST}`)) return null

  if (host === EMBED_HOST && url.pathname === '/embed.html') {
    return url.toString()
  }

  const match = url.pathname.match(/^\/([^/]+)\/docs\/([^/?#]+)/)
  if (!match) return null

  const [, user, doc] = match
  return `https://${EMBED_HOST}/embed.html?d=${encodeURIComponent(doc)}&u=${encodeURIComponent(user)}`
}
