import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';
import { OPTION_COUNT } from '@/lib/exam';
import { isAttemptOver, syncCursor } from '@/lib/examRun';

// ثبت پاسخِ سؤال جاری. فقط سؤالی که هنرجو همین حالا روی آن است پذیرفته می‌شود؛
// انتخاب گزینه قطعی است: پس از ثبت، نه قابل تغییر است و نه قابل حذف.
// با گذشتن مهلتِ آن سؤال هم دیگر هیچ تغییری روی پاسخش ممکن نیست.
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
  const choice = Number(body.choice);

  if (!Number.isInteger(choice) || choice < 0 || choice >= OPTION_COUNT) {
    return Response.json({ ok: false, error: 'گزینهٔ نامعتبر است.' }, { status: 400 });
  }

  const found = await prisma.examAttempt.findFirst({ where: { id: attemptId, userId: user.id } });
  if (!found) return Response.json({ ok: false, error: 'آزمون یافت نشد.' }, { status: 404 });
  if (found.submittedAt) return Response.json({ ok: false, error: 'این آزمون قبلاً ثبت شده است.' }, { status: 409 });

  const now = new Date();
  const attempt = await syncCursor(found, now);
  if (isAttemptOver(attempt, now)) {
    return Response.json({ ok: false, error: 'مهلت آزمون به پایان رسیده است.', expired: true }, { status: 409 });
  }

  const ids = Array.isArray(attempt.questionIds) ? attempt.questionIds : [];
  if (ids[attempt.cursor] !== questionId) {
    // یا مهلت این سؤال گذشته و رد شده، یا هنوز نوبتش نرسیده؛ در هر دو حالت پاسخ پذیرفته نیست.
    return Response.json({
      ok: false,
      error: 'مهلت این سؤال تمام شده است و بازگشت به آن ممکن نیست.',
      moved: true,
      cursor: attempt.cursor,
    }, { status: 409 });
  }

  const answers = { ...(attempt.answers && typeof attempt.answers === 'object' ? attempt.answers : {}) };

  // گزینهٔ انتخاب‌شده قفل است؛ درخواست دوم برای همین سؤال پذیرفته نمی‌شود.
  if (answers[questionId] !== undefined) {
    return Response.json({
      ok: false,
      error: 'پاسخ این سؤال ثبت شده است و تغییر آن ممکن نیست.',
      locked: true,
      choice: answers[questionId],
    }, { status: 409 });
  }

  answers[questionId] = choice;

  await prisma.examAttempt.update({ where: { id: attempt.id }, data: { answers } });
  return Response.json({ ok: true, answered: Object.keys(answers).length, choice });
}
