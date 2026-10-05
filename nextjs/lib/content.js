import { prisma } from '@/lib/prisma';
import { decodeSlug } from '@/lib/slug';

export { SECTIONS, SECTION_VALUES, sectionLabel } from '@/lib/sections';

// یک مطلب وقتی «زنده» (قابل نمایش روی سایت) است که منتشر شده باشد و زمان انتشارش رسیده باشد.
// چون فیلتر زمان روی هر درخواست اعمال می‌شود، محتوا دقیقاً سرِ همان ساعت خودبه‌خود ظاهر می‌شود
// و نیازی به هیچ سرویس پس‌زمینه (cron/بات) نیست.
export async function livePosts(section, { take = 60, category } = {}) {
  const now = new Date();
  return prisma.post.findMany({
    where: {
      section,
      ...(category ? { category } : {}),
      published: true,
      OR: [{ publishAt: null }, { publishAt: { lte: now } }],
    },
    orderBy: { createdAt: 'desc' },
    take,
  });
}

// یافتن یک مطلب زنده بر اساس slug (برای صفحات جزئیات).
export async function livePostBySlug(slug, section) {
  const now = new Date();
  return prisma.post.findFirst({
    where: {
      slug: decodeSlug(slug),
      ...(section ? { section } : {}),
      published: true,
      OR: [{ publishAt: null }, { publishAt: { lte: now } }],
    },
  });
}
