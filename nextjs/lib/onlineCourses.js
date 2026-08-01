import { prisma } from '@/lib/prisma';

// دوره‌های منتشرشده برای نمایش در صفحهٔ فروش (بدون ویدیوهای محافظت‌شده).
export async function liveCourses() {
  return prisma.course.findMany({
    where: { published: true },
    orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
    include: { _count: { select: { lessons: true } } },
  });
}

// یک دورهٔ منتشرشده بر اساس slug. ویدیوهای دوره فقط وقتی خوانده می‌شوند که withLessons خواسته شود
// (و صدازننده باید خودش دسترسیِ کاربر را بررسی کند پیش از ارسال به کلاینت).
export async function courseBySlug(slug, { withLessons = false } = {}) {
  return prisma.course.findFirst({
    where: { slug, published: true },
    include: {
      _count: { select: { lessons: true } },
      ...(withLessons ? { lessons: { orderBy: { order: 'asc' } } } : {}),
    },
  });
}

// آیا کاربر به این دوره دسترسی (خرید) دارد؟
export async function userHasCourseAccess(userId, courseId) {
  if (!userId || !courseId) return false;
  const row = await prisma.courseAccess.findUnique({
    where: { userId_courseId: { userId, courseId } },
    select: { id: true },
  });
  return !!row;
}

// اعطای دسترسیِ دوره به کاربر (بدون تکرار؛ اگر از قبل باشد بی‌اثر است).
export async function grantCourseAccess(userId, courseId, { source = 'manual', grantedById = null } = {}) {
  return prisma.courseAccess.upsert({
    where: { userId_courseId: { userId, courseId } },
    update: {},
    create: { userId, courseId, source, grantedById },
  });
}
