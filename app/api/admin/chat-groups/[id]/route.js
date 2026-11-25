import { prisma } from '@/lib/prisma';
import { logAction } from '@/lib/audit';
import { GROUP_LIMITS, cleanBody, displayNameOf, requireManager, serializeGroup } from '@/lib/chatGroups';

// پروندهٔ یک گروه برای مدیر: مشخصات گروه، اعضای فعلی و فهرست هنرجویانی که می‌شود اضافه کرد.
export async function GET(request, { params }) {
  const { id } = await params;
  const { error } = await requireManager();
  if (error) return error;

  const group = await prisma.chatGroup.findUnique({ where: { id }, include: { _count: { select: { members: true } } } });
  if (!group) return Response.json({ ok: false, error: 'گروه پیدا نشد.' }, { status: 404 });

  const [memberships, students] = await Promise.all([
    prisma.chatGroupMember.findMany({ where: { groupId: id }, orderBy: { createdAt: 'asc' } }),
    // فقط هنرجوی فعال؛ عضو عادی، فیلم‌ساز و مدیر اصلاً در فهرست انتخاب نمی‌آیند.
    prisma.user.findMany({
      where: { role: 'student', active: true },
      orderBy: [{ displayName: 'asc' }],
      select: {
        id: true, displayName: true, username: true, phone: true, photoUrl: true,
        courseTitle: true, branch: true, graduated: true,
        classGroup: { select: { id: true, name: true } },
      },
    }),
  ]);

  const memberIds = new Set(memberships.map((m) => m.userId));
  const people = students.map((s) => ({
    id: s.id,
    name: displayNameOf(s),
    photoUrl: s.photoUrl || null,
    courseTitle: s.courseTitle || null,
    branch: s.branch || null,
    graduated: s.graduated,
    classGroupId: s.classGroup?.id || null,
    classGroupName: s.classGroup?.name || null,
    isMember: memberIds.has(s.id),
  }));

  // عضوی که دیگر هنرجوی فعال نیست هم باید در فهرست اعضا دیده شود تا مدیر بتواند حذفش کند.
  const knownIds = new Set(people.map((p) => p.id));
  const strays = memberships.filter((m) => !knownIds.has(m.userId));
  const strayUsers = strays.length
    ? await prisma.user.findMany({
        where: { id: { in: strays.map((m) => m.userId) } },
        select: { id: true, displayName: true, username: true, phone: true, photoUrl: true, role: true, active: true },
      })
    : [];

  const members = [
    ...people.filter((p) => p.isMember),
    ...strayUsers.map((u) => ({
      id: u.id,
      name: displayNameOf(u),
      photoUrl: u.photoUrl || null,
      courseTitle: null,
      branch: null,
      graduated: false,
      classGroupId: null,
      classGroupName: null,
      isMember: true,
      inactive: true, // دیگر هنرجوی فعال نیست؛ به گروه دسترسی ندارد ولی ردیفش مانده
    })),
  ];

  const classGroups = await prisma.classGroup.findMany({
    orderBy: { createdAt: 'desc' },
    select: { id: true, name: true, branch: true, courseTitle: true },
  });

  return Response.json({
    ok: true,
    group: serializeGroup(group),
    members,
    candidates: people.filter((p) => !p.isMember),
    classGroups,
  });
}

// ویرایش نام، معرفی، عکس و باز/بسته بودن گروه.
export async function PATCH(request, { params }) {
  const { id } = await params;
  const { user, error } = await requireManager();
  if (error) return error;

  const group = await prisma.chatGroup.findUnique({ where: { id } });
  if (!group) return Response.json({ ok: false, error: 'گروه پیدا نشد.' }, { status: 404 });

  let b = {};
  try { b = await request.json(); } catch { /* بدنهٔ نامعتبر */ }

  const data = {};
  if (b.name !== undefined) {
    const name = cleanBody(b.name, GROUP_LIMITS.name);
    if (!name) return Response.json({ ok: false, error: 'نام گروه را بنویسید.' }, { status: 400 });
    data.name = name;
  }
  if (b.description !== undefined) data.description = cleanBody(b.description, GROUP_LIMITS.description) || null;
  // عکس فقط از مسیر آپلود خودِ سایت پذیرفته می‌شود؛ آدرس دلخواه بیرونی ذخیره نمی‌شود.
  if (b.photoUrl !== undefined) {
    data.photoUrl = typeof b.photoUrl === 'string' && b.photoUrl.startsWith('/media/') ? b.photoUrl : null;
  }
  if (b.active !== undefined) data.active = !!b.active;

  const updated = await prisma.chatGroup.update({
    where: { id },
    data,
    include: { _count: { select: { members: true } } },
  });

  await logAction(user, {
    action: 'chat-group.update',
    targetType: 'ChatGroup',
    targetId: id,
    summary: `ویرایش گروه گفت‌وگوی «${updated.name}»`,
  });

  return Response.json({ ok: true, group: serializeGroup(updated) });
}

// حذف کامل گروه با همهٔ پیام‌ها و عضویت‌ها (Cascade). ادیتور هم مثل مدیر سامانه اجازه دارد.
export async function DELETE(request, { params }) {
  const { id } = await params;
  const { user, error } = await requireManager();
  if (error) return error;

  const group = await prisma.chatGroup.findUnique({ where: { id } });
  if (!group) return Response.json({ ok: false, error: 'گروه پیدا نشد.' }, { status: 404 });

  await prisma.chatGroup.delete({ where: { id } });
  await logAction(user, {
    action: 'chat-group.delete',
    targetType: 'ChatGroup',
    targetId: id,
    summary: `حذف گروه گفت‌وگوی «${group.name}» با همهٔ پیام‌هایش`,
  });

  return Response.json({ ok: true });
}
