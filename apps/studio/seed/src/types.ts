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

export type StarterTarget = {
  id: string
  documentType:
    | 'homepage'
    | 'workIndex'
    | 'whoWeAre'
    | 'indexPage'
    | 'article'
    | 'caseStudy'
    | 'zineIssue'
  figmaUrl: string
}

export type StarterCoverage = {
  targets: StarterTarget[]
}

export type ManifestProvenance = {
  kind: 'source' | 'derived' | 'inferred'
  sources: SourceRef[]
  rationale?: string
}

export type ManifestField = {
  value: unknown
  provenance: ManifestProvenance
}

export type StarterCandidate = {
  targetId: string
  documentType: StarterTarget['documentType']
  fields: Record<string, ManifestField>
}

export type StarterMediaUse = {
  checksum: string
  targetId: string
  field: string
  provenance: ManifestProvenance
}

export type StarterManifestInputs = {
  googleDoc: {
    url: string
    checksum: string
  }
  trackerExport: {
    path: string
    checksum: string
  }
  frameIo: string
  googleDrive?: string
}

export type StarterManifest = {
  schemaVersion: 1
  generatedAt: string
  sourceChecksum: string
  inputs: StarterManifestInputs
  coverage: StarterCoverage
  candidates: StarterCandidate[]
  media: StarterMediaUse[]
}

export type GenerationDiagnostic = {
  level: 'warning' | 'error'
  code: 'invalid-llm-output' | 'generation-failed'
  message: string
  generatedAt: string
  sourceChecksum: string
}

export type GenerationDiagnostics = {
  generatedAt: string
  sourceChecksum: string
  diagnostics: GenerationDiagnostic[]
}
