export default function robots() {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/api/', '/dashboard/', '/profile'],
    },
    sitemap: 'https://www.bardashtt.com/sitemap.xml',
    host: 'https://www.bardashtt.com',
  };
}
