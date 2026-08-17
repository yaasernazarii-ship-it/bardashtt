import { prisma } from '@/lib/prisma';
import { getSessionUser, isManager } from '@/lib/auth';
import { logAction } from '@/lib/audit';
import { notifyUsers } from '@/lib/notifications';
import { AUTHOR_SELECT, STORY_TTL_MS, removeUploadFile, serializePost } from '@/lib/social';

// حذفِ یک پست/استوری: نویسنده می‌تواند نوشتهٔ خودش را بردارد و مدیر می‌تواند هر چیزی را.
export async function DELETE(request, { params }) {
  const user = await getSessionUser();
  if (!user) return Response.json({ ok: false, error: 'ابتدا وارد شوید.' }, { status: 401 });

  const { id } = await params;
  const post = await prisma.socialPost.findUnique({
    where: { id },
    include: { author: { select: { id: true, displayName: true, username: true } } },
  });
  if (!post) return Response.json({ ok: false, error: 'مطلب یافت نشد.' }, { status: 404 });

  const manager = isManager(user);
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
    await notifyUsers([post.authorId], {
      title: `${label} شما حذف شد`,
      body: 'یکی از مطالب شما در شبکهٔ اجتماعی برداشت توسط مدیریت برداشته شد.',
      href: '/dashboard/social',
      kind: 'system',
    });
  }

  return Response.json({ ok: true });
}

// تأیید یا رد محتوا — فقط مدیر/ادیتور.
export async function PATCH(request, { params }) {
  const user = await getSessionUser();
  if (!user) return Response.json({ ok: false, error: 'ابتدا وارد شوید.' }, { status: 401 });
  if (!isManager(user)) return Response.json({ ok: false, error: 'دسترسی لازم را ندارید.' }, { status: 403 });

  const { id } = await params;
  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ ok: false, error: 'درخواست نامعتبر است.' }, { status: 400 });
  }
  const action = body.action === 'reject' ? 'reject' : 'approve';

  const post = await prisma.socialPost.findUnique({ where: { id } });
  if (!post) return Response.json({ ok: false, error: 'مطلب یافت نشد.' }, { status: 404 });

  const now = new Date();
  const reviewer = {
    reviewedById: user.id,
    reviewedByName: user.displayName || user.username || null,
    reviewedAt: now,
  };
  const label = post.kind === 'story' ? 'استوری' : 'پست';

  let data;
  if (action === 'approve') {
    // ساعتِ ۲۴ ساعتهٔ استوری از لحظهٔ تأیید شروع می‌شود، نه از لحظهٔ ارسال؛
    // وگرنه استوری‌ای که دیر بررسی شود عملاً مرده منتشر می‌شد.
    data = {
      ...reviewer,
      status: 'published',
      rejectReason: null,
      publishedAt: now,
      expiresAt: post.kind === 'story' ? new Date(now.getTime() + STORY_TTL_MS) : null,
    };
  } else {
    data = {
      ...reviewer,
      status: 'rejected',
      publishedAt: null,
      expiresAt: null,
      rejectReason: String(body.reason || '').trim().slice(0, 300) || null,
    };
  }

  const updated = await prisma.socialPost.update({
    where: { id },
    data,
    include: { author: { select: AUTHOR_SELECT } },
  });

  await logAction(user, {
    action: action === 'approve' ? 'social.approve' : 'social.reject',
    targetType: 'socialPost',
    targetId: id,
    summary: `${action === 'approve' ? 'تأیید' : 'رد'} ${label} کاربر ${updated.author?.displayName || updated.author?.username || post.authorId}`,
  });

  await notifyUsers([post.authorId], {
    title: action === 'approve' ? `${label} شما منتشر شد` : `${label} شما تأیید نشد`,
    body: action === 'approve'
      ? 'مطلب شما در شبکهٔ اجتماعی برداشت منتشر شد.'
      : (data.rejectReason ? `دلیل: ${data.rejectReason}` : 'برای جزئیات به بخش شبکهٔ اجتماعی در پنل خود سر بزنید.'),
    href: action === 'approve' ? '/community' : '/dashboard/social',
    kind: 'system',
  });

  return Response.json({ ok: true, item: serializePost(updated, { canModerate: true }) });
}
