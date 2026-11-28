export const dynamic = 'force-dynamic';

export default function robots() {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/dashboard/', '/profile', '/panel'],
      },
      {
        userAgent: ['OAI-SearchBot', 'GPTBot', 'ChatGPT-User', 'PerplexityBot', 'Google-Extended', 'Bingbot'],
        allow: '/',
        disallow: ['/api/', '/dashboard/', '/profile', '/panel'],
      },
    ],
    sitemap: 'https://www.bardashtt.com/sitemap.xml',
    host: 'www.bardashtt.com',
  };
}
