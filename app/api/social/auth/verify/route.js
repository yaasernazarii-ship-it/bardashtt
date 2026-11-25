import { prisma } from '@/lib/prisma';
import { normalizePhone } from '@/lib/auth';
import { createSocialSession } from '@/lib/socialAuth';

export async function POST(request) {
  let body;
  try { body = await request.json(); } catch { return Response.json({ ok: false, error: 'درخواست نامعتبر است.' }, { status: 400 }); }
  const phone = normalizePhone(body.phone);
  const purpose = body.purpose === 'login' ? 'login' : 'signup';
  const code = String(body.code || '').trim();
  if (!phone || !/^\d{4}$/.test(code)) return Response.json({ ok: false, error: 'اطلاعات واردشده معتبر نیست.' }, { status: 400 });
  const otp = await prisma.socialOtpCode.findFirst({ where: { phone, purpose, code, used: false, expiresAt: { gt: new Date() } }, orderBy: { createdAt: 'desc' } });
  if (!otp) return Response.json({ ok: false, error: 'کد تأیید اشتباه یا منقضی است.' }, { status: 400 });

  let account;
  if (purpose === 'login') {
    account = await prisma.socialAccount.findUnique({ where: { phone } });
    if (!account?.active) return Response.json({ ok: false, error: 'این حساب فعال نیست.' }, { status: 403 });
  } else {
    const username = String(body.username || '').trim().toLowerCase();
    const displayName = String(body.displayName || '').trim().slice(0, 60);
    if (!/^[a-z0-9_]{3,24}$/.test(username)) return Response.json({ ok: false, error: 'نام کاربری باید ۳ تا ۲۴ حرف لاتین، عدد یا زیرخط باشد.' }, { status: 400 });
    if (displayName.length < 2) return Response.json({ ok: false, error: 'نام نمایشی را وارد کنید.' }, { status: 400 });
    try { account = await prisma.socialAccount.create({ data: { phone, username, displayName } }); }
    catch { return Response.json({ ok: false, error: 'این شماره یا نام کاربری قبلاً استفاده شده است.' }, { status: 409 }); }
  }
  await prisma.socialOtpCode.update({ where: { id: otp.id }, data: { used: true } });
  await createSocialSession(account.id);
  return Response.json({ ok: true, account: { username: account.username, displayName: account.displayName } });
}
