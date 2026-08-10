import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';
import { hashPassword, verifyPassword } from '@/lib/password';

// تغییر رمز عبور توسط خودِ کاربر.
// اگر کاربر هنوز رمزی ندارد (مثلاً با کد پیامکی وارد شده) می‌تواند بدون رمز فعلی
// برای اولین بار رمز بگذارد؛ چون نشستِ معتبر خودش اثبات هویت است.
export async function PATCH(request) {
  const user = await getSessionUser();
  if (!user) return Response.json({ ok: false, error: 'ابتدا وارد شوید.' }, { status: 401 });

  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ ok: false, error: 'درخواست نامعتبر است.' }, { status: 400 });
  }

  const currentPassword = String(body?.currentPassword ?? '');
  const newPassword = String(body?.newPassword ?? '');

  if (newPassword.length < 8) {
    return Response.json({ ok: false, error: 'رمز جدید باید حداقل ۸ نویسه باشد.' }, { status: 400 });
  }
  if (newPassword.length > 100) {
    return Response.json({ ok: false, error: 'رمز جدید بیش از حد بلند است.' }, { status: 400 });
  }

  if (user.passwordHash) {
    if (!verifyPassword(currentPassword, user.passwordHash)) {
      return Response.json({ ok: false, error: 'رمز فعلی درست نیست.' }, { status: 400 });
    }
    if (verifyPassword(newPassword, user.passwordHash)) {
      return Response.json({ ok: false, error: 'رمز جدید با رمز فعلی یکی است.' }, { status: 400 });
    }
  }

  // passwordPlain فقط برای رمزِ صادرشده توسط مدیر است؛ وقتی کاربر رمز خودش را
  // انتخاب می‌کند پاک می‌شود تا نسخهٔ خوانا از دیتابیس حذف شود.
  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: hashPassword(newPassword), passwordPlain: null },
  });

  return Response.json({ ok: true, message: 'رمز عبور شما تغییر کرد.' });
}
