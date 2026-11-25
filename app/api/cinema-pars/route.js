import { prisma } from '@/lib/prisma';
import { sendMessage, isBaleConfigured } from '@/lib/bale';
import { isLocked, recordFailure } from '@/lib/rateLimit';
import { loadContent, splitLines } from '@/lib/siteContent';

// فرم «درخواست همکاری» صفحهٔ برداشت سینمای پارس.
// درخواست در همان صندوق گفت‌وگوی پشتیبانیِ پنل ثبت می‌شود تا مدیر بدون زیرساخت تازه‌ای آن را ببیند،
// و همان اعلان بله هم ارسال می‌شود. هیچ جای دیگری از دیتابیس دست نمی‌خورد.

// گزینه‌های موضوع از پنل خوانده می‌شوند تا اعتبارسنجی با فهرستی که مدیر ویرایش می‌کند یکی بماند.
const FALLBACK_SUBJECTS = [
  'تولید فیلم و سریال',
  'طراحی و مشاوره',
  'خدمات رسانه‌ای',
  'فعالیت‌های فرهنگی و هنری',
  'سایر',
];

const ADMIN_URL = 'https://www.bardashtt.com/dashboard/admin/support';

function clean(value, max) {
  return String(value ?? '').replace(/\u0000/g, '').replace(/\r\n/g, '\n').trim().slice(0, max);
}

export async function POST(request) {
  try {
    const ip = String(request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '')
      .split(',')[0].trim().slice(0, 64) || 'unknown';
    const rateKey = `cinemaPars:${ip}`;
    if (await isLocked(rateKey, { max: 10 })) {
      return Response.json({ ok: false, error: 'تعداد درخواست‌های ارسالی زیاد بود. کمی بعد دوباره تلاش کنید.' }, { status: 429 });
    }

    let data = {};
    try { data = await request.json(); } catch { /* بدنهٔ نامعتبر */ }

    const name = clean(data.name, 80);
    const phone = clean(data.phone, 30).replace(/[^\d+]/g, '');
    const email = clean(data.email, 120);
    const t = await loadContent();
    const subjects = splitLines(t('cp.form.subjects')).length ? splitLines(t('cp.form.subjects')) : FALLBACK_SUBJECTS;
    const requestedSubject = clean(data.subject, 80);
    const subject = subjects.includes(requestedSubject) ? requestedSubject : (subjects[subjects.length - 1] || 'سایر');
    const message = clean(data.message, 2000);

    if (name.length < 3) return Response.json({ ok: false, error: 'نام و نام خانوادگی را کامل وارد کنید.' }, { status: 400 });
    if (!/^0\d{10}$/.test(phone) && !/^\+?\d{10,15}$/.test(phone)) {
      return Response.json({ ok: false, error: 'شمارهٔ تماس معتبر نیست.' }, { status: 400 });
    }
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
      return Response.json({ ok: false, error: 'نشانی ایمیل معتبر نیست.' }, { status: 400 });
    }
    if (message.length < 10) return Response.json({ ok: false, error: 'شرح درخواست را کامل‌تر بنویسید.' }, { status: 400 });

    await recordFailure(rateKey, { windowMs: 10 * 60 * 1000 });

    const body = [
      'درخواست همکاری — برداشت سینمای پارس',
      `موضوع: ${subject}`,
      email ? `ایمیل: ${email}` : null,
      '',
      message,
    ].filter((line) => line !== null).join('\n');

    const conversation = await prisma.supportConversation.create({
      data: { visitorName: name, visitorPhone: phone || null },
    });
    await prisma.supportMessage.create({
      data: { conversationId: conversation.id, role: 'visitor', body },
    });
    await prisma.supportConversation.update({
      where: { id: conversation.id },
      data: { lastMessageAt: new Date(), adminUnread: { increment: 1 }, status: 'open' },
    });

    if (isBaleConfigured()) {
      const ping = [
        '🎬 درخواست همکاری تازه — برداشت سینمای پارس',
        `نام: ${name}`,
        phone ? `موبایل: ${phone}` : null,
        email ? `ایمیل: ${email}` : null,
        `موضوع: ${subject}`,
        `توضیح: ${message.slice(0, 600)}`,
        `پاسخ از پنل: ${ADMIN_URL}`,
      ].filter(Boolean).join('\n');
      sendMessage(ping).catch(() => {});
    }

    return Response.json({ ok: true });
  } catch {
    return Response.json({ ok: false, error: 'ثبت درخواست انجام نشد. دوباره تلاش کنید.' }, { status: 500 });
  }
}
