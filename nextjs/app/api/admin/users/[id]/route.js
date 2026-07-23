import { prisma } from '@/lib/prisma';
import { getSessionUser, isManager } from '@/lib/auth';
import { hashPassword } from '@/lib/password';

const ROLES = ['member', 'student', 'filmmaker', 'editor', 'admin'];

// جزئیات کامل پنل یک کاربر برای ادمین/ادیتور: رزومه، ثبت‌نام‌ها، مدارک بارگذاری‌شده.
export async function GET(request, { params }) {
  const user = await getSessionUser();
  if (!user) return Response.json({ ok: false, error: 'ابتدا وارد شوید.' }, { status: 401 });
  if (!isManager(user)) return Response.json({ ok: false, error: 'دسترسی لازم را ندارید.' }, { status: 403 });

  const { id } = await params;
  const target = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true, phone: true, displayName: true, city: true, role: true, username: true,
      passwordPlain: true, active: true, branch: true, courseTitle: true, nationalId: true, createdAt: true,
      resume: true,
      enrollments: { orderBy: { createdAt: 'desc' } },
    },
  });
  if (!target) return Response.json({ ok: false, error: 'کاربر یافت نشد.' }, { status: 404 });

  // مدارک ثبت‌نام (عکس شناسنامه/کارت ملی) از درخواست عضویت
  const signup = await prisma.signupRequest.findFirst({
    where: { userId: id },
    orderBy: { createdAt: 'desc' },
    select: { idCardImage: true, goal: true, birthDate: true },
  });

  return Response.json({ ok: true, user: { ...target, createdAt: target.createdAt.toISOString() }, signup });
}

export async function PATCH(request, { params }) {
  const user = await getSessionUser();
  if (!user) return Response.json({ ok: false, error: 'ابتدا وارد شوید.' }, { status: 401 });
  if (!isManager(user)) return Response.json({ ok: false, error: 'دسترسی لازم را ندارید.' }, { status: 403 });

  const { id } = await params;
  const isSelf = id === user.id;

  try {
    const body = await request.json();

    // مدیریت محتوای بارگذاری‌شده‌ی کاربر (رزومه) توسط ادمین/ادیتور
    if (body.moderate) {
      const action = String(body.moderate);
      if (action === 'deleteResumePhoto') {
        await prisma.actorResume.updateMany({ where: { userId: id }, data: { photoUrl: null } });
      } else if (action === 'deleteShowreel') {
        await prisma.actorResume.updateMany({ where: { userId: id }, data: { showreelUrl: null } });
      } else if (action === 'hideResume') {
        await prisma.actorResume.updateMany({ where: { userId: id }, data: { isPublic: false } });
      } else if (action === 'deleteResume') {
        await prisma.actorResume.deleteMany({ where: { userId: id } });
      } else {
        return Response.json({ ok: false, error: 'عملیات نامعتبر است.' }, { status: 400 });
      }
      return Response.json({ ok: true, moderated: action });
    }

    const data = {};

    // تغییر نقش
    if (body.role !== undefined) {
      if (isSelf) return Response.json({ ok: false, error: 'نقش حساب خودتان را نمی‌توانید تغییر دهید.' }, { status: 400 });
      if (!ROLES.includes(String(body.role))) return Response.json({ ok: false, error: 'نقش نامعتبر است.' }, { status: 400 });
      data.role = String(body.role);
    }

    // فعال/غیرفعال کردن حساب
    if (body.active !== undefined) {
      if (isSelf) return Response.json({ ok: false, error: 'حساب خودتان را نمی‌توانید غیرفعال کنید.' }, { status: 400 });
      data.active = !!body.active;
    }

    // بازنشانی رمز عبور
    if (body.password !== undefined) {
      const password = String(body.password || '');
      if (password.length < 6) return Response.json({ ok: false, error: 'رمز عبور حداقل ۶ کاراکتر باشد.' }, { status: 400 });
      data.passwordHash = hashPassword(password);
      data.passwordPlain = password;
    }

    if (Object.keys(data).length === 0) {
      return Response.json({ ok: false, error: 'تغییری ارسال نشده است.' }, { status: 400 });
    }

    const updated = await prisma.user.update({
      where: { id },
      data,
      select: { id: true, phone: true, displayName: true, city: true, role: true, username: true, passwordPlain: true, active: true, branch: true },
    });
    return Response.json({ ok: true, user: updated });
  } catch {
    return Response.json({ ok: false, error: 'کاربر یافت نشد یا درخواست نامعتبر است.' }, { status: 400 });
  }
}
