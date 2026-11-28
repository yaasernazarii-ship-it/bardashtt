// پاک‌سازی ثبت‌نام‌های ردشده‌ای که از قبل در دیتابیس مانده‌اند.
// هر رکورد اول به‌صورت گزارش + PDF در «بله» آرشیو می‌شود و تنها در صورت موفقیت حذف می‌شود.
//
// اجرا از ریشهٔ پروژه روی سرور (مسیر فونت‌های PDF به cwd وابسته است):
//   node --env-file=.env scripts/purge-rejected-enrollments.mjs            # فقط فهرست می‌کند
//   node --env-file=.env scripts/purge-rejected-enrollments.mjs --confirm  # آرشیو و حذف می‌کند
import { PrismaClient } from '@prisma/client';
import { archiveRejectedEnrollment } from '../lib/enrollmentNotify.js';
import { removeLocalUploads } from '../lib/uploadCleanup.js';

const confirm = process.argv.includes('--confirm');
const prisma = new PrismaClient();

const rows = await prisma.enrollment.findMany({ where: { status: 'rejected' } });
console.log(`ثبت‌نام ردشده: ${rows.length}`);

if (!rows.length) {
  await prisma.$disconnect();
  process.exit(0);
}

for (const row of rows) {
  console.log(`- ${row.id} | ${row.fullName} | ${row.phone}`);
}

if (!confirm) {
  console.log('\nبرای آرشیو در بله و حذف دائمی، دوباره با --confirm اجرا کنید.');
  await prisma.$disconnect();
  process.exit(0);
}

let purged = 0;
for (const row of rows) {
  try {
    await archiveRejectedEnrollment(row, { rejectedBy: 'پاک‌سازی سوابق ردشده' });
  } catch (err) {
    console.error(`✕ آرشیو ${row.id} انجام نشد؛ حذف نشد: ${err?.message || err}`);
    continue;
  }
  await prisma.enrollment.delete({ where: { id: row.id } });
  await removeLocalUploads([row.videoUrl]);
  purged += 1;
  console.log(`✓ آرشیو و حذف شد: ${row.id}`);
}

console.log(`\nحذف‌شده: ${purged} از ${rows.length}`);
await prisma.$disconnect();
process.exit(purged === rows.length ? 0 : 1);
