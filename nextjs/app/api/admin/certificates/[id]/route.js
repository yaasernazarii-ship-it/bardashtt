import { prisma } from '@/lib/prisma';
import { getSessionUser, isManager } from '@/lib/auth';
import { setCertificatePhoto } from '@/lib/certificate';
import { removeLocalUploads } from '@/lib/uploadCleanup';

// ابطال/اعادهٔ گواهی، یا جایگزینیِ عکسِ روی آن.
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

  // تغییر عکسِ گواهیِ صادرشده: نشانیِ عکسِ تازه از /api/admin/certificates/photo می‌آید و
  // مقدار خالی یعنی عکس از روی گواهی برداشته شود.
  if ('photoUrl' in body) {
    const source = body.photoUrl ? String(body.photoUrl) : null;
    if (source && !/^\/media\/[A-Za-z0-9._-]+$/.test(source)) {
      return Response.json({ ok: false, error: 'عکس انتخاب‌شده معتبر نیست.' }, { status: 400 });
    }
    let updated;
    try {
      updated = await setCertificatePhoto(id, source);
    } catch {
      return Response.json({ ok: false, error: 'ثبت عکس ناموفق بود؛ دوباره تلاش کنید.' }, { status: 400 });
    }
    if (!updated) return Response.json({ ok: false, error: 'گواهی یافت نشد.' }, { status: 404 });
    return Response.json({ ok: true, item: { id: updated.id, serial: updated.serial, photoUrl: updated.photoUrl } });
  }

  if (typeof body.revoked !== 'boolean') {
    return Response.json({ ok: false, error: 'وضعیت نامعتبر است.' }, { status: 400 });
  }

  const updated = await prisma.certificate.update({ where: { id }, data: { revoked: body.revoked } });
  return Response.json({ ok: true, item: { id: updated.id, serial: updated.serial, revoked: updated.revoked } });
}

export async function DELETE(_request, { params }) {
  const manager = await getSessionUser();
  if (!manager) return Response.json({ ok: false, error: 'ابتدا وارد شوید.' }, { status: 401 });
  if (!isManager(manager)) return Response.json({ ok: false, error: 'دسترسی ندارید.' }, { status: 403 });

  const { id } = await params;
  const certificate = await prisma.certificate.findUnique({ where: { id }, select: { photoUrl: true } });
  if (!certificate) return Response.json({ ok: false, error: 'گواهی یافت نشد.' }, { status: 404 });

  await prisma.certificate.delete({ where: { id } });
  await removeLocalUploads([certificate.photoUrl]);
  return Response.json({ ok: true });
}
