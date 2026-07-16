import { prisma } from '@/lib/prisma';
import { normalizePhone } from '@/lib/auth';
import { courseByKey, validateAnswers } from '@/lib/enrollment';

const ACTOR_TYPES = ['بازیگر احساسی', 'بازیگر بیانی', 'بازیگر فیزیکی', 'بازیگر تحلیلی'];

function validVideoUrl(url) {
  try {
    const u = new URL(url);
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const course = courseByKey(String(body.courseKey || ''));
    const fullName = String(body.fullName || '').trim().slice(0, 80);
    const phone = normalizePhone(body.phone);
    const answers = validateAnswers(body.answers);
    const videoUrl = String(body.videoUrl || '').trim();
    const actorType = ACTOR_TYPES.includes(body.actorType) ? body.actorType : null;
    const aiAnalysis = String(body.aiAnalysis || '').trim().slice(0, 600) || null;

    if (!course) return Response.json({ ok: false, error: 'دوره را انتخاب کنید.' }, { status: 400 });
    if (!fullName) return Response.json({ ok: false, error: 'نام و نام خانوادگی را وارد کنید.' }, { status: 400 });
    if (!phone) return Response.json({ ok: false, error: 'شماره موبایل معتبر نیست.' }, { status: 400 });
    if (!answers) return Response.json({ ok: false, error: 'به همه سؤال‌های تست پاسخ دهید.' }, { status: 400 });
    if (!validVideoUrl(videoUrl)) return Response.json({ ok: false, error: 'لینک ویدیوی معتبر (http/https) وارد کنید.' }, { status: 400 });

    // اگر همین فرد برای همین دوره ثبت‌نام باز (در انتظار) دارد، تکراری نساز.
    const existing = await prisma.enrollment.findFirst({
      where: { phone, courseKey: course.key, status: 'submitted' },
    });
    if (existing) {
      return Response.json({ ok: false, error: 'برای این دوره یک درخواست در انتظار بررسی دارید.' }, { status: 409 });
    }

    await prisma.enrollment.create({
      data: {
        courseKey: course.key,
        courseTitle: course.title,
        fullName,
        phone,
        answers,
        actorType,
        aiAnalysis,
        videoUrl: videoUrl.slice(0, 500),
        status: 'submitted',
      },
    });

    return Response.json({ ok: true });
  } catch {
    return Response.json({ ok: false, error: 'ثبت درخواست انجام نشد. دوباره تلاش کنید.' }, { status: 500 });
  }
}
