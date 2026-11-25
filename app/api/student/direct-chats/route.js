import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';
import { isStudentUser } from '@/lib/chatGroups';
import { canChatDirectly, directChatRows, eligibleDirectContacts, getOrCreateDirectChat } from '@/lib/directChats';

async function requireStudent() {
  const user = await getSessionUser();
  if (!user) return { error: Response.json({ ok: false, error: 'ابتدا وارد شوید.' }, { status: 401 }) };
  if (!isStudentUser(user)) return { error: Response.json({ ok: false, error: 'این بخش فقط برای هنرجویان است.' }, { status: 403 }) };
  return { user };
}

export async function GET() {
  const { user, error } = await requireStudent();
  if (error) return error;

  const [contacts, chats] = await Promise.all([
    eligibleDirectContacts(user.id),
    directChatRows({ OR: [{ userAId: user.id }, { userBId: user.id }] }, user.id),
  ]);
  return Response.json({ ok: true, contacts, chats, unread: chats.reduce((sum, chat) => sum + chat.unread, 0) });
}

export async function POST(request) {
  const { user, error } = await requireStudent();
  if (error) return error;

  let body = {};
  try { body = await request.json(); } catch { /* بدنهٔ نامعتبر */ }
  const recipientId = String(body.recipientId || '');
  const recipient = recipientId ? await prisma.user.findFirst({
    where: { id: recipientId, role: 'student', active: true },
    select: { id: true },
  }) : null;
  if (!recipient || !(await canChatDirectly(user.id, recipient.id))) {
    return Response.json({ ok: false, error: 'فقط می‌توانید با اعضای فعال گروه‌های خودتان گفت‌وگوی خصوصی بسازید.' }, { status: 403 });
  }

  const chat = await getOrCreateDirectChat(user.id, recipient.id);
  return Response.json({ ok: true, chat: { id: chat.id } });
}
