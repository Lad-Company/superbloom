import {describe, expect, it} from 'vitest';
import {CONTENT_CARD_DEFAULTS, resolveContentCardSettings} from './contentCard';

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
