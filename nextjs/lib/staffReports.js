import { prisma } from '@/lib/prisma';

// منطق مشترکِ «گزارش کار تیمی» (ادمین و ادیتور). همهٔ روت‌های این بخش قبل از هر کاری
// باید requireManager را صدا بزنند؛ هیچ نقش دیگری نباید حتی وجود این داده‌ها را ببیند.

export const CATEGORIES = {
  report: 'گزارش کار',
  issue: 'مشکل و اشکال',
  request: 'درخواست و یادآوری',
};

export const STATUSES = { open: 'باز', done: 'انجام‌شده' };

export const LIMITS = { title: 120, body: 4000, comment: 2000 };

// متن ورودی: فقط متن ساده ذخیره می‌شود (هیچ HTML‌ای رندر نمی‌کنیم) و بایت null حذف می‌شود
// چون PostgreSQL آن را در ستون text نمی‌پذیرد.
export function cleanText(value, max) {
  return String(value ?? '').replace(/\u0000/g, '').replace(/\r\n/g, '\n').trim().slice(0, max);
}

export function displayNameOf(user) {
  return user?.displayName || user?.username || user?.phone || 'همکار';
}

// شناسهٔ سایر مدیران فعال، برای اعلانِ «گزارش تازه». نویسنده به خودش اعلان نمی‌دهد.
export async function otherManagerIds(exceptUserId) {
  const rows = await prisma.user.findMany({
    where: { role: { in: ['admin', 'editor'] }, active: true, id: { not: exceptUserId } },
    select: { id: true },
  });
  return rows.map((r) => r.id);
}

// فهرست همکارانِ فعالِ تیم مدیریت (برای انتخاب گیرندهٔ گزارش و شروع گفت‌وگو).
// هر ادیتورِ تازه‌ای که ادمین اضافه کند، بدون هیچ تنظیم دیگری خودش در این فهرست می‌آید.
export async function listColleagues(exceptUserId) {
  const rows = await prisma.user.findMany({
    where: { role: { in: ['admin', 'editor'] }, active: true, ...(exceptUserId ? { id: { not: exceptUserId } } : {}) },
    orderBy: [{ role: 'asc' }, { displayName: 'asc' }],
    select: { id: true, displayName: true, username: true, phone: true, role: true },
  });
  return rows.map((u) => ({ id: u.id, name: displayNameOf(u), role: u.role }));
}

// گیرندهٔ گزارش: باید یکی از مدیرانِ فعال و غیر از خودِ نویسنده باشد؛ در غیر این صورت «همهٔ تیم».
export async function resolveTarget(targetId, authorId) {
  if (!targetId || typeof targetId !== 'string' || targetId === authorId) return { targetId: null, targetName: null };
  const target = await prisma.user.findFirst({
    where: { id: targetId, role: { in: ['admin', 'editor'] }, active: true },
    select: { id: true, displayName: true, username: true, phone: true },
  });
  if (!target) return { targetId: null, targetName: null };
  return { targetId: target.id, targetName: displayNameOf(target) };
}

export function serializeReport(r, viewer) {
  return {
    id: r.id,
    title: r.title,
    body: r.body,
    category: r.category,
    status: r.status,
    authorId: r.authorId,
    authorName: r.authorName,
    authorRole: r.authorRole,
    targetId: r.targetId || null,
    targetName: r.targetName || null,
    doneByName: r.doneByName,
    doneAt: r.doneAt ? r.doneAt.toISOString() : null,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
    edited: r.updatedAt.getTime() - r.createdAt.getTime() > 1000,
    // اجازه‌ها را سرور تعیین می‌کند؛ کلاینت فقط دکمه را نشان می‌دهد و باز هم در سرور بررسی می‌شود.
    canEdit: !!viewer && r.authorId === viewer.id,
    canDelete: !!viewer && (r.authorId === viewer.id || viewer.role === 'admin'),
    comments: (r.comments || []).map((c) => ({
      id: c.id,
      body: c.body,
      authorId: c.authorId,
      authorName: c.authorName,
      authorRole: c.authorRole,
      createdAt: c.createdAt.toISOString(),
      canDelete: !!viewer && (c.authorId === viewer.id || viewer.role === 'admin'),
    })),
  };
}
