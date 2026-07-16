import { prisma } from '@/lib/prisma';
import { normalizePhone } from '@/lib/auth';
import { isSmsConfigured, sendOtpSms } from '@/lib/sms';

export async function POST(request) {
  try {
    const body = await request.json();
    const phone = normalizePhone(body.phone);
    if (!phone) {
      return Response.json({ ok: false, error: 'شماره موبایل معتبر نیست.' }, { status: 400 });
    }

    const code = String(Math.floor(1000 + Math.random() * 9000));
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    // ابطال کدهای قبلی استفاده‌نشده همان شماره
    await prisma.otpCode.updateMany({
      where: { phone, used: false },
      data: { used: true },
    });
    await prisma.otpCode.create({ data: { phone, code, expiresAt } });

    const sms = await sendOtpSms(phone, code);

    if (isSmsConfigured()) {
      // پنل پیامک وصل است؛ کد فقط از طریق پیامک ارسال می‌شود.
      if (!sms.delivered) {
        return Response.json({ ok: false, error: 'ارسال پیامک ناموفق بود. کمی بعد دوباره تلاش کنید.' }, { status: 502 });
      }
      return Response.json({ ok: true });
    }

    // حالت تست: تا وقتی پنل پیامک وصل نشده، کد برای آزمایش برگردانده می‌شود.
    return Response.json({ ok: true, devOtp: code });
  } catch {
    return Response.json({ ok: false, error: 'درخواست نامعتبر است.' }, { status: 400 });
  }
}
