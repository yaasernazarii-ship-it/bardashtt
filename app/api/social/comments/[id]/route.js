import { prisma } from '@/lib/prisma';
import { getSocialIdentity } from '@/lib/socialAuth';
import { logAction } from '@/lib/audit';

// حذف نظر: نویسندهٔ نظر یا مدیر. شمارندهٔ پست هم هم‌زمان کم می‌شود.
export async function DELETE(request, { params }) {
  const identity = await getSocialIdentity();
  const user = identity.account || identity.manager;
  if (!user) return Response.json({ ok: false, error: 'ابتدا وارد شوید.' }, { status: 401 });

  const { id } = await params;
  const comment = await prisma.socialComment.findUnique({
    where: { id },
    include: { author: { select: { displayName: true, username: true } } },
  });
  if (!comment) return Response.json({ ok: false, error: 'نظر یافت نشد.' }, { status: 404 });

  const manager = identity.canModerate;
  if (!manager && comment.authorId !== user.id) {
    return Response.json({ ok: false, error: 'دسترسی لازم را ندارید.' }, { status: 403 });
  }

  await prisma.$transaction([
    prisma.socialComment.delete({ where: { id } }),
    prisma.socialPost.update({ where: { id: comment.postId }, data: { commentCount: { decrement: 1 } } }),
  ]);

  if (manager && comment.authorId !== user.id) {
    await logAction(user, {
      action: 'social.comment.delete',
      targetType: 'socialComment',
      targetId: id,
      summary: `حذف نظر کاربر ${comment.author?.displayName || comment.author?.username || comment.authorId}`,
    });
  }

  return Response.json({ ok: true });
}
