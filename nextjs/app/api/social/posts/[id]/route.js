import { prisma } from '@/lib/prisma';
import { getSocialIdentity } from '@/lib/socialAuth';
import { logAction } from '@/lib/audit';
import { removeUploadFile } from '@/lib/social';

// حذفِ یک پست/استوری: نویسنده می‌تواند نوشتهٔ خودش را بردارد و مدیر یا ادیتور هر چیزی را،
// چون هیچ محتوایی دیگر پیش از انتشار بررسی نمی‌شود — تنها ابزار کنترل مدیریت همین حذف است.
export async function DELETE(request, { params }) {
  const identity = await getSocialIdentity();
  const user = identity.account || identity.manager;
  if (!user) return Response.json({ ok: false, error: 'ابتدا وارد شوید.' }, { status: 401 });

  const { id } = await params;
  const post = await prisma.socialPost.findUnique({
    where: { id },
    include: { author: { select: { id: true, displayName: true, username: true } } },
  });
  if (!post) return Response.json({ ok: false, error: 'مطلب یافت نشد.' }, { status: 404 });

  const manager = identity.canModerate;
  if (!manager && post.authorId !== user.id) {
    return Response.json({ ok: false, error: 'دسترسی لازم را ندارید.' }, { status: 403 });
  }

  await prisma.socialPost.delete({ where: { id } });
  await removeUploadFile(post.imageUrl);

  if (manager && post.authorId !== user.id) {
    const label = post.kind === 'story' ? 'استوری' : 'پست';
    await logAction(user, {
      action: 'social.delete',
      targetType: 'socialPost',
      targetId: id,
      summary: `حذف ${label} کاربر ${post.author?.displayName || post.author?.username || post.authorId}`,
    });
  }

  return Response.json({ ok: true });
}
