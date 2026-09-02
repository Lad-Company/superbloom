/**
 * Work index All-section ordering.
 *
 * The Work Index singleton's `allSection.itemOverrides` list is the manual
 * order for the All section on /work: editors drag it in the Studio to
 * reorder Case Studies. Overridden items lead in list order; every Case
 * Study without an override keeps the query's date-sorted (newest-first)
 * order behind them. Overrides pointing at featured or otherwise absent Case
 * Studies are skipped.
 */

export interface ItemOverrideLike {
  itemId?: string | null
}

export function orderCaseStudiesByOverrides<T extends {_id: string}>(
  caseStudies: readonly T[],
  itemOverrides: readonly (ItemOverrideLike | null)[] | null | undefined,
): T[] {
  if (!itemOverrides || itemOverrides.length === 0) return [...caseStudies]

  const byId = new Map(caseStudies.map((cs) => [cs._id, cs]))
  const pinned: T[] = []
  const pinnedIds = new Set<string>()

  for (const override of itemOverrides) {
    const id = override?.itemId
    if (!id || pinnedIds.has(id)) continue
    const item = byId.get(id)
    if (item) {
      pinned.push(item)
      pinnedIds.add(id)
    }
  }

  return [...pinned, ...caseStudies.filter((cs) => !pinnedIds.has(cs._id))]
}
