import { validateAnswers, analyzeActorType } from '@/lib/enrollment';

export async function POST(request) {
  try {
    const body = await request.json();
    const fullName = String(body.fullName || '').trim().slice(0, 80);
    const answers = validateAnswers(body.answers);

    if (!fullName) return Response.json({ ok: false, error: 'نام را وارد کنید.' }, { status: 400 });
    if (!answers) return Response.json({ ok: false, error: 'به همه سؤال‌ها پاسخ دهید.' }, { status: 400 });

    const result = await analyzeActorType(fullName, answers);
    return Response.json({ ok: true, ...result });
  } catch {
    return Response.json({ ok: false, error: 'تحلیل انجام نشد. دوباره تلاش کنید.' }, { status: 500 });
  }
}
