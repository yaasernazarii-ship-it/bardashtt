import { prisma } from '@/lib/prisma';

// کتاب‌های منتشرشده برای نمایش در صفحهٔ «مسئولیت اجتماعی».
export async function liveBooks() {
  return prisma.book.findMany({
    where: { published: true },
    orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
  });
}

// یک کتابِ منتشرشده بر اساس slug (برای صفحهٔ ثبت سفارش).
export async function bookBySlug(slug) {
  return prisma.book.findFirst({ where: { slug, published: true } });
}
