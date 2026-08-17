import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';

// گزارش تخلف. هر کاربرِ واردشده (حتی عضو عادی که اجازهٔ انتشار ندارد) می‌تواند گزارش بدهد،
// چون گزارش دادن ابزارِ محافظت است نه انتشار.
export async function POST(request) {
  const user = await getSessionUser();
  if (!user) return Response.json({ ok: false, error: 'برای گزارش تخلف وارد شوید.' }, { status: 401 });

  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ ok: false, error: 'درخواست نامعتبر است.' }, { status: 400 });
  }

  const postId = body.postId ? String(body.postId) : null;
  const commentId = body.commentId ? String(body.commentId) : null;
  if (!postId && !commentId) return Response.json({ ok: false, error: 'موردی برای گزارش انتخاب نشده.' }, { status: 400 });
  const reason = String(body.reason || '').trim().slice(0, 300) || 'بدون توضیح';

  // گزارش تکراریِ همان کاربر روی همان مورد، دوباره ثبت نمی‌شود.
  const dup = await prisma.socialReport.findFirst({
    where: { reporterId: user.id, postId, commentId, status: 'open' },
    select: { id: true },
  });
  if (dup) return Response.json({ ok: true, already: true });

  await prisma.socialReport.create({ data: { postId, commentId, reporterId: user.id, reason } });
  if (postId) {
    await prisma.socialPost.update({ where: { id: postId }, data: { reportCount: { increment: 1 } } }).catch(() => {});
  }

  return Response.json({ ok: true });
}
