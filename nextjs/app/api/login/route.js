import { prisma } from '@/lib/prisma';
import { createSession } from '@/lib/auth';
import { verifyPassword } from '@/lib/password';

export async function POST(request) {
  try {
    const b = await request.json();
    const username = String(b.username || '').trim().toLowerCase();
    const password = String(b.password || '');
    const remember = b.remember !== false;

    if (!username || !password) {
      return Response.json({ ok: false, error: 'نام کاربری و رمز عبور را وارد کنید.' }, { status: 400 });
    }

    const user = await prisma.user.findFirst({ where: { username } });
    if (!user || !user.passwordHash || !verifyPassword(password, user.passwordHash)) {
      return Response.json({ ok: false, error: 'نام کاربری یا رمز عبور نادرست است.' }, { status: 401 });
    }
    if (user.active === false) {
      return Response.json({ ok: false, error: 'حساب کاربری شما غیرفعال شده است. با پشتیبانی خانواده برداشت تماس بگیرید.' }, { status: 403 });
    }

    await createSession(user.id, { remember });

    return Response.json({
      ok: true,
      user: { id: user.id, phone: user.phone, displayName: user.displayName, role: user.role },
    });
  } catch {
    return Response.json({ ok: false, error: 'درخواست نامعتبر است.' }, { status: 400 });
  }
}
