import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';
import { isLocked, recordFailure } from '@/lib/rateLimit';
import { cleanBody, isStudentUser } from '@/lib/chatGroups';
import {
  DIRECT_LIMITS, canChatDirectly, directMessages, markDirectRead, openDirectChat, postDirectMessage, serializeDirectMessage,
} from '@/lib/directChats';
import { displayNameOf } from '@/lib/staffReports';

async function openForStudent(id) {
  const user = await getSessionUser();
  if (!user) return { error: Response.json({ ok: false, error: 'ابتدا وارد شوید.' }, { status: 401 }) };
  if (!isStudentUser(user)) return { error: Response.json({ ok: false, error: 'این بخش فقط برای هنرجویان است.' }, { status: 403 }) };
  const chat = await openDirectChat(id, user.id);
  if (!chat) return { error: Response.json({ ok: false, error: 'گفت‌وگو پیدا نشد.' }, { status: 404 }) };
  return { user, chat };
}

export async function GET(request, { params }) {
  const { id } = await params;
  const { user, chat, error } = await openForStudent(id);
  if (error) return error;

  const otherId = chat.userAId === user.id ? chat.userBId : chat.userAId;
  const other = await prisma.user.findUnique({
    where: { id: otherId },
    select: { id: true, displayName: true, username: true, photoUrl: true, active: true },
  });
  const { searchParams } = new URL(request.url);
  const afterRaw = searchParams.get('after');
  const after = afterRaw ? new Date(afterRaw) : null;
  const validAfter = after && !Number.isNaN(after.getTime()) ? after : null;
  const messages = await directMessages(chat.id, validAfter);
  if (searchParams.get('seen') === '1') await markDirectRead(user.id, chat.id);
  const canSend = !!other?.active && await canChatDirectly(user.id, otherId);

  return Response.json({
    ok: true,
    chat: {
      id: chat.id,
      other: { id: otherId, name: other ? displayNameOf(other) : 'کاربر حذف‌شده', photoUrl: other?.photoUrl || null },
      canSend,
    },
    reset: !validAfter,
    messages: messages.map((message) => serializeDirectMessage(message, user.id)),
  });
}

export async function POST(request, { params }) {
  const { id } = await params;
  const { user, chat, error } = await openForStudent(id);
  if (error) return error;
  const otherId = chat.userAId === user.id ? chat.userBId : chat.userAId;
  const recipient = await prisma.user.findFirst({ where: { id: otherId, role: 'student', active: true }, select: { id: true } });
  if (!recipient || !(await canChatDirectly(user.id, otherId))) {
    return Response.json({ ok: false, error: 'برای ارسال پیام باید همچنان در یک گروه مشترک عضو باشید.' }, { status: 403 });
  }

  const rateKey = `directChat:${user.id}`;
  if (await isLocked(rateKey, { max: 120 })) {
    return Response.json({ ok: false, error: 'تعداد پیام‌ها زیاد بود. کمی بعد دوباره تلاش کنید.' }, { status: 429 });
  }
  let body = {};
  try { body = await request.json(); } catch { /* بدنهٔ نامعتبر */ }
  const text = cleanBody(body.body, DIRECT_LIMITS.message);
  if (!text) return Response.json({ ok: false, error: 'متن پیام خالی است.' }, { status: 400 });

  await recordFailure(rateKey, { max: 120 });
  const message = await postDirectMessage(chat, user, text);
  return Response.json({ ok: true, message: serializeDirectMessage(message, user.id) });
}

export async function DELETE(request, { params }) {
  const { id } = await params;
  const { user, chat, error } = await openForStudent(id);
  if (error) return error;
  const messageId = new URL(request.url).searchParams.get('message');
  const message = messageId ? await prisma.directChatMessage.findUnique({ where: { id: messageId } }) : null;
  if (!message || message.chatId !== chat.id) return Response.json({ ok: false, error: 'پیام پیدا نشد.' }, { status: 404 });
  if (message.authorId !== user.id) return Response.json({ ok: false, error: 'فقط پیام خودتان را می‌توانید حذف کنید.' }, { status: 403 });
  await prisma.directChatMessage.delete({ where: { id: message.id } });
  return Response.json({ ok: true });
}
