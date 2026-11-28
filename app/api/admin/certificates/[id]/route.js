import { prisma } from '@/lib/prisma';
import { getSessionUser, isManager } from '@/lib/auth';
import { setCertificatePhoto } from '@/lib/certificate';
import { buildSerial } from '@/lib/exam';
import { normalizeNationalId, isValidNationalId } from '@/lib/enrollmentData';
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

  if ('nationalId' in body) {
    const nationalId = normalizeNationalId(body.nationalId);
    if (!isValidNationalId(nationalId)) {
      return Response.json({ ok: false, error: 'کد ملی معتبر ۱۰ رقمی را وارد کنید.' }, { status: 400 });
    }

    const certificate = await prisma.certificate.findUnique({ where: { id }, select: { id: true, userId: true } });
    if (!certificate) return Response.json({ ok: false, error: 'گواهی یافت نشد.' }, { status: 404 });

    let serial = null;
    for (let seq = 1; seq <= 20; seq++) {
      const candidate = buildSerial(nationalId, seq);
      const used = await prisma.certificate.findUnique({ where: { serial: candidate }, select: { id: true } });
      if (!used || used.id === certificate.id) {
        serial = candidate;
        break;
      }
    }
    if (!serial) return Response.json({ ok: false, error: 'ساخت کد استعلام یکتا ممکن نشد.' }, { status: 409 });

    const updated = await prisma.$transaction(async (tx) => {
      const item = await tx.certificate.update({ where: { id }, data: { nationalId, serial } });
      await tx.user.update({ where: { id: certificate.userId }, data: { nationalId } });
      return item;
    });
    return Response.json({ ok: true, item: { id: updated.id, serial: updated.serial, nationalId: updated.nationalId } });
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
