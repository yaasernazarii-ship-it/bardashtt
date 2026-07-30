import { prisma } from '@/lib/prisma';
import { normalizePhone } from '@/lib/auth';
import { isSmsConfigured, sendOtpSms } from '@/lib/sms';

// ارسال کد تأیید فقط برای «بازیابی ورود» حساب‌های از قبل‌تأییدشده است.
// این مسیر هیچ حسابی نمی‌سازد؛ اگر شماره متعلق به یک حسابِ فعالِ تأییدشده (دارای رمز) نباشد،
// عمداً هیچ کدی ساخته یا ارسال نمی‌شود. برای جلوگیری از افشای اینکه چه شماره‌ای حساب دارد،
// پاسخ در همه‌ی حالت‌ها یکسان و عمومی است.
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

    // فقط حساب‌های موجود، فعال و تأییدشده (دارای رمزِ صادرشده) اجازه‌ی بازیابی با پیامک دارند.
    const user = await prisma.user.findUnique({ where: { phone } });
    const eligible = !!user && user.active !== false && !!user.passwordHash;
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

    const code = String(Math.floor(1000 + Math.random() * 9000));
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

    // حالت توسعه: تا وقتی پنل پیامک وصل نشده، کد برای آزمایش برگردانده می‌شود.
    return Response.json({ ...GENERIC_OK, devOtp: code });
  } catch {
    return Response.json({ ok: false, error: 'درخواست نامعتبر است.' }, { status: 400 });
  }
}
