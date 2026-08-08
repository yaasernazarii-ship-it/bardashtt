import { prisma } from '@/lib/prisma';
import { normalizePhone, createSession, toLatinDigits } from '@/lib/auth';

// ورود با کد پیامکی، فقط برای حساب‌های از قبل ساخته‌شده.
// این مسیر عمداً هیچ حسابی نمی‌سازد (بدون upsert)؛ اگر شماره به یک حسابِ فعال
// تعلق نداشته باشد، حتی با کد درست هم ورودی انجام نمی‌شود.
export async function POST(request) {
  try {
    const body = await request.json();
    const phone = normalizePhone(body.phone);
    const code = toLatinDigits(body.code).replace(/[^\d]/g, '');

    if (!phone || !code) {
      return Response.json({ ok: false, error: 'شماره یا کد نامعتبر است.' }, { status: 400 });
    }

    const otp = await prisma.otpCode.findFirst({
      where: { phone, code, used: false, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: 'desc' },
    });
    if (!otp) {
      return Response.json({ ok: false, error: 'کد تأیید نادرست یا منقضی شده است.' }, { status: 400 });
    }

    // کد را همین‌جا مصرف می‌کنیم تا قابل استفاده‌ی مجدد نباشد، حتی اگر در ادامه ورود رد شود.
    await prisma.otpCode.update({ where: { id: otp.id }, data: { used: true } });

    // فقط حسابِ موجود و فعال وارد می‌شود؛ هیچ حسابی ساخته نمی‌شود.
    const user = await prisma.user.findUnique({ where: { phone } });
    if (!user || user.active === false) {
      return Response.json(
        { ok: false, error: 'حسابی برای این شماره یافت نشد. ابتدا حساب شما باید ساخته و تأیید شود.' },
        { status: 403 },
      );
    }

    await createSession(user.id);

    return Response.json({
      ok: true,
      user: { id: user.id, phone: user.phone, displayName: user.displayName, role: user.role },
    });
  } catch {
    return Response.json({ ok: false, error: 'درخواست نامعتبر است.' }, { status: 400 });
  }
}
