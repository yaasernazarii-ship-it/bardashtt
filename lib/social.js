import { unlink } from 'fs/promises';
import path from 'path';
// مسیر نسبی عمداً به‌جای alias «@/» است: این فایل هم از داخل Next.js و هم مستقیم با
// `node tools/social-cleanup.mjs` (کرون سرور) اجرا می‌شود؛ alias فقط زیر بیلدِ Next resolve می‌شود.
import { prisma } from './prisma.js';

export const STORY_TTL_MS = 24 * 60 * 60 * 1000;
export const MAX_CAPTION = 600;
export const MAX_COMMENT = 400;
export const DAILY_POST_LIMIT = 10;

// همهٔ حساب‌های فعال برداشتگرام می‌توانند منتشر کنند؛ مسدودی فقط در اختیار مدیر و ادیتور است.
export function canUseSocial(account) {
  return !!account && account.active !== false && !account.blocked;
}

export function handleOf(account) {
  return account?.username || account?.id || '';
}

export const AUTHOR_SELECT = {
  id: true,
  userId: true,
  username: true,
  displayName: true,
  photoUrl: true,
  bio: true,
  active: true,
  blocked: true,
};

export function authorCard(account) {
  if (!account) return { handle: '', name: 'کاربر حذف‌شده', photoUrl: null, roleLabel: '' };
  return {
    handle: handleOf(account),
    name: account.displayName || account.username || 'کاربر',
    photoUrl: account.photoUrl || null,
    roleLabel: account.userId && account.username === `u_${account.userId}`
      ? 'عضو خانواده برداشت'
      : `@${account.username}`,
  };
}

// شرطِ «دیده‌شدنی» برای فید عمومی. هر پستی که هنوز در دیتابیس هست منتشرشده حساب می‌شود
// (دیگر حالت «در انتظار بررسی مدیر» وجود ندارد). استوریِ منقضی حتی اگر فایلش هنوز پاک نشده
// باشد از این فیلتر رد نمی‌شود؛ پس نمایش هرگز به اجرای پاک‌سازی وابسته نیست.
export function visibleWhere(now = new Date()) {
  return {
    OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
  };
}

export function serializePost(post, { viewerLiked = false, canModerate = false, isOwner = false } = {}) {
  return {
    id: post.id,
    kind: post.kind,
    imageUrl: post.imageUrl,
    aparatUrl: post.aparatUrl,
    caption: post.caption,
    publishedAt: post.publishedAt,
    expiresAt: post.expiresAt,
    createdAt: post.createdAt,
    likeCount: post.likeCount,
    commentCount: post.commentCount,
    reportCount: canModerate ? post.reportCount : undefined,
    liked: viewerLiked,
    canDelete: canModerate || isOwner,
    author: authorCard(post.author),
  };
}

// حذف امنِ فایل آپلودشده. فقط نامِ سادهٔ فایل داخل پوشهٔ uploads پذیرفته می‌شود
// تا هیچ نشانی دستکاری‌شده‌ای نتواند فایلی بیرون از آن پوشه را پاک کند.
export async function removeUploadFile(url) {
  const m = /^\/media\/([A-Za-z0-9._-]+)$/.exec(String(url || ''));
  if (!m || m[1].includes('..')) return;
  try {
    await unlink(path.join(process.cwd(), 'uploads', m[1]));
  } catch { /* فایل قبلاً پاک شده یا وجود ندارد */ }
}

// ── پاک‌سازی استوری‌های منقضی ────────────────────────────────────────────
// این کار عمداً «سبک و بی‌سروصدا» طراحی شده تا هرگز روی سرعت سایت اثر نگذارد:
//   ۱) نمایش هیچ ربطی به آن ندارد (فیلتر expiresAt همیشه فعال است)،
//   ۲) حداکثر یک بار در ساعت اجرا می‌شود (نگهبانِ حافظه‌ای)،
//   ۳) هر بار حداکثر BATCH رکورد را برمی‌دارد، پس حتی با انبوهِ عقب‌افتاده هم جهش ایجاد نمی‌کند،
//   ۴) بدون await صدا زده می‌شود و خطایش هیچ‌وقت پاسخِ کاربر را نمی‌شکند.
// این نسخهٔ «سبک» فقط برای مسیرهای پرتردد است؛ پاک‌سازیِ قطعی و واقعیِ فایل‌ها روی
// سرور با tools/social-cleanup.mjs و کرون ساعتی انجام می‌شود (force: true).
const CLEANUP_EVERY_MS = 60 * 60 * 1000;
const CLEANUP_BATCH = 200;
let lastCleanupAt = 0;
let cleanupRunning = false;

export async function cleanupExpiredStories({ force = false } = {}) {
  const now = Date.now();
  if (!force && (cleanupRunning || now - lastCleanupAt < CLEANUP_EVERY_MS)) return 0;
  cleanupRunning = true;
  lastCleanupAt = now;
  let removed = 0;
  try {
    const expired = await prisma.socialPost.findMany({
      where: { kind: 'story', expiresAt: { lt: new Date(now) } },
      select: { id: true, imageUrl: true },
      take: CLEANUP_BATCH,
    });
    if (expired.length === 0) return 0;
    await prisma.socialPost.deleteMany({ where: { id: { in: expired.map((p) => p.id) } } });
    for (const p of expired) await removeUploadFile(p.imageUrl);
    removed = expired.length;
  } catch { /* پاک‌سازی حیاتی نیست؛ دفعهٔ بعد دوباره تلاش می‌شود */ } finally {
    cleanupRunning = false;
  }
  return removed;
}

// فراخوانیِ بدون انتظار: در مسیرهای پرتردد استفاده می‌شود.
export function scheduleCleanup() {
  cleanupExpiredStories().catch(() => {});
}
