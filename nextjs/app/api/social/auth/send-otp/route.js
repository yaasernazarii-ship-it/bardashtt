import { randomInt } from 'crypto';
import { prisma } from '@/lib/prisma';
import { normalizePhone } from '@/lib/auth';
import { isSmsConfigured, sendOtpSms } from '@/lib/sms';

export async function POST(request) {
  let body;
  try { body = await request.json(); } catch { return Response.json({ ok: false, error: 'درخواست نامعتبر است.' }, { status: 400 }); }
  const phone = normalizePhone(body.phone);
  if (!phone) return Response.json({ ok: false, error: 'شماره موبایل معتبر نیست.' }, { status: 400 });
  const purpose = body.purpose === 'login' ? 'login' : 'signup';
  const account = await prisma.socialAccount.findUnique({ where: { phone } });
  if (purpose === 'signup' && account) return Response.json({ ok: false, error: 'این شماره قبلاً در برداشتگرام ثبت‌نام کرده است.' }, { status: 409 });
  if (purpose === 'login' && (!account || !account.active)) return Response.json({ ok: false, error: 'حساب فعال برداشتگرام برای این شماره پیدا نشد.' }, { status: 404 });
  const recent = await prisma.socialOtpCode.findFirst({ where: { phone, purpose, createdAt: { gt: new Date(Date.now() - 60_000) } } });
  if (recent) return Response.json({ ok: true, message: 'کد قبلاً ارسال شده؛ یک دقیقه صبر کنید.' });
  const code = String(randomInt(1000, 10000));
  await prisma.$transaction([
    prisma.socialOtpCode.updateMany({ where: { phone, used: false }, data: { used: true } }),
    prisma.socialOtpCode.create({ data: { phone, code, purpose, expiresAt: new Date(Date.now() + 5 * 60_000) } }),
  ]);
  const sms = await sendOtpSms(phone, code);
  if (isSmsConfigured() && !sms.delivered) return Response.json({ ok: false, error: 'ارسال پیامک ناموفق بود.' }, { status: 502 });
  return Response.json({ ok: true, ...(!isSmsConfigured() ? { devOtp: code } : {}) });
}
