import { BLOG_CATEGORY_VALUES } from '@/lib/blogCategories';
import { livePosts } from '@/lib/content';
import { liveCourses } from '@/lib/onlineCourses';
import { prisma } from '@/lib/prisma';

// نقشهٔ سایت در هر درخواست دوباره از دیتابیس خوانده می‌شود تا مطالبِ تازهٔ پنل
// بدون نیاز به بیلد مجدد بلافاصله برای گوگل قابل کشف باشند.
export const dynamic = 'force-dynamic';

const baseUrl = 'https://www.bardashtt.com';

// صفحات عمومیِ ثابت. صفحات خصوصی/ورود (dashboard، profile، auth) عمداً اینجا نیستند
// چون در robots.txt مسدودند و حضورشان در نقشهٔ سایت خطای «URL مسدودشده» در سرچ‌کنسول می‌سازد.
const staticRoutes = [
  '',
  '/about',
  '/courses',
  '/actors',
  '/audition',
  '/blog',
  '/blog/amoozesh-bazigari-raygan-shoroe',
  ...BLOG_CATEGORY_VALUES.map((c) => `/blog/category/${c}`),
  '/certificate',
  '/faq',
  '/gallery',
  '/insurance',
  '/news',
  '/online-learning',
  '/social-responsibility',
  '/register',
  '/verify',
  '/works/output',
  '/works/advertising',
  '/works/resume',
];

// زیربخش‌های مسئولیت اجتماعی که همگی صفحهٔ جزئیاتِ /social-responsibility/[slug] دارند.
const SR_SECTIONS = ['social-responsibility', 'sr-podcast', 'sr-photo', 'sr-video'];

export default async function sitemap() {
  const now = new Date();

  // محتوای پویا که ادمین از پنل می‌سازد؛ خودکار وارد نقشهٔ سایت می‌شود تا گوگل تازه‌ها را زود کشف کند.
  const [blogPosts, newsPosts, srPosts, courses] = await Promise.all([
    livePosts('blog', { take: 1000 }),
    livePosts('news', { take: 1000 }),
    prisma.post.findMany({
      where: {
        section: { in: SR_SECTIONS },
        published: true,
        OR: [{ publishAt: null }, { publishAt: { lte: now } }],
      },
      orderBy: { createdAt: 'desc' },
      take: 1000,
    }),
    liveCourses(),
  ]);

  const staticEntries = staticRoutes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: now,
    changeFrequency: route === '' ? 'weekly' : 'monthly',
    priority: route === '' ? 1 : 0.75,
  }));

  const dynamicEntries = [
    ...blogPosts.map((p) => ({ path: `/blog/${p.slug}`, lastModified: p.updatedAt })),
    ...newsPosts.map((p) => ({ path: `/news/${p.slug}`, lastModified: p.updatedAt })),
    ...srPosts.map((p) => ({ path: `/social-responsibility/${p.slug}`, lastModified: p.updatedAt })),
    ...courses.map((c) => ({ path: `/online-learning/${c.slug}`, lastModified: c.updatedAt })),
  ].map((e) => ({
    url: `${baseUrl}${e.path}`,
    lastModified: e.lastModified ? new Date(e.lastModified) : now,
    changeFrequency: 'weekly',
    priority: 0.6,
  }));

  return [...staticEntries, ...dynamicEntries];
}
