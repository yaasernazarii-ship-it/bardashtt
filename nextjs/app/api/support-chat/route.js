import { prisma } from '@/lib/prisma';
import { sendMessage, isBaleConfigured } from '@/lib/bale';
import { isLocked, recordFailure } from '@/lib/rateLimit';

const ADMIN_URL = 'https://www.bardashtt.com/dashboard/admin/support';

function serializeMessage(m) {
  return { id: m.id, role: m.role, body: m.body, createdAt: m.createdAt.toISOString() };
}

// بازدیدکننده: ایجاد گفتگو یا افزودن پیام جدید.
export async function POST(request) {
  try {
    // محدودسازی نرخ: هر IP حداکثر ۲۰ پیام در ۱۰ دقیقه
    const ip = String(request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '').split(',')[0].trim().slice(0, 64) || 'unknown';
    const rateKey = `support:${ip}`;
    if (await isLocked(rateKey, { max: 20 })) {
      return Response.json({ ok: false, error: 'پیام‌های زیادی ارسال شده. کمی بعد دوباره تلاش کنید.' }, { status: 429 });
    }

    const data = await request.json();
    const name = String(data.name || '').trim().slice(0, 80);
    const phone = String(data.phone || '').trim().slice(0, 30);
    const message = String(data.message || '').trim().slice(0, 2000);
    const conversationId = String(data.conversationId || '').trim();

    if (!message) {
      return Response.json({ ok: false, error: 'پیام خالی است.' }, { status: 400 });
    }

    let conversation = null;
    if (conversationId) {
      conversation = await prisma.supportConversation.findUnique({ where: { id: conversationId } });
    }

    if (!conversation) {
      if (!name) return Response.json({ ok: false, error: 'نام الزامی است.' }, { status: 400 });
      conversation = await prisma.supportConversation.create({
        data: { visitorName: name, visitorPhone: phone || null },
      });
    }

    await prisma.supportMessage.create({
      data: { conversationId: conversation.id, role: 'visitor', body: message },
    });
    await prisma.supportConversation.update({
      where: { id: conversation.id },
      data: { lastMessageAt: new Date(), adminUnread: { increment: 1 }, status: 'open' },
    });

    await recordFailure(rateKey, { windowMs: 10 * 60 * 1000 });

    if (isBaleConfigured()) {
      const ping = [
        '💬 پیام جدید در چت آنلاین سایت',
        `نام: ${conversation.visitorName}`,
        conversation.visitorPhone ? `موبایل: ${conversation.visitorPhone}` : null,
        `پیام: ${message}`,
        `پاسخ از پنل: ${ADMIN_URL}`,
      ].filter(Boolean).join('\n');
      sendMessage(ping).catch(() => {});
    }

    return Response.json({ ok: true, conversationId: conversation.id });
  } catch {
    return Response.json({ ok: false, error: 'درخواست نامعتبر است.' }, { status: 400 });
  }
}

// بازدیدکننده: دریافت پیام‌های جدید (polling) بر اساس زمان.
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const conversationId = String(searchParams.get('conversationId') || '').trim();
    const after = searchParams.get('after');
    if (!conversationId) return Response.json({ ok: false, error: 'گفتگو مشخص نیست.' }, { status: 400 });

    const conversation = await prisma.supportConversation.findUnique({ where: { id: conversationId } });
    if (!conversation) return Response.json({ ok: false, error: 'گفتگو یافت نشد.' }, { status: 404 });

    const where = { conversationId };
    if (after) {
      const afterDate = new Date(after);
      if (!Number.isNaN(afterDate.getTime())) where.createdAt = { gt: afterDate };
    }

    const messages = await prisma.supportMessage.findMany({
      where,
      orderBy: { createdAt: 'asc' },
    });

    return Response.json({ ok: true, messages: messages.map(serializeMessage) });
  } catch {
    return Response.json({ ok: false, error: 'درخواست نامعتبر است.' }, { status: 400 });
  }
}
