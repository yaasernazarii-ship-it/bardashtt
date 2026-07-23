import { prisma } from '@/lib/prisma';
import { getSessionUser, isManager } from '@/lib/auth';
import { hashPassword } from '@/lib/password';

const ACTIONS = ['approve', 'reject'];

export async function PATCH(request, { params }) {
  const user = await getSessionUser();
  if (!user) return Response.json({ ok: false, error: 'ابتدا وارد شوید.' }, { status: 401 });
  if (!isManager(user)) return Response.json({ ok: false, error: 'دسترسی لازم را ندارید.' }, { status: 403 });

  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const action = body.action;
  const note = String(body.note || '').trim().slice(0, 400) || null;

  if (!ACTIONS.includes(action)) {
    return Response.json({ ok: false, error: 'عملیات نامعتبر است.' }, { status: 400 });
  }

  const req = await prisma.signupRequest.findUnique({ where: { id } });
  if (!req) return Response.json({ ok: false, error: 'درخواست یافت نشد.' }, { status: 404 });

  if (action === 'reject') {
    await prisma.signupRequest.update({ where: { id }, data: { status: 'rejected', adminNote: note } });
    return Response.json({ ok: true, status: 'rejected' });
  }

  // تأیید: نام کاربری و رمز عبور لازم است.
  const username = String(body.username || '').trim().toLowerCase();
  const password = String(body.password || '');
  if (!/^[a-z0-9._-]{3,32}$/.test(username)) {
    return Response.json({ ok: false, error: 'نام کاربری باید ۳ تا ۳۲ کاراکتر انگلیسی/عدد باشد.' }, { status: 400 });
  }
  if (password.length < 6) {
    return Response.json({ ok: false, error: 'رمز عبور حداقل ۶ کاراکتر باشد.' }, { status: 400 });
  }

  // فیلمساز ممکن است شماره تماس نداشته باشد؛ چون شماره در مدل کاربر یکتا و الزامی است،
  // برای فیلمساز یک شناسه‌ی یکتای جایگزین بر پایه‌ی کد ملی می‌سازیم.
  const accountPhone = (req.phone && req.phone.length >= 10)
    ? req.phone
    : `fm${req.nationalId || req.id}`;

  // نام کاربری نباید متعلق به حساب دیگری باشد.
  const taken = await prisma.user.findFirst({ where: { username, phone: { not: accountPhone } } });
  if (taken) {
    return Response.json({ ok: false, error: 'این نام کاربری قبلاً استفاده شده است.' }, { status: 409 });
  }

  const displayName = `${req.firstName} ${req.lastName}`.trim();
  const passwordHash = hashPassword(password);
  const role = req.role === 'filmmaker' ? 'filmmaker' : 'student';

  const account = await prisma.user.upsert({
    where: { phone: accountPhone },
    update: { displayName, username, passwordHash, passwordPlain: password, active: true, nationalId: req.nationalId, branch: req.branch, role },
    create: { phone: accountPhone, displayName, username, passwordHash, passwordPlain: password, nationalId: req.nationalId, branch: req.branch, role },
  });

  await prisma.signupRequest.update({
    where: { id },
    data: { status: 'approved', adminNote: note, username, userId: account.id },
  });

  return Response.json({ ok: true, status: 'approved', username });
}
