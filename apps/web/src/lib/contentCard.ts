export const CARD_WIDTHS = ['1/4', '1/3', '1/2', '2/3', '3/4', 'full'] as const;
export const MEDIA_ASPECT_RATIOS = ['intrinsic', '1:1', '4:5', '9:16', '3:2', '16:9', '2:1'] as const;
export const INFO_POSITIONS = ['below', 'left', 'right'] as const;

export type CardWidth = (typeof CARD_WIDTHS)[number];
export type MediaAspectRatio = (typeof MEDIA_ASPECT_RATIOS)[number];
export type InfoPosition = (typeof INFO_POSITIONS)[number];

export interface ContentCardSettings {
  cardWidth: CardWidth;
  mediaAspectRatio: MediaAspectRatio;
  infoPosition: InfoPosition;
}

export interface ContentCardSettingsInput {
  cardWidth?: CardWidth | null;
  mediaAspectRatio?: MediaAspectRatio | null;
  infoPosition?: InfoPosition | null;
}

export type PartialContentCardSettings = ContentCardSettingsInput | null | undefined;

export const CONTENT_CARD_DEFAULTS: ContentCardSettings = {
  cardWidth: '1/2',
  mediaAspectRatio: '16:9',
  infoPosition: 'below',
};

interface SettingsHierarchy {
  global?: PartialContentCardSettings;
  content?: PartialContentCardSettings;
  list?: PartialContentCardSettings;
  item?: PartialContentCardSettings;
}

const narrowWidths = new Set<CardWidth>(['1/4', '1/3']);

export const resolveContentCardSettings = ({
  global,
  content,
  list,
  item,
}: SettingsHierarchy = {}): ContentCardSettings => {
  const levels = [item, list, content, global, CONTENT_CARD_DEFAULTS];
  const resolved: ContentCardSettings = {
    cardWidth: levels.find((level) => level?.cardWidth != null)!.cardWidth!,
    mediaAspectRatio: levels.find((level) => level?.mediaAspectRatio != null)!.mediaAspectRatio!,
    infoPosition: levels.find((level) => level?.infoPosition != null)!.infoPosition!,
  };

  if (narrowWidths.has(resolved.cardWidth) && resolved.infoPosition !== 'below') {
    return {...resolved, infoPosition: 'below'};
  }

  return resolved;
};

const CARD_WIDTH_FRACTIONS: Record<CardWidth, number> = {
  '1/4': 1 / 4,
  '1/3': 1 / 3,
  '1/2': 1 / 2,
  '2/3': 2 / 3,
  '3/4': 3 / 4,
  full: 1,
};

/**
 * Builds the `sizes` attribute for a card's MediaFrame. Below the 1024px
 * breakpoint every card collapses to a single column, so the picture always
 * renders full width there. On wider viewports the picture shares the card
 * with the info block when info is positioned left/right, halving the picture
 * width relative to the card.
 */
export const cardImageSizes = (settings: ContentCardSettings): string => {
  const cardFraction = CARD_WIDTH_FRACTIONS[settings.cardWidth];
  const infoSharesRow = settings.infoPosition === 'left' || settings.infoPosition === 'right';
  const pictureFraction = infoSharesRow ? cardFraction / 2 : cardFraction;
  const viewportPercentage = Math.max(1, Math.round(pictureFraction * 100));
  return `(max-width: 1023.98px) 100vw, ${viewportPercentage}vw`;
};
