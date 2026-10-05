/**
 * Build-time word split for the hero heading's entry reveal (design-system
 * §5, Type Reveal). The heading is tokenised once at render so every word
 * wrapper exists in the SSR HTML and paints on the first frame; the CSS
 * reveal then only *moves* those nodes. Nothing may create, hide, or replace
 * heading content after paint — that is what made the LCP element
 * nondeterministic (ARCHITECTURE.md ADR-0040).
 *
 * Whitespace runs are returned as their own tokens so the template can emit
 * them as real text nodes between the inline-block word wrappers: without
 * them the browser has no break opportunities and assistive tech can read
 * the words run together.
 */
export type HeroWordToken = {kind: 'word'; text: string; index: number} | {kind: 'space'; text: string}

export const splitHeroWords = (heading: string): HeroWordToken[] => {
  const tokens: HeroWordToken[] = []
  let index = 0
  for (const part of heading.split(/(\s+)/)) {
    if (part === '') continue
    if (/^\s+$/.test(part)) {
      tokens.push({kind: 'space', text: part})
    } else {
      tokens.push({kind: 'word', text: part, index: index++})
    }
  }
  return tokens
}
