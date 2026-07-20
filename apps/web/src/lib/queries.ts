import { defineQuery } from 'groq';

const mediaProjection = `{
  "asset": asset[0]{
    _type,
    _type == "image" => {
      "url": asset->url,
      "width": asset->metadata.dimensions.width,
      "height": asset->metadata.dimensions.height,
      "altText": asset->altText
    },
    _type == "mux.video" => {
      "playbackId": asset->playbackId
    }
  },
  altText,
  decorative
}`;

export const homepageQuery = defineQuery(`
  *[_type == "homepage"][0]{
    sections[]{
      _type,
      _type == "heroBlock" => {
        heading,
        subheading,
        "heroMedia": heroMedia${mediaProjection}
      },
      _type == "capesBlock" => {
        headline,
        capabilities[]->{
          title,
          "slug": slug.current,
          "media": media${mediaProjection}
        }
      },
      _type == "newsBlock" => {
        headline,
        "items": *[_type == "news"] | order(publishedAt desc)[0...8]{
          title,
          "slug": slug.current,
          summary,
          aspectRatio,
          tags[]->{ title, color },
          "media": media${mediaProjection}
        }
      },
      _type == "contactBlock" => {
        _type
      }
    }
  }
`);

export const whoWeAreQuery = defineQuery(`
  *[_type == "whoWeAre"][0]{
    heroHeading,
    featuredMedia{
      aspectRatio,
      "media": media${mediaProjection}
    },
    marquee{ text },
    introStatement,
    statCards[]{
      _key,
      label,
      value,
      description,
      items
    },
    advantageHeadline,
    advantageBlocks[]{
      _key,
      heading,
      body,
      aspectRatio,
      "media": media${mediaProjection}
    },
    disciplines[]{
      _key,
      title,
      description
    },
    ctas[]{
      _key,
      heading,
      label,
      href,
      "media": media${mediaProjection}
    },
    faqs[]{
      _key,
      question,
      answer
    }
  }
`);

export const workIndexQuery = defineQuery(`
  *[_type == "workIndex"][0]{
    heroHeading,
    allWorkHeading
  }
`);

export const caseStudiesQuery = defineQuery(`
  *[_type == "caseStudy"] | order(orderRank) {
    title,
    "slug": slug.current,
    summary,
    cardSize,
    cardAspectRatio,
    tags[]->{ title, color },
    "media": cardMedia${mediaProjection}
  }
`);

const narrativeBodyProjection = `
  body[]{
    _type,
    _key,
    theme,
    eyebrow,
    _type == "highlightsSection" => {
      statement,
      stats[]{ _key, value, label }
    },
    _type == "textSection" => {
      body
    },
    _type == "mediaSection" => {
      layout,
      text,
      media[]{
        _type,
        _key,
        _type == "mediaBox" => ${mediaProjection}
      }
    },
    _type == "statsSection" => {
      stats[]{ _key, value, label }
    }
  }
`;

const caseStudyMediaLayoutsProjection = `
  mediaLayouts[]{
    _type,
    _key,
    _type == "caseStudyFullBleedMedia" => {
      "media": mediaBox${mediaProjection}
    },
    _type == "caseStudyTextMedia" => {
      text,
      mediaPosition,
      "media": mediaBox${mediaProjection}
    },
    _type == "caseStudyPairedPortraitMedia" => {
      "media": mediaBoxes[]${mediaProjection}
    }
  }
`;

export const caseStudyBySlugQuery = defineQuery(`
  *[_type == "caseStudy" && slug.current == $slug][0] {
    title,
    "slug": slug.current,
    client,
    capabilities[]->{ title },
    primaryColor,
    secondaryColor,
    "leadMedia": leadMedia${mediaProjection},
    highlights{
      summary,
      ${caseStudyMediaLayoutsProjection}
    },
    challenge{
      summary,
      ${caseStudyMediaLayoutsProjection}
    },
    unexpectedInsight{
      summary,
      ${caseStudyMediaLayoutsProjection}
    },
    bigIdea{
      summary,
      ${caseStudyMediaLayoutsProjection}
    },
    results{
      surfaceRole,
      stats[]{ _key, value, label }
    },
    press[0...3]->{
      title,
      "slug": slug.current,
      summary,
      aspectRatio,
      tags[]->{ title, color },
      "media": media${mediaProjection}
    },
    nextProject->{
      title,
      "slug": slug.current,
      summary,
      cardAspectRatio,
      tags[]->{ title, color },
      "media": cardMedia${mediaProjection},
      primaryColor
    }
  }
`);

export const newsBySlugQuery = defineQuery(`
  *[_type == "news" && slug.current == $slug][0] {
    title,
    "slug": slug.current,
    publishedAt,
    summary,
    aspectRatio,
    tags[]->{ title, color },
    externalLinks[]{ _key, outlet, url },
    "media": media${mediaProjection},
    ${narrativeBodyProjection}
  }
`);
