import { prisma } from '@/lib/prisma';
import { getSessionUser, isManager } from '@/lib/auth';
import { issueCertificate } from '@/lib/certificate';
import { notifyUsers } from '@/lib/notifications';
import { parseScore, isValidGender } from '@/lib/exam';
import { normalizeNationalId, isValidNationalId } from '@/lib/enrollmentData';

function serialize(c) {
  return {
    id: c.id,
    serial: c.serial,
    fullName: c.fullName,
    gender: c.gender,
    nationalId: c.nationalId,
    courseTitle: c.courseTitle,
    branch: c.branch,
    photoUrl: c.photoUrl,
    percent: c.percent,
    revoked: c.revoked,
    issuedAt: c.issuedAt.toISOString(),
    user: c.user || null,
  };
}

export async function GET() {
  const user = await getSessionUser();
  if (!user) return Response.json({ ok: false, error: 'ابتدا وارد شوید.' }, { status: 401 });
  if (!isManager(user)) return Response.json({ ok: false, error: 'دسترسی ندارید.' }, { status: 403 });

  const items = await prisma.certificate.findMany({
    orderBy: { issuedAt: 'desc' },
    take: 500,
    include: { user: { select: { id: true, phone: true, username: true, displayName: true } } },
  });
  return Response.json({ ok: true, items: items.map(serialize) });
}

const str = (v, max) => String(v ?? '').trim().slice(0, max);

// تاریخ صدورِ دستی برای گواهیِ دوره‌های گذشته. ورودی از input[type=date] می‌آید (میلادی)؛
// ساعت ۱۲ ظهرِ تهران گرفته می‌شود تا تبدیل به تاریخ شمسی هیچ‌وقت یک روز جابه‌جا نشود.
function parseIssuedAt(value) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(value || '').trim());
  if (!m) return null;
  const d = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3], 8, 30));
  if (Number.isNaN(d.getTime()) || d > new Date()) return null;
  return d;
}

// صدور دستی گواهی، کاملاً مستقل از آزمون سامانه: هیچ تلاشِ آزمونی ساخته یا مصرف نمی‌شود
// و هیچ مجوز آزمونی خرج نمی‌گردد. خروجی دقیقاً همان گواهیِ پس از آزمون است — همان کد
// استعلام، همان QR و همان فایل PDF.
export async function POST(request) {
  const manager = await getSessionUser();
  if (!manager) return Response.json({ ok: false, error: 'ابتدا وارد شوید.' }, { status: 401 });
  if (!isManager(manager)) return Response.json({ ok: false, error: 'دسترسی ندارید.' }, { status: 403 });

  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ ok: false, error: 'درخواست نامعتبر است.' }, { status: 400 });
  }

  const userId = String(body.userId || '');
  const target = await prisma.user.findUnique({ where: { id: userId } });
  if (!target) return Response.json({ ok: false, error: 'کاربر یافت نشد.' }, { status: 404 });

  // نامِ روی گواهی باید شناسنامه‌ای باشد؛ مدیر می‌تواند آن را جدا از نامِ نمایشیِ پروفایل وارد کند.
  const fullName = str(body.fullName, 120) || target.displayName || '';
  if (fullName.length < 3) {
    return Response.json({ ok: false, error: 'نام و نام خانوادگیِ روی گواهی را وارد کنید.' }, { status: 400 });
  }

  // نمرهٔ نهایی می‌تواند اعشاری باشد (مثل ۸۲٫۵). خالی یعنی گواهی بدون درج نمره.
  const hasPercent = !(body.percent === undefined || body.percent === null || String(body.percent).trim() === '');
  const percent = hasPercent ? parseScore(body.percent, 100) : null;
  if (hasPercent && percent === null) {
    return Response.json({ ok: false, error: 'نمرهٔ نهایی باید عددی بین ۰ تا ۱۰۰ با حداکثر یک رقم اعشار باشد.' }, { status: 400 });
  }

  // «آقای/خانم» روی گواهی درج می‌شود، پس جنسیت باید در لحظهٔ صدور قطعی باشد؛
  // اگر پروفایل هنرجو خالی است، مدیر آن را در همین فرم انتخاب می‌کند.
  const gender = isValidGender(body.gender) ? body.gender : null;
  if (!gender && !isValidGender(target.gender)) {
    return Response.json({ ok: false, error: 'جنسیت هنرجو مشخص نیست؛ «آقا» یا «خانم» را انتخاب کنید.' }, { status: 400 });
  }

  // کد استعلام از روی کد ملی ساخته می‌شود، پس بدون کد ملیِ معتبر صدور ممکن نیست.
  const nationalId = normalizeNationalId(body.nationalId || target.nationalId);
  if (!isValidNationalId(nationalId)) {
    return Response.json({ ok: false, error: 'کد ملی هنرجو معتبر نیست؛ کد ملی ۱۰ رقمی را وارد کنید.' }, { status: 400 });
  }

  // تاریخ خالی یعنی همین امروز؛ تاریخِ نامعتبر یا آینده پذیرفته نمی‌شود.
  const rawDate = str(body.issuedAt, 10);
  const issuedAt = rawDate ? parseIssuedAt(rawDate) : null;
  if (rawDate && !issuedAt) {
    return Response.json({ ok: false, error: 'تاریخ صدور معتبر نیست؛ تاریخ گذشته یا امروز را انتخاب کنید.' }, { status: 400 });
  }

  // عکسِ آپلودشده از مسیر /api/admin/certificates/photo می‌آید؛ فقط نشانیِ داخلیِ رسانه پذیرفته است.
  const photoUrl = str(body.photoUrl, 200);
  if (photoUrl && !/^\/media\/[A-Za-z0-9._-]+$/.test(photoUrl)) {
    return Response.json({ ok: false, error: 'عکس انتخاب‌شده معتبر نیست.' }, { status: 400 });
  }

  const cert = await issueCertificate(target, {
    percent,
    gender,
    nationalId,
    fullName,
    courseTitle: str(body.courseTitle, 120),
    branch: str(body.branch, 120),
    photoUrl,
    issuedAt,
    issuedById: manager.id,
  });

  // جنسیت و کد ملیِ تأییدشده در پروفایل هم ذخیره می‌شود تا صدورهای بعدی دوباره نپرسد.
  // «فارغ‌التحصیل» انتخابِ صریحِ مدیر است، نه اثرِ جانبیِ صدور: این پرچم تقویم کلاس و
  // کلاس آنلاین را از داشبورد هنرجو برمی‌دارد، پس برای هنرجویی که هنوز کلاس دارد نباید زده شود.
  await prisma.user.update({
    where: { id: target.id },
    data: { nationalId, ...(gender ? { gender } : {}), ...(body.markGraduated ? { graduated: true } : {}) },
  });
  await notifyUsers([target.id], {
    title: 'گواهی‌نامهٔ شما صادر شد',
    body: `کد استعلام گواهی شما ${cert.serial} است.`,
    href: '/dashboard/exam',
    kind: 'system',
  });

  return Response.json({ ok: true, item: serialize(cert) });
}
