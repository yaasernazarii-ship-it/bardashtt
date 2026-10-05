import { prisma } from '@/lib/prisma';
import { getSessionUser, isManager } from '@/lib/auth';
import { displayNameOf, listColleagues } from '@/lib/staffReports';
import { CHAT_LIMITS, ensureGroupThread, pairKeyOf, readMapFor, visibleThreadsWhere } from '@/lib/staffChat';

// گفت‌وگوی داخلی تیم مدیریت — فقط ادمین و ادیتور. هیچ مسیری در این پوشه بدون این بررسی اجرا نمی‌شود.
async function guard() {
  const user = await getSessionUser();
  if (!user) return { error: Response.json({ ok: false, error: 'ابتدا وارد شوید.' }, { status: 401 }) };
  if (!isManager(user)) return { error: Response.json({ ok: false, error: 'دسترسی لازم را ندارید.' }, { status: 403 }) };
  return { user };
}

// فهرست گفت‌وگوها: یک گفت‌وگوی گروهی + یک ردیف برای هر همکار (چه گفت‌وگو داشته باشد چه نه).
export async function GET() {
  const { user, error } = await guard();
  if (error) return error;

  const group = await ensureGroupThread();
  const [threads, colleagues] = await Promise.all([
    prisma.staffChatThread.findMany({ where: visibleThreadsWhere(user.id), orderBy: { lastMessageAt: 'desc' } }),
    listColleagues(user.id),
  ]);

  const reads = await readMapFor(user.id, threads.map((t) => t.id));

  const rows = await Promise.all(threads.map(async (t) => {
    const since = reads.get(t.id) || new Date(0);
    const [unread, last] = await Promise.all([
      prisma.staffChatMessage.count({ where: { threadId: t.id, authorId: { not: user.id }, createdAt: { gt: since } } }),
      prisma.staffChatMessage.findFirst({
        where: { threadId: t.id },
        orderBy: { createdAt: 'desc' },
        select: { body: true, authorName: true, authorId: true, createdAt: true },
      }),
    ]);
    return {
      id: t.id,
      kind: t.kind,
      peerId: t.kind === 'direct' ? (t.userAId === user.id ? t.userBId : t.userAId) : null,
      unread,
      lastMessageAt: t.lastMessageAt.toISOString(),
      preview: last
        ? { body: last.body.slice(0, 90), authorName: last.authorName, mine: last.authorId === user.id, createdAt: last.createdAt.toISOString() }
        : null,
    };
  }));

  const byPeer = new Map(rows.filter((r) => r.kind === 'direct').map((r) => [r.peerId, r]));
  const groupRow = rows.find((r) => r.id === group.id) || { id: group.id, kind: 'group', unread: 0, preview: null };

  return Response.json({
    ok: true,
    me: { id: user.id, name: displayNameOf(user), role: user.role },
    limits: { message: CHAT_LIMITS.message },
    group: groupRow,
    // هر همکار یک ردیف دارد؛ اگر هنوز گفت‌وگویی نساخته‌اند threadId خالی است و با اولین کلیک ساخته می‌شود.
    peers: colleagues.map((c) => {
      const row = byPeer.get(c.id);
      return { ...c, threadId: row?.id || null, unread: row?.unread || 0, preview: row?.preview || null, lastMessageAt: row?.lastMessageAt || null };
    }),
    unread: rows.reduce((sum, r) => sum + r.unread, 0),
  });
}

// باز کردن (یا ساختنِ) گفت‌وگوی خصوصی با یک همکار.
export async function POST(request) {
  const { user, error } = await guard();
  if (error) return error;

  let b = {};
  try { b = await request.json(); } catch { /* بدنهٔ نامعتبر */ }

  const peerId = typeof b.peerId === 'string' ? b.peerId : '';
  if (!peerId || peerId === user.id) return Response.json({ ok: false, error: 'همکار را انتخاب کنید.' }, { status: 400 });

  const peer = await prisma.user.findFirst({
    where: { id: peerId, role: { in: ['admin', 'editor'] }, active: true },
    select: { id: true },
  });
  if (!peer) return Response.json({ ok: false, error: 'این همکار در تیم مدیریت نیست.' }, { status: 404 });

  const [userAId, userBId] = [user.id, peer.id].sort();
  const thread = await prisma.staffChatThread.upsert({
    where: { pairKey: pairKeyOf(user.id, peer.id) },
    update: {},
    create: { kind: 'direct', pairKey: pairKeyOf(user.id, peer.id), userAId, userBId },
  });

  return Response.json({ ok: true, threadId: thread.id });
}
