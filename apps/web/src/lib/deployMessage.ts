// Renders GitHub `deployment_status` events (emitted by Vercel's GitHub app) as
// Discord messages. Reads an allowlist of fields and composes a fresh message;
// commit messages and payload bodies are never forwarded (spec §4.2).

interface DeploymentStatusPayload {
  deployment_status?: {
    state?: string
    created_at?: string
    target_url?: string
    environment_url?: string
  }
  deployment?: {
    sha?: string
    ref?: string
    environment?: string
    created_at?: string
  }
}

export interface RenderedDeploy {
  channel: 'alerts' | 'activity'
  message: string
}

// Only final states are worth a message; pending/in_progress/queued are noise.
const FINAL_STATES = new Set(['success', 'failure', 'error'])

export function renderDeployEvent(payload: unknown): RenderedDeploy | null {
  const {deployment_status: status, deployment} = (payload ?? {}) as DeploymentStatusPayload
  const state = status?.state
  if (!state || !FINAL_STATES.has(state)) return null
  // Preview deploys are acknowledged and dropped (spec §4.2). Vercel's GitHub
  // app has used both "production" and "Production", so compare loosely.
  if (deployment?.environment?.toLowerCase() !== 'production') return null
  const sha = deployment.sha?.slice(0, 7)
  if (!sha) return null

  const revision = deployment.ref ? `${deployment.ref}@${sha}` : sha

  if (state === 'success') {
    const host = status?.environment_url?.replace(/^https?:\/\//, '') || 'superbloomhouse.com'
    const duration = formatDuration(status?.created_at, deployment.created_at)
    return {
      channel: 'activity',
      message: `Deploy succeeded — ${host} · \`${revision}\`${duration ? ` · ${duration}` : ''}`,
    }
  }

  const reason = state === 'error' ? 'build error' : 'build failed'
  const logs = status?.target_url ? ` · ${status.target_url}` : ''
  return {channel: 'alerts', message: `Deploy FAILED — \`${revision}\` · ${reason}${logs}`}
}

function formatDuration(statusCreatedAt?: string, deployCreatedAt?: string): string | null {
  if (!statusCreatedAt || !deployCreatedAt) return null
  const ms = Date.parse(statusCreatedAt) - Date.parse(deployCreatedAt)
  if (!Number.isFinite(ms) || ms < 0) return null
  const seconds = Math.round(ms / 1000)
  if (seconds < 60) return `${seconds}s`
  const minutes = Math.floor(seconds / 60)
  const restSeconds = seconds % 60
  if (minutes < 60) return restSeconds ? `${minutes}m ${restSeconds}s` : `${minutes}m`
  const hours = Math.floor(minutes / 60)
  return `${hours}h ${minutes % 60}m`
}
