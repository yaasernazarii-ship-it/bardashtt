import { prisma } from '@/lib/prisma';
import { getSessionUser, isManager, normalizePhone } from '@/lib/auth';
import { sendMessage } from '@/lib/bale';

// ثبت درخواست «ست تایم» توسط فیلمساز/کاربر واردشده روی رزومهٔ یک بازیگر.
export async function POST(request) {
  const user = await getSessionUser();
  if (!user) return Response.json({ ok: false, error: 'برای ثبت درخواست ابتدا وارد شوید.' }, { status: 401 });

  try {
    const b = await request.json();
    const actorId = String(b.actorId || '').trim();
    const name = String(b.name || '').trim().slice(0, 80);
    const phone = normalizePhone(b.phone);
    const message = String(b.message || '').trim().slice(0, 1500);

    if (!actorId) return Response.json({ ok: false, error: 'بازیگر مشخص نیست.' }, { status: 400 });
    if (!name) return Response.json({ ok: false, error: 'نام خود را وارد کنید.' }, { status: 400 });
    if (!phone) return Response.json({ ok: false, error: 'شماره تماس معتبر نیست.' }, { status: 400 });
    if (!message) return Response.json({ ok: false, error: 'پیام خود را بنویسید.' }, { status: 400 });

    const actor = await prisma.actorResume.findFirst({ where: { id: actorId, isPublic: true }, select: { id: true, fullName: true } });
    if (!actor) return Response.json({ ok: false, error: 'بازیگر یافت نشد.' }, { status: 404 });

    const booking = await prisma.bookingRequest.create({
      data: {
        actorId: actor.id,
        actorName: actor.fullName,
        userId: user.id,
        name,
        phone,
        message,
      },
    });

    // اعلان به ادمین از طریق ربات بله (در صورت پیکربندی)
    try {
      await sendMessage(
        `🎬 درخواست ست تایم جدید\n\nبازیگر: ${actor.fullName}\nاز طرف: ${name}\nتماس: ${phone}\n\nپیام:\n${message}`,
      );
    } catch { /* اعلان بله حیاتی نیست */ }

    return Response.json({ ok: true, id: booking.id });
  } catch {
    return Response.json({ ok: false, error: 'درخواست نامعتبر است.' }, { status: 400 });
  }
}

// فهرست درخواست‌ها برای ادمین/ادیتور
export async function GET() {
  const user = await getSessionUser();
  if (!user) return Response.json({ ok: false, error: 'ابتدا وارد شوید.' }, { status: 401 });
  if (!isManager(user)) return Response.json({ ok: false, error: 'دسترسی لازم را ندارید.' }, { status: 403 });

  const bookings = await prisma.bookingRequest.findMany({ orderBy: { createdAt: 'desc' } });
  return Response.json({ ok: true, bookings });
}
