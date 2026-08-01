import { BLOG_CATEGORY_VALUES } from '@/lib/blogCategories';

const baseUrl = 'https://www.bardashtt.com';

const routes = [
  '',
  '/about',
  '/courses',
  '/actors',
  '/audition',
  '/auth',
  '/blog',
  '/blog/amoozesh-bazigari-raygan-shoroe',
  ...BLOG_CATEGORY_VALUES.map((c) => `/blog/category/${c}`),
  '/certificate',
  '/dashboard',
  '/faq',
  '/gallery',
  '/insurance',
  '/news',
  '/online-learning',
  '/social-responsibility',
  '/podcast',
  '/profile',
  '/register',
  '/verify',
  '/works/output',
  '/works/cinema',
  '/works/advertising',
  '/works/resume',
];

export default function sitemap() {
  return routes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: route === '' ? 'weekly' : 'monthly',
    priority: route === '' ? 1 : 0.75,
  }));
}
