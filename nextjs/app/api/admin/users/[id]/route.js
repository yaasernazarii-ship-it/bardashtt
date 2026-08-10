import { prisma } from '@/lib/prisma';
import { getSessionUser, isManager } from '@/lib/auth';
import { hashPassword } from '@/lib/password';
import { logAction } from '@/lib/audit';

const ROLES = ['member', 'student', 'filmmaker', 'editor', 'admin'];

function str(v, max) {
  if (typeof v !== 'string') return null;
  const t = v.trim().slice(0, max);
  return t || null;
}
function intOrNull(v, min, max) {
  if (v === undefined || v === null || v === '') return null;
  const n = parseInt(v, 10);
  if (Number.isNaN(n) || n < min || n > max) return null;
  return n;
}

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
      passwordPlain: true, active: true, branch: true, graduated: true, courseTitle: true, nationalId: true, createdAt: true,
      photoUrl: true,
      progressOverride: true,
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
      } else if (action === 'deleteSelfVideo') {
        await prisma.actorResume.updateMany({ where: { userId: id }, data: { selfVideoUrl: null } });
      } else if (action === 'hideResume') {
        await prisma.actorResume.updateMany({ where: { userId: id }, data: { isPublic: false } });
      } else if (action === 'deleteResume') {
        await prisma.actorResume.deleteMany({ where: { userId: id } });
      } else {
        return Response.json({ ok: false, error: 'عملیات نامعتبر است.' }, { status: 400 });
      }
      return Response.json({ ok: true, moderated: action });
    }

    // ساخت/ویرایش رزومه‌ی هنرجو توسط ادمین/ادیتور (هنرجو خودش دسترسی ویرایش ندارد)
    if (body.resume && typeof body.resume === 'object') {
      const b = body.resume;
      const target = await prisma.user.findUnique({ where: { id }, select: { displayName: true } });
      if (!target) return Response.json({ ok: false, error: 'کاربر یافت نشد.' }, { status: 404 });
      const fullName = str(b.fullName, 80) || target.displayName || 'هنرجو';
      const rData = {
        fullName,
        headline: str(b.headline, 100),
        bio: str(b.bio, 600),
        gender: ['male', 'female'].includes(b.gender) ? b.gender : null,
        city: str(b.city, 60),
        birthYear: intOrNull(b.birthYear, 1300, 1420),
        heightCm: intOrNull(b.heightCm, 100, 230),
        skills: str(b.skills, 300),
        experience: str(b.experience, 1500),
        photoUrl: str(b.photoUrl, 500),
        showreelUrl: str(b.showreelUrl, 500),
        isPublic: !!b.isPublic,
      };
      const resume = await prisma.actorResume.upsert({
        where: { userId: id },
        update: rData,
        create: { userId: id, ...rData },
      });
      return Response.json({ ok: true, resume });
    }

    const data = {};

    // فارغ‌التحصیل / بازگرداندن به تحصیل: خاموش/روشن‌کردن تقویم کلاس هنرجو
    if (body.graduated !== undefined) {
      data.graduated = !!body.graduated;
    }

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

    // تعیین دستیِ درصد پیشرفتِ هنرجو توسط ادمین/ادیتور (جای محاسبه‌ی خودکار بر پایه‌ی حضور را می‌گیرد)
    if (body.progressOverride !== undefined) {
      if (body.progressOverride === null || body.progressOverride === '') {
        data.progressOverride = null;
      } else {
        const n = intOrNull(body.progressOverride, 0, 100);
        if (n === null) return Response.json({ ok: false, error: 'درصد پیشرفت باید بین ۰ تا ۱۰۰ باشد.' }, { status: 400 });
        data.progressOverride = n;
      }
    }

    // تعیین یا پاک‌کردن نام کاربری؛ بدون نام کاربری، رمز عبور بی‌فایده است
    // چون ورود با «نام کاربری + رمز» انجام می‌شود.
    if (body.username !== undefined) {
      const raw = String(body.username || '').trim().toLowerCase();
      if (raw) {
        if (!/^[a-z0-9._-]{3,32}$/.test(raw)) {
          return Response.json({ ok: false, error: 'نام کاربری فقط حروف انگلیسی کوچک، عدد، نقطه، خط تیره و زیرخط (۳ تا ۳۲ نویسه).' }, { status: 400 });
        }
        const clash = await prisma.user.findUnique({ where: { username: raw }, select: { id: true } });
        if (clash && clash.id !== id) {
          return Response.json({ ok: false, error: 'این نام کاربری قبلاً گرفته شده است.' }, { status: 400 });
        }
        data.username = raw;
      } else {
        data.username = null;
      }
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
      select: { id: true, phone: true, displayName: true, city: true, role: true, username: true, passwordPlain: true, active: true, branch: true, graduated: true, progressOverride: true },
    });

    const who = updated.displayName || updated.username || updated.phone;
    const parts = [];
    if (data.role !== undefined) parts.push(`نقش → ${data.role}`);
    if (data.active !== undefined) parts.push(data.active ? 'فعال شد' : 'غیرفعال شد');
    if (data.username !== undefined) parts.push(`نام کاربری → ${data.username || '—'}`);
    if (data.passwordHash !== undefined) parts.push('رمز عبور بازنشانی شد');
    if (data.graduated !== undefined) parts.push(data.graduated ? 'فارغ‌التحصیل شد' : 'بازگشت به تحصیل');
    if (data.progressOverride !== undefined) parts.push(`درصد پیشرفت → ${data.progressOverride ?? 'خودکار'}`);
    if (parts.length) {
      await logAction(user, {
        action: data.passwordHash !== undefined ? 'user.password' : 'user.update',
        targetType: 'user',
        targetId: id,
        summary: `${who}: ${parts.join('، ')}`,
      });
    }

    return Response.json({ ok: true, user: updated });
  } catch {
    return Response.json({ ok: false, error: 'کاربر یافت نشد یا درخواست نامعتبر است.' }, { status: 400 });
  }
}
