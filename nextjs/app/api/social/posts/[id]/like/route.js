import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';
import { canUseSocial } from '@/lib/social';

// لایک/برداشتن لایک. شمارنده روی خودِ پست نگه داشته می‌شود تا فید برای شمردن
// لایک‌ها مجبور به کوئری اضافه نباشد.
export async function POST(request, { params }) {
  const user = await getSessionUser();
  if (!user) return Response.json({ ok: false, error: 'برای پسندیدن وارد شوید.' }, { status: 401 });
  if (!canUseSocial(user)) return Response.json({ ok: false, error: 'دسترسی لازم را ندارید.' }, { status: 403 });

  const { id } = await params;
  const post = await prisma.socialPost.findUnique({ where: { id }, select: { id: true, status: true } });
  if (!post || post.status !== 'published') {
    return Response.json({ ok: false, error: 'مطلب یافت نشد.' }, { status: 404 });
  }

  const existing = await prisma.socialLike.findUnique({
    where: { postId_userId: { postId: id, userId: user.id } },
    select: { id: true },
  });

  let liked;
  try {
    if (existing) {
      await prisma.$transaction([
        prisma.socialLike.delete({ where: { id: existing.id } }),
        prisma.socialPost.update({ where: { id }, data: { likeCount: { decrement: 1 } } }),
      ]);
      liked = false;
    } else {
      await prisma.$transaction([
        prisma.socialLike.create({ data: { postId: id, userId: user.id } }),
        prisma.socialPost.update({ where: { id }, data: { likeCount: { increment: 1 } } }),
      ]);
      liked = true;
    }
  } catch {
    // دو کلیک هم‌زمان روی یک پست؛ وضعیت واقعی را برمی‌گردانیم
    liked = !!(await prisma.socialLike.findUnique({
      where: { postId_userId: { postId: id, userId: user.id } },
      select: { id: true },
    }));
  }

  const fresh = await prisma.socialPost.findUnique({ where: { id }, select: { likeCount: true } });
  return Response.json({ ok: true, liked, likeCount: Math.max(0, fresh?.likeCount ?? 0) });
}
