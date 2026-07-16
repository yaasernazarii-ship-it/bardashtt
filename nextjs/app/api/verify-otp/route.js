import { prisma } from '@/lib/prisma';
import { normalizePhone, createSession } from '@/lib/auth';

export async function POST(request) {
  try {
    const body = await request.json();
    const phone = normalizePhone(body.phone);
    const code = String(body.code || '').replace(/[^\d]/g, '');

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

    await prisma.otpCode.update({ where: { id: otp.id }, data: { used: true } });

    const user = await prisma.user.upsert({
      where: { phone },
      update: {},
      create: { phone },
    });

    await createSession(user.id);

    return Response.json({
      ok: true,
      user: { id: user.id, phone: user.phone, displayName: user.displayName, role: user.role },
    });
  } catch {
    return Response.json({ ok: false, error: 'درخواست نامعتبر است.' }, { status: 400 });
  }
}
