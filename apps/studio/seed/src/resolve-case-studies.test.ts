import {describe, expect, it} from 'vitest'
import {resolveCaseStudies} from './resolve-case-studies'
import type {StarterManifest} from './types'

const source = {
  lineStart: 1,
  lineEnd: 1,
  headingPath: ['Work'],
  text: 'Case study source',
}

const retrievedMedia = [
  {
    checksum: 'media-tyson',
    cachePath: '/tmp/tyson.jpg',
    mimeType: 'image/jpeg',
    provenance: [],
    selectedUses: [],
    upload: {status: 'pending' as const},
  },
]

describe('resolveCaseStudies', () => {
  it('resolves six complete case studies with deterministic document and array IDs', () => {
    const resolved = resolveCaseStudies(manifest(), retrievedMedia)

    expect(resolved).toHaveLength(6)
    expect(resolved.map(({document}) => document._id)).toEqual([
      'case-study-tyson',
      'case-study-silversea',
      'case-study-deel',
      'case-study-simon-malls',
      'case-study-voodoo-ranger',
      'case-study-jimmy-dean',
    ])

    for (const {document, inferredFields, media} of resolved) {
      expect(document).toMatchObject({
        _type: 'caseStudy',
        slug: {_type: 'slug'},
        publicationDate: expect.any(String),
        cardMedia: {_type: 'mediaBox', asset: [{_type: 'image'}]},
        cardWidth: '1/2',
        mediaAspectRatio: '16:9',
        infoPosition: 'below',
        primaryColor: {hex: '#112233'},
        highlights: {_type: 'caseStudyNarrativeSection'},
        challenge: {_type: 'caseStudyNarrativeSection'},
        unexpectedInsight: {_type: 'caseStudyNarrativeSection'},
        bigIdea: {_type: 'caseStudyNarrativeSection'},
        results: {backgroundColor: 'primary'},
      })
      expect(document.highlights.summary[0]._key).toBe('highlights-summary')
      expect(document.results.stats[0]._key).toBe('result-stat-1')
      expect(document.capabilities[0]._key).toBe('capabilities-1')
      expect(document.tags?.[0]._key).toBe('tags-1')
      expect(document.nextProject._ref).not.toBe(document._id)
      expect(document.press).toBeUndefined()
      expect(media).toEqual([
        expect.objectContaining({
          checksum: 'media-tyson',
          field: 'cardMedia',
          provenance: expect.objectContaining({kind: 'source'}),
        }),
      ])
      expect(resolved[0].fieldProvenance.summary).toEqual(
        expect.objectContaining({kind: 'inferred', rationale: 'Fixture inference.'}),
      )
      expect(inferredFields).toEqual(
        expect.arrayContaining([
          expect.objectContaining({path: 'summary', rationale: 'Fixture inference.'}),
        ]),
      )
    }
  })

  it('rejects missing narrative content', () => {
    const invalidNarrative = manifest()
    invalidNarrative.candidates[0].fields.highlights = {
      value: '',
      provenance: sourceProvenance(),
    }

    expect(() => resolveCaseStudies(invalidNarrative, retrievedMedia)).toThrow(/highlights.*non-empty/i)
  })

  it('rejects media that was not retrieved', () => {
    const invalidMedia = manifest()
    invalidMedia.media[0].checksum = 'not-retrieved'

    expect(() => resolveCaseStudies(invalidMedia, retrievedMedia)).toThrow(/not retrieved/i)
  })

  it('rejects Press records that are not News and self-referencing next projects', () => {
    const invalidPress = manifest()
    invalidPress.candidates[0].fields.press = {
      value: [{_ref: 'article-editorial', articleType: 'editorial'}],
      provenance: sourceProvenance(),
    }

    expect(() => resolveCaseStudies(invalidPress, retrievedMedia)).toThrow(/Press.*News/i)

    const invalidNextProject = manifest()
    invalidNextProject.candidates[0].fields.nextProject = {
      value: 'case-study-tyson',
      provenance: sourceProvenance(),
    }

    expect(() => resolveCaseStudies(invalidNextProject, retrievedMedia)).toThrow(/Next Project.*self/i)
  })

  it('resolves retrieved video as a Mux media asset', () => {
    const video = {...retrievedMedia[0], mimeType: 'video/mp4'}

    const [resolved] = resolveCaseStudies(manifest(), [video])

    expect(resolved.document.cardMedia.asset[0]).toMatchObject({
      _type: 'mux.video',
      asset: {_ref: 'mux.videoAsset-media-tyson'},
    })
  })
})

function manifest(): StarterManifest {
  return {
    schemaVersion: 1,
    generatedAt: '2026-07-23T12:00:00.000Z',
    sourceChecksum: 'source-checksum',
    inputs: {
      googleDoc: {url: 'https://docs.google.com/document/d/example/export', checksum: 'source-checksum'},
      trackerExport: {path: 'source/content-master.md', checksum: 'source-checksum'},
      frameIo: 'https://next.frame.io/share/example/',
    },
    coverage: {targets: []},
    candidates: ['Tyson', 'Silversea', 'Deel', 'Simon Malls', 'Voodoo Ranger', 'Jimmy Dean'].map((title) => ({
      targetId: `case-study-${slug(title)}`,
      documentType: 'caseStudy' as const,
      fields: fields(title),
    })),
    media: ['Tyson', 'Silversea', 'Deel', 'Simon Malls', 'Voodoo Ranger', 'Jimmy Dean'].map((title) => ({
      checksum: 'media-tyson',
      targetId: `case-study-${slug(title)}`,
      field: 'cardMedia',
      provenance: sourceProvenance(),
    })),
  }
}

function fields(title: string) {
  return {
    title: {value: title, provenance: sourceProvenance()},
    client: {value: `${title} Client`, provenance: sourceProvenance()},
    summary: {
      value: `${title} summary.`,
      provenance: {kind: 'inferred' as const, sources: [source], rationale: 'Fixture inference.'},
    },
    capabilities: {value: ['capability-brand'], provenance: sourceProvenance()},
    tags: {value: ['tag-work'], provenance: sourceProvenance()},
    publicationDate: {value: '2026-01-01T00:00:00.000Z', provenance: sourceProvenance()},
    cardWidth: {value: '1/2', provenance: sourceProvenance()},
    mediaAspectRatio: {value: '16:9', provenance: sourceProvenance()},
    infoPosition: {value: 'below', provenance: sourceProvenance()},
    primaryColor: {value: '#112233', provenance: sourceProvenance()},
    highlights: {value: `${title} highlights.`, provenance: sourceProvenance()},
    challenge: {value: `${title} challenge.`, provenance: sourceProvenance()},
    unexpectedInsight: {value: `${title} insight.`, provenance: sourceProvenance()},
    bigIdea: {value: `${title} idea.`, provenance: sourceProvenance()},
    results: {
      value: {backgroundColor: 'primary', stats: [{value: '1x', label: 'Fixture result'}]},
      provenance: sourceProvenance(),
    },
  }
}

function sourceProvenance() {
  return {kind: 'source' as const, sources: [source]}
}

function slug(value: string) {
  return value.toLowerCase().replaceAll(' ', '-')
}
