import { prisma } from '@/lib/prisma';
import { getSessionUser, isManager } from '@/lib/auth';

const BRANCHES = ['تهران', 'ساری'];

export async function PATCH(request, { params }) {
  const user = await getSessionUser();
  if (!user) return Response.json({ ok: false, error: 'ابتدا وارد شوید.' }, { status: 401 });
  if (!isManager(user)) return Response.json({ ok: false, error: 'دسترسی لازم را ندارید.' }, { status: 403 });

  const { id } = await params;
  const group = await prisma.classGroup.findUnique({ where: { id } });
  if (!group) return Response.json({ ok: false, error: 'کلاس یافت نشد.' }, { status: 404 });

  try {
    const b = await request.json();
    const data = {};
    if (typeof b.name === 'string') data.name = b.name.trim().slice(0, 80);
    if (BRANCHES.includes(b.branch)) data.branch = b.branch;
    if (typeof b.courseTitle === 'string') data.courseTitle = b.courseTitle.trim().slice(0, 120) || null;

    if (Object.keys(data).length) {
      await prisma.classGroup.update({ where: { id }, data });
    }

    // به‌روزرسانی اعضای کلاس (آرایه‌ای از userId ها)
    if (Array.isArray(b.memberIds)) {
      const ids = b.memberIds.filter((x) => typeof x === 'string');
      const nextCourse = data.courseTitle !== undefined ? data.courseTitle : group.courseTitle;
      // اعضای قبلی که دیگر عضو نیستند → از کلاس خارج شوند
      await prisma.user.updateMany({
        where: { classGroupId: id, id: { notIn: ids.length ? ids : ['__none__'] } },
        data: { classGroupId: null, courseTitle: null },
      });
      // اعضای جدید → به این کلاس متصل شوند و دوره‌شان تنظیم شود
      if (ids.length) {
        await prisma.user.updateMany({
          where: { id: { in: ids }, role: 'student' },
          data: { classGroupId: id, courseTitle: nextCourse },
        });
      }
    }

    const updated = await prisma.classGroup.findUnique({
      where: { id },
      include: {
        members: { select: { id: true, displayName: true, phone: true, username: true } },
        _count: { select: { sessions: true } },
      },
    });
    return Response.json({ ok: true, group: updated });
  } catch {
    return Response.json({ ok: false, error: 'درخواست نامعتبر است.' }, { status: 400 });
  }
}

export async function DELETE(request, { params }) {
  const user = await getSessionUser();
  if (!user) return Response.json({ ok: false, error: 'ابتدا وارد شوید.' }, { status: 401 });
  if (!isManager(user)) return Response.json({ ok: false, error: 'دسترسی لازم را ندارید.' }, { status: 403 });

  const { id } = await params;
  try {
    // اعضا آزاد شوند، سپس کلاس و جلساتش حذف شوند
    await prisma.user.updateMany({ where: { classGroupId: id }, data: { classGroupId: null, courseTitle: null } });
    await prisma.classGroup.delete({ where: { id } });
    return Response.json({ ok: true });
  } catch {
    return Response.json({ ok: false, error: 'حذف انجام نشد.' }, { status: 400 });
  }
}
