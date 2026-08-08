import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';
import { OPTION_COUNT } from '@/lib/exam';

// ذخیرهٔ خودکار یک پاسخ. اگر هنرجو مرورگر را ببندد یا اینترنتش قطع شود،
// پاسخ‌های ثبت‌شده باقی می‌مانند و با بازگشت، آزمون از همان‌جا ادامه پیدا می‌کند.
export async function PATCH(request) {
  const user = await getSessionUser();
  if (!user) return Response.json({ ok: false, error: 'ابتدا وارد شوید.' }, { status: 401 });

  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ ok: false, error: 'درخواست نامعتبر است.' }, { status: 400 });
  }

  const attemptId = String(body.attemptId || '');
  const questionId = String(body.questionId || '');
  const choice = body.choice === null ? null : Number(body.choice);

  if (choice !== null && (!Number.isInteger(choice) || choice < 0 || choice >= OPTION_COUNT)) {
    return Response.json({ ok: false, error: 'گزینهٔ نامعتبر است.' }, { status: 400 });
  }

  const attempt = await prisma.examAttempt.findFirst({ where: { id: attemptId, userId: user.id } });
  if (!attempt) return Response.json({ ok: false, error: 'آزمون یافت نشد.' }, { status: 404 });
  if (attempt.submittedAt) return Response.json({ ok: false, error: 'این آزمون قبلاً ثبت شده است.' }, { status: 409 });
  if (attempt.expiresAt <= new Date()) {
    return Response.json({ ok: false, error: 'مهلت آزمون به پایان رسیده است.', expired: true }, { status: 409 });
  }

  const ids = Array.isArray(attempt.questionIds) ? attempt.questionIds : [];
  if (!ids.includes(questionId)) {
    return Response.json({ ok: false, error: 'این سوال در آزمون شما نیست.' }, { status: 400 });
  }

  const answers = { ...(attempt.answers && typeof attempt.answers === 'object' ? attempt.answers : {}) };
  if (choice === null) delete answers[questionId];
  else answers[questionId] = choice;

  await prisma.examAttempt.update({ where: { id: attempt.id }, data: { answers } });
  return Response.json({ ok: true, answered: Object.keys(answers).length });
}
