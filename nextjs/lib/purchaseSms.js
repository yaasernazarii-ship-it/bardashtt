// ارسال پیامک تأیید خرید به خودِ خریدار.
// متنِ پیامک از «متن‌های سایت» خوانده می‌شود تا مدیر بتواند بدون تغییر کد ویرایشش کند.
// عمداً خطا را به بالادست پرتاب نمی‌کند تا مسیر پرداخت هرگز مختل نشود.
import { sendTextSms, isTextSmsConfigured } from './sms';
import { loadContent } from './siteContent';
import { normalizePhone } from './auth';

const money = (n) => Number(n || 0).toLocaleString('fa-IR');

const PLACEHOLDERS = {
  '{نام}': 'name',
  '{عنوان}': 'title',
  '{تعداد}': 'quantity',
  '{مبلغ}': 'amount',
  '{کدپیگیری}': 'refId',
};

function fillTemplate(template, vars) {
  let out = String(template || '');
  for (const [token, field] of Object.entries(PLACEHOLDERS)) {
    out = out.split(token).join(vars[field] ?? '');
  }
  // اگر مقدارِ یک جای‌نگهدار خالی بود، خطِ «برچسب:» بی‌مقدار نباید در پیامک بماند.
  return out
    .split('\n')
    .map((line) => line.replace(/[ \t]{2,}/g, ' ').trim())
    .filter((line) => line && !/^[^:：]{1,30}[:：]$/.test(line))
    .join('\n');
}

/**
 * @param {'book'|'course'} kind نوع خرید؛ متنِ متناظر از پنل خوانده می‌شود.
 */
export async function sendPurchaseSms({ kind, phone, name, title, amount, quantity, refId }) {
  try {
    if (!isTextSmsConfigured()) return { delivered: false, reason: 'not_configured' };

    const mobile = normalizePhone(phone);
    if (!mobile) return { delivered: false, reason: 'invalid_phone' };

    const t = await loadContent();
    if (String(t('purchaseSms.enabled') || '').trim() === 'خاموش') {
      return { delivered: false, reason: 'disabled' };
    }

    const text = fillTemplate(t(kind === 'book' ? 'purchaseSms.book' : 'purchaseSms.course'), {
      name: String(name || '').trim(),
      title: String(title || '').trim(),
      quantity: quantity ? money(quantity) : '',
      amount: money(amount),
      refId: refId ? String(refId) : '',
    });
    if (!text) return { delivered: false, reason: 'empty_template' };

    const result = await sendTextSms(mobile, text);
    if (!result.delivered) {
      console.error('purchase sms failed:', result.reason, result.detail || '');
    }
    return result;
  } catch (err) {
    console.error('sendPurchaseSms failed:', err?.message || err);
    return { delivered: false, reason: 'error' };
  }
}
