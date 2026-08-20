import { prisma } from '@/lib/prisma';
import { logAction } from '@/lib/audit';
import { isLocked, recordFailure } from '@/lib/rateLimit';
import {
  GROUP_LIMITS, cleanBody, markGroupRead, messagesOf, postMessage, requireManager, serializeGroup, serializeMessage,
} from '@/lib/chatGroups';

// مدیر همهٔ گروه‌ها را می‌بیند، در آن‌ها پیام می‌گذارد و هر پیامی را حذف می‌کند.
async function openGroup(id) {
  const { user, error } = await requireManager();
  if (error) return { error };
  const group = await prisma.chatGroup.findUnique({ where: { id }, include: { _count: { select: { members: true } } } });
  if (!group) return { error: Response.json({ ok: false, error: 'گروه پیدا نشد.' }, { status: 404 }) };
  return { user, group };
}

export async function GET(request, { params }) {
  const { id } = await params;
  const { user, group, error } = await openGroup(id);
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const afterRaw = searchParams.get('after');
  const after = afterRaw ? new Date(afterRaw) : null;
  const valid = after && !Number.isNaN(after.getTime());

  const messages = await messagesOf(id, { after: valid ? after : null });
  if (searchParams.get('seen') === '1') await markGroupRead(user.id, id);

  return Response.json({
    ok: true,
    group: serializeGroup(group),
    reset: !valid,
    messages: messages.map((m) => serializeMessage(m, user.id, { canModerate: true })),
  });
}

export async function POST(request, { params }) {
  const { id } = await params;
  const { user, group, error } = await openGroup(id);
  if (error) return error;

  const rateKey = `chatGroupAdmin:${user.id}`;
  if (isLocked(rateKey, { max: 120 })) {
    return Response.json({ ok: false, error: 'تعداد پیام در چند دقیقهٔ اخیر زیاد بود. کمی بعد دوباره تلاش کنید.' }, { status: 429 });
  }

  let b = {};
  try { b = await request.json(); } catch { /* بدنهٔ نامعتبر */ }
  const text = cleanBody(b.body, GROUP_LIMITS.message);
  if (!text) return Response.json({ ok: false, error: 'متن پیام خالی است.' }, { status: 400 });

  recordFailure(rateKey, { max: 120 });
  const message = await postMessage(group, user, text);

  return Response.json({ ok: true, message: serializeMessage(message, user.id, { canModerate: true }) });
}

export async function DELETE(request, { params }) {
  const { id } = await params;
  const { user, group, error } = await openGroup(id);
  if (error) return error;

  const messageId = new URL(request.url).searchParams.get('message');
  if (!messageId) return Response.json({ ok: false, error: 'پیام مشخص نشده است.' }, { status: 400 });

  const message = await prisma.chatGroupMessage.findUnique({ where: { id: messageId } });
  if (!message || message.groupId !== id) return Response.json({ ok: false, error: 'پیام پیدا نشد.' }, { status: 404 });

  await prisma.chatGroupMessage.delete({ where: { id: messageId } });
  if (message.authorId !== user.id) {
    await logAction(user, {
      action: 'chat-group.message.delete',
      targetType: 'ChatGroup',
      targetId: id,
      summary: `حذف پیام «${message.authorName}» در گروه «${group.name}»`,
    });
  }

  return Response.json({ ok: true });
}
