import { randomInt } from 'crypto';
import { prisma } from '@/lib/prisma';
import { normalizePhone } from '@/lib/auth';
import { isSmsConfigured, sendOtpSms } from '@/lib/sms';
import { isLocked, recordFailure } from '@/lib/rateLimit';

// ارسال کد تأیید برای ورود/بازیابیِ حساب‌های موجود.
// این مسیر هیچ حسابی نمی‌سازد؛ حساب فقط با تأیید مدیر ساخته می‌شود، پس هر حسابِ موجودِ فعال
// مجاز به دریافت کد است (حتی اگر هنوز رمزی برایش صادر نشده باشد).
// برای جلوگیری از افشای اینکه چه شماره‌ای حساب دارد، پاسخ در همه‌ی حالت‌ها یکسان و عمومی است.
const GENERIC_OK = {
  ok: true,
  message: 'اگر این شماره به یک حساب تأییدشده تعلق داشته باشد، کد تأیید پیامک می‌شود.',
};

export async function POST(request) {
  try {
    const body = await request.json();
    const phone = normalizePhone(body.phone);
    if (!phone) {
      return Response.json({ ok: false, error: 'شماره موبایل معتبر نیست.' }, { status: 400 });
    }

    // فقط حساب‌های موجود و فعال اجازه‌ی ورود با پیامک دارند.
    const user = await prisma.user.findUnique({ where: { phone } });
    const eligible = !!user && user.active !== false;
    if (!eligible) {
      // پاسخِ عمومی؛ نه کدی می‌سازیم نه پیامکی می‌فرستیم.
      return Response.json(GENERIC_OK);
    }

    // محدودسازی نرخ: اگر در ۶۰ ثانیه‌ی اخیر کدی برای این شماره ساخته شده، دوباره نمی‌فرستیم.
    const recent = await prisma.otpCode.findFirst({
      where: { phone, createdAt: { gt: new Date(Date.now() - 60 * 1000) } },
      orderBy: { createdAt: 'desc' },
    });
    if (recent) {
      return Response.json(GENERIC_OK);
    }

    // محدودسازی نرخ بر اساس IP: جلوگیری از ارسال انبوه کد به شماره‌های مختلف.
    const ip = String(request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '').split(',')[0].trim().slice(0, 64) || 'unknown';
    const ipKey = `otp-ip:${ip}`;
    if (await isLocked(ipKey, { max: 10 })) {
      return Response.json({ ok: false, error: 'درخواست‌های زیادی ارسال شده. کمی بعد دوباره تلاش کنید.' }, { status: 429 });
    }
    await recordFailure(ipKey, { windowMs: 10 * 60 * 1000 });

    // کد تأیید با crypto.randomInt (غیرقابل پیش‌بینی) به‌جای Math.random
    const code = String(await new Promise((resolve, reject) => randomInt(1000, 10000, (err, val) => err ? reject(err) : resolve(val))));
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    // ابطال کدهای قبلی استفاده‌نشده‌ی همان شماره.
    await prisma.otpCode.updateMany({
      where: { phone, used: false },
      data: { used: true },
    });
    await prisma.otpCode.create({ data: { phone, code, expiresAt } });

    const sms = await sendOtpSms(phone, code);

    if (isSmsConfigured()) {
      if (!sms.delivered) {
        return Response.json({ ok: false, error: 'ارسال پیامک ناموفق بود. کمی بعد دوباره تلاش کنید.' }, { status: 502 });
      }
      return Response.json(GENERIC_OK);
    }

    // حالت توسعه: فقط وقتی پنل پیامک وصل نیست و محیط production نیست
    if (process.env.NODE_ENV !== 'production') {
      return Response.json({ ...GENERIC_OK, devOtp: code });
    }
    return Response.json({ ok: false, error: 'سرویس پیامک پیکربندی نشده است.' }, { status: 500 });
  } catch {
    return Response.json({ ok: false, error: 'درخواست نامعتبر است.' }, { status: 400 });
  }
}
