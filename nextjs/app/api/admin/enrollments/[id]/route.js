import { prisma } from '@/lib/prisma';
import { getSessionUser, isManager } from '@/lib/auth';
import { archiveRejectedEnrollment } from '@/lib/enrollmentNotify';
import { removeLocalUploads } from '@/lib/uploadCleanup';

const ACTIONS = ['approve', 'reject'];

export async function PATCH(request, { params }) {
  const user = await getSessionUser();
  if (!user) return Response.json({ ok: false, error: 'ابتدا وارد شوید.' }, { status: 401 });
  if (!isManager(user)) return Response.json({ ok: false, error: 'دسترسی لازم را ندارید.' }, { status: 403 });

  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const action = body.action;
  const note = String(body.note || '').trim().slice(0, 400) || null;

  if (!ACTIONS.includes(action)) {
    return Response.json({ ok: false, error: 'عملیات نامعتبر است.' }, { status: 400 });
  }

  const enrollment = await prisma.enrollment.findUnique({ where: { id } });
  if (!enrollment) return Response.json({ ok: false, error: 'درخواست یافت نشد.' }, { status: 404 });

  // رد کردن = آرشیو در «بله» و سپس حذف کاملِ اطلاعات از سایت و سرور.
  // ترتیب مهم است: اگر آرشیو نرسد، هیچ چیزی حذف نمی‌شود.
  if (action === 'reject') {
    try {
      await archiveRejectedEnrollment(
        { ...enrollment, adminNote: note },
        { rejectedBy: user.displayName || user.username || null },
      );
    } catch (err) {
      console.error('archiveRejectedEnrollment failed:', err?.message || err);
      return Response.json({
        ok: false,
        error: 'گزارش و PDF این درخواست به ربات بله نرسید، پس هیچ اطلاعاتی حذف نشد. اتصال ربات را بررسی و دوباره تلاش کنید.',
      }, { status: 502 });
    }

    await prisma.enrollment.delete({ where: { id } });
    await removeLocalUploads([enrollment.videoUrl]);
    return Response.json({ ok: true, status: 'deleted' });
  }

  // تأیید: ساخت خودکار حساب کاربری بر اساس شماره موبایل و اتصال به درخواست.
  const account = await prisma.user.upsert({
    where: { phone: enrollment.phone },
    update: { displayName: enrollment.fullName },
    create: { phone: enrollment.phone, displayName: enrollment.fullName, role: 'member' },
  });

  await prisma.enrollment.update({
    where: { id },
    data: { status: 'approved', adminNote: note, userId: account.id },
  });

  return Response.json({ ok: true, status: 'approved' });
}
