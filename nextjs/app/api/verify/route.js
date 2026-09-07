import { prisma } from '@/lib/prisma';
import { SCHOOL_NAME, honorific, normalizeSerial } from '@/lib/exam';
import { isLocked, recordFailure } from '@/lib/rateLimit';

// کد استعلام از روی کد ملی ساخته می‌شود و قابل حدس‌زدن است. برای اینکه کسی نتواند با
// پیمایشِ خودکارِ کدهای ملی فهرست فارغ‌التحصیلان را جمع کند، فقط استعلام‌های «پیدا نشد»
// شمرده می‌شوند؛ کسی که کد واقعیِ روی گواهی را دارد هرگز به این سقف نمی‌خورد.
const MISS_LIMIT = { max: 20, windowMs: 10 * 60 * 1000 };

function missKey(request) {
  const fwd = request.headers.get('x-forwarded-for') || '';
  const ip = fwd.split(',')[0].trim() || request.headers.get('x-real-ip') || 'unknown';
  return `verifyMiss:${ip}`;
}

// استعلام عمومی گواهی‌نامه با کد سریال. فقط اطلاعاتی برمی‌گردد که روی خودِ گواهی چاپ شده،
// پس چیزی فراتر از آنچه دارندهٔ گواهی در دست دارد افشا نمی‌شود.
export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ ok: false, error: 'درخواست نامعتبر است.' }, { status: 400 });
  }

  const rateKey = missKey(request);
  if (await isLocked(rateKey, MISS_LIMIT)) {
    return Response.json(
      { ok: false, error: 'تعداد استعلام‌های ناموفق زیاد بود. چند دقیقه دیگر دوباره تلاش کنید.' },
      { status: 429 },
    );
  }

  const serial = normalizeSerial(body.serial);
  if (!serial || serial.length < 6 || serial.length > 40) {
    await recordFailure(rateKey, MISS_LIMIT);
    return Response.json({ ok: false, error: 'کد گواهی‌نامه معتبر نیست.' }, { status: 400 });
  }

  const cert = await prisma.certificate.findUnique({ where: { serial } });
  if (!cert) {
    await recordFailure(rateKey, MISS_LIMIT);
    return Response.json({ ok: false, found: false, error: 'گواهی‌نامه‌ای با این کد ثبت نشده است.' }, { status: 404 });
  }

  return Response.json({
    ok: true,
    found: true,
    certificate: {
      serial: cert.serial,
      holder: `${honorific(cert.gender)} ${cert.fullName}`.trim(),
      courseTitle: cert.courseTitle,
      branch: cert.branch,
      // فقط نمرهٔ نهایی؛ همان‌طور که روی خودِ گواهی درج شده، ریز نمره افشا نمی‌شود.
      percent: cert.percent,
      issuedAt: cert.issuedAt.toISOString(),
      revoked: cert.revoked,
      school: SCHOOL_NAME,
    },
  });
}
