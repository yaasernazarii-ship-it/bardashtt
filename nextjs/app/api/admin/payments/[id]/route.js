import { prisma } from '@/lib/prisma';
import { getSessionUser, isManager } from '@/lib/auth';
import { notifyPayment } from '@/lib/paymentNotify';
import { sendPurchaseSms } from '@/lib/purchaseSms';
import { grantCourseAccess } from '@/lib/onlineCourses';

export async function PATCH(request, { params }) {
  const user = await getSessionUser();
  if (!user) return Response.json({ ok: false, error: 'ابتدا وارد شوید.' }, { status: 401 });
  if (!isManager(user)) return Response.json({ ok: false, error: 'دسترسی لازم را ندارید.' }, { status: 403 });

  const { id } = await params;
  try {
    const b = await request.json();
    const action = String(b.action || '');

    const current = await prisma.payment.findUnique({
      where: { id },
      include: { user: { select: { displayName: true, phone: true } } },
    });
    if (!current) return Response.json({ ok: false, error: 'پرداخت یافت نشد.' }, { status: 404 });

    if (action === 'markPaid') {
      if (current.status === 'paid') return Response.json({ ok: false, error: 'این پرداخت قبلاً پرداخت‌شده ثبت شده است.' }, { status: 400 });
      const updated = await prisma.payment.update({
        where: { id },
        data: { status: 'paid', method: 'manual', paidAt: new Date() },
      });
      // اگر پرداختِ خریدِ یک دورهٔ آنلاین باشد، با paid شدن دسترسیِ دوره خودکار داده می‌شود.
      if (updated.courseId) {
        await grantCourseAccess(updated.userId, updated.courseId, { source: 'payment', grantedById: user.id });
      }
      // گزارش آنی به بله
      await notifyPayment(updated, current.user);
      // پیامک تأیید خرید برای خودِ خریدار
      await sendPurchaseSms({
        kind: 'course',
        phone: current.user?.phone,
        name: current.user?.displayName,
        title: updated.courseTitle || updated.title,
        amount: updated.amount,
      });
      return Response.json({ ok: true, payment: { ...updated, paidAt: updated.paidAt?.toISOString() || null } });
    }

    if (action === 'cancel') {
      const updated = await prisma.payment.update({ where: { id }, data: { status: 'canceled' } });
      return Response.json({ ok: true, payment: { ...updated, paidAt: updated.paidAt?.toISOString() || null } });
    }

    if (action === 'reopen') {
      const updated = await prisma.payment.update({ where: { id }, data: { status: 'pending', method: null, paidAt: null } });
      return Response.json({ ok: true, payment: { ...updated, paidAt: null } });
    }

    return Response.json({ ok: false, error: 'عملیات نامعتبر است.' }, { status: 400 });
  } catch {
    return Response.json({ ok: false, error: 'درخواست نامعتبر است.' }, { status: 400 });
  }
}

export async function DELETE(request, { params }) {
  const user = await getSessionUser();
  if (!user) return Response.json({ ok: false, error: 'ابتدا وارد شوید.' }, { status: 401 });
  if (!isManager(user)) return Response.json({ ok: false, error: 'دسترسی لازم را ندارید.' }, { status: 403 });

  const { id } = await params;
  try {
    await prisma.payment.delete({ where: { id } });
    return Response.json({ ok: true });
  } catch {
    return Response.json({ ok: false, error: 'پرداخت یافت نشد.' }, { status: 404 });
  }
}
