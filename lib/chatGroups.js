import { prisma } from '@/lib/prisma';
import { getSessionUser, isManager } from '@/lib/auth';
import { notifyUsers } from '@/lib/notifications';
import { enqueueSmsForUsers, processSmsQueue } from '@/lib/smsQueue';
import { displayNameOf } from '@/lib/staffReports';

// گروه‌های گفت‌وگوی هنرجویان. سه قاعده‌ای که هیچ مسیری نباید دور بزند:
//   ۱) گروه را فقط مدیر می‌سازد و اعضایش را فقط مدیر تعیین می‌کند؛
//   ۲) عضو فقط «هنرجوی فعال» است؛ عضو نبودن یعنی گروه اصلاً وجود ندارد (۴۰۴)؛
//   ۳) متن پیام فقط متن ساده ذخیره و رندر می‌شود.
// عضو یک گروه هیچ گروه دیگری را نمی‌بیند و فهرست گروه‌ها هرگز کامل به هنرجو داده نمی‌شود.

export const GROUP_LIMITS = { name: 60, description: 200, message: 2000, page: 80 };

// اگر فرستنده در ۱۵ دقیقهٔ اخیر در همین گروه پیامی داده باشد، دوباره اعلان نمی‌فرستیم
// تا یک گفت‌وگوی معمولی به ده‌ها اعلان تبدیل نشود.
export const NOTIFY_GAP_MS = 15 * 60 * 1000;

export const STUDENT_GROUPS_HREF = '/dashboard/groups';

// فقط هنرجو؛ عضو عادی، فیلم‌ساز و مدیر از این مسیر عبور نمی‌کنند.
// مدیر کار خودش را از مسیرهای /api/admin/chat-groups انجام می‌دهد، نه از مسیر هنرجو.
export function isStudentUser(user) {
  return !!user && user.role === 'student' && user.active !== false && !isManager(user);
}

export function cleanBody(value, max = GROUP_LIMITS.message) {
  return String(value ?? '').replace(/\u0000/g, '').replace(/\r\n/g, '\n').trim().slice(0, max);
}

// نگهبانِ مشترکِ مسیرهای مدیریت؛ در هر روت اولین کاری است که انجام می‌شود.
export async function requireManager() {
  const user = await getSessionUser();
  if (!user) return { error: Response.json({ ok: false, error: 'ابتدا وارد شوید.' }, { status: 401 }) };
  if (!isManager(user)) return { error: Response.json({ ok: false, error: 'دسترسی لازم را ندارید.' }, { status: 403 }) };
  return { user };
}

export async function isMemberOf(groupId, userId) {
  const row = await prisma.chatGroupMember.findUnique({
    where: { groupId_userId: { groupId, userId } },
    select: { id: true },
  });
  return !!row;
}

export async function markGroupRead(userId, groupId) {
  const now = new Date();
  await prisma.chatGroupRead.upsert({
    where: { groupId_userId: { groupId, userId } },
    update: { lastReadAt: now },
    create: { groupId, userId, lastReadAt: now },
  });
}

export async function readMapFor(userId, groupIds) {
  if (groupIds.length === 0) return new Map();
  const rows = await prisma.chatGroupRead.findMany({
    where: { userId, groupId: { in: groupIds } },
    select: { groupId: true, lastReadAt: true },
  });
  return new Map(rows.map((r) => [r.groupId, r.lastReadAt]));
}

// یک ردیف فهرست: تعداد خوانده‌نشده + آخرین پیام برای پیش‌نمایش.
export async function groupRowFor(group, userId, memberCount) {
  const reads = await readMapFor(userId, [group.id]);
  const since = reads.get(group.id) || new Date(0);
  const [unread, last] = await Promise.all([
    prisma.chatGroupMessage.count({ where: { groupId: group.id, authorId: { not: userId }, createdAt: { gt: since } } }),
    prisma.chatGroupMessage.findFirst({
      where: { groupId: group.id },
      orderBy: { createdAt: 'desc' },
      select: { body: true, authorName: true, authorId: true, createdAt: true },
    }),
  ]);
  return {
    ...serializeGroup(group, memberCount),
    unread,
    preview: last
      ? { body: last.body.slice(0, 90), authorName: last.authorName, mine: last.authorId === userId, createdAt: last.createdAt.toISOString() }
      : null,
  };
}

export function serializeGroup(g, memberCount = undefined) {
  return {
    id: g.id,
    name: g.name,
    description: g.description || null,
    photoUrl: g.photoUrl || null,
    active: g.active,
    memberCount: memberCount ?? g._count?.members ?? 0,
    lastMessageAt: g.lastMessageAt.toISOString(),
    createdAt: g.createdAt.toISOString(),
  };
}

// canModerate یعنی بیننده مدیر است؛ مدیر هر پیامی را در گروه حذف می‌کند، هنرجو فقط پیام خودش را.
export function serializeMessage(m, viewerId, { canModerate = false } = {}) {
  return {
    id: m.id,
    body: m.body,
    authorId: m.authorId,
    authorName: m.authorName,
    authorRole: m.authorRole,
    createdAt: m.createdAt.toISOString(),
    mine: m.authorId === viewerId,
    canDelete: canModerate || m.authorId === viewerId,
  };
}

export async function messagesOf(groupId, { after = null } = {}) {
  if (after) {
    return prisma.chatGroupMessage.findMany({
      where: { groupId, createdAt: { gt: after } },
      orderBy: { createdAt: 'asc' },
      take: GROUP_LIMITS.page,
    });
  }
  const rows = await prisma.chatGroupMessage.findMany({
    where: { groupId },
    orderBy: { createdAt: 'desc' },
    take: GROUP_LIMITS.page,
  });
  return rows.reverse();
}

// ثبت پیام + به‌روزرسانی زمان آخرین پیام + خوانده‌شدن برای فرستنده + اعلان به بقیهٔ اعضا.
export async function postMessage(group, sender, text) {
  const name = displayNameOf(sender);

  const recentlyActive = await prisma.chatGroupMessage.findFirst({
    where: { groupId: group.id, authorId: sender.id, createdAt: { gt: new Date(Date.now() - NOTIFY_GAP_MS) } },
    select: { id: true },
  });

  const message = await prisma.$transaction(async (tx) => {
    const created = await tx.chatGroupMessage.create({
      data: { groupId: group.id, authorId: sender.id, authorName: name, authorRole: sender.role, body: text },
    });
    await tx.chatGroup.update({ where: { id: group.id }, data: { lastMessageAt: created.createdAt } });
    await tx.chatGroupRead.upsert({
      where: { groupId_userId: { groupId: group.id, userId: sender.id } },
      update: { lastReadAt: new Date() },
      create: { groupId: group.id, userId: sender.id, lastReadAt: new Date() },
    });
    const members = await tx.chatGroupMember.findMany({
      where: { groupId: group.id, userId: { not: sender.id } },
      select: { userId: true },
    });
    await enqueueSmsForUsers(members.map((member) => member.userId), {
      kind: 'group_message',
      dedupePrefix: `group-message:${created.id}`,
      // شناسهٔ ۲۵کاراکتری داخل محدودیت پارامتر قالب است و از مسیر کوتاه به همین گروه هدایت می‌شود.
      body: group.id,
    }, tx);
    return created;
  });

  await processSmsQueue().catch((error) => console.error('group message sms queue failed:', error));

  if (!recentlyActive) {
    await notifyMembers(group, sender.id, `پیام تازه از ${name} در گروه ${group.name}`, text);
  }

  return message;
}

async function notifyMembers(group, senderId, title, text) {
  const rows = await prisma.chatGroupMember.findMany({
    where: { groupId: group.id, userId: { not: senderId } },
    select: { userId: true },
  });
  const ids = rows.map((r) => r.userId);
  if (ids.length === 0) return;
  // اعلان فقط برای هنرجوی فعال؛ کسی که نقشش عوض شده یا غیرفعال شده اعلان نمی‌گیرد.
  const students = await prisma.user.findMany({
    where: { id: { in: ids }, role: 'student', active: true },
    select: { id: true },
  });
  await notifyUsers(students.map((s) => s.id), {
    title,
    body: text.slice(0, 90),
    href: `${STUDENT_GROUPS_HREF}?g=${group.id}`,
    kind: 'system',
  });
}

export { displayNameOf };
