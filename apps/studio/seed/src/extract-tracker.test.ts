import {mkdtemp, readFile, rm, writeFile} from 'node:fs/promises'
import {tmpdir} from 'node:os'
import {join} from 'node:path'
import {describe, expect, it} from 'vitest'
import {extractTracker} from './extract-tracker'
import {refreshSource} from './refresh-source'

describe('extractTracker', () => {
  it('preserves heading provenance and de-duplicates media links', () => {
    const result = extractTracker(`# Work
## Tyson
Hero [image](https://cdn.example.com/hero.jpg#full) and [duplicate](https://cdn.example.com/hero.jpg).
Reference [site](https://example.com/work).
`)

    expect(result.outline).toEqual([
      expect.objectContaining({heading: 'Work', source: expect.objectContaining({headingPath: ['Work']})}),
      expect.objectContaining({
        heading: 'Tyson',
        source: expect.objectContaining({headingPath: ['Work', 'Tyson'], lineStart: 2, lineEnd: 5}),
      }),
    ])
    expect(result.links).toHaveLength(2)
    expect(result.media).toEqual([
      expect.objectContaining({
        url: 'https://cdn.example.com/hero.jpg',
        category: 'direct-media',
        mediaKind: 'image',
        sourceRefs: [
          expect.objectContaining({lineStart: 3, lineEnd: 3}),
          expect.objectContaining({lineStart: 3, lineEnd: 3}),
        ],
      }),
    ])
  })

  it('keeps unavailable candidates as non-fatal diagnostics', () => {
    const result = extractTracker('# Tracker\n[bad](mailto:hello@example.com)\n')

    expect(result.diagnostics).toEqual([
      expect.objectContaining({code: 'invalid-url', source: expect.objectContaining({lineStart: 2})}),
    ])
  })

  it('keeps non-media links visible in diagnostics', () => {
    const result = extractTracker('# Tracker\n[site](https://example.com/work)\n')

    expect(result.diagnostics).toEqual([
      expect.objectContaining({code: 'non-media-link', source: expect.objectContaining({lineStart: 2})}),
    ])
  })

  it('retains URLs containing parentheses', () => {
    const result = extractTracker('# Tracker\n[media](https://cdn.example.com/file(1).jpg)\n')

    expect(result.media).toEqual([
      expect.objectContaining({url: 'https://cdn.example.com/file(1).jpg', mediaKind: 'image'}),
    ])
  })
})

describe('refreshSource', () => {
  it('does not replace a snapshot when validation fails', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'superbloom-seed-'))
    const sourcePath = join(directory, 'download.md')
    const outputPath = join(directory, 'content-master.md')
    const metadataPath = join(directory, 'source-metadata.json')
    try {
      await writeFile(sourcePath, 'not a tracker')
      await writeFile(outputPath, '# Previous snapshot\n')

      await expect(
        refreshSource({
          sourcePath,
          sourceUrl: 'https://docs.google.com/document/d/tracker',
          outputPath,
          outputMetadataPath: metadataPath,
        }),
      ).rejects.toThrow('does not contain a Markdown heading')

      await expect(readFile(outputPath, 'utf8')).resolves.toBe('# Previous snapshot\n')
    } finally {
      await rm(directory, {recursive: true, force: true})
    }
  })
})
