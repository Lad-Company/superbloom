/**
 * Seed: Tyson case study
 *
 * Creates or replaces the Tyson case study with copy and media-row structure
 * matching the Figma design. Media blocks are structural placeholders — add
 * real assets in Studio after running this script.
 *
 * Run:     pnpm --filter studio seed:tyson
 * Dry run: pnpm --filter studio seed:tyson -- --dry-run
 *
 * Prerequisites: capabilities must exist (run seed:capabilities first if needed)
 */

import {getCliClient} from 'sanity/cli'

const client = getCliClient({apiVersion: '2026-07-22'})
const dryRun = process.argv.includes('--dry-run')

// ─── Key generation ──────────────────────────────────────────────────────────

let seq = 0
const k = (prefix = 'k') => `${prefix}${String(++seq).padStart(4, '0')}`

// ─── Portable text ───────────────────────────────────────────────────────────

const pt = (text: string) => ({
  _type: 'block' as const,
  _key: k('p'),
  style: 'normal',
  children: [{_type: 'span', _key: k('s'), text, marks: [] as string[]}],
  markDefs: [] as unknown[],
})

// ─── Content layout helpers ──────────────────────────────────────────────────

const mediaBlock = (width: string, aspectRatio = '16:9') => ({
  _type: 'contentLayoutMedia' as const,
  _key: k('mb'),
  width,
  aspectRatio,
  // media intentionally omitted — add real assets in Studio
})

const textBlock = (width: string, text: string) => ({
  _type: 'contentLayoutText' as const,
  _key: k('tb'),
  width,
  text: [pt(text)],
})

const row = (...blocks: ReturnType<typeof mediaBlock | typeof textBlock>[]) => ({
  _type: 'contentLayoutRow' as const,
  _key: k('r'),
  blocks,
})

const section = (summary: string, mediaLayouts: ReturnType<typeof row>[] = []) => ({
  _type: 'caseStudyNarrativeSection',
  summary: [pt(summary)],
  mediaLayouts,
})

// ─── Document ────────────────────────────────────────────────────────────────

const tyson = {
  _id: 'case-study-tyson',
  _type: 'caseStudy',

  // Hero — matches Figma: client eyebrow "TYSON", title "RESTORING A POULTRY ICON"
  title: 'Restoring a Poultry Icon',
  slug: {_type: 'slug', current: 'tyson'},
  client: 'Tyson',
  summary:
    'A culturally driven brand platform that reconnected Tyson with modern food culture through strategy, social, storytelling, and campaign production.',
  publicationDate: '2024-03-01T00:00:00Z',

  // Brand colors — Figma Tyson theme: yellow primary, red secondary
  primaryColor: {hex: '#fdd143', alpha: 1},
  secondaryColor: {hex: '#cb122d', alpha: 1},

  // Capability tags — Figma hero tags row: Strategy, Creative, Production, Social
  capabilities: [
    {_type: 'reference', _ref: 'cap-campaign-strategy'},
    {_type: 'reference', _ref: 'cap-content-production'},
    {_type: 'reference', _ref: 'cap-social-studios'},
    {_type: 'reference', _ref: 'cap-brand-salon'},
  ],

  // Card settings — 1/2-width card, 3:2 media, info below
  cardWidth: '1/2',
  mediaAspectRatio: '3:2',
  infoPosition: 'below',
  // cardMedia: placeholder — add card thumbnail in Studio

  // Lead media — full-width 16:9 strip after hero (Figma 1:4574)
  // leadMedia: placeholder — add hero reel in Studio

  // ─── Case Study Spine ──────────────────────────────────────────────────────

  highlights: section(
    'Create a culturally driven brand platform for Tyson through strategy, social, storytelling, and campaign production that connects the brand to modern food culture.',
    // No media rows in Highlights (matches Figma structure)
  ),

  challenge: section(
    "Despite Tyson's 90-year leadership in chicken, changing consumer habits were eroding its 'original innovator' status. Younger audiences with changing appetites and eating behaviors were simply not considering Tyson. Our challenge was to change perception of this iconic brand, bringing new audiences into the fold through a humorous take on the brand's legacy.",
    [
      // 1/4 text + 3/4 media — Figma row 1:4585
      row(
        textBlock(
          '1/4',
          'Younger audiences were moving away from Tyson — a brand that had shaped American food culture for nearly a century.',
        ),
        mediaBlock('3/4', '16:9'),
      ),
    ],
  ),

  unexpectedInsight: section(
    "By tapping into the 75 million chicken superfan conversations and loyalists on social media, we discovered that Tyson has actually always been present in cultural moments far beyond just the dinner table.",
    [
      // 3/4 media + 1/4 text — Figma row 1:4593
      row(
        mediaBlock('3/4', '16:9'),
        textBlock(
          '1/4',
          'Tyson was already showing up everywhere — from stadium tailgates to late-night content — without the brand even trying.',
        ),
      ),
      // 1/2 + 1/2 square pair — Figma row 1:4601
      row(mediaBlock('1/2', '1:1'), mediaBlock('1/2', '1:1')),
      // 1/4 text + 3/4 media — Figma row 1:4604
      row(
        textBlock(
          '1/4',
          'Those moments had been building for years — waiting for the brand to show up and claim them.',
        ),
        mediaBlock('3/4', '16:9'),
      ),
    ],
  ),

  bigIdea: section(
    "Reposition Tyson as the original cultural icon of chicken — not a grocery aisle staple, but the brand that has been in every American food moment for 90 years. By leaning into the existing superfan energy on social media, we could turn organic enthusiasm into a full campaign platform that made Tyson feel new to a generation that had never really met it.",
    // No media rows in Big Idea (matches Figma structure)
  ),

  results: {
    _type: 'caseStudyResults',
    backgroundColor: 'primary',
    stats: [
      {_type: 'caseStudyStat', _key: k('st'), value: '+237%', label: 'Increase in Organic Reach'},
      {_type: 'caseStudyStat', _key: k('st'), value: '+11.5%', label: 'Sales Lift'},
      {_type: 'caseStudyStat', _key: k('st'), value: '6.6%', label: 'Increase in Revenue YoY'},
      {_type: 'caseStudyStat', _key: k('st'), value: '2X', label: 'Increase in E-Commerce Sales'},
    ],
  },
}

// ─── Run ─────────────────────────────────────────────────────────────────────

if (dryRun) {
  console.log('Dry run — document that would be written:')
  console.log(JSON.stringify(tyson, null, 2))
  console.log('\nCapabilities seed (required):')
  console.log('  cap-campaign-strategy, cap-content-production, cap-social-studios, cap-brand-salon')
  console.log('\nPlaceholder fields to fill in Studio:')
  console.log('  caseStudy.cardMedia — card thumbnail image or video')
  console.log('  caseStudy.leadMedia — full-width hero media strip')
  console.log('  challenge.mediaLayouts[0].blocks[1].media — campaign production still')
  console.log('  unexpectedInsight.mediaLayouts[0].blocks[0].media — cultural moment image')
  console.log('  unexpectedInsight.mediaLayouts[1].blocks[0].media — product portrait')
  console.log('  unexpectedInsight.mediaLayouts[1].blocks[1].media — context portrait')
  console.log('  unexpectedInsight.mediaLayouts[2].blocks[1].media — campaign still')
} else {
  // Ensure capabilities exist first
  const caps = await client.getDocuments([
    'cap-campaign-strategy',
    'cap-content-production',
    'cap-social-studios',
    'cap-brand-salon',
  ])
  const missing = caps.filter((c) => c === null)
  if (missing.length > 0) {
    console.error(
      `Missing ${missing.length} capability document(s). Import seed-capabilities.ndjson first:`,
    )
    console.error(
      "  sanity dataset import apps/studio/seed-capabilities.ndjson <dataset> --replace",
    )
    process.exitCode = 1
  } else {
    await client.createOrReplace(tyson)
    console.log(`✓ Seeded: ${tyson._id} — "${tyson.title}" (${tyson.client})`)
    console.log('  Add real media assets in Studio to complete the case study.')
  }
}
