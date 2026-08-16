import { prisma } from '@/lib/prisma';
import { buildSerial } from '@/lib/exam';
import { normalizeNationalId, isValidNationalId } from '@/lib/enrollmentData';

// صدور گواهی برای یک کاربر. اطلاعات هویتی در لحظهٔ صدور کپی می‌شود تا تغییر بعدیِ پروفایل،
// گواهیِ صادرشده را عوض نکند. اگر برای همان تلاشِ آزمون قبلاً گواهی صادر شده باشد، همان برگردانده می‌شود.
export async function issueCertificate(user, {
  attemptId = null,
  percent = null,
  examPercent = null,
  classScore = null,
  issuedById = null,
  // جنسیتِ انتخاب‌شده در لحظهٔ صدور؛ مبنای درج «آقای/خانم» روی گواهی است و بر
  // مقدار پروفایل مقدم است، چون پروفایلِ هنرجویان قدیمی اغلب ناقص ثبت شده.
  gender = null,
  // کد ملیِ تأییدشده در لحظهٔ صدور؛ کد استعلام از روی آن ساخته می‌شود.
  nationalId = null,
} = {}) {
  if (attemptId) {
    const existing = await prisma.certificate.findUnique({ where: { attemptId } });
    if (existing) return existing;
  }

  const code = normalizeNationalId(nationalId || user.nationalId);
  if (!isValidNationalId(code)) throw new Error('national_id_required');

  // کد استعلام باید یکتا باشد؛ برای گواهی دوم همان شخص، شمارهٔ ترتیبی بالا می‌رود.
  for (let seq = 1; seq <= 20; seq++) {
    const serial = buildSerial(code, seq);
    try {
      return await prisma.certificate.create({
        data: {
          serial,
          userId: user.id,
          attemptId,
          fullName: user.displayName || user.username || user.phone,
          gender: gender || user.gender || null,
          nationalId: code,
          courseTitle: user.courseTitle || null,
          branch: user.branch || null,
          percent,
          examPercent,
          classScore,
          issuedById,
        },
      });
    } catch (err) {
      // فقط برخورد شمارهٔ تکراری قابل تکرار است؛ بقیهٔ خطاها باید بالا بروند.
      if (err?.code !== 'P2002') throw err;
    }
  }
  throw new Error('serial_generation_failed');
}
