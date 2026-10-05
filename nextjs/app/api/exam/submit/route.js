import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';
import { finalizeAttempt } from '@/lib/examRun';

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
      result: {
        score: attempt.score,
        total: attempt.total,
        percent: attempt.percent,
        classScore: attempt.classScore,
        finalPercent: attempt.finalPercent,
        passed: attempt.passed,
      },
      alreadySubmitted: true,
    });
  }

  const { result, certificate, certificateError } = await finalizeAttempt(user, attempt);

  return Response.json({
    ok: true,
    result,
    certificate: certificate ? { serial: certificate.serial, issuedAt: certificate.issuedAt.toISOString() } : null,
    certificateError,
  });
}
