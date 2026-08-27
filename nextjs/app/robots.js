import { siteUrl } from '@/lib/siteUrl';

// باید per-request باشد تا sitemap/host با دامنهٔ همان درخواست (siteUrl()) هماهنگ بمانند.
export const dynamic = 'force-dynamic';

export default async function robots() {
  const base = await siteUrl();
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/api/', '/dashboard/', '/profile', '/panel', '/cafe-admin'],
    },
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}
