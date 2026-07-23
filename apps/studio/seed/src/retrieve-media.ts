import {createHash} from 'node:crypto'
import {mkdir, writeFile} from 'node:fs/promises'
import {extname, join} from 'node:path'
import type {
  MediaDimensions,
  MediaInventoryEntry,
  MediaRetrievalResult,
  RetrievedMedia,
  RetrievalDiagnostic,
} from './types'

const allowedMimeTypes = new Set([
  'application/pdf',
  'image/avif',
  'image/gif',
  'image/jpeg',
  'image/png',
  'image/svg+xml',
  'image/webp',
  'video/mp4',
  'video/quicktime',
  'video/webm',
])

type Fetch = typeof globalThis.fetch

export async function retrieveMedia({
  media,
  cacheDirectory,
  sourceUrls = [],
  fetch = globalThis.fetch,
}: {
  media: MediaInventoryEntry[]
  cacheDirectory: string
  sourceUrls?: string[]
  fetch?: Fetch
}): Promise<MediaRetrievalResult> {
  const diagnostics: RetrievalDiagnostic[] = []
  const candidates = [...media]

  for (const sourceUrl of sourceUrls) {
    candidates.push(...(await expandSource(sourceUrl, fetch, diagnostics)))
  }

  const retrievedByChecksum = new Map<string, RetrievedMedia>()
  await mkdir(cacheDirectory, {recursive: true})

  for (const candidate of candidates) {
    const downloadUrl = googleDriveDownloadUrl(candidate.url) ?? candidate.url
    try {
      const response = await fetch(downloadUrl)
      if (!response.ok) {
        diagnostics.push(retrievalFailure(candidate, `Received HTTP ${response.status}.`))
        continue
      }

      const bytes = new Uint8Array(await response.arrayBuffer())
      const mimeType = mimeTypeFor(response.headers.get('content-type'), candidate.url, bytes)
      if (!mimeType || !allowedMimeTypes.has(mimeType)) {
        diagnostics.push({
          level: 'warning',
          code: 'unsupported-media',
          message: 'Retrieved resource is not a supported image, video, or PDF file.',
          url: candidate.url,
          sourceRefs: candidate.sourceRefs,
        })
        continue
      }

      const checksum = createHash('sha256').update(bytes).digest('hex')
      const existing = retrievedByChecksum.get(checksum)
      if (existing) {
        existing.provenance.push(candidate)
        continue
      }

      const cachePath = join(cacheDirectory, `${checksum}${extensionFor(mimeType, candidate.url)}`)
      await writeFile(cachePath, bytes)
      retrievedByChecksum.set(checksum, {
        checksum,
        cachePath,
        mimeType,
        dimensions: imageDimensions(mimeType, bytes),
        provenance: [candidate],
        selectedUses: [],
        upload: {status: 'pending'},
      })
    } catch (error) {
      diagnostics.push(
        retrievalFailure(candidate, error instanceof Error ? error.message : 'Request failed.'),
      )
    }
  }

  return {
    media: [...retrievedByChecksum.values()].sort((left, right) =>
      left.checksum.localeCompare(right.checksum),
    ),
    diagnostics,
  }
}

async function expandSource(
  url: string,
  fetch: Fetch,
  diagnostics: RetrievalDiagnostic[],
): Promise<MediaInventoryEntry[]> {
  if (googleDriveFolderId(url)) return expandGoogleDriveFolder(url, fetch, diagnostics)
  return expandAssetPage(url, fetch, diagnostics)
}

async function expandGoogleDriveFolder(
  url: string,
  fetch: Fetch,
  diagnostics: RetrievalDiagnostic[],
): Promise<MediaInventoryEntry[]> {
  const folderId = googleDriveFolderId(url)
  if (!folderId) return []

  try {
    const response = await fetch(url)
    if (!response.ok) throw new Error(`Received HTTP ${response.status}.`)
    const html = await response.text()
    const fileIds = new Set([
      ...Array.from(html.matchAll(/\/file\/d\/([a-zA-Z0-9_-]+)/g), (match) => match[1]),
      ...Array.from(html.matchAll(/[?&]id=([a-zA-Z0-9_-]{10,})/g), (match) => match[1]),
    ])
    return [...fileIds].map((fileId) => ({
      url: `https://drive.google.com/file/d/${fileId}/view`,
      originalUrls: [url],
      category: 'google-drive',
      downloadable: true,
      sourceRefs: [],
    }))
  } catch (error) {
    diagnostics.push({
      level: 'warning',
      code: 'retrieval-failed',
      message: `Unable to enumerate Google Drive folder: ${
        error instanceof Error ? error.message : 'Request failed.'
      }`,
      url,
      sourceRefs: [],
    })
    return []
  }
}

async function expandAssetPage(
  url: string,
  fetch: Fetch,
  diagnostics: RetrievalDiagnostic[],
): Promise<MediaInventoryEntry[]> {
  try {
    const response = await fetch(url)
    if (!response.ok) throw new Error(`Received HTTP ${response.status}.`)
    const page = await response.text()
    const urls = new Set(
      Array.from(page.matchAll(/https?:\/\/[^\s"'<>]+/g), (match) => match[0]).filter(isDirectMediaUrl),
    )
    if (urls.size === 0) {
      diagnostics.push({
        level: 'warning',
        code: 'unresolved-source',
        message: 'Source page did not expose direct media links.',
        url,
        sourceRefs: [],
      })
    }
    return [...urls].map((assetUrl) => ({
      url: assetUrl,
      originalUrls: [url],
      category: 'direct-media',
      downloadable: true,
      sourceRefs: [],
    }))
  } catch (error) {
    diagnostics.push({
      level: 'warning',
      code: 'retrieval-failed',
      message: `Unable to inspect asset source: ${
        error instanceof Error ? error.message : 'Request failed.'
      }`,
      url,
      sourceRefs: [],
    })
    return []
  }
}

function retrievalFailure(candidate: MediaInventoryEntry, message: string): RetrievalDiagnostic {
  return {
    level: 'warning',
    code: 'retrieval-failed',
    message: `Unable to retrieve media: ${message}`,
    url: candidate.url,
    sourceRefs: candidate.sourceRefs,
  }
}

function googleDriveFolderId(url: string): string | undefined {
  return /drive\.google\.com\/drive\/folders\/([a-zA-Z0-9_-]+)/.exec(url)?.[1]
}

function googleDriveDownloadUrl(url: string): string | undefined {
  const fileId = /drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/.exec(url)?.[1]
  return fileId ? `https://drive.google.com/uc?export=download&id=${fileId}` : undefined
}

function mimeTypeFor(
  contentType: string | null,
  url: string,
  bytes: Uint8Array,
): string | undefined {
  const fromHeader = contentType?.split(';', 1)[0]?.toLowerCase()
  if (isPng(bytes)) return 'image/png'
  if (isGif(bytes)) return 'image/gif'
  if (isJpeg(bytes)) return 'image/jpeg'
  if (isWebp(bytes)) return 'image/webp'
  if (isPdf(bytes)) return 'application/pdf'
  if (fromHeader && fromHeader !== 'application/octet-stream') return fromHeader
  return extensionMimeType(url)
}

function extensionMimeType(url: string): string | undefined {
  switch (extname(new URL(url).pathname).toLowerCase()) {
    case '.avif':
      return 'image/avif'
    case '.gif':
      return 'image/gif'
    case '.jpg':
    case '.jpeg':
      return 'image/jpeg'
    case '.png':
      return 'image/png'
    case '.svg':
      return 'image/svg+xml'
    case '.webp':
      return 'image/webp'
    case '.mp4':
      return 'video/mp4'
    case '.mov':
      return 'video/quicktime'
    case '.webm':
      return 'video/webm'
    case '.pdf':
      return 'application/pdf'
  }
}

function extensionFor(mimeType: string, url: string): string {
  const extension = extname(new URL(url).pathname)
  if (extension) return extension.toLowerCase()
  return (
    {
      'application/pdf': '.pdf',
      'image/gif': '.gif',
      'image/jpeg': '.jpg',
      'image/png': '.png',
      'image/webp': '.webp',
      'video/mp4': '.mp4',
      'video/quicktime': '.mov',
      'video/webm': '.webm',
    }[mimeType] ?? ''
  )
}

function isDirectMediaUrl(url: string): boolean {
  return /\.(avif|gif|jpe?g|png|svg|webp|mp4|mov|m4v|webm|pdf)(?:$|\?)/i.test(url)
}

function imageDimensions(mimeType: string, bytes: Uint8Array): MediaDimensions | undefined {
  if (mimeType === 'image/png' && bytes.length >= 24) {
    return {width: readUint32(bytes, 16), height: readUint32(bytes, 20)}
  }
  if (mimeType === 'image/gif' && bytes.length >= 10) {
    return {width: readUint16LE(bytes, 6), height: readUint16LE(bytes, 8)}
  }
  if (mimeType === 'image/webp') {
    const chunk = textAt(bytes, 12, 4)
    if (bytes.length >= 30 && chunk === 'VP8X') {
      return {
        width: 1 + bytes[24] + (bytes[25] << 8) + (bytes[26] << 16),
        height: 1 + bytes[27] + (bytes[28] << 8) + (bytes[29] << 16),
      }
    }
    if (bytes.length >= 30 && chunk === 'VP8 ') {
      return {width: readUint16LE(bytes, 26) & 0x3fff, height: readUint16LE(bytes, 28) & 0x3fff}
    }
    if (bytes.length >= 25 && chunk === 'VP8L') {
      const bits = bytes[21] | (bytes[22] << 8) | (bytes[23] << 16) | (bytes[24] << 24)
      return {width: (bits & 0x3fff) + 1, height: ((bits >> 14) & 0x3fff) + 1}
    }
  }
  if (mimeType === 'image/jpeg') return jpegDimensions(bytes)
}

function jpegDimensions(bytes: Uint8Array): MediaDimensions | undefined {
  for (let offset = 2; offset + 9 < bytes.length; ) {
    if (bytes[offset] !== 0xff) return undefined
    const marker = bytes[offset + 1]
    const length = readUint16(bytes, offset + 2)
    if (marker >= 0xc0 && marker <= 0xc3) {
      return {width: readUint16(bytes, offset + 7), height: readUint16(bytes, offset + 5)}
    }
    offset += length + 2
  }
}

function isPng(bytes: Uint8Array): boolean {
  return textAt(bytes, 1, 3) === 'PNG'
}

function isGif(bytes: Uint8Array): boolean {
  return textAt(bytes, 0, 3) === 'GIF'
}

function isJpeg(bytes: Uint8Array): boolean {
  return bytes[0] === 0xff && bytes[1] === 0xd8
}

function isWebp(bytes: Uint8Array): boolean {
  return textAt(bytes, 0, 4) === 'RIFF' && textAt(bytes, 8, 4) === 'WEBP'
}

function isPdf(bytes: Uint8Array): boolean {
  return textAt(bytes, 0, 5) === '%PDF-'
}

function textAt(bytes: Uint8Array, offset: number, length: number): string {
  return String.fromCharCode(...bytes.slice(offset, offset + length))
}

function readUint16(bytes: Uint8Array, offset: number): number {
  return (bytes[offset] << 8) | bytes[offset + 1]
}

function readUint16LE(bytes: Uint8Array, offset: number): number {
  return bytes[offset] | (bytes[offset + 1] << 8)
}

function readUint32(bytes: Uint8Array, offset: number): number {
  return new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength).getUint32(offset)
}
