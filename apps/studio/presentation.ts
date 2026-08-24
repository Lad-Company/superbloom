import {getPublishedId} from 'sanity'
import {defineDocuments, defineLocations, presentationTool} from 'sanity/presentation'
import type {DocumentLocationResolver, DocumentLocationResolverObject} from 'sanity/presentation'
import {catchError, map, of} from 'rxjs'
import {ARTICLE_LOCATIONS_QUERY, resolveArticleLocations} from './articleLocations'

// Draft preview (docs/content-preview-spec.md): the Presentation pane and
// share links both run through the site's /api/preview/enable route, which
// validates the dataset-stored secret (sanity.previewUrlSecret documents,
// created by the Studio) and sets the sb_preview cookie. There is no shared
// env secret * rotating means toggling Share access off/on in the tool.

// Multi-environment: the pane can preview local dev, staging, or prod. The
// allow list and the initial origin are env-overridable at Studio build time;
// editors switch origins at runtime via the Studio URL's `?preview=` param.
const previewOrigins = (
  process.env.SANITY_STUDIO_PREVIEW_ORIGINS ??
  'http://localhost:*,https://superbloom-theta.vercel.app,https://superbloomhouse.com'
)
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean)

// Pre-launch, superbloomhouse.com still serves the legacy Netlify site, so
// the deployed Studio defaults to the Vercel staging URL * flip the default
// to the prod hostname at launch. Local `sanity dev` defaults to the local
// web server.
const initialOrigin =
  process.env.SANITY_STUDIO_PREVIEW_ORIGIN ??
  (process.env.NODE_ENV === 'development'
    ? 'http://localhost:4321'
    : 'https://superbloom-theta.vercel.app')

// Articles use the function resolver form: their zine reverse lookup is a
// GROQ subquery, which the object form's `select` cannot express (select
// values are field paths, not GROQ — see articleLocations.ts). Errors
// surface as a caution banner instead of an endless "Resolving
// locations..." spinner.
const articleLocationResolver: DocumentLocationResolver = (params, {documentStore}) =>
  documentStore
    .listenQuery(
      ARTICLE_LOCATIONS_QUERY,
      {id: getPublishedId(params.id)},
      {perspective: params.perspectiveStack, tag: 'presentation.article-locations'},
    )
    .pipe(
      map(resolveArticleLocations),
      catchError((error) => {
        console.error('[article-locations] failed to resolve', error)
        return of({message: 'Unable to resolve locations', tone: 'caution' as const})
      }),
    )

export const presentation = presentationTool({
  allowOrigins: previewOrigins,
  previewUrl: {
    initial: initialOrigin,
    previewMode: {
      enable: '/api/preview/enable',
      // The Share button copies a signed preview link for people without a
      // Sanity login (Lauren, clients).
      shareAccess: true,
    },
  },
  resolve: {
    // URL → document, for the tool's "Documents on this page" pane. Without
    // this map the pane is empty by construction ("No matching documents"):
    // its only other feed is overlay-reported stega/data-sanity refs, which
    // this site deliberately does not emit (no Visual Editing overlays,
    // docs/content-preview-spec.md §2.4). Locations below are the reverse
    // direction (document → URL) and cannot populate the pane.
    mainDocuments: defineDocuments([
      {route: '/', type: 'homepage'},
      {route: '/index', type: 'indexPage'},
      {route: '/work', type: 'workIndex'},
      {route: '/work/:slug', filter: `_type == "caseStudy" && slug.current == $slug`},
      {route: '/who-we-are', type: 'whoWeAre'},
      {route: '/articles/:slug', filter: `_type == "article" && slug.current == $slug`},
      {route: '/zine', type: 'zineLanding'},
      {route: '/zine/issues/:slug', filter: `_type == "zineIssue" && slug.current == $slug`},
      // The reader view belongs to the issue; it must precede the generic
      // article route or "read" is matched as an article slug.
      {
        route: '/zine/issues/:issueSlug/read',
        filter: `_type == "zineIssue" && slug.current == $issueSlug`,
      },
      {
        route: '/zine/issues/:issueSlug/:articleSlug',
        filter: `_type == "article" && articleType == "zine" && slug.current == $articleSlug`,
      },
      // /shop and /cart are Shopify-owned surfaces with no Sanity document.
    ]),
    locations: {
      homepage: defineLocations({locations: [{title: 'Homepage', href: '/'}]}),
      workIndex: defineLocations({locations: [{title: 'Work', href: '/work'}]}),
      whoWeAre: defineLocations({locations: [{title: 'Who We Are', href: '/who-we-are'}]}),
      zineLanding: defineLocations({locations: [{title: 'Zine', href: '/zine'}]}),
      indexPage: defineLocations({locations: [{title: 'Index', href: '/index'}]}),
      siteSettings: defineLocations({locations: [{title: 'Homepage', href: '/'}]}),
      caseStudy: defineLocations({
        select: {title: 'title', slug: 'slug.current'},
        resolve: (doc) => ({
          locations: doc?.slug
            ? [{title: doc.title ?? 'Case Study', href: `/work/${doc.slug}`}]
            : [],
        }),
      }),
      // The per-type function form is runtime-supported by
      // sanity/presentation but missing from its type union, hence the cast.
      article: articleLocationResolver as unknown as DocumentLocationResolverObject,
      zineIssue: defineLocations({
        select: {title: 'title', slug: 'slug.current'},
        resolve: (doc) => ({
          locations: doc?.slug
            ? [{title: doc.title ?? 'Zine Issue', href: `/zine/issues/${doc.slug}`}]
            : [],
        }),
      }),
      // capability, tag, formSubmission: structural, no designed surface.
    },
  },
})
