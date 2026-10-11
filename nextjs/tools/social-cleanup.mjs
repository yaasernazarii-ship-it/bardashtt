// اجرای دوره‌ای (Cron) پاک‌سازیِ قطعی استوری‌های منقضیِ برداشتگرام.
// روی سرور با crontab هر ساعت اجرا می‌شود؛ رکورد دیتابیس و فایلِ آپلودی هر دو واقعاً حذف می‌شوند
// (نه فقط پنهان) تا به حجم دیسک سرور آسیب نرسد. هیچ HTTP endpoint یا سرویس جدیدی لازم ندارد.
// اجرا: cd /var/www/bardasht-nextjs && node tools/social-cleanup.mjs
import 'dotenv/config';
import { prisma } from '../lib/prisma.js';
import { cleanupExpiredStories } from '../lib/social.js';

async function main() {
  const startedAt = new Date();
  let total = 0;
  try {
    // هر فراخوانی حداکثر یک دسته (۲۰۰ رکورد) پاک می‌کند؛ در حلقه ادامه می‌دهیم
    // تا حتی اگر عقب افتاده باشد، همان اجرا کاملاً تمیزش کند.
    let removed;
    do {
      removed = await cleanupExpiredStories({ force: true });
      total += removed;
    } while (removed > 0);
    console.log(`${startedAt.toISOString()} social-cleanup: removed=${total}`);
  } catch (err) {
    console.error(`${startedAt.toISOString()} social-cleanup: ERROR`, err?.message || err);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

main();
