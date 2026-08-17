import { unlink } from 'fs/promises';
import path from 'path';
import { prisma } from '@/lib/prisma';
import { isManager } from '@/lib/auth';

// ── قواعد شبکهٔ اجتماعی برداشت ──────────────────────────────────────────
// «عضو شبکه» = هنرجو، فیلم‌ساز، ادمین و ادیتور. فقط این‌ها می‌توانند پست/استوری،
// لایک و کامنت بگذارند. تماشای فید برای همه (حتی مهمانِ وارد نشده) آزاد است.

export const STORY_TTL_MS = 24 * 60 * 60 * 1000;
export const MAX_CAPTION = 600;
export const MAX_COMMENT = 400;

// سقف انتشار روزانه برای هر کاربر؛ جلوی پر شدن دیسک و اسپم را می‌گیرد.
export const DAILY_POST_LIMIT = 10;

export function canUseSocial(user) {
  if (!user) return false;
  if (user.socialBlocked) return false;
  return user.role === 'student' || user.role === 'filmmaker' || isManager(user);
}

// آیا نوشتهٔ این کاربر باید پیش از انتشار بررسی شود؟
// مدیرها و کاربرانی که مدیر برایشان «انتشار بدون بررسی» را روشن کرده، مستقیم منتشر می‌شوند.
export function needsReview(user) {
  return !isManager(user) && !user?.socialTrusted;
}

// شناسهٔ عمومیِ کاربر در نشانی پروفایل: نام کاربری اگر داشته باشد، وگرنه شناسهٔ حساب.
export function handleOf(user) {
  return user?.username || user?.id || '';
}

export function roleLabel(user) {
  if (!user) return '';
  if (user.role === 'admin') return 'مدیر سامانه';
  if (user.role === 'editor') return 'ادیتور';
  if (user.role === 'filmmaker') return user.company || 'فیلم‌ساز';
  if (user.role === 'student') {
    if (user.graduated) return user.courseTitle ? `فارغ‌التحصیل ${user.courseTitle}` : 'فارغ‌التحصیل';
    return user.courseTitle ? `هنرجوی ${user.courseTitle}` : 'هنرجو';
  }
  return 'عضو خانواده برداشت';
}

// فیلدهای کاربری که در فید عمومی نشان داده می‌شوند. هیچ داده‌ای از رزومه، شماره تماس،
// کد ملی یا کلاس اینجا نمی‌آید — پروفایل شبکه فقط به حساب کاربری وصل است.
export const AUTHOR_SELECT = {
  id: true,
  username: true,
  displayName: true,
  photoUrl: true,
  role: true,
  company: true,
  courseTitle: true,
  graduated: true,
};

export function authorCard(user) {
  if (!user) return { handle: '', name: 'کاربر حذف‌شده', photoUrl: null, roleLabel: '' };
  return {
    handle: handleOf(user),
    name: user.displayName || user.username || 'کاربر',
    photoUrl: user.photoUrl || null,
    roleLabel: roleLabel(user),
  };
}

// شرطِ «دیده‌شدنی» برای فید عمومی. استوریِ منقضی حتی اگر فایلش هنوز پاک نشده باشد
// از این فیلتر رد نمی‌شود؛ پس نمایش هرگز به اجرای پاک‌سازی وابسته نیست.
export function visibleWhere(now = new Date()) {
  return {
    status: 'published',
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
    status: post.status,
    rejectReason: post.rejectReason,
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
    const staleStory = new Date(now - 7 * 24 * 60 * 60 * 1000); // استوریِ بررسی‌نشده پس از ۷ روز دیگر موضوعیت ندارد
    const oldRejected = new Date(now - 30 * 24 * 60 * 60 * 1000); // محتوای ردشده پس از ۳۰ روز پاک می‌شود
    const expired = await prisma.socialPost.findMany({
      where: {
        OR: [
          { kind: 'story', expiresAt: { lt: new Date(now) } },
          { kind: 'story', status: { not: 'published' }, createdAt: { lt: staleStory } },
          { status: 'rejected', createdAt: { lt: oldRejected } },
        ],
      },
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
