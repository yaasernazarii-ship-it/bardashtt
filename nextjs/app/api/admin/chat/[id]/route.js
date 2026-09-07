import { prisma } from '@/lib/prisma';
import { getSessionUser, isManager } from '@/lib/auth';
import { notifyUsers } from '@/lib/notifications';
import { isLocked, recordFailure } from '@/lib/rateLimit';
import { cleanText, displayNameOf } from '@/lib/staffReports';
import {
  CHAT_LIMITS, NOTIFY_GAP_MS, canAccessThread, markThreadRead, notifyTargetsOf, peerIdOf, serializeMessage,
} from '@/lib/staffChat';

// هر درخواست دو سد دارد: نقش (ادمین/ادیتور) و عضویت در همان گفت‌وگو.
// اگر یکی از این دو نباشد، حتی وجود گفت‌وگو هم لو نمی‌رود (۴۰۴).
async function openThread(id) {
  const user = await getSessionUser();
  if (!user) return { error: Response.json({ ok: false, error: 'ابتدا وارد شوید.' }, { status: 401 }) };
  if (!isManager(user)) return { error: Response.json({ ok: false, error: 'دسترسی لازم را ندارید.' }, { status: 403 }) };
  const thread = await prisma.staffChatThread.findUnique({ where: { id } });
  if (!thread || !canAccessThread(user, thread)) {
    return { error: Response.json({ ok: false, error: 'گفت‌وگو پیدا نشد.' }, { status: 404 }) };
  }
  return { user, thread };
}

async function threadHead(thread, userId) {
  const peerId = peerIdOf(thread, userId);
  if (!peerId) return { id: thread.id, kind: 'group', title: 'گفت‌وگوی گروهی تیم', peerRole: null };
  const peer = await prisma.user.findUnique({
    where: { id: peerId },
    select: { displayName: true, username: true, phone: true, role: true, active: true },
  });
  return {
    id: thread.id,
    kind: 'direct',
    title: peer ? displayNameOf(peer) : 'همکار حذف‌شده',
    peerRole: peer?.role || null,
    peerActive: !!peer?.active,
  };
}

// خواندن پیام‌ها. با ?after=<زمان> فقط پیام‌های تازه برمی‌گردد (برای polling سبک)
// و با ?seen=1 گفت‌وگو «خوانده‌شده» علامت می‌خورد.
export async function GET(request, { params }) {
  const { id } = await params;
  const { user, thread, error } = await openThread(id);
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const afterRaw = searchParams.get('after');
  const after = afterRaw ? new Date(afterRaw) : null;
  const valid = after && !Number.isNaN(after.getTime());

  const messages = valid
    ? await prisma.staffChatMessage.findMany({
        where: { threadId: id, createdAt: { gt: after } },
        orderBy: { createdAt: 'asc' },
        take: CHAT_LIMITS.page,
      })
    : (await prisma.staffChatMessage.findMany({
        where: { threadId: id },
        orderBy: { createdAt: 'desc' },
        take: CHAT_LIMITS.page,
      })).reverse();

  if (searchParams.get('seen') === '1') await markThreadRead(user.id, id);

  return Response.json({
    ok: true,
    thread: await threadHead(thread, user.id),
    reset: !valid, // یعنی این پاسخ، کلِ فهرست است نه فقط پیام‌های تازه
    messages: messages.map((m) => serializeMessage(m, user, thread)),
  });
}

export async function POST(request, { params }) {
  const { id } = await params;
  const { user, thread, error } = await openThread(id);
  if (error) return error;

  const rateKey = `staffChat:${user.id}`;
  if (await isLocked(rateKey, { max: 120 })) {
    return Response.json({ ok: false, error: 'تعداد پیام در چند دقیقهٔ اخیر زیاد بود. کمی بعد دوباره تلاش کنید.' }, { status: 429 });
  }

  let b = {};
  try { b = await request.json(); } catch { /* بدنهٔ نامعتبر */ }
  const text = cleanText(b.body, CHAT_LIMITS.message);
  if (!text) return Response.json({ ok: false, error: 'متن پیام خالی است.' }, { status: 400 });

  await recordFailure(rateKey, { max: 120 });
  const name = displayNameOf(user);

  // اگر خودش همین چند دقیقه پیش در این گفت‌وگو حرف زده، اعلان تازه نمی‌فرستیم.
  const recentlyActive = await prisma.staffChatMessage.findFirst({
    where: { threadId: id, authorId: user.id, createdAt: { gt: new Date(Date.now() - NOTIFY_GAP_MS) } },
    select: { id: true },
  });

  const message = await prisma.staffChatMessage.create({
    data: { threadId: id, authorId: user.id, authorName: name, authorRole: user.role, body: text },
  });

  await Promise.all([
    prisma.staffChatThread.update({ where: { id }, data: { lastMessageAt: message.createdAt } }),
    markThreadRead(user.id, id),
    recentlyActive
      ? Promise.resolve()
      : notifyUsers(await notifyTargetsOf(thread, user.id), {
          title: thread.kind === 'group' ? `پیام تازه از ${name} در گفت‌وگوی تیم` : `پیام تازه از ${name}`,
          body: text.slice(0, 90),
          href: '/dashboard/admin/reports?tab=chat',
          kind: 'system',
        }),
  ]);

  return Response.json({ ok: true, message: serializeMessage(message, user, thread) });
}

// حذف یک پیام: نویسندهٔ خودش، و ادمین فقط در گفت‌وگوی گروهی.
export async function DELETE(request, { params }) {
  const { id } = await params;
  const { user, thread, error } = await openThread(id);
  if (error) return error;

  const messageId = new URL(request.url).searchParams.get('message');
  if (!messageId) return Response.json({ ok: false, error: 'پیام مشخص نشده است.' }, { status: 400 });

  const message = await prisma.staffChatMessage.findUnique({ where: { id: messageId } });
  if (!message || message.threadId !== id) return Response.json({ ok: false, error: 'پیام پیدا نشد.' }, { status: 404 });

  const allowed = message.authorId === user.id || thread.kind === 'group';
  if (!allowed) return Response.json({ ok: false, error: 'فقط فرستندهٔ پیام می‌تواند آن را حذف کند.' }, { status: 403 });

  await prisma.staffChatMessage.delete({ where: { id: messageId } });
  return Response.json({ ok: true });
}
