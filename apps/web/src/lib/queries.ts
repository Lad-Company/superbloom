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

const editorialCardProjection = `
  _id,
  _type,
  title,
  "slug": slug.current,
  overview,
  publicationDate,
  cardDestination,
  externalCoverage[]{ outlet, url, isPrimary },
  cardAspectRatio,
  tags[]->{ title, color },
  "cardMedia": cardMedia${mediaProjection}
`;

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
        "items": *[_type == "news"] | order(publicationDate desc)[0...8]{
          title,
          "slug": slug.current,
          overview,
          publicationDate,
          cardDestination,
          externalCoverage[]{ outlet, url, isPrimary },
          cardAspectRatio,
          tags[]->{ title, color },
          "cardMedia": cardMedia${mediaProjection}
        }
      },
      _type == "contactBlock" => {
        _type
      },
      _type == "homeZine" => {
        "issue": issue->{ "slug": slug.current },
        "currentIssueSlug": *[_type == "zineLanding"][0].currentIssue->slug.current,
        promoHeadline,
        promoIntro,
        "promoMedia": promoMedia${mediaProjection},
        ctaLabel
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
      overview,
      publicationDate,
      cardDestination,
      externalCoverage[]{ outlet, url, isPrimary },
      cardAspectRatio,
      tags[]->{ title, color },
      "cardMedia": cardMedia${mediaProjection}
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

const articleBodyProjection = `
  body[]{
    _type,
    _key,
    _type == "articleTextSection" => {
      heading,
      text
    },
    _type == "articleMediaSection" => {
      layout,
      "media": media${mediaProjection},
      "pairedMedia": pairedMedia[]${mediaProjection}
    }
  }
`

const articleProjection = `
    _type,
    title,
    "slug": slug.current,
    publicationDate,
    overview,
    tags[]->{ title, color },
    externalCoverage[]{ _key, outlet, url, isPrimary },
    "leadMedia": leadMedia${mediaProjection},
    ${articleBodyProjection},
    relatedItems[]->{
      _type,
      title,
      "slug": slug.current,
      "issueSlug": *[_type == "zineIssue" && references(^._id)][0].slug.current,
      overview,
      publicationDate,
      cardDestination,
      externalCoverage[]{ outlet, url, isPrimary },
      cardAspectRatio,
      tags[]->{ title, color },
      "cardMedia": cardMedia${mediaProjection}
    }
`

export const newsArticleBySlugQuery = defineQuery(`
  *[_type == "news" && slug.current == $slug][0] {
    ${articleProjection}
  }
`);

export const editorialArticleBySlugQuery = defineQuery(`
  *[_type == "editorialArticle" && slug.current == $slug][0] {
    ${articleProjection}
  }
`);

const zineArticleCardProjection = `
  _type,
  title,
  "slug": slug.current,
  overview,
  cardAspectRatio,
  tags[]->{ title, color },
  "cardMedia": cardMedia${mediaProjection}
`

const zineIssueProjection = `
  issueNumber,
  title,
  "slug": slug.current,
  publicationDate,
  coverAspectRatio,
  "coverMedia": coverMedia${mediaProjection},
  introHeadline,
  introText,
  "introMedia": introMedia[]${mediaProjection},
  editorLetter {
    headline,
    body,
    "media": mediaBox${mediaProjection}
  },
  articles[]->{
    ${zineArticleCardProjection}
  },
  "pdfUrl": pdfAsset.asset->url
`

export const zineLandingQuery = defineQuery(`
  *[_type == "zineLanding"][0]{
    "currentIssue": currentIssue->{
      ${zineIssueProjection}
    },
    "pastIssues": *[_type == "zineIssue" && _id != ^.currentIssue._ref] | order(publicationDate desc) {
      issueNumber,
      title,
      "slug": slug.current,
      coverAspectRatio,
      "coverMedia": coverMedia${mediaProjection}
    }
  }
`);

export const issueBySlugQuery = defineQuery(`
  *[_type == "zineIssue" && slug.current == $slug][0]{
    ${zineIssueProjection}
  }
`);

export const issueArchiveQuery = defineQuery(`
  *[_type == "zineIssue" && slug.current != $slug] | order(publicationDate desc) {
    issueNumber,
    title,
    "slug": slug.current,
    coverAspectRatio,
    "coverMedia": coverMedia${mediaProjection}
  }
`);

export const zineArticleBySlugQuery = defineQuery(`
  *[_type == "zineIssue" && slug.current == $issueSlug][0]{
    title,
    "issueSlug": slug.current,
    "article": *[
      _type == "zineArticle" &&
      slug.current == $articleSlug &&
      _id in ^.articles[]._ref
    ][0]{
      ${articleProjection}
    }
  }
`);

export const indexPageQuery = defineQuery(`
  *[_type == "indexPage"][0]{
    "lead": lead->{
      ${editorialCardProjection}
    },
    "secondary": secondary[]->{
      ${editorialCardProjection}
    }
  }
`);

export const indexViewAllNewestQuery = defineQuery(`
  *[
    _type in ["news", "editorialArticle"] &&
    !(_id in $featuredIds)
  ] | order(publicationDate desc)[$offset...$end]{
    ${editorialCardProjection}
  }
`);

export const indexViewAllOldestQuery = defineQuery(`
  *[
    _type in ["news", "editorialArticle"] &&
    !(_id in $featuredIds)
  ] | order(publicationDate asc)[$offset...$end]{
    ${editorialCardProjection}
  }
`);
