export function blockId(eyebrow: string): string {
  return eyebrow
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');
}
