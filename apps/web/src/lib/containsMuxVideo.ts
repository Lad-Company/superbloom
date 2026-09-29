/**
 * Walks a fetched query result looking for a usable Mux video asset
 * (`_type: 'mux.video'` with a playbackId). Pages pass the outcome to
 * Layout's `hasVideo` so the Mux preconnects ship only where video renders.
 * A deep scan (rather than per-page field knowledge) keeps the answer right
 * when editors add video to a new block — the worst case is a page with no
 * video skipping a preconnect it didn't need.
 */
export const containsMuxVideo = (value: unknown, depth = 0): boolean => {
  // Depth guard: query results are shallow content trees, but a pathological
  // reference cycle would otherwise recurse forever.
  if (depth > 40 || value === null || typeof value !== 'object') return false
  if (Array.isArray(value)) return value.some((item) => containsMuxVideo(item, depth + 1))
  const record = value as Record<string, unknown>
  if (record._type === 'mux.video' && typeof record.playbackId === 'string' && record.playbackId) {
    return true
  }
  return Object.values(record).some((item) => containsMuxVideo(item, depth + 1))
}
