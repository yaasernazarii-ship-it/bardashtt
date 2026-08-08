import { prisma } from '@/lib/prisma';
import { getSessionUser, isManager } from '@/lib/auth';

// ابطال یا اعادهٔ گواهی. گواهی هرگز حذف نمی‌شود تا استعلامِ کدِ صادرشده همیشه پاسخ داشته باشد.
export async function PATCH(request, { params }) {
  const manager = await getSessionUser();
  if (!manager) return Response.json({ ok: false, error: 'ابتدا وارد شوید.' }, { status: 401 });
  if (!isManager(manager)) return Response.json({ ok: false, error: 'دسترسی ندارید.' }, { status: 403 });

  const { id } = await params;
  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ ok: false, error: 'درخواست نامعتبر است.' }, { status: 400 });
  }

  if (typeof body.revoked !== 'boolean') {
    return Response.json({ ok: false, error: 'وضعیت نامعتبر است.' }, { status: 400 });
  }

  const updated = await prisma.certificate.update({ where: { id }, data: { revoked: body.revoked } });
  return Response.json({ ok: true, item: { id: updated.id, serial: updated.serial, revoked: updated.revoked } });
}
