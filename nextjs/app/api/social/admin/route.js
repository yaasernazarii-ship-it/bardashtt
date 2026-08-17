import { prisma } from '@/lib/prisma';
import { getSessionUser, isManager } from '@/lib/auth';
import { logAction } from '@/lib/audit';
import { AUTHOR_SELECT, authorCard, scheduleCleanup, serializePost, visibleWhere } from '@/lib/social';

export const dynamic = 'force-dynamic';

// میز کار مدیر برای شبکهٔ اجتماعی: صف بررسی، گزارش‌های تخلف و محتوای منتشرشده.
export async function GET() {
  const user = await getSessionUser();
  if (!user) return Response.json({ ok: false, error: 'ابتدا وارد شوید.' }, { status: 401 });
  if (!isManager(user)) return Response.json({ ok: false, error: 'دسترسی لازم را ندارید.' }, { status: 403 });
  scheduleCleanup();

  const [pending, reports, published, stories] = await Promise.all([
    prisma.socialPost.findMany({
      where: { status: 'pending' },
      orderBy: { createdAt: 'asc' },
      take: 100,
      include: { author: { select: { ...AUTHOR_SELECT, socialTrusted: true, socialBlocked: true } } },
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
    pending: pending.map((p) => ({
      ...serializePost(p, { canModerate: true }),
      authorTrusted: p.author?.socialTrusted || false,
      authorBlocked: p.author?.socialBlocked || false,
      authorId: p.authorId,
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

// تغییر وضعیت انتشارِ یک کاربر: «انتشار بدون بررسی» یا «محرومیت از انتشار».
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
  if (typeof body.trusted === 'boolean') data.socialTrusted = body.trusted;
  if (typeof body.blocked === 'boolean') data.socialBlocked = body.blocked;
  if (!userId || Object.keys(data).length === 0) {
    return Response.json({ ok: false, error: 'درخواست نامعتبر است.' }, { status: 400 });
  }

  const target = await prisma.user.update({
    where: { id: userId },
    data,
    select: { id: true, displayName: true, username: true, socialTrusted: true, socialBlocked: true },
  });

  await logAction(user, {
    action: 'social.member',
    targetType: 'user',
    targetId: userId,
    summary: `شبکهٔ اجتماعی — ${target.displayName || target.username || userId}: ${
      target.socialBlocked ? 'محروم از انتشار' : target.socialTrusted ? 'انتشار بدون بررسی' : 'انتشار با بررسی مدیر'
    }`,
  });

  return Response.json({ ok: true, user: { id: target.id, trusted: target.socialTrusted, blocked: target.socialBlocked } });
}
