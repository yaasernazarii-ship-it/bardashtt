import { prisma } from '@/lib/prisma';
import { logAction } from '@/lib/audit';
import { notifyUsers } from '@/lib/notifications';
import { STUDENT_GROUPS_HREF, requireManager } from '@/lib/chatGroups';

// عضوگیری فقط از این مسیر انجام می‌شود و فقط مدیر آن را صدا می‌زند؛
// هیچ هنرجویی نمی‌تواند خودش یا دیگری را عضو کند.
export async function POST(request, { params }) {
  const { id } = await params;
  const { user, error } = await requireManager();
  if (error) return error;

  const group = await prisma.chatGroup.findUnique({ where: { id } });
  if (!group) return Response.json({ ok: false, error: 'گروه پیدا نشد.' }, { status: 404 });

  let b = {};
  try { b = await request.json(); } catch { /* بدنهٔ نامعتبر */ }

  const wanted = Array.isArray(b.userIds) ? [...new Set(b.userIds.filter((x) => typeof x === 'string'))] : [];
  if (wanted.length === 0) return Response.json({ ok: false, error: 'هنرجویی انتخاب نشده است.' }, { status: 400 });

  // فیلترِ سرور: فقط هنرجوی فعال عضو می‌شود، حتی اگر شناسهٔ دیگری فرستاده شود.
  const students = await prisma.user.findMany({
    where: { id: { in: wanted }, role: 'student', active: true },
    select: { id: true },
  });
  if (students.length === 0) return Response.json({ ok: false, error: 'هیچ‌کدام از افراد انتخاب‌شده هنرجوی فعال نیستند.' }, { status: 400 });

  const result = await prisma.chatGroupMember.createMany({
    data: students.map((s) => ({ groupId: id, userId: s.id })),
    skipDuplicates: true,
  });

  await Promise.all([
    logAction(user, {
      action: 'chat-group.members.add',
      targetType: 'ChatGroup',
      targetId: id,
      summary: `افزودن ${result.count} هنرجو به گروه «${group.name}»`,
    }),
    notifyUsers(students.map((s) => s.id), {
      title: `به گروه «${group.name}» اضافه شدید`,
      body: 'از بخش گروه‌های گفت‌وگو می‌توانید پیام‌های گروه را ببینید.',
      href: `${STUDENT_GROUPS_HREF}?g=${id}`,
      kind: 'system',
    }),
  ]);

  return Response.json({ ok: true, added: result.count });
}

// حذف عضو از گروه؛ پیام‌های قبلی‌اش در گروه می‌ماند ولی دیگر گروه را نمی‌بیند.
export async function DELETE(request, { params }) {
  const { id } = await params;
  const { user, error } = await requireManager();
  if (error) return error;

  const group = await prisma.chatGroup.findUnique({ where: { id } });
  if (!group) return Response.json({ ok: false, error: 'گروه پیدا نشد.' }, { status: 404 });

  const userId = new URL(request.url).searchParams.get('user');
  if (!userId) return Response.json({ ok: false, error: 'عضو مشخص نشده است.' }, { status: 400 });

  const removed = await prisma.chatGroupMember.deleteMany({ where: { groupId: id, userId } });
  if (removed.count === 0) return Response.json({ ok: false, error: 'این فرد عضو گروه نیست.' }, { status: 404 });

  // وضعیت خوانده‌شدنِ همان کاربر هم پاک می‌شود تا اگر دوباره اضافه شد، شمارنده از نو شروع شود.
  await prisma.chatGroupRead.deleteMany({ where: { groupId: id, userId } });

  await logAction(user, {
    action: 'chat-group.members.remove',
    targetType: 'ChatGroup',
    targetId: id,
    summary: `حذف یک عضو از گروه «${group.name}»`,
  });

  return Response.json({ ok: true });
}
