import {generateKeyPairSync} from 'node:crypto'
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'

const fetchMock = vi.fn()
vi.stubGlobal('fetch', fetchMock)

const {privateKey} = generateKeyPairSync('rsa', {modulusLength: 2048})
const PEM = privateKey.export({format: 'pem', type: 'pkcs8'}).toString()

const CREDENTIALS = {
  propertyId: '123456789',
  clientEmail: 'ga4-digest@project.iam.gserviceaccount.com',
  privateKey: PEM,
}

const jsonResponse = (body: unknown) =>
  new Response(JSON.stringify(body), {headers: {'Content-Type': 'application/json'}})

// Routes the mock by URL: token exchange, then the three runReport calls.
const mockGoogleApis = () => {
  fetchMock.mockImplementation((url: string, init?: {body?: string}) => {
    if (url === 'https://oauth2.googleapis.com/token') {
      return Promise.resolve(jsonResponse({access_token: 'test-token', expires_in: 3600}))
    }
    const body = JSON.parse(init?.body ?? '{}')
    if (!body.dimensions) {
      return Promise.resolve(
        jsonResponse({rows: [{metricValues: [{value: '312'}, {value: '401'}]}]}),
      )
    }
    if (body.dimensions[0].name === 'pagePath') {
      return Promise.resolve(
        jsonResponse({
          rows: [
            {dimensionValues: [{value: '/'}], metricValues: [{value: '98'}]},
            {dimensionValues: [{value: '/work'}], metricValues: [{value: '54'}]},
          ],
        }),
      )
    }
    return Promise.resolve(
      jsonResponse({
        rows: [
          {dimensionValues: [{value: 'google'}], metricValues: [{value: '120'}]},
          {dimensionValues: [{value: '(direct)'}], metricValues: [{value: '96'}]},
        ],
      }),
    )
  })
}

describe('fetchTrafficDigest', () => {
  beforeEach(async () => {
    vi.resetModules()
    mockGoogleApis()
  })

  afterEach(() => {
    fetchMock.mockReset()
  })

  it('exchanges the service-account JWT and aggregates the three reports', async () => {
    const {fetchTrafficDigest} = await import('./ga4')

    const digest = await fetchTrafficDigest(CREDENTIALS)

    expect(digest.users).toBe('312')
    expect(digest.sessions).toBe('401')
    expect(digest.topPages).toEqual([
      ['/', '98'],
      ['/work', '54'],
    ])
    // "(direct)" is rendered as "direct"
    expect(digest.topReferrers).toEqual([
      ['google', '120'],
      ['direct', '96'],
    ])
    expect(digest.dateLabel).toMatch(/^\w{3} \w{3} \d+$/)

    const reportCalls = fetchMock.mock.calls.filter(([url]) => String(url).includes(':runReport'))
    expect(reportCalls).toHaveLength(3)
    expect(reportCalls[0][1].headers.Authorization).toBe('Bearer test-token')
  })

  it('accepts a private key stored with literal \\n escapes', async () => {
    const {fetchTrafficDigest} = await import('./ga4')

    await expect(
      fetchTrafficDigest({...CREDENTIALS, privateKey: PEM.replace(/\n/g, '\\n')}),
    ).resolves.toMatchObject({users: '312'})
  })

  it('reuses the cached access token across calls', async () => {
    const {fetchTrafficDigest} = await import('./ga4')

    await fetchTrafficDigest(CREDENTIALS)
    await fetchTrafficDigest(CREDENTIALS)

    const tokenCalls = fetchMock.mock.calls.filter(
      ([url]) => url === 'https://oauth2.googleapis.com/token',
    )
    expect(tokenCalls).toHaveLength(1)
  })

  it('throws when the token exchange fails', async () => {
    const {fetchTrafficDigest} = await import('./ga4')
    fetchMock.mockResolvedValue(new Response('unauthorized', {status: 401}))

    await expect(fetchTrafficDigest(CREDENTIALS)).rejects.toThrow('401')
  })
})

describe('renderDigest', () => {
  it('renders the compact one-line digest', async () => {
    const {renderDigest} = await import('./ga4')

    expect(
      renderDigest({
        dateLabel: 'Mon Aug 17',
        users: '312',
        sessions: '401',
        topPages: [
          ['/', '98'],
          ['/work', '54'],
          ['/zine', '31'],
        ],
        topReferrers: [
          ['google', '120'],
          ['direct', '96'],
        ],
      }),
    ).toBe(
      'Traffic — Mon Aug 17: 312 users · 401 sessions · Top: / (98), /work (54), /zine (31) · Referrers: google (120), direct (96)',
    )
  })
})
