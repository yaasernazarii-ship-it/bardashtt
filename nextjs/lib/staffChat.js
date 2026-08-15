import { prisma } from '@/lib/prisma';
import { isManager } from '@/lib/auth';
import { displayNameOf } from '@/lib/staffReports';

// گفت‌وگوی داخلیِ ادمین و ادیتور. سه قاعده‌ای که هیچ‌جا نباید دور زده شود:
//   ۱) هر مسیر اول isManager را بررسی می‌کند؛
//   ۲) بعد از آن، عضویت در همان گفت‌وگو بررسی می‌شود (گروهی = هر مدیر، خصوصی = فقط همان دو نفر)؛
//   ۳) متن پیام فقط متن ساده ذخیره و رندر می‌شود.
// گفت‌وگوی خصوصیِ دو همکار حتی برای ادمینِ سوم هم باز نمی‌شود؛ این عمدی است.

export const CHAT_LIMITS = { message: 2000, page: 80 };
export const GROUP_KEY = 'group';

// اگر نویسنده در ۱۵ دقیقهٔ اخیر در همین گفت‌وگو پیامی داده باشد، دوباره اعلان نمی‌فرستیم
// تا یک گفت‌وگوی معمولی به ده‌ها اعلان تبدیل نشود.
export const NOTIFY_GAP_MS = 15 * 60 * 1000;

export function pairKeyOf(a, b) {
  return [a, b].sort().join('|');
}

export async function ensureGroupThread() {
  return prisma.staffChatThread.upsert({
    where: { pairKey: GROUP_KEY },
    update: {},
    create: { kind: 'group', pairKey: GROUP_KEY },
  });
}

export function canAccessThread(user, thread) {
  if (!thread || !isManager(user)) return false;
  if (thread.kind === 'group') return true;
  return thread.userAId === user.id || thread.userBId === user.id;
}

// گفت‌وگوهایی که این کاربر حق دیدنشان را دارد: گروهی + خصوصی‌هایی که خودش یک طرف آن است.
export function visibleThreadsWhere(userId) {
  return { OR: [{ kind: 'group' }, { userAId: userId }, { userBId: userId }] };
}

export async function readMapFor(userId, threadIds) {
  if (threadIds.length === 0) return new Map();
  const rows = await prisma.staffChatRead.findMany({
    where: { userId, threadId: { in: threadIds } },
    select: { threadId: true, lastReadAt: true },
  });
  return new Map(rows.map((r) => [r.threadId, r.lastReadAt]));
}

export async function markThreadRead(userId, threadId) {
  const now = new Date();
  await prisma.staffChatRead.upsert({
    where: { threadId_userId: { threadId, userId } },
    update: { lastReadAt: now },
    create: { threadId, userId, lastReadAt: now },
  });
}

// شمارندهٔ کلِ پیام‌های خوانده‌نشدهٔ یک کاربر (برای نشان روی تب و خانهٔ مدیریت).
export async function countChatUnread(user) {
  if (!isManager(user)) return 0;
  const threads = await prisma.staffChatThread.findMany({
    where: visibleThreadsWhere(user.id),
    select: { id: true },
  });
  if (threads.length === 0) return 0;
  const reads = await readMapFor(user.id, threads.map((t) => t.id));
  return prisma.staffChatMessage.count({
    where: {
      authorId: { not: user.id },
      OR: threads.map((t) => ({
        threadId: t.id,
        createdAt: { gt: reads.get(t.id) || new Date(0) },
      })),
    },
  });
}

// گیرندگانِ اعلانِ یک پیام: در گروهی همهٔ مدیرانِ فعالِ دیگر، در خصوصی فقط طرف مقابل (اگر فعال باشد).
export async function notifyTargetsOf(thread, senderId) {
  if (thread.kind === 'group') {
    const rows = await prisma.user.findMany({
      where: { role: { in: ['admin', 'editor'] }, active: true, id: { not: senderId } },
      select: { id: true },
    });
    return rows.map((r) => r.id);
  }
  const peerId = thread.userAId === senderId ? thread.userBId : thread.userAId;
  if (!peerId) return [];
  const peer = await prisma.user.findFirst({ where: { id: peerId, active: true }, select: { id: true } });
  return peer ? [peer.id] : [];
}

export function serializeMessage(m, viewer, thread) {
  return {
    id: m.id,
    body: m.body,
    authorId: m.authorId,
    authorName: m.authorName,
    authorRole: m.authorRole,
    createdAt: m.createdAt.toISOString(),
    mine: m.authorId === viewer.id,
    // حذف پیام: نویسندهٔ خودش همیشه؛ ادمین فقط در گفت‌وگوی گروهی (نه در خصوصیِ دیگران).
    canDelete: m.authorId === viewer.id || (viewer.role === 'admin' && thread.kind === 'group'),
  };
}

export function peerIdOf(thread, userId) {
  if (thread.kind === 'group') return null;
  return thread.userAId === userId ? thread.userBId : thread.userAId;
}

export { displayNameOf };
