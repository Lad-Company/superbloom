import {mkdtemp, readFile, rm, writeFile} from 'node:fs/promises'
import {tmpdir} from 'node:os'
import {join} from 'node:path'
import {describe, expect, it} from 'vitest'
import {
  generateStarterManifest,
  requireSourceChecksumApproval,
  type StarterGenerator,
} from './generate-starter-manifest'

const coverage = {
  targets: [
    {
      id: 'home',
      documentType: 'homepage',
      figmaUrl: 'https://www.figma.com/design/example?node-id=1-1',
    },
  ],
}

describe('generateStarterManifest', () => {
  it('writes a validated, reviewable manifest with provenance', async () => {
    const fixture = await fixtureFiles()
    try {
      const manifest = await generateStarterManifest({...fixture, generator: validGenerator})

      expect(manifest).toMatchObject({
        sourceChecksum: 'source-checksum',
        inputs: {
          googleDoc: {
            url: 'https://docs.google.com/document/d/example/export',
            checksum: 'source-checksum',
          },
          trackerExport: {
            path: expect.any(String),
            checksum: 'source-checksum',
          },
          frameIo: 'https://next.frame.io/share/example/',
        },
        coverage,
        candidates: [
          {
            targetId: 'home',
            fields: {
              headline: {
                value: 'We create the unexpected.',
                provenance: {kind: 'source'},
              },
              summary: {
                provenance: {kind: 'inferred', rationale: 'The source does not provide homepage summary copy.'},
              },
            },
          },
        ],
      })
      await expect(readFile(fixture.outputPath, 'utf8')).resolves.toContain('"sourceChecksum": "source-checksum"')
      await expect(readFile(fixture.diagnosticsPath, 'utf8')).resolves.toContain(
        '"sourceChecksum": "source-checksum"',
      )
    } finally {
      await fixture.cleanup()
    }
  })

  it('rejects malformed LLM output without writing a manifest', async () => {
    const fixture = await fixtureFiles()
    try {
      await expect(
        generateStarterManifest({
          ...fixture,
          generator: async () => ({schemaVersion: 1, candidates: []}),
        }),
      ).rejects.toThrow('Invalid starter manifest')

      await expect(readFile(fixture.outputPath, 'utf8')).rejects.toThrow()
      await expect(readFile(fixture.diagnosticsPath, 'utf8')).resolves.toMatch(/invalid-llm-output/)
    } finally {
      await fixture.cleanup()
    }
  })
})

describe('requireSourceChecksumApproval', () => {
  it('requires the exact reviewed source checksum', () => {
    expect(() => requireSourceChecksumApproval({sourceChecksum: 'reviewed'}, undefined)).toThrow(
      '--approve-source-checksum',
    )
    expect(() => requireSourceChecksumApproval({sourceChecksum: 'reviewed'}, 'changed')).toThrow(
      '--approve-source-checksum',
    )
    expect(() => requireSourceChecksumApproval({sourceChecksum: 'reviewed'}, 'reviewed')).not.toThrow()
  })
})

const validGenerator: StarterGenerator = async (input) => ({
  schemaVersion: 1,
  generatedAt: '2026-07-23T12:00:00.000Z',
  sourceChecksum: 'source-checksum',
  inputs: input.inputs,
  coverage,
  candidates: [
    {
      targetId: 'home',
      documentType: 'homepage',
      fields: {
        headline: {
          value: 'We create the unexpected.',
          provenance: {
            kind: 'source',
            sources: [sourceRef()],
          },
        },
        summary: {
          value: 'SuperBloom is an independent creative company.',
          provenance: {
            kind: 'inferred',
            sources: [sourceRef()],
            rationale: 'The source does not provide homepage summary copy.',
          },
        },
      },
    },
  ],
  media: [],
})

async function fixtureFiles() {
  const directory = await mkdtemp(join(tmpdir(), 'superbloom-starter-manifest-'))
  const sourcePath = join(directory, 'content-master.md')
  const sourceManifestPath = join(directory, 'source-manifest.json')
  const retrievedMediaPath = join(directory, 'retrieved-media-manifest.json')
  const mediaSourcesPath = join(directory, 'media-sources.json')
  const coveragePath = join(directory, 'starter-coverage.json')
  const outputPath = join(directory, 'starter-manifest.json')
  const diagnosticsPath = join(directory, 'generation-diagnostics.json')
  await Promise.all([
    writeFile(sourcePath, '# Source\n'),
    writeFile(
      sourceManifestPath,
      '{"checksum":"source-checksum","sourceUrl":"https://docs.google.com/document/d/example/export"}\n',
    ),
    writeFile(retrievedMediaPath, '[]\n'),
    writeFile(mediaSourcesPath, '["https://next.frame.io/share/example/"]\n'),
    writeFile(coveragePath, `${JSON.stringify(coverage)}\n`),
  ])
  return {
    sourcePath,
    sourceManifestPath,
    retrievedMediaPath,
    mediaSourcesPath,
    coveragePath,
    outputPath,
    diagnosticsPath,
    cleanup: () => rm(directory, {recursive: true, force: true}),
  }
}

function sourceRef() {
  return {
    lineStart: 1,
    lineEnd: 1,
    headingPath: ['Source'],
    text: '# Source',
  }
}
