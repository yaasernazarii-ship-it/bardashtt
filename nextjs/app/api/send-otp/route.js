import { prisma } from '@/lib/prisma';
import { normalizePhone } from '@/lib/auth';

// اتصال به پنل پیامک بعداً از طریق همین تابع انجام می‌شود.
async function sendSms(/* phone, code */) {
  // TODO: وقتی اطلاعات پنل پیامک ارسال شد، ارسال واقعی اینجا اضافه می‌شود.
  return { delivered: false };
}

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

    const sms = await sendSms(phone, code);

    // تا وقتی پنل پیامک وصل نشده، کد برای تست برگردانده می‌شود.
    const payload = { ok: true };
    if (!sms.delivered) payload.devOtp = code;
    return Response.json(payload);
  } catch {
    return Response.json({ ok: false, error: 'درخواست نامعتبر است.' }, { status: 400 });
  }
}
