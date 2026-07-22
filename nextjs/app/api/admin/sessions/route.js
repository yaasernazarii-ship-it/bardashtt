import { prisma } from '@/lib/prisma';
import { getSessionUser, isManager } from '@/lib/auth';

export async function GET(request) {
  const user = await getSessionUser();
  if (!user) return Response.json({ ok: false, error: 'ابتدا وارد شوید.' }, { status: 401 });
  if (!isManager(user)) return Response.json({ ok: false, error: 'دسترسی لازم را ندارید.' }, { status: 403 });

  const { searchParams } = new URL(request.url);
  const groupId = searchParams.get('groupId');
  if (!groupId) return Response.json({ ok: false, error: 'کلاس مشخص نیست.' }, { status: 400 });

  const sessions = await prisma.classSession.findMany({
    where: { groupId },
    orderBy: { startsAt: 'asc' },
  });
  return Response.json({ ok: true, sessions });
}

export async function POST(request) {
  const user = await getSessionUser();
  if (!user) return Response.json({ ok: false, error: 'ابتدا وارد شوید.' }, { status: 401 });
  if (!isManager(user)) return Response.json({ ok: false, error: 'دسترسی لازم را ندارید.' }, { status: 403 });

  try {
    const b = await request.json();
    const groupId = String(b.groupId || '');
    const title = String(b.title || '').trim().slice(0, 120);
    const startsAt = new Date(b.startsAt);
    if (!groupId) return Response.json({ ok: false, error: 'کلاس مشخص نیست.' }, { status: 400 });
    if (!title) return Response.json({ ok: false, error: 'عنوان جلسه الزامی است.' }, { status: 400 });
    if (Number.isNaN(startsAt.getTime())) return Response.json({ ok: false, error: 'تاریخ نامعتبر است.' }, { status: 400 });

    const group = await prisma.classGroup.findUnique({ where: { id: groupId } });
    if (!group) return Response.json({ ok: false, error: 'کلاس یافت نشد.' }, { status: 404 });

    const session = await prisma.classSession.create({
      data: {
        groupId,
        title,
        startsAt,
        chartDescription: b.chartDescription ? String(b.chartDescription).trim().slice(0, 2000) : null,
        tools: b.tools ? String(b.tools).trim().slice(0, 1000) : null,
        homework: b.homework ? String(b.homework).trim().slice(0, 2000) : null,
        createdById: user.id,
      },
    });
    // به‌روزرسانی زمان کلاس → هنرجویان نشان «به‌روزرسانی شد» می‌بینند
    await prisma.classGroup.update({ where: { id: groupId }, data: { updatedAt: new Date() } });
    return Response.json({ ok: true, session });
  } catch {
    return Response.json({ ok: false, error: 'درخواست نامعتبر است.' }, { status: 400 });
  }
}
