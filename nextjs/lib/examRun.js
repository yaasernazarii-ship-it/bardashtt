import { prisma } from './prisma';
import { isManager } from './auth';
import { gradeAttempt } from './exam';
import { issueCertificate } from './certificate';
import { notifyUsers } from './notifications';

// ── مجوز آزمون ────────────────────────────────────────────────
// هر مجوز یک بازهٔ زمانی دارد که در آن، صفحهٔ آزمون برای هنرجو باز است:
// از startsAt (خالی = از لحظهٔ صدور) تا expiresAt (خالی = بدون محدودیت).
// این بازه فقط زمانِ ورود و شروع را تعیین می‌کند؛ پس از شروع، آزمون با مهلت
// خودش (زمان هر سؤال) جلو می‌رود و پایانِ بازه آن را قطع نمی‌کند.

// مجوزی که هنوز زنده است: باطل نشده، خرج نشده و بازه‌اش تمام نشده.
// شاملِ مجوزِ زمان‌بندی‌شده‌ای هم می‌شود که هنوز بازه‌اش نرسیده است.
export function pendingPermitWhere(userId, now = new Date()) {
  return {
    userId,
    revoked: false,
    usedAt: null,
    OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
  };
}

// مجوزی که همین حالا قابل استفاده است: بازه‌اش هم شروع شده باشد.
export function usablePermitWhere(userId, now = new Date()) {
  return {
    ...pendingPermitWhere(userId, now),
    AND: [{ OR: [{ startsAt: null }, { startsAt: { lte: now } }] }],
  };
}

export function findUsablePermit(userId, now = new Date()) {
  return prisma.examPermit.findFirst({
    where: usablePermitWhere(userId, now),
    orderBy: { grantedAt: 'asc' }, // قدیمی‌ترین مجوز اول خرج می‌شود
  });
}

// برای نمایش وضعیت به هنرجو؛ مجوزِ زمان‌بندی‌شده را هم برمی‌گرداند تا
// به‌جای «اجازه ندارید»، زمان باز شدن آزمون را ببیند.
export function findPendingPermit(userId, now = new Date()) {
  return prisma.examPermit.findFirst({
    where: pendingPermitWhere(userId, now),
    orderBy: { grantedAt: 'asc' },
  });
}

// آیا بازهٔ این مجوز هنوز شروع نشده است؟
export function permitNotOpenYet(permit, now = new Date()) {
  return !!(permit && permit.startsAt && permit.startsAt > now);
}

// ── حرکت رو به جلوی سؤال‌ها ────────────────────────────────────
// مهلت هر سؤال مستقل است و با بستن مرورگر متوقف نمی‌شود. این تابع وضعیت ذخیره‌شده را
// با زمان واقعی هماهنگ می‌کند: هر مهلتِ سپری‌شده یک سؤال جلو می‌برد. مکان‌نما هرگز عقب نمی‌رود.
export async function syncCursor(attempt, now = new Date()) {
  if (attempt.submittedAt) return attempt;

  const perMs = Math.max(1, attempt.perQuestionSec) * 1000;

  // آزمونی که پیش از راه‌اندازی مهلتِ تک‌سؤالی باز شده بود، از همین لحظه زمان‌بندی می‌شود.
  if (!attempt.questionEndsAt) {
    return prisma.examAttempt.update({
      where: { id: attempt.id },
      data: { questionEndsAt: new Date(now.getTime() + perMs) },
    });
  }

  const ends = attempt.questionEndsAt.getTime();
  if (now.getTime() < ends) return attempt;

  const skipped = Math.floor((now.getTime() - ends) / perMs) + 1;
  const cursor = Math.min(attempt.cursor + skipped, attempt.total);
  const questionEndsAt = cursor >= attempt.total ? attempt.questionEndsAt : new Date(ends + skipped * perMs);

  return prisma.examAttempt.update({
    where: { id: attempt.id },
    data: { cursor, questionEndsAt },
  });
}

// آزمون وقتی تمام است که همهٔ سؤال‌ها رد شده باشند یا مهلت کل به پایان رسیده باشد.
export function isAttemptOver(attempt, now = new Date()) {
  return attempt.cursor >= attempt.total || attempt.expiresAt <= now;
}

// ── تصحیح و ثبت نهایی ─────────────────────────────────────────
// تنها جایی که نمره‌دهی انجام می‌شود؛ چه با ثبت دستی، چه با تمام‌شدن مهلت.
export async function finalizeAttempt(user, attempt) {
  const ids = Array.isArray(attempt.questionIds) ? attempt.questionIds : [];
  const questions = await prisma.examQuestion.findMany({ where: { id: { in: ids } } });
  const answers = attempt.answers && typeof attempt.answers === 'object' ? attempt.answers : {};
  // نمرهٔ کلاسی همان چیزی است که در لحظهٔ شروع در تلاش کپی شده؛ اینجا فقط به نمرهٔ آزمون افزوده می‌شود.
  const result = gradeAttempt(questions, answers, attempt.classScore);

  await prisma.examAttempt.update({
    where: { id: attempt.id },
    data: {
      score: result.score,
      percent: result.percent,
      finalPercent: result.finalPercent,
      passed: result.passed,
      cursor: attempt.total,
      submittedAt: new Date(),
    },
  });

  // آزمونِ بازبینیِ مدیر/ادیتور فقط نمره می‌گیرد؛ گواهی صادر نمی‌شود و فارغ‌التحصیل ثبت نمی‌شود.
  let certificate = null;
  let certificateError = null;
  if (result.passed && !isManager(user)) {
    try {
      // نمرهٔ درج‌شده روی گواهی، نمرهٔ نهایی است؛ ریز نمره هم برای استعلام ذخیره می‌شود.
      certificate = await issueCertificate(user, {
        attemptId: attempt.id,
        percent: result.finalPercent,
        examPercent: result.percent,
        classScore: result.classScore,
      });
    } catch (err) {
      certificateError = err?.message === 'national_id_required'
        ? 'نمرهٔ قبولی ثبت شد، اما تا زمان ثبت کد ملی معتبر، گواهی صادر نمی‌شود.'
        : 'نمرهٔ قبولی ثبت شد، اما صدور گواهی انجام نشد. لطفاً با آموزشگاه تماس بگیرید.';
    }

    if (certificate) {
      // فارغ‌التحصیلی هنرجو با قبولی در آزمون ثبت می‌شود.
      await prisma.user.update({ where: { id: user.id }, data: { graduated: true } });
      try {
        await notifyUsers([user.id], {
          title: 'گواهی‌نامهٔ شما صادر شد',
          body: `کد استعلام گواهی شما ${certificate.serial} است.`,
          href: '/dashboard/exam',
          kind: 'system',
        });
      } catch {
        // اعلان اختیاری است و نباید نتیجهٔ موفق آزمون یا گواهی را مخفی کند.
      }
    }
  }

  return { result, certificate, certificateError };
}
