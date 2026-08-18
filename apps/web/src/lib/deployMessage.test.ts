import {describe, expect, it} from 'vitest'
import {renderDeployEvent} from './deployMessage'

const baseEvent = {
  deployment_status: {
    state: 'success',
    created_at: '2026-08-17T12:01:42Z',
    target_url: 'https://vercel.com/lad-company/superbloom/abc123',
    environment_url: 'https://superbloom-theta.vercel.app',
  },
  deployment: {
    sha: '138ad15deadbeefcafe',
    ref: 'main',
    environment: 'production',
    created_at: '2026-08-17T12:00:00Z',
  },
}

const withOverrides = (overrides: {
  state?: string
  environment?: string
  environmentUrl?: string | null
  withTimestamps?: boolean
}) => {
  const event = structuredClone(baseEvent)
  if (overrides.state) event.deployment_status.state = overrides.state
  if (overrides.environment) event.deployment.environment = overrides.environment
  if (overrides.environmentUrl === null) {
    event.deployment_status.environment_url = undefined as never
  }
  if (overrides.withTimestamps === false) {
    event.deployment_status.created_at = undefined as never
    event.deployment.created_at = undefined as never
  }
  return event
}

describe('renderDeployEvent', () => {
  it('renders a production success for the activity channel', () => {
    expect(renderDeployEvent(baseEvent)).toEqual({
      channel: 'activity',
      message: 'Deploy succeeded — superbloom-theta.vercel.app · `main@138ad15` · 1m 42s',
    })
  })

  it('renders a production failure for the alerts channel with the logs link', () => {
    const rendered = renderDeployEvent(withOverrides({state: 'failure'}))
    expect(rendered?.channel).toBe('alerts')
    expect(rendered?.message).toBe(
      'Deploy FAILED — `main@138ad15` · build failed · https://vercel.com/lad-company/superbloom/abc123',
    )
  })

  it('renders an error state as a build error', () => {
    const rendered = renderDeployEvent(withOverrides({state: 'error'}))
    expect(rendered?.message).toContain('build error')
  })

  it('drops preview deployments', () => {
    expect(renderDeployEvent(withOverrides({environment: 'Preview'}))).toBeNull()
    expect(renderDeployEvent(withOverrides({environment: 'preview'}))).toBeNull()
  })

  it('drops non-final states', () => {
    for (const state of ['pending', 'in_progress', 'queued', 'waiting', 'inactive']) {
      expect(renderDeployEvent(withOverrides({state}))).toBeNull()
    }
  })

  it('falls back to the site domain when the event has no environment URL', () => {
    const rendered = renderDeployEvent(withOverrides({environmentUrl: null}))
    expect(rendered?.message).toContain('Deploy succeeded — superbloomhouse.com')
  })

  it('omits the duration when timestamps are missing', () => {
    const rendered = renderDeployEvent(withOverrides({withTimestamps: false}))
    expect(rendered?.message).toBe('Deploy succeeded — superbloom-theta.vercel.app · `main@138ad15`')
  })

  it('drops malformed events', () => {
    expect(renderDeployEvent(null)).toBeNull()
    expect(renderDeployEvent({})).toBeNull()
    expect(renderDeployEvent({deployment_status: {state: 'success'}, deployment: {environment: 'production'}})).toBeNull()
  })
})
