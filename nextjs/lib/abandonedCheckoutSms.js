// یادآوری پیامکیِ سبد رهاشدهٔ کتاب (Abandoned Checkout).
// اگر کاربر سفارش را ثبت و وارد پرداخت آنلاین شد ولی تکمیل نکرد، بعد از یک فاصلهٔ زمانیِ
// قابل‌تنظیم از پنل، یک‌بار پیامک یادآوری ارسال می‌شود.
// عمداً خطا را به بالادست پرتاب نمی‌کند تا اجرای دوره‌ای (Cron) هرگز کامل متوقف نشود.
//
// عمداً از siteContent.js (که برای خواندنِ تنظیمات import می‌کند) استفاده نمی‌شود، چون آن فایل از
// alias مسیرِ «@/» بهره می‌برد که فقط توسط کامپایلر Next.js resolve می‌شود؛ این ماژول باید هم از
// داخل اپ Next.js و هم از اسکریپت مستقلِ Cron (با node خام) قابل‌اجرا باشد. مقادیر پیش‌فرض زیر باید
// دقیقاً با تعریفِ گروه «bookOrderReminderSms» در lib/siteContent.js هماهنگ نگه داشته شود.
import { sendTextSms, isTextSmsConfigured } from './sms.js';
import { prisma } from './prisma.js';
import { zibalRequest, isZibalConfigured } from './zibal.js';

const SETTING_DEFAULTS = {
  'bookOrderReminderSms.enabled': 'روشن',
  'bookOrderReminderSms.delayMinutes': '60',
  'bookOrderReminderSms.text':
    '{نام} عزیز، سفارش کتاب «{عنوان}» شما هنوز تکمیل نشده.\nمبلغ: {مبلغ} تومان\nبرای تکمیل خرید کلیک کنید:\n{لینک}\nخانواده برداشت',
};

async function readSetting(key) {
  const row = await prisma.siteContent.findUnique({ where: { key } }).catch(() => null);
  return row ? row.value : SETTING_DEFAULTS[key];
}

const money = (n) => Number(n || 0).toLocaleString('fa-IR');

const PLACEHOLDERS = {
  '{نام}': 'name',
  '{عنوان}': 'title',
  '{تعداد}': 'quantity',
  '{مبلغ}': 'amount',
  '{لینک}': 'link',
};

function fillTemplate(template, vars) {
  let out = String(template || '');
  for (const [token, field] of Object.entries(PLACEHOLDERS)) {
    out = out.split(token).join(vars[field] ?? '');
  }
  return out
    .split('\n')
    .map((line) => line.replace(/[ \t]{2,}/g, ' ').trim())
    .filter((line) => line && !/^[^:：]{1,30}[:：]$/.test(line))
    .join('\n');
}

const DEFAULT_DELAY_MINUTES = 60;
const CLAIM_TIMEOUT_MINUTES = 5; // اگر یک اجرای قبلی وسط کار قطع شد، قفلِ یتیم بعد از این مدت آزاد می‌شود
const MAX_PER_RUN = 100;

/**
 * یک دور از بررسی و ارسال یادآوری‌های سبد رهاشدهٔ کتاب.
 * @returns {Promise<{checked:number, sent:number, failed:number, skipped:number, disabled:boolean}>}
 */
export async function sendAbandonedCheckoutReminders() {
  const summary = { checked: 0, sent: 0, failed: 0, skipped: 0, disabled: false };

  if (!isTextSmsConfigured()) {
    summary.disabled = true;
    return summary;
  }

  const [enabled, delayMinutesRaw, template] = await Promise.all([
    readSetting('bookOrderReminderSms.enabled'),
    readSetting('bookOrderReminderSms.delayMinutes'),
    readSetting('bookOrderReminderSms.text'),
  ]);
  if (String(enabled || '').trim() === 'خاموش') {
    summary.disabled = true;
    return summary;
  }

  const delayMinutes = Number(delayMinutesRaw);
  const effectiveDelay = Number.isFinite(delayMinutes) && delayMinutes > 0 ? delayMinutes : DEFAULT_DELAY_MINUTES;

  const threshold = new Date(Date.now() - effectiveDelay * 60_000);
  const claimStale = new Date(Date.now() - CLAIM_TIMEOUT_MINUTES * 60_000);

  const candidates = await prisma.bookOrder.findMany({
    where: {
      status: 'new',
      gatewayTrackId: { not: null },
      reminderSmsSentAt: null,
      createdAt: { lte: threshold },
      OR: [{ reminderSmsClaimedAt: null }, { reminderSmsClaimedAt: { lt: claimStale } }],
    },
    include: { book: { select: { title: true } } },
    take: MAX_PER_RUN,
  });

  summary.checked = candidates.length;

  for (const order of candidates) {
    // قفل شرطی: فقط اگر رکورد هنوز new و بدون claim معتبر باشد claim می‌شود.
    // اگر بین کوئری بالا و این لحظه، پرداخت کامل شد یا اجرای موازی دیگری claim کرد، count=0 می‌شود.
    const claim = await prisma.bookOrder.updateMany({
      where: {
        id: order.id,
        status: 'new',
        reminderSmsSentAt: null,
        OR: [{ reminderSmsClaimedAt: null }, { reminderSmsClaimedAt: { lt: claimStale } }],
      },
      data: { reminderSmsClaimedAt: new Date() },
    });
    if (claim.count === 0) {
      summary.skipped++;
      continue;
    }

    try {
      // trackId قدیمیِ سفارش ممکن است تا این لحظه نزد زیبال منقضی شده باشد؛ برای اطمینان از سالم‌بودنِ
      // لینکِ داخل پیامک، یک تراکنشِ تازه ساخته و gatewayTrackId سفارش را به آن به‌روزرسانی می‌کنیم
      // (همان الگویِ چک‌اوتِ اول در app/api/books/[slug]/order/route.js). callback پرداخت با همین
      // trackId جدید سفارش را پیدا می‌کند، پس این کار زیرساخت verify/callback را دست‌نخورده نگه می‌دارد.
      if (!isZibalConfigured()) {
        console.error('abandoned checkout sms: zibal not configured, skip', order.id);
        await prisma.bookOrder.updateMany({
          where: { id: order.id, status: 'new', reminderSmsSentAt: null },
          data: { reminderSmsClaimedAt: null },
        });
        summary.failed++;
        continue;
      }

      const gw = await zibalRequest({
        amountToman: order.amount,
        orderId: order.id,
        description: `تکمیل خرید کتاب ${order.book?.title || ''}`,
        mobile: order.phone,
      });
      if (!gw.ok) {
        console.error('abandoned checkout sms: zibal request failed', order.id, gw.error);
        await prisma.bookOrder.updateMany({
          where: { id: order.id, status: 'new', reminderSmsSentAt: null },
          data: { reminderSmsClaimedAt: null },
        });
        summary.failed++;
        continue;
      }
      await prisma.bookOrder.update({
        where: { id: order.id },
        data: { gatewayTrackId: gw.trackId },
      });

      const text = fillTemplate(template, {
        name: String(order.name || '').trim(),
        title: String(order.book?.title || '').trim(),
        quantity: order.quantity ? money(order.quantity) : '',
        amount: money(order.amount),
        link: gw.startUrl,
      });

      if (!text) {
        // قالب خالی است؛ قفل را آزاد کن تا اگر ادمین بعداً متن را پر کرد دوباره تلاش شود.
        await prisma.bookOrder.updateMany({
          where: { id: order.id, status: 'new', reminderSmsSentAt: null },
          data: { reminderSmsClaimedAt: null },
        });
        summary.skipped++;
        continue;
      }

      const result = await sendTextSms(order.phone, text);
      if (result.delivered) {
        await prisma.bookOrder.update({
          where: { id: order.id },
          data: { reminderSmsSentAt: new Date() },
        });
        summary.sent++;
      } else {
        console.error('abandoned checkout sms failed:', order.id, result.reason, result.detail || '');
        // ناموفق: قفل را آزاد کن تا دور بعدی Cron دوباره تلاش کند.
        await prisma.bookOrder.updateMany({
          where: { id: order.id, status: 'new', reminderSmsSentAt: null },
          data: { reminderSmsClaimedAt: null },
        });
        summary.failed++;
      }
    } catch (err) {
      console.error('sendAbandonedCheckoutReminders item failed:', order.id, err?.message || err);
      await prisma.bookOrder
        .updateMany({
          where: { id: order.id, status: 'new', reminderSmsSentAt: null },
          data: { reminderSmsClaimedAt: null },
        })
        .catch(() => {});
      summary.failed++;
    }
  }

  return summary;
}
