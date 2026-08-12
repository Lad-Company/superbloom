/**
 * Card Poster Reveal wiring (docs/card-poster-reveal-spec.md §4).
 *
 * A card whose mediaBox pairs a Poster Image with a video renders a Gated
 * `media-frame` (see MediaFrame.astro). The whole card is one link, so the
 * interaction wiring lives on the link and drives a `revealed` attribute on
 * the frame — the same attribute-toggle pattern Capes uses for `active`.
 *
 * - Desktop hover: pointerenter reveals, pointerleave conceals.
 * - Keyboard: focusin/focusout reveal/conceal, gated on `:focus-visible` so a
 *   touch tap's incidental focus never pre-reveals the card (that would
 *   break the two-tap contract).
 * - Touch: first tap reveals (click is preventDefaulted) and counts as
 *   explicit play intent via the frame's `revealWithIntent()`; second tap
 *   navigates. A pointerdown anywhere outside the card conceals.
 * - Scroll-away pauses via the frame's existing visibility gate; the poster
 *   stays revealed (no re-cover churn while scrolling).
 *
 * Bound once per card from `astro:page-load` (Marquee pattern) so wiring
 * survives ClientRouter navigations; the dataset guard dedupes repeat runs
 * and multiple callers (EditorialCard, HomeWork).
 */

type MediaFrameEl = HTMLElement & {revealWithIntent?: () => void}

const BOUND_KEY = 'posterRevealBound'

/** Cards currently revealed by a touch tap, for the outside-tap conceal. */
const touchRevealedCards = new Set<HTMLAnchorElement>()
let documentConcealBound = false

function bindDocumentConceal() {
  if (documentConcealBound) return
  documentConcealBound = true
  document.addEventListener('pointerdown', (event) => {
    if (event.pointerType !== 'touch') return
    for (const card of touchRevealedCards) {
      if (!card.isConnected || card.contains(event.target as Node)) continue
      card.querySelector('media-frame')?.removeAttribute('revealed')
      touchRevealedCards.delete(card)
    }
  })
}

function bindCard(card: HTMLAnchorElement) {
  const frame = card.querySelector<MediaFrameEl>('media-frame[gated]')
  if (!frame || card.dataset[BOUND_KEY]) return
  card.dataset[BOUND_KEY] = 'true'
  bindDocumentConceal()

  const reveal = () => frame.setAttribute('revealed', '')
  const conceal = () => {
    frame.removeAttribute('revealed')
    touchRevealedCards.delete(card)
  }
  const isRevealed = () => frame.hasAttribute('revealed')

  // The tap's pointerdown lands before focusin/click, so the focus and click
  // handlers can tell a touch tap from keyboard/mouse interaction.
  let lastPointerType: string | null = null
  card.addEventListener('pointerdown', (event) => {
    lastPointerType = event.pointerType
  })

  // Desktop hover. Touch fires pointerenter/pointerleave around every tap —
  // those are ignored so the tap path below owns touch reveal.
  card.addEventListener('pointerenter', (event) => {
    if (event.pointerType === 'touch') return
    reveal()
  })
  card.addEventListener('pointerleave', (event) => {
    if (event.pointerType === 'touch') return
    conceal()
  })

  // Keyboard parity: focusing the card link reveals exactly like hover, so
  // the poster never hides content from keyboard users. Touch-tap focus is
  // not :focus-visible, so it never reaches this branch.
  card.addEventListener('focusin', () => {
    if (!card.matches(':focus-visible')) return
    reveal()
  })
  card.addEventListener('focusout', (event) => {
    if (event.relatedTarget && card.contains(event.relatedTarget as Node)) return
    conceal()
  })

  // Touch: first tap reveals (and is explicit play intent — honored even
  // under reduced-motion, card-poster-reveal §6); second tap navigates.
  card.addEventListener('click', (event) => {
    if (lastPointerType !== 'touch' || isRevealed()) return
    event.preventDefault()
    touchRevealedCards.add(card)
    if (frame.revealWithIntent) {
      frame.revealWithIntent()
    } else {
      reveal()
    }
  })
}

/** Bind every card link that can host a gated frame. Both EditorialCard
 *  (`.editorial-card`) and the HomeWork mosaic (`.mosaic-item`, which renders
 *  MediaFrame inside its own link) resolve here so every card surface
 *  inherits the contract from one place. */
export function initPosterReveal(root: ParentNode = document) {
  root
    .querySelectorAll<HTMLAnchorElement>('.editorial-card, .mosaic-item')
    .forEach(bindCard)
}
