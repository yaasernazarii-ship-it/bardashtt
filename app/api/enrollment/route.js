import { prisma } from '@/lib/prisma';
import { normalizePhone } from '@/lib/auth';
import { courseByKey, ENROLL_COURSE_KEY, validateAnswers, ACTOR_TYPES, VIDEO_FORM_URL, isValidNationalId, normalizeNationalId } from '@/lib/enrollment';
import { notifyEnrollment } from '@/lib/enrollmentNotify';

export async function POST(request) {
  try {
    const body = await request.json();
    // دوره از ورودی خوانده نمی‌شود؛ ثبت‌نام عمومی همیشه روی دورهٔ مقدماتی انجام می‌شود.
    const course = courseByKey(ENROLL_COURSE_KEY);
    const fullName = String(body.fullName || '').trim().slice(0, 80);
    const phone = normalizePhone(body.phone);
    const answers = validateAnswers(body.answers);
    const videoConfirmed = body.videoConfirmed === true;
    const nationalId = normalizeNationalId(body.nationalId);
    const actorType = ACTOR_TYPES.includes(body.actorType) ? body.actorType : null;
    const aiAnalysis = String(body.aiAnalysis || '').trim().slice(0, 600) || null;

    if (!fullName) return Response.json({ ok: false, error: 'نام و نام خانوادگی را وارد کنید.' }, { status: 400 });
    if (!phone) return Response.json({ ok: false, error: 'شماره موبایل معتبر نیست.' }, { status: 400 });
    if (!answers) return Response.json({ ok: false, error: 'به همه سؤال‌های تست پاسخ دهید.' }, { status: 400 });
    if (!videoConfirmed) return Response.json({ ok: false, error: 'ابتدا ویدیوی خود را از طریق فرم ارسال و سپس تأیید کنید.' }, { status: 400 });
    if (!isValidNationalId(nationalId)) return Response.json({ ok: false, error: 'کد ملی معتبر نیست. کد ملی ۱۰ رقمی خود را وارد کنید.' }, { status: 400 });

    // اگر همین فرد ثبت‌نام باز (در انتظار) دارد، تکراری نساز.
    const existing = await prisma.enrollment.findFirst({
      where: { phone, courseKey: course.key, status: 'submitted' },
    });
    if (existing) {
      return Response.json({ ok: false, error: 'یک درخواست ثبت‌نام در انتظار بررسی دارید.' }, { status: 409 });
    }

    const enrollment = await prisma.enrollment.create({
      data: {
        courseKey: course.key,
        courseTitle: course.title,
        fullName,
        phone,
        answers,
        actorType,
        aiAnalysis,
        videoUrl: VIDEO_FORM_URL,
        nationalId,
        status: 'submitted',
      },
    });

    // ارسال آنی PDF به «بله» بدون بلاک‌کردن پاسخ (خطا مسیر ثبت‌نام را مختل نمی‌کند).
    notifyEnrollment(enrollment).catch(() => {});

    return Response.json({ ok: true });
  } catch {
    return Response.json({ ok: false, error: 'ثبت درخواست انجام نشد. دوباره تلاش کنید.' }, { status: 500 });
  }
}
