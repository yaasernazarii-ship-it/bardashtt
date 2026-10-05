import { validateAnswers, analyzeActorType } from '@/lib/enrollment';
import { isLocked, recordFailure } from '@/lib/rateLimit';

export async function POST(request) {
  try {
    // محدودسازی نرخ: هر IP حداکثر ۵ تحلیل در ۱۰ دقیقه (جلوگیری از سوءاستفاده از API هوش مصنوعی)
    const ip = String(request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '').split(',')[0].trim().slice(0, 64) || 'unknown';
    const rateKey = `analyze:${ip}`;
    if (await isLocked(rateKey, { max: 5 })) {
      return Response.json({ ok: false, error: 'تعداد درخواست‌های شما زیاد بوده. کمی بعد دوباره تلاش کنید.' }, { status: 429 });
    }

    const body = await request.json();
    const fullName = String(body.fullName || '').trim().slice(0, 80);
    const answers = validateAnswers(body.answers);

    if (!fullName) return Response.json({ ok: false, error: 'نام را وارد کنید.' }, { status: 400 });
    if (!answers) return Response.json({ ok: false, error: 'به همه سؤال‌ها پاسخ دهید.' }, { status: 400 });

    const result = await analyzeActorType(fullName, answers);
    await recordFailure(rateKey, { windowMs: 10 * 60 * 1000 });
    return Response.json({ ok: true, ...result });
  } catch {
    return Response.json({ ok: false, error: 'تحلیل انجام نشد. دوباره تلاش کنید.' }, { status: 500 });
  }
}
