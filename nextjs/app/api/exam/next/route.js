import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';
import { isAttemptOver, syncCursor } from '@/lib/examRun';

// رفتن به سؤال بعدی. این حرکت یک‌طرفه است: مکان‌نما فقط جلو می‌رود و
// سؤالِ رهاشده دیگر باز نمی‌شود. مهلت سؤال بعدی از همین لحظه شروع می‌شود.
export async function POST(request) {
  const user = await getSessionUser();
  if (!user) return Response.json({ ok: false, error: 'ابتدا وارد شوید.' }, { status: 401 });

  let body = {};
  try {
    body = await request.json();
  } catch { /* بدنهٔ خالی مجاز است */ }

  const attemptId = String(body.attemptId || '');
  const found = await prisma.examAttempt.findFirst({ where: { id: attemptId, userId: user.id } });
  if (!found) return Response.json({ ok: false, error: 'آزمون یافت نشد.' }, { status: 404 });
  if (found.submittedAt) return Response.json({ ok: true, finished: true });

  const now = new Date();
  const attempt = await syncCursor(found, now);
  if (isAttemptOver(attempt, now)) return Response.json({ ok: true, finished: true });

  // اگر مرورگر برای سؤالی که خودش از قبل رد شده «بعدی» بفرستد، دوباره جلو نمی‌رویم.
  const from = Number(body.cursor);
  if (Number.isInteger(from) && from !== attempt.cursor) {
    return Response.json({ ok: true, cursor: attempt.cursor, finished: false });
  }

  const cursor = attempt.cursor + 1;
  if (cursor >= attempt.total) {
    await prisma.examAttempt.update({ where: { id: attempt.id }, data: { cursor: attempt.total } });
    return Response.json({ ok: true, finished: true });
  }

  await prisma.examAttempt.update({
    where: { id: attempt.id },
    data: { cursor, questionEndsAt: new Date(now.getTime() + attempt.perQuestionSec * 1000) },
  });

  return Response.json({ ok: true, cursor, finished: false });
}
