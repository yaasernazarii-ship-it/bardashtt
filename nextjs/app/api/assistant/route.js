import { getSessionUser } from '@/lib/auth';
import { isAiConfigured, isBookReady, answerFromBook } from '@/lib/assistant';

export async function POST(request) {
  const user = await getSessionUser();
  if (!user) return Response.json({ ok: false, error: 'ابتدا وارد شوید.' }, { status: 401 });

  if (!isAiConfigured()) {
    return Response.json({ ok: false, error: 'دستیار هوشمند هنوز پیکربندی نشده است.' }, { status: 503 });
  }

  const ready = await isBookReady();
  if (!ready) {
    return Response.json({ ok: false, error: 'محتوای کتاب هنوز بارگذاری نشده است.' }, { status: 503 });
  }

  try {
    const body = await request.json();
    const question = String(body.question || '').trim().slice(0, 500);
    if (!question) return Response.json({ ok: false, error: 'پرسش خود را بنویسید.' }, { status: 400 });

    const answer = await answerFromBook(question);
    return Response.json({ ok: true, answer });
  } catch {
    return Response.json({ ok: false, error: 'خطا در پردازش پرسش. کمی بعد دوباره تلاش کنید.' }, { status: 500 });
  }
}
