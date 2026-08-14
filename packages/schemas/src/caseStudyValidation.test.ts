/**
 * Document-level validation wiring for case studies, exercised through the
 * real Studio validation engine (validateDocument) against the real compiled
 * schema. Marker paths are what the Studio validation panel uses to deep-link
 * an error to its field, so these tests assert paths — not just messages.
 *
 * Regression: the qualitative-stats secondary-color rule used to return a bare
 * string from the document-level rule, which Studio attaches to the document
 * root (path: []) — the publish banner gave editors no direction to the
 * Secondary Brand Color field.
 */
import {describe, expect, it} from 'vitest'
import {createSchema, validateDocument} from 'sanity'
import {schemaTypes} from './index'

// Stubs for plugin-registered types (color input, mux) so the schema compiles
// outside Studio. Their internals don't affect case study validation.
const pluginStubs = [
  {
    name: 'color',
    title: 'Color',
    type: 'object',
    fields: [
      {name: 'hex', type: 'string'},
      {name: 'alpha', type: 'number'},
    ],
  },
  {
    name: 'mux.video',
    title: 'Video',
    type: 'object',
    fields: [{name: 'asset', type: 'reference', to: [{type: 'mux.videoAsset'}]}],
  },
  {
    name: 'mux.videoAsset',
    title: 'Mux Video Asset',
    type: 'document',
    fields: [{name: 'assetId', type: 'string'}],
  },
]

const schema = createSchema({name: 'test', types: [...schemaTypes, ...pluginStubs]})

// Minimal client stub: fetch resolves empty, chained config calls return self
// (the slug uniqueness validator calls withConfig during validation).
const fakeClient: any = {fetch: async () => []}
fakeClient.withConfig = () => fakeClient
fakeClient.withOptions = () => fakeClient
fakeClient.clone = () => fakeClient
fakeClient.config = () => ({})

const workspace = {name: 'test', schema, client: fakeClient} as any

const textBlock = (text: string) => ({
  _type: 'block',
  _key: 'b1',
  style: 'normal',
  markDefs: [],
  children: [{_type: 'span', _key: 'c1', text, marks: []}],
})

const narrativeSection = () => ({
  _type: 'caseStudyNarrativeSection',
  summary: [textBlock('Summary text')],
})

function baseCaseStudy(overrides: Record<string, unknown> = {}) {
  return {
    _id: 'drafts.case-study-1',
    _type: 'caseStudy',
    title: 'Test Study',
    slug: {_type: 'slug', current: 'test-study'},
    client: 'Test Client',
    capabilities: [{_type: 'reference', _ref: 'capability-1', _key: 'cap1'}],
    publicationDate: '2026-01-01T00:00:00.000Z',
    cardMedia: {
      _type: 'mediaBox',
      asset: [
        {
          _type: 'image',
          _key: 'img1',
          asset: {_type: 'reference', _ref: 'image-abc123-1000x1000-jpg'},
        },
      ],
      altText: 'Alt text',
    },
    cardWidth: '1/2',
    mediaAspectRatio: '16:9',
    infoPosition: 'below',
    primaryColor: {_type: 'color', hex: '#fdd143'},
    highlights: narrativeSection(),
    challenge: narrativeSection(),
    unexpectedInsight: narrativeSection(),
    bigIdea: narrativeSection(),
    results: {
      _type: 'caseStudyResults',
      variant: 'quantitative',
      backgroundColor: 'primary',
      stats: [{_type: 'caseStudyStat', _key: 's1', value: '42%', label: 'Conversion'}],
    },
    ...overrides,
  } as any
}

async function errorMarkers(doc: ReturnType<typeof baseCaseStudy>) {
  const markers = await validateDocument({
    document: doc,
    workspace,
    getClient: () => fakeClient as any,
    getDocumentExists: async () => true,
  } as any)
  return markers
    .filter((m: any) => m.level === 'error')
    .map((m: any) => ({path: m.path, message: m.message ?? m.item?.message}))
}

const qualitativeResults = {
  _type: 'caseStudyResults',
  variant: 'qualitative',
  backgroundColor: 'primary',
  stats: [{_type: 'caseStudyStat', _key: 's1', value: 'A big statement', label: 'Caption'}],
}

describe('case study document validation', () => {
  it('accepts quantitative results without a secondary color (pre-existing documents)', async () => {
    expect(await errorMarkers(baseCaseStudy())).toEqual([])
  })

  it('accepts qualitative results when a secondary color is set', async () => {
    const markers = await errorMarkers(
      baseCaseStudy({
        secondaryColor: {_type: 'color', hex: '#3f2293'},
        results: qualitativeResults,
      }),
    )
    expect(markers).toEqual([])
  })

  it('points the qualitative secondary-color error at the secondaryColor field', async () => {
    const markers = await errorMarkers(baseCaseStudy({results: qualitativeResults}))
    expect(markers).toEqual([
      {
        path: ['secondaryColor'],
        message: expect.stringContaining('Secondary Brand Color'),
      },
    ])
  })

  it('points the secondary-background error at the secondaryColor field', async () => {
    const markers = await errorMarkers(
      baseCaseStudy({
        results: {...qualitativeResults, variant: 'quantitative', backgroundColor: 'secondary'},
      }),
    )
    expect(markers).toEqual([
      {
        path: ['secondaryColor'],
        message: expect.stringContaining('Secondary Brand Color'),
      },
    ])
  })
})
