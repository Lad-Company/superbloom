import {defineLocations, presentationTool} from 'sanity/presentation'

// Draft preview (docs/content-preview-spec.md): the Presentation pane and
// share links both run through the site's /api/preview/enable route, which
// validates the dataset-stored secret (sanity.previewUrlSecret documents,
// created by the Studio) and sets the sb_preview cookie. There is no shared
// env secret — rotating means toggling Share access off/on in the tool.
const previewOrigin =
  process.env.SANITY_STUDIO_PREVIEW_ORIGIN ??
  (process.env.NODE_ENV === 'development' ? 'http://localhost:4321' : 'https://superbloomhouse.com')

export const presentation = presentationTool({
  previewUrl: {
    initial: previewOrigin,
    previewMode: {
      enable: '/api/preview/enable',
      // The Share button copies a signed preview link for people without a
      // Sanity login (Lauren, clients).
      shareAccess: true,
    },
  },
  resolve: {
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
      article: defineLocations({
        select: {
          title: 'title',
          slug: 'slug.current',
          articleType: 'articleType',
          // Zine Articles are referenced from their Issue, so the issue slug
          // is a reverse lookup. References always point at published IDs, so
          // normalize away the `drafts.` prefix before matching.
          issueSlug: `*[_type == "zineIssue" && string::split(^._id, "drafts.")[-1] in articles[]._ref][0].slug.current`,
        },
        resolve: (doc) => {
          if (!doc) return {locations: []}
          // News is a card-only surface (ADR-0022) — no detail page.
          if (doc.articleType === 'news') {
            return {locations: [{title: doc.title ?? 'News', href: '/index'}]}
          }
          if (doc.articleType === 'zine') {
            return {
              locations:
                doc.issueSlug && doc.slug
                  ? [
                      {
                        title: doc.title ?? 'Zine Article',
                        href: `/zine/issues/${doc.issueSlug}/${doc.slug}`,
                      },
                    ]
                  : [],
            }
          }
          return {
            locations: doc.slug
              ? [{title: doc.title ?? 'Article', href: `/articles/${doc.slug}`}]
              : [],
          }
        },
      }),
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
