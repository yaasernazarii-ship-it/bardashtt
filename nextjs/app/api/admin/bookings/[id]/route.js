import { prisma } from '@/lib/prisma';
import { getSessionUser, isManager } from '@/lib/auth';

const STATUSES = ['new', 'contacted', 'done', 'rejected'];

export async function PATCH(request, { params }) {
  const user = await getSessionUser();
  if (!user) return Response.json({ ok: false, error: 'ابتدا وارد شوید.' }, { status: 401 });
  if (!isManager(user)) return Response.json({ ok: false, error: 'دسترسی لازم را ندارید.' }, { status: 403 });

  const { id } = await params;
  try {
    const b = await request.json();
    const data = {};
    if (b.status !== undefined) {
      if (!STATUSES.includes(b.status)) return Response.json({ ok: false, error: 'وضعیت نامعتبر است.' }, { status: 400 });
      data.status = b.status;
    }
    if (b.adminNote !== undefined) data.adminNote = String(b.adminNote || '').trim().slice(0, 1000) || null;

    const booking = await prisma.bookingRequest.update({ where: { id }, data });
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
