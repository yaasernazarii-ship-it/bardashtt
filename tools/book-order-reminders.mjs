// اجرای دوره‌ای (Cron) یادآوریِ سبد رهاشدهٔ کتاب.
// روی سرور با crontab هر ۱۰-۱۵ دقیقه اجرا می‌شود؛ هیچ HTTP endpoint یا سرویس جدیدی لازم ندارد.
// اجرا: cd /var/www/bardasht-nextjs && node tools/book-order-reminders.mjs
import 'dotenv/config';
import { prisma } from '../lib/prisma.js';
import { sendAbandonedCheckoutReminders } from '../lib/abandonedCheckoutSms.js';

async function main() {
  const startedAt = new Date();
  try {
    const summary = await sendAbandonedCheckoutReminders();
    console.log(
      `${startedAt.toISOString()} book-order-reminders: checked=${summary.checked} sent=${summary.sent} failed=${summary.failed} skipped=${summary.skipped}${summary.disabled ? ' (disabled)' : ''}`
    );
  } catch (err) {
    console.error(`${startedAt.toISOString()} book-order-reminders: ERROR`, err?.message || err);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

main();
