import { prisma } from '@/lib/prisma';
import { getSessionUser, isManager } from '@/lib/auth';
import { issueCertificate } from '@/lib/certificate';
import { notifyUsers } from '@/lib/notifications';

function serialize(c) {
  return {
    id: c.id,
    serial: c.serial,
    fullName: c.fullName,
    gender: c.gender,
    nationalId: c.nationalId,
    courseTitle: c.courseTitle,
    branch: c.branch,
    percent: c.percent,
    revoked: c.revoked,
    issuedAt: c.issuedAt.toISOString(),
    user: c.user || null,
  };
}

export async function GET() {
  const user = await getSessionUser();
  if (!user) return Response.json({ ok: false, error: 'ابتدا وارد شوید.' }, { status: 401 });
  if (!isManager(user)) return Response.json({ ok: false, error: 'دسترسی ندارید.' }, { status: 403 });

  const items = await prisma.certificate.findMany({
    orderBy: { issuedAt: 'desc' },
    take: 500,
    include: { user: { select: { id: true, phone: true, username: true, displayName: true } } },
  });
  return Response.json({ ok: true, items: items.map(serialize) });
}

// صدور دستی گواهی برای هنرجویی که آزمونش خارج از سامانه برگزار شده یا گواهی‌اش جا مانده.
export async function POST(request) {
  const manager = await getSessionUser();
  if (!manager) return Response.json({ ok: false, error: 'ابتدا وارد شوید.' }, { status: 401 });
  if (!isManager(manager)) return Response.json({ ok: false, error: 'دسترسی ندارید.' }, { status: 403 });

  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ ok: false, error: 'درخواست نامعتبر است.' }, { status: 400 });
  }

  const userId = String(body.userId || '');
  const target = await prisma.user.findUnique({ where: { id: userId } });
  if (!target) return Response.json({ ok: false, error: 'کاربر یافت نشد.' }, { status: 404 });
  if (!target.displayName) {
    return Response.json({ ok: false, error: 'نام و نام خانوادگی این کاربر ثبت نشده است.' }, { status: 400 });
  }

  const percent = body.percent === undefined || body.percent === null || body.percent === ''
    ? null
    : Math.max(0, Math.min(100, parseInt(body.percent, 10) || 0));

  const cert = await issueCertificate(target, { percent, issuedById: manager.id });
  await prisma.user.update({ where: { id: target.id }, data: { graduated: true } });
  await notifyUsers([target.id], {
    title: 'گواهی‌نامهٔ شما صادر شد',
    body: `کد استعلام گواهی شما ${cert.serial} است.`,
    href: '/dashboard/exam',
    kind: 'system',
  });

  return Response.json({ ok: true, item: serialize(cert) });
}
