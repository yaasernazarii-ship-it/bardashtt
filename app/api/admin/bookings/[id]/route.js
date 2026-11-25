import { prisma } from '@/lib/prisma';
import { getSessionUser, isManager } from '@/lib/auth';
import { notifyUsers } from '@/lib/notifications';

const STATUSES = ['new', 'contacted', 'done', 'rejected'];

// متن اعلانی که فیلمساز پس از تغییر وضعیت درخواستش می‌بیند.
const STATUS_NOTICE = {
  contacted: 'درخواست ست تایم شما در حال پیگیری است',
  done: 'هماهنگی ست تایم شما انجام شد',
  rejected: 'درخواست ست تایم شما بسته شد',
};

export async function PATCH(request, { params }) {
  const user = await getSessionUser();
  if (!user) return Response.json({ ok: false, error: 'ابتدا وارد شوید.' }, { status: 401 });
  if (!isManager(user)) return Response.json({ ok: false, error: 'دسترسی لازم را ندارید.' }, { status: 403 });

  const { id } = await params;
  try {
    const b = await request.json();
    const before = await prisma.bookingRequest.findUnique({ where: { id } });
    if (!before) return Response.json({ ok: false, error: 'درخواست یافت نشد.' }, { status: 404 });

    const data = {};
    if (b.status !== undefined) {
      if (!STATUSES.includes(b.status)) return Response.json({ ok: false, error: 'وضعیت نامعتبر است.' }, { status: 400 });
      data.status = b.status;
    }
    if (b.adminNote !== undefined) data.adminNote = String(b.adminNote || '').trim().slice(0, 1000) || null;
    // پاسخ به فیلمساز — برخلاف adminNote، این متن در داشبورد خودِ فیلمساز دیده می‌شود.
    if (b.reply !== undefined) {
      const reply = String(b.reply || '').trim().slice(0, 1000) || null;
      data.reply = reply;
      data.replyAt = reply ? new Date() : null;
    }

    const booking = await prisma.bookingRequest.update({ where: { id }, data });

    // اعلان به فیلمساز: وقتی وضعیت عوض شود یا پاسخ تازه‌ای نوشته شود.
    if (booking.userId) {
      const statusChanged = data.status && data.status !== before.status;
      const replyChanged = data.reply !== undefined && data.reply && data.reply !== before.reply;
      if (statusChanged || replyChanged) {
        await notifyUsers([booking.userId], {
          title: statusChanged ? (STATUS_NOTICE[booking.status] || 'وضعیت درخواست ست تایم شما به‌روز شد') : 'پاسخ تازه برای درخواست ست تایم شما',
          body: `بازیگر: ${booking.actorName}${booking.reply ? `\n${booking.reply}` : ''}`,
          href: '/dashboard/requests',
          kind: 'booking',
        });
      }
    }

    return Response.json({ ok: true, booking });
  } catch {
    return Response.json({ ok: false, error: 'به‌روزرسانی انجام نشد.' }, { status: 400 });
  }
}

export async function DELETE(request, { params }) {
  const user = await getSessionUser();
  if (!user) return Response.json({ ok: false, error: 'ابتدا وارد شوید.' }, { status: 401 });
  if (!isManager(user)) return Response.json({ ok: false, error: 'دسترسی لازم را ندارید.' }, { status: 403 });

  const { id } = await params;
  try {
    await prisma.bookingRequest.delete({ where: { id } });
    return Response.json({ ok: true });
  } catch {
    return Response.json({ ok: false, error: 'حذف انجام نشد.' }, { status: 400 });
  }
}
