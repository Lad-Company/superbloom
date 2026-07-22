import {type CardWidth, type InfoPosition, validateInfoPositionWithWidth} from './cardSettings'
import type {ValidationContext} from 'sanity'

/**
 * Contract validators for card settings inheritance and constraints.
 */

export const validateCardSettingsInfoPosition = (
  context: {parent?: {infoPosition?: string; cardWidth?: string}},
): string | boolean => validateInfoPositionWithWidth(context)

/**
 * Validate that featured card entries fully configure all three card settings.
 * Per spec: "Every Featured card must fully configure all three settings (ratio, width, Info position) explicitly."
 */
export const validateFeaturedCardFullyConfigured = (
  card: unknown,
): string | boolean => {
  if (!card || typeof card !== 'object') return true

  const c = card as Record<string, unknown>
  const hasCardWidth = c.cardWidth !== undefined && c.cardWidth !== null
  const hasMediaAspectRatio = c.mediaAspectRatio !== undefined && c.mediaAspectRatio !== null
  const hasInfoPosition = c.infoPosition !== undefined && c.infoPosition !== null

  if (!hasCardWidth || !hasMediaAspectRatio || !hasInfoPosition) {
    return 'Featured cards must fully configure card width, media aspect ratio, and info position'
  }

  return validateInfoPositionWithWidth({
    parent: {
      cardWidth: c.cardWidth as CardWidth,
      infoPosition: c.infoPosition as InfoPosition,
    },
  })
}

/**
 * Validate content default settings object completeness.
 * Content defaults should define all three settings or none (relying on global defaults).
 */
export const validateContentDefaultsCompleteness = (
  defaults: unknown,
): string | boolean => {
  if (!defaults) return true

  if (typeof defaults !== 'object') return 'Card defaults must be an object'

  const d = defaults as Record<string, unknown>
  const hasCardWidth = d.cardWidth !== undefined && d.cardWidth !== null
  const hasMediaAspectRatio = d.mediaAspectRatio !== undefined && d.mediaAspectRatio !== null
  const hasInfoPosition = d.infoPosition !== undefined && d.infoPosition !== null

  // All defined or none defined; partial configs cause confusion
  const allDefined = hasCardWidth && hasMediaAspectRatio && hasInfoPosition
  const noneDefined = !hasCardWidth && !hasMediaAspectRatio && !hasInfoPosition

  if (!allDefined && !noneDefined) {
    return 'Card defaults must define all three settings (width, ratio, info position) or use global defaults (define none)'
  }

  return validateInfoPositionWithWidth({
    parent: {
      cardWidth: d.cardWidth as CardWidth,
      infoPosition: d.infoPosition as InfoPosition,
    },
  })
}

type CardSettings = {cardWidth?: CardWidth; infoPosition?: InfoPosition}

export const validateResolvedCardSettings = (
  item?: CardSettings,
  list?: CardSettings,
  content?: CardSettings,
  global?: CardSettings,
): string | boolean => {
  const levels = [item, list, content, global]
  const cardWidth = levels.find((level) => level?.cardWidth)?.cardWidth
  const infoPosition = levels.find((level) => level?.infoPosition)?.infoPosition
  return validateInfoPositionWithWidth({
    parent: {cardWidth, infoPosition},
  })
}

export const validateResolvedCardOverride = async (
  override: unknown,
  context: ValidationContext,
): Promise<string | boolean> => {
  if (!override || typeof override !== 'object') return true
  const item = override as CardSettings & {
    article?: {_ref?: string}
    caseStudy?: {_ref?: string}
  }
  const referenceId = item.article?._ref ?? item.caseStudy?._ref
  if (!referenceId) return true

  const document = context.document as Record<string, unknown>
  const list =
    document._type === 'homepage'
      ? (document.news as {listDefaults?: CardSettings})?.listDefaults
      : document._type === 'zineIssue'
        ? document.listDefaults as CardSettings | undefined
        : (document.allSection as {listDefaults?: CardSettings})?.listDefaults
  const client = context.getClient({apiVersion: '2026-06-01'})
  const result = await client.fetch<{
    content?: CardSettings
    global?: CardSettings
  }>(
    `{
      "content": *[_id == $referenceId][0]{cardWidth, infoPosition},
      "global": *[_type == "siteSettings"][0].cardDefaults
    }`,
    {referenceId},
  )

  return validateResolvedCardSettings(item, list, result.content, result.global)
}

/**
 * Validate two-block Content Layout Row widths total full width.
 * Spec: "When a row has two blocks, their combined widths must total full."
 */
export const validateTwoBlockRowWidths = (
  blocks: unknown,
): string | boolean => {
  if (!Array.isArray(blocks) || blocks.length !== 2) return true

  const b = blocks as Array<Record<string, unknown>>
  const widths = b.map((block) => block.width as string).filter(Boolean)

  if (widths.length !== 2) return true // both blocks must have explicit widths

  const width1 = widths[0]
  const width2 = widths[1]

  const widthPairs: Array<[string, string]> = [
    ['1/4', '3/4'],
    ['1/3', '2/3'],
    ['1/2', '1/2'],
    ['2/3', '1/3'],
    ['3/4', '1/4'],
  ]

  const isValid = widthPairs.some(
    ([w1, w2]) => (width1 === w1 && width2 === w2) || (width1 === w2 && width2 === w1),
  )

  return isValid || 'Two-block row widths must total full width (e.g., 1/3 + 2/3, 1/2 + 1/2)'
}
