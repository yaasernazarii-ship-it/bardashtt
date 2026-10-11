import { prisma } from '@/lib/prisma';
import { requireManager } from '@/lib/chatGroups';
import { directMessages, serializeDirectMessage } from '@/lib/directChats';
import { displayNameOf } from '@/lib/staffReports';

export async function GET(request, { params }) {
  const { user, error } = await requireManager();
  if (error) return error;
  const { id } = await params;
  const chat = await prisma.directChat.findUnique({ where: { id } });
  if (!chat) return Response.json({ ok: false, error: 'گفت‌وگو پیدا نشد.' }, { status: 404 });

  const { searchParams } = new URL(request.url);
  const afterRaw = searchParams.get('after');
  const after = afterRaw ? new Date(afterRaw) : null;
  const validAfter = after && !Number.isNaN(after.getTime()) ? after : null;
  const [messages, participants] = await Promise.all([
    directMessages(chat.id, validAfter),
    prisma.user.findMany({
      where: { id: { in: [chat.userAId, chat.userBId] } },
      select: { id: true, displayName: true, username: true, photoUrl: true },
    }),
  ]);
  const byId = new Map(participants.map((person) => [person.id, person]));
  const person = (id) => {
    const value = byId.get(id);
    return { id, name: value ? displayNameOf(value) : 'کاربر حذف‌شده', photoUrl: value?.photoUrl || null };
  };

  return Response.json({
    ok: true,
    chat: { id: chat.id, first: person(chat.userAId), second: person(chat.userBId) },
    reset: !validAfter,
    messages: messages.map((message) => serializeDirectMessage(message, user.id, true)),
  });
}

export async function DELETE(request, { params }) {
  const { error } = await requireManager();
  if (error) return error;
  const { id } = await params;
  const messageId = new URL(request.url).searchParams.get('message');
  const message = messageId ? await prisma.directChatMessage.findUnique({ where: { id: messageId } }) : null;
  if (!message || message.chatId !== id) return Response.json({ ok: false, error: 'پیام پیدا نشد.' }, { status: 404 });
  await prisma.directChatMessage.delete({ where: { id: message.id } });
  return Response.json({ ok: true });
}
