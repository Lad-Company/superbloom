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
      "playbackId": asset->playbackId,
      "aspectRatio": asset->data.aspect_ratio
    }
  },
  altText,
  decorative
}`;

export const contentLayoutRowsProjection = `
  _type,
  _key,
  alignment,
  fullBleed,
  blocks[]{
    _type,
    _key,
    width,
    _type == "contentLayoutMedia" => {
      aspectRatio,
      "media": media${mediaProjection}
    },
    _type == "contentLayoutText" => {
      heading,
      text
    }
  }
`;

const editorialCardProjection = `
  _id,
  _type,
  articleType,
  title,
  "slug": slug.current,
  overview,
  publicationDate,
  cardDestination,
  externalCoverage[]{ outlet, url, isPrimary },
  cardWidth,
  mediaAspectRatio,
  infoPosition,
  "issueSlug": *[_type == "zineIssue" && references(^._id)][0].slug.current,
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
      listDefaults,
      itemOverrides[]{ "articleId": article._ref, cardWidth, mediaAspectRatio, infoPosition },
      "items": items[]->{
        ${editorialCardProjection}
      }
    },
    feature{
      headline,
      body,
      "media": media${mediaProjection}
    },
    work{
      headline,
      ctaLabel,
      "items": items[]->{
        _id,
        title,
        "slug": slug.current,
        summary,
        cardWidth,
        mediaAspectRatio,
        infoPosition,
        tags[]->{ title, color },
        "media": cardMedia${mediaProjection}
      }
    },
    why{
      headline,
      body,
      ctaLabel,
      ctaHref,
      "media": media${mediaProjection}
    },
    zine{
      "issue": issue->{ "slug": slug.current },
      "currentIssueSlug": *[_type == "zineLanding"][0].currentIssue->slug.current,
      promoHeadline,
      promoIntro,
      "promoMedia": promoMedia${mediaProjection},
      ctaLabel
    },
    testimonials{
      headline,
      items[]{ _key, quote, attribution },
      ctaLabel,
      ctaHref
    },
    contact{ _type },
    "globalCardDefaults": *[_type == "siteSettings"][0].cardDefaults
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
    allWorkHeading,
    featured[]{
      _key,
      cardWidth,
      mediaAspectRatio,
      infoPosition,
      "item": caseStudy->{
        _id,
        title,
        "slug": slug.current,
        summary,
        publicationDate,
        cardWidth,
        mediaAspectRatio,
        infoPosition,
        tags[]->{ title, color },
        "media": cardMedia${mediaProjection}
      }
    },
    allSection{
      listDefaults,
      itemOverrides[]{ "itemId": caseStudy._ref, cardWidth, mediaAspectRatio, infoPosition }
    },
    "globalCardDefaults": *[_type == "siteSettings"][0].cardDefaults
  }
`);

export const caseStudiesNewestQuery = defineQuery(`
  *[_type == "caseStudy" && !(_id in $featuredIds)]
    | order(publicationDate desc)[$offset...$end] {
    _id,
    title,
    "slug": slug.current,
    summary,
    publicationDate,
    cardWidth,
    mediaAspectRatio,
    infoPosition,
    tags[]->{ title, color },
    "media": cardMedia${mediaProjection}
  }
`);

export const caseStudiesOldestQuery = defineQuery(`
  *[_type == "caseStudy" && !(_id in $featuredIds)]
    | order(publicationDate asc)[$offset...$end] {
    _id,
    title,
    "slug": slug.current,
    summary,
    publicationDate,
    cardWidth,
    mediaAspectRatio,
    infoPosition,
    tags[]->{ title, color },
    "media": cardMedia${mediaProjection}
  }
`);

const caseStudyMediaLayoutsProjection = `
  mediaLayouts[]{
    ${contentLayoutRowsProjection}
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
      stats[]{ _key, value, label },
      supportingRows[]{
        ${contentLayoutRowsProjection}
      }
    },
    "press": press[0...3][@->articleType == "news"]->{
      title,
      "slug": slug.current,
      overview,
      publicationDate,
      cardDestination,
      articleType,
      externalCoverage[]{ outlet, url, isPrimary },
      cardWidth,
      mediaAspectRatio,
      infoPosition,
      tags[]->{ title, color },
      "cardMedia": cardMedia${mediaProjection}
    },
    nextProject->{
      title,
      "slug": slug.current,
      summary,
      cardWidth,
      mediaAspectRatio,
      infoPosition,
      tags[]->{ title, color },
      "media": cardMedia${mediaProjection},
      "primaryColor": primaryColor.hex
    },
    "globalCardDefaults": *[_type == "siteSettings"][0].cardDefaults
  }
`);

const articleBodyProjection = `
  body[]{
    _type,
    _key,
    _type == "contentLayoutRow" => {
      ${contentLayoutRowsProjection}
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
    cardDestination,
    tags[]->{ title, color },
    externalCoverage[]{ _key, outlet, url, isPrimary },
    "leadMedia": leadMedia${mediaProjection},
    ${articleBodyProjection},
    relatedItems[]->{
      _id,
      _type,
      articleType,
      title,
      "slug": slug.current,
      publicationDate,
      "issueSlug": *[_type == "zineIssue" && references(^._id)][0].slug.current,
      overview,
      cardDestination,
      externalCoverage[]{ outlet, url, isPrimary },
      cardWidth,
      mediaAspectRatio,
      infoPosition,
      tags[]->{ title, color },
      "cardMedia": cardMedia${mediaProjection}
    },
    "globalCardDefaults": *[_type == "siteSettings"][0].cardDefaults
`

export const newsArticleBySlugQuery = defineQuery(`
  *[_type == "article" && articleType == "news" && slug.current == $slug][0] {
    ${articleProjection}
  }
`);

export const editorialArticleBySlugQuery = defineQuery(`
  *[_type == "article" && articleType == "editorial" && slug.current == $slug][0] {
    ${articleProjection}
  }
`);

const zineArticleCardProjection = `
  _id,
  _type,
  articleType,
  title,
  "slug": slug.current,
  overview,
  publicationDate,
  cardWidth,
  mediaAspectRatio,
  infoPosition,
  tags[]->{ title, color },
  "cardMedia": cardMedia${mediaProjection}
`

const zineIssueProjection = `
  title,
  "slug": slug.current,
  "cardMedia": cardMedia${mediaProjection},
  "heroMedia": heroMedia${mediaProjection},
  editorLetter,
  articles[]->{
    ${zineArticleCardProjection}
  },
  listDefaults,
  articleOverrides[]{ "articleId": article._ref, cardWidth, mediaAspectRatio, infoPosition },
  issuuUrl,
  "pdfUrl": pdfAsset.asset->url,
  "globalCardDefaults": *[_type == "siteSettings"][0].cardDefaults
`

export const zineLandingQuery = defineQuery(`
  *[_type == "zineLanding"][0]{
    "currentIssue": currentIssue->{
      ${zineIssueProjection}
    },
    "pastIssues": *[_type == "zineIssue" && _id != ^.currentIssue._ref] | order(orderRank) {
      title,
      "slug": slug.current,
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
  *[_type == "zineIssue" && slug.current != $slug] | order(orderRank) {
    title,
    "slug": slug.current,
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
  *[_id == "indexPage"][0]{
    featured[]{
      _key,
      cardWidth,
      mediaAspectRatio,
      infoPosition,
      "item": article->{
        ${editorialCardProjection}
      }
    },
    allSection{
      listDefaults,
      "tagId": tagFilter._ref,
      itemOverrides[]{ "itemId": article._ref, cardWidth, mediaAspectRatio, infoPosition }
    },
    "globalCardDefaults": *[_type == "siteSettings"][0].cardDefaults
  }
`);

export const indexViewAllNewestQuery = defineQuery(`
  *[
    _type == "article" &&
    articleType in ["news", "editorial", "zine"] &&
    !(_id in $featuredIds) &&
    (!defined($tagId) || $tagId in tags[]._ref)
  ] | order(publicationDate desc)[$offset...$end]{
    ${editorialCardProjection}
  }
`);

export const indexViewAllOldestQuery = defineQuery(`
  *[
    _type == "article" &&
    articleType in ["news", "editorial", "zine"] &&
    !(_id in $featuredIds) &&
    (!defined($tagId) || $tagId in tags[]._ref)
  ] | order(publicationDate asc)[$offset...$end]{
    ${editorialCardProjection}
  }
`);

export const siteSettingsQuery = defineQuery(`
  *[_type == "siteSettings"][0]{
    instagramUrl,
    linkedInUrl,
    vimeoUrl,
    youTubeUrl,
    cardDefaults
  }
`);

export const sitemapQuery = defineQuery(`
  {
    "caseStudies": *[_type == "caseStudy" && defined(slug.current)]{
      "path": "/work/" + slug.current,
      "updatedAt": _updatedAt
    },
    "news": *[_type == "article" && articleType == "news" && defined(slug.current)]{
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
