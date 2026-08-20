import { prisma } from '@/lib/prisma';
import { getSessionUser, isManager } from '@/lib/auth';
import { logAction } from '@/lib/audit';
import { AUTHOR_SELECT, authorCard, removeUploadFile, scheduleCleanup, serializePost, visibleWhere } from '@/lib/social';

export const dynamic = 'force-dynamic';

// میز کار مدیر برای برداشتگرام: همهٔ حساب‌ها، گزارش‌های تخلف و محتوای منتشرشده.
// هیچ صفی برای «تأیید پیش از انتشار» وجود ندارد؛ کنترل مدیریت فقط حذف و مسدودسازی است.
export async function GET(request) {
  const user = await getSessionUser();
  if (!user) return Response.json({ ok: false, error: 'ابتدا وارد شوید.' }, { status: 401 });
  if (!isManager(user)) return Response.json({ ok: false, error: 'دسترسی لازم را ندارید.' }, { status: 403 });
  scheduleCleanup();

  const { searchParams } = new URL(request.url);
  const q = (searchParams.get('q') || '').trim();

  const [accounts, reports, published, stories] = await Promise.all([
    prisma.socialAccount.findMany({
      where: q
        ? {
            OR: [
              { username: { contains: q, mode: 'insensitive' } },
              { displayName: { contains: q, mode: 'insensitive' } },
              { phone: { contains: q } },
            ],
          }
        : undefined,
      orderBy: { createdAt: 'desc' },
      take: 200,
      select: {
        id: true,
        phone: true,
        username: true,
        displayName: true,
        photoUrl: true,
        active: true,
        blocked: true,
        createdAt: true,
        _count: { select: { posts: true } },
      },
    }),
    prisma.socialReport.findMany({
      where: { status: 'open' },
      orderBy: { createdAt: 'desc' },
      take: 60,
      include: {
        reporter: { select: AUTHOR_SELECT },
        post: { include: { author: { select: AUTHOR_SELECT } } },
        comment: { include: { author: { select: AUTHOR_SELECT } } },
      },
    }),
    prisma.socialPost.findMany({
      where: { kind: 'post', ...visibleWhere() },
      orderBy: { publishedAt: 'desc' },
      take: 60,
      include: { author: { select: AUTHOR_SELECT } },
    }),
    prisma.socialPost.findMany({
      where: { kind: 'story', ...visibleWhere() },
      orderBy: { publishedAt: 'desc' },
      take: 60,
      include: { author: { select: AUTHOR_SELECT } },
    }),
  ]);

  return Response.json({
    ok: true,
    isAdmin: isManager(user),
    accounts: accounts.map((a) => ({
      id: a.id,
      phone: a.phone,
      username: a.username,
      displayName: a.displayName,
      photoUrl: a.photoUrl,
      active: a.active,
      blocked: a.blocked,
      postCount: a._count.posts,
      createdAt: a.createdAt,
    })),
    reports: reports.map((r) => ({
      id: r.id,
      reason: r.reason,
      createdAt: r.createdAt,
      reporter: r.reporter ? authorCard(r.reporter) : null,
      post: r.post ? serializePost(r.post, { canModerate: true }) : null,
      comment: r.comment
        ? { id: r.comment.id, body: r.comment.body, author: authorCard(r.comment.author) }
        : null,
    })),
    published: published.map((p) => ({ ...serializePost(p, { canModerate: true }), authorId: p.authorId })),
    stories: stories.map((p) => ({ ...serializePost(p, { canModerate: true }), authorId: p.authorId })),
  });
}

// تعلیق حساب (جلوگیری از ورود) یا محرومیت از انتشار — مدیر و ادیتور.
export async function PATCH(request) {
  const user = await getSessionUser();
  if (!user) return Response.json({ ok: false, error: 'ابتدا وارد شوید.' }, { status: 401 });
  if (!isManager(user)) return Response.json({ ok: false, error: 'دسترسی لازم را ندارید.' }, { status: 403 });

  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ ok: false, error: 'درخواست نامعتبر است.' }, { status: 400 });
  }

  const userId = String(body.userId || '');
  const data = {};
  if (typeof body.blocked === 'boolean') data.blocked = body.blocked;
  if (typeof body.active === 'boolean') data.active = body.active;
  if (!userId || Object.keys(data).length === 0) {
    return Response.json({ ok: false, error: 'درخواست نامعتبر است.' }, { status: 400 });
  }

  const target = await prisma.socialAccount.update({
    where: { id: userId },
    data,
    select: { id: true, displayName: true, username: true, blocked: true, active: true },
  });

  const parts = [];
  if (typeof body.blocked === 'boolean') parts.push(target.blocked ? 'محروم از انتشار' : 'آزاد برای انتشار');
  if (typeof body.active === 'boolean') parts.push(target.active ? 'رفع تعلیق' : 'تعلیق حساب');
  await logAction(user, {
    action: 'social.member',
    targetType: 'socialAccount',
    targetId: userId,
    summary: `برداشتگرام — ${target.displayName || target.username || userId}: ${parts.join(' / ')}`,
  });

  return Response.json({ ok: true, account: { id: target.id, blocked: target.blocked, active: target.active } });
}

// حذف کامل و غیرقابل‌بازگشت یک حساب — در اختیار کادر مدیریت (مدیر و ادیتور).
export async function DELETE(request) {
  const user = await getSessionUser();
  if (!user) return Response.json({ ok: false, error: 'ابتدا وارد شوید.' }, { status: 401 });
  if (!isManager(user)) return Response.json({ ok: false, error: 'دسترسی لازم را ندارید.' }, { status: 403 });

  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ ok: false, error: 'درخواست نامعتبر است.' }, { status: 400 });
  }
  const userId = String(body.userId || '');
  if (!userId) return Response.json({ ok: false, error: 'درخواست نامعتبر است.' }, { status: 400 });

  const target = await prisma.socialAccount.findUnique({
    where: { id: userId },
    select: {
      id: true,
      displayName: true,
      username: true,
      photoUrl: true,
      posts: { select: { imageUrl: true } },
    },
  });
  if (!target) return Response.json({ ok: false, error: 'حساب یافت نشد.' }, { status: 404 });

  // حذف رکورد حساب؛ پست‌ها، نشست‌ها، لایک‌ها و نظرهای همین حساب با Cascade خودکار پاک می‌شوند.
  await prisma.socialAccount.delete({ where: { id: userId } });
  await Promise.all([...target.posts.map((p) => removeUploadFile(p.imageUrl)), removeUploadFile(target.photoUrl)]);

  await logAction(user, {
    action: 'social.member.delete',
    targetType: 'socialAccount',
    targetId: userId,
    summary: `برداشتگرام — حذف کامل حساب ${target.displayName || target.username || userId}`,
  });

  return Response.json({ ok: true });
}
