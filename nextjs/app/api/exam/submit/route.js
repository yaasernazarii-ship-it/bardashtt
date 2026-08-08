import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';
import { gradeAttempt } from '@/lib/exam';
import { issueCertificate } from '@/lib/certificate';
import { notifyUsers } from '@/lib/notifications';

// تصحیح و ثبت نهایی. اگر مهلت تمام شده باشد هم همین مسیر تصحیح می‌کند،
// یعنی پاسخ‌های ذخیره‌شده تا لحظهٔ انقضا از بین نمی‌روند.
export async function POST(request) {
  const user = await getSessionUser();
  if (!user) return Response.json({ ok: false, error: 'ابتدا وارد شوید.' }, { status: 401 });

  let body = {};
  try {
    body = await request.json();
  } catch { /* بدنهٔ خالی مجاز است */ }

  const attemptId = String(body.attemptId || '');
  const attempt = await prisma.examAttempt.findFirst({ where: { id: attemptId, userId: user.id } });
  if (!attempt) return Response.json({ ok: false, error: 'آزمون یافت نشد.' }, { status: 404 });

  if (attempt.submittedAt) {
    return Response.json({
      ok: true,
      result: { score: attempt.score, total: attempt.total, percent: attempt.percent, passed: attempt.passed },
      alreadySubmitted: true,
    });
  }

  const ids = Array.isArray(attempt.questionIds) ? attempt.questionIds : [];
  const questions = await prisma.examQuestion.findMany({ where: { id: { in: ids } } });
  const answers = attempt.answers && typeof attempt.answers === 'object' ? attempt.answers : {};
  const result = gradeAttempt(questions, answers);

  await prisma.examAttempt.update({
    where: { id: attempt.id },
    data: {
      score: result.score,
      percent: result.percent,
      passed: result.passed,
      submittedAt: new Date(),
    },
  });

  let certificate = null;
  if (result.passed) {
    try {
      certificate = await issueCertificate(user, {
        attemptId: attempt.id,
        percent: result.percent,
      });
      // فارغ‌التحصیلی هنرجو با قبولی در آزمون ثبت می‌شود.
      await prisma.user.update({ where: { id: user.id }, data: { graduated: true } });
      await notifyUsers([user.id], {
        title: 'گواهی‌نامهٔ شما صادر شد',
        body: `کد استعلام گواهی شما ${certificate.serial} است.`,
        href: '/dashboard/exam',
        kind: 'system',
      });
    } catch {
      // نمرهٔ آزمون ثبت شده؛ اگر صدور گواهی خطا داد، مدیر می‌تواند دستی صادر کند.
      certificate = null;
    }
  }

  return Response.json({
    ok: true,
    result,
    certificate: certificate ? { serial: certificate.serial, issuedAt: certificate.issuedAt.toISOString() } : null,
  });
}
