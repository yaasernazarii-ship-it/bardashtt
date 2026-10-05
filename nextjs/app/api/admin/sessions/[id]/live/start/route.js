import { prisma } from '@/lib/prisma';
import { getSessionUser, isManager } from '@/lib/auth';
import { logAction } from '@/lib/audit';

// شروع پخش زندهٔ یک جلسه. فقط استاد (ادمین/ادیتور) — کنترل دسترسی کامل سمت سرور.
export async function POST(request, { params }) {
  const user = await getSessionUser();
  if (!user) return Response.json({ ok: false, error: 'ابتدا وارد شوید.' }, { status: 401 });
  if (!isManager(user)) return Response.json({ ok: false, error: 'دسترسی لازم را ندارید.' }, { status: 403 });

  const { id } = await params;
  const session = await prisma.classSession.findUnique({
    where: { id },
    include: { group: { select: { name: true } } },
  });
  if (!session) return Response.json({ ok: false, error: 'جلسه یافت نشد.' }, { status: 404 });

  if (session.liveStatus === 'live') {
    return Response.json({ ok: false, error: 'این کلاس همین الان در حال برگزاری است.' }, { status: 409 });
  }
  if (session.liveStatus === 'finished') {
    return Response.json({ ok: false, error: 'این جلسه قبلاً پایان یافته است؛ فقط مدیر سیستم می‌تواند آن را بازگشایی کند.' }, { status: 409 });
  }

  const updated = await prisma.classSession.update({
    where: { id },
    data: {
      liveStatus: 'live',
      liveStartedAt: new Date(),
      liveStartedById: user.id,
      liveStartedByName: user.displayName || user.username || user.phone,
      liveFinishedAt: null,
      liveFinishedById: null,
      liveFinishedByName: null,
    },
  });

  await logAction(user, {
    action: 'liveSession.start',
    targetType: 'classSession',
    targetId: id,
    summary: `شروع کلاس آنلاین «${session.title}» — ${session.group.name}`,
  });

  return Response.json({ ok: true, session: updated });
}
