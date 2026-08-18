// Discord posting for the observability relay (docs/observability-pipeline-spec.md §5).
// Every post disables mention parsing and is capped at Discord's 2000-char limit,
// so upstream content (titles, SHAs, authors) can never trigger @mentions.

const MAX_CONTENT_LENGTH = 2000

export async function postToDiscord(webhookUrl: string, content: string): Promise<void> {
  const response = await fetch(webhookUrl, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({
      content:
        content.length > MAX_CONTENT_LENGTH
          ? `${content.slice(0, MAX_CONTENT_LENGTH - 1)}…`
          : content,
      allowed_mentions: {parse: []},
    }),
    signal: AbortSignal.timeout(10_000),
  })
  if (!response.ok) {
    throw new Error(`Discord post failed with status ${response.status}`)
  }
}

export async function postAlert(content: string): Promise<void> {
  const url = import.meta.env.DISCORD_ALERTS_WEBHOOK_URL
  if (!url) throw new Error('DISCORD_ALERTS_WEBHOOK_URL is not configured')
  return postToDiscord(url, content)
}

export async function postActivity(content: string): Promise<void> {
  const url = import.meta.env.DISCORD_ACTIVITY_WEBHOOK_URL
  if (!url) throw new Error('DISCORD_ACTIVITY_WEBHOOK_URL is not configured')
  return postToDiscord(url, content)
}
