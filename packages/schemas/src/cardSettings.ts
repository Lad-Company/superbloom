import {defineField} from 'sanity'

/**
 * Canonical card configuration settings shared across all content types.
 * These settings control Content Card presentation (linked editorial/content cards on browse pages).
 */

export type CardWidth = '1/4' | '1/3' | '1/2' | '2/3' | '3/4' | 'full'
export type MediaAspectRatio = 'intrinsic' | '1:1' | '4:5' | '9:16' | '3:2' | '16:9' | '2:1'
export type InfoPosition = 'below' | 'left' | 'right'

export const CARD_WIDTHS: CardWidth[] = ['1/4', '1/3', '1/2', '2/3', '3/4', 'full']
export const MEDIA_ASPECT_RATIOS: MediaAspectRatio[] = ['intrinsic', '1:1', '4:5', '9:16', '3:2', '16:9', '2:1']
export const INFO_POSITIONS: InfoPosition[] = ['below', 'left', 'right']

export const DEFAULTS = {
  cardWidth: '1/2' as CardWidth,
  mediaAspectRatio: '16:9' as MediaAspectRatio,
  infoPosition: 'below' as InfoPosition,
}

/**
 * Validator: left/right info positions require card width >= 1/2
 */
export const validateInfoPositionWithWidth = (
  context: {parent?: {infoPosition?: string; cardWidth?: string}},
): string | boolean => {
  const {infoPosition, cardWidth} = context.parent || {}

  if (infoPosition === 'left' || infoPosition === 'right') {
    // Require width >= 1/2: full, 2/3, 3/4 qualify; 1/4, 1/3 don't
    const narrowWidths = ['1/4', '1/3']
    if (narrowWidths.includes(cardWidth as string)) {
      return `Info position "${infoPosition}" requires card width of 1/2 or greater`
    }
  }

  return true
}

/**
 * Define a cardWidth field for content type defaults or list/item overrides.
 */
export const cardWidthField = (options?: {hidden?: boolean; partial?: boolean; required?: boolean}) =>
  defineField({
    name: 'cardWidth',
    title: 'Card Width',
    type: 'string',
    options: {list: CARD_WIDTHS, layout: 'radio' as const},
    initialValue: options?.partial ? undefined : DEFAULTS.cardWidth,
    hidden: options?.hidden,
    validation: options?.required ? (rule) => rule.required() : undefined,
  })

/**
 * Define a mediaAspectRatio field for content type defaults or list/item overrides.
 */
export const mediaAspectRatioField = (options?: {hidden?: boolean; partial?: boolean; required?: boolean}) =>
  defineField({
    name: 'mediaAspectRatio',
    title: 'Media Aspect Ratio',
    type: 'string',
    options: {list: MEDIA_ASPECT_RATIOS, layout: 'radio' as const},
    initialValue: options?.partial ? undefined : DEFAULTS.mediaAspectRatio,
    hidden: options?.hidden,
    validation: options?.required ? (rule) => rule.required() : undefined,
  })

/**
 * Define an infoPosition field for content type defaults or list/item overrides.
 */
export const infoPositionField = (options?: {hidden?: boolean; partial?: boolean; required?: boolean}) =>
  defineField({
    name: 'infoPosition',
    title: 'Info Position',
    type: 'string',
    options: {list: INFO_POSITIONS, layout: 'radio' as const},
    initialValue: options?.partial ? undefined : DEFAULTS.infoPosition,
    hidden: options?.hidden,
    validation: options?.required ? (rule) => rule.required() : undefined,
  })

/**
 * Define all three card settings fields as a group (content default).
 */
export const cardSettingsFieldGroup = (options?: {title?: string; collapsed?: boolean}) => [
  defineField({
    name: 'cardDefaults',
    title: options?.title || 'Card Settings Defaults',
    type: 'object',
    collapsed: options?.collapsed ?? false,
    fields: [
      cardWidthField({required: true}),
      mediaAspectRatioField({required: true}),
      infoPositionField({hidden: false, required: true}),
    ],
    validation: (rule) =>
      rule.custom((value, context) => {
        if (!value) return true
        // Validate info position with card width at object level
        return validateInfoPositionWithWidth({parent: {
          infoPosition: (value as Record<string, unknown>)?.infoPosition as string,
          cardWidth: (value as Record<string, unknown>)?.cardWidth as string,
        }})
      }),
  }),
]
