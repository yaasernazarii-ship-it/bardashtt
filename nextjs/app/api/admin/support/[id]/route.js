import { prisma } from '@/lib/prisma';
import { getSessionUser, isManager } from '@/lib/auth';

function serializeMessage(m) {
  return { id: m.id, role: m.role, body: m.body, createdAt: m.createdAt.toISOString() };
}

async function guard() {
  const user = await getSessionUser();
  if (!user) return { error: Response.json({ ok: false, error: 'ابتدا وارد شوید.' }, { status: 401 }) };
  if (!isManager(user)) return { error: Response.json({ ok: false, error: 'دسترسی لازم را ندارید.' }, { status: 403 }) };
  return { user };
}

// دریافت پیام‌های یک گفتگو و صفرکردن شمارنده‌ی خوانده‌نشده.
export async function GET(request, { params }) {
  const g = await guard();
  if (g.error) return g.error;
  const { id } = await params;

  const conversation = await prisma.supportConversation.findUnique({ where: { id } });
  if (!conversation) return Response.json({ ok: false, error: 'گفتگو یافت نشد.' }, { status: 404 });

  await prisma.supportConversation.update({ where: { id }, data: { adminUnread: 0 } });

  const messages = await prisma.supportMessage.findMany({
    where: { conversationId: id },
    orderBy: { createdAt: 'asc' },
  });

  return Response.json({
    ok: true,
    conversation: {
      id: conversation.id,
      visitorName: conversation.visitorName,
      visitorPhone: conversation.visitorPhone,
      status: conversation.status,
    },
    messages: messages.map(serializeMessage),
  });
}

// پاسخ ادمین در گفتگو.
export async function POST(request, { params }) {
  const g = await guard();
  if (g.error) return g.error;
  const { id } = await params;

  let body = '';
  try {
    const data = await request.json();
    body = String(data.body || '').trim().slice(0, 2000);
  } catch {
    return Response.json({ ok: false, error: 'درخواست نامعتبر است.' }, { status: 400 });
  }
  if (!body) return Response.json({ ok: false, error: 'پیام خالی است.' }, { status: 400 });

  const conversation = await prisma.supportConversation.findUnique({ where: { id } });
  if (!conversation) return Response.json({ ok: false, error: 'گفتگو یافت نشد.' }, { status: 404 });

  const message = await prisma.supportMessage.create({
    data: { conversationId: id, role: 'admin', body },
  });
  await prisma.supportConversation.update({
    where: { id },
    data: { lastMessageAt: new Date(), adminUnread: 0 },
  });

  return Response.json({ ok: true, message: serializeMessage(message) });
}

// بستن یا بازکردن گفتگو.
export async function PATCH(request, { params }) {
  const g = await guard();
  if (g.error) return g.error;
  const { id } = await params;

  let status = '';
  try {
    const data = await request.json();
    status = data.status === 'closed' ? 'closed' : 'open';
  } catch {
    return Response.json({ ok: false, error: 'درخواست نامعتبر است.' }, { status: 400 });
  }

  const conversation = await prisma.supportConversation.findUnique({ where: { id } });
  if (!conversation) return Response.json({ ok: false, error: 'گفتگو یافت نشد.' }, { status: 404 });

  await prisma.supportConversation.update({ where: { id }, data: { status } });
  return Response.json({ ok: true, status });
}
