import { prisma } from '@/lib/prisma';

// اعلانِ همگانی (برای همهٔ کاربران واردشده). خطا نباید جریان اصلی (مثلاً انتشار مطلب) را بشکند.
export async function notifyAll({ title, body = null, href = null, kind = 'content' }) {
  if (!title) return;
  try {
    await prisma.notification.create({ data: { userId: null, title, body, href, kind } });
  } catch { /* اعلان حیاتی نیست */ }
}

// اعلانِ اختصاصی برای گروهی از کاربران (مثلاً اعضای یک کلاس).
export async function notifyUsers(userIds, { title, body = null, href = null, kind = 'content' }) {
  const ids = [...new Set((userIds || []).filter(Boolean))];
  if (!title || ids.length === 0) return;
  try {
    await prisma.notification.createMany({ data: ids.map((userId) => ({ userId, title, body, href, kind })) });
  } catch { /* اعلان حیاتی نیست */ }
}

// اعلان‌های قابل‌نمایش برای یک کاربر (همگانی + اختصاصیِ خودش) به‌همراه تعداد خوانده‌نشده.
export async function listNotifications(user, { take = 30 } = {}) {
  if (!user) return { items: [], unread: 0 };
  const readAt = user.notificationsReadAt || new Date(0);
  const visible = { OR: [{ userId: user.id }, { userId: null }] };
  const [items, unread] = await Promise.all([
    prisma.notification.findMany({ where: visible, orderBy: { createdAt: 'desc' }, take }),
    prisma.notification.count({ where: { AND: [visible, { createdAt: { gt: readAt } }] } }),
  ]);
  return { items, unread };
}

// علامت‌گذاری همهٔ اعلان‌ها به‌عنوان خوانده‌شده (زمان مشاهده را ثبت می‌کند).
export async function markAllRead(userId) {
  try {
    await prisma.user.update({ where: { id: userId }, data: { notificationsReadAt: new Date() } });
  } catch { /* ignore */ }
}
