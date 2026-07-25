import { prisma } from '@/lib/prisma';
import { getSessionUser, isManager } from '@/lib/auth';

const STATUSES = ['present', 'absent'];

// فهرست هنرجویانِ کلاسِ یک جلسه به همراه وضعیت حضور/غیاب ثبت‌شده، برای ادمین/ادیتور.
export async function GET(request) {
  const user = await getSessionUser();
  if (!user) return Response.json({ ok: false, error: 'ابتدا وارد شوید.' }, { status: 401 });
  if (!isManager(user)) return Response.json({ ok: false, error: 'دسترسی لازم را ندارید.' }, { status: 403 });

  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get('sessionId');
  if (!sessionId) return Response.json({ ok: false, error: 'جلسه مشخص نیست.' }, { status: 400 });

  const session = await prisma.classSession.findUnique({
    where: { id: sessionId },
    include: { group: { include: { members: { select: { id: true, displayName: true, phone: true, username: true } } } } },
  });
  if (!session) return Response.json({ ok: false, error: 'جلسه یافت نشد.' }, { status: 404 });

  const attendances = await prisma.attendance.findMany({ where: { sessionId } });
  const byUser = Object.fromEntries(attendances.map((a) => [a.userId, a.status]));

  const members = session.group.members.map((m) => ({ ...m, status: byUser[m.id] || 'absent' }));
  return Response.json({ ok: true, members });
}

// ثبت گروهیِ حضور/غیاب اعضای یک جلسه.
export async function POST(request) {
  const user = await getSessionUser();
  if (!user) return Response.json({ ok: false, error: 'ابتدا وارد شوید.' }, { status: 401 });
  if (!isManager(user)) return Response.json({ ok: false, error: 'دسترسی لازم را ندارید.' }, { status: 403 });

  try {
    const b = await request.json();
    const sessionId = String(b.sessionId || '');
    const records = Array.isArray(b.records) ? b.records : [];
    if (!sessionId) return Response.json({ ok: false, error: 'جلسه مشخص نیست.' }, { status: 400 });

    const session = await prisma.classSession.findUnique({ where: { id: sessionId } });
    if (!session) return Response.json({ ok: false, error: 'جلسه یافت نشد.' }, { status: 404 });

    for (const r of records) {
      const userId = String(r.userId || '');
      const status = STATUSES.includes(r.status) ? r.status : 'absent';
      if (!userId) continue;
      await prisma.attendance.upsert({
        where: { sessionId_userId: { sessionId, userId } },
        update: { status },
        create: { sessionId, userId, status },
      });
    }

    return Response.json({ ok: true });
  } catch {
    return Response.json({ ok: false, error: 'درخواست نامعتبر است.' }, { status: 400 });
  }
}
