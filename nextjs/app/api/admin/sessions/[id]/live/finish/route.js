import { prisma } from '@/lib/prisma';
import { getSessionUser, isManager } from '@/lib/auth';
import { logAction } from '@/lib/audit';

// پایان پخش زندهٔ یک جلسه. فقط استاد (ادمین/ادیتور).
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

  if (session.liveStatus !== 'live') {
    return Response.json({ ok: false, error: 'این کلاس در حال برگزاری نیست.' }, { status: 409 });
  }

  const updated = await prisma.classSession.update({
    where: { id },
    data: {
      liveStatus: 'finished',
      liveFinishedAt: new Date(),
      liveFinishedById: user.id,
      liveFinishedByName: user.displayName || user.username || user.phone,
    },
  });

  await logAction(user, {
    action: 'liveSession.finish',
    targetType: 'classSession',
    targetId: id,
    summary: `پایان کلاس آنلاین «${session.title}» — ${session.group.name}`,
  });

  return Response.json({ ok: true, session: updated });
}
