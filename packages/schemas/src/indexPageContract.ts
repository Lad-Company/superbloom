type Reference = {_ref?: unknown}

function referenceIds(items: unknown): string[] {
  if (!Array.isArray(items)) return []

  return items.flatMap((item) =>
    item && typeof item === 'object' && typeof (item as Reference)._ref === 'string'
      ? [(item as Reference)._ref]
      : [],
  )
}

export function validateIndexPageSecondary(
  secondary: unknown,
  context: {document?: {lead?: Reference}},
): string | boolean {
  const ids = referenceIds(secondary)

  if (!Array.isArray(secondary) || secondary.length !== 3) {
    return 'Secondary featured items must contain exactly three references'
  }

  if (ids.length !== secondary.length) {
    return 'All secondary featured items must be selected references'
  }

  if (new Set(ids).size !== ids.length) {
    return 'Secondary featured items must be unique'
  }

  if (context.document?.lead?._ref && ids.includes(context.document.lead._ref)) {
    return 'Secondary featured items cannot include the lead item'
  }

  return true
}
