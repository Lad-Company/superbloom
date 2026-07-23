import type {
  Diagnostic,
  ExtractionResult,
  LinkCategory,
  LinkInventoryEntry,
  MediaInventoryEntry,
  SourceOutlineEntry,
  SourceRef,
} from './types'

const markdownLinkPattern = /\[([^\]]*)\]\(((?:[^()\s]|\([^()]*\))+)(?:\s+["'][^"']*["'])?\)/g
const directMediaPattern = /\.(avif|gif|jpe?g|png|svg|webp|mp4|mov|m4v|webm|pdf)(?:$|\?)/i
const imagePattern = /\.(avif|gif|jpe?g|png|svg|webp)(?:$|\?)/i
const videoPattern = /\.(mp4|mov|m4v|webm)(?:$|\?)/i

type Heading = {
  depth: number
  text: string
  line: number
}

export function extractTracker(markdown: string): ExtractionResult {
  const lines = markdown.split(/\r?\n/)
  const headings: Heading[] = []
  const outline: SourceOutlineEntry[] = []
  const linkMap = new Map<string, LinkInventoryEntry>()
  const diagnostics: Diagnostic[] = []

  for (const [index, line] of lines.entries()) {
    const heading = /^(#{1,6})\s+(.+?)\s*$/.exec(line)
    if (!heading) continue

    const entry: Heading = {
      depth: heading[1].length,
      text: heading[2],
      line: index + 1,
    }
    headings.push(entry)
    outline.push({
      depth: entry.depth,
      heading: entry.text,
      source: {
        lineStart: entry.line,
        lineEnd: sectionEndLine(headings, entry, lines.length),
        headingPath: headingPath(headings),
        text: line,
      },
    })
  }

  for (const [index, line] of lines.entries()) {
    markdownLinkPattern.lastIndex = 0
    for (const match of line.matchAll(markdownLinkPattern)) {
      const originalUrl = match[2]
      const source = sourceRef(headings, index, line, originalUrl)
      const canonicalUrl = canonicalizeUrl(originalUrl)

      if (!canonicalUrl) {
        diagnostics.push({
          level: 'warning',
          code: 'invalid-url',
          message: `Unable to parse linked URL: ${originalUrl}`,
          source,
        })
        continue
      }

      const category = classifyLink(canonicalUrl)
      const existing = linkMap.get(canonicalUrl)
      if (existing) {
        if (!existing.originalUrls.includes(originalUrl)) existing.originalUrls.push(originalUrl)
        existing.sourceRefs.push(source)
      } else {
        linkMap.set(canonicalUrl, {
          url: canonicalUrl,
          originalUrls: [originalUrl],
          category,
          sourceRefs: [source],
        })
      }

      if (category === 'google-drive' || category === 'vimeo') {
        diagnostics.push({
          level: 'warning',
          code: 'ambiguous-link',
          message: `${category === 'google-drive' ? 'Google Drive' : 'Vimeo'} resource requires retrieval to determine usable media.`,
          source,
        })
      } else if (category === 'reference') {
        diagnostics.push({
          level: 'warning',
          code: 'non-media-link',
          message: 'Linked resource is not a direct media candidate.',
          source,
        })
      }
    }
  }

  const links = [...linkMap.values()].sort((left, right) => left.url.localeCompare(right.url))
  const media = links
    .filter((link) => ['direct-media', 'google-drive', 'vimeo'].includes(link.category))
    .map(toMediaInventoryEntry)

  return {outline, links, media, diagnostics}
}

export function classifyLink(url: string): LinkCategory {
  if (directMediaPattern.test(url)) return 'direct-media'
  const hostname = new URL(url).hostname.toLowerCase()
  if (hostname === 'drive.google.com' || hostname.endsWith('.drive.google.com')) return 'google-drive'
  if (hostname === 'vimeo.com' || hostname.endsWith('.vimeo.com')) return 'vimeo'
  return 'reference'
}

function headingPath(headings: Heading[]): string[] {
  const current = headings.at(-1)
  if (!current) return []
  return headings
    .filter((heading, index) => {
      if (index === headings.length - 1) return true
      return !headings.slice(index + 1).some((later) => later.depth <= heading.depth)
    })
    .map((heading) => heading.text)
}

function sourceRef(
  headings: Heading[],
  index: number,
  text: string,
  url: string,
): SourceRef {
  const activeHeadings = headings.filter((heading) => heading.line <= index + 1)
  return {
    lineStart: index + 1,
    lineEnd: index + 1,
    headingPath: headingPath(activeHeadings),
    text,
    url,
  }
}

function sectionEndLine(headings: Heading[], heading: Heading, totalLines: number): number {
  const nextSection = headings.find(
    (candidate) => candidate.line > heading.line && candidate.depth <= heading.depth,
  )
  return nextSection ? nextSection.line - 1 : totalLines
}

function canonicalizeUrl(value: string): string | undefined {
  try {
    const url = new URL(value)
    if (!['http:', 'https:'].includes(url.protocol)) return undefined
    url.hash = ''
    return url.toString()
  } catch {
    return undefined
  }
}

function toMediaInventoryEntry(link: LinkInventoryEntry): MediaInventoryEntry {
  return {
    ...link,
    downloadable: link.category !== 'vimeo',
    mediaKind: mediaKind(link.url),
  }
}

function mediaKind(url: string): MediaInventoryEntry['mediaKind'] {
  if (imagePattern.test(url)) return 'image'
  if (videoPattern.test(url) || url.includes('vimeo.com')) return 'video'
  if (url.toLowerCase().includes('.pdf')) return 'file'
  return undefined
}
