export type SourceRef = {
  lineStart: number
  lineEnd: number
  headingPath: string[]
  text: string
  url?: string
}

export type SourceOutlineEntry = {
  depth: number
  heading: string
  source: SourceRef
}

export type LinkCategory =
  | 'direct-media'
  | 'google-drive'
  | 'vimeo'
  | 'reference'

export type LinkInventoryEntry = {
  url: string
  originalUrls: string[]
  category: LinkCategory
  sourceRefs: SourceRef[]
}

export type MediaInventoryEntry = LinkInventoryEntry & {
  downloadable: boolean
  mediaKind?: 'image' | 'video' | 'file'
}

export type Diagnostic = {
  level: 'warning'
  code: 'ambiguous-link' | 'invalid-url' | 'non-media-link'
  message: string
  source: SourceRef
}

export type RetrievalDiagnostic = {
  level: 'warning'
  code: 'retrieval-failed' | 'unsupported-media' | 'invalid-drive-resource' | 'unresolved-source'
  message: string
  url: string
  sourceRefs: SourceRef[]
}

export type MediaDimensions = {
  width: number
  height: number
}

export type RetrievedMedia = {
  checksum: string
  cachePath: string
  mimeType: string
  dimensions?: MediaDimensions
  durationSeconds?: number
  provenance: MediaInventoryEntry[]
  selectedUses: string[]
  upload: {
    status: 'pending'
  }
}

export type MediaRetrievalResult = {
  media: RetrievedMedia[]
  diagnostics: RetrievalDiagnostic[]
}

export type ExtractionResult = {
  outline: SourceOutlineEntry[]
  links: LinkInventoryEntry[]
  media: MediaInventoryEntry[]
  diagnostics: Diagnostic[]
}

export type SourceMetadata = {
  checksum: string
  refreshedAt: string
  sourceUrl: string
}
