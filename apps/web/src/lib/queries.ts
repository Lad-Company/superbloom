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
  articleType,
  title,
  "slug": slug.current,
  overview,
  publicationDate,
  isExternal,
  externalUrl,
  externalCoverage[]{ outlet, url, isPrimary },
  cardAspectRatio,
  tags[]->{ title, color },
  "cardMedia": cardMedia${mediaProjection}
`;

export const homepageQuery = defineQuery(`
  *[_type == "homepage"][0]{
    hero{
      heading,
      subheading,
      "heroMedia": heroMedia${mediaProjection}
    },
    capabilities{
      headline,
      capabilities[]->{
        title,
        subtitle,
        "slug": slug.current,
        "media": media${mediaProjection}
      }
    },
    news{
      headline,
      "items": *[_type == "article" && articleType == "news"] | order(coalesce(publicationDate, _createdAt) desc)[0...8]{
        ${editorialCardProjection}
      }
    },
    zine{
      "issue": issue->{ "slug": slug.current },
      "currentIssueSlug": *[_type == "zineLanding"][0].currentIssue->slug.current,
      promoHeadline,
      promoIntro,
      "promoMedia": promoMedia${mediaProjection},
      ctaLabel
    },
    contact{ _type }
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
      mediaWidth,
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
    summary,
    client,
    capabilities[]->{ title },
    "primaryColor": primaryColor.hex,
    "secondaryColor": secondaryColor.hex,
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
      backgroundColor,
      stats[]{ _key, value, label }
    },
    press[0...3]->{
      title,
      "slug": slug.current,
      overview,
      publicationDate,
      isExternal,
      externalUrl,
      articleType,
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
      "primaryColor": primaryColor.hex
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
    articleType,
    title,
    "slug": slug.current,
    publicationDate,
    overview,
    isExternal,
    externalUrl,
    tags[]->{ title, color },
    externalCoverage[]{ _key, outlet, url, isPrimary },
    "leadMedia": leadMedia${mediaProjection},
    ${articleBodyProjection},
    relatedItems[]->{
      _type,
      articleType,
      title,
      "slug": slug.current,
      "issueSlug": *[_type == "zineIssue" && references(^._id)][0].slug.current,
      overview,
      publicationDate,
      isExternal,
      externalUrl,
      articleType,
      externalCoverage[]{ outlet, url, isPrimary },
      cardAspectRatio,
      tags[]->{ title, color },
      "cardMedia": cardMedia${mediaProjection}
    }
`

export const newsArticleBySlugQuery = defineQuery(`
  *[_type == "article" && articleType == "news" && isExternal != true && slug.current == $slug][0] {
    ${articleProjection}
  }
`);

export const editorialArticleBySlugQuery = defineQuery(`
  *[_type == "article" && articleType == "editorial" && slug.current == $slug][0] {
    ${articleProjection}
  }
`);

const zineArticleCardProjection = `
  _type,
  articleType,
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
  "cardMedia": cardMedia${mediaProjection},
  "heroMedia": heroMedia${mediaProjection},
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
  issuuUrl
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
      "cardMedia": cardMedia${mediaProjection}
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
    "cardMedia": cardMedia${mediaProjection}
  }
`);

export const zineArticleBySlugQuery = defineQuery(`
  *[_type == "zineIssue" && slug.current == $issueSlug][0]{
    title,
    "issueSlug": slug.current,
    "article": *[
      _type == "article" &&
      articleType == "zine" &&
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
    _type == "article" &&
    articleType in ["news", "editorial"] &&
    !(_id in $featuredIds)
  ] | order(coalesce(publicationDate, _createdAt) desc)[$offset...$end]{
    ${editorialCardProjection}
  }
`);

export const indexViewAllOldestQuery = defineQuery(`
  *[
    _type == "article" &&
    articleType in ["news", "editorial"] &&
    !(_id in $featuredIds)
  ] | order(coalesce(publicationDate, _createdAt) asc)[$offset...$end]{
    ${editorialCardProjection}
  }
`);

export const siteSettingsQuery = defineQuery(`
  *[_type == "siteSettings"][0]{
    instagramUrl,
    linkedInUrl,
    vimeoUrl,
    youTubeUrl
  }
`);

export const sitemapQuery = defineQuery(`
  {
    "caseStudies": *[_type == "caseStudy" && defined(slug.current)]{
      "path": "/work/" + slug.current,
      "updatedAt": _updatedAt
    },
    "news": *[_type == "article" && articleType == "news" && isExternal != true && defined(slug.current)]{
      "path": "/news/" + slug.current,
      "updatedAt": _updatedAt
    },
    "articles": *[_type == "article" && articleType == "editorial" && defined(slug.current)]{
      "path": "/articles/" + slug.current,
      "updatedAt": _updatedAt
    },
    "pastIssues": *[
      _type == "zineIssue" &&
      defined(slug.current) &&
      _id != *[_type == "zineLanding"][0].currentIssue._ref
    ]{
      "path": "/zine/issues/" + slug.current,
      "updatedAt": _updatedAt
    },
    "zineArticles": *[_type == "zineIssue" && defined(slug.current)]{
      "issueSlug": slug.current,
      "updatedAt": _updatedAt,
      "articles": articles[]->{ "slug": slug.current, "updatedAt": _updatedAt }
    }
  }
`);
