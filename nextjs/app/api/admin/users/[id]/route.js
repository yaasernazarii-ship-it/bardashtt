import { prisma } from '@/lib/prisma';
import { getSessionUser, isManager } from '@/lib/auth';
import { hashPassword } from '@/lib/password';
import { logAction } from '@/lib/audit';
import { removeLocalUploads } from '@/lib/uploadCleanup';
import { privateDocumentUrl } from '@/lib/privateDocuments';

const ROLES = ['member', 'student', 'filmmaker', 'editor', 'admin'];

function intOrNull(v, min, max) {
  if (v === undefined || v === null || v === '') return null;
  const n = parseInt(v, 10);
  if (Number.isNaN(n) || n < min || n > max) return null;
  return n;
}

// جزئیات کامل پنل یک کاربر برای ادمین/ادیتور: ثبت‌نام‌ها و مدارک بارگذاری‌شده.
// رزومه‌های بازیگری عمداً این‌جا نیستند؛ آن‌ها پرونده‌های مستقل «بانک رزومه» هستند.
export async function GET(request, { params }) {
  const user = await getSessionUser();
  if (!user) return Response.json({ ok: false, error: 'ابتدا وارد شوید.' }, { status: 401 });
  if (!isManager(user)) return Response.json({ ok: false, error: 'دسترسی لازم را ندارید.' }, { status: 403 });

  const { id } = await params;
  const target = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true, phone: true, displayName: true, city: true, role: true, username: true,
      passwordPlain: true, active: true, deletedAt: true, branch: true, graduated: true, courseTitle: true, nationalId: true, createdAt: true,
      photoUrl: true,
      progressOverride: true,
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

  const safeSignup = signup ? { ...signup, idCardImage: privateDocumentUrl(signup.idCardImage) } : null;
  return Response.json({ ok: true, user: { ...target, createdAt: target.createdAt.toISOString() }, signup: safeSignup });
}

export async function PATCH(request, { params }) {
  const user = await getSessionUser();
  if (!user) return Response.json({ ok: false, error: 'ابتدا وارد شوید.' }, { status: 401 });
  if (!isManager(user)) return Response.json({ ok: false, error: 'دسترسی لازم را ندارید.' }, { status: 403 });

  const { id } = await params;
  const isSelf = id === user.id;

  try {
    const body = await request.json();

    const account = await prisma.user.findUnique({ where: { id }, select: { deletedAt: true } });
    if (!account) return Response.json({ ok: false, error: 'کاربر یافت نشد.' }, { status: 404 });
    if (account.deletedAt) {
      return Response.json({ ok: false, error: 'حساب بایگانی‌شده فقط برای مشاهده و حذف دستی مدارک در دسترس است.' }, { status: 409 });
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

export async function DELETE(request, { params }) {
  const user = await getSessionUser();
  if (!user) return Response.json({ ok: false, error: 'ابتدا وارد شوید.' }, { status: 401 });
  if (!isManager(user)) return Response.json({ ok: false, error: 'دسترسی لازم را ندارید.' }, { status: 403 });

  const { id } = await params;
  if (id === user.id) {
    return Response.json({ ok: false, error: 'حساب خودتان را نمی‌توانید حذف کنید.' }, { status: 400 });
  }

  const target = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      displayName: true,
      username: true,
      phone: true,
      role: true,
      deletedAt: true,
      photoUrl: true,
      enrollments: { select: { videoUrl: true } },
      _count: { select: { examAttempts: true, certificates: true } },
    },
  });
  if (!target) return Response.json({ ok: false, error: 'کاربر یافت نشد.' }, { status: 404 });
  if (target.deletedAt) return Response.json({ ok: false, error: 'این حساب قبلاً بایگانی شده است.' }, { status: 409 });
  if (target.role === 'admin' || target.role === 'editor') {
    return Response.json({ ok: false, error: 'حساب مدیریتی از این بخش قابل حذف نیست.' }, { status: 403 });
  }

  const preserveDocuments = Boolean(target._count.examAttempts || target._count.certificates);

  const [signups, submissions] = await Promise.all([
    prisma.signupRequest.findMany({ where: { userId: id }, select: { idCardImage: true } }),
    prisma.assignmentSubmission.findMany({ where: { userId: id }, select: { fileUrl: true } }),
  ]);

  try {
    await prisma.$transaction(async (tx) => {
      await tx.signupRequest.deleteMany({ where: { userId: id } });
      await tx.enrollment.deleteMany({ where: { userId: id } });
      await tx.bookingRequest.deleteMany({ where: { userId: id } });
      await tx.notification.deleteMany({ where: { userId: id } });
      await tx.bookOrder.deleteMany({ where: { userId: id } });

      // فقط لیست کوتاهِ خودِ این کاربر پاک می‌شود؛ رزومه‌ها پرونده‌های مستقل‌اند و به حساب او وابسته نیستند.
      await tx.actorShortlist.deleteMany({ where: { userId: id } });

      await tx.assignmentSubmission.deleteMany({ where: { userId: id } });
      await tx.assignment.deleteMany({ where: { userId: id } });
      await tx.growthTask.deleteMany({ where: { userId: id } });
      await tx.habit.deleteMany({ where: { userId: id } });
      await tx.growthGoal.deleteMany({ where: { userId: id } });
      await tx.journalEntry.deleteMany({ where: { userId: id } });
      await tx.assessment.deleteMany({ where: { userId: id } });
      await tx.mentorNote.deleteMany({ where: { userId: id } });
      await tx.studentProgressComment.deleteMany({ where: { userId: id } });

      await tx.chatGroupMessage.deleteMany({ where: { authorId: id } });
      await tx.chatGroupRead.deleteMany({ where: { userId: id } });
      await tx.chatGroupMember.deleteMany({ where: { userId: id } });
      await tx.directChat.deleteMany({ where: { OR: [{ userAId: id }, { userBId: id }] } });

      await tx.attendance.deleteMany({ where: { userId: id } });
      await tx.payment.deleteMany({ where: { userId: id } });
      await tx.courseAccess.deleteMany({ where: { userId: id } });
      await tx.session.deleteMany({ where: { userId: id } });

      if (preserveDocuments) {
        await tx.user.update({
          where: { id },
          data: {
            phone: `archived-${id}`,
            username: null,
            passwordHash: null,
            passwordPlain: null,
            active: false,
            role: 'member',
            classGroupId: null,
            photoUrl: null,
            deletedAt: new Date(),
          },
        });
      } else {
        await tx.user.delete({ where: { id } });
      }
    }, { timeout: 15000 });
  } catch {
    return Response.json({ ok: false, error: 'حذف حساب از فهرست‌ها انجام نشد.' }, { status: 500 });
  }

  await removeLocalUploads([
    target.photoUrl,
    ...target.enrollments.map((item) => item.videoUrl),
    ...signups.map((item) => item.idCardImage),
    ...submissions.map((item) => item.fileUrl),
  ]);

  const who = target.displayName || target.username || target.phone;
  await logAction(user, {
    action: 'user.delete',
    targetType: 'user',
    targetId: id,
    summary: preserveDocuments
      ? `حساب «${who}» بایگانی شد؛ آزمون‌ها و گواهی‌ها برای حذف دستی مدیریت حفظ شدند.`
      : `حساب «${who}» و تمام اطلاعات وابسته از سایت حذف شد.`,
  }).catch(() => {});

  return Response.json({ ok: true });
}
