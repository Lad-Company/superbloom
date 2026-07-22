import {describe, expect, it} from 'vitest'
import {
  validateCardSettingsInfoPosition,
  validateFeaturedCardFullyConfigured,
  validateContentDefaultsCompleteness,
  validateTwoBlockRowWidths,
  validateResolvedCardSettings,
} from './cardSettingsContract'

describe('Card Settings Contract Validators', () => {
  describe('validateCardSettingsInfoPosition', () => {
    it('allows below info position with any card width', () => {
      expect(
        validateCardSettingsInfoPosition({parent: {infoPosition: 'below', cardWidth: '1/4'}}),
      ).toBe(true)
      expect(
        validateCardSettingsInfoPosition({parent: {infoPosition: 'below', cardWidth: 'full'}}),
      ).toBe(true)
    })

    it('allows left/right info position with width >= 1/2', () => {
      expect(
        validateCardSettingsInfoPosition({parent: {infoPosition: 'left', cardWidth: '1/2'}}),
      ).toBe(true)
      expect(
        validateCardSettingsInfoPosition({parent: {infoPosition: 'right', cardWidth: '2/3'}}),
      ).toBe(true)
      expect(
        validateCardSettingsInfoPosition({parent: {infoPosition: 'left', cardWidth: 'full'}}),
      ).toBe(true)
    })

    it('rejects left/right info position with width < 1/2', () => {
      expect(
        validateCardSettingsInfoPosition({parent: {infoPosition: 'left', cardWidth: '1/4'}}),
      ).toContain('requires card width')
      expect(
        validateCardSettingsInfoPosition({parent: {infoPosition: 'right', cardWidth: '1/3'}}),
      ).toContain('requires card width')
    })
  })

  describe('validateFeaturedCardFullyConfigured', () => {
    it('allows cards with all three settings', () => {
      expect(
        validateFeaturedCardFullyConfigured({
          cardWidth: '1/2',
          mediaAspectRatio: '16:9',
          infoPosition: 'below',
        }),
      ).toBe(true)
    })

    it('rejects lateral Info on a narrow Featured card', () => {
      expect(
        validateFeaturedCardFullyConfigured({
          cardWidth: '1/3',
          mediaAspectRatio: '16:9',
          infoPosition: 'left',
        }),
      ).toContain('requires card width')
    })

    it('rejects cards missing cardWidth', () => {
      expect(
        validateFeaturedCardFullyConfigured({
          mediaAspectRatio: '16:9',
          infoPosition: 'below',
        }),
      ).toContain('fully configure')
    })

    it('rejects cards missing mediaAspectRatio', () => {
      expect(
        validateFeaturedCardFullyConfigured({
          cardWidth: '1/2',
          infoPosition: 'below',
        }),
      ).toContain('fully configure')
    })

    it('rejects cards missing infoPosition', () => {
      expect(
        validateFeaturedCardFullyConfigured({
          cardWidth: '1/2',
          mediaAspectRatio: '16:9',
        }),
      ).toContain('fully configure')
    })

    it('allows non-object input', () => {
      expect(validateFeaturedCardFullyConfigured(null)).toBe(true)
      expect(validateFeaturedCardFullyConfigured(undefined)).toBe(true)
    })
  })

  describe('validateResolvedCardSettings', () => {
    it('validates partial overrides after inheritance', () => {
      expect(
        validateResolvedCardSettings(
          {infoPosition: 'left'},
          {cardWidth: '1/2', infoPosition: 'below'},
        ),
      ).toBe(true)
      expect(
        validateResolvedCardSettings(
          {infoPosition: 'left'},
          {cardWidth: '1/4', infoPosition: 'below'},
        ),
      ).toContain('requires card width')
    })
  })

  describe('validateContentDefaultsCompleteness', () => {
    it('allows empty or undefined defaults', () => {
      expect(validateContentDefaultsCompleteness(undefined)).toBe(true)
      expect(validateContentDefaultsCompleteness(null)).toBe(true)
      expect(validateContentDefaultsCompleteness({})).toBe(true)
    })

    it('allows all three settings defined', () => {
      expect(
        validateContentDefaultsCompleteness({
          cardWidth: '1/2',
          mediaAspectRatio: '16:9',
          infoPosition: 'below',
        }),
      ).toBe(true)
    })

    it('rejects partial settings (only 1 or 2 defined)', () => {
      expect(
        validateContentDefaultsCompleteness({
          cardWidth: '1/2',
        }),
      ).toContain('all three')

      expect(
        validateContentDefaultsCompleteness({
          cardWidth: '1/2',
          mediaAspectRatio: '16:9',
        }),
      ).toContain('all three')
    })

    it('rejects non-object input', () => {
      expect(validateContentDefaultsCompleteness('string')).toContain('must be an object')
    })
  })

  describe('validateTwoBlockRowWidths', () => {
    it('allows valid width pairs totaling full', () => {
      expect(
        validateTwoBlockRowWidths([
          {width: '1/3'},
          {width: '2/3'},
        ]),
      ).toBe(true)

      expect(
        validateTwoBlockRowWidths([
          {width: '1/2'},
          {width: '1/2'},
        ]),
      ).toBe(true)

      expect(
        validateTwoBlockRowWidths([
          {width: '3/4'},
          {width: '1/4'},
        ]),
      ).toBe(true)
    })

    it('allows valid pairs in either order', () => {
      expect(
        validateTwoBlockRowWidths([
          {width: '2/3'},
          {width: '1/3'},
        ]),
      ).toBe(true)

      expect(
        validateTwoBlockRowWidths([
          {width: '1/4'},
          {width: '3/4'},
        ]),
      ).toBe(true)
    })

    it('rejects invalid width pairs', () => {
      expect(
        validateTwoBlockRowWidths([
          {width: '1/3'},
          {width: '1/3'},
        ]),
      ).toContain('must total full width')

      expect(
        validateTwoBlockRowWidths([
          {width: '1/4'},
          {width: '1/2'},
        ]),
      ).toContain('must total full width')
    })

    it('ignores non-two-block rows', () => {
      expect(validateTwoBlockRowWidths([{width: 'full'}])).toBe(true)
      expect(validateTwoBlockRowWidths([])).toBe(true)
    })
  })
})
