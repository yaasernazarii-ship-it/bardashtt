import { prisma } from '@/lib/prisma';
import { buildSerial, jalaliYear } from '@/lib/exam';

// صدور گواهی برای یک کاربر. اطلاعات هویتی در لحظهٔ صدور کپی می‌شود تا تغییر بعدیِ پروفایل،
// گواهیِ صادرشده را عوض نکند. اگر برای همان تلاشِ آزمون قبلاً گواهی صادر شده باشد، همان برگردانده می‌شود.
export async function issueCertificate(user, { attemptId = null, percent = null, issuedById = null } = {}) {
  if (attemptId) {
    const existing = await prisma.certificate.findUnique({ where: { attemptId } });
    if (existing) return existing;
  }

  const year = jalaliYear();
  const prefix = buildSerial(year, 0).slice(0, -4); // مثل TB-1404-

  // شمارهٔ سریال باید یکتا باشد؛ اگر هم‌زمان دو صدور انجام شود، شماره‌ی بعدی امتحان می‌شود.
  for (let attempt = 0; attempt < 20; attempt++) {
    const count = await prisma.certificate.count({ where: { serial: { startsWith: prefix } } });
    const serial = buildSerial(year, count + 1 + attempt);
    try {
      return await prisma.certificate.create({
        data: {
          serial,
          userId: user.id,
          attemptId,
          fullName: user.displayName || user.username || user.phone,
          gender: user.gender || null,
          nationalId: user.nationalId || null,
          courseTitle: user.courseTitle || null,
          branch: user.branch || null,
          percent,
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
