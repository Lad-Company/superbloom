import {mkdtemp, readFile, rm} from 'node:fs/promises'
import {tmpdir} from 'node:os'
import {join} from 'node:path'
import {describe, expect, it} from 'vitest'
import type {MediaInventoryEntry} from './types'
import {retrieveMedia} from './retrieve-media'

const png = Uint8Array.from([
  137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 13, 73, 72, 68, 82, 0, 0, 0, 2, 0, 0, 0, 3,
  8, 6, 0, 0, 0,
])

const directMedia: MediaInventoryEntry = {
  url: 'https://cdn.example.com/hero.png',
  originalUrls: ['https://cdn.example.com/hero.png'],
  category: 'direct-media',
  downloadable: true,
  mediaKind: 'image',
  sourceRefs: [],
}

describe('retrieveMedia', () => {
  it('caches, inspects, and checksum-deduplicates successfully retrieved media', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'superbloom-media-'))
    try {
      const result = await retrieveMedia({
        media: [
          directMedia,
          {...directMedia, url: 'https://cdn.example.com/duplicate.png'},
        ],
        cacheDirectory: directory,
        fetch: async () =>
          new Response(png, {
            headers: {'content-type': 'image/png'},
          }),
      })

      expect(result.media).toEqual([
        expect.objectContaining({
          checksum: 'a6167f34f18f4427f0bc7dd071843ed1a8001ce0d7c2bb4fec4eaae17b3dcdac',
          mimeType: 'image/png',
          dimensions: {width: 2, height: 3},
          selectedUses: [],
          upload: {status: 'pending'},
        }),
      ])
      expect(result.media[0].provenance).toHaveLength(2)
      await expect(readFile(result.media[0].cachePath)).resolves.toEqual(Buffer.from(png))
    } finally {
      await rm(directory, {recursive: true, force: true})
    }
  })

  it('records failures and non-media resources without interrupting retrieval', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'superbloom-media-'))
    try {
      const result = await retrieveMedia({
        media: [
          directMedia,
          {
            ...directMedia,
            url: 'https://cdn.example.com/readme.txt',
            mediaKind: 'file',
          },
        ],
        cacheDirectory: directory,
        fetch: async (input) => {
          if (String(input).includes('readme')) {
            return new Response('text', {headers: {'content-type': 'text/plain'}})
          }
          return new Response('nope', {status: 403})
        },
      })

      expect(result.media).toEqual([])
      expect(result.diagnostics).toEqual([
        expect.objectContaining({code: 'retrieval-failed', url: directMedia.url}),
        expect.objectContaining({
          code: 'unsupported-media',
          url: 'https://cdn.example.com/readme.txt',
        }),
      ])
    } finally {
      await rm(directory, {recursive: true, force: true})
    }
  })

  it('retrieves usable Google Drive files using their download endpoint', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'superbloom-media-'))
    const driveMedia: MediaInventoryEntry = {
      ...directMedia,
      url: 'https://drive.google.com/file/d/file-id/view?usp=sharing',
      category: 'google-drive',
      mediaKind: undefined,
    }
    try {
      const fetches: string[] = []
      const result = await retrieveMedia({
        media: [driveMedia],
        cacheDirectory: directory,
        fetch: async (input) => {
          fetches.push(String(input))
          return new Response(png, {headers: {'content-type': 'image/png'}})
        },
      })

      expect(fetches).toEqual(['https://drive.google.com/uc?export=download&id=file-id'])
      expect(result.media).toEqual([
        expect.objectContaining({mimeType: 'image/png', dimensions: {width: 2, height: 3}}),
      ])
    } finally {
      await rm(directory, {recursive: true, force: true})
    }
  })

  it('includes retrievable files from configured Google Drive folders', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'superbloom-media-'))
    const folderUrl = 'https://drive.google.com/drive/folders/folder-identifier'
    try {
      const result = await retrieveMedia({
        media: [],
        cacheDirectory: directory,
        sourceUrls: [folderUrl],
        fetch: async (input) => {
          if (String(input) === folderUrl) {
            return new Response('<a href="/file/d/folder-file-id/view">Image</a>')
          }
          return new Response(png, {headers: {'content-type': 'image/png'}})
        },
      })

      expect(result.media).toEqual([
        expect.objectContaining({
          provenance: [expect.objectContaining({originalUrls: [folderUrl]})],
        }),
      ])
    } finally {
      await rm(directory, {recursive: true, force: true})
    }
  })

  it('retrieves exposed direct media from an asset source page', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'superbloom-media-'))
    const sourceUrl = 'https://next.frame.io/share/asset-share'
    try {
      const result = await retrieveMedia({
        media: [],
        cacheDirectory: directory,
        sourceUrls: [sourceUrl],
        fetch: async (input) => {
          if (String(input) === sourceUrl) {
            return new Response('https://cdn.frame.io/assets/image.png')
          }
          return new Response(png, {headers: {'content-type': 'image/png'}})
        },
      })

      expect(result.media).toEqual([
        expect.objectContaining({
          provenance: [expect.objectContaining({originalUrls: [sourceUrl]})],
        }),
      ])
    } finally {
      await rm(directory, {recursive: true, force: true})
    }
  })
})
