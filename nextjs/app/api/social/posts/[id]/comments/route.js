import { prisma } from '@/lib/prisma';
import { getSessionUser, isManager } from '@/lib/auth';
import { notifyUsers } from '@/lib/notifications';
import { AUTHOR_SELECT, MAX_COMMENT, authorCard, canUseSocial } from '@/lib/social';

export const dynamic = 'force-dynamic';

function serialize(c, viewer, manager) {
  return {
    id: c.id,
    body: c.body,
    createdAt: c.createdAt,
    author: authorCard(c.author),
    canDelete: manager || c.authorId === viewer?.id,
  };
}

export async function GET(request, { params }) {
  const { id } = await params;
  const viewer = await getSessionUser();
  const manager = isManager(viewer);
  const items = await prisma.socialComment.findMany({
    where: { postId: id },
    orderBy: { createdAt: 'asc' },
    take: 200,
    include: { author: { select: AUTHOR_SELECT } },
  });
  return Response.json({ ok: true, items: items.map((c) => serialize(c, viewer, manager)) });
}

export async function POST(request, { params }) {
  const user = await getSessionUser();
  if (!user) return Response.json({ ok: false, error: 'برای گذاشتن نظر وارد شوید.' }, { status: 401 });
  if (!canUseSocial(user)) return Response.json({ ok: false, error: 'دسترسی لازم را ندارید.' }, { status: 403 });

  const { id } = await params;
  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ ok: false, error: 'درخواست نامعتبر است.' }, { status: 400 });
  }
  const text = String(body.body || '').trim().slice(0, MAX_COMMENT);
  if (!text) return Response.json({ ok: false, error: 'متن نظر خالی است.' }, { status: 400 });

  const post = await prisma.socialPost.findUnique({
    where: { id },
    select: { id: true, status: true, authorId: true, kind: true },
  });
  if (!post || post.status !== 'published') {
    return Response.json({ ok: false, error: 'مطلب یافت نشد.' }, { status: 404 });
  }

  // سقف ساده روی سرعت نظر گذاشتن (۱۰ نظر در ۵ دقیقه) تا کسی فید را پر نکند.
  const recent = await prisma.socialComment.count({
    where: { authorId: user.id, createdAt: { gte: new Date(Date.now() - 5 * 60 * 1000) } },
  });
  if (recent >= 10) {
    return Response.json({ ok: false, error: 'کمی آرام‌تر؛ چند دقیقهٔ دیگر دوباره تلاش کنید.' }, { status: 429 });
  }

  const [comment] = await prisma.$transaction([
    prisma.socialComment.create({
      data: { postId: id, authorId: user.id, body: text },
      include: { author: { select: AUTHOR_SELECT } },
    }),
    prisma.socialPost.update({ where: { id }, data: { commentCount: { increment: 1 } } }),
  ]);

  if (post.authorId !== user.id) {
    await notifyUsers([post.authorId], {
      title: 'نظر تازه روی مطلب شما',
      body: `${user.displayName || user.username || 'یک کاربر'}: ${text.slice(0, 80)}`,
      href: '/community',
      kind: 'system',
    });
  }

  return Response.json({ ok: true, item: serialize(comment, user, isManager(user)) });
}
