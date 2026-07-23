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
  code: 'ambiguous-link' | 'invalid-url'
  message: string
  source: SourceRef
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
