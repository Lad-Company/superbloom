import type { APIRoute } from 'astro';

export const GET: APIRoute = ({ site }) => {
  const origin = site ?? new URL('https://superbloomhouse.com');
  return new Response(`User-agent: *
Allow: /

Sitemap: ${new URL('/sitemap.xml', origin).href}
`, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
