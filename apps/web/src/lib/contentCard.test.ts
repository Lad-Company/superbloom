import {describe, expect, it} from 'vitest';
import {
  cardImageSizes,
  CONTENT_CARD_DEFAULTS,
  type ContentCardSettings,
  resolveContentCardSettings,
} from './contentCard';

describe('resolveContentCardSettings', () => {
  it('uses the canonical defaults when no level defines a setting', () => {
    expect(resolveContentCardSettings()).toEqual(CONTENT_CARD_DEFAULTS);
  });

  it('resolves each setting independently through the inheritance chain', () => {
    expect(
      resolveContentCardSettings({
        global: {cardWidth: '1/3', mediaAspectRatio: '4:5', infoPosition: 'below'},
        content: {cardWidth: '1/2', mediaAspectRatio: '1:1'},
        list: {mediaAspectRatio: '3:2', infoPosition: 'right'},
        item: {cardWidth: '3/4'},
      }),
    ).toEqual({
      cardWidth: '3/4',
      mediaAspectRatio: '3:2',
      infoPosition: 'right',
    });
  });

  it('falls back to below when lateral Info is paired with a narrow card', () => {
    expect(
      resolveContentCardSettings({
        item: {cardWidth: '1/3', infoPosition: 'left'},
      }),
    ).toEqual({
      cardWidth: '1/3',
      mediaAspectRatio: '16:9',
      infoPosition: 'below',
    });
  });
});

describe('cardImageSizes', () => {
  const settingsAt = (overrides: Partial<ContentCardSettings>): ContentCardSettings => ({
    ...CONTENT_CARD_DEFAULTS,
    ...overrides,
  });

  it('reports full viewport width below the 1024px breakpoint and card width above', () => {
    expect(cardImageSizes(settingsAt({cardWidth: '1/3'}))).toBe(
      '(max-width: 1023.98px) 100vw, 33vw',
    );
    expect(cardImageSizes(settingsAt({cardWidth: '1/2'}))).toBe(
      '(max-width: 1023.98px) 100vw, 50vw',
    );
    expect(cardImageSizes(settingsAt({cardWidth: 'full'}))).toBe(
      '(max-width: 1023.98px) 100vw, 100vw',
    );
  });

  it('halves the picture width when info sits beside the picture', () => {
    expect(cardImageSizes(settingsAt({cardWidth: '1/2', infoPosition: 'right'}))).toBe(
      '(max-width: 1023.98px) 100vw, 25vw',
    );
    expect(cardImageSizes(settingsAt({cardWidth: '1/2', infoPosition: 'left'}))).toBe(
      '(max-width: 1023.98px) 100vw, 25vw',
    );
  });
});
