import type { APIRoute } from 'astro';
import { sitemapQuery } from '../lib/queries';
import { fetchSafe, sanityClient } from '../lib/sanity';
import { setPublicCache } from '../lib/cacheHeaders';

const escapeXml = (value: string) =>
  value.replace(/[<>&'"]/g, (character) => ({
    '<': '&lt;',
    '>': '&gt;',
    '&': '&amp;',
    "'": '&apos;',
    '"': '&quot;',
  })[character] ?? character);

interface SitemapEntry {
  path: string;
  updatedAt?: string;
}

export const GET: APIRoute = async ({ site }) => {
  const content = await fetchSafe<{
    caseStudies: SitemapEntry[];
    articles: SitemapEntry[];
    pastIssues: SitemapEntry[];
    zineArticles: Array<{
      issueSlug: string;
      updatedAt?: string;
      articles: Array<{ slug?: string; updatedAt?: string } | null>;
    }>;
  }>(sanityClient, sitemapQuery);

  if (content === undefined) {
    return new Response('Unable to generate sitemap', { status: 500 });
  }

  const entries: SitemapEntry[] = [
    { path: '/' },
    { path: '/work' },
    { path: '/who-we-are' },
    { path: '/index' },
    { path: '/zine' },
    ...(content.caseStudies ?? []),
    ...(content.articles ?? []),
    ...(content.pastIssues ?? []),
    ...(content.zineArticles ?? []).flatMap((issue) =>
      (issue.articles ?? [])
        .filter((article): article is { slug: string; updatedAt?: string } => Boolean(article?.slug))
        .map((article) => ({
          path: `/zine/issues/${issue.issueSlug}/${article.slug}`,
          updatedAt: article.updatedAt ?? issue.updatedAt,
        })),
    ),
  ];
  const origin = site ?? new URL('https://superbloomhouse.com');
  const urls = entries
    .map(({ path, updatedAt }) => {
      const lastmod = updatedAt ? `<lastmod>${escapeXml(updatedAt)}</lastmod>` : '';
      return `<url><loc>${escapeXml(new URL(path, origin).href)}</loc>${lastmod}</url>`;
    })
    .join('');

  const response = new Response(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>`, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  });
  setPublicCache(response, 3600);
  return response;
};
